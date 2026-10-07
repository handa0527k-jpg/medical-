#!/usr/bin/env python3
"""Record the narration (edge-tts) and lay the lines out on the film clock.

    python3 production/gene-quest/voice.py

Each line is recorded once into .audio-cache/gene-quest/<hash>.mp3 (hash of voice + rate + reading),
so re-running only records changed lines. A line starts at its time in script.json, or right after
the previous line if that one is still speaking. When a block would run into the next one, its lines
are re-recorded a little faster (up to +10%); if that is still not enough, it
and the blocks after it slide later. The result is written to timing.json.
"""
import asyncio, hashlib, json, os, ssl, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(ROOT, '.audio-cache', 'gene-quest')
GAP = 0.35
BLOCK_GAP = 1.2
MAX_FASTER = 10


def _ssl_context():
    ca = os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE') or '/root/.ccr/ca-bundle.crt'
    return ssl.create_default_context(cafile=ca) if os.path.exists(ca) else None


async def synthesize(text, voice, pitch, rate, out):
    from edge_tts import communicate as C  # type: ignore
    ctx = _ssl_context()
    if ctx is not None:
        C._SSL_CTX = ctx
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
    tmp = out + '.part'
    for k in range(4):
        try:
            await C.Communicate(text, voice, rate=rate, pitch=pitch, proxy=proxy).save(tmp)
            if os.path.getsize(tmp) > 200:
                os.replace(tmp, out)
                return
        except Exception as e:
            print('  retry', k + 1, e, flush=True)
        await asyncio.sleep(2 ** (k + 1))
    raise RuntimeError(f'could not record: {text[:30]}')


def speech_len(path):
    """Length of the spoken part (edge-tts pads ~0.1 s of silence at the end)."""
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'silencedetect=n=-45dB:d=0.12', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    from mutagen.mp3 import MP3  # type: ignore
    total = float(MP3(path).info.length)
    ends = [float(l.split('silence_start: ')[1]) for l in out.splitlines() if 'silence_start: ' in l]
    tail = [e for e in ends if e > total - 0.8]
    return round(min(tail) if tail else total, 3), round(total, 3)


def rate_str(base, extra):
    v = int(base.rstrip('%')) + extra
    return f'{v:+d}%'


async def record(lines, voices, extra):
    os.makedirs(CACHE, exist_ok=True)
    sem = asyncio.Semaphore(5)

    async def one(l):
        voice, pitch, rate = voices[l['who']]
        rate = rate_str(rate, extra.get(l['id'], 0))
        speech = l.get('speech', l['text'])
        h = hashlib.sha1(f'{voice}|{pitch}|{rate}|{speech}'.encode()).hexdigest()[:12]
        path = os.path.join(CACHE, f'{h}.mp3')
        if not os.path.exists(path):
            async with sem:
                await synthesize(speech, voice, pitch, rate, path)
                print('  rec', l['id'], rate, speech[:20], flush=True)
        l['file'] = os.path.relpath(path, ROOT)
        l['rate'] = rate
        l['dur'], l['fileDur'] = speech_len(path)

    await asyncio.gather(*(one(l) for l in lines))


def layout(script):
    """Blocks keep their planned start unless the previous block is still speaking; then the block
    (and every block after it) slides later by just enough, keeping its inner spacing."""
    t = 0.0
    shift = 0.0
    out = []
    for b in script['blocks']:
        if t:
            shift = max(shift, t + BLOCK_GAP - b['start'])
        b['at'] = round(b['start'] + shift, 3)
        for l in b['lines']:
            start = max(l['t'] + shift, t + GAP if t else l['t'])
            l['start'] = round(start, 3)
            l['end'] = round(start + l['dur'], 3)
            t = l['end']
        b['over'] = round(t - (b['end'] + shift), 3)
        out.append(b)
    return out


async def main():
    script = json.load(open(os.path.join(HERE, 'script.json')))
    lines = []
    for b in script['blocks']:
        for i, l in enumerate(b['lines']):
            l['id'] = f"{b['id']}-{i + 1}"
            l['block'] = b['id']
            lines.append(l)
    extra = {}
    for _ in range(4):
        await record(lines, script['voices'], extra)
        blocks = layout(script)
        late = [b for b in blocks if b['over'] > 0.15 and b is not blocks[-1]
                and any(extra.get(l['id'], 0) < MAX_FASTER for l in b['lines'])]
        if not late:
            break
        for b in late:
            for l in b['lines']:
                extra[l['id']] = min(MAX_FASTER, extra.get(l['id'], 0) + 6)
            print('  faster:', b['id'], f"+{b['over']}s", flush=True)
    end = max(l['end'] for l in lines)
    for b in blocks:
        print(f"{b['id']} {b['scene']:9s} {b['start']:6.1f} -> {b['at']:6.1f}  speech ends {b['lines'][-1]['end']:7.2f}  over {b['over']:+.2f}")
    for i, b in enumerate(timing_blocks := blocks):
        b['endAt'] = blocks[i + 1]['at'] if i + 1 < len(blocks) else None
    timing = {
        'title': script['title'],
        'voiceEnd': end,
        'duration': max(script['duration'], round(end + 6.5, 1)),
        'blocks': [{'id': b['id'], 'scene': b['scene'], 'plan': b['start'], 'start': b['at'], 'end': b['endAt']} for b in blocks],
        'lines': [{k: l[k] for k in ('id', 'block', 'who', 'text', 'start', 'end', 'dur', 'file', 'rate')} for l in lines],
    }
    json.dump(timing, open(os.path.join(HERE, 'timing.json'), 'w'), ensure_ascii=False, indent=1)
    print('voice ends at', end, '→ film', timing['duration'], 's')


if __name__ == '__main__':
    asyncio.run(main())
