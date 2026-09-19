import { useState, useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { saveSession, getSession, clearSession } from '../utils/storage';

export function useGameState() {
  const { socket, isConnected } = useSocketContext();

  const [gameState, setGameState] = useState(null);
  const [playerRole, setPlayerRole] = useState(null); // { role, word?, hint?, coImposters: [] }
  const [localPlayer, setLocalPlayer] = useState(null); // { id, sessionToken, isHost }
  const [errorMsg, setErrorMsg] = useState(null);
  const [roundResult, setRoundResult] = useState(null); // results_revealed payload
  const [gameOver, setGameOver] = useState(null); // game_over payload

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

    return () => {
      socket.off('room_joined');
      socket.off('room_state_update');
      socket.off('results_revealed');
      socket.off('game_over');
      socket.off('private_role_assignment');
      socket.off('error_event');
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