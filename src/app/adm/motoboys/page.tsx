import { prisma } from "@/lib/prisma";
import { MotoboyAccessControl } from "@/components/adm/MotoboyAccessControl";

export default async function MotoboyAccessPage() {
  const motoboys = await prisma.user.findMany({
    where: { role: "MOTOBOY" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Acesso de Motoboys</h1>
      <p className="text-sm text-neutral-400 mb-8">Gerencie quem tem acesso ao portal de entregadores</p>

      <div className="max-w-lg">
        <MotoboyAccessControl
          initialMotoboys={motoboys.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
