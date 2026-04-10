"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart2,
  UtensilsCrossed,
  ShoppingBag,
  LogOut,
  Store,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Resultados",
    items: [
      { href: "/adm", label: "Dashboard", icon: BarChart2, exact: true },
      { href: "/adm/orders", label: "Pedidos", icon: ShoppingBag, exact: false },
    ],
  },
  {
    label: "Restaurante",
    items: [
      { href: "/adm/restaurante", label: "Gerenciamento", icon: Store, exact: false },
      { href: "/adm/menu", label: "Cardápio", icon: UtensilsCrossed, exact: false },
    ],
  },
];

interface Props {
  user: { name: string; email: string };
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-neutral-100">
        <Link href="/" className="block">
          <Image src="/munowbg.png" alt="MUNO" width={140} height={52} className="h-12 w-auto object-contain" />
        </Link>
        <p className="text-xs text-neutral-400 mt-1">Painel Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      active
                        ? "bg-brand-light text-brand-dark font-medium"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-neutral-900 truncate">{user.name}</p>
          <p className="text-xs text-neutral-400 truncate">{user.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 transition"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
