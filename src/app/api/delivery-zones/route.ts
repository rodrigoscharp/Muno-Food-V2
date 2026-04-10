import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const zones = await prisma.deliveryZone.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });
  return NextResponse.json(zones);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { name, price } = await req.json() as { name: string; price: number };
  if (!name || price == null) {
    return NextResponse.json({ error: "Nome e preço são obrigatórios" }, { status: 400 });
  }

  const last = await prisma.deliveryZone.findFirst({ orderBy: { position: "desc" } });
  const zone = await prisma.deliveryZone.create({
    data: { name: name.trim(), price, position: (last?.position ?? 0) + 1 },
  });

  return NextResponse.json(zone, { status: 201 });
}
