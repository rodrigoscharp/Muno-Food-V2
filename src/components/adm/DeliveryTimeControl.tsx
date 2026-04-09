"use client";

import { useState, useTransition } from "react";
import { Clock, Minus, Plus, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialMinutes: number;
}

export function DeliveryTimeControl({ initialMinutes }: Props) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function adjust(delta: number) {
    setMinutes((prev) => Math.min(180, Math.max(5, prev + delta)));
    setSaved(false);
  }

  async function save() {
    startTransition(async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      });

      if (res.ok) {
        setSaved(true);
        toast.success(`Previsão atualizada para ${minutes} minutos`);
      } else {
        toast.error("Erro ao salvar");
      }
    });
  }

  const label =
    minutes < 60
      ? `${minutes} min`
      : `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? ` ${minutes % 60}min` : ""}`;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Clock size={15} className="text-neutral-400" />
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">
          Previsão de Entrega
        </p>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => adjust(-5)}
          disabled={minutes <= 5}
          className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <Minus size={14} />
        </button>

        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-neutral-900">{label}</p>
          <p className="text-xs text-neutral-400 mt-0.5">tempo estimado</p>
        </div>

        <button
          onClick={() => adjust(5)}
          disabled={minutes >= 180}
          className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <Plus size={14} />
        </button>
      </div>

      <button
        onClick={save}
        disabled={pending || saved}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition"
      >
        {saved ? (
          <>
            <Check size={14} /> Salvo
          </>
        ) : pending ? (
          "Salvando..."
        ) : (
          "Salvar previsão"
        )}
      </button>

      <p className="text-xs text-neutral-400 text-center mt-2">
        Aplica a todos os novos pedidos
      </p>
    </div>
  );
}
