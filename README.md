# Stockd — Reservation System

> Production-grade multi-warehouse inventory reservation with race condition prevention, geo-aware routing, and a live concurrency demo.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169e1?logo=postgresql)](https://neon.tech)
[![Redis](https://img.shields.io/badge/Redis-Upstash-dc382d?logo=redis)](https://upstash.com)
[![Deployed](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

**🌐 Live Demo:** [stockd-reservation-system.vercel.app](https://stockd-reservation-system.vercel.app)
**▶️ Video Walkthrough:** [Watch on YouTube](https://youtube.com/your-video-link)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript strict) |
| Database | PostgreSQL via Neon + Prisma ORM |
| Cache / Idempotency | Upstash Redis |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Data Fetching | TanStack Query (auto-refresh) |
| Validation | Zod |
| Deployment | Vercel (app + cron) |

---

## Running Locally

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd stockd
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# Neon (or any hosted Postgres — not SQLite, not local)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Upstash Redis (for idempotency key storage)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Public base URL (used for internal API calls)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Secret for the cron endpoint — any random string
CRON_SECRET="your-cron-secret"
```

> **Getting free credentials:**
> - Postgres: [neon.tech](https://neon.tech) → new project → copy the connection string
> - Redis: [upstash.com](https://upstash.com) → new Redis database → copy REST URL + token

### 3. Migrate & Seed

```bash
# Push the Prisma schema to your database
npx prisma db push

# Seed: 5 warehouses, 25 products, 125 inventory records
npm run db:seed
```

### 4. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available npm Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema changes (no migration file)
npm run db:migrate   # Apply migration files (production)
npm run db:seed      # Seed database
```

---

## API Reference

| Method | Path | Behaviour |
|--------|------|-----------|
| `GET` | `/api/products` | List all products with available stock per warehouse |
| `GET` | `/api/warehouses` | List all warehouses |
| `POST` | `/api/reservations` | Reserve units — returns `409` if insufficient stock |
| `GET` | `/api/reservations/:id` | Fetch a reservation (applies lazy expiry on read) |
| `POST` | `/api/reservations/:id/confirm` | Confirm reservation — returns `410` if expired |
| `POST` | `/api/reservations/:id/release` | Release reservation early (user cancelled) |
| `GET` | `/api/cron/expire` | Background cleanup (called by Vercel Cron) |

All write endpoints accept and return `application/json`. The reserve and confirm endpoints additionally support an `Idempotency-Key` request header (see [Idempotency](#idempotency) below).

---

## How Concurrency Is Handled

The central challenge: if two users simultaneously try to reserve the last unit of a SKU, exactly one must succeed and the other must receive a `409`.

### Mechanism: `SELECT FOR UPDATE` inside a Serializable Transaction

```sql
-- 1. Lock the inventory row — all other transactions block here
SELECT id, "totalStock", "reservedStock"
FROM inventory
WHERE "productId" = $productId AND "warehouseId" = $warehouseId
FOR UPDATE;

-- 2. Compute available stock
--    available = totalStock - reservedStock

-- 3. Reject if insufficient
--    → throw INSUFFICIENT_STOCK → HTTP 409

-- 4. Atomically increment reservedStock
UPDATE inventory
SET "reservedStock" = "reservedStock" + $quantity
WHERE "productId" = $productId AND "warehouseId" = $warehouseId;

-- 5. Create the reservation record
INSERT INTO reservations (...) VALUES (...);
```

This runs inside `prisma.$transaction({ isolationLevel: Serializable })`. PostgreSQL's row-level lock (`FOR UPDATE`) causes the second concurrent request to **block** until the first transaction commits. Once released, the second reads the updated `reservedStock`, sees no stock remaining, and returns `409` — **exactly-once-succeeds** semantics with no application-level locking required.

### Reservation Lifecycle

```
POST /api/reservations
  └─ PENDING  (inventory.reservedStock += quantity)
       │
       ├── POST /confirm → CONFIRMED  (totalStock -= quantity, reservedStock -= quantity)
       ├── POST /release → RELEASED   (reservedStock -= quantity)
       └── Expiry        → RELEASED   (reservedStock -= quantity)  ← automatic

Available stock = totalStock − reservedStock  (at all times)
```

---

## Expiry Mechanism in Production

Expired reservations must release their held stock so other shoppers can buy. Two complementary strategies are used:

### 1. Lazy Expiry (immediate, on read)

Every time a reservation is fetched — via `GET /api/reservations/:id` or the full list endpoint — the server checks `expiresAt < now()`. If the reservation is still `PENDING` and has expired, it atomically:

- Sets `status = RELEASED`
- Decrements `reservedStock` on the inventory row

This means any expired reservation self-heals the moment it is touched, with no lag. Stock becomes available again instantly on the next product listing refresh.

### 2. Vercel Cron Job (background sweep)

`/api/cron/expire` runs every **5 minutes** via Vercel Cron (configured in `vercel.json`):

```json
{
  "crons": [{ "path": "/api/cron/expire", "schedule": "*/5 * * * *" }]
}
```

The cron endpoint:
1. Finds all `PENDING` reservations where `expiresAt < now()`
2. Releases each one inside a transaction (idempotent — skips already-released rows)
3. Writes a `EXPIRED` audit event to `reservation_events`
4. Promotes the next waitlist entry for that product/warehouse if one exists

The cron is protected by a `CRON_SECRET` checked via the `x-cron-secret` header.

**Why both?** Lazy expiry gives instant correctness for any reservation that someone reads. The cron job handles orphaned reservations that nobody ever reads again, ensuring stock is never permanently phantom-held.

---

## Idempotency (Bonus)

`POST /api/reservations` and `POST /api/reservations/:id/confirm` support the `Idempotency-Key` request header.

**How it works:**

1. Client sends any unique string in the `Idempotency-Key` header (e.g., a UUID generated client-side before the request).
2. On first call: the server executes normally and stores the response in Redis under `idempotency:{key}` with a 24-hour TTL.
3. On retry with the same key: the cached response is returned immediately without re-executing the transaction — no double-reserve, no double-confirm.

```bash
# First call — creates reservation
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: req_abc123" \
  -d '{"productId": "...", "warehouseId": "...", "quantity": 1}'

# Retry (e.g., after a network timeout) — returns cached response
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: req_abc123" \
  -d '{"productId": "...", "warehouseId": "...", "quantity": 1}'
```

Both calls return the same reservation object. The database is only written once.

---

## Seed Data

| Entity | Count | Detail |
|--------|-------|--------|
| Warehouses | 5 | Chennai, Bangalore, Mumbai, Delhi, Hyderabad |
| Products | 53 | Healthcare (10), Skincare (11), Fitness (11), Electronics (11), Lifestyle (10) |
| Inventory records | 265 | Every product × every warehouse, 10 units each |

---

## Deployment (Vercel + Neon + Upstash)

1. Push to a public GitHub repository.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add all environment variables from the [Local Setup](#2-environment-variables) section in the Vercel dashboard.
4. Deploy. Vercel will run `npm run postinstall` (which regenerates the Prisma client) automatically.
5. After the first successful deploy, seed the production database:
   ```bash
   DATABASE_URL="<your-neon-url>" npm run db:seed
   ```
6. The cron job at `/api/cron/expire` will start running automatically every 5 minutes.

---

## Trade-offs & What I'd Do Differently

### Trade-offs Made

**`SELECT FOR UPDATE` vs. Redis distributed locks (Redlock)**  
`FOR UPDATE` inside a Serializable Postgres transaction is simpler and correct for a single-primary database (Neon). Redlock would be needed if writes were spread across multiple DB replicas, but that adds operational complexity that isn't warranted here.

**No user authentication**  
Reservations are anonymous — not tied to a session or user ID. In production, you'd add a `userId` foreign key on the `Reservation` model, ensure users can only view and act on their own reservations, and protect the checkout page behind auth.

**Cron cadence of 5 minutes**  
Expired reservations may hold stock for up to 5 minutes beyond their `expiresAt`. Lazy expiry on read compensates for this in most cases, but a high-traffic system should reduce the cron to 1 minute or replace it with a job queue (BullMQ / Inngest) that schedules a release task at exact expiry time.

**Quantity hardcoded to 1 in the UI**  
The API fully supports arbitrary quantities (`quantity` is validated by Zod). The product detail page always reserves 1 unit. A quantity selector was intentionally left out to keep the UI focused.

**Stale stock counts in the UI**  
TanStack Query re-fetches every 30 seconds. For a truly live experience, stock levels should be pushed via WebSockets or Server-Sent Events rather than polled.

### With More Time

- **User authentication** — NextAuth with Google/email, `userId` on reservations, protected checkout pages
- **Real-time stock updates** — SSE or WebSockets so the product listing reflects reservations as they happen
- **Payment integration** — Razorpay or Stripe webhook confirms the reservation server-side on payment success
- **Quantity selector** — wire up the existing API `quantity` field to the frontend
- **Rate limiting** — protect `POST /api/reservations` from spam with an IP-based rate limiter (e.g., `@upstash/ratelimit`)
- **Tests** — integration tests for the concurrent-reservation path using `pg` with parallel transactions; unit tests for the expiry logic
- **Order history** — paginated list of a user's past reservations and orders
- **Admin tooling** — warehouse stock adjustment, manual reservation release, analytics on conversion rate from reservation → confirmation

