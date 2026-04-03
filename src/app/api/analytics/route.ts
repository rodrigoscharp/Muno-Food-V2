import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOf30DaysAgo = new Date(now);
  startOf30DaysAgo.setDate(now.getDate() - 30);
  startOf30DaysAgo.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayStats, monthStats, last30Days, topItems] = await Promise.all([
    // Today
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfToday }, paymentStatus: "PAID" },
      _sum: { total: true },
      _count: true,
    }),
    // This month
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, paymentStatus: "PAID" },
      _sum: { total: true },
      _count: true,
    }),
    // Last 30 days per day
    prisma.order.findMany({
      where: { createdAt: { gte: startOf30DaysAgo }, paymentStatus: "PAID" },
      select: { createdAt: true, total: true },
    }),
    // Top 10 most ordered items
    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  // Aggregate last 30 days by date
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(startOf30DaysAgo);
    d.setDate(startOf30DaysAgo.getDate() + i);
    dailyMap[d.toISOString().split("T")[0]] = 0;
  }
  last30Days.forEach((order) => {
    const key = new Date(order.createdAt).toISOString().split("T")[0];
    if (key in dailyMap) dailyMap[key] += Number(order.total);
  });
  const dailySales = Object.entries(dailyMap).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  // Fetch menu item names for top items
  const menuItemIds = topItems.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, name: true },
  });
  const topItemsWithNames = topItems.map((item) => ({
    name: menuItems.find((m) => m.id === item.menuItemId)?.name ?? "Desconhecido",
    quantity: item._sum.quantity ?? 0,
  }));

  return NextResponse.json({
    today: {
      revenue: Number(todayStats._sum.total ?? 0),
      orders: todayStats._count,
    },
    month: {
      revenue: Number(monthStats._sum.total ?? 0),
      orders: monthStats._count,
    },
    dailySales,
    topItems: topItemsWithNames,
  });
}
