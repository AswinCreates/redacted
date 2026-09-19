import React, { useState } from 'react';
import { Menu, Play, X, Maximize, Minimize } from 'lucide-react';
import { GAME_NAME } from '../../config/branding';
import BrandMark from './BrandMark';

const LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
];

/**
 * Redacted navbar (RED ACTED split styling): fully transparent bar floating
 * over the page atmosphere, brand mark + section links + a prominent orange
 * PLAY NOW action. Collapses to a hamburger on mobile.
 */
export default function Navbar({ view, onNavigate, onBrandClick, isFullscreen, onToggleFullscreen }) {
  const [open, setOpen] = useState(false);

  const handleNav = (target) => {
    setOpen(false);
    onNavigate(target);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-night/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onBrandClick}
          aria-label={`${GAME_NAME} home`}
          className="flex items-center gap-2.5 rounded-lg"
        >
          <BrandMark size="sm" />
          <span className="font-display text-lg font-black tracking-[0.18em] text-bone"><span aria-hidden="true">RED<span className="text-brand-500">ACTED</span></span><span className="sr-only">{GAME_NAME}</span></span>
        </button>

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => {
                if (view !== 'landing') {
                  event.preventDefault();
                  handleNav('landing');
                  window.setTimeout(() => {
                    document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }
              }}
              className="text-sm font-semibold text-mist transition hover:text-bone"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNav('play')}
            className="btn-primary hidden !rounded-full !px-6 sm:inline-flex"
          >
            <Play className="h-4 w-4" /> Play Now
          </button>
          {onToggleFullscreen ? (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-pressed={Boolean(isFullscreen)}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="btn-secondary !rounded-full !p-2.5"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="btn-secondary !rounded-full !p-2.5 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav aria-label="Mobile" className="mx-4 rounded-2xl border border-white/10 bg-night/90 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => {
                  setOpen(false);
                  if (view !== 'landing') {
                    event.preventDefault();
                    handleNav('landing');
                  }
                }}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-mist transition hover:bg-white/5 hover:text-bone"
              >
                {link.label}
              </a>
            ))}
            <button type="button" onClick={() => handleNav('play')} className="btn-primary btn-lg mt-2 w-full">
              <Play className="h-4 w-4" /> Play Now
            </button>
            {onToggleFullscreen ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onToggleFullscreen();
                }}
                aria-pressed={Boolean(isFullscreen)}
                className="btn-secondary mt-2 w-full"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              </button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
