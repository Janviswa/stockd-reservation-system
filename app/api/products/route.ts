import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: { include: { warehouse: true } },
      },
      orderBy: { name: "asc" },
    });

    const result = products.map((product) => ({
      id: product.id,
      name: product.name,
      image: product.image,
      images: product.images?.length ? product.images : [product.image],
      brand: product.brand ?? "",
      category: product.category,
      price: product.price,
      description: product.description,
      colors: product.colors ?? [],
      size: product.size ?? "",
      boxContents: product.boxContents ?? "",
      inventory: product.inventory.map((inv) => ({
        warehouseId: inv.warehouseId,
        warehouseName: inv.warehouse.name,
        location: inv.warehouse.location,
        totalStock: inv.totalStock,
        reservedStock: inv.reservedStock,
        available: inv.totalStock - inv.reservedStock,
      })),
      totalAvailable: product.inventory.reduce(
        (sum, inv) => sum + (inv.totalStock - inv.reservedStock), 0
      ),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
