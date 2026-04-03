"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, LogOut } from "lucide-react";

const NAV = [
  { href: "/adm", label: "Dashboard", icon: LayoutDashboard },
  { href: "/adm/menu", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/adm/orders", label: "Pedidos", icon: ShoppingBag },
];

interface Props {
  user: { name: string; email: string };
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-neutral-100">
        <Link href="/" className="block">
          <Image src="/logo.jpg" alt="MUNO" width={80} height={30} className="h-8 w-auto object-contain" />
        </Link>
        <p className="text-xs text-neutral-400 mt-1">Painel Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
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
