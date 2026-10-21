// Sounds are synthesized with Web Audio (no audio files, no licenses). the mascot's voice: cloned clips listed in
// public/voice/manifest.json (id = lineId(text)), with the device voice as fallback for any line without a clip.
import { lineId } from './voice';
let ctx: AudioContext | null = null, master: GainNode | null = null;
export let muted = false;
export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return; }
  try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); void loadVoice(); } catch { ctx = null; }
}
function tone(f: number, d: number, type: OscillatorType = 'sine', v = 0.3, at = 0, f2?: number) {
  if (!ctx || !master || muted) return; const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02);
}
function noise(d: number, v = 0.2, at = 0, hp = 400) {
  if (!ctx || !master || muted) return; const t = ctx.currentTime + at, n = ctx.sampleRate * d, b = ctx.createBuffer(1, n, ctx.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'highpass'; f.frequency.value = hp; g.gain.value = v;
  s.buffer = b; s.connect(f); f.connect(g); g.connect(master); s.start(t);
}
export const sfx = {
  tap: () => tone(660, 0.08, 'triangle', 0.25),
  pick: () => tone(520, 0.1, 'sine', 0.25, 0, 780),
  snap: () => { tone(880, 0.07, 'square', 0.12); tone(1320, 0.12, 'triangle', 0.2, 0.05); },
  thud: () => { tone(140, 0.18, 'sine', 0.45, 0, 60); noise(0.08, 0.1, 0, 200); },
  boing: () => tone(220, 0.35, 'sine', 0.3, 0, 520),
  whoosh: () => noise(0.6, 0.25, 0, 900),
  crash: () => { for (let i = 0; i < 5; i++) { tone(180 - i * 20, 0.2, 'triangle', 0.25, i * 0.07, 70); noise(0.1, 0.12, i * 0.07, 300); } },
  bell: () => { tone(1568, 1.2, 'sine', 0.3); tone(2093, 1, 'sine', 0.15, 0.02); },
  hop: () => tone(400, 0.12, 'sine', 0.2, 0, 900),
  splash: () => { noise(0.5, 0.3, 0, 600); tone(300, 0.3, 'sine', 0.15, 0, 120); },
  roll: () => tone(110, 0.15, 'sawtooth', 0.05),
  pop: () => tone(900, 0.06, 'sine', 0.3, 0, 300),
  cheer: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.25, i * 0.09)); tone(1047, 0.6, 'sine', 0.2, 0.36); },
  unlock: () => { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, 0.3, 'sine', 0.2, i * 0.07)); },
  wrong: () => tone(300, 0.2, 'triangle', 0.15, 0, 240),
};
// ---- voice ----
let manifest: Record<string, string> | null = null; const clips = new Map<string, AudioBuffer>(); let cur: AudioBufferSourceNode | null = null;
export const missing = new Set<string>(); export let lastLine = '', speaking = 0;
async function loadVoice() {
  try { manifest = await (await fetch('./voice/manifest.json')).json(); } catch { manifest = {}; }
}
async function clip(id: string) {
  if (clips.has(id)) return clips.get(id)!; const f = manifest && manifest[id]; if (!f || !ctx) return null;
  try { const b = await ctx.decodeAudioData(await (await fetch('./voice/' + f)).arrayBuffer()); clips.set(id, b); return b; } catch { return null; }
}
let lastAt = 0;
/** the mascot speaks. force=false lines are skipped if he spoke in the last 2.5 s (keeps chatter down). */
export async function say(text: string, force = true) {
  const now = performance.now(); if (!force && now - lastAt < 2500) return; lastAt = now; lastLine = text;
  if (muted) return; const id = lineId(text);
  try { cur?.stop(); } catch { /* */ } try { speechSynthesis.cancel(); } catch { /* */ }
  if (!manifest && ctx) await loadVoice();
  const b = await clip(id);
  if (b && ctx && master) { const s = ctx.createBufferSource(); s.buffer = b; s.connect(master); s.start(); cur = s; speaking = now + b.duration * 1000; return; }
  missing.add(text);
  try { const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 1.25; speechSynthesis.speak(u); speaking = now + text.length * 70; } catch { /* no voice */ }
}
export const isSpeaking = () => performance.now() < speaking;
export function setMuted(m: boolean) { muted = m; if (m) { try { cur?.stop(); speechSynthesis.cancel(); } catch { /* */ } } }
