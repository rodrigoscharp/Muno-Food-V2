import { NextResponse } from "next/server";

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    console.error("[API Error]", msg);
    return apiError("Erro interno do servidor", 500);
  }
}
