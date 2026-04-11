"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTable } from "@/hooks/useTable";
import { UtensilsCrossed, ArrowRight } from "lucide-react";

interface TableData {
  id: string;
  number: number;
  name: string | null;
  token: string;
}

export default function MesaLandingPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { setTable } = useTable();

  useEffect(() => {
    async function loadTable() {
      try {
        const res = await fetch(`/api/tables/token/${params.token}`);
        if (!res.ok) return;
        const table: TableData = await res.json();
        setTable({
          tableId: table.id,
          tableNumber: table.number,
          tableName: table.name,
          tableToken: table.token,
        });
      } catch {
        // silently fail — layout already validated the token
      }
    }
    loadTable();
  }, [params.token, setTable]);

  function handleEnter() {
    router.push(`/mesa/${params.token}/cardapio`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center shadow-lg">
        <UtensilsCrossed size={36} className="text-white" />
      </div>

      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight mb-2">
          Bem-vindo!
        </h1>
        <p className="text-neutral-500 text-base max-w-xs">
          Explore o cardápio, adicione o que quiser e confirme o pedido quando estiver pronto.
        </p>
        <p className="text-neutral-400 text-sm mt-2">
          O pagamento é feito no balcão ao final.
        </p>
      </div>

      <button
        onClick={handleEnter}
        className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-3.5 rounded-xl transition shadow-md"
      >
        Ver Cardápio
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
