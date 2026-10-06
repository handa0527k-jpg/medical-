#!/usr/bin/env python3
"""Voices for 路地裏のゲノム: one neural-TTS clip per line (edge-tts), trimmed, measured, and laid out on the
film's clock -> timeline.json (scene / line times + a 24 fps mouth envelope for lip sync) and voice.wav.

    python3 production/alley-genome/tools/tts.py            # synthesise what is missing, rebuild the timeline
Clips are cached by (voice, rate, pitch, text) in production/alley-genome/.cache/voice/.
"""
import asyncio, hashlib, json, os, ssl, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PROD = os.path.dirname(HERE)
CACHE = os.path.join(PROD, '.cache', 'voice')
SR = 48000
FPS = 24


def ssl_ctx():
    for ca in (os.environ.get('SSL_CERT_FILE'), os.environ.get('REQUESTS_CA_BUNDLE'), '/root/.ccr/ca-bundle.crt'):
        if ca and os.path.exists(ca):
            return ssl.create_default_context(cafile=ca)
    return None


async def synth(text, voice, rate, pitch, out):
    import edge_tts
    import edge_tts.communicate as C
    ctx = ssl_ctx()
    if ctx is not None:
        C._SSL_CTX = ctx
    for attempt in range(5):
        try:
            await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(out + '.part')
            os.replace(out + '.part', out)
            return
        except Exception as e:  # network hiccups: back off and retry
            print(f'  retry {attempt + 1}: {e}', file=sys.stderr)
            await asyncio.sleep(2 ** attempt)
    raise RuntimeError(f'TTS failed: {text}')


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def trim(x, thr=0.012, pad=0.05):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR)); b = min(len(x), idx[-1] + int(pad * 1.6 * SR))
    return x[a:b]


def envelope(x):
    hop = SR // FPS
    n = int(np.ceil(len(x) / hop))
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    e = e / (np.percentile(e, 95) + 1e-9)
    return [round(float(min(1.0, v)), 2) for v in e]


async def main():
    script = json.load(open(os.path.join(PROD, 'script.json'), encoding='utf-8'))
    cast = script['cast']
    os.makedirs(CACHE, exist_ok=True)
    jobs = []
    for sc in script['scenes']:
        for ln in sc['lines']:
            c = cast[ln['who']]
            say = ln.get('speech', ln['text'])
            key = hashlib.sha1(f"{c['voice']}|{c['rate']}|{c['pitch']}|{say}".encode()).hexdigest()[:16]
            ln['_clip'] = os.path.join(CACHE, key + '.mp3')
            if not os.path.exists(ln['_clip']):
                jobs.append((say, c['voice'], c['rate'], c['pitch'], ln['_clip']))
    print(f'{len(jobs)} clips to synthesise')
    sem = asyncio.Semaphore(4)

    async def run(j):
        async with sem:
            await synth(*j)
            print('  ok', j[0][:24])
    await asyncio.gather(*(run(j) for j in jobs))

    t = 0.0
    voice = []
    out = {'title': script['title'], 'fps': FPS, 'scenes': [], 'lines': []}
    for si, sc in enumerate(script['scenes']):
        s0 = t
        t += sc.get('lead', 1.0)
        for li, ln in enumerate(sc['lines']):
            x = trim(decode(ln['_clip']))
            d = len(x) / SR
            voice.append((t, x))
            out['lines'].append({'scene': sc['id'], 'i': li, 'who': ln['who'], 'name': cast[ln['who']]['name'],
                                 'text': ln['text'], 't0': round(t, 3), 't1': round(t + d, 3), 'env': envelope(x)})
            t += d + ln.get('gap', 0.6)
        t += sc.get('tail', 1.5)
        out['scenes'].append({'id': sc['id'], 'title': sc['title'], 'start': round(s0, 3), 'end': round(t, 3)})
    out['total'] = round(t, 3)
    json.dump(out, open(os.path.join(PROD, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    buf = np.zeros(int((t + 1) * SR), np.float32)
    for t0, x in voice:
        i = int(t0 * SR); buf[i:i + len(x)] += x
    import scipy.io.wavfile as W
    os.makedirs(os.path.join(PROD, '.cache'), exist_ok=True)
    W.write(os.path.join(PROD, '.cache', 'voice.wav'), SR, (np.clip(buf, -1, 1) * 32767).astype(np.int16))
    print(f"timeline: {len(out['lines'])} lines, {int(t // 60)}:{t % 60:04.1f}")
    for s in out['scenes']:
        print(f"  {s['id']:8s} {s['start']:7.1f} - {s['end']:7.1f}  ({s['end'] - s['start']:.1f}s)")


if __name__ == '__main__':
    asyncio.run(main())
