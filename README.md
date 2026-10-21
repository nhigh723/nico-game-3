# Nico Puddle Painter (game #3)
Ages 3-6 color game: mix puddles, light & dark, rainbow-road patterns, mirror butterfly, color sort rain, paint studio, plus My Town that fills with color. No text, every instruction spoken (cloned voice, device voice fallback), hand demos, single-tap Back, no ads/tracking.
Brand lives in `src/brand.ts` (MASCOT_NAME, GAME_TITLE); lines naming the mascot are in `NAMED` in `src/lines.ts`. App id `com.nickhigh.game3`.
- `npm run build`, `npx vite preview --port 4181`
- Tests: `node tests/play-all.mjs`, `node tests/monkey.mjs`, `node tests/shots.mjs`, `node tests/live-check.mjs`
- Voice: `node scripts/voice-lines.mjs` → `scripts/gen_takes.py` (qvenv) → `/workspace/tts/qclone/gate.py voice/todo.json voice/takes` (pvenv) → `scripts/install-clone-voice.py voice/todo.json voice/takes` (pvenv; WER 0, sim ≥ 0.84)
- Deploy: `./scripts/deploy.sh` → https://nhigh723.github.io/nico-game-3/
- iOS: Capacitor 7, StoreKit 2 (`store/products.json`-style ids com.nickhigh.game3.*), codemagic.yaml same integration/group/secret names as game #2. Manual App Store steps: follow nico-game-2/docs/SUBMIT.md with the game3 bundle id and products.
