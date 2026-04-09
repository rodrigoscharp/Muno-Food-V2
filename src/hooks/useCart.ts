"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "cartId">, quantity?: number) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateNotes: (cartId: string, notes: string) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const cartId = `${item.id}::${item.notes ?? ""}`;
        set((state) => {
          const existing = state.items.find((i) => i.cartId === cartId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartId === cartId ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, cartId, quantity }] };
        });
      },

      removeItem: (cartId) => {
        set((state) => ({ items: state.items.filter((i) => i.cartId !== cartId) }));
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartId === cartId ? { ...i, quantity } : i
          ),
        }));
      },

      updateNotes: (cartId, notes) => {
        set((state) => ({
          items: state.items.map((i) => (i.cartId === cartId ? { ...i, notes } : i)),
        }));
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: "muno-cart" }
  )
);
