import React from 'react';
import { Play, DoorOpen, Fingerprint, MessageSquareText, Vote, Radio, VenetianMask, Brain, Scale, Eye, EyeOff } from 'lucide-react';
import { GAME_NAME, GAME_TAGLINE, GAME_SUBTITLE } from '../config/branding';
import BrandMark from '../components/layout/BrandMark';

const STEPS = [
  { Icon: DoorOpen, index: '01', title: 'Join the room', body: 'Create a room or drop in with a 5-letter code. Everyone plays from their own device.' },
  { Icon: Fingerprint, index: '02', title: 'Get your secret', body: 'Most players receive the secret word. The imposters get only a whisper of a hint.' },
  { Icon: MessageSquareText, index: '03', title: 'Give your clue', body: 'Describe the word without saying it. Too vague looks guilty. Too obvious helps the imposter.' },
  { Icon: Vote, index: '04', title: 'Find the imposter', body: 'Read every clue, trust your gut, and vote. One wrong call can flip the whole match.' },
];

const FEATURES = [
  { Icon: Radio, title: 'Real-time multiplayer', body: 'Rooms sync instantly across every screen. Clues, votes and results land at the same moment.' },
  { Icon: VenetianMask, title: 'Hidden roles', body: 'Secrets stay on the server and travel only to their owner. Bluffing is a first-class citizen.' },
  { Icon: Brain, title: 'Think before you speak', body: 'Every clue is a tightrope: prove you know the word without handing it to the imposter.' },
  { Icon: Scale, title: 'Vote wisely', body: 'Anonymous ballots, public consequences. Ties save everyone - a wrong majority ends someone.' },
];

function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto grid w-full max-w-sm grid-cols-2 gap-4 sm:max-w-md">
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-brand-500/15 blur-3xl" />
      <div style={{ '--float-rot': '-3deg' }} className="relative animate-float-soft rounded-3xl border border-white/10 bg-coal p-5 shadow-2xl shadow-black/60">
        <Eye className="h-5 w-5 text-brand-400" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-mist">Your role</p>
        <p className="text-xl font-black text-bone">Innocent</p>
        <p className="mt-1 font-mono text-xs tracking-[0.3em] text-brand-300">P * Z Z A</p>
      </div>
      <div style={{ '--float-rot': '3deg', animationDelay: '1.2s' }} className="relative mt-8 animate-float-soft rounded-3xl border border-brand-500/40 bg-coal p-5 shadow-2xl shadow-brand-500/10">
        <EyeOff className="h-5 w-5 text-brand-400" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-mist">Your hint</p>
        <p className="text-xl font-black text-bone">Imposter</p>
        <p className="mt-1 text-xs font-semibold text-mist">Italian food...</p>
      </div>
      <div style={{ '--float-rot': '2deg', animationDelay: '0.6s' }} className="relative animate-float-soft rounded-3xl border border-white/10 bg-coal p-4 shadow-xl shadow-black/50">
        <MessageSquareText className="h-4 w-4 text-brand-400" />
        <p className="mt-2 text-xs font-semibold text-bone">Melty triangle</p>
        <p className="text-[11px] text-mist">Amara - clue 2</p>
      </div>
      <div style={{ '--float-rot': '-2deg', animationDelay: '1.8s' }} className="relative mt-8 animate-float-soft rounded-3xl border border-white/10 bg-coal p-4 shadow-xl shadow-black/50">
        <Vote className="h-4 w-4 text-brand-400" />
        <p className="mt-2 text-xs font-semibold text-bone">2 votes on Dev</p>
        <p className="text-[11px] text-mist">Voting ends in 18s</p>
      </div>
    </div>
  );
}

export default function LandingPage({ onPlay }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 pb-4 sm:space-y-20">
      <section className="grid items-center gap-10 pt-2 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="animate-fade-in-up text-center lg:text-left">
          <div className="flex items-center justify-center gap-3 lg:justify-start">
            <BrandMark size="lg" />
            <span className="text-left">
              <span className="block font-display text-2xl font-black tracking-[0.18em] text-white"><span aria-hidden="true">RED<span className="text-brand-500">ACTED</span></span><span className="sr-only">{GAME_NAME}</span></span>
              <span className="eyebrow">Social deduction</span>
            </span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">One of you is <span className="text-brand-500">lying.</span></h1>
          <p className="mx-auto mt-4 max-w-md text-base font-semibold text-bone sm:text-lg lg:mx-0">{GAME_TAGLINE}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mist lg:mx-0">{GAME_SUBTITLE}. Real-time, 3-20 players, zero setup.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <button type="button" onClick={onPlay} className="btn-primary btn-lg w-full !rounded-2xl sm:w-auto"><Play className="h-5 w-5" /> Play Now</button>
            <a href="#how-it-works" className="btn-secondary btn-lg w-full !rounded-2xl sm:w-auto">How it works</a>
          </div>
          <p className="mt-4 text-xs text-mist">Free to play - No sign-up - Works on any device</p>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}><HeroVisual /></div>
      </section>
      <section id="how-it-works" className="scroll-mt-24">
        <div className="text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl">Four steps to catching a liar</h2>
        </div>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, index, title, body }, step) => (
            <li key={title} style={{ animationDelay: `${step * 80}ms` }} className="glass card-hover animate-fade-in-up rounded-3xl p-5 text-left">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10"><Icon className="h-5 w-5 text-brand-400" /></span>
                <span className="font-mono text-sm font-black text-brand-500/60">{index}</span>
              </div>
              <h3 className="mt-4 text-base font-black text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section id="features" className="scroll-mt-24">
        <div className="text-center">
          <p className="eyebrow">Why Redacted</p>
          <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl">Built for suspicion</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, body }, index) => (
            <article key={title} style={{ animationDelay: `${index * 80}ms` }} className="glass card-hover animate-fade-in-up flex gap-4 rounded-3xl p-5 text-left sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30"><Icon className="h-6 w-6" /></span>
              <span><h3 className="text-base font-black text-white">{title}</h3><p className="mt-1 text-sm leading-relaxed text-mist">{body}</p></span>
            </article>
          ))}
        </div>
      </section>
      <section className="glass relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-aurora opacity-70" />
        <div className="relative">
          <p className="eyebrow">Your friends are already lying</p>
          <h2 className="mx-auto mt-2 max-w-xl font-display text-2xl font-black text-white sm:text-4xl">Gather 3-20 players. Find the imposter.</h2>
          <button type="button" onClick={onPlay} className="btn-primary btn-lg mx-auto mt-6 !rounded-2xl"><Play className="h-5 w-5" /> Play Now</button>
        </div>
      </section>
    </div>
  );
}
