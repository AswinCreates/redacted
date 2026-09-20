import React, { useEffect, useState } from 'react';
import {
  LoaderCircle,
  LogOut,
  Send,
  Trophy,
  Megaphone,
  CircleCheck,
  Skull,
  Sparkles,
  Eye,
  Globe,
  UsersRound,
} from 'lucide-react';
import TimerHeader from '../components/common/TimerHeader';
import RoleRevealCard from '../components/game/RoleRevealCard';
import ClueTimeline from '../components/game/ClueTimeline';
import Scoreboard from '../components/game/Scoreboard';
import DiscussionPanel from '../components/game/DiscussionPanel';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import { getPhaseHint, getPhaseLabel, getTimerLabel } from '../utils/phaseLabels';
import { getGameModeLabel, isOfflineMode } from '../utils/gameModes';

export default function GameScreen({
  socket,
  gameState,
  playerRole,
  localPlayer,
  roundResult,
  gameOver,
  onLeave,
}) {
  const [clueInput, setClueInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [roleRevealed, setRoleRevealed] = useState(false);

  const phase = gameState.phase;
  const players = gameState.players ?? [];
  const selfPlayer = players.find((p) => p.id === localPlayer?.id);
  const isSpectator = Boolean(selfPlayer?.isEliminated) || playerRole?.role === 'SPECTATOR';
  const isMyTurn = gameState.activeTurnPlayerId === localPlayer?.id;
  const activePlayer = players.find((p) => p.id === gameState.activeTurnPlayerId);
  const votesCast = players.filter((p) => p.hasVoted).length;
  const eligibleVoters = players.filter((p) => !p.isEliminated).length;
  const eliminatedPlayer = players.find((p) => p.id === roundResult?.eliminatedPlayerId);
  const isHost = localPlayer?.id === gameState.hostId;

  // Which mode this room is playing. Server-authoritative: it arrives with every
  // room_state_update, so a reconnecting client always gets the right one.
  //   ONLINE  -> typed clues in turn (CLUE_PHASE)
  //   OFFLINE -> verbal clues in one room (DISCUSSION_PHASE, timer only)
  const settings = gameState.settings ?? {};
  const gameMode = settings.gameMode;
  const offline = isOfflineMode(settings);

  // The card always starts face-down: on every new round AND every stage
  // change (e.g. reveal -> guessing), so the secret word/hint is never left
  // sitting on screen. The player must tap the card to see it, and can tap
  // again to hide it while giving clues or voting.
  useEffect(() => {
    setRoleRevealed(false);
  }, [playerRole?.role, gameState.currentRound, phase]);

  // Clear the highlighted vote target when the voting stage ends.
  useEffect(() => {
    if (phase !== 'VOTING_PHASE') setSelectedTarget(null);
  }, [phase]);

  const handleSendClue = (event) => {
    event.preventDefault();
    const text = clueInput.trim();
    if (!text) return;
    socket.emit('submit_clue', { clueText: text });
    setClueInput('');
  };

  const handleCastVote = (targetId) => {
    setSelectedTarget(targetId);
    socket.emit('submit_vote', { targetPlayerId: targetId });
  };

  const cardClass = 'glass space-y-4 rounded-3xl p-5 shadow-2xl shadow-black/40';

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in-up space-y-4">
      <header className="glass flex items-start justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-300">
            Round {gameState.currentRound}
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 tracking-wider text-mist">
              {offline ? <UsersRound className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              {getGameModeLabel(settings)}
            </span>
          </p>
          <h1 className="truncate font-display text-xl font-black leading-tight text-white sm:text-2xl">
            {getPhaseLabel(phase, gameMode)}
          </h1>
          <p className="truncate text-xs text-mist">{getPhaseHint(phase, gameMode)}</p>
        </div>
        <button
          type="button"
          onClick={onLeave}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-bone transition hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-white active:scale-95"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </header>

      {isSpectator ? (
        <p className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-mist">
          <Eye className="h-3.5 w-3.5" /> You are spectating this round
        </p>
      ) : null}

      {phase === 'GAME_START' ? (
        <section className={`${cardClass} flex flex-col items-center py-12 text-center`}>
          <span className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-glow-pulse rounded-full bg-brand-500/30 blur-xl" />
            <Sparkles className="relative h-8 w-8 text-brand-300" />
          </span>
          <h2 className="mt-4 text-xl font-black text-white">Dealing the word</h2>
          <p className="mt-1 text-sm text-mist">Everyone is getting their secret…</p>
        </section>
      ) : null}

      {phase === 'ROLE_REVEAL' ? (
        <section className="space-y-4">
          <TimerHeader phaseExpiresAt={gameState.phaseExpiresAt} label={getTimerLabel('ROLE_REVEAL')} />
          <RoleRevealCard
            rolePayload={playerRole}
            selfId={localPlayer?.id}
            revealed={roleRevealed}
            onToggle={() => setRoleRevealed((value) => !value)}
            variant="hero"
          />
          <p className="text-center text-sm font-semibold text-bone">
            {roleRevealed ? 'Memorise it — then keep it secret.' : 'Tap the card to see your role.'}
          </p>
        </section>
      ) : null}

      {/* Clue turns are Online-only. The server never enters CLUE_PHASE in Offline
          mode, and the explicit mode guard means a stale/incorrect phase can never
          surface a clue input box to a face-to-face group. */}
      {!offline && phase === 'CLUE_PHASE' ? (
        <section className={cardClass}>
          <TimerHeader phaseExpiresAt={gameState.phaseExpiresAt} label={getTimerLabel('CLUE_PHASE')} />

          {!isSpectator && playerRole ? (
            <RoleRevealCard
              rolePayload={playerRole}
              selfId={localPlayer?.id}
              revealed={roleRevealed}
              onToggle={() => setRoleRevealed((value) => !value)}
              variant="compact"
            />
          ) : null}

          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 ${
              isMyTurn ? 'border-brand-500/40 bg-brand-500/10' : 'border-white/10 bg-black/25'
            }`}
          >
            <PlayerAvatar name={activePlayer?.playerName ?? '—'} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-bone">
                {isMyTurn ? 'Your turn to clue' : `${activePlayer?.playerName ?? 'Someone'} is thinking…`}
              </p>
              <p className="text-xs text-mist">
                {isMyTurn
                  ? 'Describe it without ever saying the word.'
                  : 'Their clue will appear in the list below.'}
              </p>
            </div>
            {isMyTurn ? (
              <Megaphone className="h-5 w-5 shrink-0 text-brand-300" />
            ) : (
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-mist" />
            )}
          </div>

          {!isSpectator && isMyTurn && !selfPlayer?.hasSubmittedClue ? (
            <form onSubmit={handleSendClue} className="flex gap-2">
              <input
                type="text"
                maxLength={60}
                value={clueInput}
                onChange={(event) => setClueInput(event.target.value)}
                placeholder="One short clue…"
                aria-label="Your clue"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-bone placeholder:text-mist transition focus:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="submit"
                disabled={!clueInput.trim()}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 px-5 py-3 font-black text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-400 hover:to-brand-500 active:scale-95 disabled:cursor-not-allowed disabled:from-coal disabled:to-coal disabled:text-mist disabled:shadow-none"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          ) : null}

          {isMyTurn && selfPlayer?.hasSubmittedClue ? (
            <p className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-300">
              <CircleCheck className="h-4 w-4" /> Clue sent — waiting for the next player.
            </p>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-mist">Clues this round</h3>
            <ClueTimeline clues={gameState.clueTimeline} />
          </div>
        </section>
      ) : null}
      {/* Offline mode: clues are spoken, never typed, so there is no per-player
          turn and nothing is stored. The entire "clue phase" for that mode is this
          one shared, server-owned countdown before the voting flow takes over. */}
      {phase === 'DISCUSSION_PHASE' ? (
        <div className="space-y-4">
          <DiscussionPanel
            phaseExpiresAt={gameState.phaseExpiresAt}
            totalSeconds={settings.discussionTimer ?? 0}
          />

          {!isSpectator && playerRole ? (
            <section className={cardClass}>
              <RoleRevealCard
                rolePayload={playerRole}
                selfId={localPlayer?.id}
                revealed={roleRevealed}
                onToggle={() => setRoleRevealed((value) => !value)}
                variant="compact"
              />
              <p className="text-center text-xs text-mist">
                Keep it to yourself — a quick peek at your own role is all you need.
              </p>
            </section>
          ) : null}

          <p className="text-center text-xs font-semibold text-mist">
            Voting unlocks automatically when the discussion timer runs out.
          </p>
        </div>
      ) : null}

      {phase === 'CLUE_REVEAL' ? (
        <section className={cardClass}>
          <TimerHeader phaseExpiresAt={gameState.phaseExpiresAt} label={getTimerLabel('CLUE_REVEAL', gameMode)} />

          <div className="flex items-center gap-3 rounded-2xl border border-brand-500/40 bg-brand-500/10 p-4">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <span className="absolute inset-0 animate-glow-pulse rounded-full bg-brand-500/30 blur-md" />
              <CircleCheck className="relative h-5 w-5 text-brand-300" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-bone">
                {offline ? 'Discussion over.' : 'All clues are in.'}
              </p>
              <p className="text-xs text-mist">
                {offline
                  ? 'Wrap up the conversation — voting starts automatically.'
                  : 'Read them over — voting starts automatically.'}
              </p>
            </div>
          </div>

          {!isSpectator && playerRole ? (
            <RoleRevealCard
              rolePayload={playerRole}
              selfId={localPlayer?.id}
              revealed={roleRevealed}
              onToggle={() => setRoleRevealed((value) => !value)}
              variant="compact"
            />
          ) : null}

          {/* Offline has no clue list to show - the clues were spoken. */}
          {offline ? null : (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-mist">Clues this round</h3>
              <ClueTimeline clues={gameState.clueTimeline} />
            </div>
          )}
        </section>
      ) : null}
      {phase === 'VOTING_PHASE' ? (
        <section className={cardClass}>
          <TimerHeader phaseExpiresAt={gameState.phaseExpiresAt} label={getTimerLabel('VOTING_PHASE')} />

          {!isSpectator && playerRole ? (
            <RoleRevealCard
              rolePayload={playerRole}
              selfId={localPlayer?.id}
              revealed={roleRevealed}
              onToggle={() => setRoleRevealed((value) => !value)}
              variant="compact"
            />
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-mist">Votes in</h3>
              <span className="font-mono text-xs font-bold text-bone">
                {votesCast} / {eligibleVoters}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {players
                .filter((p) => !p.isEliminated)
                .map((p) => (
                  <span
                    key={p.id}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                      p.hasVoted
                        ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-mist'
                    }`}
                  >
                    {p.hasVoted ? <CircleCheck className="h-3 w-3" /> : null}
                    {p.playerName}
                  </span>
                ))}
            </div>
          </div>

          {!isSpectator && !selfPlayer?.hasVoted ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {players
                .filter((p) => !p.isEliminated && p.id !== localPlayer?.id)
                .map((p) => {
                  const chosen = selectedTarget === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleCastVote(p.id)}
                      className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition active:scale-[.98] ${
                        chosen
                          ? 'border-brand-500/60 bg-brand-500/25'
                          : 'border-white/10 bg-black/25 hover:border-brand-500/40 hover:bg-white/5'
                      }`}
                    >
                      <PlayerAvatar name={p.playerName} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-bone">
                        {p.playerName}
                      </span>
                      {chosen ? <CircleCheck className="h-4 w-4 shrink-0 text-brand-300" /> : null}
                    </button>
                  );
                })}
            </div>
          ) : (
            <p className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/25 py-4 text-sm font-semibold text-bone">
              <CircleCheck className="h-4 w-4 text-emerald-400" />
              {selfPlayer?.hasVoted ? 'Vote locked in — waiting for the others.' : 'Spectators cannot vote.'}
            </p>
          )}

          {!isSpectator && selfPlayer?.hasVoted ? (
            <p className="text-center text-xs text-mist">Your choice stays private until the reveal.</p>
          ) : null}
        </section>
      ) : null}
      {phase === 'RESULT_PHASE' ? (
        <section className={cardClass}>
          <TimerHeader phaseExpiresAt={gameState.phaseExpiresAt} label={getTimerLabel('RESULT_PHASE')} />

          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-mist">
              Round {roundResult?.currentRound ?? gameState.currentRound}
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              {roundResult?.roundWinner === 'INNOCENTS'
                ? 'Innocents win the round'
                : roundResult?.roundWinner === 'IMPOSTERS'
                  ? 'Imposters win the round'
                  : 'Nobody clinched it yet'}
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mist">Eliminated</p>
            {eliminatedPlayer ? (
              <div className="mt-2 flex items-center gap-3">
                <PlayerAvatar name={eliminatedPlayer.playerName} dimmed />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-bone">
                    {eliminatedPlayer.playerName}
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      roundResult?.revealedRole === 'IMPOSTER'
                        ? 'border-rose-400/30 bg-rose-500/15 text-rose-300'
                        : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    <Skull className="h-3 w-3" />
                    {roundResult?.revealedRole === 'IMPOSTER'
                      ? 'Was an imposter'
                      : roundResult?.revealedRole === 'INNOCENT'
                        ? 'Was innocent'
                        : 'Role unknown'}
                  </span>
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm italic text-mist">Tied vote — nobody was eliminated.</p>
            )}
          </div>

          {roundResult?.secretWord ? (
            <div className="rounded-2xl border border-brand-500/25 bg-brand-500/10 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300/80">
                The secret word was
              </p>
              <p className="mt-1 text-2xl font-black text-brand-300">{roundResult.secretWord}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-mist">Scores</h3>
            <Scoreboard players={players} />
          </div>

          <p className="text-center text-xs font-semibold text-mist">
            {roundResult?.matchOver ? 'Final results coming up…' : 'Next round starts automatically…'}
          </p>
        </section>
      ) : null}

      {phase === 'GAME_OVER' ? (
        <section className={`${cardClass} text-center`}>
          <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-glow-pulse rounded-full bg-amber-400/30 blur-xl" />
            <Trophy className="relative h-8 w-8 text-amber-300" />
          </span>
          <h2 className="text-3xl font-black text-white">Match over</h2>
          <p className="text-sm text-bone">
            <span className="font-black text-amber-300">
              {(gameOver?.winnerPlayerIds ?? [])
                .map((id) => players.find((p) => p.id === id)?.playerName)
                .filter(Boolean)
                .join(' & ') || 'No winner recorded'}
            </span>{' '}
            {(gameOver?.winnerPlayerIds?.length ?? 0) > 1 ? 'share the win' : 'takes the win'}
          </p>

          <div className="pt-1 text-left">
            <Scoreboard
              players={players}
              winnerIds={gameOver?.winnerPlayerIds ?? []}
              markEliminated={false}
            />
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={() => socket.emit('restart_game')}
              className="w-full rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 py-3.5 font-black text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-400 hover:to-brand-500 active:scale-[.99]"
            >
              Play again in the lobby
            </button>
          ) : (
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-bone">
              <LoaderCircle className="h-4 w-4 animate-spin text-brand-300" /> Waiting for the host to
              start a rematch…
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}