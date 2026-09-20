import {
  GAME_LIMITS,
  VALID_CATEGORIES,
  VALID_DISCUSSION_TIMERS,
  VALID_GAME_MODES,
  VALID_TIMERS,
  DEFAULT_GAME_MODE,
  getMaxImposters,
  parsePlayerCapacity,
} from '../config/gameConfig.js';

/**
 * Sanitizes and validates player display names.
 */
export function validatePlayerName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 15) return null;
  return trimmed;
}

/**
 * Normalizes a requested game mode to its canonical value.
 *
 * Returns `DEFAULT_GAME_MODE` when nothing was requested (so `create_room`
 * stays backward compatible with clients that never send a mode), or null when
 * a value was supplied that we do not recognise.
 */
export function normalizeGameMode(value) {
  if (value === undefined || value === null || value === '') return DEFAULT_GAME_MODE;
  const requested = String(value).toUpperCase();
  return VALID_GAME_MODES.includes(requested) ? requested : null;
}

/**
 * Validates a host configuration update.
 *
 * `room` is the live Room instance being updated. It is required because some
 * rules span several fields - notably the requested imposter count must be
 * legal for the resulting player capacity. The server never trusts the
 * client's own idea of what is valid.
 */
export function validateSettings(settings, room) {
  if (!settings || typeof settings !== 'object') {
    return { error: 'Invalid settings payload.' };
  }

  const connectedCount = room?.getAllConnectedPlayers?.().length ?? 0;
  const sanitized = {};

  if (settings.gameMode !== undefined) {
    // Mode is a normal lobby setting, so switching Online <-> Offline before the
    // match starts is allowed and the mode is frozen afterwards (the caller
    // rejects every settings update outside LOBBY).
    const requested = String(settings.gameMode).toUpperCase();
    if (!VALID_GAME_MODES.includes(requested)) {
      return { error: 'Invalid game mode.' };
    }
    sanitized.gameMode = requested;
  }

  if (settings.maxPlayers !== undefined) {
    const capacity = parsePlayerCapacity(settings.maxPlayers, connectedCount);
    if (capacity === null) {
      const min = Math.max(GAME_LIMITS.MIN_PLAYERS, connectedCount);
      return {
        error: `Player capacity must be between ${min} and ${GAME_LIMITS.MAX_PLAYERS}.`,
      };
    }
    sanitized.maxPlayers = capacity;
  }

  if (settings.imposterCount !== undefined) {
    const requested = parseInt(settings.imposterCount, 10);
    if (Number.isNaN(requested)) {
      return { error: 'Invalid imposter count.' };
    }

    // Validate against the capacity that will apply once this update lands.
    const effectiveCapacity = Math.max(
      sanitized.maxPlayers ?? room?.settings?.maxPlayers ?? connectedCount,
      connectedCount
    );
    const maxImposters = getMaxImposters(effectiveCapacity);

    if (requested < GAME_LIMITS.MIN_IMPOSTERS || requested > maxImposters) {
      return {
        error: `Imposters must be between ${GAME_LIMITS.MIN_IMPOSTERS} and ${maxImposters} for ${effectiveCapacity} players.`,
      };
    }
    sanitized.imposterCount = requested;
  }

  if (settings.categories !== undefined) {
    // Host may choose 1 to 3 categories for the game.
    if (!Array.isArray(settings.categories) || settings.categories.length === 0) {
      return { error: 'Select at least one category.' };
    }
    if (settings.categories.length > 3) {
      return { error: 'Choose up to 3 categories.' };
    }
    const normalized = settings.categories
      .map((c) => (typeof c === 'string' ? c.trim() : null))
      .filter(Boolean);
    const unique = [...new Set(normalized)];
    if (unique.length !== normalized.length) {
      return { error: 'Duplicate categories are not allowed.' };
    }
    if (!unique.every((c) => VALID_CATEGORIES.includes(c))) {
      return { error: 'Invalid category selected.' };
    }
    sanitized.categories = unique;
  } else if (settings.category !== undefined) {
    // Legacy single-category shape — still accept it for backward compat.
    if (!VALID_CATEGORIES.includes(settings.category)) {
      return { error: 'Invalid theme selected.' };
    }
    sanitized.categories = [settings.category];
  }

  if (settings.clueTimer !== undefined) {
    const ct = parseInt(settings.clueTimer, 10);
    if (!VALID_TIMERS.includes(ct)) return { error: 'Invalid clue timer value.' };
    sanitized.clueTimer = ct;
  }

  if (settings.discussionTimer !== undefined) {
    // Offline-only: the single shared verbal-discussion countdown. Lengths are
    // much longer than a per-player clue timer by design.
    const dt = parseInt(settings.discussionTimer, 10);
    if (!VALID_DISCUSSION_TIMERS.includes(dt)) return { error: 'Invalid discussion timer value.' };
    sanitized.discussionTimer = dt;
  }

  if (settings.votingTimer !== undefined) {
    const vt = parseInt(settings.votingTimer, 10);
    if (!VALID_TIMERS.includes(vt)) return { error: 'Invalid voting timer value.' };
    sanitized.votingTimer = vt;
  }

  return { sanitized };
}