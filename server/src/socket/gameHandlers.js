import { roomManager } from '../game/RoomManager.js';

export function registerGameHandlers(io, socket, gameEngine) {
  /**
   * C2S: start_game
   * Host launches the match from LOBBY.
   */
  socket.on('start_game', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isHost) {
      return socket.emit('error_event', {
        code: 'UNAUTHORIZED',
        message: 'Only the host can start the game.',
      });
    }

    try {
      gameEngine.startGame(room);
    } catch (error) {
      socket.emit('error_event', { code: 'START_FAILED', message: error.message });
    }
  });

  /**
   * C2S: submit_clue
   * Active player submits clue text during CLUE_PHASE.
   */
  socket.on('submit_clue', ({ clueText }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player) return;

    if (typeof clueText !== 'string' || clueText.trim().length === 0) {
      return socket.emit('error_event', {
        code: 'INVALID_CLUE',
        message: 'Clue cannot be empty.',
      });
    }

    gameEngine.handleClueSubmission(room, player.id, clueText);
  });

  /**
   * C2S: submit_vote
   * Active non-eliminated player votes for a target during VOTING_PHASE.
   */
  socket.on('submit_vote', ({ targetPlayerId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player) return;

    if (!targetPlayerId || typeof targetPlayerId !== 'string') {
      return socket.emit('error_event', {
        code: 'INVALID_TARGET',
        message: 'Invalid vote target.',
      });
    }

    gameEngine.handleVoteSubmission(room, player.id, targetPlayerId);
  });

  /**
   * C2S: restart_game
   * Host resets match back to LOBBY after GAME_OVER.
   */
  socket.on('restart_game', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isHost) {
      return socket.emit('error_event', {
        code: 'UNAUTHORIZED',
        message: 'Only the host can trigger a rematch.',
      });
    }

    if (room.phase !== 'GAME_OVER') {
      return socket.emit('error_event', {
        code: 'INVALID_PHASE',
        message: 'Rematch can only be triggered on Game Over screen.',
      });
    }

    gameEngine.restartToLobby(room);
  });
}