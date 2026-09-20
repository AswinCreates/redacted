import React, { useEffect, useState } from 'react';
import { Users, Play, LogOut, Crown, VenetianMask, Sparkles, Clock, Vote, LoaderCircle, Lock, UserX, Globe, MessageCircleMore } from 'lucide-react';
import { fetchCategories } from '../utils/api';
import { GAME_NAME } from '../config/branding';
import { GAME_MODES, GAME_MODE_META, getGameMode } from '../utils/gameModes';
import { formatDurationLabel } from '../utils/formatTime';
import RoomCodeBadge from '../components/ui/RoomCodeBadge';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import Stepper from '../components/ui/Stepper';
import SegmentedControl from '../components/ui/SegmentedControl';
import CategoryDropdown from '../components/ui/CategoryDropdown';
import SettingRow from '../components/ui/SettingRow';

// Fallbacks only - the server ships the real presets inside `room.limits`.
const FALLBACK_TIMERS = [15, 30, 45, 60];
const FALLBACK_DISCUSSION_TIMERS = [30, 60, 120, 180, 300];

export default function Lobby({ socket, gameState, localPlayer, onLeave }) {
  const [themes, setThemes] = useState([]);

  // Themes are game content: pull them from the server rather than hardcoding.
  useEffect(() => {
    let active = true;
    fetchCategories().then((names) => {
      if (active && names.length > 0) setThemes(names);
    });
    return () => {
      active = false;
    };
  }, []);

  const isHost = localPlayer?.id === gameState?.hostId;
  const players = gameState?.players ?? [];
  const connectedPlayers = players.filter((p) => !p.isDisconnected);
  const settings = gameState?.settings ?? {};
  const hostName = players.find((p) => p.isHost)?.playerName ?? 'the host';

  // Every limit comes from the server; the client hardcodes none of them.
  const limits = gameState?.limits ?? { minCapacity: 3, maxCapacity: 20, imposterOptions: [1] };
  const imposterOptions = limits.imposterOptions ?? [1];
  const themeOptions = themes.length > 0 ? themes : (settings?.categories ?? []);

  // Online / Offline is a normal lobby setting: broadcast by the server, editable
  // by the host here, and frozen once the match starts.
  const gameMode = getGameMode(settings);
  const isOffline = gameMode === GAME_MODES.OFFLINE;
  const modeMeta = GAME_MODE_META[gameMode];
  const ModeIcon = isOffline ? MessageCircleMore : Globe;
  const modeOptions = Object.values(GAME_MODES).map((value) => ({
    value,
    label: GAME_MODE_META[value].label,
  }));
  const clueTimerOptions = (limits.clueTimerOptions ?? FALLBACK_TIMERS).map((seconds) => ({
    value: seconds,
    label: `${seconds}s`,
  }));
  const votingTimerOptions = (limits.votingTimerOptions ?? FALLBACK_TIMERS).map((seconds) => ({
    value: seconds,
    label: `${seconds}s`,
  }));
  const discussionTimerOptions = (limits.discussionTimerOptions ?? FALLBACK_DISCUSSION_TIMERS).map(
    (seconds) => ({ value: seconds, label: formatDurationLabel(seconds) })
  );

  const capacity = settings.maxPlayers ?? limits.minCapacity;
  const capacityMin = Math.max(limits.minCapacity, connectedPlayers.length);
  const openSlots = Math.max(0, capacity - connectedPlayers.length);
  const canStart = connectedPlayers.length >= limits.minCapacity;
  const needed = limits.minCapacity - connectedPlayers.length;

  const updateSetting = (patch) => {
    if (!isHost) return;
    socket.emit('update_settings', { settings: patch });
  };

  const handleStart = () => socket.emit('start_game');

  const cardClass = 'glass rounded-3xl p-5 shadow-2xl shadow-black/40 sm:p-6';

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in-up space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-black tracking-[0.12em] text-white sm:text-2xl"><span aria-hidden="true">RED<span className="text-brand-500">ACTED</span></span><span className="sr-only">{GAME_NAME}</span></span>
          <span className="rounded-full border border-brand-500/30 bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-300">
            Lobby
          </span>
          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bone">
            <ModeIcon className="h-3 w-3" />
            {modeMeta.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-bone transition hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-white active:scale-95"
        >
          <LogOut className="h-4 w-4" /> Leave room
        </button>
      </header>

      <RoomCodeBadge code={gameState.roomCode} />

      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        {/* ---------- Game setup ---------- */}
        <section className={cardClass}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-bone">Game setup</h2>
            {isHost ? (
              <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                You are host
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-mist">
                <Lock className="h-3 w-3" /> Host only
              </span>
            )}
          </div>

          <SettingRow
            icon={ModeIcon}
            label="Game mode"
            hint={isHost ? modeMeta.lobbyHint : `${modeMeta.label} mode set by ${hostName}`}
            accentClass={isOffline ? 'text-emerald-300' : 'text-brand-400'}
          >
            <SegmentedControl
              options={modeOptions}
              value={gameMode}
              disabled={!isHost}
              onChange={(value) => updateSetting({ gameMode: value })}
              ariaLabel="Game mode"
            />
          </SettingRow>

          <SettingRow
            icon={Users}
            label="Players"
            hint={isHost ? 'How many players this room accepts' : `Capacity set by ${hostName}`}
          >
            <Stepper
              value={capacity}
              min={capacityMin}
              max={limits.maxCapacity}
              disabled={!isHost}
              label="player capacity"
              onChange={(value) => updateSetting({ maxPlayers: value })}
            />
          </SettingRow>

          <SettingRow
            icon={VenetianMask}
            label="Imposters"
            hint="How many players are given the wrong hint"
            accentClass="text-rose-300"
          >
            <SegmentedControl
              options={imposterOptions}
              value={settings.imposterCount}
              disabled={!isHost}
              onChange={(value) => updateSetting({ imposterCount: value })}
              ariaLabel="Imposter count"
            />
          </SettingRow>

          <SettingRow
            icon={Sparkles}
            label="Themes"
            hint={isHost ? 'Choose 1-3 word bank themes for this match' : `Themes set by ${hostName}`}
          >
            <CategoryDropdown
              options={themeOptions}
              value={settings.categories}
              disabled={!isHost}
              max={3}
              onChange={(categories) => updateSetting({ categories })}
              ariaLabel="Word themes"
            />
          </SettingRow>

          {/* Clue timer is Online-only; Offline swaps it for the shared discussion timer. */}
          {isOffline ? (
            <SettingRow
              icon={MessageCircleMore}
              label="Discussion time"
              hint={
                isHost
                  ? 'One shared countdown for the whole group before voting'
                  : `Set by ${hostName}`
              }
              accentClass="text-emerald-300"
            >
              <SegmentedControl
                options={discussionTimerOptions}
                value={settings.discussionTimer}
                disabled={!isHost}
                size="sm"
                onChange={(value) => updateSetting({ discussionTimer: value })}
                ariaLabel="Discussion time"
              />
            </SettingRow>
          ) : (
            <SettingRow icon={Clock} label="Clue timer" hint="Time each player gets to give a clue">
              <SegmentedControl
                options={clueTimerOptions}
                value={settings.clueTimer}
                disabled={!isHost}
                size="sm"
                onChange={(value) => updateSetting({ clueTimer: value })}
                ariaLabel="Clue timer"
              />
            </SettingRow>
          )}

          <SettingRow icon={Vote} label="Voting timer" hint="Time allowed to cast a vote">
            <SegmentedControl
              options={votingTimerOptions}
              value={settings.votingTimer}
              disabled={!isHost}
              size="sm"
              onChange={(value) => updateSetting({ votingTimer: value })}
              ariaLabel="Voting timer"
            />
          </SettingRow>
        </section>
        {/* ---------- Players ---------- */}
        <section className={`${cardClass} flex flex-col`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-bone">
              <Users className="h-4 w-4 text-brand-300" /> Players
            </h2>
            <span className="font-mono text-sm font-black text-white">
              {connectedPlayers.length} <span className="text-mist">/ {capacity}</span>
            </span>
          </div>

          <ul className="scrollbar-slim mb-4 flex-1 space-y-2 overflow-y-auto pr-1">
            {players.map((player, index) => {
              const isSelf = player.id === localPlayer?.id;
              return (
                <li
                  key={player.id}
                  style={{ animationDelay: `${Math.min(index, 10) * 55}ms` }}
                  className={`group flex animate-slide-in-left items-center gap-3 rounded-2xl border p-3 transition ${
                    player.isDisconnected
                      ? 'border-white/5 bg-white/[0.02] opacity-50'
                      : isSelf
                        ? 'border-brand-500/40 bg-brand-500/10'
                        : 'border-white/10 bg-black/25'
                  }`}
                >
                  <PlayerAvatar name={player.playerName} dimmed={player.isDisconnected} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-bone">
                      {player.playerName}
                      {isSelf ? (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-brand-300">You</span>
                      ) : null}
                    </span>
                    {player.isDisconnected ? (
                      <span className="block text-[11px] text-mist">Reconnecting…</span>
                    ) : null}
                  </span>
                  {player.isHost ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      <Crown className="h-3 w-3" /> Host
                    </span>
                  ) : null}

                  {/* Host-only kick button (never for self, never for disconnected players) */}
                  {isHost && !isSelf && !player.isDisconnected ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Kick ${player.playerName} from the room?`)) {
                          socket.emit('kick_player', { targetPlayerId: player.id });
                        }
                      }}
                      className="flex shrink-0 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/15 p-1.5 text-rose-300 opacity-70 transition hover:bg-rose-500/30 hover:text-white focus-visible:opacity-100 active:scale-90 group-hover:opacity-100"
                      aria-label={`Kick ${player.playerName}`}
                      title="Kick player"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              );
            })}

            {Array.from({ length: Math.min(openSlots, 5) }).map((_, index) => (
              <li
                key={`open-${index}`}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3"
              >
                <span className="h-9 w-9 shrink-0 rounded-full border border-dashed border-white/15" />
                <span className="text-sm italic text-mist">Open slot</span>
              </li>
            ))}
            {openSlots > 5 ? (
              <li className="px-1 pt-1 text-xs font-semibold text-mist">
                +{openSlots - 5} more open {openSlots - 5 === 1 ? 'slot' : 'slots'}
              </li>
            ) : null}
          </ul>

          {isHost ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleStart}
                disabled={!canStart}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 py-3.5 font-black text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-400 hover:to-brand-500 active:scale-[.99] disabled:cursor-not-allowed disabled:from-coal disabled:to-coal disabled:text-mist disabled:shadow-none"
              >
                <Play className="h-5 w-5" /> Start match
              </button>
              {canStart ? (
                <p className="text-center text-xs text-mist">Everyone ready when you are.</p>
              ) : (
                <p className="text-center text-xs font-semibold text-amber-300">
                  Waiting for {needed} more {needed === 1 ? 'player' : 'players'} (minimum {limits.minCapacity}).
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/25 py-3.5 text-sm font-semibold text-bone">
              <LoaderCircle className="h-4 w-4 animate-spin text-brand-300" />
              Waiting for {hostName} to start…
            </div>
          )}
        </section>
      </div>
    </div>
  );
}