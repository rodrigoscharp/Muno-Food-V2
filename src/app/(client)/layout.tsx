import { Header } from "@/components/menu/Header";
import { BusinessHours } from "@/components/menu/BusinessHours";
import { Footer } from "@/components/menu/Footer";
import { getRestaurantInfo } from "@/lib/restaurant";
import { getBusinessHours } from "@/lib/business-hours";
import { getRequestTenantId } from "@/lib/tenant-request";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = await getRequestTenantId();
  const [info, schedule] = await Promise.all([
    getRestaurantInfo(tenantId),
    getBusinessHours(tenantId),
  ]);

  return (
    <>
      <BusinessHours schedule={schedule} />
      <Header restaurantInfo={info} />
      <main className="flex-1">{children}</main>
      <Footer restaurantInfo={info} schedule={schedule} />
    </>
  );
}
