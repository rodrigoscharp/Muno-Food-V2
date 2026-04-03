import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
  });
  return NextResponse.json(categories);
}

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  position: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const category = await prisma.category.create({ data: parsed.data });
  return NextResponse.json(category, { status: 201 });
}
