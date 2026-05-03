// app/api/reservations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Lazy expiry
    if (reservation.status === "PENDING" && reservation.expiresAt < new Date()) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          UPDATE reservations SET status = 'RELEASED', "updatedAt" = NOW()
          WHERE id = ${id} AND status = 'PENDING'
        `;
        await tx.$executeRaw`
          UPDATE inventory
          SET "reservedStock" = GREATEST(0, "reservedStock" - ${reservation.quantity}), "updatedAt" = NOW()
          WHERE "productId" = ${reservation.productId} AND "warehouseId" = ${reservation.warehouseId}
        `;
      });

      return NextResponse.json(
        { ...reservation, status: "RELEASED" as const },
        { status: 200 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("GET /api/reservations/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch reservation" }, { status: 500 });
  }
}
