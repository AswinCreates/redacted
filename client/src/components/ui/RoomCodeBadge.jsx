import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Room code display with a copy-to-clipboard action.
 * Falls back to a hidden textarea when the clipboard API is unavailable
 * (non-secure contexts / older browsers) so the action always works.
 */
export default function RoomCodeBadge({ code, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard blocked - the code is still visible and selectable. */
    }
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mist">Room code</p>
        <p className="font-mono text-2xl font-black tracking-[0.3em] text-white sm:text-3xl">{code}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Room code copied' : 'Copy room code'}
        className="ml-auto flex h-11 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-bone transition hover:border-brand-500/60 hover:bg-brand-500/15 hover:text-white active:scale-95"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
}