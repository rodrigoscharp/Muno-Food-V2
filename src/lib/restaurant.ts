import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

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

export const getRestaurantInfo = unstable_cache(
  async (): Promise<RestaurantInfo> => {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: "restaurant_info" },
      });
      return setting ? { ...DEFAULT, ...JSON.parse(setting.value) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  },
  ["restaurant_info"],
  { revalidate: 60, tags: ["restaurant_info"] }
);
