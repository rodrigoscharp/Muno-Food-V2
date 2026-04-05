"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { OrderWithItems } from "@/types";

const POLL_INTERVAL = 30_000; // fallback polling a cada 30s

export function useKitchenOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const realtimeActive = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?kitchen=true");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setError(null);
      } else {
        setError("Erro ao carregar pedidos");
      }
    } catch {
      setError("Sem conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Tenta Realtime — se falhar, polling assume
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Order" },
        () => fetchOrders()
      )
      .subscribe((status) => {
        realtimeActive.current = status === "SUBSCRIBED";
      });

    // Polling de segurança: atualiza a cada 30s independente do Realtime
    const poll = setInterval(() => {
      fetchOrders();
    }, POLL_INTERVAL);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
