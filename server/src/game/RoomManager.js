import { Room, Player } from './Room.js';
import { generateRoomCode, generateSessionToken } from '../utils/codeGenerator.js';
import crypto from 'crypto';

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room instance
  }

  /**
   * Creates a new game room and assigns the host.
   */
  createRoom(playerName, socketId) {
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const hostPlayer = new Player({
      id: crypto.randomUUID(),
      playerName,
      socketId,
      sessionToken: generateSessionToken(),
      isHost: true,
    });

    const room = new Room(roomCode, hostPlayer);
    this.rooms.set(roomCode, room);

    return { room, player: hostPlayer };
  }

    /**
   * Retrieves a room by the socket ID of a player in that room.
   */
    getRoomBySocket(socketId) {
      for (const room of this.rooms.values()) {
        if (room.getPlayerBySocketId(socketId)) {
        return room;
    }
  }
  return null;
}

  /**
   * Retrieves an active room by code.
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase());
  }

  /**
   * Adds a player to an existing room or reclaims session.
   */
  joinRoom(roomCode, playerName, socketId, sessionToken = null) {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }

    // 0. Kicked players are permanently barred from this room, even if their
    //    client still replays the old session token from localStorage.
    if (sessionToken && room.kickedSessionTokens.has(sessionToken)) {
      throw new Error('You were removed from the room by the host.');
    }

    // 1. Session Reconnection Check
    if (sessionToken) {
      const existingPlayer = room.getPlayerBySessionToken(sessionToken);
      if (existingPlayer) {
        existingPlayer.socketId = socketId;
        existingPlayer.isDisconnected = false;
        existingPlayer.disconnectedAt = null;
        return { room, player: existingPlayer, reconnected: true };
      }
    }

    // 2. Reject if match already in progress
    if (room.phase !== 'LOBBY') {
      throw new Error('Game already in progress.');
    }

    // 3. Reject if room is full. Only connected players occupy capacity, so a
    //    player who dropped out does not permanently hold a slot.
    if (room.getAllConnectedPlayers().length >= room.settings.maxPlayers) {
      throw new Error(`Room is full (capacity ${room.settings.maxPlayers}).`);
    }

    // 4. Create new player
    const newPlayer = new Player({
      id: crypto.randomUUID(),
      playerName,
      socketId,
      sessionToken: generateSessionToken(),
      isHost: false,
    });

    room.players.set(newPlayer.id, newPlayer);
    return { room, player: newPlayer, reconnected: false };
  }

  /**
   * Handles player disconnection.
   */
    handleDisconnect(socketId) {
    for (const room of this.rooms.values()) {
      const player = room.getPlayerBySocketId(socketId);
      if (player) {
        player.isDisconnected = true;
        player.disconnectedAt = Date.now();

        // If host disconnects, reassign host to next connected player
        if (player.isHost) {
          const nextHost = Array.from(room.players.values()).find(p => !p.isDisconnected);
          if (nextHost) {
            player.isHost = false;
            nextHost.isHost = true;
            room.hostId = nextHost.id;
          }
        }

        // Clean up empty rooms
        const activeConnections = Array.from(room.players.values()).filter(p => !p.isDisconnected);
        if (activeConnections.length === 0) {
          if (room.timerHandle) clearTimeout(room.timerHandle);
          this.rooms.delete(room.roomCode);
        }

        return { room, player };
      }
    }
    return null;
  }

  /**
   * Host forcibly removes a player from the room.
   * The player entry is deleted outright so they cannot linger as a
   * "Reconnecting…" ghost and their slot is freed immediately.
   * Only ever called for the LOBBY phase, where no roles/scores exist yet.
   */
  kickPlayer(roomCode, targetPlayerId) {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    const target = Array.from(room.players.values()).find((p) => p.id === targetPlayerId);
    if (!target) {
      throw new Error('Player not found');
    }
    // Remove them from the room entirely and blacklist their session token so
    // a stale localStorage session can never quietly reclaim the seat.
    room.kickedSessionTokens.add(target.sessionToken);
    room.players.delete(target.id);
    return { room, player: target };
  }
}

export const roomManager = new RoomManager();