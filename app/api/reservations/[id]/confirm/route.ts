// app/api/reservations/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const idempotencyKey = req.headers.get("idempotency-key");

  // Idempotency check
  if (idempotencyKey) {
    const cached = await redis.get<string>(`idempotency:confirm:${idempotencyKey}`);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the reservation row
      const reservations = await tx.$queryRaw<
        Array<{
          id: string;
          status: string;
          expiresAt: Date;
          productId: string;
          warehouseId: string;
          quantity: number;
        }>
      >`
        SELECT id, status, "expiresAt", "productId", "warehouseId", quantity
        FROM reservations
        WHERE id = ${id}
        FOR UPDATE
      `;

      const reservation = reservations[0];

      if (!reservation) {
        throw new Error("NOT_FOUND");
      }

      if (reservation.status !== "PENDING") {
        throw new Error(`INVALID_STATUS:${reservation.status}`);
      }

      // Lazy expiry check
      if (new Date(reservation.expiresAt) < new Date()) {
        // Release the stock and mark as released
        await tx.$executeRaw`
          UPDATE inventory
          SET "reservedStock" = GREATEST(0, "reservedStock" - ${reservation.quantity}), "updatedAt" = NOW()
          WHERE "productId" = ${reservation.productId} AND "warehouseId" = ${reservation.warehouseId}
        `;
        await tx.$executeRaw`
          UPDATE reservations SET status = 'RELEASED', "updatedAt" = NOW()
          WHERE id = ${id}
        `;
        throw new Error("EXPIRED");
      }

      // Confirm: reduce totalStock AND reservedStock
      await tx.$executeRaw`
        UPDATE inventory
        SET
          "totalStock" = GREATEST(0, "totalStock" - ${reservation.quantity}),
          "reservedStock" = GREATEST(0, "reservedStock" - ${reservation.quantity}),
          "updatedAt" = NOW()
        WHERE "productId" = ${reservation.productId} AND "warehouseId" = ${reservation.warehouseId}
      `;

      await tx.$executeRaw`
        UPDATE reservations SET status = 'CONFIRMED', "updatedAt" = NOW()
        WHERE id = ${id}
      `;

      const updated = await tx.reservation.findUnique({
        where: { id },
        include: { product: true, warehouse: true },
      });

      return updated;
    });

    if (idempotencyKey) {
      await redis.set(
        `idempotency:confirm:${idempotencyKey}`,
        JSON.stringify(result),
        { ex: 86400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EXPIRED") {
        return NextResponse.json(
          { error: "Your reservation has expired.", code: "EXPIRED" },
          { status: 410 }
        );
      }
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          { error: "Reservation not found" },
          { status: 404 }
        );
      }
      if (error.message.startsWith("INVALID_STATUS:")) {
        const status = error.message.split(":")[1];
        return NextResponse.json(
          { error: `Reservation is already ${status.toLowerCase()}` },
          { status: 409 }
        );
      }
    }
    console.error("POST /api/reservations/[id]/confirm error:", error);
    return NextResponse.json(
      { error: "Failed to confirm reservation" },
      { status: 500 }
    );
  }
}
