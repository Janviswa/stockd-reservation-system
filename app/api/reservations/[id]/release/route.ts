// app/api/reservations/[id]/release/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promoteNextWaitlistEntry } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { reservation, promoted } = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          status: string;
          productId: string;
          warehouseId: string;
          quantity: number;
        }>
      >`
        SELECT id, status, "productId", "warehouseId", quantity
        FROM reservations
        WHERE id = ${id}
        FOR UPDATE
      `;

      const row = rows[0];
      if (!row) throw new Error("NOT_FOUND");
      if (row.status !== "PENDING") throw new Error(`INVALID_STATUS:${row.status}`);

      // Release reservedStock
      await tx.$executeRaw`
        UPDATE inventory
        SET "reservedStock" = GREATEST(0, "reservedStock" - ${row.quantity}), "updatedAt" = NOW()
        WHERE "productId" = ${row.productId} AND "warehouseId" = ${row.warehouseId}
      `;

      await tx.$executeRaw`
        UPDATE reservations SET status = 'RELEASED', "updatedAt" = NOW()
        WHERE id = ${id}
      `;

      // Audit log
      await tx.reservationEvent.create({
        data: { reservationId: id, event: "RELEASED", metadata: { by: "user" } },
      });

      // Auto-promote the next waitlist entry (if any)
      const promoted = await promoteNextWaitlistEntry(
        tx as Parameters<typeof promoteNextWaitlistEntry>[0],
        row.productId,
        row.warehouseId
      );

      const updated = await tx.reservation.findUnique({
        where: { id },
        include: { product: true, warehouse: true },
      });

      return { reservation: updated, promoted };
    });

    return NextResponse.json({ reservation, waitlistPromotion: promoted });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND")
        return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
      if (error.message.startsWith("INVALID_STATUS:")) {
        const s = error.message.split(":")[1];
        return NextResponse.json(
          { error: `Reservation is already ${s.toLowerCase()}` },
          { status: 409 }
        );
      }
    }
    console.error("POST /api/reservations/[id]/release error:", error);
    return NextResponse.json({ error: "Failed to release reservation" }, { status: 500 });
  }
}
