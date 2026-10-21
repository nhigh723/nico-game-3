// Mirror Butterfly: paint the spots on one wing; the other wing mirrors it live. Symmetry, left/right, colors.
import { type Ctx, W, INK } from '../art';
import { GRAY } from '../gfx';
import { L } from '../lines';
import { C, type CName, NAME_LINE } from '../paint';
import { type Activity, type Api, type Pt } from '../kit';
import { pots, dragPath } from './common';
type Spot = { x: number; y: number; r: number; c: CName | null };
const SETS: [number, number, number][][] = [
  [[-80, -60, 50], [-70, 70, 40]], [[-90, -70, 42], [-55, 10, 30], [-75, 85, 36]], [[-110, -90, 30], [-60, -40, 34], [-100, 30, 30], [-55, 95, 30]],
  [[-110, -100, 26], [-60, -70, 26], [-95, -10, 30], [-50, 40, 24], [-90, 95, 28]], [[-115, -105, 22], [-70, -95, 22], [-90, -40, 28], [-45, 0, 20], [-105, 40, 22], [-60, 100, 26]],
];
export function wing(api: Api, level: number): Activity {
  const set = SETS[Math.min(level, SETS.length - 1)]; const CX = W / 2, CY = 400;
  const spots: Spot[] = set.map(([x, y, r]) => ({ x: CX + x, y: CY + y, r, c: null }));
  const keys: CName[] = ['red', 'yellow', 'blue', 'green', 'purple', 'orange']; const tray = pots(keys, k => C[k]); let done = false, flap = 0;
  function paint(i: number, k: CName) { if (spots[i].c === k) return; spots[i].c = k; api.sfx.snap(); api.burst(spots[i].x, spots[i].y, 8, [C[k]]); api.burst(2 * CX - spots[i].x, spots[i].y, 8, [C[k]]); api.say(NAME_LINE[k], false);
    if (spots.every(s => s.c)) { done = true; api.sfx.cheer(); api.say(L.wingSame); setTimeout(() => api.win(L.wingWin), 1600); } }
  const hit = (p: Pt) => spots.findIndex(s => Math.hypot(p.x - s.x, p.y - s.y) < s.r + 14 || Math.hypot(p.x - (2 * CX - s.x), p.y - s.y) < s.r + 14);
  return {
    intro: L.wingGo,
    update(dt) { flap += dt * (done ? 8 : 1.5); },
    draw(c: Ctx) { const t = api.t(); const sq = done ? 0.75 + Math.abs(Math.sin(flap)) * 0.25 : 1 - Math.abs(Math.sin(flap)) * 0.04;
      c.save(); c.translate(CX, CY - (done ? Math.abs(Math.sin(t * 3)) * 30 : 0));
      for (const side of [-1, 1]) { c.save(); c.scale(side * sq, 1); c.fillStyle = '#ff9fe0'; c.beginPath(); c.ellipse(70, -60, 85, 90, 0.4, 0, 6.28); c.fill(); c.fillStyle = '#ffc6ef'; c.beginPath(); c.ellipse(65, 70, 65, 62, -0.3, 0, 6.28); c.fill();
        c.strokeStyle = '#d14fae'; c.lineWidth = 4; c.beginPath(); c.ellipse(70, -60, 85, 90, 0.4, 0, 6.28); c.stroke(); c.beginPath(); c.ellipse(65, 70, 65, 62, -0.3, 0, 6.28); c.stroke();
        for (const s of spots) { c.fillStyle = s.c ? C[s.c] : GRAY; c.beginPath(); c.arc(CX - s.x, s.y - CY, s.r, 0, 6.28); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3; c.stroke(); } c.restore(); }
      c.fillStyle = INK; c.beginPath(); c.ellipse(0, 0, 14, 110, 0, 0, 6.28); c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(-4, -105); c.quadraticCurveTo(-20, -150, -34, -150); c.moveTo(4, -105); c.quadraticCurveTo(20, -150, 34, -150); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-5, -80, 5, 0, 6.28); c.arc(5, -80, 5, 0, 6.28); c.fill(); c.restore();
      c.save(); c.setLineDash([6, 10]); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(CX, 200); c.lineTo(CX, 600); c.stroke(); c.restore();
      tray.draw(c, t); },
    down(p: Pt) { if (done) return; if (tray.down(p)) { api.sfx.pick(); return; } const i = hit(p); if (i >= 0 && tray.sel) paint(i, tray.sel); },
    move(p: Pt) { tray.move(p); },
    up() { const d = tray.up(); if (!d || done) return; const i = hit(d); if (i >= 0) paint(i, d.k); else api.sfx.boing(); },
    next() { if (done) return null; const i = spots.findIndex(s => !s.c); const k = keys[i % keys.length]; return { type: 'drag', path: dragPath(tray.at(k), [spots[i].x, spots[i].y]) }; },
    busy: () => done,
  };
}
