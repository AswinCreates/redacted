import React, { useEffect, useState } from 'react';
import { Hourglass } from 'lucide-react';

/**
 * Phase countdown. The remaining time is always derived from the server's
 * absolute `phaseExpiresAt` timestamp, never from a locally chosen duration.
 */
export default function TimerHeader({ phaseExpiresAt, label }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!phaseExpiresAt) return undefined;

    const tick = () => setTimeLeft(Math.max(0, Math.ceil((phaseExpiresAt - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [phaseExpiresAt]);

  const isLow = timeLeft <= 5;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-mist">
        <Hourglass className="h-3.5 w-3.5" />
        {label}
      </span>
      <span
        className={`font-mono text-lg font-black tabular-nums ${
          isLow ? 'animate-pulse text-rose-300' : 'text-brand-300'
        }`}
      >
        {timeLeft}s
      </span>
    </div>
  );
}