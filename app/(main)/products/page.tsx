"use client";
import { useState, useMemo, Suspense, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, RefreshCw, ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Healthcare", "Skincare", "Fitness", "Electronics", "Lifestyle"];
const PRICE_RANGES = [
  { label: "Any price",       min: 0,    max: Infinity },
  { label: "Under ₹500",      min: 0,    max: 500 },
  { label: "₹500 – ₹1,000",   min: 500,  max: 1000 },
  { label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500+",         min: 2500, max: Infinity },
];
const SORT_OPTIONS = [
  { label: "Relevance",       key: "relevance" },
  { label: "Price: Low → High", key: "price_asc" },
  { label: "Price: High → Low", key: "price_desc" },
  { label: "Name A → Z",      key: "name_asc" },
];
const STOCK_OPTIONS = [
  { label: "All",           key: "all" },
  { label: "In stock",      key: "instock" },
  { label: "Low stock ≤3",  key: "low" },
  { label: "Out of stock",  key: "out" },
];

async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

interface Product {
  id: string; name: string; image: string; images: string[];
  category: string; price: number; colors: string[];
  inventory: { warehouseId: string; warehouseName: string; available: number }[];
  totalAvailable: number;
}

// ── Clean inline filter panel (not floating popover) ─────────────────────────
function FilterDrawer({
  open, onClose,
  priceIdx, setPriceIdx,
  sortKey, setSortKey,
  stockKey, setStockKey,
  colorFilter, setColorFilter,
  allColors,
  onClear, activeCount,
}: {
  open: boolean; onClose: () => void;
  priceIdx: number; setPriceIdx: (i: number) => void;
  sortKey: string; setSortKey: (k: string) => void;
  stockKey: string; setStockKey: (k: string) => void;
  colorFilter: string; setColorFilter: (c: string) => void;
  allColors: string[];
  onClear: () => void;
  activeCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 top-full mt-2 z-40 w-[340px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
            <span className="font-bold text-slate-800 text-sm">Filter &amp; Sort</span>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button onClick={onClear}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
                  Clear all ({activeCount})
                </button>
              )}
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors text-lg leading-none">✕</button>
            </div>
          </div>

          <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Sort */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Sort by</p>
              <div className="grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map(s => (
                  <button key={s.key} onClick={() => setSortKey(s.key)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-xs font-semibold border text-left transition-all",
                      sortKey === s.key
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                    )}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100" />

            {/* Price */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Price range</p>
              <div className="space-y-1.5">
                {PRICE_RANGES.map((p, i) => (
                  <button key={i} onClick={() => setPriceIdx(i)}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-xs font-semibold border text-left transition-all flex items-center justify-between",
                      priceIdx === i
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                    )}>
                    <span>{p.label}</span>
                    {priceIdx === i && <span className="text-indigo-200">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Availability */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Availability</p>
              <div className="grid grid-cols-2 gap-2">
                {STOCK_OPTIONS.map(s => (
                  <button key={s.key} onClick={() => setStockKey(s.key)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-xs font-semibold border text-left transition-all",
                      stockKey === s.key
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                    )}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            {allColors.length > 0 && (
              <>
                <div className="h-px bg-slate-100" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setColorFilter("")}
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold border transition-all",
                        !colorFilter ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
                      Any
                    </button>
                    {allColors.map(c => (
                      <button key={c} onClick={() => setColorFilter(c === colorFilter ? "" : c)}
                        className={cn("rounded-full px-3 py-1 text-xs font-semibold border transition-all",
                          colorFilter === c ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category") ?? "All";

  const [search, setSearch]             = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceIdx, setPriceIdx]         = useState(0);
  const [sortKey, setSortKey]           = useState("relevance");
  const [stockKey, setStockKey]         = useState("all");
  const [colorFilter, setColorFilter]   = useState("");
  const [filterOpen, setFilterOpen]     = useState(false);

  const { data: products = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["products"], queryFn: fetchProducts, refetchInterval: 30000,
  });

  const allColors = useMemo(() => {
    const set = new Set<string>();
    (products as Product[]).forEach(p => p.colors?.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [products]);

  const activeCount = (priceIdx > 0 ? 1 : 0)
    + (sortKey !== "relevance" ? 1 : 0)
    + (stockKey !== "all" ? 1 : 0)
    + (colorFilter ? 1 : 0);

  function clearAll() {
    setPriceIdx(0); setSortKey("relevance"); setStockKey("all"); setColorFilter("");
  }

  const filtered = useMemo(() => {
    let list = products as Product[];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory !== "All") list = list.filter(p => p.category === selectedCategory);
    const pr = PRICE_RANGES[priceIdx];
    list = list.filter(p => p.price >= pr.min && p.price <= pr.max);
    if (stockKey === "instock") list = list.filter(p => p.totalAvailable > 3);
    if (stockKey === "low")     list = list.filter(p => p.totalAvailable > 0 && p.totalAvailable <= 3);
    if (stockKey === "out")     list = list.filter(p => p.totalAvailable === 0);
    if (colorFilter) list = list.filter(p => p.colors?.includes(colorFilter));
    if (sortKey === "price_asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sortKey === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sortKey === "name_asc")   list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, search, selectedCategory, priceIdx, sortKey, stockKey, colorFilter]);

  function handleCategory(cat: string) {
    setSelectedCategory(cat);
    router.replace(cat === "All" ? "/products" : `/products?category=${cat}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">All Products</h1>
        <p className="mt-1 text-slate-500">{(products as Product[]).length} products across 5 warehouses</p>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search products…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter button with dropdown */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(o => !o)}
            className={cn(
              "flex items-center gap-2 h-10 rounded-lg border px-4 text-sm font-semibold transition-all",
              filterOpen || activeCount > 0
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            )}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-black">
                {activeCount}
              </span>
            )}
            <ChevronDown className={cn("h-3.5 w-3.5 ml-0.5 transition-transform", filterOpen && "rotate-180")} />
          </button>

          <FilterDrawer
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            priceIdx={priceIdx} setPriceIdx={setPriceIdx}
            sortKey={sortKey} setSortKey={setSortKey}
            stockKey={stockKey} setStockKey={setStockKey}
            colorFilter={colorFilter} setColorFilter={setColorFilter}
            allColors={allColors}
            onClear={clearAll}
            activeCount={activeCount}
          />
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-1.5 h-10">
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          {isFetching ? "Refreshing…" : "Refresh Stock"}
        </Button>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Active filters:</span>
          {sortKey !== "relevance" && (
            <span className="flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              {SORT_OPTIONS.find(s => s.key === sortKey)?.label}
              <button onClick={() => setSortKey("relevance")} className="ml-1 text-slate-400 hover:text-slate-700">✕</button>
            </span>
          )}
          {priceIdx > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
              {PRICE_RANGES[priceIdx].label}
              <button onClick={() => setPriceIdx(0)} className="ml-1 text-indigo-400 hover:text-indigo-700">✕</button>
            </span>
          )}
          {stockKey !== "all" && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              {STOCK_OPTIONS.find(s => s.key === stockKey)?.label}
              <button onClick={() => setStockKey("all")} className="ml-1 text-emerald-400 hover:text-emerald-700">✕</button>
            </span>
          )}
          {colorFilter && (
            <span className="flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-semibold text-violet-700">
              {colorFilter}
              <button onClick={() => setColorFilter("")} className="ml-1 text-violet-400 hover:text-violet-700">✕</button>
            </span>
          )}
          <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
            Clear all
          </button>
        </div>
      )}

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => handleCategory(cat)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors",
              selectedCategory === cat
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
            )}>
            {cat}
          </button>
        ))}
      </div>

      {!isLoading && (
        <p className="text-sm text-slate-500">
          Showing <strong>{filtered.length}</strong> product{filtered.length !== 1 ? "s" : ""}
          {selectedCategory !== "All" && ` in ${selectedCategory}`}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white animate-pulse overflow-hidden">
              <div className="aspect-square bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-9 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600 font-medium">Failed to load products</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-bold text-slate-900 text-lg">No products match your filters</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting or clearing your filters</p>
          <Button variant="outline" className="mt-5" onClick={() => {
            setSearch(""); setSelectedCategory("All"); clearAll();
          }}>Clear all filters</Button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedCategory}-${search}-${priceIdx}-${sortKey}-${stockKey}-${colorFilter}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 items-stretch"
          >
            {filtered.map((product, i) => (
              <ProductCard key={product.id} {...product} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-slate-500 p-8 text-center">Loading…</div>}>
      <ProductsContent />
    </Suspense>
  );
}
