import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mp } from "@/lib/mercadopago";
import { Payment } from "mercadopago";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // Only process payment notifications
    if (type !== "payment" || !data?.id) {
      return NextResponse.json({ received: true });
    }

    // Fetch payment details from Mercado Pago
    const paymentApi = new Payment(mp);
    const payment = await paymentApi.get({ id: data.id });

    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ received: true });

    const status = payment.status;

    if (status === "approved") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          mpPaymentId: String(payment.id),
        },
      });
    } else if (status === "rejected" || status === "cancelled") {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "UNPAID" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

// MP sends GET to validate the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
