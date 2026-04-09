"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DeliveryTracking } from "@/types";

export function useDeliveryTracking(orderId: string) {
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);

  useEffect(() => {
    // Busca posição inicial
    fetch(`/api/motoboy/orders/${orderId}/location`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setTracking(data);
      })
      .catch(() => {});

    // Subscreve atualizações em tempo real
    const channel = supabase
      .channel(`delivery-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "DeliveryTracking",
          filter: `orderId=eq.${orderId}`,
        },
        (payload) => {
          const data = payload.new as DeliveryTracking;
          if (data?.lat && data?.lng) {
            setTracking(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return tracking;
}
