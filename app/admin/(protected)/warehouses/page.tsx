"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Package, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function fetchInventory() {
  const res = await fetch("/api/admin/inventory");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

interface InvRow {
  id: string; warehouseId: string; warehouseName: string; city: string;
  productName: string; category: string;
  totalStock: number; reservedStock: number; available: number;
}

const WAREHOUSE_ACCENTS: Record<string, { border: string; header: string; badge: string; bar: string; dot: string }> = {
  Chennai:   { border: "border-red-200",    header: "from-red-600 to-rose-700",       badge: "bg-red-100 text-red-700",    bar: "bg-red-500",    dot: "bg-red-500" },
  Bangalore: { border: "border-violet-200", header: "from-violet-600 to-purple-700",  badge: "bg-violet-100 text-violet-700",bar: "bg-violet-500", dot: "bg-violet-500" },
  Mumbai:    { border: "border-blue-200",   header: "from-blue-600 to-indigo-700",    badge: "bg-blue-100 text-blue-700",  bar: "bg-blue-500",   dot: "bg-blue-500" },
  Delhi:     { border: "border-emerald-200",header: "from-emerald-600 to-teal-700",   badge: "bg-emerald-100 text-emerald-700",bar: "bg-emerald-500",dot: "bg-emerald-500" },
  Hyderabad: { border: "border-amber-200",  header: "from-amber-500 to-orange-600",   badge: "bg-amber-100 text-amber-700",bar: "bg-amber-500",  dot: "bg-amber-500" },
};

function getAccent(city: string) {
  for (const key of Object.keys(WAREHOUSE_ACCENTS)) {
    if (city.includes(key)) return WAREHOUSE_ACCENTS[key];
  }
  return WAREHOUSE_ACCENTS["Bangalore"];
}

export default function WarehousesPage() {
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-inventory"], queryFn: fetchInventory, refetchInterval: 20000,
  });

  const byWarehouse: Record<string, { name: string; city: string; rows: InvRow[] }> = {};
  for (const row of data as InvRow[]) {
    if (!byWarehouse[row.warehouseId]) {
      byWarehouse[row.warehouseId] = { name: row.warehouseName, city: row.city, rows: [] };
    }
    byWarehouse[row.warehouseId].rows.push(row);
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warehouse Stock</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time inventory levels across all 5 warehouses</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", isFetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Summary pills */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(byWarehouse).map(([, wh]) => {
            const accent = getAccent(wh.city);
            const available = wh.rows.reduce((s, r) => s + r.available, 0);
            return (
              <div key={wh.name} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
                <div className={cn("h-2 w-2 rounded-full", accent.dot)} />
                <span className="text-slate-700">{wh.city}</span>
                <span className="text-slate-400">·</span>
                <span className="font-bold text-slate-900">{available} units available</span>
              </div>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-56 rounded-2xl bg-white border border-slate-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(byWarehouse).map(([whId, wh], wi) => {
            const accent = getAccent(wh.city);
            const totalStock    = wh.rows.reduce((s, r) => s + r.totalStock, 0);
            const totalReserved = wh.rows.reduce((s, r) => s + r.reservedStock, 0);
            const totalAvail    = totalStock - totalReserved;
            const lowStock  = wh.rows.filter(r => r.available > 0 && r.available <= 3).length;
            const outOfStock = wh.rows.filter(r => r.available === 0).length;
            const utilPct = totalStock > 0 ? Math.round((totalReserved / totalStock) * 100) : 0;

            return (
              <motion.div key={whId}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.08 }}
                className={cn("rounded-2xl border-2 bg-white shadow-sm overflow-hidden", accent.border)}>

                {/* Coloured header */}
                <div className={cn("bg-gradient-to-r px-6 py-4 text-white", accent.header)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 border border-white/20">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg leading-tight">{wh.name}</h2>
                        <p className="text-white/70 text-xs">{wh.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-2xl font-black tabular-nums">{totalAvail.toLocaleString()}</p>
                        <p className="text-white/60 text-xs">units available</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black tabular-nums">{wh.rows.length}</p>
                        <p className="text-white/60 text-xs">products</p>
                      </div>
                    </div>
                  </div>

                  {/* Utilisation bar inside header */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Stock utilisation</span>
                      <span>{totalReserved} reserved of {totalStock} total · <strong className="text-white">{utilPct}%</strong></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-white/80"
                        initial={{ width: 0 }} animate={{ width: `${utilPct}%` }} transition={{ duration: 0.7, delay: wi * 0.1 }} />
                    </div>
                  </div>
                </div>

                {/* Alert badges */}
                {(lowStock > 0 || outOfStock > 0) && (
                  <div className="flex gap-2 px-5 py-2 border-b border-slate-100 bg-slate-50">
                    {outOfStock > 0 && <Badge variant="destructive" className="text-xs">{outOfStock} out of stock</Badge>}
                    {lowStock > 0  && <Badge variant="warning"     className="text-xs">{lowStock} low stock (&le;3)</Badge>}
                  </div>
                )}

                {/* Products table */}
                <div className="divide-y divide-slate-50">
                  <div className="grid grid-cols-5 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/60">
                    <span className="col-span-2">Product</span>
                    <span className="text-center">Total</span>
                    <span className="text-center">Reserved</span>
                    <span className="text-center">Available</span>
                  </div>
                  {wh.rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-5 items-center px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="col-span-2 min-w-0 pr-4">
                        <p className="text-sm font-semibold text-slate-800 truncate">{row.productName}</p>
                        <p className="text-xs text-slate-400">{row.category}</p>
                      </div>
                      <p className="text-center text-sm font-semibold text-slate-700 tabular-nums">{row.totalStock}</p>
                      <p className="text-center text-sm font-semibold text-amber-600 tabular-nums">{row.reservedStock}</p>
                      <div className="flex justify-center">
                        {row.available === 0 ? (
                          <Badge variant="destructive" className="text-[10px] py-0">Sold out</Badge>
                        ) : row.available <= 3 ? (
                          <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                            <TrendingDown className="h-3 w-3" />{row.available}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-emerald-600 tabular-nums">{row.available}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
