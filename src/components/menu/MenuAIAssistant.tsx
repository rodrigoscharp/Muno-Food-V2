"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { Sparkles, X, Send, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { triggerCartFly } from "@/components/menu/CartFlyAnimation";
import { formatCurrency } from "@/lib/utils";
import { MenuItemWithCategory } from "@/types";

const QUICK_OPTIONS = [
  { label: "Pouca fome", emoji: "😐", color: "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50" },
  { label: "Com fome", emoji: "😋", color: "border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50" },
  { label: "Faminto", emoji: "🤤", color: "border-orange-400 text-orange-700 hover:border-orange-500 hover:bg-orange-50" },
  { label: "Esfomeado", emoji: "🔥", color: "bg-brand text-white hover:bg-brand-dark border-brand" },
  { label: "Sou vegano", emoji: "🌱", color: "border-green-400 text-green-700 hover:border-green-500 hover:bg-green-50" },
  { label: "Sem glúten", emoji: "🌾", color: "border-yellow-400 text-yellow-700 hover:border-yellow-500 hover:bg-yellow-50" },
  { label: "Sem lactose", emoji: "🥛", color: "border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50" },
  { label: "Algo leve", emoji: "🥗", color: "border-teal-300 text-teal-700 hover:border-teal-400 hover:bg-teal-50" },
] as const;

type Phase = "idle" | "loading" | "result";

interface MenuAIAssistantProps {
  menuItems: MenuItemWithCategory[];
  restaurantOpen: boolean;
}

function RecommendedItemCard({
  item,
  restaurantOpen,
}: {
  item: MenuItemWithCategory;
  restaurantOpen: boolean;
}) {
  const addItem = useCart((s) => s.addItem);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleAdd() {
    addItem({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl }, 1);
    if (btnRef.current) triggerCartFly(btnRef.current);
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-neutral-200 p-3 min-w-0">
      <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-neutral-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 leading-tight truncate">{item.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{item.category.name}</p>
        <p className="text-sm font-bold text-brand mt-0.5">{formatCurrency(item.price)}</p>
      </div>
      <button
        ref={btnRef}
        onClick={handleAdd}
        disabled={!restaurantOpen}
        title={!restaurantOpen ? "Restaurante fechado no momento" : undefined}
        className="shrink-0 px-3 py-1.5 rounded-full bg-brand hover:bg-brand-dark active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all duration-150 shadow-sm"
      >
        Adicionar
      </button>
    </div>
  );
}

export function MenuAIAssistant({ menuItems, restaurantOpen }: MenuAIAssistantProps) {
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [customMessage, setCustomMessage] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);

  useEffect(() => {
    if (localStorage.getItem("muno-ai-dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("muno-ai-dismissed", "1");
  }

  function handleReopen() {
    setDismissed(false);
    localStorage.removeItem("muno-ai-dismissed");
  }

  async function askAI(message: string) {
    setPhase("loading");
    setStreamedText("");
    setRecommendedIds([]);

    const menuContext = menuItems.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price,
      category: i.category.name,
    }));

    try {
      const res = await fetch("/api/ai/menu-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, menuContext }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erro ao consultar o assistente");
        setPhase("idle");
        return;
      }

      setStreamedText(data.text ?? "");
      setRecommendedIds(data.ids ?? []);
      setPhase("result");
    } catch (err) {
      console.error(err);
      toast.error("Não consegui me conectar agora. Tente de novo!");
      setPhase("idle");
    }
  }

  function handleQuickOption(label: string, emoji: string) {
    askAI(`${label} ${emoji}`);
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customMessage.trim()) return;
    askAI(customMessage.trim());
    setCustomMessage("");
  }

  function handleReset() {
    setPhase("idle");
    setStreamedText("");
    setRecommendedIds([]);
  }

  const displayText = streamedText.replace(/<recommendations>[\s\S]*?<\/recommendations>/g, "").trim();
  const recommendedItems = menuItems.filter((item) => recommendedIds.includes(item.id));

  if (dismissed) {
    return (
      <div className="flex justify-center pb-2">
        <button
          onClick={handleReopen}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-brand transition-colors"
        >
          <Sparkles size={13} />
          Assistente IA
          <ChevronDown size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 leading-none">Muno, o assistente</p>
            <p className="text-xs text-neutral-400 mt-0.5">Deixa eu te ajudar a escolher!</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
          aria-label="Fechar assistente"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {phase === "idle" && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 font-medium">Me conta o que você precisa! 👀</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_OPTIONS.map(({ label, emoji, color }) => (
                <button
                  key={label}
                  onClick={() => handleQuickOption(label, emoji)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 active:scale-95 ${color}`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <div className="h-px flex-1 bg-neutral-100" />
              <span>ou descreva</span>
              <div className="h-px flex-1 bg-neutral-100" />
            </div>
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Ex: sou vegano, sem glúten, quero algo leve..."
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-neutral-200 outline-none focus:border-brand transition-colors bg-neutral-50 placeholder:text-neutral-300"
              />
              <button
                type="submit"
                disabled={!customMessage.trim()}
                className="px-3 py-2 rounded-xl bg-brand hover:bg-brand-dark active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-150 shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {(phase === "loading" || phase === "result") && (
          <div className="space-y-4">
            {/* AI text */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={13} className="text-white" />
              </div>
              <div className="flex-1">
                {displayText ? (
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {displayText}
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Recommended items */}
            {phase === "result" && recommendedItems.length > 0 && (
              <div className="space-y-2 pt-1">
                {recommendedItems.map((item) => (
                  <RecommendedItemCard key={item.id} item={item} restaurantOpen={restaurantOpen} />
                ))}
              </div>
            )}

            {/* Reset button */}
            {phase === "result" && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleReset}
                  className="text-xs text-neutral-400 hover:text-brand transition-colors"
                >
                  Perguntar de novo →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
