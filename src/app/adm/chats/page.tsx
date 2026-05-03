import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { AdminChatView } from "./AdminChatView";

export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId: selectedOrderId } = await searchParams;

  // Pedidos que têm ao menos uma mensagem, ordenados pela mensagem mais recente
  const ordersWithChats = await prisma.order.findMany({
    where: { chatMessages: { some: {} } },
    include: {
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex gap-6 h-[calc(100vh-theme(spacing.32))]">
      {/* Lista lateral */}
      <aside className="w-72 shrink-0 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-brand" />
          <h1 className="text-lg font-bold text-neutral-900">Chats</h1>
          {ordersWithChats.length > 0 && (
            <span className="ml-auto text-xs bg-brand text-white rounded-full px-2 py-0.5 font-medium">
              {ordersWithChats.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {ordersWithChats.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-10">
              Nenhum chat ainda.
            </p>
          ) : (
            ordersWithChats.map((order) => {
              const lastMsg = order.chatMessages[0];
              const isSelected = order.id === selectedOrderId;
              return (
                <Link
                  key={order.id}
                  href={`/adm/chats?orderId=${order.id}`}
                  className={`block rounded-xl px-4 py-3 transition border ${
                    isSelected
                      ? "bg-brand/5 border-brand/30"
                      : "bg-white border-neutral-200 hover:border-brand/20 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-mono text-xs font-bold text-neutral-500">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {lastMsg ? formatDate(lastMsg.createdAt) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 truncate">
                    {order.user?.name ?? "Cliente sem conta"}
                  </p>
                  {lastMsg && (
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {lastMsg.senderRole === "ADMIN" ? "Você: " : ""}
                      {lastMsg.content}
                    </p>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* Painel do chat selecionado */}
      <div className="flex-1 bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {selectedOrderId ? (
          <AdminChatView orderId={selectedOrderId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
            <MessageSquare size={40} className="text-neutral-200" />
            <p className="text-neutral-500 font-medium">Selecione um chat</p>
            <p className="text-sm text-neutral-400">
              Escolha um pedido na lista ao lado para ver as mensagens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
