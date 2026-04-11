"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (!token) {
      setError("Link inválido. Solicite um novo.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao redefinir senha.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center mb-8 lg:hidden">
        <Image src="/munowbg.png" alt="MUNO" width={160} height={60} className="h-16 w-auto object-contain" />
      </div>

      {success ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Senha redefinida!</h2>
          <p className="text-neutral-500 text-sm">Redirecionando para o login...</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">Nova senha</h2>
            <p className="text-neutral-500 text-sm mt-1">
              Crie uma nova senha para sua conta.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nova senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition placeholder:text-neutral-400"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Confirmar nova senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Repita a senha"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition placeholder:text-neutral-400"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm shadow-sm"
            >
              {loading ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            <Link href="/login" className="text-brand hover:text-brand-dark font-semibold">
              Voltar ao login
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand-dark opacity-90" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-sm">
          <Image src="/munowbg.png" alt="Muno Food" width={200} height={75} className="h-20 w-auto object-contain brightness-0 invert" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nova senha</h1>
            <p className="text-white/70 text-base leading-relaxed">
              Escolha uma senha segura para proteger sua conta.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-neutral-50">
        <Suspense fallback={<div className="text-neutral-400 text-sm">Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
