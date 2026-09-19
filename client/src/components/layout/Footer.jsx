import React from 'react';
import { ExternalLink } from 'lucide-react';
import { BRAND_LINK_LABEL, BRAND_LINK_URL } from '../../config/branding';

/**
 * Site footer with the required attribution. Muted gray body copy, orange
 * accent on the mvfrwd link, opens the external studio page in a new tab.
 */
export default function Footer({ brandName = 'Redacted' }) {
  return (
    <footer className="mx-auto mt-10 w-full max-w-6xl border-t border-white/10 pt-6 text-center">
      <p className="text-xs text-mist">
        {brandName} — read the clues, hide your identity, find the imposter.
      </p>
      <p className="mt-2 text-sm text-mist">
        Build and Developed By{' '}
        <a
          href={BRAND_LINK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-brand-400 transition hover:text-brand-300 hover:underline"
        >
          {BRAND_LINK_LABEL}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        .
      </p>
    </footer>
  );
}
