"""CHAPTER 3 細菌の転写作戦（資料 p.13–26）。"""
from __future__ import annotations

import math

import skia

from .. import mol
from ..anim import transcribing
from ..bg import background
from ..chars import Expr
from ..draw import (BASE_COLORS, H, PAL, W, arrow, circle, clamp, ease, ease_back, ease_out, glow, inhibit, label, lerp,
                    line, paint, panel, path_from, prog, rrect, text, text_center)
from ..layout import caption_box, cast, chapter_intro, hud, scene_fade, speaker_tag, term_card
from ..render import visual

NAMES = {"pol": ("RNAポリメラーゼ", PAL["pol"]), "sigma": ("σ因子", PAL["sigma"])}


def bacterium_frame(c, t, k=1.0):
    """画面いっぱいの大腸菌の輪郭（中にDNA＝核様体）。"""
    mol.bacterium(c, W / 2, H / 2 - 20, W + 260, H - 120, alpha=0.35 * k, t=t)
    p = skia.Path()
    for i in range(160):
        u = i / 159
        x = 200 + u * 1500
        y = 220 + math.sin(u * 17 + t * 0.3) * 60 + math.sin(u * 5) * 40
        p.moveTo(x, y) if i == 0 else p.lineTo(x, y)
    c.drawPath(p, paint(PAL["dna"], 0.18 * k, 8, blur=3))


