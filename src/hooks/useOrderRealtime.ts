"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import { toast } from "sonner";

export function useOrderRealtime(orderId: string) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState<Date | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as OrderStatus;
          setStatus(newStatus);
          setUpdatedAt(payload.new.updatedAt as string);

          // Atualiza previsão se o backend calculou uma nova ETA pela rota
          if (payload.new.estimatedDeliveryAt) {
            setEstimatedDeliveryAt(new Date(payload.new.estimatedDeliveryAt as string));
          }

          toast.info(`Pedido atualizado: ${ORDER_STATUS_LABELS[newStatus]}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { status, updatedAt, estimatedDeliveryAt };
}
