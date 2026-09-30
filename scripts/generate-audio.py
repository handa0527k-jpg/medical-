#!/usr/bin/env python3
"""
Record the lecture narration with a neural Japanese voice.

    pip install edge-tts mutagen
    python3 scripts/generate-audio.py histology-cytoplasm [--voice ja-JP-NanamiNeural] [--rate=-3%] [--lecture 1]

For every lecture this writes

    public/courses/<course>/audio/lecture-NN.mp3            all sentences, back to back
    public/courses/<course>/audio/lecture-NN/manifest.json  where each sentence is

The manifest gives each cue's byte range in the MP3 (CBR frames, so any range
of whole clips is itself a valid MP3) and its exact duration. The player plays
single sentences out of the one file, so a lecture is one download and works on
hosts without HTTP range requests. Individual clips are cached in .audio-cache/
so re-running only synthesises new or changed sentences.

The manifest records the narration version: after `npm run build:narration`
changes the script, the player ignores stale audio until you re-run this.
Swap `synthesize()` to use another provider (Google Cloud TTS, Azure, VOICEVOX…).
"""
import argparse, asyncio, hashlib, json, os, ssl, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _ssl_context():
    # honour a custom CA bundle (corporate / sandbox proxies re-terminate TLS)
    ca = os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE')
    return ssl.create_default_context(cafile=ca) if ca and os.path.exists(ca) else None


async def synthesize(text: str, voice: str, rate: str, out: str) -> None:
    import edge_tts  # type: ignore
    from edge_tts import communicate as C  # type: ignore
    ctx = _ssl_context()
    if ctx is not None:
        C._SSL_CTX = ctx
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
    tmp = out + '.part'
    await C.Communicate(text, voice, rate=rate, proxy=proxy).save(tmp)
    if os.path.getsize(tmp) < 200:
        raise RuntimeError('empty audio')
    os.replace(tmp, out)


def duration(path: str) -> float:
    from mutagen.mp3 import MP3  # type: ignore
    return float(MP3(path).info.length)


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('course')
    ap.add_argument('--voice', default='ja-JP-NanamiNeural')
    ap.add_argument('--rate', default='-3%', help='a touch slower than default reads like a lecture')
    ap.add_argument('--lecture', type=int, default=0, help='only this lecture (default: all)')
    ap.add_argument('--jobs', type=int, default=8)
    a = ap.parse_args()

    ndir = os.path.join(ROOT, 'src/content/courses', a.course, 'narrations')
    if not os.path.isdir(ndir):
        sys.exit(f'no narrations for {a.course} (run npm run build:narration)')
    cache = os.path.join(ROOT, '.audio-cache', a.voice, a.rate)
    os.makedirs(cache, exist_ok=True)
    sem = asyncio.Semaphore(a.jobs)

    def clip_path(text: str) -> str:
        return os.path.join(cache, hashlib.sha1(text.encode()).hexdigest()[:20] + '.mp3')

    async def ensure(text: str) -> str:
        p = clip_path(text)
        if os.path.exists(p):
            return p
        async with sem:
            for attempt in range(5):
                try:
                    await synthesize(text, a.voice, a.rate, p)
                    return p
                except Exception as e:  # network hiccups: back off and retry
                    if attempt == 4:
                        raise RuntimeError(f'failed: {text[:30]}… ({e})')
                    await asyncio.sleep(2 ** attempt)
        return p

    outdir = os.path.join(ROOT, 'public/courses', a.course, 'audio')
    os.makedirs(outdir, exist_ok=True)
    for f in sorted(os.listdir(ndir)):
        lec = json.load(open(os.path.join(ndir, f), encoding='utf-8'))
        if a.lecture and lec['chapter'] != a.lecture:
            continue
        name = f.replace('.json', '')
        cues = [c for c in lec['cues'] if c['speech']]
        done = 0

        async def one(c):
            nonlocal done
            p = await ensure(c['speech'])
            done += 1
            print(f'\r{name}: {done}/{len(cues)}', end='', flush=True)
            return c['id'], p

        paths = dict(await asyncio.gather(*(one(c) for c in cues)))
        manifest = {'voice': a.voice, 'version': lec['version'], 'file': f'../{name}.mp3', 'cues': {}}
        pos = 0
        with open(os.path.join(outdir, name + '.mp3'), 'wb') as out:
            for c in cues:
                data = open(paths[c['id']], 'rb').read()
                out.write(data)
                manifest['cues'][c['id']] = {'byteStart': pos, 'byteLength': len(data), 'duration': round(duration(paths[c['id']]), 3)}
                pos += len(data)
        os.makedirs(os.path.join(outdir, name), exist_ok=True)
        json.dump(manifest, open(os.path.join(outdir, name, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        total = sum(x['duration'] for x in manifest['cues'].values())
        print(f'\r{name}: {len(cues)} sentences, {total / 60:.1f} min, {pos / 1e6:.1f} MB')


if __name__ == '__main__':
    asyncio.run(main())
