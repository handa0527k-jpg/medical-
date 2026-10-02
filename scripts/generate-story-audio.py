#!/usr/bin/env python3
"""
Record the story anime voices (one MP3 per line).

    npx tsx scripts/build-story-speech.ts <course>
    python3 scripts/generate-story-audio.py <course>

Each line is recorded once into .audio-cache/story/<course>/<hash>.mp3 (hash of voice + reading),
so re-running only records new or changed lines. All lines are then joined into one file,
public/courses/<course>/story/story.mp3 (CBR frames, so any line's byte range is itself a valid
MP3); each line's byte range and measured duration are written back into story/story.json.
"""
import asyncio, hashlib, json, os, ssl, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _ssl_context():
    ca = os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE')
    return ssl.create_default_context(cafile=ca) if ca and os.path.exists(ca) else None


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
        except Exception as e:  # network hiccup: retry with backoff
            print('  retry', k + 1, e, flush=True)
        await asyncio.sleep(2 ** (k + 1))
    raise RuntimeError(f'could not record: {text[:30]}')


def duration(path):
    from mutagen.mp3 import MP3  # type: ignore
    return round(float(MP3(path).info.length), 3)


async def main():
    course = sys.argv[1]
    spec = json.load(open(os.path.join(ROOT, '.audio-cache/story', f'{course}.json')))
    sdir = os.path.join(ROOT, 'src/content/courses', course, 'story')
    adir = os.path.join(ROOT, '.audio-cache/story', course)
    pdir = os.path.join(ROOT, 'public/courses', course, 'story')
    os.makedirs(adir, exist_ok=True)
    os.makedirs(pdir, exist_ok=True)
    story_path = os.path.join(sdir, 'story.json')
    story = json.load(open(story_path))
    sem = asyncio.Semaphore(6)
    names = []

    async def one(x):
        h = hashlib.sha1(f"{x['voice']}|{x['pitch']}|{x['rate']}|{x['speech']}".encode()).hexdigest()[:12]
        name = f'{h}.mp3'
        path = os.path.join(adir, name)
        if not os.path.exists(path):
            async with sem:
                await synthesize(x['speech'], x['voice'], x['pitch'], x['rate'], path)
                print('  rec', x['i'], x['who'], x['speech'][:24], flush=True)
        return name

    names = await asyncio.gather(*(one(x) for x in spec))
    blob = bytearray()
    for l, name in zip(story['lines'], names):
        data = open(os.path.join(adir, name), 'rb').read()
        l.pop('file', None)
        l['bytes'] = [len(blob), len(data)]
        l['dur'] = duration(os.path.join(adir, name))
        blob += data
    for f in os.listdir(pdir):
        os.remove(os.path.join(pdir, f))
    open(os.path.join(pdir, 'story.mp3'), 'wb').write(blob)
    story['audio'] = hashlib.sha1(bytes(blob)).hexdigest()[:10]
    with open(story_path, 'w') as fh:
        json.dump(story, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    total = sum(l['dur'] for l in story['lines'])
    print(course, len(names), 'lines', round(total, 1), 's of voice')


asyncio.run(main())
