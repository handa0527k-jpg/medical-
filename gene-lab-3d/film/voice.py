"""Record a film's narration and write the timeline the 3D scenes follow.

    SSL_CERT_FILE=/path/to/ca.pem python3 film/voice.py sanger

Reads film/<id>/script.json, synthesises every cue with Microsoft's neural
voice (edge-tts; cached per text in .cache/film-tts), and writes to
web/public/film/<id>/:
  narration.mp3   the whole narration with the pauses between cues
  timing.json     start / duration of every cue (seconds) + scene spans
The film page places every visual event relative to these cue starts, so the
pictures stay on the words whatever the voice's real pace is.
"""
import asyncio
import hashlib
import json
import os
import ssl
import subprocess
import sys
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEAD_IN = 0.8
DEFAULT_PAUSE = 0.45
RATE = 24000


async def synth(text, voice, rate, out):
    import edge_tts
    import edge_tts.communicate as C
    ca = os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE')
    if ca and os.path.exists(ca):
        C._SSL_CTX = ssl.create_default_context(cafile=ca)
    await edge_tts.Communicate(text, voice, rate=rate).save(out)


def to_wav(mp3, wav):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', str(RATE), wav], check=True)
    with wave.open(wav) as w:
        return w.getnframes() / w.getframerate()


def main(fid):
    src = os.path.join(ROOT, 'film', fid, 'script.json')
    script = json.load(open(src))
    cache = os.path.join(ROOT, '.cache', 'film-tts')
    out_dir = os.path.join(ROOT, 'web', 'public', 'film', fid)
    os.makedirs(cache, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    voice, rate = script['voice'], script.get('rate', '+0%')
    t = LEAD_IN
    cues, pieces = [], []
    for c in script['cues']:
        speech = c.get('speech', c['text'])
        key = hashlib.sha1(f'{voice}|{rate}|{speech}'.encode()).hexdigest()[:16]
        mp3 = os.path.join(cache, key + '.mp3')
        wav = os.path.join(cache, key + '.wav')
        if not os.path.exists(mp3):
            asyncio.run(synth(speech, voice, rate, mp3))
        dur = to_wav(mp3, wav)
        cues.append({'id': c['id'], 'scene': c['scene'], 'text': c['text'], 'start': round(t, 3), 'dur': round(dur, 3)})
        pieces.append((t, wav))
        t += dur + c.get('pause', DEFAULT_PAUSE)
        print(f"{c['id']} {dur:5.2f}s  {c['text'][:30]}")
    total = round(t + 0.6, 3)
    scenes = []
    for s in script['scenes']:
        mine = [c for c in cues if c['scene'] == s['id']]
        if mine:
            scenes.append({'id': s['id'], 'label': s['label'], 'start': mine[0]['start'], 'end': mine[-1]['start'] + mine[-1]['dur']})
    for a, b in zip(scenes, scenes[1:]):
        a['end'] = b['start']  # a scene lasts until the next one begins
    scenes[-1]['end'] = total

    # mix every cue onto one silent track at its start time
    import numpy as np
    track = np.zeros(int(total * RATE) + RATE, dtype=np.int16)
    for start, wav in pieces:
        with wave.open(wav) as w:
            pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        i = int(start * RATE)
        track[i:i + len(pcm)] = pcm
    mix = os.path.join(cache, f'{fid}-narration.wav')
    with wave.open(mix, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(track.tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mix, '-c:a', 'libmp3lame', '-b:a', '128k',
                    os.path.join(out_dir, 'narration.mp3')], check=True)
    timing = {'id': fid, 'title': script['title'], 'subtitle': script.get('subtitle', ''), 'duration': total,
              'voice': voice, 'scenes': scenes, 'cues': cues}
    with open(os.path.join(out_dir, 'timing.json'), 'w') as f:
        json.dump(timing, f, ensure_ascii=False, indent=1)
    print(f'total {total:.1f}s ({total / 60:.1f} min), {len(cues)} cues')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'sanger')
