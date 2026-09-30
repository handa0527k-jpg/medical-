#!/usr/bin/env python3
"""
Record lecture narration as audio files (one per cue) with a neural Japanese voice,
and write the manifest the lecture player picks up automatically.

    pip install edge-tts mutagen
    python3 scripts/generate-audio.py histology-cytoplasm [--voice ja-JP-NanamiNeural] [--lecture 1]

Output: public/courses/<course>/audio/lecture-NN/{<cue-id>.mp3, manifest.json}

Needs network access to the TTS service. Voice suggestions (calm, lecture-like):
ja-JP-NanamiNeural (female), ja-JP-KeitaNeural (male). The manifest records the
narration version; if narration is regenerated, the player ignores stale audio
and falls back to the device voice until you re-record.
Swap `synthesize()` to use another provider (Google Cloud TTS, Azure, VOICEVOX…).
"""
import argparse, asyncio, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


async def synthesize(text: str, voice: str, out: str, rate: str) -> None:
    import edge_tts  # type: ignore
    await edge_tts.Communicate(text, voice, rate=rate).save(out)


def duration(path: str) -> float:
    from mutagen.mp3 import MP3  # type: ignore
    return float(MP3(path).info.length)


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('course')
    ap.add_argument('--voice', default='ja-JP-NanamiNeural')
    ap.add_argument('--rate', default='-4%', help='slightly slower than default reads like a lecture')
    ap.add_argument('--lecture', type=int, default=0, help='only this lecture (default: all)')
    a = ap.parse_args()
    ndir = os.path.join(ROOT, 'src/content/courses', a.course, 'narrations')
    if not os.path.isdir(ndir):
        sys.exit(f'no narrations for {a.course} (run npm run build:narration)')
    for f in sorted(os.listdir(ndir)):
        lec = json.load(open(os.path.join(ndir, f), encoding='utf-8'))
        if a.lecture and lec['chapter'] != a.lecture:
            continue
        name = f.replace('.json', '')
        out = os.path.join(ROOT, 'public/courses', a.course, 'audio', name)
        os.makedirs(out, exist_ok=True)
        manifest = {'voice': a.voice, 'version': lec['version'], 'cues': {}}
        for i, c in enumerate(lec['cues']):
            if not c['speech']:
                continue
            mp3 = os.path.join(out, c['id'] + '.mp3')
            if not os.path.exists(mp3):
                await synthesize(c['speech'], a.voice, mp3, a.rate)
            manifest['cues'][c['id']] = {'src': c['id'] + '.mp3', 'duration': round(duration(mp3), 3)}
            print(f"\r{name}: {i + 1}/{len(lec['cues'])}", end='', flush=True)
        json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f"\n{name}: wrote {len(manifest['cues'])} files")


if __name__ == '__main__':
    asyncio.run(main())
