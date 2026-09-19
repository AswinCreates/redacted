import React from 'react';
import { Fingerprint, Search, VenetianMask, Eye, Users } from 'lucide-react';

/**
 * Asset-free, reusable role reveal card built on a single 3D flip surface.
 *
 * Two variants share the same component and themes:
 *   hero    - the big reveal shown during the role reveal stage
 *   compact - the slim card kept on screen during clues/voting so the player
 *             can still see (or re-hide) their own information
 *
 * The secret payload is only mounted once `revealed` is true, so the page never
 * contains the word or hint before the player chooses to flip the card.
 */

const ROLE_THEMES = {
  INNOCENT: {
    Icon: Search,
    label: 'Innocent',
    accentText: 'text-brand-300',
    face: 'border-brand-500/40 from-brand-500/20 via-coal to-night shadow-brand-500/20',
    chip: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
    valueText: 'text-brand-300',
  },
  IMPOSTER: {
    Icon: VenetianMask,
    label: 'Imposter',
    accentText: 'text-rose-300',
    face: 'border-rose-400/40 from-rose-600/25 via-coal to-night shadow-rose-900/30',
    chip: 'border-rose-400/30 bg-rose-500/15 text-rose-300',
    valueText: 'text-rose-300',
  },
  SPECTATOR: {
    Icon: Eye,
    label: 'Spectator',
    accentText: 'text-bone',
    face: 'border-white/15 from-mist/20 via-coal to-night shadow-black/30',
    chip: 'border-white/20 bg-white/10 text-bone',
    valueText: 'text-bone',
  },
};

export default function RoleRevealCard({
  rolePayload,
  selfId,
  revealed = false,
  onToggle,
  variant = 'hero',
  className = '',
}) {
  const role = rolePayload?.role;
  const isCompact = variant === 'compact';

  if (!role) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-coal/80 p-8 text-center ${className}`}
      >
        <span className="h-9 w-9 animate-spin-slow rounded-full border-2 border-brand-500/25 border-t-brand-500" />
        <p className="text-sm font-semibold text-bone">Dealing your role…</p>
      </div>
    );
  }

  const theme = ROLE_THEMES[role] ?? ROLE_THEMES.INNOCENT;
  const Icon = theme.Icon;
  const others = (rolePayload?.coImposters ?? []).filter((p) => p.id !== selfId);

  const revealedHero = (
    <span className="flex h-full flex-col items-center justify-center gap-2.5 text-center">
      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${theme.chip}`}>
        <Icon className="h-7 w-7" />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-mist">Your role</span>
      <span className={`text-3xl font-black tracking-tight ${theme.accentText}`}>{theme.label}</span>
      <span className="h-px w-14 bg-white/15" />

      {role === 'INNOCENT' ? (
        <>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-mist">Secret word</span>
          <span className="break-words px-2 text-4xl font-black leading-tight tracking-tight text-brand-300 sm:text-5xl">
            {rolePayload.word}
          </span>
          <span className="text-xs text-mist">Describe it without ever saying it.</span>
        </>
      ) : null}

      {role === 'IMPOSTER' ? (
        <>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-mist">Your hint</span>
          <span className="break-words px-2 text-3xl font-black leading-tight tracking-tight text-rose-300 sm:text-4xl">
            {rolePayload.hint}
          </span>
          <span className="text-xs text-mist">You do not know the word. Bluff your way through.</span>
          {others.length > 0 ? (
            <span className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-rose-300" />
              <span className="text-[11px] font-bold text-bone">
                {others.length === 1 ? 'Fellow imposter:' : 'Fellow imposters:'}
              </span>
              {others.map((p) => (
                <span key={p.id} className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${theme.chip}`}>
                  {p.playerName}
                </span>
              ))}
            </span>
          ) : null}
        </>
      ) : null}

      {role === 'SPECTATOR' ? (
        <>
          <span className="text-3xl font-black tracking-tight text-bone">Spectator</span>
          <span className="px-4 text-sm text-mist">
            You were voted out earlier. Sit back and watch the rest play out.
          </span>
        </>
      ) : null}
    </span>
  );

  const revealedCompact = (
    <span className="flex h-full items-center gap-3 text-left">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${theme.chip}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-mist">
          {role === 'INNOCENT' ? 'Secret word' : role === 'IMPOSTER' ? 'Your hint' : 'Status'}
        </span>
        <span className={`block truncate text-lg font-black ${theme.valueText}`}>
          {role === 'INNOCENT' ? rolePayload.word : role === 'IMPOSTER' ? rolePayload.hint : 'Watching'}
        </span>
      </span>
      <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wider text-mist sm:block">
        Tap to hide
      </span>
    </span>
  );

  return (
    <div className={`perspective-1800 w-full ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={revealed}
        aria-label={revealed ? 'Hide your role' : 'Reveal your role'}
        className={`group relative block w-full preserve-3d transition-transform duration-700 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70 ${
          isCompact ? 'h-32' : 'h-80 sm:h-96'
        } ${revealed ? 'flip-y' : 'animate-float'}`}
      >
        {/* Hidden face */}
        <span className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-coal via-night to-night shadow-2xl shadow-black/60 backface-hidden">
          <span className="absolute inset-0 bg-grid-faint opacity-60" />
          <span className="absolute inset-0 bg-aurora opacity-40" />
          <span className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <span className="absolute -inset-2 animate-glow-pulse rounded-3xl bg-brand-500/25 blur-xl" />
              <Fingerprint className="relative h-8 w-8 text-brand-300" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-mist">Your role</span>
            <span className={`font-black tracking-tight text-white ${isCompact ? 'text-base' : 'text-2xl'}`}>
              Tap to reveal
            </span>
            {isCompact ? null : <span className="text-xs text-mist">Only you can see this</span>}
          </span>
        </span>

        {/* Revealed face */}
        <span
          className={`absolute inset-0 overflow-hidden rounded-3xl border bg-gradient-to-br shadow-2xl backface-hidden flip-y ${
            isCompact ? 'p-4' : 'p-6'
          } ${theme.face}`}
        >
          {revealed ? (isCompact ? revealedCompact : revealedHero) : <span className="block h-full" />}
        </span>
      </button>
    </div>
  );
}