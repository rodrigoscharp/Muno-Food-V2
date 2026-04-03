import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { AdminCharts } from "@/components/adm/AdminCharts";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayStats, monthStats, menuItemCount, pendingOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, paymentStatus: "PAID" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, paymentStatus: "PAID" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.menuItem.count(),
    prisma.order.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "IN_PREPARATION"] } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Receita Hoje</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(Number(todayStats._sum.total ?? 0))}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">{todayStats._count} pedidos pagos</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Receita do Mês</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(Number(monthStats._sum.total ?? 0))}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">{monthStats._count} pedidos pagos</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Em Aberto</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{pendingOrders}</p>
          <p className="text-xs text-neutral-400 mt-0.5">pedidos ativos</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Itens no Cardápio</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{menuItemCount}</p>
          <p className="text-xs text-neutral-400 mt-0.5">itens cadastrados</p>
        </div>
      </div>

      {/* Charts */}
      <AdminCharts />
    </div>
  );
}
