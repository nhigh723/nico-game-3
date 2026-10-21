// Rainbow Road: paint the stepping stones to continue the pattern, then a critter hops across. Patterns, sequencing, color names.
import { type Ctx, W } from '../art';
import { puddle, fluff, GRAY } from '../gfx';
import { L } from '../lines';
import { C, type CName, NAME_LINE } from '../paint';
import { type Activity, type Api, type Pt, near, shuffle } from '../kit';
import { pots, dragPath } from './common';
const PATS = ['AB', 'AB', 'ABC', 'AAB', 'ABB'];
export function road(api: Api, level: number): Activity {
  const pat = level < PATS.length ? PATS[level] : PATS[Math.floor(Math.random() * PATS.length)], N = 9;
  const pal = shuffle(['red', 'yellow', 'blue', 'green', 'purple', 'orange'] as CName[]); const cmap: Record<string, CName> = { A: pal[0], B: pal[1], C: pal[2] };
  const want = Array.from({ length: N }, (_, i) => cmap[pat[i % pat.length]]); const shown = Math.max(pat.length * 2, 3);
  const stones = want.map((w, i) => { const row = Math.floor(i / 3), col = row % 2 ? 2 - (i % 3) : i % 3; return { x: 85 + col * 110, y: 230 + row * 150, w, c: i < shown ? (w as CName | null) : null, shake: 0 }; });
  const keys = [...new Set(want)]; if (keys.length < 3) keys.push(pal[3]); const tray = pots(shuffle(keys), k => C[k]);
  let done = false, hop = -1;
  const nextIdx = () => stones.findIndex(s => !s.c);
  return {
    intro: level === 0 ? L.roadGo : L.roadGo2,
    update(dt) { for (const s of stones) if (s.shake > 0) s.shake -= dt; if (hop >= 0) { hop += dt; if (Math.floor(hop * 2.5) !== Math.floor((hop - dt) * 2.5)) api.sfx.hop(); } },
    draw(c: Ctx) { const t = api.t(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 14; c.setLineDash([2, 22]); c.lineCap = 'round'; c.beginPath(); stones.forEach((s, i) => i ? c.lineTo(s.x, s.y) : c.moveTo(s.x, s.y)); c.stroke(); c.setLineDash([]);
      stones.forEach((s, i) => { const sx = s.shake > 0 ? Math.sin(s.shake * 50) * 6 : 0; puddle(c, s.x + sx, s.y, 46, 30, s.c ? C[s.c] : GRAY, t + i, 0.6);
        if (i === nextIdx() && !done) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.setLineDash([8, 8]); c.lineDashOffset = -t * 20; c.beginPath(); c.ellipse(s.x, s.y, 54, 38, 0, 0, 6.28); c.stroke(); c.setLineDash([]); } });
      let fx = stones[0].x - 10, fy = stones[0].y - 40; if (hop >= 0) { const k = Math.min(N - 1, hop * 2.5), i = Math.floor(k), f = k - i, a = stones[i], b = stones[Math.min(N - 1, i + 1)]; fx = a.x + (b.x - a.x) * f; fy = a.y + (b.y - a.y) * f - 40 - Math.sin(f * Math.PI) * 50; }
      fluff(c, fx, fy, 0.55, C[cmap.A], t, done, level); tray.draw(c, t); },
    down(p: Pt) { if (done) return; if (tray.down(p)) api.sfx.pick(); },
    move(p: Pt) { tray.move(p); },
    up() { const d = tray.up(); if (!d || done) return; const i = stones.findIndex(s => !s.c && near(d, s.x, s.y, 60)); if (i < 0) { api.sfx.boing(); return; }
      const ni = nextIdx(); const s = stones[ni]; if (i !== ni) { stones[i].shake = 0.4; api.sfx.wrong(); return; }
      if (d.k !== s.w) { s.shake = 0.4; api.sfx.wrong(); api.say(L.roadWrong, false); return; }
      s.c = d.k; api.sfx.snap(); api.burst(s.x, s.y, 12, [C[d.k]]); api.say(NAME_LINE[d.k], false);
      if (nextIdx() < 0) { done = true; hop = 0; setTimeout(() => { api.sfx.cheer(); api.win(L.roadWin); }, (N / 2.5) * 1000 + 200); } },
    next() { if (done) return null; const s = stones[nextIdx()]; return { type: 'drag', path: dragPath(tray.at(s.w), [s.x, s.y]) }; },
    busy: () => done,
  };
}
