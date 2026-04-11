"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Trash2, QrCode, Download, X, TableProperties } from "lucide-react";

interface Table {
  id: string;
  number: number;
  name: string | null;
  token: string;
  active: boolean;
}

export function TableManager() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [origin, setOrigin] = useState("");
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/tables");
      if (res.ok) setTables(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const num = parseInt(newNumber);
    if (!num || num < 1) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: num, name: newName || undefined }),
      });
      if (res.ok) {
        setNewNumber("");
        setNewName("");
        setAdding(false);
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta mesa?")) return;
    await fetch(`/api/tables/${id}`, { method: "DELETE" });
    await load();
  }

  function handleDownloadQR(table: Table) {
    const svg = document.getElementById(`qr-${table.id}`) as unknown as SVGSVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `mesa-${table.number}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Mesas</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Gere QR codes para cada mesa do estabelecimento.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
        >
          <Plus size={16} />
          Nova Mesa
        </button>
      </div>

      {/* Form nova mesa */}
      {adding && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Adicionar mesa</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Número *</label>
              <input
                type="number"
                min="1"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="Ex: 1"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Nome (opcional)</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Varanda"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newNumber}
              className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition"
            >
              {saving ? "Salvando..." : "Criar mesa"}
            </button>
            <button
              onClick={() => { setAdding(false); setNewNumber(""); setNewName(""); }}
              className="text-sm text-neutral-500 hover:text-neutral-700 px-4 py-2 rounded-xl hover:bg-neutral-100 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de mesas */}
      {loading ? (
        <div className="text-center py-12 text-neutral-400 text-sm">Carregando mesas...</div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-3">
          <TableProperties size={40} strokeWidth={1.2} />
          <p className="text-sm">Nenhuma mesa cadastrada.</p>
          <p className="text-xs">Clique em "Nova Mesa" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => {
            const url = `${origin}/mesa/${table.token}`;
            const label = table.name ? `Mesa ${table.number} · ${table.name}` : `Mesa ${table.number}`;
            return (
              <div
                key={table.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-neutral-900">{label}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 break-all">{url}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition shrink-0"
                    title="Excluir mesa"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Hidden QR for download */}
                <div className="hidden">
                  <QRCodeSVG
                    id={`qr-${table.id}`}
                    value={url}
                    size={256}
                    level="M"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setQrTable(table)}
                    className="flex items-center gap-1.5 flex-1 justify-center text-xs font-semibold text-brand border border-brand rounded-lg py-2 hover:bg-brand-light transition"
                  >
                    <QrCode size={14} />
                    Ver QR
                  </button>
                  <button
                    onClick={() => handleDownloadQR(table)}
                    className="flex items-center gap-1.5 flex-1 justify-center text-xs font-semibold text-neutral-600 border border-neutral-200 rounded-lg py-2 hover:bg-neutral-50 transition"
                  >
                    <Download size={14} />
                    Baixar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal QR Code */}
      {qrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQrTable(null)} />
          <div className="relative bg-white rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl max-w-xs w-full mx-4">
            <button
              onClick={() => setQrTable(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition"
            >
              <X size={16} className="text-neutral-500" />
            </button>

            <div>
              <p className="font-bold text-neutral-900 text-center text-lg">
                {qrTable.name ? `Mesa ${qrTable.number} · ${qrTable.name}` : `Mesa ${qrTable.number}`}
              </p>
              <p className="text-xs text-neutral-400 text-center mt-1">Escaneie para acessar o cardápio</p>
            </div>

            <div className="p-4 bg-white border-2 border-neutral-100 rounded-xl">
              <QRCodeSVG
                value={`${origin}/mesa/${qrTable.token}`}
                size={200}
                level="M"
              />
            </div>

            <button
              onClick={() => { handleDownloadQR(qrTable); }}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition w-full justify-center"
            >
              <Download size={15} />
              Baixar PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
