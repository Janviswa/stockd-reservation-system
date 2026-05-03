"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, XCircle, Clock, Play, RotateCcw,
  ChevronDown, Lock, Database, GitBranch, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

async function fetchProducts() {
  const res = await fetch("/api/products");
  return res.json();
}

interface RaceResult {
  requestId: number;
  status: "SUCCESS" | "CONFLICT";
  httpStatus: number;
  reservationId?: string;
  durationMs: number;
}

const HOW_IT_WORKS = [
  {
    icon: GitBranch,
    title: "Concurrent requests fire simultaneously",
    body: "All N requests are dispatched via Promise.all() — truly parallel, hitting the API at the same moment.",
  },
  {
    icon: Database,
    title: "SELECT FOR UPDATE acquires a row lock",
    body: "Inside each transaction, Postgres locks the inventory row. The second request blocks at the database level until the first commits.",
  },
  {
    icon: Lock,
    title: "Serializable isolation prevents phantom reads",
    body: "The transaction runs at SERIALIZABLE level. After the winner commits, the loser reads the updated reservedStock and sees 0 available — returning HTTP 409.",
  },
  {
    icon: CheckCircle2,
    title: "Exactly-one-succeeds guaranteed",
    body: "No matter how many concurrent requests fire, the number of winners equals min(requests, availableStock). This is the core invariant.",
  },
];

export default function RaceDemoPage() {
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [concurrency, setConcurrency] = useState(10);
  const [resetAfter, setResetAfter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: Record<string, unknown>;
    results: RaceResult[];
    explanation: Record<string, string>;
  } | null>(null);
  const [error, setError] = useState("");

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const selectedProduct = products.find((p: { id: string }) => p.id === productId);

  async function runRace() {
    if (!productId || !warehouseId) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/demo/race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, warehouseId, concurrency, quantity: 1, resetAfter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Race failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const summary = result?.summary as Record<string, number & string & boolean> | undefined;
  const winners = result?.results.filter((r) => r.status === "SUCCESS") ?? [];
  const losers  = result?.results.filter((r) => r.status === "CONFLICT") ?? [];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <Zap className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Concurrency Demo</h1>
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">Admin Only</Badge>
            </div>
            <p className="text-sm text-slate-500">Testing tool — creates and releases real reservations</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Database className="h-4 w-4 text-slate-500" /> How the lock works
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 border border-violet-100">
                <step.icon className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>


      </div>

      {/* Test configurator */}
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/60 to-white p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Play className="h-4 w-4 text-violet-600" /> Run the test
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Product</label>
            <div className="relative">
              <select value={productId} onChange={e => { setProductId(e.target.value); setWarehouseId(""); }}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">Choose a product…</option>
                {(products as { id: string; name: string; category: string }[]).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Warehouse</label>
            <div className="relative">
              <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} disabled={!productId}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50">
                <option value="">Choose warehouse…</option>
                {(selectedProduct as { inventory?: { warehouseId: string; warehouseName: string; available: number }[] } | undefined)
                  ?.inventory?.map(inv => (
                  <option key={inv.warehouseId} value={inv.warehouseId}>
                    {inv.warehouseName} — {inv.available} units available
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Concurrency slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Concurrent Requests</label>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-violet-600 tabular-nums">{concurrency}</span>
              <span className="text-xs text-slate-400">simultaneous</span>
            </div>
          </div>
          <input type="range" min={2} max={20} value={concurrency} onChange={e => setConcurrency(Number(e.target.value))}
            className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>2 min</span><span>10 default</span><span>20 max</span>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={resetAfter} onChange={e => setResetAfter(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-violet-600" />
          <span>Auto-release demo reservations after test <span className="text-slate-400">(keeps stock levels clean)</span></span>
        </label>

        <div className="flex gap-3 pt-1">
          <Button onClick={runRace} disabled={loading || !productId || !warehouseId} size="lg"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm">
            {loading
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}><Zap className="h-4 w-4" /></motion.div> Firing {concurrency} requests…</>
              : <><Play className="h-4 w-4" /> Fire {concurrency} Concurrent Requests</>}
          </Button>
          {result && (
            <Button variant="outline" onClick={() => setResult(null)}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && summary && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Verdict */}
            <div className={cn("rounded-2xl border-2 p-6 shadow-sm",
              summary.correct ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50")}>
              <div className="flex items-start gap-3">
                {summary.correct
                  ? <CheckCircle2 className="h-7 w-7 text-emerald-600 flex-shrink-0 mt-0.5" />
                  : <XCircle className="h-7 w-7 text-red-600 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className={cn("font-bold text-xl", summary.correct ? "text-emerald-900" : "text-red-900")}>
                    {String(summary.verdict)}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    All {summary.concurrentRequests} requests completed in <strong>{summary.totalDurationMs}ms</strong>
                    {resetAfter && " · Reservations auto-released."}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-4 gap-3">
                {[
                  { label: "Fired",         value: summary.concurrentRequests, color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
                  { label: "Stock before",  value: summary.availableStockBefore, color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
                  { label: "✅ Won (201)",  value: summary.winners,             color: "text-emerald-700",bg: "bg-emerald-100 border-emerald-300" },
                  { label: "❌ Lost (409)", value: summary.losers,              color: "text-red-700",    bg: "bg-red-100 border-red-300" },
                ].map(s => (
                  <div key={s.label} className={cn("rounded-xl border p-3 text-center", s.bg)}>
                    <p className={cn("text-2xl font-black tabular-nums", s.color)}>{String(s.value)}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-request grid */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">
                Per-request breakdown
                <span className="ml-2 font-normal text-slate-400">— sorted by request ID</span>
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {result.results.map(r => (
                  <motion.div key={r.requestId}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: r.requestId * 0.025 }}
                    className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                      r.status === "SUCCESS"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-100 bg-slate-50")}>
                    {r.status === "SUCCESS"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      : <XCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                    <span className="flex-1 font-semibold text-slate-700">Request #{r.requestId}</span>
                    <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded-full",
                      r.status === "SUCCESS"
                        ? "bg-emerald-200 text-emerald-800"
                        : "bg-slate-200 text-slate-600")}>
                      {r.httpStatus}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 tabular-nums">
                      <Clock className="h-3 w-3" />{r.durationMs}ms
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Summary insight */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Interpretation: </span>
              {winners.length} request{winners.length !== 1 ? "s" : ""} successfully acquired the lock and
              incremented <code className="bg-white border border-slate-200 px-1 rounded text-xs">reservedStock</code>.
              {" "}{losers.length} request{losers.length !== 1 ? "s" : ""} blocked on the row lock, then read the updated
              value and returned 409 Conflict — exactly as designed.
              {resetAfter ? " All demo reservations were released automatically." : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
