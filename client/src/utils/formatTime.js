/**
 * Duration formatting helpers shared by the countdown UI and the host settings.
 */

/** Formats a duration in seconds as mm:ss, e.g. 92 -> "01:32". */
export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Compact label for a preset duration, e.g. 30 -> "30s", 120 -> "2 min". */
export function formatDurationLabel(totalSeconds) {
  const safe = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (safe < 60) return `${safe}s`;
  const minutes = safe / 60;
  return Number.isInteger(minutes) ? `${minutes} min` : `${minutes.toFixed(1)} min`;
}
