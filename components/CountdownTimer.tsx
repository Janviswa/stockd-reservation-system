// components/CountdownTimer.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  showProgressBar?: boolean;
  totalSeconds?: number;
}

export function CountdownTimer({
  expiresAt,
  onExpire,
  showProgressBar = true,
  totalSeconds = 600,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setRemaining(diff);
      if (diff === 0 && !expired) {
        setExpired(true);
        onExpire?.();
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire, expired]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = (remaining / totalSeconds) * 100;

  const colorClass =
    remaining <= 60
      ? "text-red-600"
      : remaining <= 180
      ? "text-amber-600"
      : "text-emerald-600";

  const barColor =
    remaining <= 60
      ? "bg-red-500"
      : remaining <= 180
      ? "bg-amber-500"
      : "bg-emerald-500";

  if (expired) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <Clock className="h-5 w-5" />
        <span className="font-mono text-2xl font-bold">Expired</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2", colorClass)}>
        <motion.div
          animate={{ rotate: remaining <= 60 ? [0, -10, 10, 0] : 0 }}
          transition={{ repeat: remaining <= 60 ? Infinity : 0, duration: 0.5 }}
        >
          <Clock className="h-5 w-5" />
        </motion.div>
        <motion.span
          key={remaining}
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono text-3xl font-bold tabular-nums"
        >
          {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
        </motion.span>
      </div>

      {showProgressBar && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={cn("h-full rounded-full transition-colors duration-1000", barColor)}
            style={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
      )}

      <p className="text-xs text-slate-500">
        {remaining <= 60
          ? "⚠️ Expiring soon! Confirm now."
          : "Reservation expires in"}
      </p>
    </div>
  );
}
