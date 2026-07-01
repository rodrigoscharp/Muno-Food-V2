import { prismaUnscoped } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminChatsClient } from "./AdminChatsClient";

export default async function AdminChatsPage() {
  const session = await auth();

  const ordersWithChats = await prismaUnscoped.order.findMany({
    where: { tenantId: session!.user.tenantId, chatMessages: { some: {} } },
    include: {
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
    // status já vem pelo include implícito do select *
  });

  return (
    <AdminChatsClient
      orders={ordersWithChats}
      adminName={session?.user?.name ?? "Admin"}
      tenantId={session!.user.tenantId}
    />
  );
}
