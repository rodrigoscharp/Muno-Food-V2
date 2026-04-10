import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const KEY = "business_hours";

export interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

export type WeekSchedule = Record<string, DaySchedule>;

const DEFAULT: WeekSchedule = {
  monday:    { open: true,  from: "11:00", to: "22:00" },
  tuesday:   { open: true,  from: "11:00", to: "22:00" },
  wednesday: { open: true,  from: "11:00", to: "22:00" },
  thursday:  { open: true,  from: "11:00", to: "22:00" },
  friday:    { open: true,  from: "11:00", to: "23:00" },
  saturday:  { open: true,  from: "11:00", to: "23:00" },
  sunday:    { open: true,  from: "11:00", to: "20:00" },
};

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: KEY } });
  const schedule: WeekSchedule = setting ? JSON.parse(setting.value) : DEFAULT;
  return NextResponse.json(schedule);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json() as WeekSchedule;

  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(body) },
    create: { key: KEY, value: JSON.stringify(body) },
  });

  return NextResponse.json({ ok: true });
}
