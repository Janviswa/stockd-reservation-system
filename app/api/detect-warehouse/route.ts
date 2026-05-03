import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectLocationFromPincode, haversineKm, calcShipping } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { pincode, productId } = await req.json();
    if (!pincode || !productId) {
      return NextResponse.json({ error: "pincode and productId required" }, { status: 400 });
    }

    const location = detectLocationFromPincode(String(pincode));

    if (!location.valid) {
      return NextResponse.json(
        {
          error: "Delivery not available for this pincode",
          message:
            "Sorry, we don't currently deliver to this pincode. Please try a nearby pincode or contact support.",
          code: "PINCODE_NOT_SERVICEABLE",
        },
        { status: 422 }
      );
    }

    const warehouses = await prisma.warehouse.findMany({
      include: { inventory: { where: { productId } } },
    });

    const options = warehouses
      .map((wh) => {
        const inv = wh.inventory[0];
        const available = inv ? inv.totalStock - inv.reservedStock : 0;
        const distanceKm = haversineKm(location.lat, location.lng, wh.lat, wh.lng);
        const shipping = calcShipping(distanceKm);
        return {
          warehouseId:   wh.id,
          warehouseName: wh.name,
          city:          wh.city,
          location:      wh.location,
          distanceKm:    Math.round(distanceKm),
          available,
          shippingCost:  shipping.cost,
          deliveryDays:  shipping.days,
          deliveryLabel: shipping.label,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const nearestWithStock = options.find((o) => o.available > 0);

    const result = options.map((o, idx) => ({
      ...o,
      isNearest:     idx === 0,
      isRecommended: o.warehouseId === nearestWithStock?.warehouseId,
    }));

    return NextResponse.json({
      detectedLocation: {
        city:    location.city,
        state:   location.state,
        pincode: String(pincode),
      },
      warehouses:              result,
      recommendedWarehouseId:  nearestWithStock?.warehouseId ?? null,
    });
  } catch (err) {
    console.error("detect-warehouse error:", err);
    return NextResponse.json({ error: "Failed to detect warehouse" }, { status: 500 });
  }
}