# ------------------------------------------------------------------ SC0301 σ因子とホロ酵素（p.13, 14）
@visual("bacteria_holoenzyme")
def bacteria_holoenzyme(c, t, S):
    background(c, "bacteria", t)
    bacterium_frame(c, t)
    t_e, t_sig, t_holo, t_dock = S.cue("ecoli"), S.cue("sigma"), S.cue("holo"), S.cue("dock")
    k = ease(prog(t, t_e - 0.3, 0.8))
    px, py = 900, 520
    mol.polymerase(c, px, py, 1.25, "both", k, show_face=True, e=S.expr("pol", t), t=t)
    label(c, "コア酵素", px, py + 190, 32, PAL["pol"], 0xFF0A1830, k * ease(prog(t, t_holo, 0.5)), border=PAL["pol"])
    # σ因子が飛んできて合体
    ks = ease(prog(t, t_sig - 0.4, 0.8))
    dock = ease_back(prog(t, t_holo + 1.2, 0.8))
    sx = lerp(lerp(300, 620, ks), px + 70, dock)
    sy = lerp(lerp(150, 330, ks), py - 160, dock) + math.sin(t * 3) * 10 * (1 - dock)
    if ks > 0:
        mol.sigma(c, sx, sy, 1.15, ks, rot=lerp(-20, 0, dock), e=S.expr("sigma", t), t=t)
        label(c, "σ因子", sx + 140, sy - 60, 32, PAL["sigma"], 0xFF2A0A08, ks * (1 - dock * 0.0), border=PAL["sigma"])
    if dock > 0.95:
        glow(c, px + 70, py - 120, 160, PAL["sigma"], 0.5 * (1 - prog(t, t_holo + 2.0, 0.8)))
    term_card(c, t, t_holo + 1.4, "ホロ酵素 ＝ コア酵素 ＋ σ因子", "", W / 2, 150, end=t_dock + 0.5, color=PAL["sigma"], size=50)
    term_card(c, t, t_dock + 0.6, "開始に必要なのは σ因子だけ", "細菌のRNAポリメラーゼ（p.28）", W / 2, 150, end=S.duration,
              color=PAL["yellow"], size=48)
    speaker_tag(c, t, S, NAMES, y=880)
    cast(c, t, S, akari_s=0.48, nuku_x=1780, nuku_y=760, nuku_s=0.5, enter_a=t_e, enter_n=t_e)
    hud(c, t, S)
    chapter_intro(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0302 −35 と −10（p.15, 16, 18）
X_P1 = 1060      # +1 の位置
BP = 10.5        # 1塩基対あたりの px


def bp_x(n):
    return X_P1 + n * BP


@visual("prok_promoter")
def prok_promoter(c, t, S):
    background(c, "bacteria", t)
    t_pos, t35, t10, t_open, t_leave = (S.cue(x) for x in ("positions", "box35", "box10", "open", "sigma_leave"))
    y = 470
    arrive = ease(prog(t, S.Lend(3) - 0.2, 1.2))
    k_open = ease(prog(t, t_open + 0.5, 1.2))
    leave = ease(prog(t, t_leave + 1.0, 1.5))
    move = ease(prog(t, S.Lend(5) + 0.2, S.duration - S.Lend(5)))
    pol_x = lerp(bp_x(-20), bp_x(-8), k_open) + move * 380
    # 箱の位置
    kb = ease(prog(t, t_pos, 0.8))
    for n0, n1, col, tt in ((-35, -30, PAL["orange"], t35), (-12, -7, PAL["green"], t10)):
        kk = ease(prog(t, tt, 0.5)) * (1 - 0.6 * arrive)
        rrect(c, bp_x(n0), y - 50, (n1 - n0) * BP + 10, 100, 12, col, max(kb * 0.25, kk * 0.55))
    if arrive > 0.01:
        transcribing(c, t, 60, 1860, y, pol_x, gap=70, k_open=k_open, rna_len=lerp(0, 120, ease(prog(t, t_open + 2.0, 2.0))) + move * 250,
                     scale=1.1, alpha=arrive, labels=True, pol_face=True, pol_expr=S.expr("pol", t),
                     sigma_k=arrive if leave <= 0 else 0.0, show_dir=move > 0.05, ntp_flow=k_open > 0.5)
        if leave > 0:
            mol.sigma(c, pol_x - 40 + leave * 300, y - 260 - leave * 260, 1.0, 1 - leave, rot=leave * 40,
                      e=S.expr("sigma", t), t=t)
    else:
        mol.dna_ladder(c, 60, 1860, y, 70, None, None, alpha=1, letters=False, step=BP * 3, ends=False)
        text_center(c, "3'", 30, y - 35, 26, PAL["text"], "heavy", "center", 1, stroke=4)
        text_center(c, "5'", 30, y + 35, 26, PAL["text"], "heavy", "center", 1, stroke=4)
        text_center(c, "5'", 1890, y - 35, 26, PAL["text"], "heavy", "center", 1, stroke=4)
        text_center(c, "3'", 1890, y + 35, 26, PAL["text"], "heavy", "center", 1, stroke=4)
        # 待機中のホロ酵素（左から来る）
        hx = lerp(-300, 200, ease(prog(t, t10, 2.0)))
        mol.polymerase(c, hx, y - 260, 0.7, "both", 0.9, show_face=True, e=S.expr("pol", t), t=t)
        mol.sigma(c, hx - 30, y - 360, 0.6, 0.9, e=S.expr("sigma", t), t=t)
    # 目盛り（−35, −10, +1）
    for n, s in ((-35, "−35"), (-10, "−10"), (1, "+1")):
        text(c, s, bp_x(n), y + 115, 34, PAL["yellow"] if n == 1 else PAL["text"], "heavy", "center", kb, stroke=5)
    if kb > 0:
        arrow(c, bp_x(1), y - 95, bp_x(1) + 120, y - 95, PAL["yellow"], 6, kb * (1 - arrive * 0.7), head=18)
        text(c, "転写開始点", bp_x(1) + 60, y - 110, 26, PAL["yellow"], "heavy", "center", kb * (1 - arrive * 0.7))
    # 配列の札（p.18 の緑の枠）
    for i, (tt, title, seq1, seq2, xx, col) in enumerate((
            (t35, "−35ボックス", "5'-TTGACA-3'", "3'-AACTGT-5'", bp_x(-32) - 120, PAL["orange"]),
            (t10, "−10ボックス", "5'-TATAAT-3'", "3'-ATATTA-5'", bp_x(-10) + 140, PAL["green"]))):
        kk = ease_back(prog(t, tt, 0.5)) * (1 - ease(prog(t, t_open, 0.6)))
        if kk > 0:
            panel(c, xx - 170, 640, 340, 190, kk, border=col)
            text(c, title, xx, 690, 34, col, "heavy", "center", kk)
            text(c, seq1, xx, 745, 34, PAL["white"], "heavy", "center", kk)
            text(c, seq2, xx, 795, 30, PAL["muted"], "bold", "center", kk)
    kf = ease(prog(t, t_open + 2.5, 0.5)) * (1 - ease(prog(t, t_leave, 0.5)))
    if kf > 0:
        caption_box(c, ["+1 と +2 の間に、", "最初のリン酸ジエステル結合"], 1180, 640, 32, kf, border=PAL["yellow"])
    kl = ease(prog(t, t_leave + 0.5, 0.5))
    if kl > 0:
        caption_box(c, ["RNA が約10ヌクレオチド → σ因子が離れ、", "コア酵素は伸長へ（p.16）"], 700, 680, 32, kl, border=PAL["sigma"])
    speaker_tag(c, t, S, NAMES, y=900)
    cast(c, t, S, akari=False, nuku_x=1790, nuku_y=200, nuku_s=0.45)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0303 伸長と終結（p.17, 19–21）
STEM_SEQ = "UAUACUGCAGGCUAUCGAGCCUGCUUGAU"


def hairpin(c, x, y, k, s=1.0, alpha=1.0):
    """p.21 のステムループ。左腕 GCAGGCU と右腕 AGCCUGC が対合し、ループは AUCG。"""
    left = "GCAGGCU"
    right = "CGUCCGA"  # 右腕を下から上へ（AGCCUGC の逆順）
    loop = "AUCG"
    step = 38 * s
    for i in range(7):
        yy = y - i * step * k
        xl, xr = x - 30 * s * k - 10 * s, x + 30 * s * k + 10 * s
        text_center(c, left[i], xl, yy, 30 * s, BASE_COLORS[left[i]], "heavy", "center", alpha, stroke=4)
        text_center(c, right[i], xr, yy, 30 * s, BASE_COLORS[right[i]], "heavy", "center", alpha, stroke=4)
        if k > 0.9:
            line(c, xl + 16 * s, yy, xr - 16 * s, yy, PAL["muted"], 3, alpha)
    top = y - 6 * step * k - 50 * s
    for j, b in enumerate(loop):
        a = math.pi + j * math.pi / 3
        text_center(c, b, x + math.cos(a) * 40 * s * (0.4 + 0.6 * k), top + math.sin(a) * 34 * s, 28 * s, BASE_COLORS[b],
                    "heavy", "center", alpha, stroke=4)


@visual("prok_elong_term")
def prok_elong_term(c, t, S):
    background(c, "bacteria", t)
    t_st, t_term, t_sl, t_rho, t_cy = (S.cue(x) for x in ("steps", "terminator", "stemloop", "rho", "cycle"))
    y = 430
    run = ease(prog(t, 0.0, t_term + 1.5))
    pol_x = lerp(500, 1250, run)
    stop = t > t_sl + 1.5
    rel = ease(prog(t, t_cy, 1.2))
    k_all = 1 - ease(prog(t, t_cy - 0.2, 0.6))
    if k_all > 0:
        # ターミネーター（遺伝子の下流）
        kt = ease(prog(t, t_term, 0.6))
        rrect(c, 1300, y - 48, 240, 96, 12, PAL["green"], 0.35 * kt * k_all)
        label(c, "ターミネーター", 1420, y - 175, 30, PAL["green"], 0xFF0A2010, kt * k_all, border=PAL["green"])
        transcribing(c, t, 60, 1860, y, pol_x, gap=70, k_open=1.0, rna_len=lerp(150, 420, run), scale=1.0,
                     alpha=k_all, pol_face=True, pol_expr=S.expr("pol", t), ntp_flow=not stop, show_dir=not stop)
        steps = ["1）相補的なリボヌクレオチドが1個入る", "2）RNA鎖とリン酸ジエステル結合", "3）RNAポリメラーゼが移動"]
        for i, s_ in enumerate(steps):
            kk = ease(prog(t, t_st + i * 1.6, 0.5)) * (1 - ease(prog(t, t_term, 0.5)))
            if kk > 0:
                text(c, s_, 420, 700 + i * 56, 38, PAL["text"], "heavy", alpha=kk, stroke=5)
        # ステムループ
        ksl = ease(prog(t, t_sl, 0.8))
        if ksl > 0:
            panel(c, 400, 560, 760, 345, ksl * k_all, border=PAL["rna"])
            text(c, "5'-UAUACU GCAGGCU AUCG AGCCUGC UUGAU-3'", 780, 608, 30, PAL["text"], "heavy", "center", ksl * k_all)
            text(c, "パリンドローム配列（逆方向反復配列）", 780, 650, 28, PAL["rna"], "bold", "center", ksl * k_all)
            hairpin(c, 600, 880, ease(prog(t, t_sl + 1.0, 1.2)), 0.6, ksl * k_all)
            text(c, "ステムループ構造", 900, 800, 36, PAL["yellow"], "heavy", "center", ksl * k_all)
            if stop:
                label(c, "停止", pol_x, y - 230, 40, 0xFF3A0A10, PAL["red"], k_all * ease(prog(t, t_sl + 1.5, 0.4)))
        kr = ease(prog(t, t_rho, 0.8))
        if kr > 0:
            rx = lerp(pol_x - 520, pol_x - 230, ease(prog(t, t_rho, 2.0)))
            mol.blob(c, rx, y + 300, 120, 90, 0xFFD9A0FF, kr * k_all, "ρ", shape="oval")
            label(c, "ρタンパク質", rx, y + 380, 28, 0xFFE7C8FF, 0xFF1A0A2A, kr * k_all)
            kau = ease(prog(t, t_rho + 3.0, 0.6))
            caption_box(c, ["結合力の弱い A–U 塩基対が多いと", "RNA は DNA から外れやすい"], 1100, 640, 32, kau * k_all,
                        border=PAL["orange"])
    if rel > 0:
        cycle_diagram(c, t, W / 2, 480, rel)
    speaker_tag(c, t, S, NAMES, y=900)
    cast(c, t, S, akari_s=0.48, nuku_x=1800, nuku_y=820, nuku_s=0.48)
    hud(c, t, S)
    scene_fade(c, t, S)


def cycle_diagram(c, t, cx, cy, k):
    """p.13 の転写サイクル（7段階）を輪にして示す。"""
    steps = ["① ホロ酵素ができる", "② プロモーターに結合・DNAをほどく", "③ RNA合成の開始", "④ 約10ヌクレオチド", "⑤ σ因子が離れる",
             "⑥ 終結シグナルで終了", "⑦ RNAを放出"]
    R = 300
    for i, s in enumerate(steps):
        a = -math.pi / 2 + i * math.tau / 7
        kk = ease_back(prog(k, i / 9, 0.25))
        x, yy = cx + math.cos(a) * R * 1.35, cy + math.sin(a) * R
        a2 = -math.pi / 2 + (i + 1) * math.tau / 7
        arrow(c, cx + math.cos(a + 0.18) * R * 0.95, cy + math.sin(a + 0.18) * R * 0.7, cx + math.cos(a2 - 0.18) * R * 0.95,
              cy + math.sin(a2 - 0.18) * R * 0.7, PAL["muted"], 5, kk, curve=-30)
        label(c, s, x, yy, 30, PAL["text"], 0xFF0A2028, kk, border=PAL["sigma"] if i in (0, 4) else PAL["pol"])
    mol.polymerase(c, cx, cy + 10, 0.6, "both", k, t=t)
    mol.sigma(c, cx - 20, cy - 70, 0.5, k, t=t, show_face=False)


# ------------------------------------------------------------------ SC0304 必要なRNAだけを作る（p.23, 26）
def gene_row(c, t, x, y, states, k, sugar, kk_switch=1.0):
    """遺伝子1〜3の並びと、それぞれの状態（'on','act','off'）。"""
    text(c, sugar, x - 10, y - 90, 34, PAL["yellow"], "heavy", alpha=k)
    for j in range(5):
        circle(c, x + 30 + j * 46, y - 30 + (j % 2) * 30, 16, PAL["yellow"], k * 0.7, stroke=5)
    line(c, x + 300, y, x + 1350, y, PAL["dna"], 8, k)
    for i, st in enumerate(states):
        gx = x + 380 + i * 330
        on = st in ("on", "act")
        rrect(c, gx, y - 22, 170, 44, 10, PAL["green"] if on else 0xFF555570, k)
        text_center(c, f"遺伝子{i + 1}", gx + 85, y, 28, 0xFF101010, "heavy", "center", k)
        tag = {"on": "常時転写", "act": "転写の活性化", "off": "転写の抑制"}[st]
        col = {"on": PAL["green"], "act": PAL["red"], "off": PAL["cool"]}[st]
        text(c, tag, gx + 85, y + 62, 28, col, "heavy", "center", k)
        if on:
            arrow(c, gx + 85, y + 80, gx + 85, y + 150, PAL["rna"], 6, k)
            text(c, "RNA → タンパク質", gx + 85, y + 185, 26, PAL["rna"], "bold", "center", k)
        else:
            text(c, "✕ 産物なし", gx + 85, y + 140, 28, PAL["cool"], "heavy", "center", k)


@visual("housekeeping")
def housekeeping(c, t, S):
    background(c, "bacteria", t)
    t_g1, t_sw, t_ty = S.cue("gene1"), S.cue("switch"), S.cue("types")
    k1 = ease(prog(t, 0.3, 0.8))
    k2 = ease(prog(t, t_sw, 0.8))
    gene_row(c, t, 140, 260, ["on", "act", "off"], k1 * (1 - 0.55 * k2), "グルコースなど")
    if k2 > 0:
        arrow(c, 120, 420, 120, 560, PAL["red"], 6, k2)
        label(c, "環境の変化", 200, 490, 28, PAL["red"], 0xFF200810, k2, align="left")
        gene_row(c, t, 140, 640, ["on", "off", "act"], k2, "ラクトースなど")
    kh = ease(prog(t, t_g1, 0.6))
    if kh > 0:
        glow(c, 605, 260 if k2 < 0.5 else 640, 160, PAL["green"], 0.35 * kh)
    term_card(c, t, t_g1 + 0.3, "ハウスキーピング遺伝子", "常に必要で、常に転写されている（図の遺伝子1）", W / 2, 120,
              end=t_sw - 0.3, color=PAL["green"], size=50)
    kt = ease(prog(t, t_ty, 0.6))
    if kt > 0:
        caption_box(c, ["常に発現　　　→ 構成的発現遺伝子", "必要に応じて変化 → 調節的発現遺伝子"], 1000, 40, 32, kt,
                    border=PAL["yellow"])
    cast(c, t, S, akari=False, nuku_x=1790, nuku_y=880, nuku_s=0.45)
    hud(c, t, S, show_pages=True)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0305 lacオペロン（p.24, 25）
def operon_map(c, x, y, k, s=1.0, show_i=True, op_k=0.0):
    """lacI と lacZYA の地図。オペレーター（O）はプロモーターの中（p.22 の注）。"""
    if show_i:
        rrect(c, x, y - 20, 60 * s, 40, 8, PAL["mediator"], k)
        text_center(c, "P", x + 30 * s, y, 26, 0xFF101030, "heavy", "center", k)
        rrect(c, x + 60 * s, y - 24, 140 * s, 48, 8, 0xFFB0A8D8, k)
        text_center(c, "lacI", x + 130 * s, y, 30, 0xFF101030, "heavy", "center", k)
        line(c, x - 30, y, x + 300 * s, y, PAL["muted"], 5, k)
        x += 300 * s
    rrect(c, x, y - 20, 150 * s, 40, 8, PAL["mediator"], k)
    text_center(c, "P", x + 40 * s, y, 26, 0xFF101030, "heavy", "center", k)
    rrect(c, x + 90 * s, y - 20, 60 * s, 40, 8, 0xFF8090A0, k * (0.6 + 0.4 * op_k))
    text_center(c, "O", x + 120 * s, y, 26, 0xFFFFFFFF, "heavy", "center", k)
    xs = x + 150 * s
    for name, w, col in (("lacZ", 330, PAL["exon2"]), ("lacY", 170, PAL["exon3"]), ("lacA", 130, PAL["exon4"])):
        rrect(c, xs, y - 26, w * s, 52, 8, col, k)
        text_center(c, name, xs + w * s / 2, y, 32, 0xFF101030, "heavy", "center", k)
        xs += w * s + 6
    rrect(c, xs, y - 20, 50 * s, 40, 8, PAL["green"], k)
    text_center(c, "T", xs + 25 * s, y, 26, 0xFF101030, "heavy", "center", k)
    line(c, xs + 50 * s, y, xs + 120 * s, y, PAL["muted"], 5, k)
    return x, xs + 50 * s


@visual("lac_operon")
def lac_operon(c, t, S):
    background(c, "bacteria", t)
    t_la, t_ge, t_op, t_li = S.cue("lactose"), S.cue("genes"), S.cue("operon"), S.cue("laci")
    # ラクトースの加水分解（p.25 左）
    kl = ease(prog(t, t_la, 0.6)) * (1 - ease(prog(t, t_ge, 0.6)))
    if kl > 0:
        sp = ease(prog(t, t_la + 1.5, 1.0))
        cx = 960
        circle(c, cx - 50 - sp * 120, 400, 46, PAL["yellow"], kl, stroke=8)
        circle(c, cx + 50 + sp * 120, 400, 46, 0xFFFFB0D0, kl, stroke=8)
        if sp < 0.5:
            line(c, cx - 4, 400, cx + 4, 400, PAL["text"], 8, kl)
        text(c, "ラクトース", cx, 310, 40, PAL["text"], "heavy", "center", kl * (1 - sp))
        text(c, "グルコース", cx - 170, 500, 34, PAL["yellow"], "heavy", "center", kl * sp)
        text(c, "ガラクトース", cx + 170, 500, 34, 0xFFFFB0D0, "heavy", "center", kl * sp)
        label(c, "β-ガラクトシダーゼで加水分解", cx, 600, 32, PAL["text"], 0xFF0A2028, kl, border=PAL["exon2"])
    k = ease(prog(t, t_ge, 0.8))
    if k > 0:
        x0 = 230
        show_i = t > t_li - 0.3
        xP, xT = operon_map(c, x0 if show_i else x0 + 300, 330, k, 1.0, show_i=show_i)
        # 転写単位
        ku = ease(prog(t, t_ge + 3.0, 0.8))
        if ku > 0:
            arrow(c, xP, 420, xT, 420, PAL["green"], 6, ku, head=20)
            arrow(c, xT, 420, xP, 420, PAL["green"], 6, ku, head=20)
            text(c, "転写単位", (xP + xT) / 2, 465, 34, PAL["green"], "heavy", "center", ku)
            km = ease(prog(t, t_ge + 4.0, 1.5))
            line(c, xP + 150, 560, xP + 150 + (xT - xP - 150) * km, 560, PAL["rna"], 12, ku)
            text(c, "1本の mRNA に、複数のタンパク質の情報（p.25）", (xP + xT) / 2, 630, 32, PAL["rna"], "heavy", "center",
                 ease(prog(t, t_ge + 5.0, 0.6)))
            caption_box(c, ["ラクトースの輸送・加水分解に働く酵素", "（パーミアーゼ、β-ガラクトシダーゼ、トランスアセチラーゼ）"],
                        360, 680, 30, ease(prog(t, t_ge + 6.0, 0.6)) * (1 - ease(prog(t, t_li - 0.5, 0.5))),
                        border=PAL["exon2"])
        term_card(c, t, t_op + 0.2, "オペロン", "同じ転写因子の調節を受け、連携して働く酵素の遺伝子の集まり", W / 2, 140,
                  end=t_li - 0.2, color=PAL["exon2"], size=56)
        kli = ease(prog(t, t_li + 0.4, 0.6))
        if kli > 0:
            arrow(c, 360, 380, 640, 380, PAL["mediator"], 6, kli, curve=-60)
            text(c, "lacI の産物が lacZYA の発現を調節", 700, 790, 36, PAL["mediator"], "heavy", "center", kli, stroke=4)
    cast(c, t, S, akari=False, nuku_x=1790, nuku_y=880, nuku_s=0.45)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0306 二つのスイッチ（p.22, 24）
@visual("lac_switches")
def lac_switches(c, t, S):
    background(c, "bacteria", t)
    t_crp, t_low, t_rep, t_rel, t_tab = (S.cue(x) for x in ("crp", "lowcamp", "repressor", "release", "table"))
    show_tab = ease(prog(t, t_tab, 0.6))
    kp = 1 - show_tab
    # 左：正の調節
    kl = ease(prog(t, 0.2, 0.6)) * kp
    if kl > 0:
        panel(c, 60, 130, 880, 600, kl, border=PAL["red"])
        text(c, "正の調節（アクセル）", 500, 200, 40, PAL["red"], "heavy", "center", kl)
        y = 470
        rrect(c, 110, y - 20, 330, 40, 8, PAL["red"], kl * 0.8)
        text_center(c, "CRP結合領域", 275, y, 26, PAL["white"], "heavy", "center", kl)
        rrect(c, 440, y - 20, 160, 40, 8, 0xFFC04050, kl * 0.8)
        rrect(c, 600, y - 20, 90, 40, 8, 0xFF8090A0, kl)
        text_center(c, "O", 645, y, 24, PAL["white"], "heavy", "center", kl)
        rrect(c, 690, y - 24, 220, 48, 8, 0xFF303040, kl)
        text_center(c, "β-gal 遺伝子", 800, y, 26, PAL["white"], "heavy", "center", kl)
        text(c, "プロモーター", 360, y + 60, 26, PAL["muted"], "bold", "center", kl)
        low = ease(prog(t, t_low + 0.5, 0.8))
        bind = ease_back(prog(t, t_crp + 1.0, 0.8)) * (1 - low)
        cx, cy = 275, lerp(640, y - 70, bind)
        mol.blob(c, cx, cy, 120, 70, PAL["red"], kl, "CRP", shape="oval", name_color=PAL["white"])
        if low < 0.9:
            circle(c, cx + 80, cy - 30, 28, PAL["yellow"], kl * (1 - low))
            text_center(c, "cAMP", cx + 80, cy - 30, 18, 0xFF3A2A00, "heavy", "center", kl * (1 - low))
        polb = ease(prog(t, t_crp + 2.0, 0.8)) * (1 - low)
        mol.blob(c, 560, lerp(700, y - 90, polb), 220, 90, PAL["pol"], kl * (0.4 + 0.6 * max(polb, 1 - low)), "RNAポリメラーゼ",
                 name_size=24, shape="oval")
        if low > 0.3:
            text(c, "✕ 結合できない", 560, 690, 34, PAL["cool"], "heavy", "center", kl * low)
            label(c, "cAMP が低下", 275, 640, 28, PAL["yellow"], 0xFF2A2000, kl * low)
        if polb > 0.9:
            arrow(c, 690, 380, 900, 380, PAL["green"], 7, kl, head=22)
            text(c, "転写 ON", 800, 360, 30, PAL["green"], "heavy", "center", kl)
    # 右：負の調節
    kr = ease(prog(t, t_rep - 0.3, 0.6)) * kp
    if kr > 0:
        panel(c, 980, 130, 880, 600, kr, border=PAL["cool"])
        text(c, "負の調節（ブレーキ）", 1420, 200, 40, PAL["cool"], "heavy", "center", kr)
        y = 470
        rrect(c, 1010, y - 22, 150, 44, 8, 0xFFB0A8D8, kr)
        text_center(c, "lacI", 1085, y, 28, 0xFF101030, "heavy", "center", kr)
        rrect(c, 1250, y - 20, 300, 40, 8, 0xFFC04050, kr * 0.8)
        text(c, "プロモーター領域", 1400, y + 60, 26, PAL["muted"], "bold", "center", kr)
        rrect(c, 1440, y - 20, 90, 40, 8, 0xFF8090A0, kr)
        text_center(c, "O", 1485, y, 24, PAL["white"], "heavy", "center", kr)
        rrect(c, 1560, y - 24, 260, 48, 8, 0xFF303040, kr)
        text_center(c, "β-gal 構造遺伝子", 1690, y, 24, PAL["white"], "heavy", "center", kr)
        rel = ease(prog(t, t_rel + 1.0, 1.0))
        rb = ease(prog(t, t_rep + 1.5, 1.0)) * (1 - rel)
        rx, ry = lerp(1085, 1485, rb), lerp(640, y - 60, rb) - rel * 160
        if rel > 0:
            rx = 1485 + rel * 160
        arrow(c, 1085, y + 30, 1085, 600, PAL["mediator"], 5, kr * ease(prog(t, t_rep + 0.5, 0.5)))
        mol.blob(c, rx, ry, 150, 80, 0xFFE8B0B0, kr, "リプレッサー", name_size=22, shape="oval")
        if rel > 0:
            circle(c, rx - 60, ry - 40, 22, PAL["yellow"], kr * rel)
            label(c, "ラクトースから生じる物質（補足）", 1420, 720, 26, PAL["yellow"], 0xFF2A2000, kr * rel)
            arrow(c, 1560, 380, 1820, 380, PAL["green"], 7, kr * rel, head=22)
            text(c, "転写 ON", 1690, 360, 30, PAL["green"], "heavy", "center", kr * rel)
        elif rb > 0.9:
            text(c, "✕ 転写が止まる", 1690, 380, 32, PAL["cool"], "heavy", "center", kr)
    # 条件の比較表（p.24 本文）
    if show_tab > 0:
        panel(c, 260, 200, 1400, 520, show_tab, border=PAL["yellow"])
        text(c, "大腸菌の β-gal 酵素はいつ作られる？（p.24）", W / 2, 270, 40, PAL["yellow"], "heavy", "center", show_tab)
        rows = [("グルコース（＋）の培地", "作られない", PAL["cool"]),
                ("グルコース（−）・ラクトース（＋）の培地", "作られる", PAL["green"])]
        for i, (cond, res, col) in enumerate(rows):
            kk = ease(prog(t, t_tab + 0.8 + i * 1.5, 0.5))
            yy = 400 + i * 150
            text(c, cond, 320, yy, 40, PAL["white"], "heavy", alpha=kk)
            label(c, res, 1450, yy - 12, 40, 0xFF101020, col, kk)
    cast(c, t, S, akari_s=0.48, nuku_x=1820, nuku_y=900, nuku_s=0.42, akari_alpha=0.95)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0307 オペロンとレギュロン（p.25）
@visual("operon_regulon")
def operon_regulon(c, t, S):
    background(c, "bacteria", t)
    t_o, t_r = S.cue("operon"), S.cue("regulon")
    ko = ease(prog(t, t_o - 0.3, 0.8))
    if ko > 0:
        panel(c, 120, 120, 1680, 330, ko, border=PAL["exon2"])
        text(c, "オペロン", 220, 190, 44, PAL["exon2"], "heavy", alpha=ko)
        y = 300
        line(c, 200, y, 1700, y, PAL["dna"], 8, ko)
        rrect(c, 380, y - 22, 110, 44, 8, PAL["mediator"], ko)
        text_center(c, "P", 435, y, 28, 0xFF101030, "heavy", "center", ko)
        for i, col in enumerate((PAL["exon2"], PAL["exon3"], PAL["exon4"])):
            rrect(c, 500 + i * 260, y - 26, 240, 52, 8, col, ko)
            text_center(c, f"遺伝子{'ABC'[i]}", 620 + i * 260, y, 30, 0xFF101030, "heavy", "center", ko)
        km = ease(prog(t, t_o + 1.5, 1.5))
        line(c, 500, y + 80, 500 + 760 * km, y + 80, PAL["rna"], 12, ko)
        text(c, "1本の mRNA", 1400, y + 92, 32, PAL["rna"], "heavy", alpha=ko * km)
    kr = ease(prog(t, t_r - 0.3, 0.8))
    if kr > 0:
        panel(c, 120, 490, 1680, 380, kr, border=PAL["orange"])
        text(c, "レギュロン", 220, 560, 44, PAL["orange"], "heavy", alpha=kr)
        y = 700
        p = skia.Path()
        for i in range(200):
            u = i / 199
            x = 200 + u * 1500
            yy = y + math.sin(u * 9) * 60
            p.moveTo(x, yy) if i == 0 else p.lineTo(x, yy)
        c.drawPath(p, paint(PAL["dna"], kr, 8))
        on = ease(prog(t, t_r + 3.0, 0.8))
        for i, u in enumerate((0.08, 0.35, 0.62, 0.88)):
            x = 200 + u * 1500
            yy = y + math.sin(u * 9) * 60
            rrect(c, x - 60, yy - 22, 120, 44, 8, PAL["green"] if on > 0.5 else 0xFF555570, kr)
            text_center(c, f"遺伝子{i + 1}", x, yy, 24, 0xFF101010, "heavy", "center", kr)
            mol.blob(c, x, yy - 70 + (1 - on) * -40, 70, 44, PAL["orange"], kr * on, shape="oval")
            if on > 0.5:
                glow(c, x, yy, 90, PAL["green"], 0.35 * on)
        text(c, "散らばった遺伝子群を一斉に調節（熱ショックレギュロン、SOSレギュロン など）", W / 2, 840, 30, PAL["text"], "bold",
             "center", ease(prog(t, t_r + 1.5, 0.6)))
    cast(c, t, S, akari=False, nuku=False)
    hud(c, t, S)
    scene_fade(c, t, S, fout=0.6)
