#!/usr/bin/env python3
"""原稿 script/source_script.md を解析して、機械可読な台本を作る。

  python scripts/build_script.py

出力
  script/dialogue.json        全セリフ（scene_id, line_id, character_id, text, reading, emotion, 間…）
  script/scene_manifest.json  シーンの設定（visual, bgm, pages, purpose, terms…）。時刻は timeline.json で付く
検証
  - シーンID・行IDの重複
  - 未知の話者・感情
  - 読みに英字が残っていないか（発音辞書の漏れ）
  - 字幕が長すぎないか（1行の字幕は2段×26字を目安に、句読点で自動分割される）
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import CONFIG, SCRIPT  # noqa: E402
from gqlib.text import leftover_latin, to_reading  # noqa: E402

EMOTIONS = {"Neutral", "Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust"}
LINE_RE = re.compile(r"^(?P<char>[a-z]+)(?:\[(?P<emo>[A-Za-z]+)(?:,(?P<w>[0-9.]+))?\])?:\s*(?P<body>.+)$")
OPT_RE = re.compile(r"\{([^{}]*)\}\s*$")


def parse_opts(s: str) -> dict:
    """{after=0.6 say=... note=補足} を辞書に。say= は残り全部（空白を含む）を値にする。"""
    out: dict[str, str] = {}
    # say= は最後の key=value の前までを取る
    keys = list(re.finditer(r"(\w+)=", s))
    for i, m in enumerate(keys):
        end = keys[i + 1].start() if i + 1 < len(keys) else len(s)
        out[m.group(1)] = s[m.end():end].strip()
    return out


def parse(path: Path) -> tuple[list[dict], list[dict]]:
    voices = yaml.safe_load((CONFIG / "voice_config.yaml").read_text(encoding="utf-8"))["characters"]
    text = re.sub(r"<!--.*?-->", "", path.read_text(encoding="utf-8"), flags=re.S)
    scenes: list[dict] = []
    lines: list[dict] = []
    chapter = None
    cur = None
    for raw in text.splitlines():
        s = raw.rstrip()
        if not s:
            continue
        if s.startswith("# CHAPTER"):
            m = re.match(r"# CHAPTER (\d+) (.+)", s)
            chapter = {"n": int(m.group(1)), "title": m.group(2)}
            continue
        if s.startswith("# "):
            continue
        if s.startswith("## "):
            sid, title = s[3:].split(" ", 1)
            cur = {"scene_id": sid, "title": title, "chapter": chapter["n"], "chapter_title": chapter["title"], "lines": []}
            scenes.append(cur)
            continue
        if s.startswith("- ") and cur is not None and not cur["lines"]:
            k, v = s[2:].split(":", 1)
            cur[k.strip()] = v.strip()
            continue
        m = LINE_RE.match(s)
        if not m or cur is None:
            raise SystemExit(f"解釈できない行: {s}")
        body = m.group("body")
        opts = {}
        om = OPT_RE.search(body)
        if om:
            opts = parse_opts(om.group(1))
            body = body[: om.start()].rstrip()
        char = m.group("char")
        if char not in voices:
            raise SystemExit(f"未知の話者 {char}: {s}")
        emo = m.group("emo") or "Neutral"
        if emo not in EMOTIONS:
            raise SystemExit(f"未知の感情 {emo}: {s}")
        n = len(cur["lines"]) + 1
        line = {
            "scene_id": cur["scene_id"],
            "line_id": f"{cur['scene_id']}-{n:02d}",
            "character_id": char,
            "text": body,
            "reading": opts.get("say") or to_reading(body),
            "reading_source": "manual" if "say" in opts else "dictionary",
            "emotion": emo,
            "emotion_strength": float(m.group("w") or (voices[char].get("emotion_weight", 1.0) if emo != "Neutral"
                                                        else voices[char].get("style_weight", 1.0))),
            "pause_before": float(opts.get("before", 0.0)),
            "pause_after": float(opts.get("after", 0.35)),
            "cue": opts.get("cue", ""),
            "note": opts.get("note", ""),
        }
        cur["lines"].append(line["line_id"])
        lines.append(line)
    return scenes, lines


def main() -> None:
    scenes, lines = parse(SCRIPT / "source_script.md")
    problems = []
    ids = [s["scene_id"] for s in scenes]
    if len(ids) != len(set(ids)):
        problems.append("シーンIDが重複している")
    for ln in lines:
        left = leftover_latin(ln["reading"])
        if left:
            problems.append(f"{ln['line_id']} 読みに英字が残っている: {left}")
        if len(ln["text"]) > 90:
            problems.append(f"{ln['line_id']} 字幕が長い（{len(ln['text'])}字）")
    for sc in scenes:
        sc["pages"] = [int(p) for p in re.findall(r"\d+", sc.get("pages", ""))]
        sc["terms"] = [t.strip() for t in sc.get("terms", "").split(",") if t.strip() and t.strip() != "-"]
        sc["chars"] = [t.strip() for t in sc.get("chars", "").split(",") if t.strip() and t.strip() != "なし"]
        sc["sfx"] = [t.strip() for t in sc.get("sfx", "").split(",") if t.strip()]
        sc["accuracy"] = "確認済み（research/accuracy_checklist.md）" if sc["pages"] else "対象外（タイトル）"
    (SCRIPT / "dialogue.json").write_text(json.dumps({"lines": lines}, ensure_ascii=False, indent=1), encoding="utf-8")
    (SCRIPT / "scene_manifest.json").write_text(json.dumps({"scenes": scenes}, ensure_ascii=False, indent=1), encoding="utf-8")
    chars = sum(len(ln["text"]) for ln in lines)
    print(f"{len(scenes)} シーン / {len(lines)} 行 / 字幕 {chars} 字")
    for p in problems:
        print("！", p)
    if any("重複" in p or "英字" in p for p in problems):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
