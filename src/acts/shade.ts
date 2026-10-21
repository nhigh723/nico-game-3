// Light & Dark: add white or black drops until the bucket matches the critter's swatch. Shades, more/less, comparing.
import { type Ctx, W } from '../art';
import { puddle, fluff, bubble, GRAY } from '../gfx';
import { L } from '../lines';
import { C, type CName, shade as sh } from '../paint';
import { type Activity, type Api, type Pt } from '../kit';
import { pots, dragPath } from './common';
const LV: [CName, number][] = [['orange', 1], ['blue', -1], ['green', 2], ['purple', -2], ['red', 3]];
export function shadeAct(api: Api, level: number): Activity {
  const [base, goal] = level < LV.length ? LV[level] : [(['red', 'orange', 'green', 'blue', 'purple', 'yellow'] as CName[])[Math.floor(Math.random() * 6)], [1, 2, -1, -2][Math.floor(Math.random() * 4)]];
  const tray = pots(['white', 'black'] as const, k => C[k]); let cur = 0, done = false, wob = 0;
  const target = sh(C[base], goal), BX = W / 2, BY = 560;
  return {
    intro: L.shadeGo,
    update(dt) { if (wob > 0) wob -= dt; },
    draw(c: Ctx) { const t = api.t(); fluff(c, W / 2, 300, 1.2, done ? target : GRAY, t, done, level + 1); bubble(c, W / 2 + 95, 200, 36, target);
      puddle(c, BX, BY, 110, 44, sh(C[base], cur), t, wob > 0 ? 5 : 1);
      for (let i = -3; i <= 3; i++) { const x = W / 2 + i * 44, y = 660; c.fillStyle = sh(C[base], i); c.beginPath(); c.arc(x, y, i === cur ? 15 : 10, 0, 6.28); c.fill(); if (i === cur) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke(); } }
      tray.draw(c, t); },
    down(p: Pt) { if (done) return; if (tray.down(p)) api.sfx.pick(); },
    move(p: Pt) { tray.move(p); },
    up() { const d = tray.up(); if (!d || done) return; if (Math.abs(d.x - BX) > 140 || Math.abs(d.y - BY) > 90) { api.sfx.boing(); return; }
      cur = Math.max(-4, Math.min(4, cur + (d.k === 'white' ? 1 : -1))); wob = 0.5; api.sfx.splash(); api.burst(BX, BY, 8, [C[d.k]]);
      if (cur === goal) { done = true; api.sfx.cheer(); api.collect(base); setTimeout(() => api.win(L.shadeWin), 900); }
      else if (cur > goal && d.k === 'white') api.say(L.tooLight); else if (cur < goal && d.k === 'black') api.say(L.tooDark); else api.say(d.k === 'white' ? L.lighter : L.darker, false); },
    next() { if (done) return null; const k = cur < goal ? 'white' : 'black'; return { type: 'drag', path: dragPath(tray.at(k), [BX, BY]) }; },
    busy: () => done,
  };
}
