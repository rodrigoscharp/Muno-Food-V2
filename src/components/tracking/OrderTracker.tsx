"use client";

import { useOrderRealtime } from "@/hooks/useOrderRealtime";
import { formatCurrency, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { OrderStatus, OrderWithItems, PaymentMethod, PaymentStatus } from "@/types";
import { CheckCircle, Clock, ChefHat, PackageCheck, Truck } from "lucide-react";
import { LiveDeliveryTracker } from "@/components/delivery/LiveDeliveryTracker";

const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: "PENDING", label: "Recebido", icon: <Clock size={18} /> },
  { status: "CONFIRMED", label: "Confirmado", icon: <CheckCircle size={18} /> },
  { status: "IN_PREPARATION", label: "Preparando", icon: <ChefHat size={18} /> },
  { status: "READY", label: "Pronto", icon: <PackageCheck size={18} /> },
  { status: "OUT_FOR_DELIVERY", label: "Em Entrega", icon: <Truck size={18} /> },
  { status: "DELIVERED", label: "Entregue", icon: <CheckCircle size={18} /> },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "IN_PREPARATION", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

interface OrderSummary {
  id: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: Date;
  deliveryAddress?: string | null;
  deliveryType?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    notes: string | null;
    menuItem: { id: string; name: string; imageUrl: string | null };
  }[];
}

interface Props {
  orderId: string;
  initialStatus: OrderStatus;
  order: OrderSummary;
}

export function OrderTracker({ orderId, initialStatus, order }: Props) {
  const { status: realtimeStatus } = useOrderRealtime(orderId);
  const currentStatus = realtimeStatus ?? initialStatus;

  const isCancelled = currentStatus === "CANCELLED";
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-4">
      {/* Status stepper */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        {isCancelled ? (
          <div className="text-center py-4">
            <p className="text-brand font-semibold text-lg">Pedido Cancelado</p>
            <p className="text-neutral-400 text-sm mt-1">
              Entre em contato conosco se tiver dúvidas.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-neutral-200 -z-0" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-red-400 transition-all duration-700 -z-0"
              style={{
                width: `${(currentIndex / (STEPS.length - 1)) * (100 - (10 / STEPS.length) * 100)}%`,
              }}
            />

            <div className="flex justify-between relative">
              {STEPS.map((step, i) => {
                const stepIndex = STATUS_ORDER.indexOf(step.status);
                const isCompleted = stepIndex < currentIndex;
                const isCurrent = stepIndex === currentIndex;

                return (
                  <div key={step.status} className="flex flex-col items-center gap-2 w-16">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? "bg-brand border-brand text-white"
                          : isCurrent
                          ? "bg-white border-red-400 text-brand shadow-md shadow-red-100"
                          : "bg-white border-neutral-200 text-neutral-300"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={`text-xs text-center leading-tight ${
                        isCompleted || isCurrent ? "text-neutral-700 font-medium" : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isCancelled && (
          <p className="text-center text-sm font-medium text-neutral-700 mt-6">
            Status atual:{" "}
            <span className="text-brand">{ORDER_STATUS_LABELS[currentStatus]}</span>
          </p>
        )}
      </div>

      {/* Mapa ao vivo — exibido quando motoboy está a caminho */}
      {(currentStatus === "OUT_FOR_DELIVERY") && order.deliveryType === "DELIVERY" && order.deliveryAddress && (
        <LiveDeliveryTracker
          orderId={orderId}
          deliveryAddress={order.deliveryAddress}
          initialLat={order.initialLat}
          initialLng={order.initialLng}
        />
      )}

      {/* Order details */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-3">Itens do Pedido</h3>
        <ul className="space-y-2 mb-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2">
              <div className="flex gap-2 min-w-0">
                <span className="text-sm font-bold text-brand flex-shrink-0">
                  {item.quantity}x
                </span>
                <div>
                  <span className="text-sm text-neutral-800">{item.menuItem.name}</span>
                  {item.notes && (
                    <p className="text-xs text-neutral-400">{item.notes}</p>
                  )}
                </div>
              </div>
              <span className="text-sm text-neutral-600 flex-shrink-0">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-neutral-100 pt-3 flex justify-between">
          <div className="text-sm text-neutral-500">
            <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
            {order.paymentStatus === "PAID" && (
              <span className="ml-2 text-green-600 font-medium">✓ Pago</span>
            )}
          </div>
          <span className="font-bold text-neutral-900">{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
