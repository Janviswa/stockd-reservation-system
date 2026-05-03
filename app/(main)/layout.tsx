import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
