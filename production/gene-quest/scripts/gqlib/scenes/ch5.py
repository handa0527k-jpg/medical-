"""CHAPTER 5 遺伝子発現のスイッチ（資料 p.26, 34–37, 70）。"""
from __future__ import annotations

import math

import skia

from .. import mol
from ..bg import background
from ..draw import (H, PAL, W, arrow, circle, clamp, ease, ease_back, ease_out, glow, label, lerp, line, paint, panel,
                    path_from, prog, rrect, text, text_center)
from ..layout import caption_box, cast, chapter_intro, hud, scene_fade, term_card
from ..render import visual


# ------------------------------------------------------------------ SC0501 エンハンサーとループ（p.34, 35）
N_PTS = 160


def straight_path():
    return [(150 + (1820 - 150) * i / (N_PTS - 1), 650) for i in range(N_PTS)]


def loop_path():
    """エンハンサー側の端（上）から左回りのループを経て、プロモーター（下）を通り右端へ。"""
    pts = []
    n1, n2 = 40, 60
    for i in range(n1):  # 上：エンハンサーから左へ
        pts.append((1080 - 480 * i / n1, 360))
    for i in range(n2):  # 左のループ
        a = -math.pi / 2 - math.pi * i / (n2 - 1)
        pts.append((600 + math.cos(a) * 145, 505 + math.sin(a) * 145))
    rest = N_PTS - n1 - n2
    for i in range(rest):  # 下：プロモーターを通って右へ
        pts.append((600 + (1820 - 600) * i / (rest - 1), 650))
    return pts


ENH = (2, 14)   # エンハンサーの点の範囲


