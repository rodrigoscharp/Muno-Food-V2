import { prisma } from "@/lib/prisma";
import { DeliveryTimeControl } from "@/components/adm/DeliveryTimeControl";
import { BusinessHoursControl, WeekSchedule } from "@/components/adm/BusinessHoursControl";
import { RestaurantInfoControl } from "@/components/adm/RestaurantInfoControl";
import { DeliveryZonesControl } from "@/components/adm/DeliveryZonesControl";
import { getRestaurantInfo } from "@/lib/restaurant";

const DEFAULT_HOURS: WeekSchedule = {
  monday:    { open: true,  from: "11:00", to: "22:00" },
  tuesday:   { open: true,  from: "11:00", to: "22:00" },
  wednesday: { open: true,  from: "11:00", to: "22:00" },
  thursday:  { open: true,  from: "11:00", to: "22:00" },
  friday:    { open: true,  from: "11:00", to: "23:00" },
  saturday:  { open: true,  from: "11:00", to: "23:00" },
  sunday:    { open: true,  from: "11:00", to: "20:00" },
};

export default async function RestauranteAdminPage() {
  const [deliveryTimeSetting, businessHoursSetting, restaurantInfo, deliveryZones] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "delivery_time_minutes" } }),
    prisma.setting.findUnique({ where: { key: "business_hours" } }),
    getRestaurantInfo(),
    prisma.deliveryZone.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
  ]);

  const deliveryMinutes = deliveryTimeSetting
    ? parseInt(deliveryTimeSetting.value, 10)
    : 45;

  const schedule: WeekSchedule = businessHoursSetting
    ? JSON.parse(businessHoursSetting.value)
    : DEFAULT_HOURS;

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Gerenciamento do Restaurante</h1>
      <p className="text-sm text-neutral-400 mb-8">Configure as operações do seu restaurante</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-1 space-y-6">
          <DeliveryTimeControl initialMinutes={deliveryMinutes} />
          <RestaurantInfoControl initial={restaurantInfo} />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <BusinessHoursControl initialSchedule={schedule} />
          <DeliveryZonesControl
            initialZones={deliveryZones.map((z) => ({ ...z, price: Number(z.price) }))}
          />
        </div>
      </div>
    </div>
  );
}
