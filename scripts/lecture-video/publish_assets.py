#!/usr/bin/env python3
"""
Ship finished 授業動画 assets to the app (public/lecture-video/):

  <voiceKey>/voice.mp3            the Kokoro narration of a package (scenes back to back) — previews play it in sync
  <voiceKey>/kokoro_timing.json   its measured segment lengths — previews and layers are timed by it
  <voiceKey>/<intensity>.mp4      a film assembled by medstudy_video.py (if the package has out/lecture.mp4)
  index.json                      what exists, keyed by voice key / plan key

  python scripts/lecture-video/publish_assets.py production/lecture-video/genetics-basics-1-2/*
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / "public" / "lecture-video"


def ffmpeg() -> str:
    f = shutil.which("ffmpeg")
    if f:
        return f
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def main(dirs: list[str]) -> None:
    PUB.mkdir(parents=True, exist_ok=True)
    idx_f = PUB / "index.json"
    idx = json.loads(idx_f.read_text()) if idx_f.exists() else {"voices": {}, "videos": {}}
    for d in map(Path, dirs):
        m = json.loads((d / "medstudy_video.json").read_text(encoding="utf-8"))
        vk = m["kokoro"]["plan"]
        timing = d / "audio" / "kokoro_timing.json"
        if not timing.exists():
            print(f"skip {d}: no Kokoro timing"); continue
        out = PUB / vk
        out.mkdir(exist_ok=True)
        k = json.loads(timing.read_text(encoding="utf-8"))
        lst = d / "audio" / "_concat.txt"
        lst.write_text("".join(f"file '{(d / s['file']).resolve().as_posix()}'\n" for s in k["scenes"]))
        subprocess.run([ffmpeg(), "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", str(out / "voice.mp3")], check=True)
        lst.unlink()
        shutil.copy(timing, out / "kokoro_timing.json")
        idx["voices"][vk] = {"audio": f"{vk}/voice.mp3", "timing": f"{vk}/kokoro_timing.json"}
        film = d / "out" / "lecture-web.mp4"
        if not film.exists():
            film = d / "out" / "lecture.mp4"
        if film.exists():
            e = json.loads((d / "edit.json").read_text(encoding="utf-8"))
            if e.get("timing") != "kokoro":
                print(f"  {d}: the film was not built on measured timing — not shipped"); continue
            intensity = e["plan"].split("|")[3]
            shutil.copy(film, out / f"{intensity}.mp4")
            shots = [s for sc in e["scenes"] for s in sc["shots"]]
            wan = sum(1 for s in shots if (d / s["wan"]).exists())
            idx["videos"][e["plan"]] = {"file": f"{vk}/{intensity}.mp4", "wanShots": wan, "shots": len(shots), "seconds": e["total"], "built": __import__("datetime").date.today().isoformat()}
        print(f"  {vk}: voice{' + film' if film.exists() else ''}")
    idx_f.write_text(json.dumps(idx, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1:])
