import { useState, useCallback, useEffect } from 'react';

/**
 * Minimal view router for the pre-game flow (no react-router dependency).
 *
 *   landing -> the Redacted marketing entry point
 *   play    -> the existing create/join screen (Home)
 *
 * Once the socket joins a room, `inRoom` takes over and the game screens
 * render regardless of the stored view. Leaving a room returns to landing.
 */
export function useViewNavigation({ inRoom = false } = {}) {
  const [view, setView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'play' ? 'play' : 'landing';
    } catch {
      return 'landing';
    }
  });

  // Keep the URL in sync so a view is shareable / refresh-stable.
  useEffect(() => {
    if (inRoom) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (view === 'play') params.set('view', 'play');
      else params.delete('view');
      const query = params.toString();
      const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      window.history.replaceState(null, '', next);
    } catch {
      /* URL sync is a nicety - never block navigation on it. */
    }
  }, [view, inRoom]);

  const go = useCallback((next) => {
    setView(next === 'play' ? 'play' : 'landing');
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  return { view, go };
}
