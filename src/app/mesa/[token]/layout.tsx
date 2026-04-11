import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

  const [table, restaurantInfo] = await Promise.all([
    prisma.table.findFirst({
      where: { token, active: true },
      select: { id: true, number: true, name: true, token: true },
    }),
    getRestaurantInfo(),
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
