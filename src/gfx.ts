// Puddle Painter drawings (original): puddles, paint pots, drops, rain boots, fluffy color critters, easel, butterfly.
import { type Ctx, INK, shade as sh } from './art';
export function puddle(c: Ctx, x: number, y: number, rx: number, ry: number, col: string, t: number, wob = 1) {
  c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(0, ry * 0.25, rx * 1.04, ry, 0, 0, 6.28); c.fill();
  c.fillStyle = col; c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.283, r = 1 + Math.sin(a * 5 + t * 2) * 0.04 * wob; c.lineTo(Math.cos(a) * rx * r, Math.sin(a) * ry * r); } c.fill();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(-rx * 0.35, -ry * 0.35, rx * 0.25, ry * 0.14, -0.2, 0, 6.28); c.fill(); c.restore();
}
export function pot(c: Ctx, x: number, y: number, col: string, s = 1, lift = 0) {
  c.save(); c.translate(x, y - lift); c.scale(s, s); if (lift) { c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 12; c.shadowOffsetY = 8; }
  c.fillStyle = '#e8ecf4'; c.beginPath(); c.moveTo(-26, -14); c.lineTo(26, -14); c.lineTo(22, 26); c.quadraticCurveTo(0, 32, -22, 26); c.closePath(); c.fill(); c.shadowColor = 'transparent';
  c.strokeStyle = '#b9c0cf'; c.lineWidth = 3; c.stroke(); c.fillStyle = col; c.beginPath(); c.ellipse(0, -14, 26, 9, 0, 0, 6.28); c.fill(); c.strokeStyle = sh(col.length === 7 ? col : '#888888', -0.3); c.lineWidth = 2.5; c.stroke();
  c.beginPath(); c.moveTo(10, -10); c.quadraticCurveTo(14, 4, 10, 10); c.quadraticCurveTo(6, 4, 10, -10); c.fill(); c.restore();
}
export function drop(c: Ctx, x: number, y: number, col: string, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath(); c.moveTo(0, -22); c.bezierCurveTo(10, -8, 16, 2, 16, 8); c.arc(0, 8, 16, 0, Math.PI); c.bezierCurveTo(-16, 2, -10, -8, 0, -22); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 2; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(-5, 4, 4, 6, 0.3, 0, 6.28); c.fill(); c.restore();
}
export function boots(c: Ctx, x: number, y: number, t: number, col = '#ffd60a') {
  for (const [dx, ph] of [[-22, 0], [22, Math.PI]] as [number, number][]) { const up = Math.max(0, Math.sin(t * 14 + ph)) * 26; c.save(); c.translate(x + dx, y - up);
    c.fillStyle = col; c.beginPath(); c.moveTo(-12, -46); c.lineTo(10, -46); c.lineTo(10, -8); c.lineTo(22, -6); c.quadraticCurveTo(26, 6, 18, 8); c.lineTo(-12, 8); c.closePath(); c.fill(); c.strokeStyle = sh(col, -0.35); c.lineWidth = 3; c.stroke();
    c.fillStyle = sh(col, -0.25); c.fillRect(-12, 2, 34, 6); c.restore(); }
}
/** Fluffy round critter, gray until painted. mood 0 sad-ish, 1 happy (bounces). */
export function fluff(c: Ctx, x: number, y: number, s: number, col: string, t: number, happy = false, kind = 0) {
  c.save(); c.translate(x, y + (happy ? -Math.abs(Math.sin(t * 7)) * 16 : Math.sin(t * 2) * 2)); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.14)'; c.beginPath(); c.ellipse(0, 46, 40, 8, 0, 0, 6.28); c.fill();
  c.fillStyle = col; c.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20 * 6.283, r = 44 + (i % 2 ? 5 : 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.92); } c.fill(); c.strokeStyle = sh(col.length === 7 ? col : '#999999', -0.3); c.lineWidth = 3; c.stroke();
  if (kind % 3 === 0) { c.beginPath(); c.moveTo(-30, -30); c.lineTo(-22, -58); c.lineTo(-10, -38); c.moveTo(30, -30); c.lineTo(22, -58); c.lineTo(10, -38); c.fill(); }
  else if (kind % 3 === 1) { c.beginPath(); c.arc(-24, -40, 12, 0, 6.28); c.arc(24, -40, 12, 0, 6.28); c.fill(); }
  else { c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -40); c.quadraticCurveTo(6, -62, 16, -60); c.stroke(); c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(16, -60, 6, 0, 6.28); c.fill(); }
  for (const ex of [-14, 14]) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, -6, 10, 12, 0, 0, 6.28); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(ex + 1, -4, 5.5, 0, 6.28); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 3, -7, 2, 0, 6.28); c.fill(); }
  c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); if (happy) c.arc(0, 12, 10, 0.2, Math.PI - 0.2); else { c.moveTo(-7, 18); c.quadraticCurveTo(0, 14, 7, 18); } c.stroke();
  c.fillStyle = 'rgba(255,110,150,0.45)'; c.beginPath(); c.arc(-26, 10, 6, 0, 6.28); c.arc(26, 10, 6, 0, 6.28); c.fill(); c.restore();
}
export function bubble(c: Ctx, x: number, y: number, r: number, col: string) {
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r, 0, 6.28); c.fill(); c.beginPath(); c.arc(x - r * 0.8, y + r * 0.9, r * 0.18, 0, 6.28); c.arc(x - r * 1.1, y + r * 1.25, r * 0.1, 0, 6.28); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x, y, r * 0.68, 0, 6.28); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 3; c.stroke();
}
export const GRAY = '#b8b8c4';
