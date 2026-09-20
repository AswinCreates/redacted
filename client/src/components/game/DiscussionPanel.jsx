import React, { useEffect, useState } from 'react';
import { MessageCircleMore } from 'lucide-react';
import { formatClock } from '../../utils/formatTime';

const remainingSeconds = (phaseExpiresAt) =>
  phaseExpiresAt ? Math.max(0, Math.ceil((phaseExpiresAt - Date.now()) / 1000)) : 0;

/**
 * Offline (face-to-face) discussion screen.
 *
 * The players are in the same room and give their clues out loud, so there is no
 * clue input, no turn queue and no stored clues - this card is the whole "clue
 * phase" for that mode: one shared countdown.
 *
 * The countdown is display-only and always derived from the server's absolute
 * `phaseExpiresAt` (never from a locally chosen duration), and it is the server
 * that moves the room to voting when the timer expires, so reconnecting clients
 * can never desync or restart it. When it hits zero the phase changes underneath
 * us and the voting UI takes over.
 */
export default function DiscussionPanel({ phaseExpiresAt, totalSeconds = 0 }) {
  const [secondsLeft, setSecondsLeft] = useState(() => remainingSeconds(phaseExpiresAt));

  useEffect(() => {
    if (!phaseExpiresAt) return undefined;

    const tick = () => setSecondsLeft(remainingSeconds(phaseExpiresAt));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [phaseExpiresAt]);

  const isLow = secondsLeft <= 10;
  const progress =
    totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;

  return (
    <section className="glass space-y-5 rounded-3xl p-6 text-center shadow-2xl shadow-black/40">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.36em] text-brand-300">
          Discussion time
        </p>
        <h2 className="font-display text-2xl font-black leading-tight text-white sm:text-3xl">
          Discuss your clues with the group
        </h2>
        <p className="flex items-center justify-center gap-2 pt-1 text-xs font-semibold text-mist">
          <MessageCircleMore className="h-3.5 w-3.5" />
          Speak out loud — nothing is typed or shared on screen.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 px-4 py-7">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${
            isLow ? 'bg-rose-500/10' : 'bg-brand-500/10'
          }`}
        />
        <p
          role="timer"
          aria-live="off"
          className={`relative font-mono text-6xl font-black tabular-nums leading-none sm:text-7xl ${
            isLow ? 'animate-pulse text-rose-300' : 'text-white'
          }`}
        >
          {formatClock(secondsLeft)}
        </p>
        <div className="relative mx-auto mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <span
            className={`block h-full rounded-full transition-[width] duration-300 ease-linear ${
              isLow ? 'bg-rose-400' : 'bg-brand-400'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <p className="text-xs font-semibold text-bone">
        Voting begins when the timer reaches zero.
      </p>
    </section>
  );
}
