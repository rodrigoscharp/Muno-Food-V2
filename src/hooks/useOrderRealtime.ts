"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { OrderStatus } from "@/types";

export function useOrderRealtime(orderId: string) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

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
          setStatus(payload.new.status as OrderStatus);
          setUpdatedAt(payload.new.updatedAt as string);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { status, updatedAt };
}
