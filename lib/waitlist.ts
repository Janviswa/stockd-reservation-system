// lib/waitlist.ts
// Auto-promotion engine: when stock is freed (release/expire),
// find the next waitlist entry and auto-create a reservation for them.
import { PrismaClient } from "@prisma/client";

const RESERVATION_DURATION_MS = 10 * 60 * 1000;

export async function promoteNextWaitlistEntry(
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  productId: string,
  warehouseId: string
): Promise<{ promoted: boolean; entry?: { email: string; position: number; reservationId: string } }> {
  // Find the first (lowest position) un-promoted waitlist entry
  const next = await (tx as PrismaClient).waitlistEntry.findFirst({
    where: { productId, warehouseId, promoted: false },
    orderBy: { position: "asc" },
  });

  if (!next) return { promoted: false };

  // Check available stock (inside the same transaction)
  const inventory = await (tx as PrismaClient).$queryRaw<
    Array<{ totalStock: number; reservedStock: number }>
  >`
    SELECT "totalStock", "reservedStock"
    FROM inventory
    WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
    FOR UPDATE
  `;

  if (!inventory[0]) return { promoted: false };

  const available = inventory[0].totalStock - inventory[0].reservedStock;
  if (available < next.quantity) return { promoted: false };

  // Reserve the stock for them
  await (tx as PrismaClient).$executeRaw`
    UPDATE inventory
    SET "reservedStock" = "reservedStock" + ${next.quantity}, "updatedAt" = NOW()
    WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
  `;

  // Create a reservation in their name
  const reservation = await (tx as PrismaClient).reservation.create({
    data: {
      productId,
      warehouseId,
      quantity: next.quantity,
      status: "PENDING",
      expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
    },
  });

  // Write audit event
  await (tx as PrismaClient).reservationEvent.create({
    data: {
      reservationId: reservation.id,
      event: "WAITLIST_PROMOTED",
      metadata: {
        waitlistEntryId: next.id,
        email: next.email,
        position: next.position,
      },
    },
  });

  // Mark the waitlist entry as promoted + notified
  await (tx as PrismaClient).waitlistEntry.update({
    where: { id: next.id },
    data: { promoted: true, notified: true },
  });

  return {
    promoted: true,
    entry: {
      email: next.email,
      position: next.position,
      reservationId: reservation.id,
    },
  };
}
