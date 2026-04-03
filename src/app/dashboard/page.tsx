"use client";

import { useKitchenOrders } from "@/hooks/useKitchenOrders";
import { formatCurrency, ORDER_STATUS_LABELS } from "@/lib/utils";
import { OrderStatus, OrderWithItems } from "@/types";
import { Clock, ChefHat, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const KITCHEN_COLUMNS: { status: OrderStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: "PENDING", label: "Pendente", icon: <Clock size={16} />, color: "yellow" },
  { status: "CONFIRMED", label: "Confirmado", icon: <Clock size={16} />, color: "blue" },
  { status: "IN_PREPARATION", label: "Em Preparo", icon: <ChefHat size={16} />, color: "orange" },
  { status: "READY", label: "Pronto", icon: <CheckCircle size={16} />, color: "green" },
];

const NEXT_STATUS: Record<string, OrderStatus> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "IN_PREPARATION",
  IN_PREPARATION: "READY",
  READY: "DELIVERED",
};

const STATUS_COLORS: Record<string, string> = {
  yellow: "border-yellow-400 bg-yellow-950/20",
  blue: "border-blue-400 bg-blue-950/20",
  orange: "border-orange-400 bg-orange-950/20",
  green: "border-green-400 bg-green-950/20",
};

const BADGE_COLORS: Record<string, string> = {
  yellow: "bg-yellow-400/20 text-yellow-300",
  blue: "bg-blue-400/20 text-blue-300",
  orange: "bg-orange-400/20 text-orange-300",
  green: "bg-green-400/20 text-green-300",
};

export default function KitchenPage() {
  const { orders, loading } = useKitchenOrders();

  async function advanceStatus(order: OrderWithItems) {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      toast.success(`Pedido #${order.id.slice(-6).toUpperCase()} → ${ORDER_STATUS_LABELS[nextStatus]}`);
    }
  }

  async function cancelOrder(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) toast.error(`Pedido #${orderId.slice(-6).toUpperCase()} cancelado`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        Carregando pedidos...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KITCHEN_COLUMNS.map((col) => {
        const colOrders = orders.filter((o) => o.status === col.status);
        return (
          <div
            key={col.status}
            className={`rounded-xl border-2 ${STATUS_COLORS[col.color]} p-4 flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-300 font-semibold text-sm">
                {col.icon}
                {col.label}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${BADGE_COLORS[col.color]}`}>
                {colOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {colOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-neutral-900 rounded-lg p-3 border border-neutral-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-neutral-400">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {(order.customerName || order.user?.name) && (
                    <p className="text-xs text-neutral-300 mb-2">
                      {order.user?.name || order.customerName}
                    </p>
                  )}

                  <ul className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="text-sm text-white">
                        <span className="font-bold text-brand-muted">{item.quantity}x</span>{" "}
                        {item.menuItem.name}
                        {item.notes && (
                          <p className="text-xs text-neutral-500 ml-4">{item.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <p className="text-xs text-yellow-400 bg-yellow-400/10 rounded px-2 py-1 mb-2">
                      {order.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-300">
                      {formatCurrency(order.total)}
                    </span>
                    <div className="flex gap-1">
                      {order.status !== "READY" && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-400 hover:bg-red-900 hover:text-red-300 transition"
                        >
                          Cancelar
                        </button>
                      )}
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={() => advanceStatus(order)}
                          className="text-xs px-2 py-1 rounded bg-brand hover:bg-brand-dark text-white font-medium transition"
                        >
                          {order.status === "READY" ? "Entregar" : "Avançar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {colOrders.length === 0 && (
                <p className="text-xs text-neutral-600 text-center py-4">
                  Nenhum pedido
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
