import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  return withErrorHandling(async () => {
    const categories = await prisma.category.findMany({
      orderBy: { position: "asc" },
      include: {
        items: {
          where: { available: true },
          orderBy: { name: "asc" },
        },
      },
    });
    return NextResponse.json(categories);
  });
}

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().nullable(),
  available: z.boolean().default(true),
  categoryId: z.string(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const item = await prisma.menuItem.create({ data: parsed.data });
    return NextResponse.json(item, { status: 201 });
  });
}
