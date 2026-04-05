import { Header } from "@/components/menu/Header";
import { BusinessHours } from "@/components/menu/BusinessHours";
import { Footer } from "@/components/menu/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BusinessHours />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
