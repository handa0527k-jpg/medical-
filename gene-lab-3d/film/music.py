"""Prepare each film's background music: a bright public-domain classical
recording from the Musopen collection (film/music.json).

    python3 film/music.py sanger pcr ...      # -> .cache/film-bgm/<id>.wav

Downloads the recording (cached in .cache/film-music), cuts it to the film's
length with a fade in / fade out, and normalises it to a quiet -27 LUFS so the
narration stays on top. finish.sh mixes it under the narration with ducking.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(ids):
    m = json.load(open(os.path.join(ROOT, 'film', 'music.json')))
    src_dir = os.path.join(ROOT, '.cache', 'film-music')
    out_dir = os.path.join(ROOT, '.cache', 'film-bgm')
    os.makedirs(src_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    for fid in ids or list(m['films']):
        f = m['films'][fid]
        files = f.get('files') or [f['file']]
        parts = []
        for i, name in enumerate(files):
            part = os.path.join(src_dir, f'{fid}.mp3' if len(files) == 1 else f'{fid}-{i}.mp3')
            if not os.path.exists(part):
                subprocess.run(['curl', '-sSL', '--max-time', '600', '-o', part, m['base'] + name], check=True)
            parts.append(part)
        src = parts[0]
        if len(parts) > 1:
            # several movements, joined with a short crossfade (and repeated if the film is longer)
            src = os.path.join(src_dir, f'{fid}-joined.wav')
            if not os.path.exists(src):
                ins = sum([['-i', p] for p in parts], [])
                n = len(parts)
                chain = ''.join(f'[{i}:a]' for i in range(n))
                fc = '[0:a][1:a]acrossfade=d=3[x1]' + ''.join(f';[x{i}][{i + 1}:a]acrossfade=d=3[x{i + 1}]' for i in range(1, n - 1))
                subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', fc, '-map', f'[x{n - 1}]', src], check=True)
        dur = json.load(open(os.path.join(ROOT, 'web', 'public', 'film', fid, 'timing.json')))['duration'] + 1.0
        out = os.path.join(out_dir, f'{fid}.wav')
        af = f'apad,atrim=0:{dur:.2f},afade=t=in:d=1.5,afade=t=out:st={dur - 4:.2f}:d=4,loudnorm=I=-27:TP=-3:LRA=11'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '1', '-i', src, '-af', af, '-ar', '44100', '-ac', '2', out], check=True)
        print(out, f['title'])


if __name__ == '__main__':
    main(sys.argv[1:])
