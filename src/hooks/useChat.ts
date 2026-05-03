"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ChatMessageData {
  id: string;
  orderId: string;
  senderRole: string;
  senderId: string | null;
  senderName: string | null;
  content: string;
  createdAt: string;
}

export function useChat(orderId: string) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  // Busca inicial
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/orders/${orderId}/chat`)
      .then((r) => r.json())
      .then((data: ChatMessageData[]) => {
        if (cancelled) return;
        data.forEach((m) => seenIds.current.add(m.id));
        setMessages(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ChatMessage",
          filter: `orderId=eq.${orderId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessageData;
          if (seenIds.current.has(msg.id)) return;
          seenIds.current.add(msg.id);
          setMessages((prev) => [...prev, msg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function sendMessage(content: string): Promise<boolean> {
    if (!content.trim()) return false;
    setSending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return false;
      // Atualização otimista: adiciona a mensagem imediatamente sem esperar o realtime
      const newMsg: ChatMessageData = await res.json();
      if (!seenIds.current.has(newMsg.id)) {
        seenIds.current.add(newMsg.id);
        setMessages((prev) => [...prev, newMsg]);
      }
      return true;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  }

  return { messages, loading, sending, sendMessage };
}
