import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ orderId: string }>;
}

// POST /api/motoboy/orders/[orderId]/accept — motoboy aceita o pedido
export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MOTOBOY" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (order.status !== "READY" || order.deliveryType !== "DELIVERY") {
    return NextResponse.json({ error: "Pedido não disponível para entrega" }, { status: 400 });
  }

  if (order.motoboyId) {
    return NextResponse.json({ error: "Pedido já foi aceito por outro motoboy" }, { status: 409 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "OUT_FOR_DELIVERY",
      motoboyId: session.user.id,
    },
  });

  return NextResponse.json(updated);
}
