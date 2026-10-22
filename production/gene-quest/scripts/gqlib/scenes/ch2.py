"""CHAPTER 2 RNAを作る職人（資料 p.5–11）。"""
from __future__ import annotations

import math

import skia

from .. import mol
from ..anim import transcribing
from ..bg import background
from ..draw import (BASE_COLORS, H, PAL, W, arrow, circle, clamp, ease, ease_back, ease_out, glow, label, lerp, line,
                    paint, panel, prog, rrect, text, text_center)
from ..layout import cast, chapter_intro, hud, scene_fade, term_card
from ..render import visual


# ------------------------------------------------------------------ SC0201 RNAポリメラーゼ（p.5）
@visual("meet_polymerase")
def meet_polymerase(c, t, S):
    background(c, "nucleus", t)
    t_ap = S.cue("pol_appear")
    t_lab = S.cue("labels")
    u = prog(t, t_ap - 0.5, S.duration - t_ap)
    pol_x = lerp(600, 1100, ease(u))
    s = lerp(1.25, 1.55, ease(prog(t, S.cue("cutaway"), 2.0)))
    k = ease(prog(t, t_ap - 0.6, 1.0))
    c.save()
    c.translate(0, 40)
    transcribing(c, t, -100, 2050, 470, pol_x, gap=70, k_open=1.0, rna_len=lerp(160, 520, u), scale=s, alpha=k,
                 pol_face=True, pol_expr=S.expr("pol", t), front_alpha=0.78)
    c.restore()
    kl = ease(prog(t, t_lab, 0.6))
    if kl > 0:
        y = 510
        label(c, "活性部位", pol_x + 40, y - 280, 30, PAL["yellow"], 0xFF120E30, kl, border=PAL["yellow"],
              tx=pol_x + 40 * s, ty=y - 32)
        label(c, "リボヌクレオシド三リン酸の入り口", pol_x + 260, y + 340, 28, PAL["text"], 0xFF120E30,
              ease(prog(t, t_lab + 0.6, 0.6)), border=PAL["green"], tx=pol_x + 230 * s * 0.8, ty=y + 150)
        label(c, "RNAの出口", pol_x - 420, y + 300, 28, PAL["rna"], 0xFF120E30, ease(prog(t, t_lab + 1.4, 0.6)),
              border=PAL["rna"], tx=pol_x - 180 * s, ty=y + 150)
        label(c, "短いDNA/RNAらせん", pol_x - 300, y - 250, 28, PAL["text"], 0xFF120E30, ease(prog(t, t_lab + 2.2, 0.6)),
              border=PAL["dna"], tx=pol_x - 60 * s, ty=y - 30)
    term_card(c, t, t_ap + 1.2, "RNAポリメラーゼ", "DNAを鋳型にRNAを合成する酵素", W / 2, 105, end=S.cue("cutaway") - 0.2,
              color=PAL["pol"], size=58)
    cast(c, t, S, akari_s=0.5, nuku_x=1800, nuku_y=800, nuku_s=0.5, enter_a=t_ap - 0.6, enter_n=t_ap - 0.6)
    hud(c, t, S)
    chapter_intro(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0202 鋳型鎖（p.7）
NONTEMP = "ATGAAATGCTA"
TEMPLATE = "TACTTTACGAT"
RNA7 = "AUGAAAUGCUA"


def seq_row(c, seq, x0, y, step, alpha, size=40, dim_idx=None, upto=None):
    n = len(seq) if upto is None else max(0, min(len(seq), upto))
    for i in range(int(math.ceil(n))):
        b = seq[i]
        a = alpha * min(1.0, n - i)
        rrect(c, x0 + i * step - step * 0.42, y - 30, step * 0.84, 60, 12, BASE_COLORS[b], a * 0.22)
        text_center(c, b, x0 + i * step, y, size, BASE_COLORS[b], "heavy", "center", a, stroke=4)


@visual("template_strand")
def template_strand(c, t, S):
    background(c, "nucleus", t)
    t_st, t_pair, t_cmp, t_same = S.cue("strands"), S.cue("pairing"), S.cue("compare"), S.cue("same")
    step = 78
    x0 = W / 2 - step * 5
    sep = ease(prog(t, t_st, 1.0))
    y_nt = lerp(360, 280, sep)
    y_t = lerp(430, 470, sep)
    k = ease(prog(t, 0.2, 0.8))
    panel(c, x0 - 230, 190, step * 11 + 330, 560, 0.5 * k)
    # 非鋳型鎖
    line(c, x0 - 40, y_nt - 46, x0 + step * 10 + 40, y_nt - 46, PAL["dna"], 6, k)
    seq_row(c, NONTEMP, x0, y_nt, step, k)
    text_center(c, "5'", x0 - 90, y_nt, 34, PAL["text"], "heavy", "center", k, stroke=4)
    text_center(c, "3'", x0 + step * 10 + 90, y_nt, 34, PAL["text"], "heavy", "center", k, stroke=4)
    # 鋳型鎖
    line(c, x0 - 40, y_t + 46, x0 + step * 10 + 40, y_t + 46, PAL["dna2"], 6, k)
    seq_row(c, TEMPLATE, x0, y_t, step, k)
    text_center(c, "3'", x0 - 90, y_t, 34, PAL["text"], "heavy", "center", k, stroke=4)
    text_center(c, "5'", x0 + step * 10 + 90, y_t, 34, PAL["text"], "heavy", "center", k, stroke=4)
    if sep < 0.5:
        for i in range(11):
            line(c, x0 + i * step, y_nt + 30, x0 + i * step, y_t - 30, 0xFFCCC4FF, 3, k * (1 - sep * 2), dash=(6, 6))
    if sep > 0:
        label(c, "非鋳型鎖", x0 - 250, y_nt, 30, PAL["dna"], 0xFF120E30, sep, border=PAL["dna"])
        label(c, "鋳型鎖", x0 - 240, y_t, 30, PAL["yellow"], 0xFF120E30, sep, border=PAL["yellow"])
        glow(c, x0 + step * 5, y_t, 560, PAL["yellow"], 0.10 * sep)
    # RNA を鋳型鎖に相補的に並べる（左が 5'）
    upto = 11 * ease(prog(t, t_pair + 0.4, 4.0))
    move = ease(prog(t, t_cmp + 0.8, 1.2))
    y_r = lerp(640, y_nt - 0, 0) if move <= 0 else lerp(640, 640, 0)
    if upto > 0:
        yr = 640
        for i in range(int(math.ceil(upto))):
            line(c, x0 + i * step, y_t + 30, x0 + i * step, yr - 30, 0xFF9FF5DA, 3, min(1, upto - i) * (1 - move) * 0.8, dash=(5, 6))
        seq_row(c, RNA7, x0, yr, step, 1.0, upto=upto)
        line(c, x0 - 40, yr + 46, x0 + step * (min(upto, 11) - 0.5), yr + 46, PAL["rna"], 7)
        text_center(c, "5'", x0 - 90, yr, 34, PAL["rna"], "heavy", "center", 1, stroke=4)
        if upto >= 10.99:
            text_center(c, "3'", x0 + step * 10 + 90, yr, 34, PAL["rna"], "heavy", "center", 1, stroke=4)
        label(c, "RNA", x0 - 230, yr, 30, PAL["rna"], 0xFF120E30, min(1, upto), border=PAL["rna"])
    # U を強調
    ku = ease(prog(t, S.L(4), 0.6)) * (1 - ease(prog(t, t_cmp, 0.5)))
    if ku > 0:
        for i, b in enumerate(RNA7):
            if b == "U":
                circle(c, x0 + i * step, 640, 40, PAL["orange"], ku, stroke=5)
        term_card(c, t, S.L(4), "T → U", "RNAではチミン（T）の代わりにウラシル（U）", W / 2, 840, end=t_cmp - 0.2,
                  color=PAL["orange"], size=54)
    # 比較：非鋳型鎖と RNA を並べて同じ位置を示す
    if move > 0:
        for i, (a, b) in enumerate(zip(NONTEMP, RNA7)):
            kk = ease(prog(t, t_cmp + 0.8 + i * 0.12, 0.4))
            col = PAL["green"] if a == b else PAL["orange"]
            rrect(c, x0 + i * step - 34, y_nt - 36, 68, 72, 14, col, kk * 0.9, stroke=4)
            rrect(c, x0 + i * step - 34, 640 - 36, 68, 72, 14, col, kk * 0.9, stroke=4)
        text(c, "同じ配列（TがUになっただけ）", W / 2, 790, 40, PAL["green"], "heavy", "center",
             ease(prog(t, t_same, 0.5)), stroke=5)
    cast(c, t, S, akari_s=0.5, nuku_y=720, nuku_s=0.55)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0203 5'→3'（p.8, 10）
TPL10 = "TAGCCTATC"   # 上が 3'
RNA10 = "AUCGGAUAG"   # 上が 5'


@visual("synthesis_direction")
def synthesis_direction(c, t, S):
    background(c, "nucleus", t)
    t_dir, t_ntp, t_bond, t_ppi = S.cue("direction"), S.cue("ntp"), S.cue("bond"), S.cue("ppi")
    x_t, x_r = 560, 400
    y0, step = 200, 72
    k = ease(prog(t, 0.2, 0.8))
    # 鋳型DNA（縦。上が 3'）
    line(c, x_t + 42, y0 - 40, x_t + 42, y0 + step * 8 + 40, PAL["dna2"], 12, k)
    text_center(c, "3'", x_t + 42, y0 - 70, 32, PAL["text"], "heavy", "center", k, stroke=4)
    text_center(c, "5'", x_t + 42, y0 + step * 8 + 74, 32, PAL["text"], "heavy", "center", k, stroke=4)
    label(c, "鋳型鎖DNA", x_t + 190, y0 + step * 8 + 74, 28, PAL["yellow"], 0xFF120E30, k, border=PAL["yellow"])
    for i, b in enumerate(TPL10):
        text_center(c, b, x_t, y0 + i * step, 42, BASE_COLORS[b], "heavy", "center", k, stroke=4)
    # RNA が上（5'）から1個ずつ伸びる
    n = 1 + 8 * ease(prog(t, t_ntp - 0.5, (t_ppi - t_ntp) + 3.0))
    n = min(9.0, n)
    for i in range(int(math.ceil(n))):
        a = min(1.0, n - i)
        b = RNA10[i]
        yy = y0 + i * step
        drop = (1 - ease_out(a)) * 120
        text_center(c, b, x_r - drop, yy, 42, BASE_COLORS[b], "heavy", "center", a, stroke=4)
        c.drawLine(x_r + 28, yy, x_t - 28, yy, paint(0xFFCCC4FF, a * 0.8, 3))
        text(c, "···", (x_r + x_t) / 2, yy + 8, 26, PAL["muted"], "bold", "center", a)
    line(c, x_r - 44, y0 - 40, x_r - 44, y0 + step * (n - 1) + 30, PAL["rna"], 12, k)
    text_center(c, "5'", x_r - 44, y0 - 70, 32, PAL["rna"], "heavy", "center", k, stroke=4)
    text_center(c, "3'", x_r - 44, y0 + step * (n - 1) + 70, 32, PAL["rna"], "heavy", "center", k, stroke=4)
    # 向きの矢印
    kd = ease(prog(t, t_dir + 0.5, 1.0))
    arrow(c, x_r - 130, y0, x_r - 130, y0 + step * 7, PAL["rna"], 8, kd, progress=kd, head=24)
    text(c, "RNAは 5'→3'", x_r - 160, y0 + step * 3.5, 34, PAL["rna"], "heavy", "right", kd, stroke=5)
    arrow(c, x_t + 130, y0, x_t + 130, y0 + step * 7, PAL["yellow"], 8, kd, progress=kd, head=24)
    text(c, "鋳型は 3'→5' に読む", x_t + 160, y0 + step * 3.5, 34, PAL["yellow"], "heavy", "left", kd, stroke=5)
    # 入ってくる NTP
    for j, (nm, b, tt) in enumerate((("UTP", "U", t_ntp + 0.6), ("CTP", "C", t_ntp + 2.4))):
        kk = ease(prog(t, tt, 0.8)) * (1 - ease(prog(t, tt + 1.4, 0.5)))
        if kk > 0:
            yy = y0 + (j + 1) * step
            x = lerp(x_r - 380, x_r - 60, ease(prog(t, tt, 1.2)))
            circle(c, x, yy, 30, BASE_COLORS[b], kk)
            text_center(c, b, x, yy, 30, 0xFF101020, "heavy", "center", kk)
            label(c, nm, x, yy - 60, 30, 0xFF101020, BASE_COLORS[b], kk)
    # 結合の拡大（p.8）
    kb = ease(prog(t, t_bond, 0.6))
    if kb > 0:
        px, py, pw, ph = 1080, 210, 700, 560
        panel(c, px, py, pw, ph, kb, border=PAL["yellow"])
        text(c, "リン酸ジエステル結合ができる", px + pw / 2, py + 56, 36, PAL["yellow"], "heavy", "center", kb)
        # 伸長中の RNA の末端（糖の 3'OH）
        rrect(c, px + 60, py + 120, 200, 90, 20, PAL["rna"], kb * 0.85)
        text_center(c, "RNA鎖", px + 160, py + 150, 30, 0xFF06302A, "heavy", "center", kb)
        text_center(c, "…糖–3'OH", px + 160, py + 186, 28, 0xFF06302A, "heavy", "center", kb)
        # 入ってくる NTP（5'三リン酸）
        u = ease(prog(t, t_bond + 1.0, 1.5))
        nx = lerp(px + 470, px + 290, u)
        rrect(c, nx, py + 120, 220, 90, 20, PAL["orange"], kb * 0.9)
        text_center(c, "PPP–5'糖…", nx + 110, py + 150, 28, 0xFF3A1A00, "heavy", "center", kb)
        text_center(c, "ヌクレオチド", nx + 110, py + 186, 26, 0xFF3A1A00, "heavy", "center", kb)
        kj = ease(prog(t, t_ppi, 0.6))
        if kj > 0:
            text(c, "3'炭素 – O – P – O – 5'炭素", px + pw / 2, py + 300, 38, PAL["text"], "heavy", "center", kj, stroke=4)
            text(c, "（リン酸ジエステル結合）", px + pw / 2, py + 350, 30, PAL["yellow"], "bold", "center", kj)
            pp = ease(prog(t, t_ppi + 0.6, 1.5))
            label(c, "ピロリン酸（PP）", px + 540, lerp(py + 420, py + 470, pp), 30, PAL["text"], 0xFF3A2A10, kj,
                  border=PAL["orange"])
            text(c, "材料：ATP・UTP・CTP・GTP", px + 250, py + ph - 40, 32, PAL["text"], "bold", "center",
                 ease(prog(t, S.L(5), 0.6)))
    cast(c, t, S, akari_s=0.5, nuku_x=1820, nuku_y=860, nuku_s=0.5)
    hud(c, t, S, why_x=700)  # 左上は RNA の 5' の表示と重なるので、問いの札は上の中央へ
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0204 プロモーター（p.6, 11）
GENES = [  # 資料 p.11：(プロモーターのx, 矢印の始点x, 終点x, 名前)。右向きは下側、左向きは上側に描く
    (220, 260, 600, "遺伝子a"), (650, 690, 1030, "遺伝子b"), (1150, 1110, 860, "遺伝子c"), (1300, 1260, 1150, "遺伝子d"),
    (1440, 1480, 1780, "遺伝子e"),
]


@visual("promoter_map")
def promoter_map(c, t, S):
    background(c, "nucleus", t)
    t_pr, t_rev, t_term = S.cue("promoter"), S.cue("reverse"), S.cue("terminator")
    show_map = 1 - ease(prog(t, t_term - 0.3, 0.6))
    if show_map > 0:
        k = ease(prog(t, 0.2, 0.9)) * show_map
        y = 420
        line(c, 120, y - 14, 1800, y - 14, 0xFF2A2060, 16, k)
        line(c, 120, y + 14, 1800, y + 14, 0xFF2A2060, 16, k)
        line(c, 120, y - 14, 1800, y - 14, PAL["dna"], 5, k)
        line(c, 120, y + 14, 1800, y + 14, PAL["dna2"], 5, k)
        text_center(c, "5'", 80, y - 14, 28, PAL["text"], "heavy", "center", k, stroke=4)
        text_center(c, "3'", 80, y + 14, 28, PAL["text"], "heavy", "center", k, stroke=4)
        text_center(c, "3'", 1840, y - 14, 28, PAL["text"], "heavy", "center", k, stroke=4)
        text_center(c, "5'", 1840, y + 14, 28, PAL["text"], "heavy", "center", k, stroke=4)
        kp = ease(prog(t, t_pr + 0.5, 0.8)) * show_map
        for i, (px, xs, xe, name) in enumerate(GENES):
            kk = kp * ease(prog(t, t_pr + 0.5 + i * 0.35, 0.5))
            right = xe > xs
            circle(c, px, y, 46, PAL["red"], kk, stroke=5)
            text(c, "P", px, y + 105, 40, PAL["red"], "heavy", "center", kk, stroke=4)
            yy = y + 60 if right else y - 60
            ka = kk if right else kk * max(0.4, ease(prog(t, t_rev, 0.6)))
            arrow(c, xs, yy, xe, yy, PAL["orange"], 10, ka, head=26)
            text(c, name, (xs + xe) / 2, yy + 55 if right else yy - 25, 30, PAL["text"], "heavy", "center", ka)
            if not right:
                hk = ease(prog(t, t_rev, 0.5)) * (1 - ease(prog(t, t_rev + 3.5, 0.8)))
                glow(c, (xs + xe) / 2, yy, 150, PAL["yellow"], 0.35 * hk)
        text(c, "P：プロモーター　→：転写の向き（転写産物RNA）", W / 2, 700, 32, PAL["muted"], "bold", "center", kp)
        if ease(prog(t, S.cue("role"), 0.5)) > 0:
            term_card(c, t, S.cue("role"), "プロモーター", "RNAポリメラーゼを結合させ、開始点と鋳型鎖を決める", W / 2, 180,
                      end=t_term - 0.3, color=PAL["red"], size=56)
    kt = ease(prog(t, t_term, 0.8))
    if kt > 0:
        # 転写の概要（p.6）：プロモーター → 遺伝子 → ターミネーター
        y = 480
        x0 = 300
        rrect(c, x0, y - 30, 180, 60, 10, PAL["mediator"], kt)
        rrect(c, x0 + 180, y - 30, 820, 60, 10, PAL["yellow"], kt * 0.9)
        rrect(c, x0 + 1000, y - 30, 220, 60, 10, PAL["green"], kt)
        line(c, 150, y, x0, y, PAL["muted"], 6, kt)
        line(c, x0 + 1220, y, 1700, y, PAL["muted"], 6, kt)
        text(c, "プロモーター", x0 + 90, y + 90, 32, PAL["text"], "heavy", "center", kt)
        text(c, "遺伝子", x0 + 590, y + 12, 34, 0xFF3A2A00, "heavy", "center", kt)
        text(c, "ターミネーター", x0 + 1110, y + 90, 32, PAL["text"], "heavy", "center", kt)
        steps = [("開始", x0 + 180), ("伸長", x0 + 590), ("終結", x0 + 1000)]
        for i, (s_, xx) in enumerate(steps):
            kk = ease_back(prog(t, t_term + 0.8 + i * 0.8, 0.5))
            label(c, s_, xx, y - 120, 38, 0xFF101030, [PAL["pol"], PAL["rna"], PAL["green"]][i], kk)
        kk = ease(prog(t, t_term + 0.8, 2.6))
        arrow(c, x0 + 180, y - 60, x0 + 180 + 820 * kk, y - 60, PAL["pol"], 8, kt, head=24)
    cast(c, t, S, akari_s=0.5, nuku_y=760, nuku_s=0.55)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ チェックポイント（SC0205, SC0405）
CHECKS = {
    "SC0205": {"q": ["鋳型鎖が 3'-TAC-5' のとき、", "合成される RNA は？"], "a": "5'-AUG-3'",
               "note": "鋳型鎖と逆向き・相補的。T→A、A→U、C→G"},
    "SC0405": {"q": ["① TATAボックスを見分けて結合するのは？", "② CTD をリン酸化するのは？"], "a": "① TBP（TFIID）　② TFIIH",
               "note": "TFIIH は DNA をほどき、CTD の Ser5 をリン酸化する（p.32）"},
}


@visual("checkpoint")
def checkpoint(c, t, S):
    background(c, "quiz", t)
    d = CHECKS[S.id]
    tq, tt, ta = S.cue("question"), S.cue("think"), S.cue("answer")
    k = ease_back(prog(t, 0.1, 0.6))
    c.save()
    c.translate(W / 2, 140)
    c.scale(k, k)
    rrect(c, -260, -50, 520, 100, 50, PAL["yellow"], 1)
    text_center(c, "CHECK POINT", 0, 0, 52, 0xFF2A1A00, "heavy", "center")
    c.restore()
    kq = ease(prog(t, tq, 0.6))
    panel(c, 360, 260, 1200, 270, kq, border=PAL["yellow"])
    for i, s in enumerate(d["q"]):
        text(c, s, W / 2, 360 + i * 80, 52, PAL["white"], "heavy", "center", kq)
    # 考える時間：ゲージ
    kt = prog(t, tt, max(0.5, ta - tt))
    if 0 < kt < 1:
        rrect(c, 560, 580, 800, 26, 13, 0xFF2A2060, 1)
        rrect(c, 560, 580, 800 * (1 - kt), 26, 13, PAL["yellow"], 1)
    ka = ease_back(prog(t, ta, 0.5))
    if ka > 0:
        c.save()
        c.translate(W / 2, 700)
        c.scale(ka, ka)
        rrect(c, -460, -70, 920, 140, 30, 0xFF0F3A2A, 0.95)
        rrect(c, -460, -70, 920, 140, 30, PAL["green"], 1, stroke=5)
        text_center(c, d["a"], 0, -10, 60, PAL["green"], "heavy", "center", 1)
        c.restore()
        text(c, d["note"], W / 2, 820, 32, PAL["text"], "bold", "center", ease(prog(t, ta + 0.6, 0.5)))
    cast(c, t, S, akari_s=0.55, nuku_y=700, nuku_s=0.6)
    scene_fade(c, t, S)
