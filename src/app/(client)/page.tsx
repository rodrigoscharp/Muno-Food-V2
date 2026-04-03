import { prisma } from "@/lib/prisma";
import { CategoryNav } from "@/components/menu/CategoryNav";
import { ProductCard } from "@/components/menu/ProductCard";
import { MenuItemWithCategory } from "@/types";

export default async function MenuPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: {
      items: {
        where: { available: true },
        orderBy: { name: "asc" },
      },
    },
  });

  const nonEmpty = categories.filter((c) => c.items.length > 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {nonEmpty.length > 0 ? (
        <>
          <CategoryNav categories={nonEmpty} />
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
            {nonEmpty.map((category) => (
              <section key={category.id} id={category.slug}>
                <h2 className="text-xl font-bold text-neutral-900 mb-4">
                  {category.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-lg font-medium">Cardápio em breve</p>
          <p className="text-sm">Os itens serão adicionados pelo administrador.</p>
        </div>
      )}
    </div>
  );
}
