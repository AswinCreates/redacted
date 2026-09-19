import {
  GAME_LIMITS,
  VALID_CATEGORIES,
  VALID_TIMERS,
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

  if (settings.votingTimer !== undefined) {
    const vt = parseInt(settings.votingTimer, 10);
    if (!VALID_TIMERS.includes(vt)) return { error: 'Invalid voting timer value.' };
    sanitized.votingTimer = vt;
  }

  return { sanitized };
}