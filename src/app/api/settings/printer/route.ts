import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiError, getTenantIdFromRequest, withTenant } from "@/lib/api";

const KEY = "printer_config";

export interface PrinterConfig {
  enabled: boolean;
  paperWidth: "58mm" | "80mm";
}

const DEFAULT: PrinterConfig = { enabled: false, paperWidth: "80mm" };

export async function GET(req: NextRequest) {
  const tenantId = getTenantIdFromRequest(req);
  if (!tenantId) return apiError("Tenant não identificado", 400);

  return withTenant(tenantId, async () => {
    const setting = await prisma.setting.findUnique({ where: { tenantId_key: { tenantId, key: KEY } } });
    const config: PrinterConfig = setting ? { ...DEFAULT, ...JSON.parse(setting.value) } : DEFAULT;
    return NextResponse.json(config);
  });
}

export async function PUT(req: NextRequest) {
  const tenantId = getTenantIdFromRequest(req);
  if (!tenantId) return apiError("Tenant não identificado", 400);

  return withTenant(tenantId, async () => {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: KEY } },
      update: { value: JSON.stringify(body) },
      create: { tenantId, key: KEY, value: JSON.stringify(body) },
    });

    return NextResponse.json({ ok: true });
  });
}
