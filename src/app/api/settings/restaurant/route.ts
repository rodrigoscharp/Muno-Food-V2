import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";

const KEY = "restaurant_info";

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: KEY } });
  return NextResponse.json(setting ? JSON.parse(setting.value) : {});
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(body) },
    create: { key: KEY, value: JSON.stringify(body) },
  });

  revalidateTag("restaurant_info", "max");

  return NextResponse.json({ ok: true });
}
