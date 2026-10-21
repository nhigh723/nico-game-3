#!/usr/bin/env python3
"""Objective checks for the carrier-padded (trimmed) voice clips. Run with /workspace/tts/pvenv/bin/python from the repo root.
  check-clips.py            report only
  check-clips.py --fix      add 50 ms of silence to each end (with 5 ms fades) where padding is outside 30-80 ms, then re-check;
                            clips that still fail (abrupt cut, leftover carrier, ASR, loudness) go back to the device voice
Checks per clip: lead/trail silence 30-80 ms (below -50 dBFS); no abrupt edge (first/last 10 ms of speech must be at least
12 dB under the loudest 50 ms, i.e. a natural onset/decay rather than a cut through a sound); loudness within 3 LU of the
median of all other clips; Whisper hears exactly the line on its own; and a single speech island (no separate burst
>= 180 ms away from the word = no leftover carrier sound)."""
import sys, os, json, re, subprocess, tempfile, numpy as np, soundfile as sf
G = os.getcwd(); V = f'{G}/public/voice'; man = json.load(open(f'{V}/manifest.json')); rec = json.load(open(f'{G}/voice/clones.json'))
from transformers import pipeline; asr = pipeline('automatic-speech-recognition', model='openai/whisper-small.en')
src = open(f'{G}/scripts/install-clone-voice.py').read(); exec(src[src.index('HOMO ='):src.index('TXT =')])
def load(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True); return np.frombuffer(r.stdout, np.float32)
def lufs(p):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(json.loads(e[e.rindex('{'):e.rindex('}') + 1])['input_i'])
db = lambda x: 20 * np.log10(max(1e-9, float(np.sqrt(np.mean(x ** 2))) if len(x) else 1e-9))
def check(h, text):
    p = f'{V}/{man[h]}'; y = load(p); sr = 16000; f = int(0.005 * sr); fr = [db(y[i:i + f]) for i in range(0, len(y) - f, f)]
    on = [i for i, v in enumerate(fr) if v > -50]; lead = on[0] * 5; trail = (len(fr) - 1 - on[-1]) * 5
    s0, s1 = on[0] * f, (on[-1] + 1) * f; seg = y[s0:s1]; w = int(0.05 * sr)
    peak = max(db(seg[i:i + w]) for i in range(0, max(1, len(seg) - w), f)); e0, e1 = db(seg[:int(0.01 * sr)]), db(seg[-int(0.01 * sr):])
    vf = [v > -40 for v in fr]; isl, cur, gap = [], None, 0
    for i, v in enumerate(vf):
        if v: (isl.append([i, i]) if cur is None or i - cur > 36 else None); isl[-1][1] = i; cur = i
    heard = asr(y.copy())['text']; L = lufs(p)
    return dict(lead=lead, trail=trail, edge_in=round(e0 - peak, 1), edge_out=round(e1 - peak, 1), islands=len(isl), lufs=L, heard=heard.strip(), exact=words(heard) == words(text))
def pad(h):
    p = f'{V}/{man[h]}'; t = tempfile.mktemp(suffix='.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,afade=t=in:d=0.005,areverse,afade=t=in:d=0.005,areverse,adelay=50:all=1,apad=pad_dur=0.05', '-ac', '1', '-ar', '24000', '-b:a', '48k', t], check=True); os.replace(t, p)
others = [lufs(f'{V}/{f}') for h, f in man.items() if not rec.get(h, {}).get('padded')]; med = float(np.median(others))
fix = '--fix' in sys.argv; out, revert = {}, []
for h, r in sorted(rec.items(), key=lambda x: x[1]['text']):
    if not r.get('padded') or h not in man: continue
    c = check(h, r['text'])
    if fix and not (30 <= c['lead'] <= 80 and 30 <= c['trail'] <= 80): pad(h); c = check(h, r['text'])
    bad = [k for k, ok in [('padding', 30 <= c['lead'] <= 80 and 30 <= c['trail'] <= 80), ('cut-in', c['edge_in'] <= -12), ('cut-out', c['edge_out'] <= -12), ('carrier', c['islands'] == 1), ('asr', c['exact']), ('loudness', abs(c['lufs'] - med) <= 3)] if not ok]
    c['bad'] = bad; out[r['text']] = c; print(f"{r['text']:<14} lead {c['lead']:>3} trail {c['trail']:>3} in {c['edge_in']:>6} out {c['edge_out']:>6} isl {c['islands']} {c['lufs']:6.1f} LUFS heard {c['heard']!r} {'BAD ' + ','.join(bad) if bad else 'ok'}")
    if fix and bad: revert.append(r['text']); man.pop(h); os.remove(f'{V}/{h}.mp3'); r['reverted'] = bad
print('median LUFS of other clips', round(med, 1))
if fix: json.dump(man, open(f'{V}/manifest.json', 'w')); json.dump(rec, open(f'{G}/voice/clones.json', 'w'), indent=0, sort_keys=True); print('reverted to device voice:', revert)
json.dump(out, open(f'{G}/voice/clip-check.json', 'w'), indent=1)
