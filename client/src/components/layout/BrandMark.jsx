import React from 'react';

/**
 * Redacted brand mark: a blacked-out redaction bar slashed by the orange
 * ember accent - RED ACTED. Pure inline SVG - no image assets needed.
 */
export default function BrandMark({ size = 'md', className = '' }) {
  const dims = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-coal shadow-lg shadow-black/50 ${dims} ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-3/5 w-3/5" role="img" aria-label="Redacted logo">
        {/* Blacked-out secret bar */}
        <rect x="5" y="11" width="22" height="10" rx="2.5" fill="#F5F5F0" />
        <rect x="5" y="11" width="22" height="10" rx="2.5" fill="#0A0A0A" opacity="0.55" />
        {/* Orange slash cutting through the redaction */}
        <path d="M9 25L23 7" stroke="#FF6B00" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
