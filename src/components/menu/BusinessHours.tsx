"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { WeekSchedule } from "@/lib/business-hours";

const DAY_INDEX_TO_KEY: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  return m === "00" ? `${parseInt(h)}h` : `${parseInt(h)}h${m}`;
}

function getStatus(schedule: WeekSchedule): { isOpen: boolean; label: string } {
  const now = new Date();
  const dayKey = DAY_INDEX_TO_KEY[now.getDay()];
  const day = schedule[dayKey];

  if (!day?.open) return { isOpen: false, label: "Fechado hoje" };

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const fromMin = parseMinutes(day.from);
  const toMin = parseMinutes(day.to);

  if (nowMin >= fromMin && nowMin < toMin) {
    const remaining = toMin - nowMin;
    if (remaining <= 60) return { isOpen: true, label: `Fecha em ${remaining} min` };
    return { isOpen: true, label: `Fecha às ${formatTime(day.to)}` };
  }
  if (nowMin < fromMin) return { isOpen: false, label: `Abre às ${formatTime(day.from)}` };
  return { isOpen: false, label: "Fechado" };
}

function groupDays(schedule: WeekSchedule) {
  const ORDERED = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const SHORT: Record<string, string> = {
    monday: "Seg", tuesday: "Ter", wednesday: "Qua",
    thursday: "Qui", friday: "Sex", saturday: "Sáb", sunday: "Dom",
  };

  const groups: { label: string; from: string; to: string; open: boolean }[] = [];
  let i = 0;
  while (i < ORDERED.length) {
    const key = ORDERED[i];
    const day = schedule[key];
    let j = i + 1;
    while (
      j < ORDERED.length &&
      schedule[ORDERED[j]]?.open === day?.open &&
      schedule[ORDERED[j]]?.from === day?.from &&
      schedule[ORDERED[j]]?.to === day?.to
    ) j++;

    const label = j - i === 1
      ? SHORT[key]
      : `${SHORT[key]} – ${SHORT[ORDERED[j - 1]]}`;

    groups.push({ label, from: day?.from ?? "11:00", to: day?.to ?? "22:00", open: day?.open ?? false });
    i = j;
  }
  return groups;
}

interface Props {
  schedule: WeekSchedule;
}

export function BusinessHours({ schedule }: Props) {
  const [status, setStatus] = useState<{ isOpen: boolean; label: string } | null>(null);

  useEffect(() => {
    setStatus(getStatus(schedule));
    const timer = setInterval(() => setStatus(getStatus(schedule)), 60_000);
    return () => clearInterval(timer);
  }, [schedule]);

  const groups = groupDays(schedule);

  return (
    <div className="sticky top-0 z-50 bg-neutral-900 text-white text-xs">
      <div className="max-w-5xl mx-auto px-4 h-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {groups.map((g) => (
            <span key={g.label} className="shrink-0 text-neutral-400">
              <span className="text-neutral-300 font-medium">{g.label}:</span>{" "}
              {g.open ? `${formatTime(g.from)} – ${formatTime(g.to)}` : "Fechado"}
            </span>
          ))}
        </div>

        {status && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? "bg-green-400 animate-pulse" : "bg-neutral-500"}`} />
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
