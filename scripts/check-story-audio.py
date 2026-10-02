"""
Transcribe the story anime voices and compare them with the intended reading (see check-audio.py).

    npx tsx scripts/build-story-speech.ts
    python3 scripts/check-story-audio.py <course…>

Writes .audio-check/story-<course>.json and prints the lines below 0.8.
"""
import json, sys, os, difflib, re
from faster_whisper import WhisperModel
import pykakasi
kks = pykakasi.kakasi()
LET = dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'エー ビー シー ディー イー エフ ジー エイチ アイ ジェー ケー エル エム エヌ オー ピー キュー アール エス ティー ユー ブイ ダブリュー エックス ワイ ゼット'.split()))
def kana(t):
    t = re.sub(r'[A-Za-zＡ-Ｚ]', lambda m: LET.get(m.group(0).upper(), m.group(0)), t)
    t = re.sub(r'[、。？！,.?!「」（）()\s・ー〜~…]', '', t)
    return ''.join(x['hira'] for x in kks.convert(t))
m = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=4)
for course in sys.argv[1:]:
    spec = json.load(open(f'.audio-cache/story/{course}.json'))
    story = json.load(open(f'src/content/courses/{course}/story/story.json'))
    out = []
    blob = open(f'public/courses/{course}/story/story.mp3', 'rb').read()
    p = f'/tmp/story-line-{os.getpid()}.mp3'
    for x, l in zip(spec, story['lines']):
        a, n = l['bytes']
        open(p, 'wb').write(blob[a:a + n])
        segs, _ = m.transcribe(p, language='ja', beam_size=5, vad_filter=False, condition_on_previous_text=False)
        heard = ''.join(s.text for s in segs)
        r = difflib.SequenceMatcher(None, kana(x['speech']), kana(heard)).ratio()
        out.append({'i': x['i'], 'ratio': round(r, 3), 'expected': x['speech'], 'heard': heard})
    os.makedirs('.audio-check', exist_ok=True)
    json.dump(out, open(f'.audio-check/story-{course}.json', 'w'), ensure_ascii=False, indent=0)
    print('==', course, flush=True)
    for y in sorted(out, key=lambda y: y['ratio']):
        if y['ratio'] < 0.8: print(f"{y['i']} {y['ratio']:.2f} | {y['expected'][:60]} | {y['heard'][:60]}", flush=True)
