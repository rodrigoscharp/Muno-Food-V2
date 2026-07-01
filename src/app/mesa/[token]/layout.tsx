import { notFound } from "next/navigation";
import { prismaUnscoped } from "@/lib/prisma";
import { getRequestTenantId } from "@/lib/tenant-request";
import { getRestaurantInfo } from "@/lib/restaurant";
import { MesaHeader } from "@/components/mesa/MesaHeader";

export default async function MesaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tenantId = await getRequestTenantId();

  // Nota: consultas diretas (fora de unstable_cache/Route Handlers) usam
  // prismaUnscoped + tenantId explícito no where — o cliente Prisma com
  // extensão de tenant (AsyncLocalStorage) trava com um erro de WASM quando
  // chamado direto dentro da renderização de um Server Component neste
  // ambiente (funciona normalmente em Route Handlers e em funções
  // unstable_cache, então esses continuam usando a extensão).
  const [table, restaurantInfo] = await Promise.all([
    prismaUnscoped.table.findFirst({
      where: { token, active: true, tenantId },
      select: { id: true, number: true, name: true, token: true },
    }),
    getRestaurantInfo(tenantId),
  ]);

  if (!table) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <MesaHeader
        restaurantInfo={restaurantInfo}
        tableNumber={table.number}
        tableName={table.name}
        token={table.token}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
