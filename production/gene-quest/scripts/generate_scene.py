#!/usr/bin/env python3
"""シーン単位で映像を描画する（変更のないシーンは飛ばす）。

  python scripts/generate_scene.py                  # 全シーン（1920×1080）
  python scripts/generate_scene.py SC0302 SC0303    # 指定シーンだけ
  python scripts/generate_scene.py --preview        # 960×540 の確認用（video/previews/）
  python scripts/generate_scene.py --force SC0302   # 強制的に作り直す
  python scripts/generate_scene.py --list           # 状態の一覧

出力  video/scenes/<scene_id>.mp4（映像＋そのシーンのセリフ音声）、video/scenes/status.json、logs/render.jsonl
シーンの台本・タイミング・描画コードのどれかが変わると、そのシーンだけ作り直される（ハッシュで判定）。
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import VIDEO  # noqa: E402
from gqlib.render import load_timeline, render_scene, scene_hash  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("scenes", nargs="*")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--restamp", action="store_true",
                    help="描画コードのハッシュ方式だけを変えたときに、既存の動画を作り直さず現在のハッシュで記録し直す（scenes で除外を指定）")
    args = ap.parse_args()
    tl = load_timeline()
    scale = 0.5 if args.preview else 1.0
    out_dir = VIDEO / ("previews" if args.preview else "scenes")
    ids = args.scenes or [s["scene_id"] for s in tl["scenes"]]
    status_path = out_dir / "status.json"
    status = json.loads(status_path.read_text()) if status_path.exists() else {}
    if args.restamp:
        for s in tl["scenes"]:
            if s["scene_id"] in args.scenes or not (out_dir / f"{s['scene_id']}.mp4").exists():
                continue
            status.setdefault(s["scene_id"], {})["hash"] = scene_hash(s, scale)
        status_path.write_text(json.dumps(status, ensure_ascii=False, indent=1))
        print("記録し直した（除外：", args.scenes, "）")
        return
    if args.list:
        for s in tl["scenes"]:
            st = status.get(s["scene_id"], {})
            ok = (out_dir / f"{s['scene_id']}.mp4").exists() and st.get("hash") == scene_hash(s, scale)
            print(f"{s['scene_id']}  {s['duration']:6.1f}s  {'済' if ok else '未'}  {st.get('time', '')}")
        return
    t0 = time.time()
    total = sum(s["frames"] for s in tl["scenes"] if s["scene_id"] in ids)
    done = 0
    for s in tl["scenes"]:
        if s["scene_id"] not in ids:
            continue
        t1 = time.time()
        try:
            out = render_scene(s["scene_id"], scale=scale, workers=args.workers, force=args.force, tl=tl, out_dir=out_dir)
            done += s["frames"]
            print(f"[{100 * done / total:5.1f}%] {s['scene_id']} {s['duration']:.1f}s → {out.name}（{time.time() - t1:.0f}s）",
                  flush=True)
        except Exception as e:  # 1シーンの失敗で全体を止めない。失敗したシーンは次の実行で作り直される
            print(f"！ {s['scene_id']} 失敗: {type(e).__name__}: {e}", flush=True)
    print(f"完了 {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
