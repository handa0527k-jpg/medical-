"""Mouth openness per line of a story (from the recorded voice): RMS loudness at 30 fps, normalised per
line, fast attack / slower release → src/content/courses/<course>/story/lipsync.json ([[...], ...] in line order).
usage: python3 scripts/film/lipsync.py <course>"""
import json, os, subprocess, sys
import numpy as np, imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
course = sys.argv[1]
repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sdir = os.path.join(repo, 'src', 'content', 'courses', course, 'story')
st = json.load(open(os.path.join(sdir, 'story.json')))
mp3 = open(os.path.join(repo, 'public', 'courses', course, 'story', 'story.mp3'), 'rb').read()
out = []
for l in st['lines']:
    a, n = l['bytes']
    raw = subprocess.run([FF, '-v', 'quiet', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', '24000', '-'], input=mp3[a:a + n], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    hop = 800; k = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(k)]) if k else np.zeros(1)
    ref = np.percentile(rms[rms > 0.005], 90) if np.any(rms > 0.005) else 1
    v = np.clip((rms - 0.008) / (ref - 0.008 + 1e-6), 0, 1.15); sm, y = [], 0.0
    for q in v: y += (q - y) * (0.75 if q > y else 0.35); sm.append(round(float(min(1, y)), 2))
    out.append(sm)
json.dump(out, open(os.path.join(sdir, 'lipsync.json'), 'w'), separators=(',', ':'))
print(course, len(out), 'lines')
