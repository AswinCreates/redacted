/**
 * Single source of truth for every game-wide limit.
 *
 * The client never hardcodes these values: they are delivered to the client
 * through `room.limits` inside the public game state, so there is exactly one
 * place to change them.
 */

export const GAME_LIMITS = {
  /** Absolute floor for a room's player capacity (minimum viable match). */
  MIN_PLAYERS: 3,
  /** Absolute ceiling for a room's player capacity. */
  MAX_PLAYERS: 20,
  /**
   * Starting value for the host-controlled `maxPlayers` room setting.
   * This is an overridable default, NOT a hard cap - the host can raise it all
   * the way to MAX_PLAYERS.
   */
  DEFAULT_MAX_PLAYERS: 8,
  MIN_IMPOSTERS: 1,
  MAX_IMPOSTERS: 4,
};

/** Timer choices offered to the host (seconds). */
export const VALID_TIMERS = [15, 30, 45, 60];

/**
 * The two ways this game can be played. Both modes share the exact same room,
 * player, role, word, voting, elimination, spectator and scoring systems - only
 * the part between the role reveal and the vote differs.
 *
 *   ONLINE  - everyone on their own device. Players type clues in turn during
 *             the CLUE_PHASE and the server collects them.
 *   OFFLINE - everyone in the same physical room. Clues are spoken aloud, so the
 *             server runs one shared DISCUSSION_PHASE timer instead of per-player
 *             clue turns, then hands over to the unchanged voting flow.
 *
 * Stored as `room.settings.gameMode`, which means the existing LOBBY-only
 * settings gate also locks the mode in as soon as a match starts.
 */
export const GAME_MODES = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
};

/** Every legal value for `settings.gameMode`. */
export const VALID_GAME_MODES = [GAME_MODES.ONLINE, GAME_MODES.OFFLINE];

/** Mode used when a room is created without an explicit choice. */
export const DEFAULT_GAME_MODE = GAME_MODES.ONLINE;

/** Discussion-phase lengths offered to the host in Offline mode (seconds). */
export const VALID_DISCUSSION_TIMERS = [30, 60, 120, 180, 300];

/** Starting value for the host-controlled `discussionTimer` room setting. */
export const DEFAULT_DISCUSSION_TIMER = 120;

/**
 * Server-authoritative pause between the end of clue gathering (the final clue
 * in Online, the discussion timer in Offline) and the voting phase starting.
 * Gives every player time to read the last clue / wrap up the conversation
 * before the vote begins. Broadcast via the CLUE_REVEAL phase + phaseExpiresAt.
 */
export const CLUE_REVEAL_SECONDS = 5;

/** Word-bank themes currently seeded in the database. */
export const VALID_CATEGORIES = ['General', 'Food', 'Animals', 'Tech', 'Movies', 'Places'];

/**
 * Imposter allowance tiers, expressed as a function of the player count.
 *
 *   3-4 players   -> 1 imposter
 *   5-8 players   -> up to 2 imposters
 *   9-14 players  -> up to 3 imposters
 *   15-20 players -> up to 4 imposters
 *
 * Ordered from largest to smallest so the first match wins.
 */
const IMPOSTER_TIERS = [
  { minPlayers: 15, maxImposters: 4 },
  { minPlayers: 9, maxImposters: 3 },
  { minPlayers: 5, maxImposters: 2 },
  { minPlayers: 3, maxImposters: 1 },
];

/**
 * Highest number of imposters allowed for a given player count.
 * Always keeps imposters strictly below 50% of the players so they can never
 * outnumber the innocents at the start of a round.
 */
export function getMaxImposters(playerCount) {
  const tier = IMPOSTER_TIERS.find((t) => playerCount >= t.minPlayers);
  const tierMax = tier ? tier.maxImposters : GAME_LIMITS.MIN_IMPOSTERS;
  // Safety net: imposters must always be a strict minority.
  const strictMinorityMax = Math.max(GAME_LIMITS.MIN_IMPOSTERS, Math.ceil(playerCount / 2) - 1);
  return Math.min(tierMax, strictMinorityMax, GAME_LIMITS.MAX_IMPOSTERS);
}

/** The selectable imposter counts for a given player count, e.g. [1, 2]. */
export function getImposterOptions(playerCount) {
  const max = getMaxImposters(playerCount);
  return Array.from({ length: max }, (_, i) => i + GAME_LIMITS.MIN_IMPOSTERS);
}

/**
 * Validates a requested room capacity.
 * Returns the parsed number, or null when it is out of range.
 */
export function parsePlayerCapacity(value, connectedCount = 0) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  const min = Math.max(GAME_LIMITS.MIN_PLAYERS, connectedCount);
  if (parsed < min || parsed > GAME_LIMITS.MAX_PLAYERS) return null;
  return parsed;
}