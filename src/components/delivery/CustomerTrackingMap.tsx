"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const motoboyIcon = L.divIcon({
  html: `<div style="background:#ef4444;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.5);font-size:22px;">🛵</div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function SmoothMove({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
}

interface Props {
  lat: number;
  lng: number;
}

export default function CustomerTrackingMap({ lat, lng }: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
      dragging={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[lat, lng]} icon={motoboyIcon} />
      <SmoothMove lat={lat} lng={lng} />
    </MapContainer>
  );
}
