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
  pending?: boolean;
  failed?: boolean;
}

const POLL_INTERVAL = 4000; // ms — garante recebimento mesmo sem realtime

// Cache em memória por orderId
const messageCache = new Map<string, ChatMessageData[]>();

export async function prefetchChat(orderId: string): Promise<void> {
  if (messageCache.has(orderId)) return;
  try {
    const res = await fetch(`/api/orders/${orderId}/chat`);
    if (!res.ok) return;
    const data: ChatMessageData[] = await res.json();
    messageCache.set(orderId, data);
  } catch {
    // silencia
  }
}

export function useChat(orderId: string) {
  const cached = messageCache.get(orderId);
  const [messages, setMessages] = useState<ChatMessageData[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [sending, setSending] = useState(false);
  const seenIds = useRef<Set<string>>(new Set(cached?.map((m) => m.id)));

  // Faz fetch e integra com estado atual (preserva mensagens pending)
  async function fetchMessages(silent = false) {
    try {
      const res = await fetch(`/api/orders/${orderId}/chat`);
      if (!res.ok) return;
      const data: ChatMessageData[] = await res.json();

      data.forEach((m) => seenIds.current.add(m.id));
      messageCache.set(orderId, data);

      setMessages((prev) => {
        const pending = prev.filter((m) => m.pending || m.failed);
        return [...data, ...pending];
      });
    } catch {
      // silencia erros de polling
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Fetch inicial
  useEffect(() => {
    if (cached) setLoading(false);
    fetchMessages(!!cached);
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling — fonte principal de novas mensagens
  useEffect(() => {
    const timer = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase realtime — bônus se a tabela tiver replication habilitada no Supabase
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ChatMessage" },
        (payload) => {
          const msg = payload.new as ChatMessageData;
          // Filtra client-side (evita problemas com casing do nome da coluna)
          if (msg.orderId !== orderId) return;
          if (seenIds.current.has(msg.id)) return;
          seenIds.current.add(msg.id);
          setMessages((prev) => {
            const updated = [...prev.filter((m) => !m.pending && !m.failed), msg];
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

    // Mensagem otimista — aparece imediatamente
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessageData = {
      id: tempId,
      orderId,
      senderRole: "CUSTOMER",
      senderId: null,
      senderName: null,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    seenIds.current.add(tempId);
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error();

      const confirmed: ChatMessageData = await res.json();

      seenIds.current.delete(tempId);
      seenIds.current.add(confirmed.id);

      setMessages((prev) => {
        const updated = prev.map((m) => m.id === tempId ? confirmed : m);
        messageCache.set(orderId, updated.filter((m) => !m.pending && !m.failed));
        return updated;
      });

      return true;
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, pending: false, failed: true } : m)
      );
      return false;
    } finally {
      setSending(false);
    }
  }

  return { messages, loading, sending, sendMessage };
}
