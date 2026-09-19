const SESSION_KEY = 'moveforward_session';

/**
 * Persists session data for reconnection across page refreshes.
 */
export function saveSession({ roomCode, playerId, sessionToken, playerName }) {
  const data = { roomCode, playerId, sessionToken, playerName, updatedAt: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}