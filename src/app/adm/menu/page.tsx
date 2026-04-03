import { prisma } from "@/lib/prisma";
import { MenuManager } from "@/components/adm/MenuManager";

export default async function AdminMenuPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: {
      items: { orderBy: { name: "asc" } },
    },
  });

  const allCategories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Cardápio</h1>
      <MenuManager
        initialCategories={categories.map((c) => ({
          ...c,
          items: c.items.map((item) => ({
            ...item,
            price: Number(item.price),
          })),
        }))}
        allCategories={allCategories}
      />
    </div>
  );
}
