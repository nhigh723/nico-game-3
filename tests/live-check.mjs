import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const e = []; p.on('pageerror', x => e.push(x.message)); await p.goto('https://nhigh723.github.io/nico-game-3/'); await p.waitForTimeout(1500);
await p.mouse.click(195, 740); await p.waitForTimeout(500); console.log(await p.title(), await p.evaluate(() => window.__snap.screen), e); await b.close();
