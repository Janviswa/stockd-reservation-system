// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStockStatus(available: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (available === 0) {
    return { label: "Out of stock", color: "text-red-600", bg: "bg-red-50" };
  }
  if (available <= 3) {
    return { label: "Low stock", color: "text-amber-600", bg: "bg-amber-50" };
  }
  return { label: "Available", color: "text-emerald-600", bg: "bg-emerald-50" };
}

export function formatTimeRemaining(expiresAt: Date | string): {
  text: string;
  seconds: number;
  color: string;
} {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  let color = "text-emerald-600";
  if (seconds <= 120) color = "text-red-600";
  else if (seconds <= 300) color = "text-amber-600";

  return {
    text: `${mins}:${secs.toString().padStart(2, "0")}`,
    seconds,
    color,
  };
}
