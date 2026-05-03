"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getStockStatus } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  Healthcare:  { bg: "bg-red-50",    text: "text-red-400",    emoji: "💊" },
  Skincare:    { bg: "bg-pink-50",   text: "text-pink-400",   emoji: "✨" },
  Fitness:     { bg: "bg-blue-50",   text: "text-blue-400",   emoji: "🏋️" },
  Electronics: { bg: "bg-violet-50", text: "text-violet-400", emoji: "⚡" },
  Lifestyle:   { bg: "bg-amber-50",  text: "text-amber-400",  emoji: "🌿" },
};

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
  // Pick first valid non-empty image URL
  const validImages = (Array.isArray(images) ? images : [])
    .concat(typeof image === "string" ? [image] : [])
    .filter(s => typeof s === "string" && s.trim().length > 0);

  const primarySrc = validImages[0] ?? "";
  const [imgFailed, setImgFailed] = useState(!primarySrc);
  const showImg = primarySrc && !imgFailed;

  const status = getStockStatus(totalAvailable);
  const catStyle = CATEGORY_COLORS[category] ?? { bg: "bg-slate-50", text: "text-slate-400", emoji: "📦" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.5) }}
      whileHover={{ y: -4 }}
      className="group h-full"
    >
      <Link
        href={`/products/${id}`}
        className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden"
      >
        {/* ── Image area ── */}
        <div className={cn("relative w-full overflow-hidden", showImg ? "bg-slate-100" : catStyle.bg)}
          style={{ paddingBottom: "100%", position: "relative" }}>
          <div className="absolute inset-0">
            {showImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primarySrc}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImgFailed(true)}
                loading="lazy"
              />
            ) : (
              <div className={cn("w-full h-full flex flex-col items-center justify-center gap-2", catStyle.bg)}>
                <span className="text-5xl leading-none">{catStyle.emoji}</span>
                <span className={cn("text-xs font-semibold", catStyle.text)}>{category}</span>
              </div>
            )}
          </div>

          {/* Category badge */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge variant="secondary" className="text-[10px] font-bold bg-white/95 shadow-sm backdrop-blur-sm">
              {category}
            </Badge>
          </div>

          {/* Multi-image indicator */}
          {validImages.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 z-10 flex gap-0.5">
              {validImages.slice(0, Math.min(validImages.length, 4)).map((_, i) => (
                <div key={i}
                  className={cn("h-1.5 rounded-full bg-white transition-all",
                    i === 0 ? "w-3 opacity-100" : "w-1.5 opacity-60")} />
              ))}
            </div>
          )}

          {/* Sold-out overlay */}
          {totalAvailable === 0 && (
            <div className="absolute inset-0 z-10 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-red-600 shadow-md">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col flex-1 p-3.5 gap-2">
          {/* Brand */}
          {brand && (
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">
              {brand}
            </p>
          )}

          {/* Name + price */}
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors duration-200">
              {name}
            </h3>
            <p className="mt-1.5 text-base font-black text-slate-900 tabular-nums">
              {formatCurrency(price)}
            </p>
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {colors.slice(0, 3).map(c => (
                <span key={c}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                  {c}
                </span>
              ))}
              {colors.length > 3 && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                  +{colors.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-1.5">
            {totalAvailable === 0
              ? <XCircle       className="h-3.5 w-3.5 text-red-500   flex-shrink-0" />
              : totalAvailable <= 3
              ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500  flex-shrink-0" />
              : <CheckCircle   className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            }
            <span className={cn("text-xs font-semibold", status.color)}>
              {totalAvailable === 0
                ? "Out of stock"
                : totalAvailable <= 3
                ? `Only ${totalAvailable} left!`
                : `${totalAvailable} available`}
            </span>
          </div>

          {/* Warehouse dots */}
          <div className="flex items-center gap-1">
            {inventory.slice(0, 5).map(inv => (
              <div key={inv.warehouseId}
                title={`${inv.warehouseName}: ${inv.available} units`}
                className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0",
                  inv.available === 0 ? "bg-red-300"
                    : inv.available <= 3 ? "bg-amber-400"
                    : "bg-emerald-400"
                )} />
            ))}
            <span className="text-[9px] text-slate-400 ml-0.5">5 warehouses</span>
          </div>

          {/* CTA */}
          <div className={cn(
            "rounded-xl py-2.5 text-center text-xs font-bold border transition-all duration-200 mt-1",
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
