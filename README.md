# Stockd — Inventory Reservation System

A production-quality inventory reservation system for multi-warehouse e-commerce, built to prevent race conditions during checkout.

## Live Demo

Deploy to Vercel (see Deployment section below).

---

## Stack

- **Next.js 15** (App Router, TypeScript strict)
- **Prisma ORM** + **PostgreSQL** (Neon)
- **Upstash Redis** (idempotency key storage)
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion** (animations)
- **TanStack Query** (data fetching & auto-refresh)
- **Zod** (schema validation)

---

## Local Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd stockd
npm install
```

### 2. Environment Variables

Copy `.env.local` (already included) or create your own:

```env
DATABASE_URL="postgresql://..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
CRON_SECRET="your-cron-secret"
```

### 3. Run Migrations & Seed

```bash
# Push schema to DB
npx prisma db push

# Seed with 25 products, 5 warehouses, 125 inventory records
npm run db:seed
```

### 4. Start Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | All products with warehouse-wise available stock |
| GET | `/api/warehouses` | All warehouses |
| POST | `/api/reservations` | Create a reservation (409 if out of stock) |
| GET | `/api/reservations/:id` | Fetch a reservation (lazy expiry) |
| GET | `/api/reservations` | All reservations (with lazy expiry cleanup) |
| POST | `/api/reservations/:id/confirm` | Confirm reservation (410 if expired) |
| POST | `/api/reservations/:id/release` | Release reservation early |
| GET | `/api/cron/expire` | Cron job to clean expired reservations |

---

## How Concurrency Is Handled

This is the core challenge: if two users simultaneously try to reserve the last unit, exactly one must succeed and the other must get a 409.

### Solution: `SELECT FOR UPDATE` + Serializable Transaction

```sql
-- Step 1: Lock the inventory row (blocks other transactions)
SELECT id, "totalStock", "reservedStock"
FROM inventory
WHERE "productId" = $1 AND "warehouseId" = $2
FOR UPDATE;

-- Step 2: Check available stock
-- available = totalStock - reservedStock

-- Step 3: If enough stock, increment reservedStock atomically
UPDATE inventory
SET "reservedStock" = "reservedStock" + $quantity
WHERE "productId" = $1 AND "warehouseId" = $2;

-- Step 4: Create reservation record
INSERT INTO reservations ...
```

The entire operation runs inside a `Prisma.$transaction` with `isolationLevel: Serializable`. PostgreSQL's `FOR UPDATE` causes the second concurrent request to **wait** until the first transaction commits. After the first commits, the second reads the updated `reservedStock`, sees insufficient stock, and throws `INSUFFICIENT_STOCK` → HTTP 409.

This guarantees **exactly-one-succeeds** semantics.

---

## Reservation Lifecycle

```
Reserve → PENDING (stock.reservedStock++)
    ↓
    ├─ Confirm → CONFIRMED (stock.totalStock--, stock.reservedStock--)
    ├─ Release → RELEASED (stock.reservedStock--)
    └─ Expire  → RELEASED (stock.reservedStock--) ← automatic
```

**Available stock = totalStock − reservedStock** at all times.

---

## Expiry Strategy

Two complementary mechanisms:

### 1. Lazy Expiration (on read)
Every time a reservation is fetched (GET `/api/reservations/:id` or GET `/api/reservations`), the server checks if `expiresAt < now`. If expired and still PENDING, it atomically:
- Sets `status = RELEASED`
- Decrements `reservedStock`

This means no reservation stays "phantom-reserved" after expiry — the moment anyone reads it, it self-heals.

### 2. Cron Job (background cleanup)
`GET /api/cron/expire` runs every 5 minutes via Vercel Cron (`vercel.json`). It finds all PENDING reservations where `expiresAt < now` and releases them. This ensures stock is freed even if nobody reads the reservation.

**Why both?** Lazy expiry provides instant correctness on read. The cron job handles orphaned reservations that nobody ever reads again.

---

## Idempotency (Bonus)

The `POST /api/reservations` and `POST /api/reservations/:id/confirm` endpoints support an `Idempotency-Key` header.

If a client retries with the same key:
1. The server checks Redis for `idempotency:{key}`
2. If found, returns the **original cached response** without re-executing
3. If not found, executes normally and stores the response in Redis with a 24h TTL

This prevents double-reservations from network retries.

```bash
# Example
curl -X POST /api/reservations \
  -H "Idempotency-Key: unique-client-request-id-123" \
  -H "Content-Type: application/json" \
  -d '{"productId": "...", "warehouseId": "...", "quantity": 1}'
```

---

## Seed Data

- **5 Warehouses**: Chennai, Bangalore, Mumbai, Delhi, Hyderabad
- **25 Products**: 5 per category (Healthcare, Skincare, Fitness, Electronics, Lifestyle)
- **125 Inventory records**: Every product × every warehouse, random 5–20 units each

---

## Deployment

### Vercel + Neon + Upstash

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
5. Run seed: `npx prisma db push && npm run db:seed`

The `vercel.json` cron runs `/api/cron/expire` every 5 minutes automatically.

---

## Trade-offs & What I'd Do Differently

### Trade-offs made

1. **Serializable transactions vs advisory locks**: I chose Prisma's `$transaction` with `FOR UPDATE` + Serializable isolation. An alternative is Redis distributed locks (Redlock), which would work across multiple DB replicas but adds complexity. For a Neon-hosted single-primary Postgres, `FOR UPDATE` is simpler and correct.

2. **No user auth**: Reservations are not tied to a user session. In production, you'd have a `userId` on the Reservation model and only show the user their own reservations.

3. **Quantity always 1**: The UI reserves 1 unit at a time. The API supports arbitrary quantities — just wire up a quantity selector.

4. **Cron every 5 minutes**: Expired reservations may hold stock for up to 5 minutes beyond expiry. For high-traffic scenarios, reduce to 1 minute or use a background job queue (BullMQ, etc.).

5. **No optimistic locking**: Stock counts shown in the UI may be slightly stale (30s refetch interval). In production, use WebSockets or SSE for real-time updates.

### With more time

- Add user authentication (NextAuth)
- WebSocket/SSE for live stock updates
- Payment flow integration (Razorpay/Stripe)
- Quantity selector in product detail
- Order history with pagination
- Admin dashboard for warehouse management
- Unit + integration tests for the reservation logic
- Rate limiting on the reservation endpoint
