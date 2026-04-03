import { prisma } from "@/lib/prisma";
import { AdminOrdersTable } from "@/components/adm/AdminOrdersTable";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: { include: { menuItem: true } },
      user: { select: { name: true, email: true } },
    },
  });

  const serialized = orders.map((o) => ({
    ...o,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
    })),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Pedidos</h1>
      <AdminOrdersTable orders={serialized} />
    </div>
  );
}
