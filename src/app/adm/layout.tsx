import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen flex bg-neutral-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-6 py-5 border-b border-neutral-100">
          <Link href="/" className="text-xl font-bold text-red-500">
            MUNO
          </Link>
          <p className="text-xs text-neutral-400 mt-0.5">Painel Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/adm"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link
            href="/adm/menu"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition"
          >
            <UtensilsCrossed size={16} />
            Cardápio
          </Link>
          <Link
            href="/adm/orders"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition"
          >
            <ShoppingBag size={16} />
            Pedidos
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-neutral-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-neutral-900">{session.user.name}</p>
            <p className="text-xs text-neutral-400 truncate">{session.user.email}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 transition"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
