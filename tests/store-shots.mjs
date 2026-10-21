// Phone-size screenshots (1170x2532) of the title, hub, each activity mid-play and My Town.
import { chromium } from 'playwright-core';
const URL = process.env.URL || 'http://localhost:4181/', OUT = process.env.OUT || 'screenshots';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await (await b.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 })).newPage();
const S = (f, a) => p.evaluate(f, a), wait = ms => p.waitForTimeout(ms);
async function run(a) { if (!a) return; if (a.type === 'wait') return wait(a.ms); if (a.type === 'tap') { const q = await S(([x, y]) => window.__snap.toScreen(x, y), [a.x, a.y]); await p.mouse.click(q.x, q.y); return wait(400); }
  const pts = []; for (const [x, y] of a.path) pts.push(await S(([x, y]) => window.__snap.toScreen(x, y), [x, y]));
  await p.mouse.move(pts[0].x, pts[0].y); await p.mouse.down(); for (const q of pts.slice(1)) await p.mouse.move(q.x, q.y, { steps: 12 }); await p.mouse.up(); await wait(500); }
const step = async n => { for (let i = 0; i < n; i++) { await wait(300); await run(await S(() => window.__snap.busy() ? null : window.__snap.next())); } };
await p.goto(URL); await wait(1500); await p.screenshot({ path: `${OUT}/1-title.png` });
await S(() => window.__snap.go('hub')); await wait(800); await p.screenshot({ path: `${OUT}/2-hub.png` });
const acts = [['3-puddle-mix', 0, 1, 1], ['4-light-and-dark', 1, 3, 1], ['5-rainbow-road', 2, 2, 3], ['6-mirror-butterfly', 3, 3, 3], ['7-color-sort-rain', 4, 1, 8], ['8-paint-studio', 5, 0, 3]];
for (const [n, a, l, k] of acts) { await S(([a, l]) => window.__snap.start(a, l), [a, l]); await wait(2500); await step(k); await wait(300); await p.screenshot({ path: `${OUT}/${n}.png` }); }
await S(() => window.__snap.go('town')); await wait(800); await p.screenshot({ path: `${OUT}/9-my-town.png` }); await b.close(); console.log('shots done');
