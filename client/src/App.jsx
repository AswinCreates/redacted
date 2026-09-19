import React, { useEffect } from 'react';
import { CircleAlert, WifiOff, X } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { useViewNavigation } from './hooks/useViewNavigation';
import { useFullscreen } from './hooks/useFullscreen';
import { GAME_NAME } from './config/branding';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import GameScreen from './pages/GameScreen';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

export default function App() {
  const {
    socket,
    isConnected,
    gameState,
    playerRole,
    localPlayer,
    roundResult,
    gameOver,
    errorMsg,
    setErrorMsg,
    leaveRoom,
  } = useGameState();

  // View routing: landing is the entry point; game takes over once joined.
  const { view, go } = useViewNavigation({ inRoom: Boolean(gameState) });

  // Fullscreen mode for the game tab; the footer hides while it is active.
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

  const handleLeave = () => {
    leaveRoom();
    go('landing');
  };

  // Auto-dismiss server/validation errors so a stale message never lingers.
  useEffect(() => {
    if (!errorMsg) return undefined;
    const timer = window.setTimeout(() => setErrorMsg(null), 6000);
    return () => window.clearTimeout(timer);
  }, [errorMsg, setErrorMsg]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-night">
      {/* Atmospheric background: grid, ember glows. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-aurora" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-grid-faint opacity-60" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-32 top-1/3 h-72 w-72 animate-glow-pulse rounded-full bg-brand-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-32 bottom-0 h-80 w-80 animate-glow-pulse rounded-full bg-brand-600/15 blur-3xl"
      />

      <Navbar
        view={view}
        onNavigate={go}
        onBrandClick={() => (gameState ? go('play') : go('landing'))}
        isFullscreen={isFullscreen}
        onToggleFullscreen={isFullscreenSupported ? toggleFullscreen : null}
      />

      <div className="relative flex min-h-screen flex-col px-4 pb-6 pt-24 sm:px-6 sm:pt-28">
        {!isConnected ? (
          <div className="mx-auto mb-4 flex w-full max-w-5xl items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-200">
            <WifiOff className="h-4 w-4 shrink-0" />
            Reconnecting to the game server…
          </div>
        ) : null}

        {errorMsg ? (
          <div
            role="alert"
            className="mx-auto mb-4 flex w-full max-w-5xl items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-200"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              aria-label="Dismiss message"
              className="shrink-0 rounded-lg p-1 transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <main className="flex flex-1 items-start justify-center sm:items-center">
          {view === 'landing' && !gameState ? (
            <LandingPage onPlay={() => go('play')} />
          ) : !gameState ? (
            <Home socket={socket} setErrorMsg={setErrorMsg} isConnected={isConnected} />
          ) : gameState.phase === 'LOBBY' ? (
            <Lobby socket={socket} gameState={gameState} localPlayer={localPlayer} onLeave={handleLeave} />
          ) : (
            <GameScreen
              socket={socket}
              gameState={gameState}
              playerRole={playerRole}
              localPlayer={localPlayer}
              roundResult={roundResult}
              gameOver={gameOver}
              onLeave={handleLeave}
            />
          )}
        </main>

        {isFullscreen ? null : <Footer brandName={GAME_NAME} />}
      </div>
    </div>
  );
}