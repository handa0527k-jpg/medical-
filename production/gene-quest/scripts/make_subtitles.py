#!/usr/bin/env python3
"""タイムラインから日本語字幕を作る。

  python scripts/make_subtitles.py

出力
  subtitles/gene_quest.srt   SRT（UTF-8、BOMなし）。話者名つき（例「アカリ：」）
  subtitles/gene_quest.ass   焼き込み用（話者ごとの色、半透明の帯、下中央、安全領域内）
  subtitles/captions.json    字幕と音声の対応表（line_id・話者・開始・終了・テキスト）
長いセリフは、1枚の字幕が2行×24字程度に収まるよう句読点で分け、文字数に比例して時間を割り当てる。
字幕は正式な表記（講義資料の表記）を使い、音声合成用の読みは使わない。
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import CONFIG, SCRIPT, SUBS  # noqa: E402

ROW = 24          # 1行の目安の文字数
MAX_CHARS = 46    # 1枚の字幕の上限（2行）


def split_cues(text: str) -> list[str]:
    """句点・感嘆符・疑問符・読点で、2行以内の塊に分ける。"""
    if len(text) <= MAX_CHARS:
        return [text]
    parts = re.findall(r"[^。！？!?]+[。！？!?]?", text)
    out: list[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if len(p) <= MAX_CHARS:
            if out and len(out[-1]) + len(p) <= MAX_CHARS:
                out[-1] += p
            else:
                out.append(p)
            continue
        # 読点で分ける
        buf = ""
        for q in re.findall(r"[^、，]+[、，]?", p):
            if len(buf) + len(q) > MAX_CHARS and buf:
                out.append(buf)
                buf = q
            else:
                buf += q
        if buf:
            out.append(buf)
    return out


AKARI_CLEAR_X = 360  # 字幕の帯の左端をこれより右にする


def wrap(text: str) -> str:
    """2行に分けるときは、真ん中に近い読点・助詞の後で改行する。"""
    if len(text) <= ROW + 2:
        return text
    mid = len(text) / 2
    best, score = None, 1e9
    for m in re.finditer(r"[、。，！？!?）]", text):
        i = m.end()
        if 6 <= i <= len(text) - 4:
            s = abs(i - mid)
            if s < score:
                best, score = i, s
    if best is None or score > ROW * 0.45:
        for m in re.finditer(r"(は|が|を|に|で|と|の|も|へ|から|まで)", text):
            i = m.end()
            if 6 <= i <= len(text) - 4 and abs(i - mid) < score:
                best, score = i, abs(i - mid)
    if best is None:
        best = int(mid)
    return text[:best] + "\n" + text[best:]


def ts_srt(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def ts_ass(t: float) -> str:
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def ass_color(hexrgb: str) -> str:
    r, g, b = hexrgb[1:3], hexrgb[3:5], hexrgb[5:7]
    return f"&H00{b}{g}{r}&".upper()


def box_width(c: dict) -> int:
    rows = c["wrapped"].split("\n")
    name_w = 0 if c["character_id"] == "narr" else (len(c["speaker"].split("（")[0]) + 1) * 34
    return min(1500, max(len(r) for r in rows) * 53 + name_w + 90)


def box_center(c: dict) -> int:
    """字幕の帯の中心 x。左下のアカリ（顔の右端は x≈340）に帯がかからない範囲で、なるべく画面の中央。"""
    return int(min(1260, max(960, AKARI_CLEAR_X + box_width(c) / 2)))


def main() -> None:
    tl = json.loads((SCRIPT / "timeline.json").read_text(encoding="utf-8"))
    voices = yaml.safe_load((CONFIG / "voice_config.yaml").read_text(encoding="utf-8"))["characters"]
    SUBS.mkdir(exist_ok=True)
    cues = []
    for sc in tl["scenes"]:
        for ln in sc["lines"]:
            chunks = split_cues(ln["text"])
            total = sum(len(x) for x in chunks)
            t0, t1 = ln["start"], ln["end"]
            acc = t0
            for i, ch in enumerate(chunks):
                d = (t1 - t0) * len(ch) / total
                end = t1 if i == len(chunks) - 1 else acc + d
                cues.append({"line_id": ln["line_id"], "scene_id": sc["scene_id"], "character_id": ln["character_id"],
                             "speaker": voices[ln["character_id"]]["name"], "start": round(acc, 3),
                             "end": round(end, 3), "text": ch, "wrapped": wrap(ch)})
                acc = end
    # 表示が短すぎる字幕は、次の字幕の直前まで延ばす（読む時間の確保。最大 +0.6 秒）
    for a, b in zip(cues, cues[1:]):
        if a["end"] - a["start"] < 1.2:
            a["end"] = round(min(b["start"] - 0.05, a["end"] + 0.6), 3)
    # SRT
    srt = []
    for i, c in enumerate(cues, 1):
        who = "" if c["character_id"] == "narr" else c["speaker"].split("（")[0] + "："
        srt.append(f"{i}\n{ts_srt(c['start'])} --> {ts_srt(c['end'])}\n{who}{c['wrapped']}\n")
    (SUBS / "gene_quest.srt").write_text("\n".join(srt), encoding="utf-8")
    # ASS
    head = """[Script Info]
Title: GENE QUEST 遺伝情報を読み解け！
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,M PLUS Rounded 1c,52,&H00FFFFFF,&H00FFFFFF,&H00140A20,&H8C0A0618,-1,0,0,0,100,100,1,0,1,4.5,1.5,2,380,380,44,128

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for c in cues:
        col = voices[c["character_id"]].get("color", "#FFFFFF")
        body = c["wrapped"].replace("\n", "\\N")
        if c["character_id"] == "narr":
            txt = "{\\c&H00FFFFFF&}" + body
        else:
            name = c["speaker"].split("（")[0]
            txt = "{\\fs34\\c" + ass_color(col) + "}" + name + "　{\\fs52\\c&H00FFFFFF&}" + body
        # 半透明の帯（BorderStyle 4 は libass の拡張がない環境もあるので、背景は別レイヤーの矩形で描く）
        d = box_center(c) - 960  # 長い字幕は右へずらす（左下のアカリの顔に帯がかからないように）
        ev.append(f"Dialogue: 0,{ts_ass(c['start'])},{ts_ass(c['end'])},Default,{c['speaker']},{380 + d},{380 - d},0,,{txt}")
    box = []
    for c in cues:
        rows = c["wrapped"].split("\n")
        w = box_width(c)
        h = 66 * len(rows) + 34
        y1 = 1080 - 28
        y0 = y1 - h
        cx = box_center(c)
        x0, x1 = cx - w / 2, cx + w / 2
        box.append(f"Dialogue: -1,{ts_ass(c['start'])},{ts_ass(c['end'])},Default,,0,0,0,,"
                   f"{{\\an7\\pos(0,0)\\bord0\\shad0\\1c&H0A0618&\\1a&H48&\\p1}}m {x0:.0f} {y0} l {x1:.0f} {y0} l {x1:.0f} {y1} l {x0:.0f} {y1}{{\\p0}}")
    (SUBS / "gene_quest.ass").write_text(head + "\n".join(box + ev) + "\n", encoding="utf-8")
    (SUBS / "captions.json").write_text(json.dumps({"cues": cues}, ensure_ascii=False, indent=1), encoding="utf-8")
    longest = max(len(c["text"]) for c in cues)
    print(f"字幕 {len(cues)} 枚（最長 {longest} 字）→ {SUBS}")


if __name__ == "__main__":
    main()
