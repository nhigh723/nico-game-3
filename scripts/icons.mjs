// App icon (every size) + launch art, rendered by the game's own canvas art (window.__snap.renderArt) in headless Chrome.
// Needs `npm run preview` on :4180. Full-bleed square, no alpha, no baked corners (Apple rounds them).
import { chromium } from 'playwright-core'; import sharp from 'sharp'; import fs from 'node:fs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await (await b.newContext()).newPage();
await p.goto(process.env.URL || 'http://localhost:4180/'); await p.waitForTimeout(800);
const png = async k => Buffer.from((await p.evaluate(k => window.__snap.renderArt(k), k)).split(',')[1], 'base64'); const icon = await png('icon'), splash = await png('splash'); await b.close();
fs.mkdirSync('store/icons', { recursive: true }); const src = await sharp(icon).removeAlpha().png().toBuffer();
await sharp(src).toFile('store/icons/icon-1024.png');
for (const z of [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180]) await sharp(src).resize(z, z).png().toFile(`store/icons/icon-${z}.png`);
await sharp(src).toFile('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
await sharp(src).resize(180, 180).png().toFile('public/apple-touch-icon.png'); await sharp(src).resize(64, 64).png().toFile('public/favicon.png');
const sp = await sharp(splash).removeAlpha().png().toBuffer(); for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) await sharp(sp).toFile('ios/App/App/Assets.xcassets/Splash.imageset/' + f);
await sharp(sp).toFile('store/launch-2732.png'); console.log('icons + launch art done');
