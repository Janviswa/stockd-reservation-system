"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Edit2, Check, X, Search, Info, ShieldAlert,
  RefreshCw, TrendingDown, AlertTriangle, PackageCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

async function fetchInventory() {
  const res = await fetch("/api/admin/inventory");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

interface InvRow {
  id: string; warehouseName: string; city: string;
  productName: string; category: string;
  totalStock: number; reservedStock: number; available: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Healthcare:  "bg-red-100 text-red-700 border-red-200",
  Skincare:    "bg-pink-100 text-pink-700 border-pink-200",
  Fitness:     "bg-blue-100 text-blue-700 border-blue-200",
  Electronics: "bg-violet-100 text-violet-700 border-violet-200",
  Lifestyle:   "bg-amber-100 text-amber-700 border-amber-200",
};

export default function InventoryPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-inventory"], queryFn: fetchInventory, refetchInterval: 15000,
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const saveMutation = useMutation({
    mutationFn: async ({ inventoryId, totalStock }: { inventoryId: string; totalStock: number }) => {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, totalStock }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "✅ Stock updated", description: "Inventory level saved successfully." });
      setEditingId(null);
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const rows = data as InvRow[];
  const categories = ["All", ...Array.from(new Set(rows.map(r => r.category))).sort()];

  const filtered = rows.filter(r => {
    const matchSearch = r.productName.toLowerCase().includes(search.toLowerCase()) ||
                        r.warehouseName.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || r.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const outOfStockCount = rows.filter(r => r.available === 0).length;
  const lowStockCount   = rows.filter(r => r.available > 0 && r.available <= 3).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Inventory</h1>
        <p className="text-slate-500 text-sm mt-0.5">Adjust stock levels per product per warehouse</p>
      </div>

      {/* Admin-only notice */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <ShieldAlert className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-800">Admin-only access</p>
          <p className="text-indigo-600 mt-0.5">
            Only administrators can modify stock levels. <strong>reservedStock</strong> updates automatically
            when customers reserve or confirm orders — do not edit it directly. Only change <strong>totalStock</strong> when
            physically receiving or removing inventory.
          </p>
        </div>
      </div>

      {/* Auto-sync notice */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <Info className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-700">
          <strong>Stock levels update automatically</strong> in real time as customers reserve, confirm, or cancel orders.
          This table refreshes every 15 seconds. Use the edit button only to manually adjust <em>physical</em> stock counts.
        </p>
      </div>

      {/* Alert strip */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 font-medium">
              <AlertTriangle className="h-4 w-4" /> {outOfStockCount} product-warehouse combos out of stock
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 font-medium">
              <TrendingDown className="h-4 w-4" /> {lowStockCount} items with ≤3 units remaining
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product or warehouse…"
            className="h-9 w-full pl-9 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={cn("rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
                categoryFilter === cat
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
              {cat}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="ml-auto">
          <RefreshCw className={cn("h-4 w-4 mr-1.5", isFetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        Showing {filtered.length} of {rows.length} records
        {categoryFilter !== "All" && ` · Category: ${categoryFilter}`}
        {search && ` · Search: "${search}"`}
      </p>

      {/* Table */}
      {isLoading ? (
        <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Product", "Category", "Warehouse", "Total Stock", "Reserved", "Available", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row, i) => (
                <motion.tr key={row.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                  className={cn("hover:bg-slate-50/80 transition-colors",
                    row.available === 0 && "bg-red-50/30",
                    row.available > 0 && row.available <= 3 && "bg-amber-50/30")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.available === 0
                        ? <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        : row.available <= 3
                        ? <TrendingDown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        : <PackageCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                      <span className="font-semibold text-slate-800">{row.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-[10px] border", CATEGORY_COLORS[row.category] ?? "bg-slate-100 text-slate-600")}>
                      {row.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {row.warehouseName}<br />
                    <span className="text-slate-400">{row.city}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === row.id ? (
                      <input type="number" min={row.reservedStock} value={editValue}
                        onChange={e => setEditValue(Math.max(Number(e.target.value), row.reservedStock))}
                        className="w-20 h-8 rounded-lg border border-indigo-300 px-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    ) : (
                      <span className="font-bold tabular-nums text-slate-900">{row.totalStock}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold tabular-nums text-amber-600">{row.reservedStock}</span>
                    <span className="text-[10px] text-slate-400 ml-1">auto</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("font-bold tabular-nums",
                      row.available === 0 ? "text-red-600" : row.available <= 3 ? "text-amber-600" : "text-emerald-600")}>
                      {row.available}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === row.id ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="success"
                          onClick={() => saveMutation.mutate({ inventoryId: row.id, totalStock: editValue })}
                          disabled={saveMutation.isPending}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost"
                        onClick={() => { setEditingId(row.id); setEditValue(row.totalStock); }}
                        className="text-slate-500 hover:text-slate-900">
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">No records match your filters.</div>
          )}
        </div>
      )}
    </div>
  );
}
