import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { menuItem: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  return NextResponse.json(order);
}

const updateSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "IN_PREPARATION", "READY", "DELIVERED", "CANCELLED"])
    .optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED"]).optional(),
  mpPaymentId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "KITCHEN")
  ) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: parsed.data,
    include: {
      items: { include: { menuItem: true } },
    },
  });

  return NextResponse.json(order);
}
