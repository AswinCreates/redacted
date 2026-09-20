import React from 'react';
import { Globe, UsersRound } from 'lucide-react';
import { GAME_MODES, GAME_MODE_META } from '../../utils/gameModes';

const MODE_ICONS = {
  [GAME_MODES.ONLINE]: Globe,
  [GAME_MODES.OFFLINE]: UsersRound,
};

/**
 * The host's first decision: how this room is going to be played.
 *
 * Plain selectable cards (not a segmented control) so the difference between the
 * two modes is readable before anyone commits to creating a room. The chosen value
 * is sent with `create_room` and can still be changed by the host in the lobby
 * until the match starts.
 */
export default function GameModeSelector({ value, onChange, disabled = false }) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-mist">
        Choose game mode
      </legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {Object.values(GAME_MODES).map((mode) => {
          const meta = GAME_MODE_META[mode];
          const Icon = MODE_ICONS[mode];
          const isActive = value === mode;

          return (
            <button
              key={mode}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(mode)}
              className={`flex flex-col gap-1.5 rounded-2xl border p-3.5 text-left transition active:scale-[.98] disabled:cursor-not-allowed ${
                isActive
                  ? 'border-brand-500/60 bg-brand-500/15 shadow-lg shadow-brand-500/20'
                  : 'border-white/10 bg-black/25 hover:border-brand-500/40 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-300' : 'text-mist'}`} />
                <span
                  className={`text-xs font-black uppercase tracking-[0.14em] ${
                    isActive ? 'text-white' : 'text-bone'
                  }`}
                >
                  {meta.label}
                </span>
              </span>
              <span className="text-xs leading-relaxed text-bone">{meta.tagline}</span>
              <span className="text-[11px] leading-relaxed text-mist">{meta.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
