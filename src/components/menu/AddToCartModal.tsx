"use client";

import Image from "next/image";
import { X, Plus, Minus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { MenuItemWithCategory } from "@/types";

interface Props {
  item: MenuItemWithCategory;
  onConfirm: (notes: string, quantity: number) => void;
  onClose: () => void;
}

export function AddToCartModal({ item, onConfirm, onClose }: Props) {
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  function handleConfirm() {
    setVisible(false);
    setTimeout(() => onConfirm(notes.trim(), quantity), 280);
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Header com imagem */}
        <div className="relative h-44 rounded-t-3xl sm:rounded-t-3xl overflow-hidden bg-neutral-100">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Preço sobre a imagem */}
          <span className="absolute bottom-3 left-4 text-white font-black text-xl">
            {formatCurrency(item.price)}
          </span>
          {/* Botão fechar */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-5 pt-4 pb-6">
          <h2 className="text-lg font-bold text-neutral-900 leading-snug">{item.name}</h2>
          {item.description && (
            <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{item.description}</p>
          )}

          {/* Observação */}
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-400 block mb-2">
              Alguma observação?
            </label>
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, ponto bem passado..."
              rows={2}
              maxLength={120}
              className="w-full text-sm text-neutral-800 placeholder-neutral-300 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
          </div>

          {/* Quantidade + botão */}
          <div className="mt-5 flex items-center gap-3">
            {/* Contador */}
            <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-2 py-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-white hover:text-neutral-900 transition-colors"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <span className="w-5 text-center text-sm font-bold text-neutral-900 tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-white hover:text-neutral-900 transition-colors"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Adicionar */}
            <button
              onClick={handleConfirm}
              className="flex-1 bg-brand hover:bg-brand-dark active:scale-95 text-white font-bold text-sm rounded-xl py-3 transition-all duration-150 shadow-sm shadow-brand/30"
            >
              Adicionar · {formatCurrency(item.price * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
