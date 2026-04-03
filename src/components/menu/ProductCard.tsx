"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { MenuItemWithCategory } from "@/types";

export function ProductCard({ item }: { item: MenuItemWithCategory }) {
  const addItem = useCart((s) => s.addItem);

  function handleAdd() {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
    });
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-neutral-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-medium text-neutral-500 bg-white px-3 py-1 rounded-full border">
              Indisponível
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-neutral-900 text-sm leading-snug">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-bold text-neutral-900">
            {formatCurrency(item.price)}
          </span>
          <button
            onClick={handleAdd}
            disabled={!item.available}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
