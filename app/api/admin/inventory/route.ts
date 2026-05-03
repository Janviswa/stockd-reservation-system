// app/api/admin/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const inventory = await prisma.inventory.findMany({
    include: { product: true, warehouse: true },
    orderBy: [{ warehouse: { name: "asc" } }, { product: { name: "asc" } }],
  });
  return NextResponse.json(inventory.map((inv) => ({
    id: inv.id,
    productId: inv.productId,
    productName: inv.product.name,
    category: inv.product.category,
    warehouseId: inv.warehouseId,
    warehouseName: inv.warehouse.name,
    city: inv.warehouse.city,
    totalStock: inv.totalStock,
    reservedStock: inv.reservedStock,
    available: inv.totalStock - inv.reservedStock,
  })));
}

export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { inventoryId, totalStock } = await req.json();
  if (!inventoryId || typeof totalStock !== "number" || totalStock < 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const updated = await prisma.inventory.update({
    where: { id: inventoryId },
    data: { totalStock },
  });
  return NextResponse.json(updated);
}
