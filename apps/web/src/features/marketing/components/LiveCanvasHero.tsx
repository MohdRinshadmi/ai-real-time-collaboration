'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * The signature: the headline is co-authored live by named presence cursors, the
 * way the product itself works. "You" (iris) writes the first line, "Maya" (amber)
 * the second, each with a colored caret and a name pill — exactly what you'd see
 * in a real multiplayer edit. Idle collaborators drift in the margins.
 *
 * Respects prefers-reduced-motion: the final state renders instantly, no typing.
 */

type Author = { name: string; color: string };

const YOU: Author = { name: 'You', color: 'var(--presence-iris)' };
const MAYA: Author = { name: 'Maya', color: 'var(--presence-amber)' };

const SEGMENTS: { text: string; author: Author; br?: boolean }[] = [
  { text: 'Think together.', author: YOU, br: true },
  { text: 'Ship faster.', author: MAYA },
];

const FULL_LENGTH = SEGMENTS.reduce((n, s) => n + s.text.length, 0);
const CHAR_MS = 52;

export function LiveCanvasHero() {
  const [typed, setTyped] = useState(0);
  const reduced = useReducedMotion();
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (reduced) {
      setTyped(FULL_LENGTH);
      return;
    }
    // Small beat before the first keystroke, then type to completion.
    const start = setTimeout(() => {
      timer.current = setInterval(() => {
        setTyped((n) => {
          if (n >= FULL_LENGTH) {
            clearInterval(timer.current);
            return n;
          }
          return n + 1;
        });
      }, CHAR_MS);
    }, 650);
    return () => {
      clearTimeout(start);
      clearInterval(timer.current);
    };
  }, [reduced]);

  const done = typed >= FULL_LENGTH;

  // Resolve per-segment visible counts from a single running offset.
  const rendered = useMemo(() => {
    let offset = 0;
    return SEGMENTS.map((seg) => {
      const visible = Math.max(0, Math.min(typed - offset, seg.text.length));
      const active = !done && visible > 0 && offset <= typed && typed <= offset + seg.text.length;
      offset += seg.text.length;
      return { ...seg, visible, active };
    });
  }, [typed, done]);

  return (
    <div className="relative">
      <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
        {rendered.map((seg, i) => (
          <span key={i} className="relative">
            <span
              className="rounded-sm transition-colors"
              style={
                seg.active
                  ? { boxShadow: `inset 0 -0.62em 0 hsl(${seg.author.color} / 0.16)` }
                  : undefined
              }
            >
              {seg.text.split('').map((ch, j) => (
                <span key={j} className={j < seg.visible ? '' : 'opacity-0'} aria-hidden={j >= seg.visible}>
                  {ch}
                </span>
              ))}
            </span>
            {seg.active && <Caret author={seg.author} />}
            {seg.br && <br />}
          </span>
        ))}
        <span className="sr-only">Think together. Ship faster.</span>
      </h1>
    </div>
  );
}

function Caret({ author }: { author: Author }) {
  return (
    <span className="relative inline-flex items-center align-baseline">
      <span
        className="ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[0.08em] rounded-full motion-safe:animate-caret-blink"
        style={{ background: `hsl(${author.color})` }}
      />
      <span
        className="ml-1.5 select-none rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none tracking-wide text-white motion-safe:animate-presence-pop"
        style={{ background: `hsl(${author.color})` }}
      >
        {author.name}
      </span>
    </span>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
