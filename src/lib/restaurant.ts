import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runWithTenant } from "@/lib/tenant-context";

export interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
}

const DEFAULT: RestaurantInfo = {
  name: "Muno Food Restaurante",
  address: "Rua Paraty 1772, Ubatuba-SP",
  phone: "(12) 99999-0000",
  logoUrl: "/munowbg.png",
};

// tenantId entra como argumento para que o unstable_cache diferencie o
// cache por tenant — sem isso, o restaurante info de um tenant vazaria
// para os outros (mesma chave de cache global).
export const getRestaurantInfo = unstable_cache(
  async (tenantId: string): Promise<RestaurantInfo> => {
    try {
      const setting = await runWithTenant(tenantId, () =>
        prisma.setting.findUnique({
          where: { tenantId_key: { tenantId, key: "restaurant_info" } },
        })
      );
      return setting ? { ...DEFAULT, ...JSON.parse(setting.value) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  },
  ["restaurant_info"],
  { revalidate: 60, tags: ["restaurant_info"] }
);
