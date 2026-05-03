"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingBag, LayoutDashboard, Warehouse, Package,
  ScrollText, Zap, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard",  label: "Dashboard",         icon: LayoutDashboard },
  { href: "/admin/warehouses", label: "Warehouse Stock",   icon: Warehouse },
  { href: "/admin/inventory",  label: "Manage Inventory",  icon: Package },
  { href: "/admin/logs",       label: "Event Logs",        icon: ScrollText },
  { href: "/admin/race-demo",  label: "Concurrency Demo",  icon: Zap,  accent: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <ShoppingBag className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm tracking-tight">Stockd</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, accent }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-white"
                  : accent
                  ? "text-violet-300 hover:text-violet-100 hover:bg-violet-900/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              {isActive && (
                <motion.div layoutId="admin-nav-active"
                  className="absolute inset-0 rounded-lg bg-slate-800"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              <Icon className={cn("h-4 w-4 flex-shrink-0", accent && !isActive && "text-violet-400")} />
              {label}
              {accent && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-violet-700/60 text-violet-200 rounded px-1.5 py-0.5">
                  TEST
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-2">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ShoppingBag className="h-4 w-4" /> View Store
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
