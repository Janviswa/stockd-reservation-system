// app/(main)/reservations/[id]/page.tsx
"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  Package,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatCurrency } from "@/lib/utils";

async function fetchReservation(id: string) {
  const res = await fetch(`/api/reservations/${id}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

const statusConfig = {
  PENDING: {
    label: "Active",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    variant: "warning",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    variant: "success",
  },
  RELEASED: {
    label: "Released",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    variant: "secondary",
  },
} as const;

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: reservation,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => fetchReservation(id),
    refetchInterval: (data) => {
      if (data?.status === "PENDING") return 5000;
      return false;
    },
  });

  const handleExpire = useCallback(() => {
    refetch();
    toast({
      title: "Reservation expired",
      description: "Your reservation has expired. The stock has been released.",
      variant: "destructive",
    });
  }, [refetch, toast]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
        headers: {
          "idempotency-key": `confirm-${id}`,
        },
      });
      const body = await res.json();
      if (res.status === 410) throw new Error("EXPIRED");
      if (!res.ok) throw new Error(body.error ?? "Failed to confirm");
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Purchase confirmed! 🎉",
        description: "Your order has been placed successfully.",
      });
      refetch();
    },
    onError: (error: Error) => {
      if (error.message === "EXPIRED") {
        toast({
          title: "Reservation expired",
          description: "Your reservation expired. Please reserve again.",
          variant: "destructive",
        });
        refetch();
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reservations/${id}/release`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to cancel");
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Reservation cancelled",
        description: "The stock has been released.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="py-16 text-center">
        <p className="text-xl font-medium text-slate-900">Reservation not found</p>
        <Link href="/active-reservations">
          <Button variant="outline" className="mt-4">
            View My Reservations
          </Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[reservation.status as keyof typeof statusConfig];
  const isPending = reservation.status === "PENDING";
  const isExpired =
    isPending && new Date(reservation.expiresAt) < new Date();
  const isActionable = isPending && !isExpired;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/active-reservations"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Reservations
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Status banner */}
        <div
          className={cn(
            "rounded-xl border p-4",
            config.bg,
            config.border
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {reservation.status === "CONFIRMED" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : reservation.status === "RELEASED" ? (
                <XCircle className="h-5 w-5 text-slate-500" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
              <span className={cn("font-semibold", config.color)}>
                {reservation.status === "CONFIRMED"
                  ? "Purchase confirmed!"
                  : reservation.status === "RELEASED"
                  ? isExpired
                    ? "Reservation expired"
                    : "Reservation cancelled"
                  : "Reservation active"}
              </span>
            </div>
            <Badge variant={config.variant as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}>{config.label}</Badge>
          </div>

          {/* Countdown timer — only for pending */}
          {isPending && !isExpired && (
            <div className="mt-4">
              <CountdownTimer
                expiresAt={reservation.expiresAt}
                onExpire={handleExpire}
                showProgressBar
              />
            </div>
          )}

          {isExpired && isPending && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>This reservation has expired. Stock has been released.</span>
            </div>
          )}
        </div>

        {/* Product card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Reservation Details
          </h2>

          <div className="flex gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={reservation.product.image}
                alt={reservation.product.name}
                fill
                className="object-cover"
                onError={() => {}}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-lg">
                {reservation.product.name}
              </p>
              <p className="text-slate-500 text-sm">{reservation.product.category}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(reservation.product.price)}
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                Warehouse
              </span>
              <span className="text-sm font-medium text-slate-900">
                {reservation.warehouse.name}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                Location
              </span>
              <span className="text-sm font-medium text-slate-900">
                {reservation.warehouse.location}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Package className="h-4 w-4" />
                Quantity
              </span>
              <span className="text-sm font-medium text-slate-900">
                {reservation.quantity} unit{reservation.quantity > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                Reserved at
              </span>
              <span className="text-sm font-medium text-slate-900">
                {new Date(reservation.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                Expires at
              </span>
              <span className="text-sm font-medium text-slate-900">
                {new Date(reservation.expiresAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Reservation ID</span>
              <span className="text-xs font-mono text-slate-500">{reservation.id}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isActionable && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Button
              size="lg"
              variant="success"
              disabled={confirmMutation.isPending || releaseMutation.isPending}
              onClick={() => confirmMutation.mutate()}
            >
              {confirmMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Confirm Purchase</>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={confirmMutation.isPending || releaseMutation.isPending}
              onClick={() => releaseMutation.mutate()}
            >
              {releaseMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
              ) : (
                <><XCircle className="h-4 w-4" /> Cancel Reservation</>
              )}
            </Button>
          </motion.div>
        )}

        {reservation.status === "CONFIRMED" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-emerald-900">Order Confirmed!</h3>
            <p className="text-emerald-700 text-sm mt-1">
              Your purchase is complete. Thank you for shopping with Stockd.
            </p>
            <Link href="/products">
              <Button className="mt-4" variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </div>
        )}

        {(reservation.status === "RELEASED" || (isPending && isExpired)) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <XCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">
              {isExpired ? "Reservation Expired" : "Reservation Cancelled"}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {isExpired
                ? "Your 10-minute hold has ended. The stock is now available to others."
                : "You cancelled this reservation. The stock has been released."}
            </p>
            <Link href="/products">
              <Button className="mt-4">Browse Products Again</Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
