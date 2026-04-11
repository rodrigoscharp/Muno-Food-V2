import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  token: z.string(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
