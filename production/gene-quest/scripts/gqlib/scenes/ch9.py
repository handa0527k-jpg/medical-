"""CHAPTER 9 最終試験（資料 p.71 ほか）とエンディング。"""
from __future__ import annotations

import json
import math
from functools import lru_cache

import skia

from .. import chars as ch
from ..bg import background, lab_background
from ..draw import (H, PAL, W, circle, clamp, ease, ease_back, glow, label, lerp, paint, panel, prog, rrect, text,
                    text_center, text_width)
from ..layout import cast, chapter_intro, hud, scene_fade
from ..paths import SCRIPT
from ..render import visual
from .ch1 import title_logo


# ------------------------------------------------------------------ SC0901 ふりかえり（p.71）
CARDS = [("c1", "遺伝子の発現", "遺伝情報をもとに RNA が合成されること", PAL["yellow"]),
         ("c2", "転写", "RNAポリメラーゼが鋳型鎖に相補的な RNA を合成", PAL["pol"]),
         ("c3", "プロモーター", "転写の開始点と鋳型にする鎖を決める", PAL["red"]),
         ("c4", "mRNA のプロセシング", "キャップ・ポリA・スプライシング → 細胞質へ", PAL["u5"])]


@visual("review")
def review(c, t, S):
    background(c, "nucleus", t)
    for i, (cu, title, body, col) in enumerate(CARDS):
        k = ease_back(prog(t, S.cue(cu), 0.6))
        if k <= 0:
            continue
        x = 300 + (i % 2) * 680
        y = 230 + (i // 2) * 290
        c.save()
        c.translate(x + 300, y + 110)
        c.scale(1, max(0.02, k))
        rrect(c, -300, -110, 600, 220, 28, 0xFF140F38, 0.95)
        rrect(c, -300, -110, 600, 220, 28, col, 1, stroke=5)
        text(c, title, 0, -30, 44, col, "heavy", "center")
        text(c, body, 0, 50, 26, PAL["text"], "bold", "center")
        c.restore()
    cast(c, t, S, akari_s=0.42, akari_x=140, nuku_x=1820, nuku_y=850, nuku_s=0.4)
    hud(c, t, S)
    chapter_intro(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ 最終試験の各問
@lru_cache(maxsize=1)
def quiz_data() -> dict:
    d = json.loads((SCRIPT / "quiz.json").read_text(encoding="utf-8"))
    return {q["scene_id"]: q for q in d["questions"]}


@visual("quiz")
def quiz(c, t, S):
    background(c, "quiz", t)
    q = quiz_data()[S.id]
    tq, tt, ta, te = (S.cue(x) for x in ("question", "think", "answer", "explain"))
    k = ease(prog(t, 0.1, 0.5))
    label(c, f"最終試験　{q['id'].replace('Q', '第')}問", 960, 90, 34, 0xFF2A1A00, PAL["yellow"], k)
    panel(c, 160, 140, 1600, 130, k, border=PAL["yellow"])
    text(c, q["question"], 960, 225, 46, PAL["white"], "heavy", "center", k)
    for i, (key, opt) in enumerate(q["options"].items()):
        ko = ease(prog(t, tq + 0.4 + i * 0.35, 0.4))
        y = 320 + i * 132
        correct = key == q["answer"]
        reveal = ease(prog(t, ta, 0.5))
        col = PAL["green"] if (correct and reveal > 0) else 0xFF6E5CC8
        a = ko * (1 - 0.45 * reveal * (0 if correct else 1))
        rrect(c, 260, y, 1400, 108, 24, 0xFF140F38, a * 0.95)
        rrect(c, 260, y, 1400, 108, 24, col, a, stroke=4 if not (correct and reveal) else 7)
        circle(c, 330, y + 54, 36, col, a)
        text_center(c, key, 330, y + 54, 40, 0xFF101020, "heavy", "center", a)
        text(c, opt, 400, y + 68, 40, PAL["white"], "heavy", alpha=a)
        if correct and reveal > 0:
            glow(c, 330, y + 54, 120, PAL["green"], 0.5 * reveal)
            text(c, "正解", 1600, y + 70, 40, PAL["green"], "heavy", "right", reveal)
        ke = ease(prog(t, te + 0.3 + i * 0.4, 0.4))
        if not correct and ke > 0:
            s = "✕ " + q["why_wrong"][key]
            text(c, s, 1640, y + 98, 24, PAL["orange"], "bold", "right", ke)
    # 考える時間（5秒）
    kt = prog(t, tt + (S.lines[1]["rel_end"] - S.lines[1]["rel_start"]), 5.0)
    if 0 < kt < 1:
        cx, cy = 1780, 90
        circle(c, cx, cy, 52, 0xFF2A2060, 1)
        p = skia.Path()
        p.addArc(skia.Rect.MakeXYWH(cx - 52, cy - 52, 104, 104), -90, 360 * (1 - kt))
        c.drawPath(p, paint(PAL["yellow"], 1, 10))
        text_center(c, str(int(math.ceil(5 * (1 - kt)))), cx, cy, 48, PAL["white"], "heavy", "center")
    pages = "・".join(str(p) for p in q["pages"])
    text(c, f"出典：講義資料 p.{pages}", 1700, 880, 24, PAL["muted"], "bold", "right", ease(prog(t, ta, 0.5)))
    cast(c, t, S, akari_s=0.36, akari_x=110, nuku_x=1850, nuku_y=930, nuku_s=0.34, akari_base="think")
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0907 エンディング
CREDITS = [
    ("GENE QUEST — 遺伝情報を読み解け！", 44, PAL["yellow"]),
    ("", 20, 0),
    ("医学的内容の出典", 30, PAL["muted"]),
    ("講義資料「転写（機構と疾患）」2026年度 遺伝医学（2026.09.28）", 28, PAL["text"]),
    ("熊本大学大学院生命科学研究部 分子遺伝学", 28, PAL["text"]),
    ("資料外の一般知識は「補足」と表示しました", 26, PAL["muted"]),
    ("", 20, 0),
    ("キャラクター・映像　オリジナル（Python + skia でプログラム描画）", 28, PAL["text"]),
    ("", 20, 0),
    ("音声合成", 30, PAL["muted"]),
    ("Style-Bert-VITS2（litagin02）JVNV コーパスモデル（CC BY-SA 4.0）", 26, PAL["text"]),
    ("Style-BertVITS2モデル：小春音アミ、あみたろの声素材工房（https://amitaro.net/）", 26, PAL["text"]),
    ("Kokoro-82M（Apache-2.0）／ kokoro-onnx", 26, PAL["text"]),
    ("", 20, 0),
    ("音楽　Kevin MacLeod（incompetech.com）", 30, PAL["muted"]),
    ("Lightless Dawn / Floating Cities / Investigations / Hyperfun / Deliberate Thought /", 24, PAL["text"]),
    ("Movement Proposition / Inspired / Life of Riley / Dreams Become Real / Clean Soul /", 24, PAL["text"]),
    ("Thinking Music / Wholesome", 24, PAL["text"]),
    ("Licensed under Creative Commons: By Attribution 4.0 License", 24, PAL["text"]),
    ("http://creativecommons.org/licenses/by/4.0/", 24, PAL["text"]),
    ("", 20, 0),
    ("効果音　オリジナル（合成）", 28, PAL["text"]),
    ("フォント　M PLUS Rounded 1c / Zen Kaku Gothic New（SIL Open Font License）", 26, PAL["text"]),
]


@visual("ending")
def ending(c, t, S):
    t_cr = S.cue("credits")
    dawn = ease(prog(t, 0, t_cr))
    lab_background(c, t, dawn)
    # 窓の外に光るらせん
    for i in range(40):
        u = i / 39
        x = 1170 + u * 540
        circle(c, x, 380 + math.sin(u * 10 + t) * 40, 5, PAL["dna"], 0.6 * dawn)
        circle(c, x, 380 + math.sin(u * 10 + t + 2.2) * 40, 5, PAL["rna"], 0.6 * dawn)
    k_cast = 1 - ease(prog(t, t_cr - 0.5, 0.8))
    if k_cast > 0:
        e = S.expr("akari", t, "happy" if t > S.cue("akari_end") else "neutral")
        ch.akari(c, 400, 1085, 0.9, e, t, alpha=k_cast)
        ch.nuku(c, 760, 560, 0.7, S.expr("nuku", t), t, alpha=k_cast)
        themes = [("t1", "転写", PAL["pol"]), ("t2", "転写調節", PAL["warm"]), ("t3", "RNAプロセシング", PAL["u5"]),
                  ("t4", "非コードRNA", PAL["rna"])]
        for i, (cu, s, col) in enumerate(themes):
            kk = ease_back(prog(t, S.cue(cu), 0.5)) * k_cast
            label(c, s, 1250 + (i % 2) * 330, 760 + (i // 2) * 90, 40, 0xFF101020, col, kk)
    kc = ease(prog(t, t_cr - 0.3, 1.0))
    if kc > 0:
        c.drawRect(skia.Rect(0, 0, W, H), paint(0xFF05040F, 0.8 * kc))
        title_logo(c, t, W / 2, 200, 0.5, kc)
        roll = max(0.0, t - t_cr - 1.5) * 38
        y = 420 - roll
        for s, size, col in CREDITS:
            if s and -50 < y < H + 40:
                fade = clamp((y - 330) / 80) * clamp((1000 - y) / 60)
                text(c, s, W / 2, y, size, col, "bold" if size < 30 else "heavy", "center", kc * fade)
            y += size * 1.7
    scene_fade(c, t, S, fout=1.2)
