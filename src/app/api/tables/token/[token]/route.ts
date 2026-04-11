import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  return withErrorHandling(async () => {
    const { token } = await params;

    const table = await prisma.table.findFirst({
      where: { token, active: true },
      select: { id: true, number: true, name: true, token: true },
    });

    if (!table) {
      return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 });
    }

    return NextResponse.json(table);
  });
}
