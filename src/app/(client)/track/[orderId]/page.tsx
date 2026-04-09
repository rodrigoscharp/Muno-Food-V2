import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { OrderTracker } from "@/components/tracking/OrderTracker";
import { PixPayment } from "@/components/tracking/PixPayment";
import { LoginPromptBanner } from "@/components/tracking/LoginPromptBanner";

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ pix?: string; copy?: string; payment?: string }>;
}

export default async function TrackPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { pix, copy, payment } = await searchParams;
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { menuItem: true } },
      deliveryTracking: true,
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">
          Pedido #{orderId.slice(-6).toUpperCase()}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">Acompanhe seu pedido em tempo real</p>
      </div>

      {/* Login prompt — exibido apenas para usuários não autenticados */}
      {!isLoggedIn && <LoginPromptBanner orderId={orderId} />}

      {/* Pix payment display */}
      {order.paymentMethod === "PIX" && order.paymentStatus !== "PAID" && pix && (
        <PixPayment qrCodeBase64={pix} copyPaste={copy ?? ""} />
      )}

      {/* Payment result feedback */}
      {payment === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-green-700 font-medium">Pagamento aprovado!</p>
        </div>
      )}
      {payment === "failure" && (
        <div className="bg-brand-light border border-brand-muted rounded-xl p-4 mb-6 text-center">
          <p className="text-red-700 font-medium">Pagamento não aprovado. Tente novamente.</p>
        </div>
      )}

      {/* Real-time order tracker */}
      <OrderTracker
        orderId={orderId}
        initialStatus={order.status}
        order={{
          id: order.id,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          total: Number(order.total),
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress,
          deliveryType: order.deliveryType,
          initialLat: order.deliveryTracking?.lat ?? null,
          initialLng: order.deliveryTracking?.lng ?? null,
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            notes: item.notes,
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              imageUrl: item.menuItem.imageUrl,
            },
          })),
        }}
      />
    </div>
  );
}
