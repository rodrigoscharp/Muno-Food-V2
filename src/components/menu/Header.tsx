"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useState } from "react";
import { ShoppingCart, User, LogOut, Settings, ChefHat } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const itemCount = useCart((s) => s.itemCount);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-red-500 tracking-tight">
            MUNO
          </Link>

          <div className="flex items-center gap-2">
            {session?.user.role === "ADMIN" && (
              <Link
                href="/adm"
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                <Settings size={14} />
                Admin
              </Link>
            )}
            {(session?.user.role === "ADMIN" ||
              session?.user.role === "KITCHEN") && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                <ChefHat size={14} />
                Cozinha
              </Link>
            )}

            {/* Carrinho */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 transition"
            >
              <ShoppingCart size={20} className="text-neutral-700" />
              {itemCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {itemCount()}
                </span>
              )}
            </button>

            {/* User menu */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition text-sm text-neutral-700"
                >
                  <User size={16} />
                  <span className="hidden sm:block max-w-24 truncate">
                    {session.user.name}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 min-w-40 z-50">
                    <p className="px-4 py-2 text-xs text-neutral-400 border-b border-neutral-100">
                      {session.user.email}
                    </p>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      <LogOut size={14} />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm text-neutral-600 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Backdrop para fechar menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
