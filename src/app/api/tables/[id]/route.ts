import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.table.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const table = await prisma.table.update({
      where: { id },
      data: {
        active: body.active !== undefined ? body.active : undefined,
        name: body.name !== undefined ? body.name : undefined,
      },
    });

    return NextResponse.json(table);
  });
}
