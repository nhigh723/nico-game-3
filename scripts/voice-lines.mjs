// Collects every the mascot line (src/lines.ts) with its clip id and writes the ones without a clip to voice/todo.json
// ([[id, text], ...], the batch format /workspace/tts/qclone/gen.py takes).
import { execSync } from 'node:child_process'; import fs from 'node:fs';
execSync('npx rolldown src/lines.ts --format esm --file /tmp/nb-lines.mjs', { stdio: 'ignore' });
execSync('npx rolldown src/voice.ts --format esm --file /tmp/nb-voice.mjs', { stdio: 'ignore' });
const { allLines, NAMED_LINES } = await import('/tmp/nb-lines.mjs?' + Date.now()); const { lineId } = await import('/tmp/nb-voice.mjs?' + Date.now());
const man = fs.existsSync('public/voice/manifest.json') ? JSON.parse(fs.readFileSync('public/voice/manifest.json')) : {};
const all = allLines().map(t => [lineId(t), t]); const named = process.argv.includes('--named'); const todo = named ? NAMED_LINES.map(t => [lineId(t), t]) : all.filter(([id]) => !man[id]);
fs.mkdirSync('voice', { recursive: true }); fs.writeFileSync('voice/all.json', JSON.stringify(all)); fs.writeFileSync('voice/todo.json', JSON.stringify(todo));
console.log(all.length, 'lines,', all.length - todo.length, 'voiced,', todo.length, 'to clone');
