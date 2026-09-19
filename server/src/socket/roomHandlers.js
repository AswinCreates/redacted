import { roomManager } from '../game/RoomManager.js';
import { GAME_LIMITS, getMaxImposters } from '../config/gameConfig.js';
import { validatePlayerName, validateSettings } from '../utils/validation.js';

export function registerRoomHandlers(io, socket, gameEngine) {
  /**
   * C2S: create_room
   * Creates a new game room and sets the sender as Host.
   */
  socket.on('create_room', ({ playerName }) => {
    const validName = validatePlayerName(playerName);
    if (!validName) {
      return socket.emit('error_event', {
        code: 'INVALID_NAME',
        message: 'Name must be 2-15 characters long.',
      });
    }

    try {
      const { room, player } = roomManager.createRoom(validName, socket.id);
      socket.join(room.roomCode);

      socket.emit('room_joined', {
        roomCode: room.roomCode,
        playerId: player.id,
        sessionToken: player.sessionToken,
        isHost: true,
      });

      gameEngine.broadcastState(room);
    } catch (error) {
      socket.emit('error_event', { code: 'CREATE_FAILED', message: error.message });
    }
  });

  /**
   * C2S: join_room
   * Joins an existing room or reclaims session via sessionToken.
   */
  socket.on('join_room', ({ roomCode, playerName, sessionToken }) => {
    if (!roomCode) {
      return socket.emit('error_event', {
        code: 'INVALID_ROOM',
        message: 'Room code is required.',
      });
    }

    const code = roomCode.toUpperCase();
    const validName = validatePlayerName(playerName);

    if (!sessionToken && !validName) {
      return socket.emit('error_event', {
        code: 'INVALID_NAME',
        message: 'Name must be 2-15 characters long.',
      });
    }

    try {
      const { room, player, reconnected } = roomManager.joinRoom(
        code,
        validName || 'Player',
        socket.id,
        sessionToken
      );

      socket.join(room.roomCode);

      socket.emit('room_joined', {
        roomCode: room.roomCode,
        playerId: player.id,
        sessionToken: player.sessionToken,
        isHost: player.isHost,
        reconnected,
      });

      // Re-send private role if reconnecting mid-game
      if (reconnected && room.phase !== 'LOBBY') {
        const imposters = Array.from(room.players.values())
          .filter(p => p.role === 'IMPOSTER')
          .map(p => ({ id: p.id, playerName: p.playerName }));

        if (player.isEliminated) {
          socket.emit('private_role_assignment', { role: 'SPECTATOR', coImposters: [] });
        } else if (player.role === 'IMPOSTER') {
          socket.emit('private_role_assignment', {
            role: 'IMPOSTER',
            hint: room.categoryHint,
            coImposters: imposters,
          });
        } else {
          socket.emit('private_role_assignment', {
            role: 'INNOCENT',
            word: room.secretWord,
            coImposters: [],
          });
        }
      }

      gameEngine.broadcastState(room);
    } catch (error) {
      socket.emit('error_event', { code: 'JOIN_FAILED', message: error.message });
    }
  });

  /**
   * C2S: update_settings
   * Host updates game configuration options.
   */
  socket.on('update_settings', ({ settings }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isHost) {
      return socket.emit('error_event', {
        code: 'UNAUTHORIZED',
        message: 'Only the host can update room settings.',
      });
    }

    if (room.phase !== 'LOBBY') {
      return socket.emit('error_event', {
        code: 'INVALID_PHASE',
        message: 'Settings can only be modified in the lobby.',
      });
    }

    const { sanitized, error } = validateSettings(settings, room);
    if (error) {
      return socket.emit('error_event', { code: 'INVALID_SETTINGS', message: error });
    }

    Object.assign(room.settings, sanitized);

    // Keep the imposter count legal for the (possibly just-changed) capacity.
    // This matters when the host shrinks the room: the previous count may no
    // longer be allowed, so we clamp it instead of rejecting the whole update.
    const capacityNow = Math.max(room.settings.maxPlayers, room.getAllConnectedPlayers().length);
    const maxImpostersNow = getMaxImposters(capacityNow);
    if (room.settings.imposterCount > maxImpostersNow) {
      room.settings.imposterCount = maxImpostersNow;
    }
    if (room.settings.imposterCount < GAME_LIMITS.MIN_IMPOSTERS) {
      room.settings.imposterCount = GAME_LIMITS.MIN_IMPOSTERS;
    }

    gameEngine.broadcastState(room);
  });
}