"""30秒の試作（制作指示 第13章）。本編の部品をそのまま使い、外見・声・字幕・BGMの組み合わせを確かめる。

  0〜5秒   暗い空間に DNA の二重らせんが現れる
  5〜10秒  カメラが DNA に沿って移動し、分子世界へ入っていく
  10〜15秒 アカリが登場し、疑問を持つ
  15〜22秒 ヌクが転写の説明を始める
  22〜27秒 RNAポリメラーゼと RNA の生成
  27〜30秒 タイトル
（実際の秒数は音声の長さに合わせて決まる：cue l1〜l6）
"""
from __future__ import annotations

import math

import skia

from .. import chars as ch
from .. import mol
from ..anim import transcribing
from ..bg import background, dim
from ..draw import H, PAL, W, clamp, ease, ease_out, glow, lerp, paint, prog
from ..layout import cast, scene_fade, term_card
from ..render import visual
from .ch1 import title_logo


@visual("prototype")
def prototype(c, t, S):
    l1, l2, l3, l4, l5, l6 = (S.cue(f"l{i}") for i in range(1, 7))
    if t < l3 - 0.5:
        # 0〜10秒：らせんが現れ、カメラが沿って進む
        background(c, "black", t, particles=90)
        appear = ease(prog(t, 0.3, 3.0))
        dist = lerp(15.0, 4.6, ease(prog(t, 0.5, l3 - 1.0)))
        mol.helix3d(c, t, cam_x=t * 0.7, length=34, scale=230, yaw=lerp(0.9, 0.35, ease(prog(t, 0, l3))), pitch_angle=0.15,
                    roll=-0.2, cam_dist=dist, alpha=appear, spin=t * 0.4, fog=0.05)
        term_card(c, t, l2 + 0.4, "DNA", "二重らせん", W / 2, 170, end=l3 - 0.8, color=PAL["dna"], size=70)
        dim(c, 1 - clamp(t / 1.0))
        flash = clamp((t - (l3 - 0.9)) / 0.4)
        c.drawRect(skia.Rect(0, 0, W, H), paint(0xFFE8FFF8, flash * 0.9))
    elif t < l5 - 0.4:
        # 10〜22秒：核の中。アカリの疑問 → ヌクの説明（小さな転写の図）
        background(c, "nucleus", t)
        k = ease(prog(t, l4 + 0.4, 1.0))
        if k > 0:
            mol.dna_ladder(c, 420, 1500, 430, 64, None, None, alpha=k, letters=False, step=34)
            from ..draw import arrow, text
            arrow(c, 960, 480, 960, 600, PAL["rna"], 7, k, progress=k)
            text(c, "転写", 990, 560, 44, PAL["rna"], "heavy", alpha=k, stroke=5)
            kk = ease(prog(t, l4 + 1.0, 1.6))
            if kk > 0:
                c.drawLine(420, 660, 420 + 1080 * kk, 660, paint(PAL["rna"], 1, 10))
                text(c, "RNA", 420, 720, 40, PAL["rna"], "heavy", alpha=kk, stroke=5)
        term_card(c, t, l4 + 0.2, "転写", "DNAを鋳型にRNAを合成すること", W / 2, 200, end=l5 - 0.6, color=PAL["rna"], size=64)
        cast(c, t, S, enter_a=l3 - 0.4, enter_n=l4 - 0.6, akari_s=0.7)
        flash = 1 - clamp((t - (l3 - 0.5)) / 0.5)
        c.drawRect(skia.Rect(0, 0, W, H), paint(0xFFE8FFF8, flash * 0.9))
    elif t < l6 - 0.3:
        # 22〜27秒：RNAポリメラーゼが進み、RNA が伸びる
        background(c, "nucleus", t)
        u = prog(t, l5 - 0.4, l6 - l5)
        pol_x = lerp(780, 1180, ease(u))
        transcribing(c, t, 120, 1800, 470, pol_x, gap=70, k_open=1.0, rna_len=lerp(140, 460, u), scale=1.0,
                     pol_face=True, pol_expr=S.expr("pol", t))
        term_card(c, t, l5 + 0.3, "RNAポリメラーゼ", "RNAを合成する酵素", W / 2, 150, end=l6 - 0.6, color=PAL["pol"], size=58)
        scene_fade(c, t - (l5 - 0.4), S, fin=0.3, fout=0.0)
    else:
        background(c, "nucleus", t, particles=120)
        k = ease_out(prog(t, l6 - 0.3, 0.9))
        glow(c, W / 2, H / 2 - 40, 700, 0xFF6A4AE0, 0.45 * k)
        title_logo(c, t, W / 2, H / 2 - 40, 0.75 + 0.25 * k, clamp(k * 1.3))
        c.drawRect(skia.Rect(0, 0, W, H), paint(0xFFFFFFFF, 0.8 * (1 - clamp((t - l6 + 0.3) / 0.4))))
        dim(c, clamp((t - (S.duration - 0.8)) / 0.8))
