#!/usr/bin/env python3
"""Render 路地裏のゲノム: picture (parallel chunks of tools/comp.py) + soundtrack (tools/audio.py) + SRT.

    python3 tools/render.py sample            # sample/sample_30s.mp4 (0–30 s)
    python3 tools/render.py full [--jobs 3]   # final.mp4
"""
import argparse, json, os, subprocess, sys

PROD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(PROD, '.cache')
TL = json.load(open(os.path.join(PROD, 'timeline.json'), encoding='utf-8'))


def run(cmd):
    print('+', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True, cwd=PROD)


def srt(path, a, b):
    def ts(x):
        ms = max(0, round(x * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
    out = []
    for l in TL['lines']:
        if l['t1'] > a and l['t0'] < b:
            who = '' if l['who'] == 'N' else l['name'] + '「'
            end = '' if l['who'] == 'N' else '」'
            out.append(f"{len(out) + 1}\n{ts(l['t0'] - a)} --> {ts(min(b, l['t1'] + 0.35) - a)}\n{who}{l['text']}{end}\n")
    open(path, 'w', encoding='utf-8').write('\n'.join(out))


def picture(a, b, out, jobs):
    if jobs <= 1 or b - a < 60:
        run([sys.executable, 'tools/comp.py', '--from', str(a), '--to', str(b), '--out', out]); return
    step = (b - a) / jobs
    parts, procs = [], []
    for k in range(jobs):
        pa, pb = a + k * step, (a + (k + 1) * step if k < jobs - 1 else b)
        pa, pb = round(pa * 24) / 24, round(pb * 24) / 24
        p = os.path.join(C, f'part{k}.mp4'); parts.append(p)
        procs.append(subprocess.Popen([sys.executable, 'tools/comp.py', '--from', str(pa), '--to', str(pb), '--out', p], cwd=PROD))
    for p in procs:
        if p.wait():
            raise SystemExit('a chunk failed')
    lst = os.path.join(C, 'parts.txt')
    open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out])


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('what', choices=['sample', 'full']); ap.add_argument('--jobs', type=int, default=3)
    args = ap.parse_args()
    if args.what == 'sample':
        a, b = 0.0, 30.0
        dst = os.path.join(PROD, 'sample', 'sample_30s.mp4')
    else:
        a, b = 0.0, TL['total']
        dst = os.path.join(PROD, 'final.mp4')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    vid = os.path.join(C, f'{args.what}_picture.mp4'); wav = os.path.join(C, f'{args.what}.wav'); sub = dst[:-4] + '.srt'
    picture(a, b, vid, args.jobs)
    full = os.path.join(C, 'soundtrack.wav')  # the whole mix is built once (heavy: ~8 min, several GB)
    if not os.path.exists(full) or os.path.getmtime(full) < os.path.getmtime(os.path.join(PROD, 'timeline.json')):
        run([sys.executable, 'tools/audio.py', full])
    run(['ffmpeg', '-y', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', full, wav])
    srt(sub, a, b)
    fade = ['-af', f'afade=t=out:st={b - a - 1.5}:d=1.5'] if args.what == 'sample' else []
    vcodec = ['-vf', f'fade=t=out:st={b - a - 1.2}:d=1.2', '-c:v', 'libx264', '-crf', '19', '-preset', 'slow', '-tune', 'animation', '-pix_fmt', 'yuv420p'] \
        if args.what == 'sample' else ['-c:v', 'copy']
    run(['ffmpeg', '-y', '-v', 'error', '-i', vid, '-i', wav, '-i', sub, '-map', '0:v', '-map', '1:a', '-map', '2:s', *vcodec,
         *fade, '-c:a', 'aac', '-b:a', '192k', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=jpn',
         '-metadata', 'title=路地裏のゲノム', '-t', str(b - a), '-movflags', '+faststart', dst])
    print('done:', dst)


if __name__ == '__main__':
    main()
