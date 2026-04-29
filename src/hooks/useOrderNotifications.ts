"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

export interface OrderNotification {
  id: string;
  orderId: string;
  status: OrderStatus;
  message: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = "muno-order-notifications";
const MAX_NOTIFICATIONS = 20;

function loadFromStorage(): OrderNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OrderNotification[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: OrderNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function useOrderNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<OrderNotification[]>(loadFromStorage);
  const userId = session?.user?.id;

  const addNotification = useCallback((orderId: string, status: OrderStatus) => {
    const notification: OrderNotification = {
      id: `${orderId}-${status}-${Date.now()}`,
      orderId,
      status,
      message: ORDER_STATUS_LABELS[status] ?? status,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      // Evita duplicata do mesmo pedido + status
      const exists = prev.some((n) => n.orderId === orderId && n.status === status);
      if (exists) return prev;
      const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`order-notif-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          // Filtra client-side pelo userId do pedido
          const rowUserId = row.userId ?? row.user_id;
          if (rowUserId !== userId) return;
          addNotification(row.id as string, row.status as OrderStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addNotification]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveToStorage([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllAsRead, markAsRead, clearAll };
}
