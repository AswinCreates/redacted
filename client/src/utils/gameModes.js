/**
 * Client-side mirror of the server's game modes.
 *
 * The server stays authoritative: it stores the mode in `room.settings.gameMode`
 * and only ever broadcasts the canonical 'ONLINE' / 'OFFLINE' values. This module
 * exists so every screen reads one constant and one set of player-facing words,
 * instead of scattering mode strings through the components.
 */
export const GAME_MODES = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
};

export const DEFAULT_GAME_MODE = GAME_MODES.ONLINE;

/** Wording for the mode pickers (Home) and the lobby hint. */
export const GAME_MODE_META = {
  [GAME_MODES.ONLINE]: {
    label: 'Online',
    tagline: 'Play with players on different devices.',
    description: 'Clues are submitted through the game, one player at a time.',
    lobbyHint: 'Everyone plays from their own device and types their clue in turn.',
  },
  [GAME_MODES.OFFLINE]: {
    label: 'Offline',
    tagline: 'Play face-to-face with everyone in the same room.',
    description: 'Clues are discussed verbally. The app only runs the discussion timer.',
    lobbyHint: 'Same room, clues spoken out loud — only the discussion timer is on screen.',
  },
};

/**
 * Canonicalises any mode value coming from the server or a URL. Unknown or
 * missing values fall back to Online so a stale client can never be left without
 * a usable mode.
 */
export function normalizeGameMode(value) {
  const requested = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return requested === GAME_MODES.OFFLINE ? GAME_MODES.OFFLINE : DEFAULT_GAME_MODE;
}

/** Reads the mode out of a public room state's settings block. */
export function getGameMode(settings) {
  return normalizeGameMode(settings?.gameMode);
}

/** True when the room is playing the face-to-face (verbal discussion) mode. */
export function isOfflineMode(settings) {
  return getGameMode(settings) === GAME_MODES.OFFLINE;
}

export function getGameModeLabel(settings) {
  return GAME_MODE_META[getGameMode(settings)].label;
}
