import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { AdminSidebar } from "@/components/adm/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen flex bg-neutral-100">
      <AdminSidebar user={{ name: session.user.name ?? "", email: session.user.email ?? "" }} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
