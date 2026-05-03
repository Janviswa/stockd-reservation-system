"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Sparkles, Dumbbell, Cpu, Coffee, ArrowRight, Shield, Clock, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) return [];
  return res.json();
}

// First 4 product names per category to build the collage
const COLLAGE_NAMES: Record<string, string[]> = {
  Healthcare:  ["BP Monitor", "Glucose Monitor", "Pulse Oximeter", "Digital Thermometer"],
  Skincare:    ["Face Wash", "Sunscreen SPF 50", "Face Serum", "Moisturizer"],
  Fitness:     ["Dumbbells (Pair, 5kg)", "Yoga Mat", "Resistance Bands Set", "Foam Roller"],
  Electronics: ["Bluetooth Earbuds", "Smartwatch", "Power Bank (10,000 mAh)", "Portable Speaker"],
  Lifestyle:   ["Water Bottle (Steel, 1L)", "Backpack (Casual)", "Analog Watch", "Leather Wallet"],
};

const categories = [
  { name: "Healthcare",  icon: Heart,    accent: "from-red-500 to-rose-600",     bg: "bg-red-50",    border: "border-red-200",    ring: "hover:ring-red-300" },
  { name: "Skincare",    icon: Sparkles, accent: "from-pink-500 to-fuchsia-600", bg: "bg-pink-50",   border: "border-pink-200",   ring: "hover:ring-pink-300" },
  { name: "Fitness",     icon: Dumbbell, accent: "from-blue-500 to-indigo-600",  bg: "bg-blue-50",   border: "border-blue-200",   ring: "hover:ring-blue-300" },
  { name: "Electronics", icon: Cpu,      accent: "from-violet-500 to-purple-600",bg: "bg-violet-50", border: "border-violet-200", ring: "hover:ring-violet-300" },
  { name: "Lifestyle",   icon: Coffee,   accent: "from-amber-500 to-orange-500", bg: "bg-amber-50",  border: "border-amber-200",  ring: "hover:ring-amber-300" },
];

const features = [
  { icon: Shield, title: "Race-condition proof",  desc: "Database-level row locking — only one buyer secures the last unit, no matter how many try." },
  { icon: Clock,  title: "10-minute hold",        desc: "Your item is reserved while you pay. Auto-released if you don't confirm, no double-selling." },
  { icon: Zap,    title: "5 Indian warehouses",   desc: "Chennai, Bangalore, Mumbai, Delhi & Hyderabad. Nearest detected from your pincode." },
];

const stats = [
  { value: "50+", label: "Products" },
  { value: "5",   label: "Warehouses" },
  { value: "10m", label: "Hold timer" },
  { value: "0",   label: "Oversells" },
];

export default function HomePage() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  function getCategoryImages(catName: string): string[] {
    const names = COLLAGE_NAMES[catName] ?? [];
    const imgs: string[] = [];
    for (const name of names) {
      const p = (products as { name: string; images?: string[]; image?: string }[])
        .find(pr => pr.name === name);
      // Try images[] first, then image field — both may be valid depending on seed state
      const candidates = [
        ...(Array.isArray(p?.images) ? p.images : []),
        p?.image ?? "",
      ].filter(s => typeof s === "string" && s.trim().length > 0);
      const src = candidates[0] ?? "";
      if (src) imgs.push(src);
      if (imgs.length === 4) break;
    }
    return imgs;
  }

  return (
    <div className="space-y-20">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-16 text-white md:px-16 md:py-24">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-600 opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-600 opacity-15 blur-3xl" />

        <div className="relative grid gap-12 lg:grid-cols-2 items-center">
          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-slate-300 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live inventory · 5 warehouses · Real-time
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl font-extrabold tracking-tight leading-[1.1] sm:text-6xl">
              Your cart.
              <span className="block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Actually saved.
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-5 text-lg text-slate-300 leading-relaxed">
              Stop losing items to checkout race conditions. Stockd holds your products for{" "}
              <strong className="text-white">10 minutes</strong> — guaranteed, no overselling.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-lg shadow-white/10">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/active-reservations">
                <Button size="lg" className="border border-white/25 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold">
                  My Reservations
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="hidden lg:grid grid-cols-2 gap-4">
            {stats.map(s => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center">
                <p className="text-4xl font-black text-white">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── Category collage ─────────────────────────────────────────────────── */}
      <section>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Shop by Category</h2>
          <p className="text-slate-500 mb-7">50+ products across 5 categories from 5 Indian warehouses</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat, i) => {
            const imgs = getCategoryImages(cat.name);
            const Icon = cat.icon;
            return (
              <motion.div key={cat.name}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i + 0.3 }}
                whileHover={{ y: -6, transition: { duration: 0.18 } }}>
                <Link href={`/products?category=${cat.name}`}
                  className={`group flex flex-col rounded-2xl border-2 overflow-hidden bg-white transition-all duration-200 hover:shadow-xl hover:ring-2 ${cat.border} ${cat.ring} ring-offset-2`}>

                  {/* ── Collage area ── */}
                  <div className={`${cat.bg} p-3`}>
                    {imgs.length >= 4 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {imgs.map((src, idx) => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-white shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : imgs.length > 0 ? (
                      /* fewer than 4 — show what we have + placeholder icons */
                      <div className="grid grid-cols-2 gap-1.5">
                        {[0,1,2,3].map(idx => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-white/80 flex items-center justify-center shadow-sm">
                            {imgs[idx] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imgs[idx]} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className={`rounded-xl bg-gradient-to-br ${cat.accent} p-3`}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* no products yet — icon fallback */
                      <div className="aspect-square flex items-center justify-center">
                        <div className={`rounded-2xl bg-gradient-to-br ${cat.accent} p-6`}>
                          <Icon className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Label ── */}
                  <div className="px-3 py-3 flex items-center gap-2">
                    <div className={`flex-shrink-0 rounded-lg bg-gradient-to-br ${cat.accent} p-1.5`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{COLLAGE_NAMES[cat.name].slice(0,2).join(", ")}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 ml-auto flex-shrink-0 group-hover:text-slate-600 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="grid gap-5 sm:grid-cols-3">
        {features.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i + 0.5 }}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 group-hover:bg-indigo-700 transition-colors">
              <f.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 p-10 text-center text-white">
        <div className="flex justify-center gap-1 mb-4">
          {[1,2,3,4,5].map(s => <Star key={s} className="h-5 w-5 text-amber-400 fill-amber-400" />)}
        </div>
        <p className="text-2xl font-extrabold max-w-lg mx-auto leading-tight">
          "Finally — a checkout that doesn't steal your item while you're paying."
        </p>
        <p className="text-slate-400 text-sm mt-3">Built to solve real e-commerce race conditions · Powered by Postgres row locks</p>
        <Link href="/products">
          <Button className="mt-7 bg-white text-slate-900 hover:bg-slate-100 font-bold text-base px-8" size="lg">
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.section>
    </div>
  );
}
