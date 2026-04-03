"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useState } from "react";
import { ShoppingCart, User, LogOut, Settings, ChefHat, Menu, X } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const itemCount = useCart((s) => s.itemCount);
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-red-500 tracking-tight shrink-0">
            MUNO
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {session?.user.role === "ADMIN" && (
              <Link href="/adm" className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                <Settings size={14} /> Admin
              </Link>
            )}
            {(session?.user.role === "ADMIN" || session?.user.role === "KITCHEN") && (
              <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                <ChefHat size={14} /> Cozinha
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 transition"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart size={20} className="text-neutral-700" />
              {itemCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
                  {itemCount() > 9 ? "9+" : itemCount()}
                </span>
              )}
            </button>

            {/* User menu (desktop) */}
            {session ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition text-sm text-neutral-700"
                >
                  <User size={16} />
                  <span className="max-w-24 truncate">{session.user.name}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 min-w-44 z-50">
                    <p className="px-4 py-2 text-xs text-neutral-400 border-b border-neutral-100 truncate">
                      {session.user.email}
                    </p>
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      <LogOut size={14} /> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="hidden sm:block text-sm text-neutral-600 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium">
                Entrar
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 transition"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-neutral-100 bg-white px-4 py-3 space-y-1">
            {session?.user.role === "ADMIN" && (
              <Link href="/adm" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100">
                <Settings size={15} /> Admin
              </Link>
            )}
            {(session?.user.role === "ADMIN" || session?.user.role === "KITCHEN") && (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100">
                <ChefHat size={15} /> Cozinha
              </Link>
            )}
            {session ? (
              <button
                onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <LogOut size={15} /> Sair ({session.user.name})
              </button>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 font-medium hover:bg-red-50">
                Entrar
              </Link>
            )}
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
}
