"""複数の場面で使う分子アニメーション。

転写の向きは資料 p.19 の図にそろえる：
  上の鎖＝鋳型鎖（左が3'、右が5'）、下の鎖＝非鋳型鎖（左が5'、右が3'）。
  RNAポリメラーゼは左から右へ進み（＝転写方向）、RNA は 5'末端から先に左下へ出ていく。
  RNA は鋳型鎖に相補的で、5'→3' に伸びる（活性部位側が 3'末端）。
"""
from __future__ import annotations

import math

import skia

from . import mol
from .draw import BASE_COLORS, PAL, arrow, circle, clamp, glow, label, line, paint, path_from, text, text_center

COMP = {"A": "U", "T": "A", "G": "C", "C": "G"}
COMP_DNA = {"A": "T", "T": "A", "G": "C", "C": "G"}


def transcribing(c, t, x0, x1, y, pol_x, gap=70, k_open=1.0, rna_len=300.0, scale=1.0, alpha=1.0,
                 ntp_flow=True, show_dir=True, labels=True, pol_face=False, pol_expr=None, front_alpha=0.82,
                 template_seq: str | None = None, color=PAL["pol"], sigma_k=0.0, ctd=0.0):
    """二本鎖DNAの上を進むRNAポリメラーゼと、伸びるRNA。"""
    s = scale
    half = 150 * s
    # ポリメラーゼ（奥）
    mol.polymerase(c, pol_x, y + 6 * s, 1.15 * s, layer="back", alpha=alpha, color=color, t=t, ctd=ctd)
    # DNA（転写バブル）
    bub = (pol_x - half, pol_x + half * 0.9, k_open)
    top = template_seq
    bot = "".join(COMP_DNA[b] for b in top) if top else None
    mol.dna_ladder(c, x0, x1, y, gap * s, top, bot, bubble=bub, alpha=alpha, letters=bool(top), step=30 * s,
                   ends=False, width=7 * s, color_top=PAL["dna"], color_bot=PAL["dna2"])
    if labels:
        ls = 26 * s
        text_center(c, "3'", x0 - 26 * s, y - gap * s / 2, ls, PAL["text"], "heavy", "center", alpha, stroke=4)
        text_center(c, "5'", x1 + 26 * s, y - gap * s / 2, ls, PAL["text"], "heavy", "center", alpha, stroke=4)
        text_center(c, "5'", x0 - 26 * s, y + gap * s / 2, ls, PAL["text"], "heavy", "center", alpha, stroke=4)
        text_center(c, "3'", x1 + 26 * s, y + gap * s / 2, ls, PAL["text"], "heavy", "center", alpha, stroke=4)
    # RNA：活性部位（バブルの右寄り、鋳型鎖のすぐ下）から左へハイブリッド、そこから左下へ出る
    if rna_len > 0 and k_open > 0.3:
        tip = (pol_x + 40 * s, y - gap * s * 0.5 - k_open * gap * s * 0.9 * 0.55 + 26 * s)
        hyb_len = min(rna_len, 150 * s)
        pts = []
        n = 40
        for i in range(n + 1):
            u = i / n
            d = u * rna_len
            if d <= hyb_len:
                x = tip[0] - d
                yy = tip[1] + math.sin(math.pi * clamp((x - (pol_x - half)) / (2 * half))) * 4 * s
            else:
                dd = d - hyb_len
                x = tip[0] - hyb_len - dd * 0.55
                yy = tip[1] + dd * 0.85 + math.sin(dd / (40 * s) + t * 2.0) * 12 * s
            pts.append((x, yy))
        pts.reverse()  # 先頭が 5'末端
        mol.rna_path(c, pts, PAL["rna"], 9 * s, alpha)
        if labels:
            ex, ey = pts[0]
            text_center(c, "5'", ex - 20 * s, ey + 18 * s, 26 * s, PAL["rna"], "heavy", "center", alpha, stroke=4)
        glow(c, tip[0], tip[1], 40 * s, PAL["yellow"], 0.6 * alpha)
    # ポリメラーゼ（手前、少し透かす）
    mol.polymerase(c, pol_x, y + 6 * s, 1.15 * s, layer="front", alpha=alpha * front_alpha, color=color,
                   show_face=pol_face, e=pol_expr, t=t)
    if sigma_k > 0:
        mol.sigma(c, pol_x - 40 * s, y - 150 * s - (1 - sigma_k) * 300 * s, 0.9 * s, alpha * min(1, sigma_k * 2), t=t)
    # NTP（材料）が右下の入り口から入る
    if ntp_flow:
        for i in range(6):
            ph = (t * 0.7 + i / 6) % 1.0
            sx, sy = pol_x + 260 * s, y + 200 * s
            ex, ey = pol_x + 60 * s, y + 10 * s
            x = sx + (ex - sx) * ph
            yy = sy + (ey - sy) * ph + math.sin(ph * 6 + i) * 10 * s
            b = "AUGC"[i % 4]
            a = alpha * math.sin(math.pi * ph)
            circle(c, x, yy, 14 * s, BASE_COLORS[b], a)
            text_center(c, b, x, yy, 18 * s, 0xFF101020, "heavy", "center", a)
    if show_dir:
        arrow(c, pol_x - 120 * s, y - 210 * s, pol_x + 160 * s, y - 210 * s, PAL["cool"], 8 * s, alpha, head=24 * s)
        text(c, "転写の方向", pol_x + 20 * s, y - 232 * s, 30 * s, PAL["cool"], "heavy", "center", alpha, stroke=4)
