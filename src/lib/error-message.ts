// A SDK do Mercado Pago lança objetos simples ({ code, message }), não
// instâncias de Error — `err instanceof Error ? err.message : String(err)`
// cai no fallback e vira "[object Object]", perdendo a razão real do erro.
// Usar isso em vez disso em todo catch do fluxo de pagamento.
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;

  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string") {
      return typeof obj.code === "string" ? `${obj.code}: ${obj.message}` : obj.message;
    }
    try {
      return JSON.stringify(obj);
    } catch {
      // objeto circular ou não serializável — cai pro String() abaixo
    }
  }

  return String(err);
}
