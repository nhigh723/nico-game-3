#!/usr/bin/env python3
"""Context padding for short voice lines (the clone's speaker match is unreliable on 1-word clips).
  prep    (any python):  pad-voice.py prep voice/todo.json   -> voice/pad.json: each still-missing line inside a carrier phrase
  gen     (qvenv):       scripts/gen_takes.py voice/pad.json voice/padtakes 8
  gate    (pvenv):       /workspace/tts/qclone/gate.py voice/pad.json voice/padtakes   (scores the PADDED clip: WER 0 + sim >= 0.84, unchanged bar)
  install (pvenv):       pad-voice.py install voice/todo.json
Install keeps a take only if the padded clip passes the gate, the target words are found with Whisper word timestamps,
and the trimmed clip on its own is again heard exactly (WER 0). Trimmed-clip similarity is recorded for transparency."""
import sys, os, json, re, difflib
G = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); mode, todo = sys.argv[1], sys.argv[2]
PRE, POST = "Okay, listen to me now.", "Yes, that is what I said."
items = json.load(open(todo)); man = json.load(open(f'{G}/public/voice/manifest.json'))
miss = [(h, t) for h, t in items if h not in man]
if mode == 'prep':
    json.dump([[h, f'{PRE} {t} {POST}'] for h, t in miss], open(f'{G}/voice/pad.json', 'w')); print(len(miss), 'padded lines'); sys.exit()
import numpy as np, soundfile as sf, librosa
sys.argv = [sys.argv[0], todo, f'{G}/voice/padtakes']
src = open(f'{G}/scripts/install-clone-voice.py').read(); exec(src[:src.index('items, td =')]); exec(src[src.index('HOMO ='):src.index('TXT =')])  # clean/export/HOMO/words/wer
from transformers import pipeline; from resemblyzer import VoiceEncoder, preprocess_wav
asr = pipeline('automatic-speech-recognition', model='openai/whisper-small.en'); enc = VoiceEncoder('cpu'); C = np.load('/workspace/tts/qclone/pack_centroid.npy')
td = f'{G}/voice/padtakes'; gate = json.load(open(f'{td}/gate.json')); recf = f'{G}/voice/clones.json'; rec = json.load(open(recf)) if os.path.exists(recf) else {}
PAD = PRE + ' ' + '{}' + ' ' + POST; added, failed, report = 0, [], {}
for h, text in miss:
    cands = sorted(((g['sim'], k) for k, g in gate.items() if k.split('~')[0] == h and g['sim'] >= 0.84 and wer(PAD.format(text), g['heard']) == 0), reverse=True)
    done = False
    for sim, k in cands:
        y, sr = sf.read(f'{td}/{k}.wav', dtype='float32'); y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
        ch = asr(y16.copy(), return_timestamps='word')['chunks']; ws = [(words(c['text']), c['timestamp']) for c in ch]
        tgt, n0 = words(text), len(words(PRE)); flat = [(w, ts) for ww, ts in ws for w in ww]
        if len(flat) < n0 + len(tgt) or [w for w, _ in flat[n0:n0 + len(tgt)]] != tgt: continue
        a, b = flat[n0][1][0], flat[n0 + len(tgt) - 1][1][1]
        if a is None or b is None: continue
        nxt = flat[n0 + len(tgt)][1][0] if len(flat) > n0 + len(tgt) else b + 0.3
        ok = False
        for m0, m1 in ((0.08, 0.15), (0.04, 0.06), (0.02, 0.0)):
            a2, b2 = max(0, a - m0), min(b + m1, (b + nxt) / 2 if nxt else b + m1)
            cut = y[int(a2 * sr):int(b2 * sr)]; c16 = librosa.resample(cut, orig_sr=sr, target_sr=16000)
            heard = asr(c16.copy())['text']
            if words(heard) == words(text): ok = True; break  # exact: no carrier word may leak into the clip
        if not ok: continue
        tsim = float(enc.embed_utterance(preprocess_wav(c16, 16000)) @ C)
        export(clean(cut, sr, False), sr, f'{G}/public/voice/{h}.mp3'); man[h] = f'{h}.mp3'; added += 1
        rec[h] = dict(text=text, take=k, sim=sim, padded=True, trimmed_sim=round(tsim, 3), heard=heard.strip()); report[text] = (sim, round(tsim, 3)); done = True; break
    if not done: failed.append((text, len(cands)))
json.dump(man, open(f'{G}/public/voice/manifest.json', 'w')); json.dump(rec, open(recf, 'w'), indent=0, sort_keys=True)
print(added, 'padded clips added;', len(man), 'in manifest'); [print(f'  ok {t!r}: padded sim {s}, trimmed sim {ts}') for t, (s, ts) in report.items()]
[print(f'  gap: {t} ({n} padded takes passed the gate)') for t, n in failed]
