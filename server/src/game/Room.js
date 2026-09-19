import { GAME_LIMITS, getImposterOptions } from '../config/gameConfig.js';

export class Player {
  constructor({ id, playerName, socketId, sessionToken, isHost = false }) {
    this.id = id; // UUID
    this.playerName = playerName;
    this.socketId = socketId;
    this.sessionToken = sessionToken;
    this.isHost = isHost;
    this.isDisconnected = false;
    this.disconnectedAt = null;

    // Game state tracking
    this.score = 0;
    this.role = null; // 'INNOCENT' | 'IMPOSTER'
    this.isEliminated = false; // Persistent spectator status across rounds when true
    this.clueSubmitted = null;
    this.votedForTargetId = null;
  }

  resetForNewRound() {
    this.role = null;
    this.clueSubmitted = null;
    this.votedForTargetId = null;
    // Note: isEliminated and score persist across rounds until Rematch!
  }

  resetForRematch() {
    this.score = 0;
    this.isEliminated = false;
    this.resetForNewRound();
  }
}

export class Room {
  constructor(roomCode, hostPlayer) {
    this.roomCode = roomCode;
    this.hostId = hostPlayer.id;
    this.players = new Map(); // playerId -> Player instance
    this.phase = 'LOBBY'; // LOBBY, GAME_START, ROLE_REVEAL, CLUE_PHASE, VOTING_PHASE, RESULT_PHASE, GAME_OVER
    
    // Host Configurable Settings (bounds are enforced in utils/validation.js)
    this.settings = {
      // Player capacity chosen by the host - bounded by GAME_LIMITS, never fixed.
      maxPlayers: GAME_LIMITS.DEFAULT_MAX_PLAYERS,
      imposterCount: GAME_LIMITS.MIN_IMPOSTERS,
      category: 'General',
      clueTimer: 30,
      votingTimer: 30,
    };

    // Active Match State
    this.currentRound = 0;
    this.secretWord = null;
    this.categoryHint = null;
    this.turnQueue = []; // Active player IDs ordered for clue phase
    this.currentTurnIndex = 0;
    this.phaseExpiresAt = null; // Timestamp (ms) when current state timer ends
    this.timerHandle = null; // Node.js timeout handle
    this.clueTimeline = []; // Array of { playerId, playerName, clueText, timestamp }
    this.roundWinner = null; // 'INNOCENTS' | 'IMPOSTERS'
    this.lastEliminatedPlayerId = null;

    // Add Host Player
    this.players.set(hostPlayer.id, hostPlayer);
  }

  getActivePlayers() {
    return Array.from(this.players.values()).filter(p => !p.isEliminated && !p.isDisconnected);
  }

  getAllConnectedPlayers() {
    return Array.from(this.players.values()).filter(p => !p.isDisconnected);
  }

  getPlayerBySessionToken(token) {
    return Array.from(this.players.values()).find(p => p.sessionToken === token);
  }

  getPlayerBySocketId(socketId) {
    return Array.from(this.players.values()).find(p => p.socketId === socketId);
  }

  /**
   * Sanitizes full room state for public broadcast (Strips secret word & roles).
   */
  toPublicState() {
    return {
      roomCode: this.roomCode,
      hostId: this.hostId,
      phase: this.phase,
      settings: { ...this.settings },
      // Server-owned rules, broadcast so the client never hardcodes capacity
      // limits or which imposter counts are legal.
      limits: {
        minCapacity: GAME_LIMITS.MIN_PLAYERS,
        maxCapacity: GAME_LIMITS.MAX_PLAYERS,
        imposterOptions: getImposterOptions(this.settings.maxPlayers),
      },
      currentRound: this.currentRound,
      phaseExpiresAt: this.phaseExpiresAt,
      clueTimeline: this.clueTimeline,
      activeTurnPlayerId: this.turnQueue[this.currentTurnIndex] || null,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        playerName: p.playerName,
        isHost: p.isHost,
        isDisconnected: p.isDisconnected,
        score: p.score,
        isEliminated: p.isEliminated,
        hasSubmittedClue: p.clueSubmitted !== null,
        hasVoted: p.votedForTargetId !== null,
      })),
    };
  }
}