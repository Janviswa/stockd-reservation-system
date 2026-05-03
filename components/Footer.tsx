import Link from "next/link";
import { ShoppingBag, Github, Heart } from "lucide-react";

const footerLinks = {
  "Shop": [
    { label: "All Products",    href: "/products" },
    { label: "Healthcare",      href: "/products?category=Healthcare" },
    { label: "Skincare",        href: "/products?category=Skincare" },
    { label: "Fitness",         href: "/products?category=Fitness" },
    { label: "Electronics",     href: "/products?category=Electronics" },
  ],
  "Account": [
    { label: "My Reservations", href: "/active-reservations" },
    { label: "Admin Panel",     href: "/admin/login" },
  ],
  "Warehouses": [
    { label: "Chennai",         href: "/products" },
    { label: "Bangalore",       href: "/products" },
    { label: "Mumbai",          href: "/products" },
    { label: "Delhi",           href: "/products" },
    { label: "Hyderabad",       href: "/products" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Stockd</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Inventory reservation system for multi-warehouse e-commerce. Reserve, hold, confirm.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
              <Heart className="h-3 w-3 text-red-400 fill-red-400" />
              Made for stress-free checkout
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Stockd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="hover:text-slate-300 transition-colors">Admin Panel</Link>
            <span>·</span>
            <span>5 warehouses across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
