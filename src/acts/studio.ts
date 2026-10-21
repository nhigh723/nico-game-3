// Paint Studio: free painting with brushes and shape stamps, using the base colors plus every color the child has mixed.
// Tap the frame to hang the painting in Color Town. Creativity, shapes, fine motor.
import { type Ctx, W, rr, block, type Shape } from '../art';
import { L } from '../lines';
import { C, type CName } from '../paint';
import { type Activity, type Api, type Pt, near, inBox } from '../kit';
const AX = 20, AY = 150, AW = W - 40, AH = 440;
export const TOOLS: Record<string, { kind: 'brush' | 'stamp'; size?: number; shape?: Shape }> = {
  brush: { kind: 'brush', size: 10 }, big: { kind: 'brush', size: 26 }, dots: { kind: 'brush', size: 8 }, rainbow: { kind: 'brush', size: 14 },
  star: { kind: 'stamp', shape: 'star' }, circle: { kind: 'stamp', shape: 'circle' }, tri: { kind: 'stamp', shape: 'tri' }, heart: { kind: 'stamp', shape: 'half' },
};
export function studio(api: Api): Activity {
  const art = document.createElement('canvas'); art.width = AW * 2; art.height = AH * 2; const g = art.getContext('2d')!; g.scale(2, 2); g.fillStyle = '#fff'; g.fillRect(0, 0, AW, AH);
  const cols = (): CName[] => [...new Set<CName>(['red', 'yellow', 'blue', 'green', ...api.collection()])].slice(0, 7);
  let col: CName = 'red', tool = 'brush', painting = false, last: Pt | null = null, strokes = 0, saved = -1, hue = 0;
  const tools = () => api.unlocked().filter(k => TOOLS[k]);
  const colPos = (i: number) => ({ x: 34 + i * 54, y: 690 }), toolPos = (i: number) => ({ x: 34 + i * 64, y: 780 });
  function dab(p: Pt) { const T = TOOLS[tool], x = p.x - AX, y = p.y - AY; if (T.kind === 'stamp') { block(g, T.shape!, x - 28, y - 28, 56, 56, C[col]); api.sfx.pop(); return; }
    hue += 6; const c2 = tool === 'rainbow' ? `hsl(${hue % 360},95%,58%)` : C[col]; g.strokeStyle = c2; g.fillStyle = c2; g.lineCap = 'round'; g.lineWidth = T.size!;
    if (tool === 'dots') { g.beginPath(); g.arc(x, y, 6 + Math.random() * 4, 0, 6.28); g.fill(); return; }
    g.beginPath(); g.moveTo(last ? last.x - AX : x, last ? last.y - AY : y); g.lineTo(x, y); g.stroke(); }
  return {
    intro: L.studioGo,
    update(dt) { if (saved >= 0) { saved += dt; if (saved > 1) { saved = -1; g.fillStyle = '#fff'; g.fillRect(0, 0, AW, AH); strokes = 0; } } },
    draw(c: Ctx) { const t = api.t(); c.save(); if (saved >= 0) { const k = saved; c.translate(W / 2, AY + AH / 2); c.scale(1 - k * 0.8, 1 - k * 0.8); c.rotate(k * 0.3); c.translate(-W / 2, -AY - AH / 2); }
      c.fillStyle = '#c98a4b'; rr(c, AX - 10, AY - 10, AW + 20, AH + 20, 14); c.fill(); c.drawImage(art, AX, AY, AW, AH); c.restore();
      const can = strokes >= 2 && saved < 0, pul = can ? 1 + Math.sin(t * 5) * 0.07 : 1; c.save(); c.translate(W - 50, 100); c.scale(pul, pul); c.globalAlpha = can ? 1 : 0.4; c.fillStyle = '#ffd60a'; rr(c, -30, -26, 60, 52, 8); c.fill(); c.fillStyle = '#fff'; rr(c, -20, -16, 40, 32, 4); c.fill(); c.fillStyle = '#ff2d55'; c.beginPath(); c.arc(-6, 2, 6, 0, 6.28); c.fill(); c.fillStyle = '#2ecc40'; c.beginPath(); c.moveTo(0, 12); c.lineTo(10, -4); c.lineTo(18, 12); c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.6)'; rr(c, 8, 650, W - 16, 180, 26); c.fill();
      cols().forEach((k, i) => { const p = colPos(i); c.fillStyle = C[k]; c.beginPath(); c.arc(p.x, p.y, k === col ? 23 : 19, 0, 6.28); c.fill(); if (k === col) { c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke(); } });
      tools().forEach((k, i) => { const p = toolPos(i), T = TOOLS[k], on = k === tool; c.fillStyle = on ? '#fff' : 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(p.x, p.y, 26, 0, 6.28); c.fill();
        if (T.kind === 'stamp') block(c, T.shape!, p.x - 14, p.y - 14, 28, 28, C[col]); else if (k === 'rainbow') { ['#ff2d55', '#ffd60a', '#2ecc40', '#1e90ff'].forEach((cc, j) => { c.strokeStyle = cc; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y + 8, 16 - j * 4, Math.PI, 0); c.stroke(); }); }
        else if (k === 'dots') { c.fillStyle = C[col]; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(p.x - 8 + (j % 2) * 16, p.y - 8 + Math.floor(j / 2) * 16, 4, 0, 6.28); c.fill(); } }
        else { c.fillStyle = C[col]; c.beginPath(); c.arc(p.x, p.y, (T.size! / 2) + 2, 0, 6.28); c.fill(); } }); },
    down(p: Pt) { if (saved >= 0) return;
      if (near(p, W - 50, 100, 40)) { if (strokes >= 2) { api.saveArt(art.toDataURL('image/jpeg', 0.6)); saved = 0; api.sfx.unlock(); } else api.say(L.studioGo, false); return; }
      const cs = cols(); for (let i = 0; i < cs.length; i++) { const q = colPos(i); if (near(p, q.x, q.y, 26)) { col = cs[i]; api.sfx.pop(); return; } }
      const ts = tools(); for (let i = 0; i < ts.length; i++) { const q = toolPos(i); if (near(p, q.x, q.y, 30)) { tool = ts[i]; api.sfx.tap(); return; } }
      if (inBox(p, AX, AY, AW, AH)) { painting = true; last = null; dab(p); last = p; strokes++; if (TOOLS[tool].kind === 'stamp') api.say(L.studioStamp, false); } },
    move(p: Pt) { if (painting && inBox(p, AX, AY, AW, AH) && TOOLS[tool].kind === 'brush') { dab(p); last = p; } },
    up() { painting = false; last = null; },
    next() { if (saved >= 0) return null; if (strokes >= 3) return { type: 'tap', x: W - 50, y: 100 }; const y = AY + 80 + strokes * 120; return { type: 'drag', path: [[AX + 60, y], [W / 2, y + 60], [AX + AW - 60, y]] }; },
    busy: () => saved >= 0,
  };
}
