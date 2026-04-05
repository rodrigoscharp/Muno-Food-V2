import Image from "next/image";
import { MapPin, Clock, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Image
              src="/munowbg.png"
              alt="Muno Food Restaurante"
              width={120}
              height={45}
              className="h-12 w-auto object-contain brightness-0 invert opacity-90"
            />
            <p className="text-sm text-neutral-400 leading-relaxed">
              Sabor e qualidade em cada prato. Venha nos visitar ou faça seu pedido online.
            </p>
          </div>

          {/* Contato */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contato</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-brand mt-0.5 shrink-0" />
                <span>Rua Paraty 1772, Ubatuba-SP</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-brand shrink-0" />
                <span>(12) 99999-0000</span>
              </li>
            </ul>
          </div>

          {/* Horários */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Horário de Funcionamento</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-brand shrink-0" />
                <span>Seg – Sex: 11h às 22h</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-brand shrink-0" />
                <span>Sáb – Dom: 11h às 23h</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-neutral-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} Muno Food Restaurante. Todos os direitos reservados.</span>
          <span>Desenvolvido com ♥ para você</span>
        </div>
      </div>
    </footer>
  );
}
