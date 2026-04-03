"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency } from "@/lib/utils";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { PaymentMethod } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  customerPhone: z.string().min(8, "Telefone inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-neutral-500 mb-4">Seu carrinho está vazio.</p>
        <Link href="/" className="text-brand font-medium hover:underline">
          Ver cardápio
        </Link>
      </div>
    );
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");

    try {
      // 1. Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            notes: item.notes,
          })),
          paymentMethod,
          notes: data.notes,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
        }),
      });

      if (!orderRes.ok) throw new Error("Erro ao criar pedido");
      const order = await orderRes.json();

      // 2. If PIX or CREDIT_CARD, create payment
      if (paymentMethod === "PIX" || paymentMethod === "CREDIT_CARD") {
        const paymentRes = await fetch("/api/payments/mercadopago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            paymentMethod,
            customerName: data.customerName,
          }),
        });

        if (!paymentRes.ok) throw new Error("Erro ao iniciar pagamento");
        const payment = await paymentRes.json();

        clearCart();

        if (paymentMethod === "PIX") {
          router.push(`/track/${order.id}?pix=${encodeURIComponent(payment.pixQrCode)}&copy=${encodeURIComponent(payment.pixCopyPaste)}`);
        } else {
          // Credit card: redirect to MP checkout
          window.location.href = payment.checkoutUrl;
        }
      } else {
        // Cash payment
        clearCart();
        router.push(`/track/${order.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition"
      >
        <ArrowLeft size={16} />
        Voltar ao cardápio
      </Link>

      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Finalizar Pedido</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Customer info */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
            <h2 className="font-semibold text-neutral-900">Seus dados</h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nome *
              </label>
              <input
                {...register("customerName")}
                placeholder="Seu nome"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
              {errors.customerName && (
                <p className="text-brand text-xs mt-1">{errors.customerName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Telefone (opcional)
              </label>
              <input
                {...register("customerPhone")}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
              {errors.customerPhone && (
                <p className="text-brand text-xs mt-1">{errors.customerPhone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Observações (opcional)
              </label>
              <textarea
                {...register("notes")}
                placeholder="Sem cebola, ponto da carne, etc."
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition resize-none"
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900 mb-3">Pagamento</h2>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </div>

          {error && (
            <div className="bg-brand-light border border-brand-muted rounded-lg px-4 py-3">
              <p className="text-brand-dark text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
          >
            {loading
              ? "Processando..."
              : paymentMethod === "CASH"
              ? "Confirmar Pedido"
              : "Ir para Pagamento"}
          </button>
        </form>

        {/* Right: order summary */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 h-fit">
          <h2 className="font-semibold text-neutral-900 mb-4">Resumo do Pedido</h2>
          <ul className="space-y-3 mb-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2">
                <div className="flex gap-2 min-w-0">
                  <span className="text-sm font-bold text-brand flex-shrink-0">
                    {item.quantity}x
                  </span>
                  <span className="text-sm text-neutral-800 truncate">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-neutral-700 flex-shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
            <span className="font-semibold text-neutral-700">Total</span>
            <span className="text-xl font-bold text-neutral-900">{formatCurrency(total())}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
