import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { MotoboyDeliveryClient } from "@/components/motoboy/MotoboyDeliveryClient";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function MotoboyDeliveryPage({ params }: Props) {
  const { orderId } = await params;
  const session = await auth();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
      deliveryTracking: true,
    },
  });

  if (!order) notFound();

  if (!session?.user || (session.user.role !== "MOTOBOY" && session.user.role !== "ADMIN")) {
    redirect("/motoboy/login");
  }

  if (order.motoboyId !== session.user.id) {
    redirect("/motoboy/pedidos");
  }

  return (
    <MotoboyDeliveryClient
      orderId={order.id}
      deliveryAddress={order.deliveryAddress ?? "Endereço não informado"}
      customerName={order.customerName ?? "Cliente"}
      customerPhone={order.customerPhone}
      total={Number(order.total)}
      items={order.items.map((i) => ({ name: i.menuItem.name, quantity: i.quantity }))}
      initialLat={order.deliveryTracking?.lat ?? null}
      initialLng={order.deliveryTracking?.lng ?? null}
    />
  );
}
