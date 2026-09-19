import React, { useEffect, useRef, useState } from 'react';

export default function CategoryDropdown({
  options = [],
  value = [],
  onChange,
  disabled = false,
  max = 3,
  label = 'Themes',
  hint = 'Select up to 3 word-bank themes for this match',
  icon: Icon,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);
  const selected = Array.isArray(value) ? value.filter(Boolean) : [];
  const remaining = max - selected.length;
  const all = Array.isArray(options)
    ? options.map((o) => (typeof o === 'object' && o !== null ? o.label ?? o.value : o)).filter(Boolean)
    : [];
  const filtered = query ? all.filter((n) => n.toLowerCase().includes(query.toLowerCase())) : all;
  const rest = filtered.filter((n) => !selected.includes(n));
  const slotsLeft = Math.max(0, max - selected.length);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onMouse = (e) => { if (!menuRef.current?.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouse);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouse);
    };
  }, [open]);

  function toggle(cat) {
    if (disabled) return;
    if (selected.includes(cat)) { onChange(selected.filter((c) => c !== cat)); }
    else if (selected.length < max) { onChange([...selected, cat]); }
  }

  const checkSvg = (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
  const starSvg = (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
  const closeSvg = (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
  const searchSvg = (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
  const chevronSvg = (
    <svg className="h-4 w-4 shrink-0 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
  const emptySvg = (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M7 12h10M12 7v10" />
    </svg>
  );

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-start gap-3 mt-6">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-400">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-bone">{label}</p>
          {hint && <p className="mt-0.5 text-xs leading-relaxed text-mist">{hint}</p>}
        </div>
            </div>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        className={`mt-3 flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm ${
          disabled
            ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
            : open
            ? 'border-brand-500/50 bg-brand-500/10'
            : 'border-white/10 bg-black/25 hover:border-brand-500/50 hover:bg-white/5'
        }`}
        disabled={disabled}
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1">
          {selected.length === 0 ? (
            <span className="text-mist">
              {disabled ? 'No categories set' : 'Select themes…'}
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selected.slice(0, 2).map((c) => (
                <span key={c} className="rounded-full border border-brand-500/30 bg-brand-500/15 px-2 py-0.5 text-xs font-bold text-brand-300">
                  {c}
                </span>
              ))}
              {selected.length > 2 && (
                <span className="rounded-full border border-brand-500/30 bg-brand-500/15 px-2 py-0.5 text-xs font-bold text-brand-300">
                  +{selected.length - 2}
                </span>
              )}
            </div>
          )}
        </span>
        <span className="shrink-0 text-mist">
          {selected.length}/{max}
          {React.cloneElement(chevronSvg, { className: `ml-1 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}` })}
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-white/10 bg-coal shadow-2xl shadow-black/50 overflow-hidden">
          <div className="border-b border-white/5 p-3 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mist">{searchSvg}</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search themes…"
              className="w-full rounded-lg border border-white/10 bg-black/25 py-2 pl-9 pr-3 text-sm text-bone placeholder:text-mist outline-none focus:border-brand-500/50"
              disabled={disabled}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1" role="listbox">
            {rest.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl px-3 py-5 text-sm text-mist">
                {emptySvg}
                {query ? `No themes match "${query}"` : 'All themes already selected'}
              </div>
            ) : (
              <>
                {selected.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selected.length >= max) onChange([]);
                      else onChange([...selected, ...rest].slice(0, max));
                    }}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs border border-white/5 hover:bg-white/5 transition"
                  >
                    <span className="text-brand-300">
                      {selected.length >= max ? 'Clear all' : `Add all (${rest.length})`}
                    </span>
                    <span className="text-mist">
                      {selected.length >= max ? '0/3' : `${Math.min(max, selected.length + rest.length)}/${max}`}
                    </span>
                  </button>
                )}
                {rest.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="option"
                    aria-selected={selected.includes(cat)}
                    onClick={() => toggle(cat)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      selected.includes(cat)
                        ? 'bg-brand-500/10 border border-brand-500/30'
                        : 'border border-transparent hover:bg-white/5'
                    }`}
                    disabled={disabled}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
                        selected.includes(cat)
                          ? 'bg-brand-500/20 text-brand-300'
                          : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {selected.includes(cat) ? checkSvg : starSvg}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-bone">{cat}</span>
                      <span
                        className={`block text-[11px] font-semibold ${
                          selected.includes(cat) ? 'text-brand-300' : 'text-mist'
                        }`}
                      >
                        {selected.includes(cat) ? 'Selected' : 'Not selected'}
                      </span>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Selection chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {selected.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/15 px-2.5 py-1 text-xs font-bold text-brand-300"
          >
            {checkSvg}
            {cat}
            <button
              type="button"
              onClick={() => toggle(cat)}
              className="ml-0.5 rounded-full p-0.5 text-brand-300 hover:bg-brand-500/30"
              aria-label={`Remove ${cat}`}
            >
              {closeSvg}
            </button>
          </span>
        ))}
        {selected.length === 0 && !disabled && (
          <span className="text-xs text-mist">Tap to choose up to {max}</span>
        )}
        {disabled && selected.length > 0 && (
          <span className="text-[11px] text-mist">Host only</span>
        )}
      </div>
    </div>
  );
}