import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const DELIVERY_TIME_KEY = "delivery_time_minutes";
const DEFAULT_MINUTES = 45;

export async function GET() {
  const setting = await prisma.setting.findUnique({
    where: { key: DELIVERY_TIME_KEY },
  });

  const minutes = setting ? parseInt(setting.value, 10) : DEFAULT_MINUTES;
  return NextResponse.json({ minutes });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { minutes } = await req.json() as { minutes: number };

  if (typeof minutes !== "number" || minutes < 5 || minutes > 180) {
    return NextResponse.json({ error: "Tempo inválido (5–180 min)" }, { status: 400 });
  }

  const setting = await prisma.setting.upsert({
    where: { key: DELIVERY_TIME_KEY },
    update: { value: String(minutes) },
    create: { key: DELIVERY_TIME_KEY, value: String(minutes) },
  });

  return NextResponse.json({ minutes: parseInt(setting.value, 10) });
}
