// app/(main)/active-reservations/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ArrowRight,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatTimeRemaining } from "@/lib/utils";

async function fetchReservations() {
  const res = await fetch("/api/reservations");
  if (!res.ok) throw new Error("Failed to fetch reservations");
  return res.json();
}

function TimerBadge({ expiresAt }: { expiresAt: string }) {
  const [time, setTime] = useState(formatTimeRemaining(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTimeRemaining(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className={cn("font-mono text-sm font-bold tabular-nums", time.color)}>
      {time.seconds === 0 ? "Expired" : time.text}
    </span>
  );
}

const statusConfig = {
  PENDING: { label: "Active", variant: "warning" as const, icon: Clock },
  CONFIRMED: { label: "Confirmed", variant: "success" as const, icon: CheckCircle2 },
  RELEASED: { label: "Released", variant: "secondary" as const, icon: XCircle },
};

export default function ActiveReservationsPage() {
  const { data: reservations = [], isLoading, refetch } = useQuery({
    queryKey: ["reservations"],
    queryFn: fetchReservations,
    refetchInterval: 10000,
  });

  const pending = reservations.filter(
    (r: { status: string; expiresAt: string }) =>
      r.status === "PENDING" && new Date(r.expiresAt) > new Date()
  );
  const others = reservations.filter(
    (r: { status: string; expiresAt: string }) =>
      r.status !== "PENDING" ||
      new Date(r.expiresAt) <= new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Reservations</h1>
          <p className="mt-1 text-slate-500">
            {pending.length} active hold{pending.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : reservations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-24 text-center"
        >
          <ShoppingBag className="h-16 w-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">No reservations yet</h2>
          <p className="text-slate-400 mt-2 max-w-sm">
            Browse products and reserve items to hold them while you checkout.
          </p>
          <Link href="/products">
            <Button className="mt-6">
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Active / Pending */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Active Holds ({pending.length})
              </h2>
              <AnimatePresence>
                <div className="space-y-3">
                  {pending.map(
                    (r: {
                      id: string;
                      status: "PENDING" | "CONFIRMED" | "RELEASED";
                      expiresAt: string;
                      createdAt: string;
                      quantity: number;
                      product: { id: string; name: string; image: string; category: string; price: number };
                      warehouse: { name: string; location: string };
                    }) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm"
                      >
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <Image
                            src={r.product.image}
                            alt={r.product.name}
                            fill
                            className="object-cover"
                            onError={() => {}}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {r.product.name}
                          </p>
                          <p className="text-sm text-slate-500">{r.warehouse.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Package className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              Qty: {r.quantity}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-sm font-bold text-slate-900">
                              {formatCurrency(r.product.price)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <TimerBadge expiresAt={r.expiresAt} />
                          </div>
                          <Link href={`/reservations/${r.id}`}>
                            <Button size="sm">
                              Continue
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </AnimatePresence>
            </section>
          )}

          {/* Past reservations */}
          {others.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Past Reservations ({others.length})
              </h2>
              <div className="space-y-2">
                {others.map(
                  (r: {
                    id: string;
                    status: "PENDING" | "CONFIRMED" | "RELEASED";
                    expiresAt: string;
                    createdAt: string;
                    quantity: number;
                    product: { id: string; name: string; image: string; category: string; price: number };
                    warehouse: { name: string; location: string };
                  }) => {
                    const config = statusConfig[r.status];
                    const Icon = config.icon;
                    const isExpiredPending =
                      r.status === "PENDING" && new Date(r.expiresAt) <= new Date();

                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 opacity-75">
                          <Image
                            src={r.product.image}
                            alt={r.product.name}
                            fill
                            className="object-cover"
                            onError={() => {}}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-700 truncate text-sm">
                            {r.product.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {r.warehouse.name} · Qty {r.quantity} · {formatCurrency(r.product.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge variant={config.variant}>
                            <Icon className="h-3 w-3 mr-1" />
                            {isExpiredPending ? "Expired" : config.label}
                          </Badge>
                          <Link href={`/reservations/${r.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