@visual("enhancer_loop")
def enhancer_loop(c, t, S):
    background(c, "nucleus", t)
    t_a, t_l, t_s, t_m, t_r = (S.cue(x) for x in ("activator", "loop", "silencer", "mediator", "remodel"))
    kl = ease(prog(t, t_l + 0.8, 2.5))
    A, B = straight_path(), loop_path()
    pts = [(lerp(a[0], b[0], kl), lerp(a[1], b[1], kl)) for a, b in zip(A, B)]
    mol.ladder_path(c, pts, 40, ease(prog(t, 0.2, 0.8)), 22, 0xFFAEB0C8, 0xFF8A8CA8, 5)
    # エンハンサー
    seg = pts[ENH[0]:ENH[1]]
    c.drawPath(path_from(seg), paint(0xFF6FC8FF, 0.85, 16))
    ex, ey = pts[(ENH[0] + ENH[1]) // 2]
    label(c, "エンハンサー", ex, ey + (60 if kl < 0.5 else -70), 28, 0xFF6FC8FF, 0xFF0A1830, ease(prog(t, 0.6, 0.5)))
    # TATA と転写開始点
    tx = lerp(1180, 1150, kl)
    rrect(c, tx - 45, 638, 90, 24, 6, 0xFF8FCB4A, 1)
    line(c, 1300, 650, 1820, 650, 0xFFD23A3A, 10, 0.8)
    if kl < 0.5:
        text(c, "・・・ 数百〜数千 bp ・・・", 700, 720, 30, PAL["muted"], "bold", "center", ease(prog(t, t_l, 0.5)) * (1 - kl * 2))
    # 基本複合体
    mol.tfiid(c, 1150, 610, 0.55, 1, labels=False)
    mol.polymerase(c, 1330, 650, 0.62, "both", 1, t=t)
    # 転写活性化因子
    ka = ease_back(prog(t, t_a, 0.7))
    if ka > 0:
        ax, ay = ex, ey - 70 * ka if kl < 0.5 else ey + 70
        flip = kl >= 0.5
        c.save()
        c.translate(ax, ay)
        if flip:
            c.scale(1, -1)
        mol.blob(c, 0, 0, 110, 100, PAL["activator"], ka, shape="t")
        c.restore()
        label(c, "転写活性化因子", ax + 170, ay, 26, PAL["activator"], 0xFF0A1830, ka)
    km = ease(prog(t, t_m, 0.9))
    if km > 0:
        mol.blob(c, 1170, 510 - (1 - km) * 200, 460, 120, PAL["mediator"], km, shape="arch")
        label(c, "介在因子（メディエーター）", 820, 560 - (1 - km) * 200, 28, 0xFF1A0A30, PAL["mediator"], km)
    kr = ease(prog(t, t_r, 0.9))
    if kr > 0:
        mol.blob(c, 1560, 560, 110, 150, PAL["remodel"], kr, shape="crescent", rot=-80)
        label(c, "クロマチン再構成複合体", 1650, 430, 26, PAL["green"], 0xFF0A2010, kr)
        mol.blob(c, 1460, 600, 90, 80, PAL["histmod"], kr, shape="oval")
        label(c, "ヒストン修飾酵素", 1500, 830, 26, PAL["histmod"], 0xFF2A2000, kr)
        glow(c, 1330, 650, 260, PAL["warm"], 0.25 * kr)
        arrow(c, 1420, 700, 1700, 700, PAL["warm"], 7, kr, head=22)
        text(c, "転写の開始", 1560, 750, 30, PAL["warm"], "heavy", "center", kr)
    ks = ease(prog(t, t_s, 0.6)) * (1 - ease(prog(t, t_m, 0.5)))
    if ks > 0:
        caption_box(c, ["エンハンサー（＋）：転写効率を増強", "サイレンサー（−）：転写を抑える"], 140, 120, 34, ks, border=PAL["warm"])
    cast(c, t, S, akari_s=0.45, nuku_x=1810, nuku_y=200, nuku_s=0.42)
    hud(c, t, S)
    chapter_intro(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0502 調節配列の地図（p.35）
@visual("regulatory_map")
def regulatory_map(c, t, S):
    background(c, "nucleus", t)
    t_p, t_d = S.cue("proximal"), S.cue("distal")
    y = 560
    k = ease(prog(t, 0.2, 0.6))
    line(c, 80, y, 1840, y, PAL["text"], 5, k)
    boxes = [  # (x, w, 名前, 色, 出る時刻のずらし)
        (1700, 160, "遺伝子", 0xFFD0D0E0, 0.0), (1480, 110, "Inr", 0xFFC0C0D8, 0.3), (1280, 130, "TATA", 0xFF8FCB4A, 0.6),
        (960, 250, "GC / CAAT", PAL["yellow"], 1.8), (560, 270, "エンハンサー(+)\nサイレンサー(−)", PAL["warm"], 0.2),
        (220, 250, "他の応答配列", PAL["cool"], 1.0)]
    for x, w, nm, col, dt in boxes:
        tt = (t_p if x > 900 else t_d) + dt
        kk = ease_back(prog(t, tt, 0.5))
        if kk <= 0:
            continue
        rrect(c, x - w / 2, y - 60, w, 120, 14, col, kk * 0.92)
        for j, s in enumerate(nm.split("\n")):
            text_center(c, s, x, y - 12 * (len(nm.split("\n")) - 1) + j * 32, 28, 0xFF101020, "heavy", "center", kk)
    def bracket(x0, x1, yy, s, col, kk):
        if kk <= 0:
            return
        line(c, x0, yy, x1, yy, col, 4, kk)
        line(c, x0, yy - 14, x0, yy + 14, col, 4, kk)
        line(c, x1, yy - 14, x1, yy + 14, col, 4, kk)
        text(c, s, (x0 + x1) / 2, yy - 20, 34, col, "heavy", "center", kk, stroke=5)
    bracket(1200, 1780, 420, "プロモーター", PAL["red"], ease(prog(t, t_p + 0.4, 0.5)))
    bracket(820, 1190, 420, "近位調節要素", PAL["yellow"], ease(prog(t, t_p + 2.2, 0.5)))
    text(c, "＝上流プロモーター要素", 1005, 480, 26, PAL["yellow"], "bold", "center", ease(prog(t, t_p + 2.6, 0.5)))
    bracket(820, 1780, 300, "基礎的発現", PAL["green"], ease(prog(t, t_p + 4.0, 0.5)))
    bracket(90, 800, 420, "遠位調節要素", PAL["warm"], ease(prog(t, t_d + 0.5, 0.5)))
    bracket(90, 800, 300, "調節的発現（細胞ごと）", PAL["cool"], ease(prog(t, t_d + 2.0, 0.5)))
    text(c, "遺伝子から数百〜数千 bp 離れた上流（または下流）", 445, 700, 30, PAL["text"], "bold", "center",
         ease(prog(t, t_d + 1.0, 0.5)))
    cast(c, t, S, akari=False, nuku_x=1800, nuku_y=840, nuku_s=0.42)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0503 クロマチン（p.34, 70）
def bead_string(c, t, cx, cy, n, spread, alpha, seed=0):
    pts = []
    for i in range(n):
        u = i / (n - 1)
        pts.append((cx - spread * 1.1 + 2.2 * spread * u + math.sin(u * 31 + seed) * spread * 0.18,
                    cy + math.sin(u * 9 + seed) * spread * 0.55 + math.cos(u * 23 + seed) * spread * 0.2))
    for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
        line(c, xa, ya, xb, yb, PAL["dna"], 5, alpha * 0.8)
    for x, y in pts:
        mol.nucleosome(c, x, y, 26, alpha, t)
    return pts


@visual("chromatin_states")
def chromatin_states(c, t, S):
    background(c, "nucleus", t)
    t_n, t_e, t_r = S.cue("nucleosome"), S.cue("eu"), S.cue("remodel")
    k = ease(prog(t, 0.2, 0.8))
    # 1つのヌクレオソームの説明
    kn = ease(prog(t, t_n, 0.6)) * (1 - ease(prog(t, t_e, 0.6)))
    if kn > 0:
        mol.nucleosome(c, 960, 430, 120, kn, t)
        label(c, "ヒストン（塩基性タンパク質）", 960, 610, 32, PAL["histone"], 0xFF2A1A10, kn)
        label(c, "DNA", 1150, 300, 32, PAL["dna"], 0xFF1A1040, kn)
        text(c, "ヌクレオソーム → クロマチン", 960, 700, 40, PAL["text"], "heavy", "center", kn, stroke=5)
    ke = ease(prog(t, t_e, 0.8))
    if ke > 0:
        open_k = ease(prog(t, t_r + 1.0, 2.0))
        glow(c, 520, 470, 360, PAL["warm"], 0.25 * ke)
        bead_string(c, t, 520, 470, 18, 280, ke, 0.3)
        mol.polymerase(c, 520, 470, 0.5, "both", ke, t=t)
        label(c, "ユークロマチン（ほぐれている）", 520, 160, 34, PAL["warm"], 0xFF2A1A00, ke)
        text(c, "発現しうる遺伝子", 520, 820, 34, PAL["warm"], "heavy", "center", ke, stroke=5)
        spread = lerp(110, 260, open_k)
        glow(c, 1400, 470, 340, PAL["cool"], 0.25 * ke * (1 - open_k))
        bead_string(c, t, 1400, 470, 26, spread, ke, 1.1)
        label(c, "ヘテロクロマチン（凝集している）", 1400, 160, 34, PAL["cool"], 0xFF0A1830, ke)
        text(c, "発現しない遺伝子", 1400, 820, 34, PAL["cool"], "heavy", "center", ke * clamp(1 - open_k * 2), stroke=5)
        if open_k > 0.5:
            text(c, "クロマチンリモデリング（構造の変化）", 1400, 820, 34, PAL["green"], "heavy", "center", clamp(open_k * 2 - 1), stroke=5)
    cast(c, t, S, akari_s=0.42, akari_x=150, nuku_x=1820, nuku_y=850, nuku_s=0.4)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0504 同じゲノム、違う細胞（p.26, 36, 37）
PAT_A = ["オン", "オフ", "オン", "オン", "オフ", "オフ"]
PAT_B = ["オフ", "オン", "オフ", "オン", "オン", "オン"]


def cell_round(c, x, y, r, alpha, t):
    p = skia.Path()
    for i in range(41):
        a = i / 40 * math.tau
        rr = r * (1 + 0.07 * math.sin(a * 7 + t))
        p.moveTo(x + math.cos(a) * rr, y + math.sin(a) * rr) if i == 0 else p.lineTo(x + math.cos(a) * rr, y + math.sin(a) * rr)
    c.drawPath(p, paint(0xFFFFC9A8, alpha * 0.25))
    c.drawPath(p, paint(0xFFFFC9A8, alpha, 4))
    circle(c, x, y, r * 0.3, PAL["dna"], alpha * 0.8)


def cell_column(c, x, y, w, h, alpha):
    rrect(c, x - w / 2, y - h / 2, w, h, 20, 0xFF9FE8FF, alpha * 0.25)
    rrect(c, x - w / 2, y - h / 2, w, h, 20, 0xFF9FE8FF, alpha, stroke=4)
    for i in range(8):
        xx = x - w / 2 + 10 + i * (w - 20) / 7
        line(c, xx, y + h / 2, xx, y + h / 2 + 40, 0xFF9FE8FF, 5, alpha)
    circle(c, x, y - h * 0.15, w * 0.22, PAL["dna"], alpha * 0.8)


def gene_pattern(c, x0, y, pat, k, t_sw=1.0):
    line(c, x0 - 20, y, x0 + 6 * 110, y, PAL["text"], 4, k)
    for i, st in enumerate(pat):
        on = st == "オン"
        rrect(c, x0 + i * 110, y - 18, 80, 36, 8, PAL["green"] if on else 0xFF505068, k)
        text(c, st, x0 + i * 110 + 40, y - 30, 26, PAL["green"] if on else PAL["muted"], "heavy", "center", k * t_sw)


@visual("same_genome")
def same_genome(c, t, S):
    background(c, "nucleus", t)
    t_d, t_h, t_c = S.cue("diff"), S.cue("hormone"), S.cue("commit")
    k = ease(prog(t, 0.2, 0.8)) * (1 - ease(prog(t, t_h, 0.6)))
    if k > 0:
        cell_round(c, 560, 360, 150, k, t)
        cell_column(c, 1360, 340, 200, 260, k)
        ks = ease(prog(t, t_d + 0.5, 0.8))
        gene_pattern(c, 250, 680, PAT_A, k, ks)
        gene_pattern(c, 1050, 680, PAT_B, k, ks)
        text(c, "同じ遺伝子の並び（同じゲノム）", W / 2, 790, 32, PAL["text"], "bold", "center", k)
        text(c, "分化した細胞は異なる遺伝子を発現する（p.36）", W / 2, 150, 36, PAL["yellow"], "heavy", "center", k * ks)
    kh = ease(prog(t, t_h, 0.6)) * (1 - ease(prog(t, t_c, 0.6)))
    if kh > 0:
        panel(c, 120, 140, 820, 560, kh, border=PAL["warm"])
        text(c, "ホルモン・調節分子", 530, 200, 36, PAL["warm"], "heavy", "center", kh)
        circle(c, 260, 400, 70, 0xFFFFC9A8, kh, stroke=4)
        for i in range(6):
            circle(c, 360 + i * 30 + (t * 40 % 30), 380 + (i % 2) * 30, 9, PAL["warm"], kh)
        circle(c, 640, 400, 90, 0xFF9FE8FF, kh, stroke=4)
        text(c, "受容体", 640, 530, 28, PAL["text"], "bold", "center", kh)
        rrect(c, 760, 380, 140, 36, 8, PAL["green"], kh)
        text(c, "ホルモン応答性遺伝子", 760, 600, 26, PAL["green"], "heavy", "center", kh)
        panel(c, 980, 140, 820, 560, kh, border=PAL["red"])
        text(c, "β-グロビン遺伝子：発生段階で制御", 1390, 200, 32, PAL["red"], "heavy", "center", kh)
        stages = [("胚", 1090), ("胎児", 1380), ("成体", 1660)]
        cur = int(clamp((t - t_h - 2.0) / 1.5, 0, 2.99))
        line(c, 1020, 420, 1760, 420, PAL["text"], 4, kh)
        for i, (nm, x) in enumerate(stages):
            on = i == cur
            for j in range(1 if i == 0 else 2):
                rrect(c, x - 50 + j * 60, 402, 44, 36, 6, PAL["green"] if on else 0xFF505068, kh)
            text(c, nm, x, 500, 36, PAL["green"] if on else PAL["muted"], "heavy", "center", kh)
    kc = ease(prog(t, t_c, 0.8))
    if kc > 0:
        text(c, "細胞のコミットメントと転写因子（p.37）", W / 2, 150, 38, PAL["yellow"], "heavy", "center", kc)
        cols = [0xFFFF6FD8, 0xFFFFC08A, 0xFF8FF08A, 0xFF4FC8F0]
        for row, yy in ((0, 330), (1, 620)):
            for i, col in enumerate(cols):
                x = 560 + i * 290
                a = kc * (0.3 if (row == 1 and i == 3) else 1.0)
                circle(c, x, yy, 70, col, a)
                if i < 3:
                    arrow(c, x + 80, yy, x + 210, yy, 0xFF4FD0D0, 8, kc * (0.3 if (row == 1 and i == 2) else 1))
            text(c, "lineage A" if row == 0 else "", 1520, yy + 10, 30, PAL["text"], "heavy", alpha=kc)
        text(c, "正常な分化", 220, 340, 30, PAL["text"], "bold", "center", kc)
        text(c, "分化ブロック＋", 220, 600, 28, PAL["text"], "bold", "center", kc)
        text(c, "他系統への分化＋自己複製能", 220, 640, 26, PAL["text"], "bold", "center", kc)
        circle(c, 1430, 780, 60, 0xFFFF3A10, kc * ease(prog(t, t_c + 2.5, 0.6)))
        arrow(c, 1160, 680, 1360, 760, 0xFF4FD0D0, 7, kc * ease(prog(t, t_c + 2.5, 0.6)))
        text(c, "✕", 1360, 620, 44, PAL["red"], "heavy", "center", kc * ease(prog(t, t_c + 2.0, 0.4)))
    cast(c, t, S, akari_s=0.42, akari_x=150, nuku_x=1820, nuku_y=850, nuku_s=0.4)
    hud(c, t, S, why_x=700, why_y=832)  # 上は見出しの文
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0505 原核と真核の調節（p.70）
@visual("regulation_compare")
def regulation_compare(c, t, S):
    background(c, "nucleus", t)
    t_p, t_e = S.cue("prok"), S.cue("euk")
    kp = ease(prog(t, t_p - 0.2, 0.6))
    panel(c, 100, 150, 700, 600, kp, border=PAL["sigma"])
    text(c, "原核生物", 450, 220, 42, PAL["sigma"], "heavy", "center", kp)
    steps_p = ["DNA", "mRNA の合成（転写）", "タンパク質"]
    for i, s in enumerate(steps_p):
        y = 330 + i * 150
        label(c, s, 450, y, 34, PAL["text"], 0xFF101030, kp, border=PAL["sigma"] if i == 1 else 0xFF6E5CC8)
        if i < 2:
            arrow(c, 450, y + 35, 450, y + 110, PAL["muted"], 5, kp)
    glow(c, 450, 480, 120, PAL["yellow"], 0.4 * kp)
    text(c, "★ 調節はここ", 600, 560, 30, PAL["yellow"], "heavy", "center", kp)
    ke = ease(prog(t, t_e - 0.2, 0.6))
    panel(c, 880, 150, 940, 700, ke, border=PAL["pol"])
    text(c, "真核生物", 1350, 220, 42, PAL["pol"], "heavy", "center", ke)
    steps_e = ["DNA（クロマチン）", "転写 → mRNA 前駆体", "修飾（キャップ・ポリA・スプライシング）", "核から細胞質への輸送", "翻訳"]
    for i, s in enumerate(steps_e):
        y = 310 + i * 115
        label(c, s, 1300, y, 32, PAL["text"], 0xFF101030, ke, border=PAL["pol"])
        if i < 4:
            arrow(c, 1300, y + 32, 1300, y + 82, PAL["muted"], 5, ke)
        if i in (1, 2, 3):
            kk = ease_back(prog(t, t_e + 1.0 + (i - 1) * 0.8, 0.4))
            text(c, "★", 1700, y + 12, 40, PAL["yellow"], "heavy", "center", kk)
    text(c, "★ 転写調節 ＋ 転写後調節", 1350, 830, 30, PAL["yellow"], "heavy", "center", ease(prog(t, t_e + 3.5, 0.5)))
    cast(c, t, S, akari_s=0.4, akari_x=130, nuku_x=1850, nuku_y=960, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S, fout=0.6)
