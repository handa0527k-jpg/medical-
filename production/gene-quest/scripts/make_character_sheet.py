#!/usr/bin/env python3
"""キャラクター設定画（表情差分・分子キャラクター）を、本編と同じ描画関数で書き出す。

  python scripts/make_character_sheet.py → characters/references/*.png
"""
import sys
from pathlib import Path

import skia

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib import chars as ch  # noqa: E402
from gqlib import mol  # noqa: E402
from gqlib.bg import background  # noqa: E402
from gqlib.draw import PAL, W, H, label, text  # noqa: E402
from gqlib.paths import ROOT  # noqa: E402

OUT = ROOT / "characters" / "references"
OUT.mkdir(parents=True, exist_ok=True)


def sheet(name, fn):
    s = skia.Surface(W, H)
    c = s.getCanvas()
    background(c, "nucleus", 0.0, particles=40)
    fn(c)
    s.makeImageSnapshot().save(str(OUT / name))
    print(OUT / name)


def akari_sheet(c):
    text(c, "アカリ（主人公・医学部1年生）表情差分", 60, 80, 44, PAL["akari"], "heavy")
    names = ["neutral", "happy", "surprise", "think", "worried", "sad", "fear", "determined"]
    jp = ["ふつう", "うれしい", "おどろき", "考える", "こまる", "かなしい", "こわい", "決意"]
    for i, (n, j) in enumerate(zip(names, jp)):
        x = 180 + (i % 4) * 450
        y = 560 + (i // 4) * 470
        e = ch.EXPRESSIONS[n]
        ch.akari(c, x, y, 0.62, e, 1.0)
        label(c, j, x, y + 25, 30, PAL["text"], 0xFF120E30, 1)


def nuku_sheet(c):
    text(c, "ヌク（案内役）表情差分・口の開き", 60, 80, 44, PAL["nuku"], "heavy")
    for i, n in enumerate(["neutral", "happy", "surprise", "think", "worried", "excited"]):
        x = 260 + (i % 3) * 620
        y = 330 + (i // 3) * 420
        e = ch.blend_expr(ch.EXPRESSIONS[n], ch.EXPRESSIONS[n], 0)
        e.mouth_open = 0.6 if i % 2 else 0.0
        ch.nuku(c, x, y, 1.0, e, 0.3)
        label(c, n, x, y + 170, 28, PAL["text"], 0xFF120E30, 1)


def molecule_sheet(c):
    text(c, "分子キャラクター（形と色は講義資料の模式図に合わせる）", 60, 80, 40, PAL["yellow"], "heavy")
    mol.polymerase(c, 330, 380, 1.1, "both", 1, show_face=True, e=ch.EXPRESSIONS["happy"], t=0.5)
    label(c, "ポル：RNAポリメラーゼ（p.5, 13）", 330, 560, 26, PAL["pol"], 0xFF0A1830, 1)
    mol.sigma(c, 820, 360, 1.3, 1, e=ch.EXPRESSIONS["happy"], t=0.5)
    label(c, "シグマ：σ因子（p.13）", 820, 560, 26, PAL["sigma"], 0xFF2A0A08, 1)
    mol.tfiid(c, 1300, 360, 1.3, 1, show_face=True, e=ch.EXPRESSIONS["neutral"], t=0.5)
    label(c, "TFIID（TBPを含む、p.30）", 1300, 560, 26, PAL["tfiid"], 0xFF0A2010, 1)
    mol.blob(c, 520, 820, 220, 160, PAL["u5"], 1, shape="oval", show_face=True, e=ch.EXPRESSIONS["happy"], t=0.5)
    for j, nm in enumerate(("U1", "U2", "U4", "U5", "U6")):
        import math
        a = -math.pi / 2 + j * math.tau / 5
        mol.snrnp(c, 520 + math.cos(a) * 170, 820 + math.sin(a) * 120, nm, 30, 1, j, 0)
    label(c, "スプラ：スプライソソーム（p.50）", 520, 1010, 26, PAL["u5"], 0xFF1A0A2A, 1)
    from gqlib.scenes.ch7 import mina_char
    mina_char(c, 1250, 860, 2.0, ch.EXPRESSIONS["happy"], 0.5, 1)
    label(c, "ミーナ：miRNA（約22塩基、p.56）", 1250, 1010, 26, PAL["mirna"], 0xFF0A2028, 1)


sheet("akari_expressions.png", akari_sheet)
sheet("nuku_expressions.png", nuku_sheet)
sheet("molecule_characters.png", molecule_sheet)
