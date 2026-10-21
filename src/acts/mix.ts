// Puddle Mix: drag two paints into the big puddle, stomp, and see the new color. Make the color the critter wants.
import { type Ctx, W } from '../art';
import { puddle, fluff, bubble, boots, GRAY } from '../gfx';
import { L } from '../lines';
import { C, type CName, type Mix, empty, nameOf, colorOf, MIX_LINE, NAME_LINE } from '../paint';
import { type Activity, type Api, type Pt, near } from '../kit';
import { pots, dragPath } from './common';
const RECIPE: Partial<Record<CName, ('red' | 'yellow' | 'blue' | 'white')[]>> = { orange: ['red', 'yellow'], green: ['yellow', 'blue'], purple: ['red', 'blue'], pink: ['red', 'white'], sky: ['blue', 'white'], brown: ['red', 'yellow', 'blue'] };
const WANT: Partial<Record<CName, string>> = { orange: L.wantOrange, green: L.wantGreen, purple: L.wantPurple, pink: L.wantPink, sky: L.wantSky, brown: L.wantBrown };
const LV: CName[] = ['orange', 'green', 'purple', 'pink', 'sky'];
export function mix(api: Api, level: number): Activity {
  const target: CName = level < LV.length ? LV[level] : (['orange', 'green', 'purple', 'pink', 'sky', 'brown'] as CName[])[Math.floor(Math.random() * 6)];
  const need = RECIPE[target]!.length, keys: ('red' | 'yellow' | 'blue' | 'white')[] = level >= 3 || need === 3 || target === 'pink' || target === 'sky' ? ['red', 'yellow', 'blue', 'white'] : ['red', 'yellow', 'blue'];
  const tray = pots(keys, k => C[k]); let m: Mix = empty(), drops: string[] = [], stomp = -1, done = false, drain = -1, critCol = GRAY;
  const PX = W / 2, PY = 560;
  function add(k: 'red' | 'yellow' | 'blue' | 'white') { const key = ({ red: 'r', yellow: 'y', blue: 'b', white: 'w' } as const)[k]; m = { ...m, [key]: m[key] + 1 }; drops.push(k); api.sfx.pop(); api.burst(PX, PY, 10, [C[k]]);
    if (drops.length >= need) { stomp = 0; api.say(L.mixStomp, false); } }
  return {
    intro: level === 0 ? L.mixGo : WANT[target]!,
    update(dt) { if (stomp >= 0) { stomp += dt; if (Math.floor(stomp * 7) !== Math.floor((stomp - dt) * 7)) api.sfx.splash(); if (stomp > 1.1) { stomp = -1; const n = nameOf(m)!;
          if (n === target) { done = true; critCol = C[target]; api.sfx.cheer(); api.say(MIX_LINE[target] || NAME_LINE[target]); api.collect(target); api.burst(PX, 300, 40, [C[target]]); setTimeout(() => api.win(L.mixWin), 1800); }
          else { api.collect(n); api.say(L.mixNew); drain = 0; } } }
      if (drain >= 0) { drain += dt; if (drain > 2.2) { drain = -1; m = empty(); drops = []; api.say(WANT[target]!, false); } } },
    draw(c: Ctx) { const t = api.t();
      fluff(c, PX, 300, 1.25, critCol, t, done, level); if (!done) bubble(c, PX + 95, 200, 34, C[target]);
      const col = drops.length && stomp < 0 ? colorOf(m) : drops.length ? C[drops[drops.length - 1] as CName] : '#cfe9ff';
      puddle(c, PX, PY, 120 * (drain >= 0 ? Math.max(0.3, 1 - drain / 2.2) : 1), 46, col, t, stomp >= 0 ? 4 : 1);
      if (stomp < 0 && drops.length) drops.forEach((d, i) => { c.fillStyle = C[d as CName]; c.beginPath(); c.arc(PX - 20 * (drops.length - 1) + i * 40, PY, 16, 0, 6.28); c.fill(); });
      if (stomp >= 0) boots(c, PX, PY + 10, t);
      tray.draw(c, t); },
    down(p: Pt) { if (done || stomp >= 0) return; if (tray.down(p)) { api.sfx.pick(); return; } if (near(p, PX, PY, 100) && drops.length) { m = empty(); drops = []; api.sfx.splash(); } },
    move(p: Pt) { tray.move(p); },
    up() { const d = tray.up(); if (!d || done || stomp >= 0 || drain >= 0) return; if (Math.abs(d.x - PX) < 140 && Math.abs(d.y - PY) < 90) add(d.k); else api.sfx.boing(); },
    next() { if (done || stomp >= 0 || drain >= 0) return null; const r = RECIPE[target]!.slice(); for (const d of drops) { const i = r.indexOf(d as never); if (i < 0) return { type: 'tap', x: PX, y: PY }; r.splice(i, 1); }
      return { type: 'drag', path: dragPath(tray.at(r[0]), [PX, PY]) }; },
    busy: () => stomp >= 0 || drain >= 0 || done,
  };
}
