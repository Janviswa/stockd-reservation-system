"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Search, Filter, CheckCircle2, XCircle,
  Clock, Users, PackagePlus, AlertTriangle, ShoppingCart,
  ChevronDown, ChevronUp, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function fetchLogs() {
  const res = await fetch("/api/admin/logs");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

interface LogEvent {
  id: string;
  event: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  reservation: {
    id: string;
    quantity: number;
    product: { name: string; category: string };
    warehouse: { name: string; city: string };
  };
}

const EVENT_CONFIG: Record<string, {
  label: string; icon: React.ElementType;
  bg: string; border: string; text: string; dot: string;
  description: (r: LogEvent) => string;
}> = {
  CREATED: {
    label: "Reserved",
    icon: ShoppingCart,
    bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500",
    description: (r) => `Customer reserved ${r.reservation?.quantity} unit(s) of ${r.reservation?.product?.name} from ${r.reservation?.warehouse?.name}`,
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500",
    description: (r) => `Purchase confirmed — ${r.reservation?.quantity} unit(s) of ${r.reservation?.product?.name} permanently deducted from ${r.reservation?.warehouse?.name}`,
  },
  RELEASED: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", dot: "bg-slate-400",
    description: (r) => `Reservation cancelled by customer — ${r.reservation?.quantity} unit(s) of ${r.reservation?.product?.name} returned to stock`,
  },
  EXPIRED: {
    label: "Expired",
    icon: AlertTriangle,
    bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500",
    description: (r) => `10-minute hold expired — ${r.reservation?.quantity} unit(s) of ${r.reservation?.product?.name} released back to ${r.reservation?.warehouse?.name}`,
  },
  WAITLIST_PROMOTED: {
    label: "Waitlist Promoted",
    icon: Users,
    bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500",
    description: (r) => `Waitlist customer auto-promoted for ${r.reservation?.product?.name} at ${r.reservation?.warehouse?.name} — new 10-min hold created`,
  },
  STOCK_ADDED: {
    label: "Stock Added",
    icon: PackagePlus,
    bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500",
    description: (r) => `Admin manually updated stock for ${r.reservation?.product?.name} at ${r.reservation?.warehouse?.name}`,
  },
};

const ALL_EVENTS = Object.keys(EVENT_CONFIG);

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function LogsPage() {
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-logs"], queryFn: fetchLogs, refetchInterval: 10000,
  });

  const [search, setSearch]           = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [expanded, setExpanded]       = useState<string | null>(null);

  const logs = data as LogEvent[];

  // Event type counts for the filter bar
  const counts = ALL_EVENTS.reduce<Record<string, number>>((acc, ev) => {
    acc[ev] = logs.filter(l => l.event === ev).length;
    return acc;
  }, {});

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.reservation?.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.reservation?.warehouse?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.event.toLowerCase().includes(search.toLowerCase());
    const matchEvent = eventFilter === "All" || l.event === eventFilter;
    return matchSearch && matchEvent;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Log</h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Immutable audit trail — every reservation state change · auto-refreshes every 10s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", isFetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Event type summary pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setEventFilter("All")}
          className={cn("rounded-full px-3 py-1.5 text-xs font-bold border transition-all",
            eventFilter === "All" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
          All · {logs.length}
        </button>
        {ALL_EVENTS.filter(ev => counts[ev] > 0).map(ev => {
          const cfg = EVENT_CONFIG[ev];
          const Icon = cfg.icon;
          return (
            <button key={ev} onClick={() => setEventFilter(ev === eventFilter ? "All" : ev)}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-all",
                eventFilter === ev
                  ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
              <Icon className="h-3 w-3" />
              {cfg.label} · {counts[ev]}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product, warehouse or event…"
            className="h-9 w-full pl-9 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
        {(search || eventFilter !== "All") && (
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setEventFilter("All"); }}>
            <Filter className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <span className="ml-auto self-center text-xs text-slate-400">{filtered.length} events</span>
      </div>

      {/* Log entries */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">No events yet</p>
          <p className="text-sm text-slate-400 mt-1">Make a reservation to see events appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((ev, i) => {
              const cfg = EVENT_CONFIG[ev.event] ?? {
                label: ev.event, icon: Activity,
                bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", dot: "bg-slate-400",
                description: () => "Event recorded",
              };
              const Icon = cfg.icon;
              const isOpen = expanded === ev.id;

              return (
                <motion.div key={ev.id}
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className={cn("rounded-xl border overflow-hidden transition-shadow hover:shadow-sm", cfg.border)}>

                  {/* Main row */}
                  <button onClick={() => setExpanded(isOpen ? null : ev.id)}
                    className={cn("w-full flex items-center gap-4 px-4 py-3 text-left", cfg.bg, "hover:brightness-[0.97] transition-all")}>
                    {/* Dot + icon */}
                    <div className={cn("flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border", cfg.bg, cfg.border)}>
                      <Icon className={cn("h-4 w-4", cfg.text)} />
                    </div>

                    {/* Event type */}
                    <div className="flex-shrink-0 w-36">
                      <span className={cn("text-xs font-bold uppercase tracking-wide", cfg.text)}>{cfg.label}</span>
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">
                        {ev.reservation?.product?.name ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {ev.reservation?.warehouse?.name ?? "—"} · Qty {ev.reservation?.quantity ?? "—"}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-semibold text-slate-500">{timeAgo(ev.createdAt)}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.createdAt).toLocaleTimeString("en-IN", { hour12: false })}
                      </p>
                    </div>

                    {/* Expand chevron */}
                    <div className="flex-shrink-0 ml-2 text-slate-400">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-200 bg-white">
                        <div className="px-4 py-4 grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2 text-sm">
                            <p className="font-semibold text-slate-700">What happened</p>
                            <p className="text-slate-500 leading-relaxed">{cfg.description(ev)}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-700">Details</p>
                            <div className="rounded-lg bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-xs">
                              <div className="flex justify-between px-3 py-2">
                                <span className="text-slate-500">Event ID</span>
                                <span className="font-mono text-slate-700 truncate ml-4">{ev.id.slice(0, 16)}…</span>
                              </div>
                              <div className="flex justify-between px-3 py-2">
                                <span className="text-slate-500">Reservation</span>
                                <span className="font-mono text-slate-700 truncate ml-4">{ev.reservation?.id?.slice(0, 16) ?? "—"}…</span>
                              </div>
                              <div className="flex justify-between px-3 py-2">
                                <span className="text-slate-500">Category</span>
                                <span className="text-slate-700">{ev.reservation?.product?.category ?? "—"}</span>
                              </div>
                              <div className="flex justify-between px-3 py-2">
                                <span className="text-slate-500">Timestamp</span>
                                <span className="font-mono text-slate-700">{new Date(ev.createdAt).toLocaleString("en-IN")}</span>
                              </div>
                              {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                                <div className="px-3 py-2">
                                  <span className="text-slate-500 block mb-1">Metadata</span>
                                  <pre className="text-[10px] text-slate-700 whitespace-pre-wrap">
                                    {JSON.stringify(ev.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
