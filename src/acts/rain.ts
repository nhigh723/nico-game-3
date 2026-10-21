// Color Sort Rain: catch falling paint drops and drop each into the bucket of the same color. Sorting, matching. No fail: missed drops float back up.
import { type Ctx, W } from '../art';
import { drop, puddle } from '../gfx';
import { L } from '../lines';
import { C, type CName, NAME_LINE } from '../paint';
import { type Activity, type Api, type Pt, shuffle } from '../kit';
const LV: { cols: CName[]; goal: number }[] = [{ cols: ['red', 'yellow', 'blue'], goal: 6 }, { cols: ['orange', 'green', 'purple'], goal: 6 }, { cols: ['red', 'blue', 'green', 'yellow'], goal: 8 }, { cols: ['pink', 'sky', 'lime', 'orange'], goal: 8 }, { cols: ['red', 'orange', 'yellow', 'green', 'blue'], goal: 10 }];
type D = { x: number; y: number; c: CName; vy: number; held: boolean; bounce: number };
export function rain(api: Api, level: number): Activity {
  const lv = level < LV.length ? LV[level] : { cols: shuffle(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as CName[]).slice(0, 4), goal: 8 };
  const n = lv.cols.length, bw = (W - 30) / n, buckets = lv.cols.map((c, i) => ({ c, x: 15 + bw * i + bw / 2, y: 720, got: 0, wob: 0 }));
  const drops: D[] = []; let caught = 0, spawnT = 0.5, held: D | null = null, done = false, ox = 0, oy = 0, k = 0;
  const spawn = () => { const c = lv.cols[(k++ * 7 + Math.floor(Math.random() * n)) % n]; drops.push({ x: 50 + Math.random() * (W - 100), y: 170, c, vy: 38 + level * 3, held: false, bounce: 0 }); };
  return {
    intro: L.rainGo,
    update(dt) { if (done) return; spawnT -= dt; if (spawnT <= 0 && drops.length < 3 && caught + drops.length < lv.goal) { spawn(); spawnT = 2.2; }
      for (const d of drops) { if (d.held) continue; if (d.bounce > 0) { d.bounce -= dt; d.y -= 160 * dt; } else d.y += d.vy * dt; if (d.y > 640) { d.y = 170; d.x = 50 + Math.random() * (W - 100); api.sfx.pop(); } }
      for (const b of buckets) if (b.wob > 0) b.wob -= dt; },
    draw(c: Ctx) { const t = api.t(); c.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(40 + i * 80, 150 + Math.sin(t + i) * 4, 44, 0, 6.28); c.fill(); }
      for (const b of buckets) { const wob = b.wob > 0 ? Math.sin(b.wob * 40) * 0.08 : 0; c.save(); c.translate(b.x, b.y); c.rotate(wob); c.fillStyle = C[b.c]; c.beginPath(); c.moveTo(-bw * 0.42, -40); c.lineTo(bw * 0.42, -40); c.lineTo(bw * 0.34, 40); c.lineTo(-bw * 0.34, 40); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 3; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-bw * 0.36, -32, 8, 60); c.restore();
        for (let i = 0; i < b.got; i++) { c.fillStyle = C[b.c]; c.beginPath(); c.arc(b.x - 20 + (i % 3) * 20, b.y + 60 + Math.floor(i / 3) * 0, 6, 0, 6.28); c.fill(); } }
      puddle(c, W / 2, 650, 170, 14, 'rgba(120,200,255,0.5)', t);
      for (const d of drops) drop(c, d.x, d.y, C[d.c], d.held ? 1.6 : 1.3);
      for (let i = 0; i < lv.goal; i++) { c.fillStyle = i < caught ? '#ffd60a' : 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(W / 2 + (i - (lv.goal - 1) / 2) * 22, 214, 7, 0, 6.28); c.fill(); } },
    down(p: Pt) { if (done) return; let best: D | null = null, bd = 50; for (const d of drops) { const q = Math.hypot(p.x - d.x, p.y - d.y); if (q < bd) { bd = q; best = d; } } if (best) { held = best; best.held = true; ox = p.x - best.x; oy = p.y - best.y; api.sfx.pick(); } },
    move(p: Pt) { if (held) { held.x = p.x - ox; held.y = p.y - oy; } },
    up() { const d = held; if (!d) return; held = null; d.held = false; const b = buckets.find(b => Math.abs(d.x - b.x) < bw / 2 && d.y > 600 && d.y < 790);
      if (!b) return; if (b.c !== d.c) { d.bounce = 0.6; b.wob = 0.4; api.sfx.boing(); api.say(L.rainOops, false); return; }
      drops.splice(drops.indexOf(d), 1); b.got++; caught++; api.sfx.splash(); api.burst(b.x, b.y - 40, 12, [C[b.c]]); api.say(NAME_LINE[b.c], false);
      if (caught >= lv.goal) { done = true; api.sfx.cheer(); setTimeout(() => api.win(L.rainWin), 700); } },
    next() { if (done) return null; const d = drops.filter(d => !d.held).sort((a, b) => b.y - a.y)[0]; if (!d) return { type: 'wait', ms: 400 }; const b = buckets.find(b => b.c === d.c)!; const lead = d.vy * 0.25;
      return { type: 'drag', path: [[d.x, d.y + lead], [b.x, (d.y + 720) / 2], [b.x, 700]] }; },
    busy: () => done,
  };
}
