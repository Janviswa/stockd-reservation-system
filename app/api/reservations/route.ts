// app/api/reservations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { createReservationSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const RESERVATION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Lazy expiration: mark expired PENDING reservations
    const now = new Date();
    const expired = reservations.filter(
      (r) => r.status === "PENDING" && r.expiresAt < now
    );

    if (expired.length > 0) {
      // Release each expired reservation atomically
      for (const r of expired) {
        try {
          await prisma.$transaction([
            prisma.$executeRaw`
              UPDATE reservations SET status = 'RELEASED', "updatedAt" = NOW()
              WHERE id = ${r.id} AND status = 'PENDING' AND "expiresAt" < NOW()
            `,
            prisma.$executeRaw`
              UPDATE inventory
              SET "reservedStock" = GREATEST(0, "reservedStock" - ${r.quantity}), "updatedAt" = NOW()
              WHERE "productId" = ${r.productId} AND "warehouseId" = ${r.warehouseId}
            `,
          ]);
        } catch {
          // Skip if already handled by another request
        }
      }
    }

    const fresh = await prisma.reservation.findMany({
      include: { product: true, warehouse: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(fresh);
  } catch (error) {
    console.error("GET /api/reservations error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get("idempotency-key");

    // Validate input
    const parsed = createReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, warehouseId, quantity } = parsed.data;

    // Idempotency check
    if (idempotencyKey) {
      const cached = await redis.get<string>(`idempotency:${idempotencyKey}`);
      if (cached) {
        return NextResponse.json(JSON.parse(cached), { status: 200 });
      }
    }

    // Use a serializable transaction with row-level lock to prevent race conditions
    const reservation = await prisma.$transaction(
      async (tx) => {
        // Lock the inventory row for this product/warehouse using SELECT FOR UPDATE
        // This ensures only one transaction can modify it at a time
        const inventory = await tx.$queryRaw<
          Array<{
            id: string;
            totalStock: number;
            reservedStock: number;
          }>
        >`
          SELECT id, "totalStock", "reservedStock"
          FROM inventory
          WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
          FOR UPDATE
        `;

        if (!inventory[0]) {
          throw new Error("INVENTORY_NOT_FOUND");
        }

        const inv = inventory[0];
        const available = inv.totalStock - inv.reservedStock;

        if (available < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        // Increment reservedStock
        await tx.$executeRaw`
          UPDATE inventory
          SET "reservedStock" = "reservedStock" + ${quantity}, "updatedAt" = NOW()
          WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
        `;

        // Create reservation
        const newReservation = await tx.reservation.create({
          data: {
            productId,
            warehouseId,
            quantity,
            status: "PENDING",
            expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
          },
          include: {
            product: true,
            warehouse: true,
          },
        });

        return newReservation;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );

    const responseBody = reservation;

    // Store idempotency result in Redis for 24 hours
    if (idempotencyKey) {
      await redis.set(
        `idempotency:${idempotencyKey}`,
        JSON.stringify(responseBody),
        { ex: 86400 }
      );
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          {
            error:
              "Someone just reserved this item. Try another warehouse.",
            code: "INSUFFICIENT_STOCK",
          },
          { status: 409 }
        );
      }
      if (error.message === "INVENTORY_NOT_FOUND") {
        return NextResponse.json(
          { error: "Product not available in this warehouse" },
          { status: 404 }
        );
      }
    }
    console.error("POST /api/reservations error:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
