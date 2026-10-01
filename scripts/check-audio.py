"""
Transcribe the recorded narration with an offline speech recognizer and compare
it with the intended reading, to find words the voice misreads.

    pip install faster-whisper pykakasi
    python3 scripts/check-audio.py <course> [lecture numbers… e.g. 01 02]

Writes .audio-check/<course>.json (every cue with a 0–1 match ratio) and prints
the cues below 0.8. Most low scores are the recognizer picking other kanji for
the same sound (酸性基 → 3世紀); look for different *sounds*, e.g. 特異的 heard as
とくいまと. Fix those with a reading in src/engine/speech/reading.ts.
"""
import json, sys, os, time, difflib, re, glob
from faster_whisper import WhisperModel
import pykakasi
course, lecs = sys.argv[1], sys.argv[2:]
if not lecs:
    lecs = sorted(re.search(r'lecture-(\d+)\.mp3$', p).group(1) for p in glob.glob(f'public/courses/{course}/audio/lecture-*.mp3'))
kks = pykakasi.kakasi()
LET = dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'エー ビー シー ディー イー エフ ジー エイチ アイ ジェー ケー エル エム エヌ オー ピー キュー アール エス ティー ユー ブイ ダブリュー エックス ワイ ゼット'.split()))
def kana(t):
    t = re.sub(r'[A-Za-zＡ-Ｚ]', lambda m: LET.get(m.group(0).upper(), m.group(0)), t)
    t = re.sub(r'[、。？！,.?!「」（）()\s・ー〜~]', '', t)
    return ''.join(x['hira'] for x in kks.convert(t))
m = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=4)
base = f'public/courses/{course}/audio'
out = []
for L in lecs:
    man = json.load(open(f'{base}/lecture-{L}/manifest.json'))
    data = open(f'{base}/lecture-{L}.mp3', 'rb').read()
    narr = json.load(open(f'src/content/courses/{course}/narrations/lecture-{L}.json'))
    speech = {c['id']: c['speech'] for c in narr['cues']}
    t0 = time.time()
    for cid, c in man['cues'].items():
        if 'byteStart' not in c: continue
        p = '/tmp/cue.mp3'; open(p, 'wb').write(data[c['byteStart']:c['byteStart'] + c['byteLength']])
        segs, _ = m.transcribe(p, language='ja', beam_size=5, vad_filter=False, condition_on_previous_text=False)
        heard = ''.join(s.text for s in segs)
        exp = speech.get(cid, '')
        r = difflib.SequenceMatcher(None, kana(exp), kana(heard)).ratio()
        if r < 0.4:  # whisper sometimes hallucinates on long clips; retry with VAD
            segs, _ = m.transcribe(p, language='ja', beam_size=5, vad_filter=True, condition_on_previous_text=False)
            h2 = ''.join(s.text for s in segs); r2 = difflib.SequenceMatcher(None, kana(exp), kana(h2)).ratio()
            if r2 > r: heard, r = h2, r2
        out.append({'lec': L, 'id': cid, 'ratio': round(r, 3), 'expected': exp, 'heard': heard})
    print(L, len(man['cues']), 'cues', round(time.time() - t0), 's', flush=True)
os.makedirs('.audio-check', exist_ok=True)
json.dump(out, open(f'.audio-check/{course}.json', 'w'), ensure_ascii=False, indent=0)
for x in sorted(out, key=lambda x: x['ratio']):
    if x['ratio'] < 0.8: print(f"{x['lec']} {x['ratio']:.2f} | {x['expected'][:50]} | {x['heard'][:50]}")
