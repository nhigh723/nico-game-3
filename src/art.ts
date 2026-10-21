// Everything is drawn in code on canvas: the mascot (on-model to brand/mascot-model-sheet.jpg), the demo hand, blocks, critters, scenes.
export type Ctx = CanvasRenderingContext2D;
export const W = 390, H = 844, INK = '#2b2140';
export const COLORS = ['#ff3b6b', '#ff9f1c', '#ffd60a', '#3ddc4a', '#1fb6ff', '#9b5cff', '#ff5fd2'];
export function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
export function shade(hex: string, k: number) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1); }
export type Pose = 'stand' | 'point' | 'cheer' | 'think' | 'wave';
const SKIN = '#f6c6a0', SKIN_D = '#e9a77f', HAIR = '#a9632f', HAIR_D = '#7d4420', COAT = '#ffffff', COAT_D = '#dfe3ea', SHIRT = '#2aa39a', PANTS = '#4b4b55', SHOE = '#f27a2a';
function limb(c: Ctx, x1: number, y1: number, x2: number, y2: number, w: number, col: string) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function arm(c: Ctx, sx: number, sy: number, a: number, len: number) { // a = angle from straight down (rad), positive = outwards right
  const ex = sx + Math.sin(a) * len, ey = sy + Math.cos(a) * len;
  c.strokeStyle = COAT_D; c.lineWidth = 27; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
  limb(c, sx, sy, ex, ey, 22, COAT); c.fillStyle = COAT_D; c.beginPath(); c.arc(ex, ey, 12, 0, 6.28); c.fill(); // cuff
  c.fillStyle = SKIN; c.beginPath(); c.arc(ex + Math.sin(a) * 9, ey + Math.cos(a) * 9, 10, 0, 6.28); c.fill(); return [ex + Math.sin(a) * 9, ey + Math.cos(a) * 9];
}
function badge(c: Ctx, x: number, y: number, kind: number) {
  if (kind === 0) { c.fillStyle = '#7d4fd6'; rr(c, x - 10, y - 10, 20, 20, 5); c.fill(); c.fillStyle = '#ffcc1f'; c.beginPath(); c.moveTo(x + 2, y - 8); c.lineTo(x - 5, y + 1); c.lineTo(x, y + 1); c.lineTo(x - 2, y + 8); c.lineTo(x + 5, y - 1); c.lineTo(x, y - 1); c.fill(); return; }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 8, 0, 6.28); c.fill(); c.strokeStyle = '#d8dce4'; c.lineWidth = 1.5; c.stroke();
  if (kind === 1) { c.fillStyle = '#4caf2e'; c.beginPath(); c.ellipse(x, y, 3.5, 6, 0.6, 0, 6.28); c.fill(); }
  if (kind === 2) { c.fillStyle = '#2e8fe0'; c.beginPath(); c.moveTo(x, y - 6); c.quadraticCurveTo(x + 5, y + 1, x, y + 5); c.quadraticCurveTo(x - 5, y + 1, x, y - 6); c.fill(); }
  if (kind === 3) { c.fillStyle = '#ff6a1a'; c.beginPath(); c.moveTo(x, y - 6); c.quadraticCurveTo(x + 6, y + 1, x, y + 5); c.quadraticCurveTo(x - 6, y + 1, x, y - 6); c.fill(); c.fillStyle = '#ffc21f'; c.beginPath(); c.arc(x, y + 2, 2.2, 0, 6.28); c.fill(); }
}
/** Full-body the mascot, feet on footY, h px tall. talk = mouth flapping; t = seconds for idle life (blink, bob). */
export function mascot(c: Ctx, x: number, footY: number, h: number, pose: Pose = 'stand', t = 0, talk = false, flip = false) {
  const s = h / 300, bob = pose === 'cheer' ? -Math.abs(Math.sin(t * 7)) * 18 : Math.sin(t * 2.4) * 2;
  c.save(); c.translate(x, footY); c.fillStyle = 'rgba(43,33,64,0.18)'; c.beginPath(); c.ellipse(0, 0, 55 * s, 9 * s, 0, 0, 6.28); c.fill();
  c.scale(flip ? -s : s, s); c.translate(0, bob);
  // legs + shoes
  for (const dx of [-17, 17]) { c.fillStyle = PANTS; rr(c, dx - 14, -95, 28, 78, 8); c.fill(); c.fillStyle = '#3a3a43'; rr(c, dx - 15, -34, 30, 12, 4); c.fill(); c.fillStyle = '#5b5b66'; rr(c, dx - 2 + (dx > 0 ? 6 : -10), -80, 9, 16, 2); c.fill();
    c.fillStyle = SHOE; c.beginPath(); c.ellipse(dx + (dx > 0 ? 6 : -6), -14, 22, 13, 0, Math.PI, 0); c.fill(); c.fillStyle = '#fff'; rr(c, dx - 18 + (dx > 0 ? 6 : -6), -12, 36, 10, 5); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(dx - 4, -24); c.lineTo(dx + 6, -20); c.moveTo(dx - 3, -19); c.lineTo(dx + 7, -16); c.stroke(); }
  // coat body
  c.fillStyle = COAT; c.beginPath(); c.moveTo(-40, -192); c.lineTo(40, -192); c.lineTo(52, -78); c.quadraticCurveTo(0, -70, -52, -78); c.closePath(); c.fill(); c.strokeStyle = COAT_D; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = SHIRT; c.beginPath(); c.moveTo(-17, -192); c.lineTo(17, -192); c.lineTo(13, -98); c.lineTo(-13, -98); c.closePath(); c.fill();
  c.fillStyle = COAT_D; c.beginPath(); c.moveTo(-18, -192); c.lineTo(-4, -165); c.lineTo(-22, -150); c.closePath(); c.moveTo(18, -192); c.lineTo(4, -165); c.lineTo(22, -150); c.closePath(); c.fill();
  c.strokeStyle = COAT_D; c.lineWidth = 2; c.strokeRect(-42, -118, 20, 22); badge(c, 26, -160, 0); badge(c, 28, -136, 1); badge(c, 29, -116, 2); badge(c, 30, -96, 3);
  // arms
  const L = { stand: 0.12, point: 0.15, cheer: 2.6, think: 0.15, wave: 0.15 }[pose], R = { stand: 0.12, point: 2.3, cheer: 2.6, think: 2.6, wave: 2.4 + Math.sin(t * 10) * 0.35 }[pose];
  arm(c, -36, -180, -L, 62); const hr = arm(c, 36, -180, pose === 'think' ? -2.5 : R, pose === 'think' ? 42 : 62);
  if (pose === 'point') { c.fillStyle = SKIN; c.save(); c.translate(hr[0], hr[1]); c.rotate(-0.8); rr(c, -3, -20, 7, 18, 3.5); c.fill(); c.restore(); }
  // head
  c.translate(0, -238); c.fillStyle = SKIN; c.fillRect(-9, 30, 18, 20);
  c.beginPath(); c.arc(-44, 6, 10, 0, 6.28); c.arc(44, 6, 10, 0, 6.28); c.fill(); c.fillStyle = SKIN_D; c.beginPath(); c.arc(-44, 6, 5, 0, 6.28); c.arc(44, 6, 5, 0, 6.28); c.fill();
  c.fillStyle = SKIN; c.beginPath(); c.ellipse(0, 4, 44, 46, 0, 0, 6.28); c.fill();
  // hair: tousled cap with fringe spikes
  c.fillStyle = HAIR; c.beginPath(); c.moveTo(-46, 4); c.quadraticCurveTo(-52, -48, -6, -54); c.quadraticCurveTo(46, -56, 47, 2);
  c.lineTo(38, -12); c.lineTo(30, -6); c.lineTo(22, -22); c.lineTo(10, -12); c.lineTo(0, -26); c.lineTo(-10, -12); c.lineTo(-22, -22); c.lineTo(-30, -8); c.lineTo(-38, -14); c.closePath(); c.fill();
  c.strokeStyle = HAIR_D; c.lineWidth = 2; c.beginPath(); c.moveTo(-20, -44); c.quadraticCurveTo(-8, -38, -2, -46); c.moveTo(8, -48); c.quadraticCurveTo(18, -40, 26, -46); c.stroke();
  // goggles on forehead
  c.strokeStyle = '#7d8590'; c.lineWidth = 6; c.beginPath(); c.moveTo(-46, -20); c.quadraticCurveTo(0, -48, 46, -20); c.stroke();
  for (const gx of [-17, 17]) { c.fillStyle = '#b8c2cc'; c.beginPath(); c.ellipse(gx, -34, 17, 13, gx > 0 ? 0.15 : -0.15, 0, 6.28); c.fill(); c.fillStyle = 'rgba(214,236,250,0.9)'; c.beginPath(); c.ellipse(gx, -34, 12, 9, 0, 0, 6.28); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(gx - 4, -37, 3, 0, 6.28); c.fill(); }
  // face
  const blink = (t % 3.7) < 0.12;
  for (const ex of [-16, 16]) { if (blink) { c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 8, 6); c.lineTo(ex + 8, 6); c.stroke(); continue; }
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, 5, 10, 11, 0, 0, 6.28); c.fill(); c.fillStyle = '#3d8fd6'; c.beginPath(); c.arc(ex + 1, 6, 7, 0, 6.28); c.fill();
    c.fillStyle = '#16233a'; c.beginPath(); c.arc(ex + 1, 6, 3.6, 0, 6.28); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 3.5, 3, 2.2, 0, 6.28); c.fill();
    c.strokeStyle = HAIR_D; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(ex - 8, -10); c.quadraticCurveTo(ex, pose === 'think' && ex > 0 ? -16 : -13, ex + 8, -10); c.stroke(); }
  c.fillStyle = 'rgba(255,120,120,0.35)'; c.beginPath(); c.arc(-28, 20, 7, 0, 6.28); c.arc(28, 20, 7, 0, 6.28); c.fill();
  c.fillStyle = SKIN_D; c.beginPath(); c.ellipse(0, 16, 4, 3, 0, 0, 6.28); c.fill();
  const open = talk ? 3 + Math.abs(Math.sin(t * 18)) * 9 : pose === 'cheer' ? 10 : 0;
  c.fillStyle = '#8a2a35'; c.beginPath(); c.moveTo(-13, 26); c.quadraticCurveTo(0, 36 + open, 13, 26); c.quadraticCurveTo(0, 30 + open * 0.2, -13, 26); c.fill();
  if (open > 2) { c.fillStyle = '#fff'; c.fillRect(-8, 26.5, 16, 3); }
  c.restore();
}
/** Head-and-shoulders bust in a ring (used on the hub). */
export function mascotBust(c: Ctx, x: number, y: number, r: number, t: number, talk = false) {
  c.save(); c.beginPath(); c.arc(x, y, r, 0, 6.28); c.fillStyle = '#e9f8ff'; c.fill(); c.clip(); mascot(c, x, y + r * 3.1, r * 3.6, 'stand', t, talk); c.restore();
  c.beginPath(); c.arc(x, y, r, 0, 6.28); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke();
}
/** The demo hand: a friendly cartoon hand with the index finger out; the fingertip sits at (x,y). press 0..1 squashes it and shows a ripple. */
export function hand(c: Ctx, x: number, y: number, press = 0, alpha = 1) {
  c.save(); c.globalAlpha = alpha; if (press > 0) { c.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - press)) + ')'; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 12 + press * 30, 0, 6.28); c.stroke(); }
  c.translate(x, y); c.rotate(-0.35); c.scale(1 - press * 0.12, 1 - press * 0.12);
  c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 10; c.shadowOffsetY = 6;
  c.fillStyle = '#fff1e3'; c.strokeStyle = INK; c.lineWidth = 3.5; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-7, 2); c.lineTo(-7, 40); c.lineTo(-24, 34); c.quadraticCurveTo(-34, 32, -30, 44); c.lineTo(-12, 70); c.quadraticCurveTo(-2, 84, 18, 84); c.lineTo(28, 84);
  c.quadraticCurveTo(44, 82, 44, 62); c.lineTo(44, 42); c.quadraticCurveTo(44, 34, 36, 34); c.quadraticCurveTo(30, 34, 30, 40); c.quadraticCurveTo(30, 30, 22, 30); c.quadraticCurveTo(14, 30, 14, 38);
  c.quadraticCurveTo(14, 28, 7, 28); c.lineTo(7, 2); c.quadraticCurveTo(7, -7, 0, -7); c.quadraticCurveTo(-7, -7, -7, 2); c.closePath(); c.fill(); c.shadowColor = 'transparent'; c.stroke();
  c.lineWidth = 2.5; c.beginPath(); c.moveTo(14, 38); c.lineTo(14, 48); c.moveTo(30, 40); c.lineTo(30, 50); c.stroke();
  c.fillStyle = '#ffd9e2'; c.beginPath(); c.ellipse(0, 0, 4, 3, 0, 0, 6.28); c.fill(); c.restore();
}
// ---- blocks ----
export type Shape = 'box' | 'tri' | 'arch' | 'half' | 'circle' | 'star' | 'win' | 'door';
export function shapePath(c: Ctx, sh: Shape, x: number, y: number, w: number, h: number) {
  c.beginPath();
  if (sh === 'box' || sh === 'win' || sh === 'door') { rr(c, x, y, w, h, Math.min(8, w / 5, h / 5)); return; }
  if (sh === 'tri') { c.moveTo(x, y + h); c.lineTo(x + w / 2, y); c.lineTo(x + w, y + h); c.closePath(); return; }
  if (sh === 'half') { c.moveTo(x, y + h); c.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, 0); c.closePath(); return; }
  if (sh === 'circle') { c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.28); return; }
  if (sh === 'arch') { const r = Math.min(w * 0.28, h * 0.6); c.moveTo(x, y + h); c.lineTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x + w / 2 + r, y + h); c.arc(x + w / 2, y + h, r, 0, Math.PI, true); c.closePath(); return; }
  if (sh === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.45 : 1; c.lineTo(x + w / 2 + Math.cos(a) * w / 2 * q, y + h * 0.55 + Math.sin(a) * h / 2 * q); } c.closePath(); }
}
export function block(c: Ctx, sh: Shape, x: number, y: number, w: number, h: number, col: string, rot = 0, lift = 0) {
  c.save(); if (rot) { c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.translate(-x - w / 2, -y - h / 2); }
  if (lift) { c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 14; c.shadowOffsetY = 10; }
  shapePath(c, sh, x, y, w, h); c.fillStyle = col; c.fill(); c.shadowColor = 'transparent';
  c.save(); c.clip(); c.fillStyle = shade(col, 0.35); c.fillRect(x, y, w, Math.max(5, h * 0.18)); c.fillStyle = shade(col, -0.18); c.fillRect(x, y + h * 0.84, w, h * 0.16); c.restore();
  if (sh === 'win') { c.fillStyle = '#bfefff'; rr(c, x + w * 0.2, y + h * 0.2, w * 0.6, h * 0.6, 4); c.fill(); c.fillStyle = col; c.fillRect(x + w / 2 - 2, y + h * 0.2, 4, h * 0.6); c.fillRect(x + w * 0.2, y + h / 2 - 2, w * 0.6, 4); }
  if (sh === 'door') { c.fillStyle = shade(col, -0.35); rr(c, x + w * 0.22, y + h * 0.18, w * 0.56, h * 0.82, w * 0.25); c.fill(); c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(x + w * 0.66, y + h * 0.6, 3, 0, 6.28); c.fill(); }
  shapePath(c, sh, x, y, w, h); c.lineWidth = 3; c.strokeStyle = shade(col, -0.4); c.lineJoin = 'round'; c.stroke(); c.restore();
}
export function outline(c: Ctx, sh: Shape, x: number, y: number, w: number, h: number, t: number, col = '#ffffff') {
  c.save(); shapePath(c, sh, x, y, w, h); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill(); c.setLineDash([12, 8]); c.lineDashOffset = -t * 30; c.lineWidth = 5; c.strokeStyle = col; c.stroke(); c.restore();
}
// ---- critters (original designs) ----
export function bunny(c: Ctx, x: number, y: number, s: number, t: number, flip = false, happy = false) {
  c.save(); c.translate(x, y); c.scale(flip ? -s : s, s); const hop = Math.sin(t * 3) * 1.5;
  c.fillStyle = '#fff'; c.strokeStyle = '#c9b8d6'; c.lineWidth = 2;
  for (const ex of [-7, 7]) { c.save(); c.translate(ex, -40 + hop); c.rotate(ex * 0.03); c.beginPath(); c.ellipse(0, -14, 6, 16, 0, 0, 6.28); c.fill(); c.stroke(); c.fillStyle = '#ffb3cf'; c.beginPath(); c.ellipse(0, -14, 3, 11, 0, 0, 6.28); c.fill(); c.restore(); c.fillStyle = '#fff'; }
  c.beginPath(); c.ellipse(0, -12, 20, 15, 0, 0, 6.28); c.fill(); c.stroke(); c.beginPath(); c.arc(8, -32 + hop, 15, 0, 6.28); c.fill(); c.stroke();
  c.beginPath(); c.arc(-20, -14, 6, 0, 6.28); c.fill(); c.fillStyle = INK;
  if (happy) { c.lineWidth = 2.5; c.strokeStyle = INK; c.beginPath(); c.arc(14, -33 + hop, 3, Math.PI, 0); c.stroke(); } else { c.beginPath(); c.arc(14, -34 + hop, 3, 0, 6.28); c.fill(); }
  c.fillStyle = '#ff7aa8'; c.beginPath(); c.arc(22, -29 + hop, 3, 0, 6.28); c.fill(); c.restore();
}
export function carrot(c: Ctx, x: number, y: number, s = 1) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#ff8a1c'; c.beginPath(); c.moveTo(-9, -28); c.lineTo(9, -28); c.lineTo(0, 4); c.closePath(); c.fill(); c.fillStyle = '#3ddc4a'; c.beginPath(); c.ellipse(-5, -34, 4, 9, -0.4, 0, 6.28); c.ellipse(5, -34, 4, 9, 0.4, 0, 6.28); c.fill(); c.restore(); }
export function critter(c: Ctx, kind: number, x: number, y: number, s: number, t: number) {
  if (kind === 0) return bunny(c, x, y, s, t);
  const col = ['#fff', '#ffd60a', '#ff9f1c', '#9b5cff', '#3ddc4a'][kind % 5]; c.save(); c.translate(x, y + Math.abs(Math.sin(t * 5)) * -4 * s); c.scale(s, s);
  c.fillStyle = col; c.strokeStyle = shade(col, -0.35); c.lineWidth = 2.5;
  if (kind === 1) { c.beginPath(); c.ellipse(0, -14, 16, 13, 0, 0, 6.28); c.fill(); c.stroke(); c.beginPath(); c.arc(10, -30, 10, 0, 6.28); c.fill(); c.stroke(); c.fillStyle = '#ff8a1c'; c.beginPath(); c.moveTo(18, -31); c.lineTo(27, -28); c.lineTo(18, -25); c.fill(); } // duckling
  else if (kind === 2) { c.beginPath(); c.ellipse(0, -14, 18, 13, 0, 0, 6.28); c.fill(); c.stroke(); c.beginPath(); c.arc(12, -28, 12, 0, 6.28); c.fill(); c.stroke(); c.beginPath(); c.moveTo(4, -36); c.lineTo(7, -46); c.lineTo(12, -38); c.moveTo(14, -38); c.lineTo(20, -46); c.lineTo(21, -35); c.fill(); } // kitten
  else if (kind === 3) { c.beginPath(); c.arc(0, -16, 16, 0, 6.28); c.fill(); c.stroke(); c.fillStyle = shade(col, 0.4); c.beginPath(); c.arc(-6, -22, 4, 0, 6.28); c.fill(); } // bouncy blob
  else { c.beginPath(); c.ellipse(0, -10, 20, 10, 0, 0, 6.28); c.fill(); c.stroke(); c.beginPath(); c.arc(16, -14, 7, 0, 6.28); c.fill(); c.stroke(); c.fillStyle = shade(col, -0.2); c.beginPath(); c.arc(-2, -14, 9, Math.PI, 0); c.fill(); } // turtle
  c.fillStyle = INK; c.beginPath(); c.arc(kind === 3 ? 5 : kind === 4 ? 18 : 14, kind === 3 ? -18 : kind === 4 ? -15 : -30, 2.5, 0, 6.28); c.fill(); c.restore();
}
// ---- scenes ----
const cloud = (c: Ctx, x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, r, 0, 6.28); c.arc(x + r, y + r * 0.2, r * 0.8, 0, 6.28); c.arc(x - r, y + r * 0.25, r * 0.7, 0, 6.28); c.fill(); };
export function sky(c: Ctx, top: string, bot: string, t: number, groundY: number, g1 = '#5fd83a', g2 = '#3fbf2c', sun = true) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (sun) { c.fillStyle = '#fff59a'; c.beginPath(); c.arc(320, 120, 46, 0, 6.28); c.fill(); c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(320, 120, 34, 0, 6.28); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.95)'; for (let i = 0; i < 3; i++) cloud(c, ((i * 160 + t * 8) % (W + 160)) - 60, 90 + i * 55, 22 + i * 4);
  c.fillStyle = g1; c.beginPath(); c.ellipse(80, groundY + 10, 260, 50, 0, 0, 6.28); c.fill(); c.fillStyle = g2; c.fillRect(0, groundY, W, H - groundY);
  c.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 12; i++) c.fillRect((i * 67) % W, groundY + 20 + (i % 4) * 30, 18, 6);
}
export function confettiDraw(c: Ctx, ps: { x: number; y: number; vx: number; vy: number; r: number; col: string; life: number }[]) {
  for (const p of ps) { c.save(); c.globalAlpha = Math.min(1, p.life); c.translate(p.x, p.y); c.rotate(p.x * 0.05); c.fillStyle = p.col; c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); c.restore(); }
}
