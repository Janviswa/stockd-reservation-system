"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getStockStatus } from "@/lib/utils";

interface InventoryItem {
  warehouseId: string;
  warehouseName: string;
  available: number;
}
interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  images?: string[];
  brand?: string;
  category: string;
  price: number;
  colors?: string[];
  inventory: InventoryItem[];
  totalAvailable: number;
  index?: number;
}

export function ProductCard({
  id, name, image, images = [], brand, category,
  price, colors = [], inventory, totalAvailable, index = 0,
}: ProductCardProps) {
  // Pick the first real image — never an empty string
  const rawSrc = (images.find(s => s) || image || "").trim();
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = rawSrc && !imgFailed;

  const status = getStockStatus(totalAvailable);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.6) }}
      whileHover={{ y: -4 }}
      className="group h-full"
    >
      <Link
        href={`/products/${id}`}
        className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden"
      >
        {/* ── Image ── */}
        <div className="relative w-full bg-slate-100 overflow-hidden" style={{ paddingBottom: "100%" }}>
          <div className="absolute inset-0">
            {showImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rawSrc}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImgFailed(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-100">
                <span className="text-5xl">📦</span>
                <span className="text-xs text-slate-400 font-medium">{category}</span>
              </div>
            )}
          </div>

          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[10px] font-semibold bg-white/90 backdrop-blur-sm shadow-sm">
              {category}
            </Badge>
          </div>

          {/* Image count dots */}
          {images.filter(s => s).length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-0.5">
              {images.filter(s => s).slice(0, 3).map((_, i) => (
                <div key={i} className={cn("rounded-full transition-all bg-white", i === 0 ? "h-1.5 w-3" : "h-1.5 w-1.5 opacity-60")} />
              ))}
            </div>
          )}

          {/* Sold out overlay */}
          {totalAvailable === 0 && (
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-red-600 shadow">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="flex flex-col flex-1 p-3.5 gap-2">
          {brand && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{brand}</p>
          )}

          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
              {name}
            </h3>
            <p className="mt-1 text-base font-black text-slate-900">{formatCurrency(price)}</p>
          </div>

          {colors.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {colors.slice(0, 3).map(c => (
                <span key={c} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-medium text-slate-600">
                  {c}
                </span>
              ))}
              {colors.length > 3 && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-medium text-slate-400">
                  +{colors.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-1.5 mt-auto pt-1">
            {totalAvailable === 0
              ? <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              : totalAvailable <= 3
              ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              : <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
            <span className={cn("text-xs font-semibold", status.color)}>
              {totalAvailable === 0 ? "Out of stock" : totalAvailable <= 3 ? `Only ${totalAvailable} left!` : `${totalAvailable} available`}
            </span>
          </div>

          {/* Warehouse availability dots */}
          <div className="flex items-center gap-1">
            {inventory.slice(0, 5).map(inv => (
              <div
                key={inv.warehouseId}
                title={`${inv.warehouseName}: ${inv.available} units`}
                className={cn("h-1.5 w-1.5 rounded-full",
                  inv.available === 0 ? "bg-red-300" : inv.available <= 3 ? "bg-amber-400" : "bg-emerald-400"
                )}
              />
            ))}
            <span className="text-[9px] text-slate-400 ml-1">5 warehouses</span>
          </div>

          {/* CTA */}
          <div className={cn(
            "mt-1 rounded-xl py-2.5 text-center text-xs font-bold border transition-all duration-200",
            totalAvailable === 0
              ? "bg-slate-50 text-slate-400 border-slate-200"
              : "bg-slate-900 text-white border-slate-900 group-hover:bg-indigo-700 group-hover:border-indigo-700"
          )}>
            {totalAvailable === 0 ? "Join Waitlist" : "View & Reserve"}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
