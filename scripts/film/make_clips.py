"""Cut the selected windows out of the converted CMU takes into src/engine/story/motion/clips.
usage: python3 scripts/film/make_clips.py [FULL_DIR]   (default .cache/mocap/full, filled by fetch_mocap.sh)
Walks get a gait cycle (`loop`: frame indices a..b with the most similar pose ~1–1.4 s apart)."""
import json, os, math
import sys
here = os.path.dirname(os.path.abspath(__file__)); repo = os.path.dirname(os.path.dirname(here))
mdir = os.path.join(repo, 'src', 'engine', 'story', 'motion')
full_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(repo, '.cache', 'mocap', 'full')
spec = json.load(open(os.path.join(mdir, 'clips.json')))
out_dir = os.path.join(mdir, 'clips'); os.makedirs(out_dir, exist_ok=True)
for f in os.listdir(out_dir): os.remove(os.path.join(out_dir, f))
for cid, s in spec.items():
    if cid.startswith('_'): continue
    d = json.load(open(os.path.join(full_dir, s['src'] + '.json')))
    a, b = int(s['from'] * 30), min(len(d['frames']), int(s['to'] * 30))
    fr, hd = d['frames'][a:b], d['headFwd'][a:b]
    o = {'fps': 30, 'joints': d['joints'], 'frames': [[[round(x, 3) for x in p] for p in f] for f in fr], 'headFwd': hd, 'src': d['src'], 'desc': s['desc']}
    f0 = fr[0]; dist = lambda a, b: math.dist(f0[a], f0[b])
    # standing height from bone lengths (pose independent): legs + pelvis→head + crown
    o['stature'] = round(dist(1, 2) + dist(2, 3) + 0.09 + abs(f0[0][1] - f0[1][1]) + dist(0, 9) + dist(9, 10) + dist(10, 11) + dist(11, 12) + dist(12, 13) + dist(13, 14) + 0.06, 3)
    if s.get('loop'):
        def rel(f): r = f[0]; return [(p[0] - r[0], p[1], p[2] - r[2]) for p in f]
        best = None
        for i in range(0, len(fr) - 30):
            A = rel(fr[i])
            for j in range(i + 28, min(len(fr), i + 45)):
                B = rel(fr[j]); e = sum((x[0]-y[0])**2 + (x[1]-y[1])**2 + (x[2]-y[2])**2 for x, y in zip(A, B))
                if best is None or e < best[0]: best = (e, i, j)
        o['loop'] = {'a': best[1], 'b': best[2]}
        print(cid, 'loop', best[1], best[2], f'err {best[0]:.4f}')
    json.dump(o, open(os.path.join(out_dir, cid + '.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    print(cid, len(fr), 'frames')
