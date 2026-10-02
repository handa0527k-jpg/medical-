"""Mix the soundtrack from script/timeline.json: voices, sound effects, ambiences and music.

- Music is ducked automatically under dialogue (sidechain from the line timings: −9 dB, 0.15 s attack,
  0.6 s release); ambiences dip −3 dB.
- Ambiences loop with crossfades; music plays from an offset with fade in/out.
- Master: gentle soft-clip limiter, peak −1 dBFS.

usage: python3 scripts/film/mix.py <production dir> OUT.wav [--from S] [--to S] [--bed]
  --bed  everything except the voices (the app plays the voices itself and this track underneath)
"""
import json, os, subprocess, sys
import numpy as np, imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROD = sys.argv[1]
tl = json.load(open(os.path.join(PROD, 'timeline.json')))
MP3 = open(os.path.join(root, 'public', 'courses', tl['course'], 'story', 'story.mp3'), 'rb').read()

_cache = {}
def load(rel, data=None):
    if rel in _cache: return _cache[rel]
    if data is not None: raw = subprocess.run([FF, '-v', 'quiet', '-i', 'pipe:0', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], input=data, capture_output=True).stdout
    else: raw = subprocess.run([FF, '-v', 'quiet', '-i', os.path.join(root, rel), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    if len(x) == 0: raise RuntimeError('could not decode ' + rel)
    _cache[rel] = x; return x
db = lambda g: 10 ** (g / 20)
MASTER_DB = 4.5

def place(buf, x, t, gain=0.0, pan=0.0, fade_in=0.0, fade_out=0.0, length=None):
    i = int(round(t * SR))
    if length is not None: x = x[: int(length * SR)]
    x = x * db(gain)
    if pan: x = x * np.array([min(1, 1 - pan), min(1, 1 + pan)])
    n = len(x)
    if fade_in > 0: k = min(n, int(fade_in * SR)); x[:k] *= np.linspace(0, 1, k)[:, None]
    if fade_out > 0: k = min(n, int(fade_out * SR)); x[n - k:] *= np.linspace(1, 0, k)[:, None]
    a, b = max(0, i), min(len(buf), i + n)
    if b > a: buf[a:b] += x[a - i: b - i]

def looped(x, n, xf=1.0):
    k = int(xf * SR); out = np.zeros((n, 2)); pos = 0
    while pos < n:
        seg = x.copy()
        if pos > 0: seg[:k] *= np.linspace(0, 1, k)[:, None]
        seg[len(seg) - k:] *= np.linspace(1, 0, k)[:, None]
        m = min(len(seg), n - pos); out[pos:pos + m] += seg[:m]; pos += len(seg) - k
    return out

def main():
    out = sys.argv[2]
    bed = '--bed' in sys.argv
    a = float(sys.argv[sys.argv.index('--from') + 1]) if '--from' in sys.argv else 0.0
    b = float(sys.argv[sys.argv.index('--to') + 1]) if '--to' in sys.argv else tl['total']
    OFF = a
    N = int((b - a) * SR) + SR
    voice, sfx, music, ambb = (np.zeros((N, 2), dtype=np.float32) for _ in range(4))
    for l in tl['lines']:
        a0, n0 = l['bytes']
        if l['t1'] < a or l['t0'] > b: continue
        place(voice, load('voice:' + l['id'], MP3[a0:a0 + n0]), l['t0'] - OFF, 0)
    for e in tl['sfx']:
        if e['t'] > b or e['t'] < a - 30: continue
        x = load(e['file'])
        if e.get('rate'): idx = np.arange(0, len(x) - 1, e['rate']); x = x[idx.astype(int)]
        place(sfx, x, e['t'] - OFF, e.get('gain', 0), e.get('pan', 0), e.get('fadeIn', 0), e.get('fadeOut', 0.02), e.get('len'))
    for m in tl['bgm']:
        if m['t1'] < a or m['t0'] > b: continue
        x = load(m['file'])[int(m.get('offset', 0) * SR):]
        dur = m['t1'] - m['t0']
        place(music, x, m['t0'] - OFF, m.get('gain', -6), 0, m.get('fadeIn', 1.5), m.get('fadeOut', 2.0), dur)
    for m in tl['ambience']:
        if m['t1'] < a or m['t0'] > b: continue
        dur = m['t1'] - m['t0']; x = looped(load(m['file']), int(dur * SR))
        place(ambb, x, m['t0'] - OFF, m.get('gain', -18), 0, m.get('fadeIn', 0.5), m.get('fadeOut', 0.5))
    # dialogue sidechain → duck music and ambience
    mask = np.zeros(N)
    for l in tl['lines']: mask[max(0, int((l['t0'] - OFF - 0.15) * SR)): max(0, int((l['t1'] - OFF + 0.1) * SR))] = 1
    # smooth (attack ~0.15 s, release ~0.6 s) with a cheap one-pole on a decimated envelope
    hop = 480; m2 = mask[::hop]; sm = np.zeros_like(m2); y = 0.0
    for i, v in enumerate(m2):
        y += (v - y) * (0.35 if v > y else 0.016); sm[i] = y
    env = np.repeat(sm, hop)[:N]
    music *= db(-9 * env)[:, None]; ambb *= db(-3 * env)[:, None]
    mixb = (0 if bed else voice) + sfx + music + ambb
    seg = mixb[: int((b - a) * SR)].astype(np.float64)
    # fixed master gain (so a part and the whole film match), then a soft clip at the top
    seg = seg * db(MASTER_DB)
    seg = np.tanh(seg * 1.1) / np.tanh(1.1) * np.where(np.abs(seg) < 0.5, 1, 1)
    import wave
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((seg * 32767).astype('<i2').tobytes())
    print(out, f'{len(seg) / SR:.1f}s')

if __name__ == '__main__': main()
