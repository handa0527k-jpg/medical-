#!/usr/bin/env python3
"""シーンの静止画を書き出す（確認用）。

  python scripts/still.py SC0104 3.5 8 12    # SC0104 の 3.5秒・8秒・12秒
  python scripts/still.py SC0104 --grid 6    # 等間隔に6枚を1枚にまとめる
出力  video/previews/stills/<scene>_<t>.png
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import VIDEO  # noqa: E402
from gqlib.render import scene_dict, still  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("scene")
ap.add_argument("times", nargs="*", type=float)
ap.add_argument("--grid", type=int)
ap.add_argument("--scale", type=float, default=0.5)
a = ap.parse_args()
sd = scene_dict(a.scene)
out = VIDEO / "previews" / "stills"
out.mkdir(parents=True, exist_ok=True)
times = a.times or [sd["duration"] * (i + 0.5) / (a.grid or 4) for i in range(a.grid or 4)]
paths = []
for t in times:
    p = out / f"{a.scene}_{t:06.2f}.png"
    still(sd, t, p, a.scale)
    paths.append(p)
if a.grid:
    from PIL import Image
    ims = [Image.open(p) for p in paths]
    w, h = ims[0].size
    cols = 2 if len(ims) <= 4 else 3
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (w * cols, h * rows))
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    sp = out / f"{a.scene}_grid.png"
    sheet.save(sp)
    print(sp)
else:
    for p in paths:
        print(p)
