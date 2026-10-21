// Phone-size screenshots (1170x2532) of the title, hub, each activity mid-play and My Town.
import { chromium } from 'playwright-core';
const URL = process.env.URL || 'http://localhost:4181/', OUT = process.env.OUT || 'screenshots';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
const S = (f, a) => p.evaluate(f, a), wait = ms => p.waitForTimeout(ms);
async function run(a) { if (!a) return; if (a.type === 'wait') return wait(a.ms); if (a.type === 'tap') { const q = await S(([x, y]) => window.__snap.toScreen(x, y), [a.x, a.y]); await p.mouse.click(q.x, q.y); return wait(400); }
  const pts = []; for (const [x, y] of a.path) pts.push(await S(([x, y]) => window.__snap.toScreen(x, y), [x, y]));
  await p.mouse.move(pts[0].x, pts[0].y); await p.mouse.down(); for (const q of pts.slice(1)) await p.mouse.move(q.x, q.y, { steps: 12 }); await p.mouse.up(); await wait(500); }
const step = async n => { for (let i = 0; i < n; i++) { await wait(300); await run(await S(() => window.__snap.busy() ? null : window.__snap.next())); } };
await p.goto(URL); await wait(1500); await p.screenshot({ path: `${OUT}/1-title.png` });
await S(() => window.__snap.go('hub')); await wait(800); await p.screenshot({ path: `${OUT}/2-hub.png` });
const acts = [['3-puddle-mix', 0, 1, 1], ['4-light-and-dark', 1, 3, 1], ['5-rainbow-road', 2, 2, 3], ['6-mirror-butterfly', 3, 3, 3], ['7-color-sort-rain', 4, 1, 8], ['8-paint-studio', 5, 0, 3]];
for (const [n, a, l, k] of acts) { await S(([a, l]) => window.__snap.start(a, l), [a, l]); await wait(2500); await step(k); await wait(300); await p.screenshot({ path: `${OUT}/${n}.png` }); }
await p.goto(URL); await wait(1200);
await S(() => { const s = window.__snap.save(); const cv = document.createElement('canvas'); cv.width = 300; cv.height = 300; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 300, 300);
  const cols = ['#ff3b5c', '#ffd400', '#2f8cff', '#ff9a1f', '#2fd04a', '#a24bff']; const art = [];
  for (let n = 0; n < 4; n++) { g.fillStyle = '#fff'; g.fillRect(0, 0, 300, 300); for (let i = 0; i < 6; i++) { g.strokeStyle = cols[(i + n) % 6]; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.arc(150, 170, 40 + i * 22, Math.PI, 0); g.stroke(); } g.fillStyle = cols[n]; g.beginPath(); g.arc(60, 60, 34, 0, 7); g.fill(); art.push(cv.toDataURL('image/jpeg', 0.8)); }
  window.__snap.setSave({ ...s, wins: 9, art, col: ['orange', 'green', 'purple', 'pink', 'sky', 'brown', 'lime'] }); window.__snap.go('town'); }); await wait(800); await p.screenshot({ path: `${OUT}/9-color-town.png` }); await b.close(); console.log('shots done');
