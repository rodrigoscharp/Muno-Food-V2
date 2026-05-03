"use client";

import { auth } from "@/lib/auth";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Store } from "lucide-react";
import { useSession } from "next-auth/react";

interface Props {
  orderId: string;
}

export function AdminChatView({ orderId }: Props) {
  const { data: session } = useSession();
  const adminName = session?.user?.name ?? "Admin";

  return (
    <div className="flex flex-col h-full">
      {/* Header do chat */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-200 shrink-0">
        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
          <Store size={16} className="text-neutral-500" />
        </div>
        <div>
          <p className="font-semibold text-neutral-900 text-sm">
            Pedido #{orderId.slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-neutral-400">Chat com o cliente</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatWindow
          orderId={orderId}
          currentRole="ADMIN"
          currentName={adminName}
        />
      </div>
    </div>
  );
}
