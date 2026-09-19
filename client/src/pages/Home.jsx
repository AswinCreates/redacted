import React, { useState } from 'react';
import { UserRound, LogIn, Plus, Users, ShieldQuestion } from 'lucide-react';
import { saveSession } from '../utils/storage';
import { readRoomCodeFromUrl } from '../hooks/useGameState';
import { GAME_NAME, GAME_TAGLINE, GAME_SUBTITLE } from '../config/branding';
import SegmentedControl from '../components/ui/SegmentedControl';

const MODES = [
  { value: 'join', label: 'Join a room' },
  { value: 'create', label: 'Create a room' },
];

export default function Home({ socket, setErrorMsg, isConnected = true }) {
  const [playerName, setPlayerName] = useState('');
  // A shared link like /A2B3C pre-fills the room code and selects Join.
  const urlCode = readRoomCodeFromUrl();
  const [roomCode, setRoomCode] = useState(urlCode || '');
  const [mode, setMode] = useState('join');

  const readName = () => {
    const trimmed = playerName.trim();
    if (trimmed.length < 2) {
      setErrorMsg('Pick a name with at least 2 characters.');
      return null;
    }
    return trimmed;
  };

  const handleCreate = (event) => {
    event.preventDefault();
    const name = readName();
    if (!name || !socket) return;
    setErrorMsg(null);
    saveSession({ playerName: name });
    socket.emit('create_room', { playerName: name });
  };

  const handleJoin = (event) => {
    event.preventDefault();
    const name = readName();
    if (!name || !socket) return;
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 5) {
      setErrorMsg('Room codes are exactly 5 characters.');
      return;
    }
    setErrorMsg(null);
    saveSession({ playerName: name, roomCode: code });
    socket.emit('join_room', { playerName: name, roomCode: code });
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-bone placeholder:text-mist transition focus:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

  return (
    <div className="mx-auto flex w-full max-w-md animate-fade-in-up flex-col gap-6">
      <header className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-300/80">Social deduction</p>
      <header className="text-center">
        <p className="eyebrow">Create / Join game</p>
        <h1 className="mt-2 font-display text-5xl font-black tracking-tight text-white" aria-label={GAME_NAME}>
          <span aria-hidden="true">RED</span>
          <span aria-hidden="true" className="text-brand-500">
            ACTED
          </span>
        </h1>
        <p className="mt-3 text-sm font-semibold text-bone">{GAME_TAGLINE}</p>
        <p className="mt-1 text-xs text-mist">{GAME_SUBTITLE}</p>
      </header>
      </header>

      <div className="glass rounded-3xl p-6 shadow-2xl shadow-black/50">
        <label
          className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-mist"
          htmlFor="playerName"
        >
          Your name
        </label>
        <div className="relative mb-5">
          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
          <input
            id="playerName"
            type="text"
            maxLength={15}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Laex"
            className={`${inputClass} pl-10`}
          />
        </div>

        <SegmentedControl options={MODES} value={mode} onChange={setMode} ariaLabel="Join or create a room" />

        <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="mt-5 space-y-4">
          {mode === 'join' ? (
            <div>
              <label
                className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-mist"
                htmlFor="roomCode"
              >
                Room code
              </label>
              <input
                id="roomCode"
                type="text"
                maxLength={5}
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="A2B3C"
                className={`${inputClass} text-center font-mono text-2xl font-black tracking-[0.4em]`}
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!isConnected}
            className="btn-primary w-full py-3.5 text-base font-black"
          >
            {mode === 'create' ? <Plus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
            {mode === 'create' ? 'Create room' : 'Join room'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-5 text-[11px] text-mist">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> 3-20 players
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldQuestion className="h-3.5 w-3.5" /> Hidden imposters
          </span>
        </div>
      </div>

      {!isConnected ? (
        <p className="text-center text-xs font-semibold text-amber-300">Connecting to the game server…</p>
      ) : null}
    </div>
  );
}