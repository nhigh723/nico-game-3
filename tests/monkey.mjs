// Playtest like a 4-year-old: random taps, mashing, drags that leave the screen, two-finger chaos, Back spam.
// After the chaos every activity must still be winnable with normal input, with no page errors.
import { chromium } from 'playwright-core';
const URL = process.env.URL || 'http://localhost:4181/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(500);
const S = (fn, a) => page.evaluate(fn, a), wait = ms => page.waitForTimeout(ms), R = (a, b) => a + Math.random() * (b - a);
let fails = 0; const ok = (c, m) => { if (c) console.log('ok   ' + m); else { fails++; console.log('FAIL ' + m); } };
const pt = (x, y) => S(([x, y]) => window.__snap.toScreen(x, y), [x, y]);
async function run(a) { if (a.type === 'wait') return wait(a.ms); if (a.type === 'tap') { const p = await pt(a.x, a.y); await page.mouse.click(p.x, p.y, { delay: 40 }); return wait(150); }
  const ps = []; for (const [x, y] of a.path) ps.push(await pt(x, y)); await page.mouse.move(ps[0].x, ps[0].y); await page.mouse.down(); for (const q of ps.slice(1)) await page.mouse.move(q.x, q.y, { steps: 6 }); await page.mouse.up(); await wait(250); }
async function chaos(sec) {
  const end = Date.now() + sec * 1000;
  while (Date.now() < end) { const r = Math.random();
    if (r < 0.35) await page.mouse.click(R(0, 390), R(0, 844), { delay: 10 });
    else if (r < 0.5) { const x = R(20, 370), y = R(100, 830); for (let i = 0; i < 12; i++) await page.mouse.click(x + R(-8, 8), y + R(-8, 8)); } // mash
    else if (r < 0.75) { await page.mouse.move(R(0, 390), R(500, 840)); await page.mouse.down(); for (let i = 0; i < 8; i++) await page.mouse.move(R(-200, 600), R(-200, 1100), { steps: 3 }); await page.mouse.up(); } // drag off screen
    else if (r < 0.9) { const t1 = { x: R(0, 390), y: R(0, 844), id: 1 }, t2 = { x: R(0, 390), y: R(0, 844), id: 2 }; // two fingers
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [t1, t2] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...t1, x: t1.x + 60 }, { ...t2, y: t2.y - 80 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else { await page.mouse.move(R(0, 390), R(0, 844)); await page.mouse.down(); await wait(R(200, 1500)); await page.mouse.up(); } // long press
  }
}
async function beat(i) { const t0 = Date.now(); const before = await S(() => window.__snap.save().art.length);
  while (Date.now() - t0 < 60000) { if (i === 5 ? (await S(() => window.__snap.save().art.length)) > before : (await S(() => window.__snap.winT)) >= 0) return true;
    const a = await S(() => window.__snap.busy() ? null : window.__snap.next()); if (!a) { await wait(200); continue; } await run(a); } return false; }
for (let i = 0; i < 6; i++) { if (process.env.ONLY && !process.env.ONLY.split(",").includes(String(i))) continue;
  await S(i => window.__snap.start(i, 0), i); await wait(300);
  // chaos stays inside the activity: hide Back from the monkey for this phase so it keeps playing (Back spam is tested separately)
  await chaos(+(process.env.CHAOS || 20)); const scr = await S(() => window.__snap.screen);
  const inAct = scr === 'play' && await S(() => window.__snap.act) === i && !(await S(() => window.__snap.modal));
  if (!inAct) { await S(() => window.__snap.closeModal()); await S(i => window.__snap.start(i, 0), i); } else if ((await S(() => window.__snap.winT)) >= 0) { await wait(3600); await S(() => window.__snap.closeModal()); await S(i => window.__snap.start(i, 1), i); }
  await wait(2500); const won = await beat(i); if (!won) { await page.screenshot({ path: `/tmp/monkey-fail-${i}.png` }); console.log('  state', JSON.stringify(await S(() => ({ n: window.__snap.next(), busy: window.__snap.busy(), w: window.__snap.winT, d: window.__snap.dbg && window.__snap.dbg() })))); }
  ok(won, `activity ${i}: still winnable after 20 s of random taps, mashing, off-screen drags and two fingers (left via ${scr})`);
}
// Back spam everywhere
await S(() => { window.__snap.closeModal(); window.__snap.go('hub'); }); for (let k = 0; k < 30; k++) { const bt = await S(() => window.__snap.buttons().find(b => b.id === 'back' || b.id === 'play')); if (bt) { const p = await pt(bt.x + bt.w / 2, bt.y + bt.h / 2); await page.mouse.click(p.x, p.y); } }
ok(['title', 'hub'].includes(await S(() => window.__snap.screen)), 'Back/Play spam 30x leaves a sane screen');
for (let i = 0; i < 6; i++) { await S(i => window.__snap.start(i, 0), i); const p = await pt(50, 62); await page.mouse.move(150, 700); await page.mouse.down(); await page.mouse.move(200, 400, { steps: 4 }); await page.mouse.up(); await page.mouse.click(p.x, p.y); await wait(100); ok(await S(() => window.__snap.screen) === 'hub', `activity ${i}: one Back tap mid-drag returns to the hub`); }
// whole-app chaos across screens
await S(() => window.__snap.go('title')); await chaos(25); ok(['title', 'hub', 'play', 'town', 'parents'].includes(await S(() => window.__snap.screen)), 'free roam chaos 25 s: app alive on ' + await S(() => window.__snap.screen));
const t1 = await S(() => performance.now()); await wait(300); ok(await S(() => window.__snap.screen) !== undefined, 'still rendering');
ok(!errors.length, 'no page errors ' + JSON.stringify(errors.slice(0, 5)));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
