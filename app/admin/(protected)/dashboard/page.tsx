"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package, Warehouse, CheckCircle2, XCircle,
  Clock, Users, TrendingUp, BarChart3, Activity,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

async function fetchStats() {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

interface ChartDay { date: string; confirmed: number; pending: number; released: number }
interface TopProduct { id: string; name: string; category: string; reservations: number }

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 80}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-10 w-20" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stacked bar chart ─────────────────────────────────────────────────────────
function StackedBarChart({ data }: { data: ChartDay[] }) {
  const maxVal = Math.max(...data.map(d => d.confirmed + d.pending + d.released), 1);
  return (
    <div className="flex items-end gap-1.5 h-44 w-full">
      {data.map((day, i) => {
        const total = day.confirmed + day.pending + day.released;
        const pct = (v: number) => `${(v / maxVal) * 100}%`;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex flex-col-reverse rounded-sm overflow-hidden h-36"
              title={`${day.date}: ${day.confirmed} confirmed, ${day.pending} pending, ${day.released} released`}>
              {total === 0 && <div className="w-full bg-slate-100 flex-1 rounded-sm" />}
              {day.released  > 0 && <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.05, duration: 0.4 }}
                style={{ height: pct(day.released) }}  className="w-full bg-slate-300 origin-bottom" />}
              {day.pending   > 0 && <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }}
                style={{ height: pct(day.pending) }}   className="w-full bg-amber-400 origin-bottom" />}
              {day.confirmed > 0 && <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
                style={{ height: pct(day.confirmed) }} className="w-full bg-emerald-500 origin-bottom" />}
              {/* Tooltip */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="rounded-lg bg-slate-900 text-white text-[10px] px-2 py-1.5 whitespace-nowrap shadow-xl">
                  <p className="text-emerald-400">✓ {day.confirmed} confirmed</p>
                  <p className="text-amber-400">◷ {day.pending} pending</p>
                  <p className="text-slate-400">↩ {day.released} released</p>
                </div>
                <div className="h-1.5 w-1.5 bg-slate-900 rotate-45 -mt-1" />
              </div>
            </div>
            <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">{day.date}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────
function DonutChart({ confirmed, pending, released }: { confirmed: number; pending: number; released: number }) {
  const total = confirmed + pending + released || 1;
  const r = 36; const cx = 44; const cy = 44; const circ = 2 * Math.PI * r;
  const slices = [
    { val: confirmed, color: "#10b981", label: "Confirmed" },
    { val: pending,   color: "#f59e0b", label: "Pending" },
    { val: released,  color: "#94a3b8", label: "Released" },
  ];
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 88 88" className="h-28 w-28 flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {slices.map((s, i) => {
          const dash = (s.val / total) * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-xs font-bold" fill="#0f172a" fontSize="12" fontWeight="bold">{total}</text>
        <text x={cx} y={cx + 9} textAnchor="middle" fill="#94a3b8" fontSize="8">total</text>
      </svg>
      <div className="space-y-2">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="ml-auto font-bold text-slate-900 tabular-nums">{s.val}</span>
            <span className="text-xs text-slate-400">({Math.round((s.val / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stock utilisation bar ─────────────────────────────────────────────────────
function StockBar({ reserved, total }: { reserved: number; total: number }) {
  const pct = total > 0 ? (reserved / total) * 100 : 0;
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{reserved.toLocaleString()} reserved</span>
        <span>{total.toLocaleString()} total · <strong>{Math.round(pct)}%</strong></span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

const statCards = (t: Record<string, number>, chart: ChartDay[]) => {
  const confirmedTrend = chart.slice(-3).map(d => d.confirmed);
  const pendingTrend   = chart.slice(-3).map(d => d.pending);
  return [
    { label: "Products",       value: t.products,      sub: "in catalogue",    icon: Package,      color: "bg-blue-50 text-blue-600 border-blue-100",     trend: null },
    { label: "Warehouses",     value: t.warehouses,    sub: "active",          icon: Warehouse,    color: "bg-violet-50 text-violet-600 border-violet-100", trend: null },
    { label: "Active Holds",   value: t.pending,       sub: "expiring in <10m",icon: Clock,        color: "bg-amber-50 text-amber-600 border-amber-100",    trend: pendingTrend },
    { label: "Confirmed",      value: t.confirmed,     sub: "all time",        icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-100",trend: confirmedTrend },
    { label: "Released",       value: t.released,      sub: "cancelled/expired",icon: XCircle,     color: "bg-slate-50 text-slate-600 border-slate-200",    trend: null },
    { label: "Waitlist",       value: t.waitlist,      sub: "awaiting stock",  icon: Users,        color: "bg-pink-50 text-pink-600 border-pink-100",       trend: null },
    { label: "Total Stock",    value: t.totalStock,    sub: "units across all",icon: BarChart3,    color: "bg-teal-50 text-teal-600 border-teal-100",       trend: null },
    { label: "Reserved Units", value: t.reservedStock, sub: "currently held",  icon: TrendingUp,   color: "bg-orange-50 text-orange-600 border-orange-100", trend: null },
  ];
};

export default function AdminDashboard() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["admin-stats"], queryFn: fetchStats, refetchInterval: 30000,
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  );

  const t = (data?.totals ?? {}) as Record<string, number>;
  const chart: ChartDay[] = data?.chart ?? [];
  const topProducts: TopProduct[] = data?.topProducts ?? [];
  const lastUpdate = new Date(dataUpdatedAt).toLocaleTimeString("en-IN");

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Live data · auto-refreshes every 30s · last updated {lastUpdate}
          </p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards(t, chart).map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${card.color.split(' ').filter(c => c.startsWith('border')).join(' ')}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.color.split(' ').filter(c => !c.startsWith('border')).join(' ')}`}>
                <card.icon className="h-4 w-4" />
              </div>
              {card.trend && <Sparkline values={card.trend} color={card.color.includes('emerald') ? '#10b981' : '#f59e0b'} />}
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{(card.value ?? 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{card.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Stacked bar — spans 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800">Reservations — last 7 days</h2>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />Confirmed</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" />Pending</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300 inline-block" />Released</span>
            </div>
          </div>
          <StackedBarChart data={chart} />
        </div>

        {/* Donut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-5">Reservation split</h2>
          <DonutChart confirmed={t.confirmed ?? 0} pending={t.pending ?? 0} released={t.released ?? 0} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">Most Reserved Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-slate-400 text-sm">No reservations yet.</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-800 truncate">{p.name}</span>
                      <span className="text-sm font-bold text-slate-900 tabular-nums ml-2 flex-shrink-0">{p.reservations}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-slate-800" initial={{ width: 0 }}
                        animate={{ width: `${(p.reservations / (topProducts[0]?.reservations || 1)) * 100}%` }}
                        transition={{ duration: 0.7, delay: i * 0.1 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock health */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-1">Stock Utilisation</h2>
          <p className="text-xs text-slate-400 mb-5">Reserved vs total units across all warehouses</p>
          <div className="space-y-5">
            <StockBar reserved={t.reservedStock ?? 0} total={t.totalStock ?? 0} />
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label: "Available", value: (t.totalStock ?? 0) - (t.reservedStock ?? 0), icon: ArrowUpRight, color: "text-emerald-600" },
                { label: "Reserved",  value: t.reservedStock ?? 0,                          icon: Clock,         color: "text-amber-600" },
                { label: "Waitlist",  value: t.waitlist ?? 0,                               icon: ArrowDownRight,color: "text-pink-600" },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                  <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.value.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
