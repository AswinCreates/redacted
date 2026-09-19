import crypto from 'crypto';

/**
 * Generates a unique 5-character uppercase alphanumeric room code.
 * Excludes ambiguous characters (0, O, 1, I, L) for clarity.
 */
const CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateRoomCode() {
  let code = '';
  const bytes = crypto.randomBytes(5);
  for (let i = 0; i < 5; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return code;
}

/**
 * Generates a secure session token for client reconnection persistence.
 */
export function generateSessionToken() {
  return crypto.randomBytes(16).toString('hex');
}