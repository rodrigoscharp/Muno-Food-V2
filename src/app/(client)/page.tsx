import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CategoryNav } from "@/components/menu/CategoryNav";
import { ProductCard } from "@/components/menu/ProductCard";
import { MenuItemWithCategory } from "@/types";

const getMenu = unstable_cache(
  async () =>
    prisma.category.findMany({
      orderBy: { position: "asc" },
      include: {
        items: { where: { available: true }, orderBy: { name: "asc" } },
      },
    }),
  ["menu"],
  { revalidate: 60 }
);

export default async function MenuPage() {
  const categories = await getMenu();

  const nonEmpty = categories.filter((c) => c.items.length > 0);

  return (
    <div className="min-h-screen">
      {nonEmpty.length > 0 ? (
        <>
          <CategoryNav categories={nonEmpty.map(({ id, name, slug }) => ({ id, name, slug }))} />
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
            {nonEmpty.map((category) => (
              <section key={category.id} id={category.slug}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-1 h-6 rounded-full bg-brand" />
                  <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                    {category.name}
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {category.items.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={{ ...item, price: Number(item.price) } as unknown as MenuItemWithCategory}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 gap-3">
          <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
            <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-base font-medium text-neutral-600">Cardápio em breve</p>
          <p className="text-sm text-neutral-400">Os itens serão adicionados pelo administrador.</p>
        </div>
      )}
    </div>
  );
}
