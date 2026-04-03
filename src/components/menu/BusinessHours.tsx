"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const HOURS = [
  { days: [1, 2, 3, 4, 5], label: "Seg – Sex", open: 11, close: 22 },
  { days: [6, 0],           label: "Sáb – Dom", open: 11, close: 23 },
];

function getStatus(): { isOpen: boolean; label: string } {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;

  const slot = HOURS.find((h) => h.days.includes(day));
  if (!slot) return { isOpen: false, label: "Fechado hoje" };

  if (hour >= slot.open && hour < slot.close) {
    const closesIn = slot.close - hour;
    if (closesIn <= 1) {
      const mins = Math.round(closesIn * 60);
      return { isOpen: true, label: `Fecha em ${mins} min` };
    }
    return { isOpen: true, label: `Fecha às ${slot.close}h` };
  }

  if (hour < slot.open) {
    return { isOpen: false, label: `Abre às ${slot.open}h` };
  }
  return { isOpen: false, label: "Fechado" };
}

export function BusinessHours() {
  const [status, setStatus] = useState<{ isOpen: boolean; label: string } | null>(null);

  useEffect(() => {
    setStatus(getStatus());
    const timer = setInterval(() => setStatus(getStatus()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="sticky top-0 z-50 bg-neutral-900 text-white text-xs">
      <div className="max-w-5xl mx-auto px-4 h-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {HOURS.map((h) => (
            <span key={h.label} className="shrink-0 text-neutral-400">
              <span className="text-neutral-300 font-medium">{h.label}:</span>{" "}
              {h.open}h – {h.close}h
            </span>
          ))}
        </div>

        {status && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status.isOpen ? "bg-green-400 animate-pulse" : "bg-neutral-500"
              }`}
            />
            <Clock size={11} className={status.isOpen ? "text-green-400" : "text-neutral-500"} />
            <span className={status.isOpen ? "text-green-400 font-medium" : "text-neutral-500"}>
              {status.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
