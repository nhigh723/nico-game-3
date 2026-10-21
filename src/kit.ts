import type { Ctx, Shape } from './art';
export type { Ctx };
export type Pt = { x: number; y: number };
export type Action = { type: 'tap'; x: number; y: number } | { type: 'drag'; path: [number, number][] } | { type: 'wait'; ms: number };
export interface Api {
  say(text: string, force?: boolean): void; sfx: typeof import('./audio').sfx; burst(x: number, y: number, n?: number, cols?: string[]): void;
  win(line: string): void; t(): number; shake(a: number): void; unlocked(): string[]; saveArt(url: string): void; collect(c: import('./paint').CName): void; collection(): import('./paint').CName[];
}
export interface Activity {
  update(dt: number): void; draw(c: Ctx): void; down(p: Pt): void; move(p: Pt): void; up(p: Pt): void;
  /** the next input a player would make right now (drives the hint hand and the automated tests) */
  next(): Action | null; busy?(): boolean; intro?: string;
}
export type Blk = { id: number; sh: Shape; x: number; y: number; w: number; h: number; col: string };
let nid = 1; export const newId = () => nid++;
export const ROUND: Shape[] = ['tri', 'circle', 'half', 'star'];
/** Where a block of width w dropped at left x comes to rest: on top of the highest block under it (or the ground). */
export function restOn(bs: Blk[], x: number, w: number, ground: number, skip?: Blk) {
  let top = ground, on: Blk | null = null;
  for (const b of bs) { if (b === skip) continue; if (Math.min(x + w, b.x + b.w) - Math.max(x, b.x) > 3 && b.y < top) { top = b.y; on = b; } }
  return { y: top, on, round: !!on && ROUND.includes(on.sh) };
}
const ov = (a: Blk, b: Blk) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
/** Statics check. wind = sideways push per px of height. Returns the first block whose load tips past its support, or null. */
export function unstable(bs: Blk[], ground: number, wind = 0): Blk | null {
  const sorted = [...bs].sort((a, b) => (b.y + b.h) - (a.y + a.h));
  for (const b of sorted) {
    const bot = b.y + b.h; let lo = Infinity, hi = -Infinity;
    if (Math.abs(bot - ground) < 2) { lo = b.x; hi = b.x + b.w; }
    else for (const s of bs) if (s !== b && Math.abs(s.y - bot) < 2 && ov(b, s) > 0) { if (ROUND.includes(s.sh)) return b; lo = Math.min(lo, Math.max(b.x, s.x)); hi = Math.max(hi, Math.min(b.x + b.w, s.x + s.w)); }
    if (lo === Infinity) return b;
    const grp = new Set<Blk>([b]); let grew = true; // everything resting on b, transitively
    while (grew) { grew = false; for (const s of bs) if (!grp.has(s)) for (const g of grp) if (Math.abs(s.y + s.h - g.y) < 2 && ov(s, g) > 0) { grp.add(s); grew = true; break; } }
    let m = 0, cx = 0, cy = 0; for (const g of grp) { const a = g.w * g.h; m += a; cx += a * (g.x + g.w / 2); cy += a * (g.y + g.h / 2); } cx /= m; cy /= m;
    const push = wind * (bot - cy);
    if (cx < lo - 1 || cx > hi + 1 || cx + push > hi + 1) return b;
  }
  return null;
}
/** a falling/tumbling piece (purely visual) */
export type Tumble = { b: Blk; vx: number; vy: number; rot: number; vr: number; t: number };
export function stepTumble(ts: Tumble[], dt: number, floor = 900) { for (const k of ts) { k.vy += 1600 * dt; k.b.x += k.vx * dt; k.b.y += k.vy * dt; k.rot += k.vr * dt; k.t += dt; if (k.b.y + k.b.h > floor) { k.b.y = floor - k.b.h; k.vy *= -0.35; k.vx *= 0.7; k.vr *= 0.6; } } }
export const near = (a: Pt, x: number, y: number, r: number) => Math.hypot(a.x - x, a.y - y) < r;
export const inBox = (p: Pt, x: number, y: number, w: number, h: number, pad = 0) => p.x > x - pad && p.x < x + w + pad && p.y > y - pad && p.y < y + h + pad;
export function shuffle<T>(a: T[]) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
