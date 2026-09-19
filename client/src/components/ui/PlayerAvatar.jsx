import React from 'react';

const PALETTES = [
  'from-brand-500 to-brand-700',
  'from-amber-500 to-brand-600',
  'from-stone-500 to-stone-700',
  'from-orange-400 to-rose-500',
  'from-yellow-500 to-brand-500',
  'from-neutral-500 to-neutral-700',
  'from-brand-400 to-amber-600',
  'from-stone-400 to-brand-700',
];

const SIZES = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

/** Stable colour per player name so the same player always looks the same. */
function hashName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export default function PlayerAvatar({ name = '?', size = 'md', dimmed = false, className = '' }) {
  const palette = PALETTES[hashName(name) % PALETTES.length];
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-black text-white shadow-lg shadow-black/40 ${palette} ${SIZES[size]} ${
        dimmed ? 'opacity-40 saturate-50' : ''
      } ${className}`}
    >
      {initial}
    </span>
  );
}