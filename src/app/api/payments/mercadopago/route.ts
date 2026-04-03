import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mp } from "@/lib/mercadopago";
import { Payment, Preference } from "mercadopago";
import { z } from "zod";

const schema = z.object({
  orderId: z.string(),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD"]),
  customerName: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { orderId, paymentMethod, customerName } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { menuItem: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    if (paymentMethod === "PIX") {
      const paymentApi = new Payment(mp);
      const pixPayment = await paymentApi.create({
        body: {
          transaction_amount: Number(order.total),
          description: `Pedido MUNO #${order.id.slice(-6).toUpperCase()}`,
          payment_method_id: "pix",
          payer: {
            email: "cliente@muno.com",
            first_name: customerName.split(" ")[0],
            last_name: customerName.split(" ").slice(1).join(" ") || ".",
          },
          external_reference: order.id,
          notification_url: `${appUrl}/api/payments/webhook`,
        },
      });

      const pixData = pixPayment.point_of_interaction?.transaction_data;

      await prisma.order.update({
        where: { id: orderId },
        data: { mpPaymentId: String(pixPayment.id) },
      });

      return NextResponse.json({
        pixQrCode: pixData?.qr_code_base64,
        pixCopyPaste: pixData?.qr_code,
        paymentId: pixPayment.id,
      });
    }

    // Credit card: create a Preference (redirect to MP checkout)
    const preferenceApi = new Preference(mp);
    const preference = await preferenceApi.create({
      body: {
        items: order.items.map((item) => ({
          id: item.menuItemId,
          title: item.menuItem.name,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: "BRL",
        })),
        payer: { name: customerName },
        external_reference: order.id,
        notification_url: `${appUrl}/api/payments/webhook`,
        back_urls: {
          success: `${appUrl}/track/${order.id}?payment=success`,
          failure: `${appUrl}/track/${order.id}?payment=failure`,
          pending: `${appUrl}/track/${order.id}?payment=pending`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({
      checkoutUrl: preference.init_point,
      preferenceId: preference.id,
    });
  } catch (err) {
    console.error("Mercado Pago error:", err);
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 });
  }
}
