"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Package, ShoppingBag, ClipboardList, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/",                    label: "Home",            icon: Zap },
  { href: "/products",            label: "Products",        icon: Package },
  { href: "/active-reservations", label: "My Reservations", icon: ClipboardList },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-slate-900 shadow-lg shadow-slate-900/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-0 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors border border-white/10">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Stockd</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-4 text-sm font-medium transition-colors border-b-2",
                  isActive
                    ? "text-white border-indigo-400"
                    : "text-slate-400 hover:text-white border-transparent hover:border-slate-600"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <div className="ml-3 h-5 w-px bg-slate-700" />

          <Link href="/admin/login"
            className="ml-3 rounded-lg px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors uppercase tracking-wide border border-indigo-500">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
