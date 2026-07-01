import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaUnscoped } from "@/lib/prisma";
import { runWithTenant } from "@/lib/tenant-context";
import { getPaymentProvider } from "@/lib/payments/factory";
import { InvalidWebhookSignatureError } from "@/lib/payments/types";
import { broadcastTenantEvent } from "@/lib/realtime";
import { extractErrorMessage } from "@/lib/error-message";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    // Hoje só existe o provider Mercado Pago; quando outros providers
    // existirem, o tipo de evento no payload decide qual usar.
    let result;
    try {
      result = await getPaymentProvider().handleWebhook(body, signature, requestId);
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
      }
      throw err;
    }
    if (!result) return NextResponse.json({ received: true });

    // O webhook não vem pelo subdomínio do tenant (é a Mercado Pago batendo
    // numa URL global), então descobrimos o tenant a partir do próprio
    // pedido antes de entrar no contexto normal.
    const orderMeta = await prismaUnscoped.order.findUnique({
      where: { id: result.orderId },
      select: { tenantId: true },
    });
    if (!orderMeta) return NextResponse.json({ received: true });

    const tenantId = orderMeta.tenantId;

    await runWithTenant(tenantId, async () => {
      let order;

      if (result.status === "approved") {
        order = await prisma.order.update({
          where: { id: result.orderId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            mpPaymentId: result.providerPaymentId,
          },
        });
      } else if (result.status === "rejected" || result.status === "cancelled") {
        order = await prisma.order.update({
          where: { id: result.orderId },
          data: { paymentStatus: "UNPAID" },
        });
      } else if (result.status === "refunded") {
        order = await prisma.order.update({
          where: { id: result.orderId },
          data: { paymentStatus: "REFUNDED" },
        });
      }

      if (order) {
        await broadcastTenantEvent(tenantId, `order:${result.orderId}`, "order-updated", {
          status: order.status,
          updatedAt: order.updatedAt.toISOString(),
          estimatedDeliveryAt: order.estimatedDeliveryAt?.toISOString() ?? null,
        });
        await broadcastTenantEvent(tenantId, "kitchen-orders", "order-updated", { orderId: result.orderId });
      }
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    // Só a mensagem — nunca o objeto de erro cru (pode embutir o access
    // token usado pra consultar o pagamento).
    console.error("Webhook error:", extractErrorMessage(err));
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

// MP sends GET to validate the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
