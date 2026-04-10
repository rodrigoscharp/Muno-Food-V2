import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface DaySchedule {
  open: boolean;
  from: string; // "HH:MM"
  to: string;   // "HH:MM"
}

export type WeekSchedule = Record<string, DaySchedule>;

export const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export const DEFAULT_SCHEDULE: WeekSchedule = {
  monday:    { open: true, from: "11:00", to: "22:00" },
  tuesday:   { open: true, from: "11:00", to: "22:00" },
  wednesday: { open: true, from: "11:00", to: "22:00" },
  thursday:  { open: true, from: "11:00", to: "22:00" },
  friday:    { open: true, from: "11:00", to: "23:00" },
  saturday:  { open: true, from: "11:00", to: "23:00" },
  sunday:    { open: true, from: "11:00", to: "20:00" },
};

const DAY_INDEX_TO_KEY: Record<number, string> = {
  0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday",
  4: "thursday", 5: "friday", 6: "saturday",
};

export function checkIsOpen(schedule: WeekSchedule): boolean {
  // Horário de Brasília (UTC-3)
  const nowBRT = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dayKey = DAY_INDEX_TO_KEY[nowBRT.getUTCDay()];
  const day = schedule[dayKey];
  if (!day?.open) return false;

  const nowMin = nowBRT.getUTCHours() * 60 + nowBRT.getUTCMinutes();
  const [fh, fm] = day.from.split(":").map(Number);
  const [th, tm] = day.to.split(":").map(Number);
  return nowMin >= fh * 60 + fm && nowMin < th * 60 + tm;
}

export const getBusinessHours = unstable_cache(
  async (): Promise<WeekSchedule> => {
    try {
      const setting = await prisma.setting.findUnique({ where: { key: "business_hours" } });
      return setting ? { ...DEFAULT_SCHEDULE, ...JSON.parse(setting.value) } : DEFAULT_SCHEDULE;
    } catch {
      return DEFAULT_SCHEDULE;
    }
  },
  ["business_hours"],
  { revalidate: 60, tags: ["business_hours"] }
);
