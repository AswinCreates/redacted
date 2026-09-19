import React from 'react';

/**
 * One labelled configuration row. Keeps every host setting visually consistent
 * and stacked cleanly on small screens.
 */
export default function SettingRow({ icon: Icon, label, hint, children, accentClass = 'text-brand-400' }) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ${accentClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-bold text-bone">{label}</p>
          {hint ? <p className="mt-0.5 text-xs leading-relaxed text-mist">{hint}</p> : null}
        </div>
      </div>
      <div className="sm:shrink-0">{children}</div>
    </div>
  );
}