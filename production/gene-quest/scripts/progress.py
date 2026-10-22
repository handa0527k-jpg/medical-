#!/usr/bin/env python3
"""制作の進捗を、実際にある成果物から判定して表示する（未実行の工程を完了扱いにしない）。

  python scripts/progress.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import AUDIO, REPORTS, ROOT, SCRIPT, SUBS, VIDEO  # noqa: E402


def state(done: int, total: int) -> str:
    if total and done >= total:
        return "完了"
    return "未着手" if done == 0 else f"進行中（{done}/{total}）"


def main() -> None:
    rows = []
    rows.append(("PDF解析", "完了" if (ROOT / "research" / "lecture_summary.md").exists() and (ROOT / "research" / "pdf_text_raw.txt").exists() else "未着手"))
    lines = json.loads((SCRIPT / "dialogue.json").read_text(encoding="utf-8"))["lines"] if (SCRIPT / "dialogue.json").exists() else []
    rows.append(("脚本制作", "完了" if lines else "未着手"))
    man = AUDIO / "raw" / "manifest.json"
    n_tts = len(json.loads(man.read_text(encoding="utf-8"))) if man.exists() else 0
    rows.append(("音声生成", state(n_tts, len(lines))))
    rep = AUDIO / "processed" / "report.json"
    n_proc = len(json.loads(rep.read_text(encoding="utf-8"))) if rep.exists() else 0
    rows.append(("音声処理", state(n_proc, len(lines))))
    tlp = SCRIPT / "timeline.json"
    tl = json.loads(tlp.read_text(encoding="utf-8")) if tlp.exists() else {"scenes": []}
    rows.append(("タイムライン", "完了" if tl["scenes"] else "未着手"))
    rows.append(("字幕", "完了" if (SUBS / "gene_quest.srt").exists() else "未着手"))
    if tl["scenes"]:
        from gqlib.render import scene_hash
        st_path = VIDEO / "scenes" / "status.json"
        st = json.loads(st_path.read_text()) if st_path.exists() else {}
        ok = sum(1 for s in tl["scenes"] if (VIDEO / "scenes" / f"{s['scene_id']}.mp4").exists()
                 and st.get(s["scene_id"], {}).get("hash") == scene_hash(s, 1.0))
        rows.append(("シーン制作", state(ok, len(tl["scenes"]))))
    rows.append(("音声ミックス", "完了" if (AUDIO / "final" / "gene_quest_mix.wav").exists() else "未着手"))
    final = VIDEO / "final" / "gene_quest_full.mp4"
    rows.append(("動画統合", "完了" if final.exists() else "未着手"))
    ver = VIDEO / "final" / "verification.json"
    if ver.exists():
        v = json.loads(ver.read_text(encoding="utf-8"))
        rows.append(("技術検証", "完了" if all(v["checks"].values()) else f"問題あり {[k for k, x in v['checks'].items() if not x]}"))
    else:
        rows.append(("技術検証", "未着手"))
    rows.append(("発音の確認", "完了" if (REPORTS / "pronunciation_check.md").exists() else "未着手"))
    w = max(len(r[0]) for r in rows)
    for name, s in rows:
        print(f"{name}{'　' * (w - len(name))}：{s}")


if __name__ == "__main__":
    main()
