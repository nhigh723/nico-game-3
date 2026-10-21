"""Objective clip checks shared by pad-voice.py and check-clips.py (no listening needed).
lead/trail silence 30-80 ms (below -50 dBFS); natural edges (first/last 10 ms of speech >= 12 dB under the loudest 50 ms);
at most one speech island per sentence of the line (an extra burst >= 180 ms away = leftover carrier sound); Whisper hears exactly the line; loudness within 3 LU of the median."""
import subprocess, json, re, numpy as np
def load(p, sr=16000):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True); return np.frombuffer(r.stdout, np.float32)
def lufs(p):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(json.loads(e[e.rindex('{'):e.rindex('}') + 1])['input_i'])
def db(x): return 20 * np.log10(max(1e-9, float(np.sqrt(np.mean(x ** 2)))) if len(x) else -180)
def frames(y, f): return [db(y[i:i + f]) for i in range(0, len(y) - f + 1, f)]
def check(p, text, med, asr, words):
    y = load(p); sr = 16000; f = 80; fr = frames(y, f); on = [i for i, v in enumerate(fr) if v > -50]
    if not on: return dict(bad=['silent'])
    lead, trail = on[0] * 5, (len(fr) - 1 - on[-1]) * 5; seg = y[on[0] * f:(on[-1] + 1) * f]; w = 800
    peak = max(db(seg[i:i + w]) for i in range(0, max(1, len(seg) - w + 1), f)); e0, e1 = db(seg[:160]) - peak, db(seg[-160:]) - peak
    isl = []
    for i, v in enumerate(fr):
        if v > -40:
            if isl and i - isl[-1][1] <= 36: isl[-1][1] = i
            else: isl.append([i, i])
    heard = asr(y.copy())['text'].strip(); L = lufs(p)
    c = dict(lead=lead, trail=trail, edge_in=round(e0, 1), edge_out=round(e1, 1), islands=len(isl), lufs=L, heard=heard)
    c['bad'] = [k for k, ok in [('padding', 30 <= lead <= 80 and 30 <= trail <= 80), ('cut-in', e0 <= -12), ('cut-out', e1 <= -12), ('carrier', len(isl) <= max(1, len([x for x in re.split(r'[.!?]+', text) if x.strip()]))), ('asr', words(heard) == words(text)), ('loudness', abs(L - med) <= 3)] if not ok]
    return c
def gap_cut(y, sr, a, b, nxt_prev=None):
    """Move the Whisper word bounds out to the middle of the real pauses around the word: walk back from a (forward from b)
    to the first run of >= 60 ms below -45 dB re. the take's peak, and cut 50 ms into that pause. None if no clean pause."""
    f = int(0.01 * sr); fr = np.array(frames(y, f)); thr = fr.max() - 45; quiet = fr < thr; ia, ib = int(a * 100), int(b * 100)
    def run_back(i):
        n = 0
        for j in range(min(i, len(quiet) - 1), -1, -1):
            n = n + 1 if quiet[j] else 0
            if n >= 6: return j + n  # first speech-free frame index after the run start... (run spans j..j+n-1)
        return None
    def run_fwd(i):
        n = 0
        for j in range(max(0, i), len(quiet)):
            n = n + 1 if quiet[j] else 0
            if n >= 6: return j - n + 1
        return None
    # start: the pause just before the word's speech begins (search from a little inside the word, backwards)
    s = ia + 3
    while s < len(quiet) and quiet[s]: s += 1   # first loud frame at/after a
    s_run_end = run_back(s - 1); e = ib - 3
    while e > 0 and quiet[e]: e -= 1            # last loud frame at/before b
    e_run_start = run_fwd(e + 1)
    if s_run_end is None or e_run_start is None or e_run_start <= s_run_end: return None
    return max(0, (s_run_end - 5) * f), min(len(y), (e_run_start + 5) * f)
def repad(p):
    """Strip the 5 ms frames below -50 dBFS (RMS, same measure as check) at each end and put back exactly 50 ms of silence (5 ms fades)."""
    import tempfile, os, soundfile as sf
    y = load(p, 24000).copy(); f = 120; fr = frames(y, f); on = [i for i, v in enumerate(fr) if v > -50]
    y = y[on[0] * f:(on[-1] + 1) * f]; n = 120; y[:n] *= np.linspace(0, 1, n); y[-n:] *= np.linspace(1, 0, n)
    z = np.zeros(1200, np.float32); y = np.concatenate([z, y, z]); t = tempfile.mktemp(suffix='.wav'); sf.write(t, y, 24000)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', t, '-ac', '1', '-ar', '24000', '-b:a', '48k', p], check=True); os.remove(t)
