import { useEffect, useRef, type ReactNode } from 'react';
import type { Bracket, Build, Card, Game } from '../engine/types';
import { player, roundCount, stageName } from '../engine/engine';

export function Btn(props: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'main' | 'quiet' | 'line';
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`btn btn-${props.tone ?? 'main'}`} disabled={props.disabled} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

/** Sticky thumb zone at the bottom of every screen. */
export function Dock({ children }: { children: ReactNode }) {
  return <div className="dock">{children}</div>;
}

export function GameCard(props: { card: Card; selected?: boolean; dim?: boolean; onClick?: () => void; small?: boolean }) {
  const { card } = props;
  const cls = `gcard gcard-${card.kind}${props.selected ? ' is-on' : ''}${props.dim ? ' is-dim' : ''}${props.small ? ' is-small' : ''}`;
  const body = (
    <>
      <span className="gcard-kind">{card.kind === 'character' ? 'Character' : 'Power'}</span>
      <span className="gcard-title">{card.title}</span>
      <span className="gcard-detail">{card.detail}</span>
      {props.selected ? <span className="gcard-check" aria-hidden>✓</span> : null}
    </>
  );
  if (!props.onClick) return <div className={cls}>{body}</div>;
  return (
    <button type="button" className={cls} aria-pressed={props.selected} onClick={props.onClick}>
      {body}
    </button>
  );
}

/** A fighter on the bill: name, then the character and power they kept. */
export function Bill({ name, build, compact }: { name: string; build: Build; compact?: boolean }) {
  return (
    <div className={`bill${compact ? ' is-compact' : ''}`}>
      <div className="bill-name">{name}</div>
      <div className="bill-as">
        <span className="bill-char">{build.character.title}</span>
        <span className="bill-with">with</span>
        <span className="bill-pow">{build.power.title}</span>
      </div>
      {!compact ? (
        <div className="bill-notes">
          <p>{build.character.detail}</p>
          <p>{build.power.detail}</p>
        </div>
      ) : null}
    </div>
  );
}

export function Vs() {
  return (
    <div className="vs" aria-hidden>
      <span>vs</span>
    </div>
  );
}

/** Full-screen privacy gate shown while the phone changes hands. */
export function Curtain(props: { role: string; name: string; note: string; children: ReactNode }) {
  return (
    <div className="curtain">
      <p className="curtain-role">{props.role}</p>
      <p className="curtain-pass">Pass the phone to</p>
      <h1 className="curtain-name">{props.name}</h1>
      <p className="curtain-note">{props.note}</p>
      <div className="curtain-actions">{props.children}</div>
    </div>
  );
}

const CONFETTI_MS = 2400;
const COLORS = ['#FF4D3D', '#FFC83D', '#FFFFFF', '#7FD8FF', '#FF8FB1'];

export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = (canvas.width = canvas.offsetWidth * dpr);
    const h = (canvas.height = canvas.offsetHeight * dpr);
    const bits = Array.from({ length: 140 }, () => ({
      x: Math.random() * w,
      y: -Math.random() * h * 0.6,
      vx: (Math.random() - 0.5) * 2.4 * dpr,
      vy: (2 + Math.random() * 4) * dpr,
      size: (5 + Math.random() * 7) * dpr,
      spin: Math.random() * Math.PI,
      vs: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = t > CONFETTI_MS - 500 ? Math.max(0, (CONFETTI_MS - t) / 500) : 1;
      for (const b of bits) {
        b.x += b.vx;
        b.y += b.vy;
        b.spin += b.vs;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.spin);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
        ctx.restore();
      }
      if (t < CONFETTI_MS) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden />;
}

export function BracketBoard({ game, bracket }: { game: Game; bracket: Bracket }) {
  const rounds = roundCount(bracket);
  const name = (id: string | null, bye: boolean) => (id ? player(game, id).name : bye ? 'Bye' : '—');
  return (
    <div className="bracket" role="list" aria-label="Bracket">
      {Array.from({ length: rounds }, (_, r) => (
        <div className="bracket-col" key={r} role="listitem">
          <h3>{stageName(r, rounds)}</h3>
          <div className="bracket-matches">
            {bracket.matches
              .filter((m) => m.round === r)
              .map((m) => (
                <div
                  key={m.id}
                  className={`bmatch${m.id === bracket.currentId && game.phase.type !== 'champion' ? ' is-now' : ''}${m.bye ? ' is-bye' : ''}`}
                >
                  {m.playerIds.map((id, k) => (
                    <div key={k} className={`bslot${m.winnerId && id === m.winnerId ? ' is-win' : ''}${m.winnerId && id && id !== m.winnerId ? ' is-out' : ''}`}>
                      {name(id, m.bye)}
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sheet(props: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props.onClose]);
  return (
    <div className="sheet-backdrop" onClick={props.onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={props.title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{props.title}</h2>
          <button type="button" className="sheet-close" onClick={props.onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="sheet-body">{props.children}</div>
      </div>
    </div>
  );
}
