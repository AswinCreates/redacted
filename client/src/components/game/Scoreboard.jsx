import React from 'react';
import { Trophy } from 'lucide-react';
import PlayerAvatar from '../ui/PlayerAvatar';

/**
 * Ranked score list reused by both the round reveal and the final results.
 * Cards rise in sequentially for a light reveal animation.
 */
export default function Scoreboard({ players = [], winnerIds = [], markEliminated = true }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return <p className="text-center text-sm text-mist">No scores yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {ranked.map((player, index) => {
        const isWinner = winnerIds.includes(player.id);
        const dimmed = markEliminated && player.isEliminated;

        return (
          <li
            key={player.id}
            style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}
            className={`flex animate-rise-in items-center gap-3 rounded-2xl border p-3 ${
              isWinner ? 'border-amber-400/40 bg-amber-400/10' : 'border-white/10 bg-black/25'
            }`}
          >
            <span className="w-5 shrink-0 text-center text-xs font-black text-mist">{index + 1}</span>
            <PlayerAvatar name={player.playerName} size="sm" dimmed={dimmed} />
            <span
              className={`min-w-0 flex-1 truncate text-sm font-bold ${
                dimmed ? 'text-mist line-through' : 'text-bone'
              }`}
            >
              {player.playerName}
            </span>
            {isWinner ? <Trophy className="h-4 w-4 shrink-0 text-amber-300" /> : null}
            <span className="shrink-0 font-mono text-sm font-black text-brand-300">{player.score}</span>
          </li>
        );
      })}
    </ol>
  );
}