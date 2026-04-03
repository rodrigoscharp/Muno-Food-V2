"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  dailySales: { date: string; revenue: number }[];
  topItems: { name: string; quantity: number }[];
}

export function AdminCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  const formattedSales = data.dailySales.map((d) => ({
    ...d,
    day: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily sales chart */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-700 mb-4">
          Receita — Últimos 30 dias
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={formattedSales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip
              formatter={(value) =>
                Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              }
              labelStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top items chart */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-700 mb-4">
          Itens Mais Pedidos
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.topItems} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              width={100}
            />
            <Tooltip labelStyle={{ fontSize: 12 }} />
            <Bar dataKey="quantity" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
