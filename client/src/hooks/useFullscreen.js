import { useState, useEffect, useCallback } from 'react';

/**
 * Fullscreen toggle for the game tab (document.documentElement).
 *
 * Tracks the real fullscreen state via the `fullscreenchange` event so the UI
 * stays correct when the user exits with ESC or the browser chrome. Falls
 * back gracefully where the Fullscreen API is unavailable.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false,
  );
  const [isSupported] = useState(
    () => typeof document !== 'undefined' && typeof document.documentElement?.requestFullscreen === 'function',
  );

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* User denied it or browser blocked it - button just stays as-is. */
    }
  }, []);

  return { isFullscreen, isSupported, toggleFullscreen: toggle };
}
