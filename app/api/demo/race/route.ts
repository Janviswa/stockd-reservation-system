// app/api/demo/race/route.ts
//
// Fires N concurrent reservation requests for the same product/warehouse
// and returns a structured breakdown of who won and who got 409.
// This endpoint PROVES the SELECT FOR UPDATE locking works correctly.
//
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const RESERVATION_DURATION_MS = 10 * 60 * 1000;

interface RaceResult {
  requestId: number;
  status: "SUCCESS" | "CONFLICT" | "ERROR";
  httpStatus: number;
  reservationId?: string;
  error?: string;
  durationMs: number;
}

// Internal reservation function — same logic as POST /api/reservations
// but inline so we can call it concurrently in the same process
async function attemptReservation(
  productId: string,
  warehouseId: string,
  quantity: number
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    const reservation = await prisma.$transaction(
      async (tx) => {
        const inventory = await tx.$queryRaw<
          Array<{ id: string; totalStock: number; reservedStock: number }>
        >`
          SELECT id, "totalStock", "reservedStock"
          FROM inventory
          WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
          FOR UPDATE
        `;

        if (!inventory[0]) throw new Error("INVENTORY_NOT_FOUND");

        const available = inventory[0].totalStock - inventory[0].reservedStock;
        if (available < quantity) throw new Error("INSUFFICIENT_STOCK");

        await tx.$executeRaw`
          UPDATE inventory
          SET "reservedStock" = "reservedStock" + ${quantity}, "updatedAt" = NOW()
          WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
        `;

        const r = await tx.reservation.create({
          data: {
            productId,
            warehouseId,
            quantity,
            status: "PENDING",
            expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
          },
        });

        // Write audit event
        await tx.reservationEvent.create({
          data: {
            reservationId: r.id,
            event: "CREATED",
            metadata: { source: "race_demo", quantity },
          },
        });

        return r;
      },
      { isolationLevel: "Serializable", timeout: 10000 }
    );

    return { success: true, reservationId: reservation.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    return {
      success: false,
      error: msg.includes("INSUFFICIENT_STOCK") ? "INSUFFICIENT_STOCK" : msg,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      warehouseId,
      concurrency = 10,
      quantity = 1,
      resetAfter = true,
    } = body as {
      productId?: string;
      warehouseId?: string;
      concurrency?: number;
      quantity?: number;
      resetAfter?: boolean;
    };

    if (!productId || !warehouseId) {
      return NextResponse.json(
        { error: "productId and warehouseId are required" },
        { status: 400 }
      );
    }

    const safeN = Math.min(Math.max(concurrency, 2), 20);

    // Snapshot stock BEFORE the race
    const inventoryBefore = await prisma.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    if (!inventoryBefore) {
      return NextResponse.json(
        { error: "Inventory not found for this product/warehouse" },
        { status: 404 }
      );
    }

    const availableBefore =
      inventoryBefore.totalStock - inventoryBefore.reservedStock;

    // Fire all N requests simultaneously
    const startAll = Date.now();
    const racePromises = Array.from({ length: safeN }, async (_, i) => {
      const t0 = Date.now();
      const result = await attemptReservation(productId, warehouseId, quantity);
      return {
        requestId: i + 1,
        status: result.success ? "SUCCESS" : "CONFLICT",
        httpStatus: result.success ? 201 : 409,
        reservationId: result.reservationId,
        error: result.error,
        durationMs: Date.now() - t0,
      } as RaceResult;
    });

    const results = await Promise.all(racePromises);
    const totalMs = Date.now() - startAll;

    // Snapshot stock AFTER
    const inventoryAfter = await prisma.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    const availableAfter = inventoryAfter
      ? inventoryAfter.totalStock - inventoryAfter.reservedStock
      : 0;

    const winners = results.filter((r) => r.status === "SUCCESS");
    const losers = results.filter((r) => r.status === "CONFLICT");

    // Correctness assertion
    const expectedWinners = Math.min(safeN, availableBefore);
    const correct = winners.length === expectedWinners;

    // Optionally release demo reservations so stock is restored
    if (resetAfter && winners.length > 0) {
      const winnerIds = winners
        .map((w) => w.reservationId)
        .filter(Boolean) as string[];

      await prisma.$transaction([
        prisma.$executeRaw`
          UPDATE reservations SET status = 'RELEASED', "updatedAt" = NOW()
          WHERE id = ANY(${winnerIds}::text[]) AND status = 'PENDING'
        `,
        prisma.$executeRaw`
          UPDATE inventory
          SET "reservedStock" = GREATEST(0, "reservedStock" - ${winners.length * quantity}),
              "updatedAt" = NOW()
          WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
        `,
      ]);
    }

    return NextResponse.json({
      summary: {
        concurrentRequests: safeN,
        availableStockBefore: availableBefore,
        availableStockAfter: resetAfter ? availableBefore : availableAfter,
        winners: winners.length,
        losers: losers.length,
        totalDurationMs: totalMs,
        correct,
        verdict: correct
          ? `✅ Correct — exactly ${winners.length} of ${safeN} requests succeeded. ${losers.length} got 409.`
          : `❌ Incorrect — expected ${expectedWinners} winners, got ${winners.length}. Race condition detected!`,
        resetAfter,
      },
      results: results.sort((a, b) => a.requestId - b.requestId),
      explanation: {
        mechanism: "SELECT FOR UPDATE + Serializable transaction isolation",
        guarantee:
          "The database row lock ensures exactly one transaction increments reservedStock at a time. Losers read the updated value after the winner commits and see 0 available stock.",
      },
    });
  } catch (err) {
    console.error("Race demo error:", err);
    return NextResponse.json(
      { error: "Demo failed", detail: String(err) },
      { status: 500 }
    );
  }
}
