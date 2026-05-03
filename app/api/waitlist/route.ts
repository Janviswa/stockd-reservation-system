// app/api/waitlist/route.ts
// GET  — list all waitlist entries (for admin/demo purposes)
// POST — join the waitlist for a product/warehouse
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const joinSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  email: z.string().email("Valid email required"),
  quantity: z.number().int().min(1).max(10).default(1),
});

export async function GET() {
  const entries = await prisma.waitlistEntry.findMany({
    include: { product: true, warehouse: true },
    orderBy: [{ productId: "asc" }, { warehouseId: "asc" }, { position: "asc" }],
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = joinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, warehouseId, email, quantity } = parsed.data;

    // Check if already on waitlist
    const existing = await prisma.waitlistEntry.findUnique({
      where: { productId_warehouseId_email: { productId, warehouseId, email } },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Already on waitlist",
          entry: existing,
          message: `You're already at position #${existing.position} on the waitlist.`,
        },
        { status: 409 }
      );
    }

    // Check if stock is actually available — if so, don't join waitlist
    const inventory = await prisma.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    if (inventory && inventory.totalStock - inventory.reservedStock > 0) {
      return NextResponse.json(
        {
          error: "Stock is available",
          message: "This item is in stock. Please reserve it directly instead of joining the waitlist.",
          available: inventory.totalStock - inventory.reservedStock,
        },
        { status: 400 }
      );
    }

    // Determine queue position (next after current last)
    const lastEntry = await prisma.waitlistEntry.findFirst({
      where: { productId, warehouseId },
      orderBy: { position: "desc" },
    });

    const position = (lastEntry?.position ?? 0) + 1;

    const entry = await prisma.waitlistEntry.create({
      data: { productId, warehouseId, email, quantity, position },
      include: { product: true, warehouse: true },
    });

    return NextResponse.json(
      {
        entry,
        message: `You're #${position} on the waitlist for ${entry.product.name} at ${entry.warehouse.name}. We'll notify you when stock is available.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/waitlist error:", err);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
