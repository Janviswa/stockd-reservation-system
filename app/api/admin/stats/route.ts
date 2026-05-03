// app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [
    totalProducts, totalWarehouses,
    totalReservations, pendingReservations,
    confirmedReservations, releasedReservations,
    totalWaitlist, totalInventory,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.warehouse.count(),
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: "PENDING", expiresAt: { gt: new Date() } } }),
    prisma.reservation.count({ where: { status: "CONFIRMED" } }),
    prisma.reservation.count({ where: { status: "RELEASED" } }),
    prisma.waitlistEntry.count({ where: { promoted: false } }),
    prisma.inventory.aggregate({ _sum: { totalStock: true, reservedStock: true } }),
  ]);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentReservations = await prisma.reservation.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay: Record<string, { confirmed: number; released: number; pending: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    byDay[key] = { confirmed: 0, released: 0, pending: 0 };
  }
  for (const r of recentReservations) {
    const key = new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    if (byDay[key]) {
      const s = r.status.toLowerCase() as "confirmed" | "released" | "pending";
      if (s in byDay[key]) (byDay[key] as Record<string, number>)[s]++;
    }
  }

  const topProducts = await prisma.reservation.groupBy({
    by: ["productId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProducts.map((p) => p.productId) } },
    select: { id: true, name: true, category: true },
  });

  return NextResponse.json({
    totals: {
      products: totalProducts, warehouses: totalWarehouses,
      reservations: totalReservations, pending: pendingReservations,
      confirmed: confirmedReservations, released: releasedReservations,
      waitlist: totalWaitlist,
      totalStock: totalInventory._sum.totalStock ?? 0,
      reservedStock: totalInventory._sum.reservedStock ?? 0,
    },
    chart: Object.entries(byDay).map(([date, counts]) => ({ date, ...counts })),
    topProducts: topProducts.map((tp) => ({
      ...topProductDetails.find((p) => p.id === tp.productId),
      reservations: tp._count.id,
    })),
  });
}
