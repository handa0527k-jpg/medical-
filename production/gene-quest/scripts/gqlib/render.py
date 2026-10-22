"""シーンを動画にする（フレームを skia で描き、FFmpeg に生の画素を渡す）。

1シーンのフレームを workers 個の連続区間に分け、別々のプロセスで描いて H.264 の断片にし、最後に無劣化で連結する。
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import skia

from .draw import H, W
from .paths import AUDIO, LOGS, SCRIPT, VIDEO
from .scene import FPS, Scene

VISUALS: dict[str, callable] = {}


def visual(name: str):
    def deco(fn):
        VISUALS[name] = fn
        return fn
    return deco


def _load_visuals():
    from . import scenes  # noqa: F401  （各章のモジュールが @visual で登録する）


def load_timeline() -> dict:
    return json.loads((SCRIPT / "timeline.json").read_text(encoding="utf-8"))


def scene_dict(scene_id: str, tl: dict | None = None) -> dict:
    tl = tl or load_timeline()
    for s in tl["scenes"]:
        if s["scene_id"] == scene_id:
            return s
    raise KeyError(scene_id)


def draw_frame(c: skia.Canvas, sd: dict, t: float):
    _load_visuals()
    S = Scene(sd)
    fn = VISUALS.get(sd.get("visual") or "")
    if fn is None:
        raise KeyError(f"{sd['scene_id']}: visual '{sd.get('visual')}' が未実装")
    fn(c, t, S)


def still(sd: dict, t: float, path: Path, scale: float = 0.5):
    w, h = int(W * scale), int(H * scale)
    surf = skia.Surface(w, h)
    c = surf.getCanvas()
    c.clear(0xFF000000)
    c.save()
    c.scale(scale, scale)
    draw_frame(c, sd, t)
    c.restore()
    surf.makeImageSnapshot().save(str(path))


def _render_chunk(args) -> tuple[str, float]:
    sd, f0, f1, out, scale, crf, preset = args
    _load_visuals()
    w, h = int(W * scale), int(H * scale)
    surf = skia.Surface(w, h)
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{w}x{h}", "-r", str(FPS),
           "-i", "-", "-an", "-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p",
           "-g", "60", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    S = Scene(sd)
    fn = VISUALS[sd["visual"]]
    for f in range(f0, f1):
        c = surf.getCanvas()
        c.clear(0xFF000000)
        c.save()
        c.scale(scale, scale)
        fn(c, f / FPS, S)
        c.restore()
        arr = surf.makeImageSnapshot().toarray(colorType=skia.kBGRA_8888_ColorType)
        p.stdin.write(arr.tobytes())
    p.stdin.close()
    p.wait()
    if p.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {out}")
    return out, time.time() - t0


def code_hash(visual: str | None = None) -> str:
    """描画コードのハッシュ。共通部品（gqlib/*.py）と、その visual を定義した章のモジュール
    （とそこから import している章）だけを含める。ある章を直しても、ほかの章は作り直さない。"""
    import re
    h = hashlib.sha1()
    base = Path(__file__).resolve().parent
    files = sorted(base.glob("*.py"))
    if visual is None:
        files += sorted((base / "scenes").glob("*.py"))
    else:
        _load_visuals()
        mod = Path(VISUALS[visual].__code__.co_filename)
        todo, seen = [mod], set()
        while todo:
            f = todo.pop()
            if f in seen:
                continue
            seen.add(f)
            for m in re.findall(r"from \.(\w+) import", f.read_text(encoding="utf-8")):
                todo.append(f.parent / f"{m}.py")
        files += sorted(seen)
    for p in files:
        h.update(p.read_bytes())
    return h.hexdigest()[:12]


def scene_hash(sd: dict, scale: float) -> str:
    key = json.dumps(sd, sort_keys=True, ensure_ascii=False) + code_hash(sd.get("visual")) + str(scale)
    return hashlib.sha1(key.encode()).hexdigest()[:16]


def render_scene(scene_id: str, scale: float = 1.0, workers: int = 4, crf: int = 16, preset: str = "veryfast",
                 out_dir: Path | None = None, force: bool = False, tl: dict | None = None, mux_audio: bool = True) -> Path:
    _load_visuals()
    sd = scene_dict(scene_id, tl)
    out_dir = out_dir or (VIDEO / ("previews" if scale < 1 else "scenes"))
    out_dir.mkdir(parents=True, exist_ok=True)
    final = out_dir / f"{scene_id}.mp4"
    status_path = out_dir / "status.json"
    status = json.loads(status_path.read_text()) if status_path.exists() else {}
    h = scene_hash(sd, scale)
    if not force and final.exists() and status.get(scene_id, {}).get("hash") == h:
        return final
    n = sd["frames"]
    workers = max(1, min(workers, n // 20 or 1))
    tmp = out_dir / f".tmp_{scene_id}"
    tmp.mkdir(exist_ok=True)
    bounds = [round(n * i / workers) for i in range(workers + 1)]
    jobs = [(sd, bounds[i], bounds[i + 1], str(tmp / f"part{i:02d}.mp4"), scale, crf, preset) for i in range(workers)]
    t0 = time.time()
    if workers == 1:
        results = [_render_chunk(jobs[0])]
    else:
        with ProcessPoolExecutor(workers) as ex:
            results = list(ex.map(_render_chunk, jobs))
    lst = tmp / "list.txt"
    lst.write_text("".join(f"file '{Path(r[0]).name}'\n" for r in results))
    video_only = tmp / "video.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(video_only)],
                   check=True)
    wav = AUDIO / "dialogue" / "scenes" / f"{scene_id}.wav"
    if mux_audio and wav.exists():
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(video_only), "-i", str(wav), "-c:v", "copy", "-c:a", "aac",
                        "-b:a", "160k", "-shortest", str(final)], check=True)
    else:
        os.replace(video_only, final)
    for p in tmp.iterdir():
        p.unlink()
    tmp.rmdir()
    dt = time.time() - t0
    status[scene_id] = {"hash": h, "frames": n, "seconds": round(dt, 1), "fps_render": round(n / dt, 1),
                        "time": time.strftime("%Y-%m-%d %H:%M:%S")}
    status_path.write_text(json.dumps(status, ensure_ascii=False, indent=1))
    LOGS.mkdir(exist_ok=True)
    with open(LOGS / "render.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({"time": status[scene_id]["time"], "task": "render", "scene": scene_id, "scale": scale,
                            "frames": n, "seconds": round(dt, 1), "output": str(final), "status": "ok"}, ensure_ascii=False) + "\n")
    return final
