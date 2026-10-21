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
if mode == 'redo':  # drop earlier padded clips and redo them with the current trim + checks
    _r = json.load(open(f'{G}/voice/clones.json')); [man.pop(k, None) for k, v in _r.items() if v.get('padded')]; miss = [(h, t) for h, t in items if h not in man]
if mode == 'prep':
    json.dump([[h, f'{PRE} {t} {POST}'] for h, t in miss], open(f'{G}/voice/pad.json', 'w')); print(len(miss), 'padded lines'); sys.exit()
import numpy as np, soundfile as sf, librosa
sys.argv = [sys.argv[0], todo, f'{G}/voice/padtakes']
src = open(f'{G}/scripts/install-clone-voice.py').read(); exec(src[:src.index('items, td =')]); exec(src[src.index('HOMO ='):src.index('TXT =')])  # clean/export/HOMO/words/wer
from transformers import pipeline; from resemblyzer import VoiceEncoder, preprocess_wav
asr = pipeline('automatic-speech-recognition', model='openai/whisper-small.en'); enc = VoiceEncoder('cpu'); C = np.load('/workspace/tts/qclone/pack_centroid.npy')
td = f'{G}/voice/padtakes'; gate = json.load(open(f'{td}/gate.json')); recf = f'{G}/voice/clones.json'; rec = json.load(open(recf)) if os.path.exists(recf) else {}
sys.path.insert(0, f'{G}/scripts'); from clipcheck import check, gap_cut, lufs, repad
MED = float(np.median([lufs(f'{G}/public/voice/{f}') for h0, f in man.items() if not rec.get(h0, {}).get('padded')]))
PAD = PRE + ' ' + '{}' + ' ' + POST; added, failed, report = 0, [], {}
for h, text in miss:
    cands = sorted(((g['sim'], k) for k, g in gate.items() if k.split('~')[0] == h and g['sim'] >= 0.84 and wer(PAD.format(text), g['heard']) == 0), reverse=True)
    done = False; tried = []
    for sim, k in cands:
        y, sr = sf.read(f'{td}/{k}.wav', dtype='float32'); y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
        ch = asr(y16.copy(), return_timestamps='word')['chunks']; ws = [(words(c['text']), c['timestamp']) for c in ch]
        tgt, n0 = words(text), len(words(PRE)); flat = [(w, ts) for ww, ts in ws for w in ww]
        if len(flat) < n0 + len(tgt) or [w for w, _ in flat[n0:n0 + len(tgt)]] != tgt: continue
        a, b = flat[n0][1][0], flat[n0 + len(tgt) - 1][1][1]
        if a is None or b is None: continue
        nxt = flat[n0 + len(tgt)][1][0] if len(flat) > n0 + len(tgt) else b + 0.3
        g = gap_cut(y, sr, a, b)
        if g is None: continue
        cut = y[g[0]:g[1]].copy(); n5 = int(0.005 * sr); cut[:n5] *= np.linspace(0, 1, n5); cut[-n5:] *= np.linspace(1, 0, n5)
        c16 = librosa.resample(cut, orig_sr=sr, target_sr=16000); heard = asr(c16.copy())['text']
        if words(heard) != words(text): continue
        out = f'{G}/public/voice/{h}.mp3'; export(cut, sr, out)
        cc = check(out, text, MED, asr, words)
        if cc['bad'] == ['padding']: repad(out); cc = check(out, text, MED, asr, words)
        if cc['bad']: os.remove(out); tried.append((k, cc['bad'])); continue
        tsim = float(enc.embed_utterance(preprocess_wav(c16, 16000)) @ C)
        man[h] = f'{h}.mp3'; added += 1
        rec[h] = dict(text=text, take=k, sim=sim, padded=True, check=cc, trimmed_sim=round(tsim, 3), heard=heard.strip()); report[text] = (sim, round(tsim, 3)); done = True; break
    if not done: failed.append((text, len(cands), tried))
json.dump(man, open(f'{G}/public/voice/manifest.json', 'w')); json.dump(rec, open(recf, 'w'), indent=0, sort_keys=True)
print(added, 'padded clips added;', len(man), 'in manifest'); [print(f'  ok {t!r}: padded sim {s}, trimmed sim {ts}') for t, (s, ts) in report.items()]
[print(f'  gap: {t} ({n} padded takes passed the gate; clip-check rejects: {tr})') for t, n, tr in failed]
