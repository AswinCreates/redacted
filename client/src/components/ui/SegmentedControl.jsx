import React from 'react';

/**
 * Pill-style segmented control. Accepts either plain values or
 * `{ value, label }` option objects, so callers can show richer labels.
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
  disabled = false,
  size = 'md',
  ariaLabel,
}) {
  const sizeClass = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm';

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/30 p-1 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      {options.map((option) => {
        const optionValue = option && typeof option === 'object' ? option.value : option;
        const optionLabel = option && typeof option === 'object' ? option.label : option;
        const isActive = optionValue === value;

        return (
          <button
            key={String(optionValue)}
            type="button"
            disabled={disabled}
            aria-pressed={isActive}
            onClick={() => onChange(optionValue)}
            className={`${sizeClass} rounded-lg font-bold transition disabled:cursor-not-allowed ${
              isActive
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'text-mist hover:bg-white/10 hover:text-bone'
            }`}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}