import { useState, useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { saveSession, getSession, clearSession } from '../utils/storage';

const ROOM_CODE_IN_PATH = /^\/([A-Z0-9]{5})(\/|$)/i;

/** Reads a room code out of the current URL path, if any (e.g. /A2B3C). */
export function readRoomCodeFromUrl() {
  try {
    const match = ROOM_CODE_IN_PATH.exec(window.location.pathname);
    return match ? match[1].toUpperCase() : null;
  } catch {
    return null;
  }
}

export function useGameState() {
  const { socket, isConnected } = useSocketContext();

  const [gameState, setGameState] = useState(null);
  const [playerRole, setPlayerRole] = useState(null); // { role, word?, hint?, coImposters: [] }
  const [localPlayer, setLocalPlayer] = useState(null); // { id, sessionToken, isHost }
  const [errorMsg, setErrorMsg] = useState(null);
  const [roundResult, setRoundResult] = useState(null); // results_revealed payload
  const [gameOver, setGameOver] = useState(null); // game_over payload

  // Remembers the pre-room URL so it can be restored on leave.
  const previousUrlRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Direct room join ack
    socket.on('room_joined', ({ roomCode, playerId, sessionToken, isHost }) => {
      const stored = getSession() || {};
      const updated = {
        roomCode,
        playerId,
        sessionToken,
        playerName: stored.playerName || '',
      };
      saveSession(updated);
      setLocalPlayer({ id: playerId, sessionToken, isHost });
      setErrorMsg(null);
    });

    // Room broadcast state sync
    socket.on('room_state_update', (publicState) => {
      setGameState(publicState);
      // Drop stale reveal data as soon as the match leaves the reveal screens
      if (publicState.phase !== 'RESULT_PHASE') setRoundResult(null);
      if (publicState.phase !== 'GAME_OVER') setGameOver(null);
    });

    // Server-authoritative round result reveal (elimination + winner + scores)
    socket.on('results_revealed', (payload) => {
      setRoundResult(payload);
    });

    // Server-authoritative match summary
    socket.on('game_over', (payload) => {
      setGameOver(payload);
    });

    // Private role assignment payload
    socket.on('private_role_assignment', (rolePayload) => {
      setPlayerRole(rolePayload);
    });

    // Standardized actionable server errors
    socket.on('error_event', ({ message }) => {
      setErrorMsg(message);
    });

    // Host kicked this player out of the room → redirect to landing.
    socket.on('player_kicked', ({ message }) => {
      setErrorMsg(message || 'You were removed from the room by the host.');
      leaveRoom();
    });

    return () => {
      socket.off('room_joined');
      socket.off('room_state_update');
      socket.off('results_revealed');
      socket.off('game_over');
      socket.off('private_role_assignment');
      socket.off('error_event');
      socket.off('player_kicked');
    };
  }, [socket]);

  // Attempt automatic session reconnection on boot
  useEffect(() => {
    if (socket && isConnected && !gameState) {
      const session = getSession();
      if (session && session.roomCode && session.sessionToken) {
        socket.emit('join_room', {
          roomCode: session.roomCode,
          sessionToken: session.sessionToken,
        });
      }
    }
  }, [socket, isConnected]);

  const leaveRoom = () => {
    clearSession();
    setGameState(null);
    setLocalPlayer(null);
    setPlayerRole(null);
    setRoundResult(null);
    setGameOver(null);
    if (socket) socket.disconnect().connect();
  };

  // URL reflects the room: while in a room the address becomes /{roomCode}
  // (a shareable link), and it is restored to the pre-room URL on leave.
  useEffect(() => {
    const roomCode = gameState?.roomCode;
    if (roomCode) {
      if (!previousUrlRef.current) {
        previousUrlRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      }
      const target = `/${roomCode}`;
      if (window.location.pathname.toUpperCase() !== target) {
        window.history.pushState(null, '', target);
      }
      return undefined;
    }

    // Left the room (or never in one): restore the previous URL once.
    if (previousUrlRef.current) {
      window.history.pushState(null, '', previousUrlRef.current);
      previousUrlRef.current = null;
    }
    return undefined;
  }, [gameState?.roomCode]);

  // Browser back / forward: leaving the room code path exits the room.
  useEffect(() => {
    const onPopState = () => {
      const codeInUrl = readRoomCodeFromUrl();
      if (gameState && codeInUrl !== gameState.roomCode?.toUpperCase()) {
        leaveRoom();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.roomCode]);

  return {
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
  };
}