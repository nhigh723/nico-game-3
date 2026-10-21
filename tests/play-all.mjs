// End-to-end: beats every level of every activity in headless Chrome using only real pointer input (mouse down/move/up
// at screen coordinates). Each activity exposes next(): the next input a player would make, so this proves every level is winnable.
import { chromium } from 'playwright-core';
const URL = process.env.URL || 'http://localhost:4181/';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && !/voice|manifest|404|Failed to load/.test(m.text()) && errors.push(m.text()));
await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(500);
const S = (fn, a) => page.evaluate(fn, a), wait = ms => page.waitForTimeout(ms);
const pt = (x, y) => S(([x, y]) => window.__snap.toScreen(x, y), [x, y]);
async function tapBtn(id) { const bt = await S(id => window.__snap.buttons().find(b => b.id === id), id); if (!bt) throw new Error('no button ' + id); const p = await pt(bt.x + bt.w / 2, bt.y + bt.h / 2); await page.mouse.click(p.x, p.y); await wait(250); }
async function run(a) {
  if (a.type === 'wait') return wait(a.ms);
  if (a.type === 'tap') { const p = await pt(a.x, a.y); await page.mouse.move(p.x, p.y); await page.mouse.down(); await wait(40); await page.mouse.up(); return wait(150); }
  const ps = []; for (const [x, y] of a.path) ps.push(await pt(x, y));
  await page.mouse.move(ps[0].x, ps[0].y); await page.mouse.down(); await wait(30);
  for (let i = 1; i < ps.length; i++) await page.mouse.move(ps[i].x, ps[i].y, { steps: 6 }); await wait(30); await page.mouse.up(); await wait(250);
}
let fails = 0; const ok = (c, m) => { if (c) console.log('ok   ' + m); else { fails++; console.log('FAIL ' + m); } };
// UI: title -> hub (Play), each card opens, Back is a single tap
await tapBtn('play'); ok(await S(() => window.__snap.screen) === 'hub', 'Play opens the hub');
for (let i = 0; i < 6; i++) { await tapBtn('act' + i); const s = await S(() => window.__snap.screen); await tapBtn('back'); const s2 = await S(() => window.__snap.screen); ok(s === 'play' && s2 === 'hub', `card ${i} opens, one tap on Back returns`); }
await tapBtn('town'); ok(await S(() => window.__snap.screen) === 'town', 'My Town opens'); await tapBtn('back');
await tapBtn('back'); ok(await S(() => window.__snap.screen) === 'title', 'Back from hub returns to title'); await tapBtn('play');
// beat every level (authored + 2 remixes) with real input
async function beat(i, l) {
  await S(([i, l]) => window.__snap.start(i, l), [i, l]); await wait(300); const t0 = Date.now(); const before = await S(() => window.__snap.save().art.length); let steps = 0;
  while (Date.now() - t0 < 60000) {
    if (i === 5) { if ((await S(() => window.__snap.save().art.length)) > before) return steps; } else if ((await S(() => window.__snap.winT)) >= 0) return steps;
    const a = await S(() => window.__snap.busy() ? null : window.__snap.next()); if (!a) { await wait(200); continue; } await run(a); steps++; if (steps > 80) break;
  }
  return -1;
}
const LV = [5, 5, 5, 5, 5, 1];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
for (let i = 0; i < 6; i++) if (!ONLY || ONLY.includes(i)) for (let l = 0; l < LV[i] + (i === 5 ? 0 : 2); l++) { const n = await beat(i, l); ok(n >= 0, `activity ${i} level ${l}${l >= LV[i] ? ' (remix)' : ''}: won in ${n} inputs`); }
// mistakes are recoverable: a wrong mix makes a new color (kept), then the right one still wins
await S(() => window.__snap.start(0, 0)); await wait(300);
await run({ type: 'drag', path: [[195 - 80, 770], [195, 500], [195, 590]] }); await run({ type: 'drag', path: [[195 + 80, 770], [195, 500], [195, 590]] }); // red + blue = purple (wanted orange)
await wait(1600); ok((await S(() => window.__snap.save().col)).includes('purple') && (await S(() => window.__snap.winT)) < 0, 'wrong mix: no win, purple saved to the color collection');
await wait(2600); { let n = 0; while ((await S(() => window.__snap.winT)) < 0 && n++ < 20) { const a = await S(() => window.__snap.busy() ? null : window.__snap.next()); if (a) await run(a); else await wait(200); } }
ok((await S(() => window.__snap.winT)) >= 0, 'after the wrong mix the right one wins');
// unlock modal shows after enough wins and closes
const sv = await S(() => window.__snap.save()); ok(ONLY || sv.wins >= 30, `wins counted (${sv.wins}); skills ${Object.keys(sv.skills).length}`);
await S(() => { const s = window.__snap.save(); s.seen = 0; window.__snap.setSave(s); window.__snap.start(0, 0); }); await wait(300);
while ((await S(() => window.__snap.winT)) < 0) { const a = await S(() => window.__snap.next()); if (a) await run(a); else await wait(200); }
await wait(3800); ok(await S(() => window.__snap.modal) === 'unlock', 'unlock celebration after a win'); await wait(1000); await page.mouse.click(195, 400); await wait(400);
ok(await S(() => window.__snap.modal) === null && await S(() => window.__snap.screen) === 'play', 'tap closes it and the next level starts');
// parental gate + paywall (store simulator)
await page.goto(URL + '?store=sim'); await wait(500); await S(() => window.__snap.storeTest.reset()); await tapBtn('play');
await tapBtn('act3'); ok(await S(() => window.__snap.screen) === 'hub', 'locked activity stays on hub (store sim, no club)');
await tapBtn('act0'); ok(await S(() => window.__snap.screen) === 'play', 'free activity opens'); await tapBtn('back');
await tapBtn('gear'); ok(await S(() => window.__snap.modal) === 'gate', 'gear opens the grown-up gate');
{ const bt = await S(() => window.__snap.buttons().find(b => b.id === 'gateHold')); const p = await pt(bt.x + 70, bt.y + 70); await page.mouse.move(p.x, p.y); await page.mouse.down(); await wait(3400); await page.mouse.up(); await wait(200);
  const g = await S(() => window.__snap.gate); ok(g.asked, 'hold 3 s passes the first step');
  const ans = g.q[0] + g.q[1], k = g.opts.indexOf(ans); await tapBtn('gateA' + k); ok(await S(() => window.__snap.screen) === 'parents', 'right answer opens grown-ups'); }
await tapBtn('buy-yearly'); await wait(300); ok((await S(() => window.__snap.store())).club, 'simulated purchase unlocks the mascot Club');
await tapBtn('back'); await tapBtn('act3'); ok(await S(() => window.__snap.screen) === 'play', 'paid activity opens after purchase');
ok(!errors.length, 'no page errors ' + JSON.stringify(errors.slice(0, 5)));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
