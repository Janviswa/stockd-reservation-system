// app/api/cron/expire/route.ts
// Runs every 5 minutes via Vercel Cron.
// Finds all PENDING reservations past expiresAt, releases stock,
// writes EXPIRED audit events, and promotes waiting customers.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promoteNextWaitlistEntry } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await prisma.reservation.findMany({
      where: { status: "PENDING", expiresAt: { lt: new Date() } },
    });

    if (expired.length === 0) {
      return NextResponse.json({ message: "No expired reservations", released: 0 });
    }

    let released = 0;
    const promotions: { email: string; reservationId: string }[] = [];

    for (const r of expired) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`
            UPDATE reservations SET status = 'RELEASED', "updatedAt" = NOW()
            WHERE id = ${r.id} AND status = 'PENDING' AND "expiresAt" < NOW()
          `;
          await tx.$executeRaw`
            UPDATE inventory
            SET "reservedStock" = GREATEST(0, "reservedStock" - ${r.quantity}), "updatedAt" = NOW()
            WHERE "productId" = ${r.productId} AND "warehouseId" = ${r.warehouseId}
          `;
          await tx.reservationEvent.create({
            data: {
              reservationId: r.id,
              event: "EXPIRED",
              metadata: { expiredAt: new Date().toISOString() },
            },
          });

          // Promote next waitlist entry
          return promoteNextWaitlistEntry(
            tx as Parameters<typeof promoteNextWaitlistEntry>[0],
            r.productId,
            r.warehouseId
          );
        });

        released++;
        if (result.promoted && result.entry) {
          promotions.push({ email: result.entry.email, reservationId: result.entry.reservationId });
        }
      } catch {
        // Skip if already handled by another request
      }
    }

    return NextResponse.json({
      message: `Released ${released} expired reservations`,
      released,
      waitlistPromotions: promotions,
    });
  } catch (error) {
    console.error("Cron expire error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
