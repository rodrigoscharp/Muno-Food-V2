"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useChat, type ChatMessageData } from "@/hooks/useChat";

export interface QuickReply {
  label: string;
  message: string;
}

interface Props {
  orderId: string;
  currentRole: "CUSTOMER" | "ADMIN";
  currentName: string;
  quickReplies?: QuickReply[];
}

function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDayLabel(date: Date | string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(d);
}

export function ChatWindow({ orderId, currentRole, quickReplies }: Props) {
  const { messages, loading, sending, sendMessage } = useChat(orderId);
  const [text, setText] = useState("");
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasCustomerMessage = messages.some((m) => m.senderRole === "CUSTOMER");
  const showQuickReplies =
    currentRole === "CUSTOMER" &&
    !!quickReplies?.length &&
    !hasCustomerMessage &&
    !loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const ok = await sendMessage(text.trim());
    if (ok) {
      setText("");
      textareaRef.current?.focus();
    }
  }

  async function handleQuickReply(qr: QuickReply) {
    if (sending) return;
    setActivatingId(qr.message);
    await sendMessage(qr.message);
    setActivatingId(null);
  }

  // Agrupa mensagens por dia para separadores de data
  const grouped: { dayLabel: string; msgs: ChatMessageData[] }[] = [];
  for (const msg of messages) {
    const label = formatDayLabel(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.dayLabel === label) {
      last.msgs.push(msg);
    } else {
      grouped.push({ dayLabel: label, msgs: [msg] });
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#f0ece8" }}>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-neutral-400" />
          </div>
        ) : messages.length === 0 && !showQuickReplies ? (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-2">
            <p className="text-sm text-neutral-400 text-center">
              Nenhuma mensagem ainda.
            </p>
          </div>
        ) : (
          grouped.map(({ dayLabel, msgs }) => (
            <div key={dayLabel}>
              {/* Separador de dia */}
              <div className="flex items-center justify-center my-4">
                <span className="text-[11px] font-medium text-neutral-500 bg-white/70 px-3 py-1 rounded-full shadow-sm">
                  {dayLabel}
                </span>
              </div>
              <div className="space-y-1">
                {msgs.map((msg, i) => {
                  const isMine = msg.senderRole === currentRole;
                  const next = msgs[i + 1];
                  const isLast = !next || next.senderRole !== msg.senderRole;
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={isMine}
                      isLast={isLast}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {showQuickReplies && (
        <div className="px-4 pb-3 pt-2 bg-white/80 border-t border-neutral-200">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
            Selecione sua situação
          </p>
          <div className="flex flex-col gap-1.5">
            {quickReplies!.map((qr) => {
              const [emoji, ...rest] = qr.label.split(" ");
              const isActivating = activatingId === qr.message;
              return (
                <button
                  key={qr.message}
                  onClick={() => handleQuickReply(qr)}
                  disabled={sending}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl bg-white border border-neutral-200 hover:border-brand/50 hover:shadow-sm active:scale-[0.98] transition-all text-sm text-neutral-800 disabled:opacity-60"
                >
                  {isActivating ? (
                    <Loader2 size={16} className="animate-spin text-brand shrink-0" />
                  ) : (
                    <span className="text-lg leading-none shrink-0">{emoji}</span>
                  )}
                  <span className="font-medium leading-snug">{rest.join(" ")}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-3 bg-white border-t border-neutral-200 flex items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Auto-resize
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder={showQuickReplies ? "Ou escreva sua mensagem..." : "Mensagem..."}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition bg-neutral-50 leading-relaxed"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-brand text-white disabled:opacity-40 transition hover:opacity-90 active:scale-95 shrink-0"
        >
          {sending && !activatingId ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={15} strokeWidth={2.5} />
          )}
        </button>
      </form>
    </div>
  );
}

function MessageBubble({
  msg,
  isMine,
  isLast,
}: {
  msg: ChatMessageData;
  isMine: boolean;
  isLast: boolean;
}) {
  return (
    <div className={`flex items-end gap-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
      {/* Avatar restaurante (lado esquerdo, só na última do grupo) */}
      {!isMine && (
        <div className="w-6 shrink-0">
          {isLast && (
            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-[10px] text-white font-bold">
              R
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col ${isMine ? "items-end" : "items-start"} gap-0.5`}>
        {/* Nome do remetente (apenas admin, apenas no primeiro do grupo) */}
        {!isMine && isLast && (
          <span className="text-[11px] font-semibold text-brand px-1">
            {msg.senderRole === "ADMIN" ? "Restaurante" : (msg.senderName ?? "Cliente")}
          </span>
        )}

        <div
          className={`relative px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
            isMine
              ? "bg-brand text-white rounded-[18px] rounded-br-[4px]"
              : "bg-white text-neutral-800 rounded-[18px] rounded-bl-[4px]"
          }`}
        >
          {msg.content}
        </div>

        {isLast && (
          <span className="text-[10px] text-neutral-400 px-1">
            {formatTime(msg.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}
