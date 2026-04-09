"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Navigation, CheckCircle, Phone, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const MotoboyMap = dynamic(() => import("./MotoboyMap"), { ssr: false });

interface Props {
  orderId: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string | null;
  total: number;
  items: { name: string; quantity: number }[];
  initialLat: number | null;
  initialLng: number | null;
}

export function MotoboyDeliveryClient({
  orderId,
  deliveryAddress,
  customerName,
  customerPhone,
  total,
  items,
  initialLat,
  initialLng,
}: Props) {
  const router = useRouter();
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number } | null>(null);

  const sendLocation = useCallback(
    async (newLat: number, newLng: number) => {
      // Evita envios redundantes (menos de 10m de diferença)
      const last = lastSentRef.current;
      if (last) {
        const delta = Math.sqrt((newLat - last.lat) ** 2 + (newLng - last.lng) ** 2);
        if (delta < 0.0001) return; // ~11m
      }

      lastSentRef.current = { lat: newLat, lng: newLng };

      try {
        await fetch(`/api/motoboy/orders/${orderId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: newLat, lng: newLng }),
        });
      } catch {
        // falha silenciosa — continuamos rastreando
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS não disponível neste dispositivo");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setGpsError(null);
        sendLocation(latitude, longitude);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Permissão de localização negada. Habilite o GPS."
            : "Erro ao obter localização"
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [sendLocation]);

  async function completeDelivery() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/motoboy/orders/${orderId}/complete`, {
        method: "POST",
      });

      if (!res.ok) {
        toast.error("Erro ao confirmar entrega");
        return;
      }

      toast.success("Entrega concluída!");
      router.push("/motoboy/pedidos");
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Em Entrega</h1>
          <p className="text-xs text-neutral-400">#{orderId.slice(-6).toUpperCase()}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs bg-brand/20 text-brand px-3 py-1.5 rounded-full font-semibold">
          <Navigation size={12} />
          Ao vivo
        </span>
      </div>

      {/* GPS error */}
      {gpsError && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          {gpsError}
        </div>
      )}

      {/* Mapa ao vivo */}
      <div className="rounded-xl overflow-hidden border border-neutral-800 h-64">
        {lat && lng ? (
          <MotoboyMap lat={lat} lng={lng} />
        ) : (
          <div className="h-full bg-neutral-900 flex items-center justify-center text-neutral-600 text-sm">
            <Navigation size={20} className="mr-2 animate-pulse" />
            Aguardando sinal GPS...
          </div>
        )}
      </div>

      {/* Endereço de entrega */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <MapPin size={18} className="text-brand flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-neutral-500 mb-0.5">Endereço de entrega</p>
            <p className="text-sm font-medium">{deliveryAddress}</p>
            <p className="text-xs text-neutral-400 mt-1">{customerName}</p>
          </div>
        </div>

        {customerPhone && (
          <a
            href={`tel:${customerPhone}`}
            className="mt-3 flex items-center gap-2 text-sm text-brand hover:text-brand-dark transition"
          >
            <Phone size={14} />
            {customerPhone}
          </a>
        )}
      </div>

      {/* Resumo do pedido */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <p className="text-xs text-neutral-500 mb-2">Itens do pedido</p>
        <ul className="space-y-1 mb-3">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-neutral-300">
              {item.quantity}× {item.name}
            </li>
          ))}
        </ul>
        <div className="border-t border-neutral-800 pt-2 flex justify-between items-center">
          <span className="text-xs text-neutral-500">Total</span>
          <span className="font-bold text-sm">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Confirmar entrega */}
      <button
        onClick={completeDelivery}
        disabled={completing}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition"
      >
        <CheckCircle size={20} />
        {completing ? "Confirmando..." : "Confirmar Entrega"}
      </button>
    </div>
  );
}
