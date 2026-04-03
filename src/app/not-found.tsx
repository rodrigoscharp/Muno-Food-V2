import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-black text-brand mb-4">404</p>
      <h2 className="text-xl font-bold text-neutral-900 mb-2">Página não encontrada</h2>
      <p className="text-neutral-500 text-sm mb-6">
        A página que você procura não existe ou foi removida.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition"
      >
        Voltar ao cardápio
      </Link>
    </div>
  );
}
