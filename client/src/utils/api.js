/**
 * Thin wrapper around the existing REST API.
 *
 * Socket.IO carries all gameplay traffic; this is only used for read-only
 * reference data that must not be hardcoded in the UI.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Loads the available word-bank themes (categories) from the server.
 * Returns [] when the API is unavailable so the UI can fall back gracefully.
 */
export async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/api/categories`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((c) => c.name).filter(Boolean);
  } catch {
    return [];
  }
}
