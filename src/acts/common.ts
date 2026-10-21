import { type Ctx, W, rr } from '../art';
import { pot, drop } from '../gfx';
import { type Pt, near } from '../kit';
/** A tray of paint pots; dragging one carries a paint drop under the finger. */
export function pots<K extends string>(keys: K[], col: (k: K) => string, y = 770) {
  const n = keys.length, gap = Math.min(80, (W - 30) / n), x0 = W / 2 - (n - 1) * gap / 2;
  const P = keys.map((k, i) => ({ k, x: x0 + i * gap, y }));
  let drag: { k: K; x: number; y: number } | null = null, sel: K | null = null;
  return {
    P, get drag() { return drag; }, get sel() { return sel; }, set sel(v) { sel = v; },
    draw(c: Ctx, t: number) { c.fillStyle = 'rgba(255,255,255,0.55)'; rr(c, 8, y - 46, W - 16, 96, 28); c.fill();
      for (const p of P) { const s = sel === p.k ? 1.12 + Math.sin(t * 6) * 0.04 : 1; pot(c, p.x, p.y, col(p.k), s * (n > 5 ? 0.85 : 1)); }
      if (drag) drop(c, drag.x, drag.y - 30, col(drag.k), 1.3); },
    down(p: Pt) { for (const q of P) if (near(p, q.x, q.y, 36)) { drag = { k: q.k, x: p.x, y: p.y }; sel = q.k; return true; } return false; },
    move(p: Pt) { if (drag) { drag.x = p.x; drag.y = p.y; } },
    up(): { k: K; x: number; y: number } | null { const d = drag; drag = null; return d ? { ...d, y: d.y - 30 } : null; },
    at(k: K): [number, number] { const q = P.find(q => q.k === k)!; return [q.x, q.y]; },
  };
}
export const dragPath = (from: [number, number], to: [number, number]): [number, number][] => [from, [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 40], [to[0], to[1] + 30]];
