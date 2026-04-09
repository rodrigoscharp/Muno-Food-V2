import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ orderId: string }>;
}

// Geocodifica endereço → coordenadas usando Nominatim (OpenStreetMap, gratuito)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br`;

    const res = await fetch(url, {
      headers: { "User-Agent": "MunoFood/1.0 (delivery-tracking)" },
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Calcula duração da rota de moto via OSRM (gratuito, OpenStreetMap)
// Retorna duração em segundos
async function getRouteDurationSeconds(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<number | null> {
  try {
    // OSRM usa formato longitude,latitude
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}?overview=false`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;

    return Math.ceil(data.routes[0].duration); // segundos
  } catch {
    return null;
  }
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

  // Verifica se é a primeira atualização de localização
  const existing = await prisma.deliveryTracking.findUnique({
    where: { orderId },
    select: { id: true },
  });
  const isFirstUpdate = !existing;

  const tracking = await prisma.deliveryTracking.upsert({
    where: { orderId },
    update: { lat, lng },
    create: { orderId, motoboyId: session.user.id, lat, lng },
  });

  // Na primeira atualização, calcula a previsão pela rota real
  if (isFirstUpdate) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryAddress: true },
    });

    if (order?.deliveryAddress) {
      // Geocodifica destino e calcula rota em paralelo com a resposta
      // Usa Promise sem await para não bloquear a resposta ao motoboy
      recalculateETA(orderId, lat, lng, order.deliveryAddress).catch(() => {});
    }
  }

  return NextResponse.json(tracking);
}

// Calcula e persiste a previsão de entrega baseada na rota real
async function recalculateETA(
  orderId: string,
  motoboyLat: number,
  motoboyLng: number,
  deliveryAddress: string
) {
  const destination = await geocodeAddress(deliveryAddress);
  if (!destination) return;

  const durationSeconds = await getRouteDurationSeconds(
    motoboyLat,
    motoboyLng,
    destination.lat,
    destination.lng
  );
  if (!durationSeconds) return;

  // Adiciona 5 minutos de margem para preparação/saída
  const bufferSeconds = 5 * 60;
  const estimatedDeliveryAt = new Date(Date.now() + (durationSeconds + bufferSeconds) * 1000);

  await prisma.order.update({
    where: { id: orderId },
    data: { estimatedDeliveryAt },
  });
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
