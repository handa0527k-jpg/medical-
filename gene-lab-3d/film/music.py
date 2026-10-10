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
        src = os.path.join(src_dir, f'{fid}.mp3')
        if not os.path.exists(src):
            subprocess.run(['curl', '-sSL', '--max-time', '600', '-o', src, m['base'] + f['file']], check=True)
        dur = json.load(open(os.path.join(ROOT, 'web', 'public', 'film', fid, 'timing.json')))['duration'] + 1.0
        out = os.path.join(out_dir, f'{fid}.wav')
        af = f'apad,atrim=0:{dur:.2f},afade=t=in:d=1.5,afade=t=out:st={dur - 4:.2f}:d=4,loudnorm=I=-27:TP=-3:LRA=11'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '44100', '-ac', '2', out], check=True)
        print(out, f['title'])


if __name__ == '__main__':
    main(sys.argv[1:])
