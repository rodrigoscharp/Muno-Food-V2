import { prisma } from "@/lib/prisma";
import { DeliveryTimeControl } from "@/components/adm/DeliveryTimeControl";

export default async function RestauranteAdminPage() {
  const deliveryTimeSetting = await prisma.setting.findUnique({
    where: { key: "delivery_time_minutes" },
  });

  const deliveryMinutes = deliveryTimeSetting
    ? parseInt(deliveryTimeSetting.value, 10)
    : 45;

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Gerenciamento do Restaurante</h1>
      <p className="text-sm text-neutral-400 mb-8">Configure as operações do seu restaurante</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DeliveryTimeControl initialMinutes={deliveryMinutes} />
      </div>
    </div>
  );
}
