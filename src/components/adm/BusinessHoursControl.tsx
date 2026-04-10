"use client";

import { useState, useTransition } from "react";
import { Clock, Check } from "lucide-react";
import { toast } from "sonner";

export interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

export type WeekSchedule = Record<string, DaySchedule>;

const DAYS: { key: string; label: string }[] = [
  { key: "monday",    label: "Segunda" },
  { key: "tuesday",   label: "Terça"   },
  { key: "wednesday", label: "Quarta"  },
  { key: "thursday",  label: "Quinta"  },
  { key: "friday",    label: "Sexta"   },
  { key: "saturday",  label: "Sábado"  },
  { key: "sunday",    label: "Domingo" },
];

interface Props {
  initialSchedule: WeekSchedule;
}

export function BusinessHoursControl({ initialSchedule }: Props) {
  const [schedule, setSchedule] = useState<WeekSchedule>(initialSchedule);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleDay(key: string) {
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], open: !prev[key].open },
    }));
    setSaved(false);
  }

  function setTime(key: string, field: "from" | "to", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    setSaved(false);
  }

  async function save() {
    startTransition(async () => {
      const res = await fetch("/api/settings/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });

      if (res.ok) {
        setSaved(true);
        toast.success("Horários salvos com sucesso");
      } else {
        toast.error("Erro ao salvar horários");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={15} className="text-neutral-400" />
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">
          Horário de Funcionamento
        </p>
      </div>

      <div className="space-y-3">
        {DAYS.map(({ key, label }) => {
          const day = schedule[key];
          return (
            <div key={key} className="grid grid-cols-[36px_80px_1fr] items-center gap-3">
              {/* Toggle aberto/fechado */}
              <button
                onClick={() => toggleDay(key)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  day.open ? "bg-brand" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    day.open ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>

              {/* Nome do dia */}
              <span className={`text-sm font-medium ${day.open ? "text-neutral-800" : "text-neutral-400"}`}>
                {label}
              </span>

              {/* Horários */}
              {day.open ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.from}
                    onChange={(e) => setTime(key, "from", e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <span className="text-xs text-neutral-400 shrink-0">até</span>
                  <input
                    type="time"
                    value={day.to}
                    onChange={(e) => setTime(key, "to", e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              ) : (
                <span className="text-xs text-neutral-400 italic">Fechado</span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={pending || saved}
        className="mt-5 w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition"
      >
        {saved ? (
          <><Check size={14} /> Salvo</>
        ) : pending ? (
          "Salvando..."
        ) : (
          "Salvar horários"
        )}
      </button>
    </div>
  );
}
