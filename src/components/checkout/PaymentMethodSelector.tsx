"use client";

import { PaymentMethod } from "@/types";

const OPTIONS: { value: PaymentMethod; label: string; description: string; icon: string }[] = [
  {
    value: "PIX",
    label: "Pix",
    description: "QR Code gerado na hora. Aprovação imediata.",
    icon: "⚡",
  },
  {
    value: "CREDIT_CARD",
    label: "Cartão de Crédito",
    description: "Redirecionado para o checkout seguro.",
    icon: "💳",
  },
  {
    value: "CASH",
    label: "Dinheiro",
    description: "Pagamento na entrega ou retirada.",
    icon: "💵",
  },
];

interface Props {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
            value === option.value
              ? "border-red-400 bg-brand-light"
              : "border-neutral-200 hover:border-neutral-300"
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 accent-red-500"
          />
          <div>
            <div className="flex items-center gap-2">
              <span>{option.icon}</span>
              <span className="text-sm font-medium text-neutral-900">{option.label}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{option.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
