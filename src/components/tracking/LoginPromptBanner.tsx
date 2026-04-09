"use client";

import Link from "next/link";
import { LogIn, Bell } from "lucide-react";

interface Props {
  orderId: string;
}

export function LoginPromptBanner({ orderId }: Props) {
  const callbackUrl = encodeURIComponent(`/track/${orderId}`);

  return (
    <div className="bg-gradient-to-r from-brand to-brand-dark rounded-xl p-5 text-white mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base leading-snug">
            Acompanhe seu pedido em tempo real
          </p>
          <p className="text-white/75 text-sm mt-1 leading-snug">
            Faça login para receber atualizações ao vivo e ver o mapa do entregador.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Link
          href={`/login?callbackUrl=${callbackUrl}`}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-brand font-bold py-2.5 rounded-xl text-sm hover:bg-neutral-100 transition"
        >
          <LogIn size={15} />
          Fazer login
        </Link>
        <Link
          href={`/register?callbackUrl=${callbackUrl}`}
          className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold py-2.5 rounded-xl text-sm transition"
        >
          Criar conta grátis
        </Link>
      </div>
    </div>
  );
}
