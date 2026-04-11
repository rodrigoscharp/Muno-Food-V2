"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Erro ao enviar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

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
            <h1 className="text-3xl font-bold text-white mb-2">Recuperar acesso</h1>
            <p className="text-white/70 text-base leading-relaxed">
              Vamos te enviar um link para redefinir sua senha.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-neutral-50">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/munowbg.png" alt="MUNO" width={160} height={60} className="h-16 w-auto object-contain" />
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">Email enviado!</h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Se existe uma conta com esse email, você receberá um link para redefinir sua senha em breve. Verifique sua caixa de entrada (e spam).
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-brand font-semibold hover:underline text-sm mt-2">
                <ArrowLeft size={15} /> Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 mb-8 transition">
                <ArrowLeft size={15} /> Voltar ao login
              </Link>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-900">Esqueci minha senha</h2>
                <p className="text-neutral-500 text-sm mt-1">
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition placeholder:text-neutral-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.email.message}
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
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
