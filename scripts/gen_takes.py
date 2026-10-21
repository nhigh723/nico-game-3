import sys, json, time, torch, soundfile as sf
from qwen_tts import Qwen3TTSModel
torch.set_num_threads(6)
REF = '/workspace/tts/nick-pack/audio/session_01/nico_002.wav'; REF_TEXT = "Today we're making a campfire."
m = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-0.6B-Base", device_map="cpu", dtype=torch.float32)
items = json.load(open(sys.argv[1])); out = sys.argv[2]
prompt = m.create_voice_clone_prompt(ref_audio=REF, ref_text=REF_TEXT) if hasattr(m, 'create_voice_clone_prompt') else None
TAKES = int(sys.argv[3]) if len(sys.argv) > 3 else 2
import os
for k, text in items:
  say = text.replace('+', 'plus ').replace(' vs ', ' versus ')
  for j in range(int(os.environ.get("TAKE_FROM", "0")), TAKES):
    if os.path.exists(f'{out}/{k}~{j}.wav') or os.path.exists(f'{out}/{k}~{j}.skip'): continue
    open('/tmp/gen-current','w').write(f'{out}/{k}~{j}')
    t = time.time(); torch.manual_seed(1000 + j)
    kw = dict(voice_clone_prompt=prompt) if prompt is not None else dict(ref_audio=REF, ref_text=REF_TEXT)
    import signal
    def _to(*a): raise TimeoutError
    signal.signal(signal.SIGALRM, _to); signal.alarm(int(os.environ.get("TAKE_TIMEOUT", "240")))
    try: wavs, sr = m.generate_voice_clone(text=say, language="English", max_new_tokens=400, **kw)
    except TimeoutError: print(k, j, 'TIMEOUT', flush=True); continue
    finally: signal.alarm(0)
    sf.write(f'{out}/{k}~{j}.wav', wavs[0], sr); print(k, j, round(time.time() - t, 1), 's', flush=True)
