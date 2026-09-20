import {
  GAME_LIMITS,
  getImposterOptions,
  DEFAULT_GAME_MODE,
  DEFAULT_DISCUSSION_TIMER,
  VALID_DISCUSSION_TIMERS,
  VALID_TIMERS,
} from '../config/gameConfig.js';

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
  constructor(roomCode, hostPlayer, { gameMode = DEFAULT_GAME_MODE } = {}) {
    this.roomCode = roomCode;
    this.hostId = hostPlayer.id;
    this.players = new Map(); // playerId -> Player instance
    // LOBBY, GAME_START, ROLE_REVEAL, CLUE_PHASE (Online), DISCUSSION_PHASE
    // (Offline), CLUE_REVEAL, VOTING_PHASE, RESULT_PHASE, GAME_OVER
    this.phase = 'LOBBY';

    // Host Configurable Settings (bounds are enforced in utils/validation.js)
    this.settings = {
      // 'ONLINE' (typed clues, separate devices) | 'OFFLINE' (verbal, one room).
      // Swappable in the lobby, frozen once the match starts (settings are
      // rejected outside LOBBY).
      gameMode,
      // Player capacity chosen by the host - bounded by GAME_LIMITS, never fixed.
      maxPlayers: GAME_LIMITS.DEFAULT_MAX_PLAYERS,
      imposterCount: GAME_LIMITS.MIN_IMPOSTERS,
      categories: ['General'], // 1-3 categories chosen by the host
      clueTimer: 30, // Online only - ignored while gameMode is OFFLINE
      discussionTimer: DEFAULT_DISCUSSION_TIMER, // Offline only
      votingTimer: 30, // Used by both modes
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
    // Session tokens of kicked players - they may never rejoin this room,
    // even if their client still holds a stale session in localStorage.
    this.kickedSessionTokens = new Set();

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
      settings: {
        ...this.settings,
        // Expose the selected categories for the lobby display.
        categories: this.settings.categories,
      },
      // Server-owned rules, broadcast so the client never hardcodes capacity
      // limits, which imposter counts are legal, or the timer presets.
      limits: {
        minCapacity: GAME_LIMITS.MIN_PLAYERS,
        maxCapacity: GAME_LIMITS.MAX_PLAYERS,
        imposterOptions: getImposterOptions(this.settings.maxPlayers),
        clueTimerOptions: VALID_TIMERS,
        votingTimerOptions: VALID_TIMERS,
        discussionTimerOptions: VALID_DISCUSSION_TIMERS,
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