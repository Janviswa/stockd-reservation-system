"use client";
import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Package, AlertTriangle, CheckCircle,
  Loader2, Truck, Clock, ChevronDown, ChevronUp,
  Navigation, Bell, Info, ZoomIn, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatCurrency } from "@/lib/utils";

interface WarehouseOption {
  warehouseId: string; warehouseName: string; city: string; location: string;
  distanceKm: number; available: number; shippingCost: number;
  deliveryDays: number; deliveryLabel: string; isNearest: boolean; isRecommended: boolean;
}
interface DetectResult {
  detectedLocation: { city: string; state: string; pincode: string };
  warehouses: WarehouseOption[];
  recommendedWarehouseId: string | null;
}
interface Product {
  id: string; name: string; image: string; images: string[];
  brand: string; category: string; price: number; description: string;
  colors: string[]; size: string; boxContents: string;
  inventory: { warehouseId: string; warehouseName: string; location: string; available: number }[];
  totalAvailable: number;
}

async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}
async function detectWarehouses(pincode: string, productId: string): Promise<DetectResult> {
  const res = await fetch("/api/detect-warehouse", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pincode, productId }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Failed to detect location");
  return body;
}
async function createReservation(data: { productId: string; warehouseId: string; quantity: number }) {
  const res = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "idempotency-key": `${data.productId}-${data.warehouseId}-${Date.now()}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) { const e = new Error(body.error ?? "Failed") as Error & { status: number }; e.status = res.status; throw e; }
  return body;
}
async function joinWaitlist(data: { productId: string; warehouseId: string; email: string }) {
  const res = await fetch("/api/waitlist", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, quantity: 1 }),
  });
  const body = await res.json();
  if (!res.ok && res.status !== 409) throw new Error(body.error ?? "Failed");
  return { ...body, alreadyJoined: res.status === 409 };
}

// ── Image Gallery — thumbnails on LEFT, main on RIGHT ────────────────────────
function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive]   = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [errors, setErrors]   = useState<Record<number, boolean>>({});

  const validImages = images.filter(s => s && s.trim());
  const count = validImages.length;
  if (count === 0) return (
    <div className="aspect-square rounded-2xl bg-slate-100 flex items-center justify-center text-8xl">📦</div>
  );

  const safeActive = Math.min(active, count - 1);
  const prev = () => setActive(i => (i - 1 + count) % count);
  const next = () => setActive(i => (i + 1) % count);
  const mainSrc = errors[safeActive] ? "" : validImages[safeActive];

  return (
    <>
      <div className={cn("flex gap-3", count > 1 ? "flex-row" : "flex-col")}>

        {/* ── Thumbnail strip — LEFT side ── */}
        {count > 1 && (
          <div className="flex flex-col gap-2 flex-shrink-0 w-20">
            {validImages.map((src, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={cn(
                  "w-20 aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                  safeActive === i
                    ? "border-indigo-600 shadow-md shadow-indigo-200 ring-2 ring-indigo-300 ring-offset-1"
                    : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                )}>
                {errors[i] ? (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-lg">📦</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={`${name} ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => setErrors(e => ({ ...e, [i]: true }))}
                    loading="lazy" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Main image ── */}
        <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-100 shadow-sm aspect-square">
          <AnimatePresence mode="wait">
            <motion.div key={safeActive} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="absolute inset-0">
              {mainSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainSrc} alt={`${name} ${safeActive + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => setErrors(e => ({ ...e, [safeActive]: true }))} />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-8xl">📦</div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          {count > 1 && (
            <>
              <button onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors">
                <ChevronLeft className="h-5 w-5 text-slate-700" />
              </button>
              <button onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors">
                <ChevronRight className="h-5 w-5 text-slate-700" />
              </button>
            </>
          )}

          {/* Zoom + counter */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {count > 1 && (
              <div className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white">
                {safeActive + 1}/{count}
              </div>
            )}
            <button onClick={() => setLightbox(true)}
              className="h-8 w-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
              <ZoomIn className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}>
            <button onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
            {mainSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainSrc} alt={name}
                className="max-h-[88vh] max-w-[88vw] object-contain rounded-xl shadow-2xl"
                onClick={e => e.stopPropagation()} />
            )}
            {count > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={e => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pincodeInput, setPincodeInput] = useState("");
  const [pincode, setPincode]           = useState("");
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [detecting, setDetecting]       = useState(false);
  const [detectError, setDetectError]   = useState("");

  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [showAdvanced, setShowAdvanced]               = useState(false);
  const [selectedColor, setSelectedColor]             = useState("");

  const [waitlistEmail, setWaitlistEmail]             = useState("");
  const [waitlistWarehouseId, setWaitlistWarehouseId] = useState("");
  const [showWaitlistForm, setShowWaitlistForm]       = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"], queryFn: fetchProducts, refetchInterval: 15000,
  });

  const product = (products as Product[]).find(p => p.id === id);
  const isGloballyOutOfStock = (product?.totalAvailable ?? 0) === 0;

  // Build valid images array — filter empty strings
  const allImages = product
    ? (product.images?.filter(s => s && s.trim()).length
        ? product.images.filter(s => s && s.trim())
        : product.image ? [product.image] : [])
    : [];

  const selectedOption = detectResult?.warehouses.find(w => w.warehouseId === selectedWarehouseId);
  const selectedInventory = product?.inventory?.find(inv => inv.warehouseId === selectedWarehouseId);
  const availableAtSelected = selectedOption?.available ?? selectedInventory?.available ?? 0;

  const handleDetect = useCallback(async () => {
    const cleaned = pincodeInput.trim();
    if (cleaned.length !== 6) { setDetectError("Enter a valid 6-digit pincode"); return; }
    setDetecting(true); setDetectError("");
    try {
      const result = await detectWarehouses(cleaned, id);
      setDetectResult(result);
      setPincode(cleaned);
      if (result.recommendedWarehouseId) setSelectedWarehouseId(result.recommendedWarehouseId);
    } catch (e) {
      setDetectError(e instanceof Error ? e.message : "Unknown error");
    } finally { setDetecting(false); }
  }, [pincodeInput, id]);

  const reserveMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: reservation => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Reserved! 🎉", description: `${product?.name} held for 10 minutes.` });
      router.push(`/reservations/${reservation.id}`);
    },
    onError: (error: Error & { status?: number }) => {
      toast({
        title: error.status === 409 ? "Just sold out!" : "Error",
        description: error.status === 409
          ? "Someone grabbed the last unit. Try another warehouse."
          : error.message,
        variant: "destructive",
      });
    },
  });

  const waitlistMutation = useMutation({
    mutationFn: joinWaitlist,
    onSuccess: data => {
      toast({ title: data.alreadyJoined ? "Already on waitlist" : "You're on the waitlist! ✅", description: data.message });
      if (!data.alreadyJoined) { setShowWaitlistForm(false); setWaitlistEmail(""); }
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );

  if (!product) return (
    <div className="py-16 text-center">
      <p className="text-xl font-medium text-slate-900">Product not found</p>
      <Link href="/products"><Button variant="outline" className="mt-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button></Link>
    </div>
  );

  const canReserve = !!(selectedWarehouseId && availableAtSelected > 0 && !isGloballyOutOfStock);
  const noStockAnywhere = !!(detectResult && detectResult.warehouses.every(w => w.available === 0));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="grid gap-10 lg:grid-cols-2">

        {/* ── LEFT: Gallery ── */}
        <ImageGallery images={allImages} name={product.name} />

        {/* ── RIGHT: Details ── */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="secondary" className="text-xs">{product.category}</Badge>
              {product.brand && <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{product.brand}</span>}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{product.name}</h1>
            <p className="mt-2 text-slate-500 text-sm leading-relaxed">{product.description}</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{formatCurrency(product.price)}</p>
          </div>

          {/* Color */}
          {product.colors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Color: <span className="font-normal text-slate-500">{selectedColor || "Choose one"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c === selectedColor ? "" : c)}
                    className={cn("rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                      selectedColor === c
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-300 hover:border-slate-600")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Specs */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 overflow-hidden text-sm">
            {product.size && (
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-500 font-medium">Size / Weight</span>
                <span className="text-slate-900 font-semibold text-right max-w-[60%]">{product.size}</span>
              </div>
            )}
            {product.colors?.length > 0 && (
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-500 font-medium">Available Colors</span>
                <span className="text-slate-900 font-semibold text-right">{product.colors.join(", ")}</span>
              </div>
            )}
            {product.boxContents && (
              <div className="flex flex-col gap-1 px-4 py-2.5">
                <span className="text-slate-500 font-medium">In the box</span>
                <span className="text-slate-800 leading-relaxed">{product.boxContents}</span>
              </div>
            )}
          </div>

          {/* Pincode */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700">Check delivery options</span>
              {detectResult && (
                <span className="ml-auto text-xs text-emerald-600 font-semibold">
                  📍 {detectResult.detectedLocation.city}, {detectResult.detectedLocation.state}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit pincode"
                value={pincodeInput} onChange={e => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleDetect()}
                className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <Button onClick={handleDetect} disabled={detecting || pincodeInput.length !== 6}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5">
                {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
              </Button>
            </div>
            {detectError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {detectError}
              </p>
            )}
          </div>

          {/* Warehouse options */}
          <AnimatePresence>
            {detectResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Delivery options</p>
                  <button onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold">
                    {showAdvanced ? "Show recommended" : "All warehouses"}
                    {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {(showAdvanced
                  ? detectResult.warehouses
                  : detectResult.warehouses.filter(w => w.available > 0 || w.isNearest).slice(0, 3)
                ).map(wh => {
                  const isSelected = selectedWarehouseId === wh.warehouseId;
                  const oos = wh.available === 0;
                  return (
                    <motion.button key={wh.warehouseId}
                      onClick={() => !oos && setSelectedWarehouseId(wh.warehouseId)}
                      disabled={oos}
                      whileHover={!oos ? { scale: 1.005 } : {}}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-all",
                        isSelected ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500 ring-offset-1"
                          : oos ? "border-slate-100 bg-slate-50/60 opacity-50 cursor-not-allowed"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer"
                      )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-900">{wh.warehouseName}</span>
                            {wh.isRecommended && !oos && <Badge variant="success" className="text-[10px]">Recommended</Badge>}
                            {wh.isNearest && !wh.isRecommended && <Badge variant="secondary" className="text-[10px]">Nearest</Badge>}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{wh.distanceKm} km away</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {oos ? (
                            <span className="text-xs font-semibold text-red-500">Out of stock</span>
                          ) : (
                            <span className={cn("text-xs font-bold", wh.available <= 3 ? "text-amber-600" : "text-emerald-600")}>
                              {wh.available <= 3 ? `Only ${wh.available} left!` : `${wh.available} in stock`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {wh.shippingCost === 0
                            ? <span className="text-emerald-600 font-bold">FREE delivery</span>
                            : <span>₹{wh.shippingCost} shipping</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{wh.deliveryLabel}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}

                {!showAdvanced && detectResult.warehouses.filter(w => w.available > 0).length === 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    No stock near you. Join the waitlist below.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shipping summary */}
          <AnimatePresence>
            {selectedOption && availableAtSelected > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">
                    {selectedOption.shippingCost === 0 ? "Free delivery" : `₹${selectedOption.shippingCost} shipping`} · {selectedOption.deliveryLabel}
                  </p>
                  <p className="text-xs text-emerald-600">From {selectedOption.warehouseName} ({selectedOption.distanceKm} km)</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reserve button */}
          {!isGloballyOutOfStock && !noStockAnywhere && (
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg"
                disabled={!canReserve || reserveMutation.isPending}
                onClick={() => reserveMutation.mutate({ productId: id, warehouseId: selectedWarehouseId, quantity: 1 })}>
                {reserveMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Reserving…</>
                ) : !pincode ? (
                  "Enter your pincode to see delivery options"
                ) : !selectedWarehouseId ? (
                  "Select a delivery option above"
                ) : availableAtSelected === 0 ? (
                  "No stock at selected warehouse"
                ) : (
                  `Reserve Now — Hold for 10 min${selectedOption?.shippingCost === 0 ? " · FREE delivery" : ""}`
                )}
              </Button>
            </motion.div>
          )}

          {/* Waitlist */}
          {(isGloballyOutOfStock || noStockAnywhere) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-bold text-amber-900">Join the Waitlist</p>
                  <p className="text-xs text-amber-700">We auto-reserve a unit for you when stock returns.</p>
                </div>
              </div>
              <div className="relative">
                <select value={waitlistWarehouseId} onChange={e => setWaitlistWarehouseId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-amber-300 bg-white px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">Choose warehouse…</option>
                  {(detectResult?.warehouses ?? product.inventory).map((w: { warehouseId: string; warehouseName: string }) => (
                    <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              {!showWaitlistForm ? (
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowWaitlistForm(true)} disabled={!waitlistWarehouseId}>
                  <Bell className="h-4 w-4 mr-1" /> Notify Me When Available
                </Button>
              ) : (
                <div className="space-y-2">
                  <input type="email" placeholder="your@email.com" value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    className="w-full h-9 rounded-lg border border-amber-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                      disabled={!waitlistEmail || !waitlistWarehouseId || waitlistMutation.isPending}
                      onClick={() => waitlistMutation.mutate({ productId: id, warehouseId: waitlistWarehouseId, email: waitlistEmail })}>
                      {waitlistMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</> : "Join Waitlist"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowWaitlistForm(false)}>Cancel</Button>
                  </div>
                  <p className="text-[10px] text-amber-700">A 10-min reservation is auto-created when stock returns.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* All warehouses accordion */}
          <details className="group rounded-xl border border-slate-200 bg-white overflow-hidden">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 list-none select-none">
              <Package className="h-4 w-4 text-slate-400" />
              Stock across all 5 warehouses
              <ChevronDown className="h-4 w-4 ml-auto text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="divide-y divide-slate-100 px-4 pb-2">
              {product.inventory?.map(inv => (
                <div key={inv.warehouseId} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-slate-700 font-medium">{inv.warehouseName}</p>
                    <p className="text-xs text-slate-400">{inv.location}</p>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums",
                    inv.available === 0 ? "text-red-500" : inv.available <= 3 ? "text-amber-500" : "text-emerald-600")}>
                    {inv.available === 0 ? "Sold out" : `${inv.available} units`}
                  </span>
                </div>
              ))}
            </div>
          </details>

          <p className="text-xs text-center text-slate-400">🔒 Stock held for 10 minutes. No payment needed to reserve.</p>
        </div>
      </motion.div>
    </div>
  );
}
