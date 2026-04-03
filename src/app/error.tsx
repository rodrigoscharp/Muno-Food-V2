"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">Algo deu errado</h2>
      <p className="text-neutral-500 text-sm mb-6 max-w-sm">
        Ocorreu um erro inesperado. Tente novamente ou volte para o cardápio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
