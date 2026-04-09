"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, AlertCircle, Bike } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function MotoboyLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha incorretos");
      setLoading(false);
      return;
    }

    // Verifica se a conta é realmente MOTOBOY
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();

    if (session?.user?.role !== "MOTOBOY" && session?.user?.role !== "ADMIN") {
      setError("Acesso restrito a motoboys e admins. Use a área correta.");
      setLoading(false);
      return;
    }

    router.push("/motoboy/pedidos");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bike size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Área do Motoboy</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Entre com sua conta para ver os pedidos disponíveis
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                {...register("email")}
                type="email"
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition text-sm mt-2"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
