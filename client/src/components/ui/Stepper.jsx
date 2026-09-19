import React from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Touch-friendly numeric stepper used for host configuration.
 */
export default function Stepper({
  value,
  min,
  max,
  onChange,
  disabled = false,
  label = 'value',
  format = (v) => v,
  step = 1,
}) {
  const buttonClass =
    'flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-bone transition hover:border-brand-500/60 hover:bg-brand-500/15 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:bg-white/5 disabled:hover:text-bone';

  const clamp = (next) => Math.min(max, Math.max(min, next));

  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - step))}
        className={buttonClass}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[3.5rem] text-center text-lg font-black tabular-nums text-white">
        {format(value)}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + step))}
        className={buttonClass}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}