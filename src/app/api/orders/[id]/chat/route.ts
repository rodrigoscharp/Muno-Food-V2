import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getTenantIdFromRequest, withTenant } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const tenantId = getTenantIdFromRequest(req);
  if (!tenantId) return apiError("Tenant não identificado", 400);

  return withTenant(tenantId, async () => {
    const { id } = await params;
    const session = await auth();

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    // Apenas o dono do pedido ou um admin podem ler o chat
    const isAdmin = session?.user.role === "ADMIN";
    const isOwner = session?.user.id === order.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const tenantId = getTenantIdFromRequest(req);
  if (!tenantId) return apiError("Tenant não identificado", 400);

  return withTenant(tenantId, async () => {
    const { id } = await params;
    const session = await auth();

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const isAdmin = session?.user.role === "ADMIN";
    const isOwner = session?.user.id === order.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const content = (body.content ?? "").trim();

    if (!content) {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        tenantId,
        orderId: id,
        senderRole: isAdmin ? "ADMIN" : "CUSTOMER",
        senderId: session?.user.id ?? null,
        senderName: session?.user.name ?? null,
        content,
      },
    });

    return NextResponse.json(message, { status: 201 });
  });
}
