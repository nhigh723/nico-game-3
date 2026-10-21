#!/usr/bin/env python3
"""Installs gated voice-clone takes into public/voice (same gate and cleanup as the science-game's pipeline, which is only READ here).
  1. node scripts/voice-lines.mjs                      -> voice/todo.json ([[id, text], ...])
  2. /workspace/tts/qvenv/bin/python /workspace/tts/qclone/gen.py voice/todo.json voice/takes 2
  3. /workspace/tts/qvenv/bin/python /workspace/tts/qclone/gate.py voice/todo.json voice/takes   (writes voice/takes/gate.json)
  4. /workspace/tts/pvenv/bin/python scripts/install-clone-voice.py voice/todo.json voice/takes
Gate per take: Whisper must hear every word (WER 0) and voice similarity to Nick's pack >= 0.84. a new mascot name
it may be heard as e.g. "Flimbee"; those spellings are accepted as the same word. Lines that fail stay on the device voice."""
import sys, os, json, re, difflib
import subprocess, tempfile, soundfile as sf
G = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = f'{G}/public/voice'; argv = sys.argv
# clip cleanup copied from the science-game's scripts/install-nick-voice.py (80 Hz HP, trim, -16 LUFS, 24 kHz mono mp3)
TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse'
def clean(x, sr, declip):
    with tempfile.TemporaryDirectory() as td:
        sf.write(f'{td}/a.wav', x, sr); af = ('adeclip,' if declip else '') + 'highpass=f=80,' + TRIM
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f'{td}/a.wav', '-af', af, f'{td}/b.wav'], check=True)
        return sf.read(f'{td}/b.wav', dtype='float32')[0]
def export(x, sr, out):
    with tempfile.TemporaryDirectory() as td:
        sf.write(f'{td}/a.wav', x, sr)
        # two-pass loudnorm in linear mode: one gain per clip (short clips stay natural and land on -16 LUFS)
        m = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'{td}/a.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
        j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
        af = (f"loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
              f":measured_thresh={j['input_thresh']}:offset={j['target_offset']},alimiter=limit=0.84:attack=1:release=30:level=false")
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f'{td}/a.wav', '-af', af, '-ac', '1', '-ar', '24000', '-b:a', '48k', out], check=True)
items, td = json.load(open(argv[1])), argv[2]; gate = json.load(open(f'{td}/gate.json'))
os.makedirs(OUT, exist_ok=True); mf = f'{OUT}/manifest.json'; man = json.load(open(mf)) if os.path.exists(mf) else {}
recf = f'{G}/voice/clones.json'; rec = json.load(open(recf)) if os.path.exists(recf) else {}
HOMO = {'two': '2', 'to': '2', 'too': '2', 'one': '1', 'won': '1', 'three': '3', 'four': '4', 'for': '4', 'five': '5', 'six': '6', 'eight': '8', 'ate': '8', 'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20'}
NAME_RE = r"nico|neeko|nikko|niko"  # spellings Whisper may use for the mascot name
def w1(x): x = HOMO.get(x, x); return 'mascot' if re.fullmatch(NAME_RE, x) else x
def words(t): return [w1(w) for w in re.sub(r"[^a-z0-9' ]", ' ', t.lower().replace('+', ' plus ').replace('-', ' ')).split()]
def wer(r, h): r, h = words(r), words(h); return 1 - sum(b.size for b in difflib.SequenceMatcher(None, r, h).get_matching_blocks()) / max(1, len(r))
TXT = dict(map(tuple, items)); added, failed = 0, []
for h, text in items:
    if h in man: continue
    takes = sorted((g['sim'], k) for k, g in gate.items() if k.split('~')[0] == h and g['sim'] >= 0.84 and wer(TXT[h], g['heard']) == 0)
    if not takes: failed.append(text); continue
    k = takes[-1][1]; x, sr = sf.read(f'{td}/{k}.wav', dtype='float32')
    export(clean(x, sr, False), sr, f'{OUT}/{h}.mp3'); man[h] = f'{h}.mp3'; added += 1
    rec[h] = dict(text=text, take=k, sim=gate[k]['sim'], heard=gate[k]['heard'])
json.dump(man, open(mf, 'w')); json.dump(rec, open(recf, 'w'), indent=0, sort_keys=True)
print(added, 'clips added;', len(man), 'in manifest;', len(failed), 'failed gate (device voice)'); print('\n'.join('  gap: ' + t for t in failed))
