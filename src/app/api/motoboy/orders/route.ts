import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/motoboy/orders — lista pedidos READY com entrega disponíveis
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MOTOBOY" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      status: "READY",
      deliveryType: "DELIVERY",
      motoboyId: null,
    },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(orders);
}
