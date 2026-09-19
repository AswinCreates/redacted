import React from 'react';
import { MessageSquare } from 'lucide-react';

/**
 * Animated list of clues submitted so far this round.
 * Clues are public by design (they are spoken aloud in the real game).
 */
export default function ClueTimeline({ clues = [] }) {
  if (clues.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center">
        <MessageSquare className="h-5 w-5 text-mist" />
        <p className="text-sm text-mist">No clues yet — the first player is thinking.</p>
      </div>
    );
  }

  return (
    <ol className="scrollbar-slim max-h-72 space-y-2 overflow-y-auto pr-1">
      {clues.map((clue, index) => (
        <li
          key={`${clue.playerId}-${clue.timestamp}-${index}`}
          style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
          className="flex animate-fade-in-up items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-3"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[11px] font-black text-bone">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-brand-300">{clue.playerName}</span>
            <span className="block break-words text-sm text-bone">{clue.clueText}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}