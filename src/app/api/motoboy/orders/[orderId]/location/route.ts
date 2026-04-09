import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ orderId: string }>;
}

// POST /api/motoboy/orders/[orderId]/location — atualiza posição GPS do motoboy
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MOTOBOY" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { orderId } = await params;
  const body = await req.json();
  const { lat, lng } = body as { lat: number; lng: number };

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const tracking = await prisma.deliveryTracking.upsert({
    where: { orderId },
    update: { lat, lng },
    create: {
      orderId,
      motoboyId: session.user.id,
      lat,
      lng,
    },
  });

  return NextResponse.json(tracking);
}

// GET /api/motoboy/orders/[orderId]/location — retorna posição atual
export async function GET(_req: Request, { params }: Params) {
  const { orderId } = await params;

  const tracking = await prisma.deliveryTracking.findUnique({
    where: { orderId },
  });

  if (!tracking) {
    return NextResponse.json({ error: "Rastreamento não iniciado" }, { status: 404 });
  }

  return NextResponse.json(tracking);
}
