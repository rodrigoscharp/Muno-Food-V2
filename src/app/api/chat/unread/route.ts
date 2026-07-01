import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getTenantIdFromRequest, withTenant } from "@/lib/api";

/**
 * GET /api/chat/unread?since=<ISO timestamp>
 * Retorna mensagens de ADMIN (restaurante) enviadas após `since`
 * nos pedidos ativos do usuário autenticado.
 */
export async function GET(req: NextRequest) {
  const tenantId = getTenantIdFromRequest(req);
  if (!tenantId) return apiError("Tenant não identificado", 400);

  return withTenant(tenantId, async () => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const since = req.nextUrl.searchParams.get("since");

    const messages = await prisma.chatMessage.findMany({
      where: {
        senderRole: "ADMIN",
        order: { userId: session.user.id },
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        orderId: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json(messages);
  });
}
