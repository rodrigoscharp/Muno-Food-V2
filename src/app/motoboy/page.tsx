import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MotoboyRootPage() {
  const session = await auth();

  if (session?.user?.role === "MOTOBOY" || session?.user?.role === "ADMIN") {
    redirect("/motoboy/pedidos");
  }

  redirect("/motoboy/login");
}
