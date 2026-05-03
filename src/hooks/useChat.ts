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

// Cache em memória — persiste enquanto a aba estiver aberta.
// Evita re-fetch ao trocar de chat e retornar ao mesmo.
const messageCache = new Map<string, ChatMessageData[]>();

export async function prefetchChat(orderId: string): Promise<void> {
  if (messageCache.has(orderId)) return; // já em cache
  try {
    const res = await fetch(`/api/orders/${orderId}/chat`);
    if (!res.ok) return;
    const data: ChatMessageData[] = await res.json();
    messageCache.set(orderId, data);
  } catch {
    // silencia erros de prefetch
  }
}

export function useChat(orderId: string) {
  const cached = messageCache.get(orderId);
  const [messages, setMessages] = useState<ChatMessageData[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [sending, setSending] = useState(false);
  const seenIds = useRef<Set<string>>(new Set(cached?.map((m) => m.id)));

  useEffect(() => {
    let cancelled = false;

    // Se já tem cache, mostra imediatamente e faz refresh silencioso em background
    if (cached) setLoading(false);

    fetch(`/api/orders/${orderId}/chat`)
      .then((r) => r.json())
      .then((data: ChatMessageData[]) => {
        if (cancelled) return;
        messageCache.set(orderId, data);
        data.forEach((m) => seenIds.current.add(m.id));
        setMessages(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

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
          setMessages((prev) => {
            const updated = [...prev, msg];
            messageCache.set(orderId, updated);
            return updated;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      const newMsg: ChatMessageData = await res.json();
      if (!seenIds.current.has(newMsg.id)) {
        seenIds.current.add(newMsg.id);
        setMessages((prev) => {
          const updated = [...prev, newMsg];
          messageCache.set(orderId, updated);
          return updated;
        });
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
