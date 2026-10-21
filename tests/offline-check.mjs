// Loads the site, records every network request (and its host) while visiting each activity,
// then cuts the network and checks the running app keeps working and whether a reload works.
import { chromium } from 'playwright-core';
const URL = process.env.URL; const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
const reqs = new Map(), errs = [], failed = []; p.on('request', r => { const h = new globalThis.URL(r.url()).host; reqs.set(h, (reqs.get(h) || 0) + 1); });
p.on('requestfailed', r => failed.push(r.url().split('/').pop())); p.on('pageerror', e => errs.push(e.message));
await p.goto(URL); await p.waitForTimeout(1500); await p.mouse.click(195, 740); await p.waitForTimeout(800);
for (let i = 0; i < 6; i++) { await p.evaluate(i => window.__snap.start(i, 0), i); await p.waitForTimeout(3000); }
console.log('hosts contacted:', JSON.stringify([...reqs]));
await ctx.setOffline(true); failed.length = 0;
for (let i = 0; i < 6; i++) { await p.evaluate(i => window.__snap.start(i, 1), i); await p.waitForTimeout(2500); }
const alive = await p.evaluate(() => window.__snap.screen); console.log('offline, after load: screen', alive, 'failed fetches', failed.length, 'errors', errs);
const r = await p.reload().then(() => 'ok', e => 'FAILS (' + e.message.split('\n')[0] + ')'); console.log('offline reload:', r);
const sw = await p.evaluate(() => navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(x => x.length) : 'n/a').catch(() => 'n/a'); console.log('service workers:', sw); await b.close();
