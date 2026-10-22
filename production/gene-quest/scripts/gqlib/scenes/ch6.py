"""CHAPTER 6 RNA編集工房（資料 p.4, 46–53, 71）。"""
from __future__ import annotations

import math

import skia

from .. import mol
from ..anim import transcribing
from ..bg import background
from ..draw import (BASE_COLORS, H, PAL, W, arrow, circle, clamp, ease, ease_back, ease_out, glow, label, lerp, line,
                    paint, panel, path_from, prog, rrect, text, text_center)
from ..layout import caption_box, cast, chapter_intro, hud, scene_fade, speaker_tag, term_card
from ..render import visual

NAMES = {"splice": ("スプライソソーム", PAL["u5"])}
EX1, EX2, EX3, EX4 = PAL["exon1"], PAL["exon2"], PAL["exon3"], PAL["exon4"]


def cap(c, x, y, k=1.0, s=1.0, label_on=True):
    circle(c, x, y, 22 * s, PAL["yellow"], k)
    circle(c, x, y, 22 * s, 0xFFB08800, k, 3)
    if label_on:
        text(c, "m7G", x, y - 34 * s, 26 * s, PAL["yellow"], "heavy", "center", k, stroke=4)


def polya_tail(c, x, y, n, k=1.0, s=1.0):
    for i in range(int(n)):
        text_center(c, "A", x + i * 22 * s, y, 26 * s, BASE_COLORS["A"], "heavy", "center", k * min(1, n - i), stroke=4)


def mrna_bar(c, x, y, segs, k=1.0, h=34, cap_on=True, tail=0, labels=True):
    """segs = [(幅, 色, 名前)]。左端に m7G、右端にポリA。"""
    xx = x
    if cap_on:
        cap(c, x - 26, y, k, label_on=labels)
    for w, col, nm in segs:
        if col is None:
            line(c, xx, y, xx + w, y, PAL["intron"], 6, k)
        else:
            rrect(c, xx, y - h / 2, w, h, 6, col, k)
            if nm and labels:
                text_center(c, nm, xx + w / 2, y, 24, 0xFF101020, "heavy", "center", k)
        xx += w
    if tail:
        line(c, xx, y, xx + 30, y, PAL["red"], 6, k)
        polya_tail(c, xx + 44, y, tail, k)
    return xx


# ------------------------------------------------------------------ SC0601 プレmRNAの加工（p.4, 46）
@visual("processing_overview")
def processing_overview(c, t, S):
    background(c, "workshop", t)
    t_p, t_s = S.cue("premrna"), S.cue("steps")
    u = prog(t, 0, S.duration)
    k = ease(prog(t, t_p - 0.5, 0.8))
    if k > 0:
        transcribing(c, t, -50, 1970, 300, lerp(700, 1000, u), gap=60, rna_len=lerp(200, 420, u), scale=0.8, alpha=k,
                     show_dir=False, labels=False)
        label(c, "mRNA前駆体（pre-mRNA, hnRNA）", 540, 470, 30, PAL["rna"], 0xFF0A2028, k)
    stations = [("5'キャップの付加", "キャッピング酵素", PAL["yellow"]), ("ポリAの付加", "ポリ(A)ポリメラーゼ", PAL["orange"]),
                ("スプライシング", "スプライソソーム", PAL["u5"])]
    for i, (nm, enz, col) in enumerate(stations):
        kk = ease_back(prog(t, t_s + 0.8 + i * 1.6, 0.5))
        if kk <= 0:
            continue
        x = 380 + i * 520
        rrect(c, x - 220, 590, 440, 170, 26, 0xFF1A0E30, kk * 0.9)
        rrect(c, x - 220, 590, 440, 170, 26, col, kk, stroke=4)
        text(c, f"{i + 2}）{nm}", x, 660, 36, col, "heavy", "center", kk)
        text(c, enz, x, 715, 28, PAL["text"], "bold", "center", kk)
        if i < 2:
            arrow(c, x + 225, 675, x + 295, 675, PAL["muted"], 6, kk)
    k3 = ease(prog(t, S.L(4), 0.6))
    if k3 > 0:
        text(c, "核 → 細胞質へ → リボソームで翻訳", W / 2, 850, 40, PAL["rna"], "heavy", "center", k3, stroke=5)
    text(c, "1）RNAポリメラーゼIIによる mRNA前駆体の合成（p.46）", 120, 130, 30, PAL["pol"], "heavy", alpha=k)
    cast(c, t, S, akari=False, nuku_x=1820, nuku_y=150, nuku_s=0.4)
    hud(c, t, S, show_chapter=False)
    chapter_intro(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0602 5'キャップ（p.47）
@visual("cap_formation")
def cap_formation(c, t, S):
    background(c, "workshop", t)
    t_g, t_m = S.cue("addG"), S.cue("methyl")
    y = 480
    k = ease(prog(t, 0.1, 0.6))
    pts = [(700 + i * 24, y + math.sin(i * 0.5 + t) * 10) for i in range(48)]
    mol.rna_path(c, pts, PAL["rna"], 12, k)
    text(c, "mRNA前駆体（転写一次産物）", 1260, y + 90, 32, PAL["rna"], "heavy", "center", k)
    text_center(c, "3'", 1880, y, 32, PAL["text"], "heavy", "center", k, stroke=4)
    # 5' 末端の三リン酸
    text(c, "ppp", 640, y + 14, 42, PAL["orange"], "heavy", "center", k, stroke=5)
    text_center(c, "5'", 600, y - 70, 32, PAL["text"], "heavy", "center", k, stroke=4)
    kg = ease_back(prog(t, t_g + 0.6, 0.6))
    if kg > 0:
        gx = lerp(400, 545, kg)
        circle(c, gx, y, 44, PAL["green"], kg)
        text_center(c, "G", gx, y, 44, 0xFF102010, "heavy", "center", kg)
        label(c, "5'末端に G を付加", 560, 330, 32, PAL["green"], 0xFF0A2010, kg * (1 - ease(prog(t, t_m, 0.5))))
    km = ease_back(prog(t, t_m + 0.8, 0.6))
    if km > 0:
        mx, my = 545, lerp(200, 410, km)
        circle(c, mx, my, 30, 0xFFFF9FD8, km)
        text_center(c, "CH₃", mx, my, 24, 0xFF3A0A2A, "heavy", "center", km)
        label(c, "Gの7位の窒素をメチル化", 860, 280, 32, 0xFFFF9FD8, 0xFF2A0A20, km)
        kc = ease(prog(t, t_m + 2.0, 0.8))
        if kc > 0:
            glow(c, 545, y, 140, PAL["yellow"], 0.45 * kc)
            text(c, "m7G（7-メチルグアノシン）キャップ", 600, 680, 44, PAL["yellow"], "heavy", "center", kc, stroke=5)
    term_card(c, t, S.L(3), "5'キャップ構造", "", W / 2, 140, end=S.duration, color=PAL["yellow"], size=56)
    cast(c, t, S, akari_s=0.45, nuku_x=1800, nuku_y=820, nuku_s=0.42)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0603 ポリA（p.47）
@visual("polya")
def polya(c, t, S):
    background(c, "workshop", t)
    t_s, t_c, t_t, t_p = (S.cue(x) for x in ("signal", "cut", "tail", "protect"))
    y = 460
    k = ease(prog(t, 0.1, 0.6))
    cut = ease(prog(t, t_c + 0.8, 0.8))
    cap(c, 180, y, k)
    line(c, 205, y, 900, y, PAL["rna"], 12, k)
    text(c, "AAUAAA", 990, y + 14, 40, BASE_COLORS["A"], "heavy", "center", k, stroke=5)
    line(c, 1080, y, 1180 - 0, y, PAL["rna"], 12, k)
    # 切断の後ろ側（GU に富む配列を含む）が離れていく
    dx, dy = cut * 120, cut * 160
    line(c, 1240 + dx, y + dy, 1330 + dx, y + dy, PAL["rna"], 12, k * (1 - cut))
    text(c, "GU", 1380 + dx, y + 14 + dy, 40, BASE_COLORS["G"], "heavy", "center", k * (1 - cut), stroke=5)
    line(c, 1430 + dx, y + dy, 1560 + dx, y + dy, PAL["rna"], 12, k * (1 - cut))
    text_center(c, "3'", 1600 + dx, y + dy, 30, PAL["text"], "heavy", "center", k * (1 - cut), stroke=4)
    ks = ease(prog(t, t_s + 0.5, 0.6)) * (1 - ease(prog(t, t_t, 0.5)))
    if ks > 0:
        label(c, "ポリアデニル化シグナル", 990, y - 100, 30, BASE_COLORS["A"], 0xFF2A0A0A, ks)
        label(c, "GU に富む配列", 1380, y - 100, 30, BASE_COLORS["G"], 0xFF0A2A10, ks)
    kc = ease(prog(t, t_c, 0.5))
    if kc > 0 and cut < 0.99:
        # エンドヌクレアーゼ（はさみ）
        sx, sy = 1210, y - 90 + cut * 70
        for sg in (-1, 1):
            c.save()
            c.translate(sx, sy)
            c.rotate(sg * (25 - cut * 25))
            rrect(c, -8, -80, 16, 90, 8, 0xFFD0D8F0, kc)
            circle(c, 0, -90, 20, 0xFFD0D8F0, kc, stroke=6)
            c.restore()
        label(c, "エンドヌクレアーゼ", sx, sy - 160, 28, PAL["text"], 0xFF101030, kc)
    if cut > 0.5:
        text(c, "3'側がやや短くなる", 1450, 700, 30, PAL["muted"], "bold", "center", clamp(cut * 2 - 1) * (1 - ease(prog(t, t_t, 0.5))))
    kt = prog(t, t_t + 0.5, 3.0)
    if kt > 0:
        n = 1 + 11 * ease(kt)
        line(c, 1080, y, 1180, y, PAL["rna"], 12, 1)
        polya_tail(c, 1210, y, n, 1, 1.3)
        label(c, "ポリ(A)ポリメラーゼ", 1340, y - 110, 30, PAL["orange"], 0xFF2A1A00, ease(prog(t, t_t, 0.5)))
        text(c, "Aを250個まで付加（資料：20〜250個）", 1350, 650, 34, PAL["orange"], "heavy", "center", ease(prog(t, t_t + 1.5, 0.5)))
        text(c, "ポリ(A)末端", 1340, y + 80, 30, PAL["text"], "heavy", "center", ease(kt))
    kp = ease(prog(t, t_p, 0.6))
    if kp > 0:
        for side, x in ((-1, 120), (1, 1520)):
            ph = (t - t_p) * 1.6 % 1.0
            ex = x + side * (60 - abs(math.sin(ph * math.pi)) * 60) + (0 if side < 0 else 0)
            # エキソヌクレアーゼ（かじるパックマン型）が跳ね返される
            p = skia.Path()
            ang = 30 * abs(math.sin(t * 8))
            cx_ = ex - side * 60
            p.moveTo(cx_, y)
            p.arcTo(skia.Rect.MakeXYWH(cx_ - 40, y - 40, 80, 80), (0 if side < 0 else 180) + ang, 360 - 2 * ang, False)
            p.close()
            c.drawPath(p, paint(0xFFB0B0C8, kp))
        glow(c, 180, y, 90, PAL["yellow"], 0.5 * kp)
        glow(c, 1330, y, 140, PAL["orange"], 0.35 * kp)
        caption_box(c, ["5'キャップとポリAは、mRNAを", "エキソヌクレアーゼの攻撃から守る"], 300, 720, 34, kp, border=PAL["yellow"])
    cast(c, t, S, akari=False, nuku_x=1820, nuku_y=840, nuku_s=0.42)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0604 エクソンとイントロン（p.48, 50）
@visual("exon_intron")
def exon_intron(c, t, S):
    background(c, "workshop", t)
    t_sp, t_s, t_g, t_b, t_tab = (S.cue(x) for x in ("split", "splicing", "gtag", "branch", "table"))
    k = ease(prog(t, 0.1, 0.6))
    y = 300
    # DNA の遺伝子
    line(c, 200, y, 1720, y, PAL["dna"], 8, k)
    rrect(c, 360, y - 24, 320, 48, 8, EX1, k)
    rrect(c, 1200, y - 24, 320, 48, 8, EX2, k)
    text(c, "エクソン I", 520, y - 50, 32, EX1, "heavy", "center", k)
    text(c, "イントロン", 940, y - 50, 32, PAL["intron"], "heavy", "center", k)
    text(c, "エクソン II", 1360, y - 50, 32, EX2, "heavy", "center", k)
    text(c, "DNA", 160, y + 12, 30, PAL["dna"], "heavy", "right", k)
    kg = ease(prog(t, t_g, 0.6))
    if kg > 0:
        text(c, "…NNN", 640, y + 90, 32, PAL["muted"], "heavy", "center", kg)
        text(c, "GT", 730, y + 90, 40, PAL["red"], "heavy", "center", kg, stroke=4)
        text(c, "AG", 1150, y + 90, 40, PAL["red"], "heavy", "center", kg, stroke=4)
        text(c, "NN…", 1240, y + 90, 32, PAL["muted"], "heavy", "center", kg)
        text(c, "5'スプライス部位", 700, y + 140, 26, PAL["text"], "bold", "center", kg)
        text(c, "3'スプライス部位", 1180, y + 140, 26, PAL["text"], "bold", "center", kg)
        label(c, "GT-AG 則", 940, y + 90, 32, PAL["yellow"], 0xFF2A2000, kg)
    # mRNA前駆体
    ks = ease(prog(t, t_s - 0.6, 0.8))
    yp = 600
    if ks > 0:
        arrow(c, 940, 470, 940, 540, PAL["muted"], 5, ks)
        text(c, "転写（イントロンも写す）", 960, 515, 26, PAL["muted"], "bold", alpha=ks)
        cap(c, 334, yp, ks)
        rrect(c, 360, yp - 20, 320, 40, 8, EX1, ks)
        line(c, 680, yp, 1200, yp, PAL["intron"], 8, ks)
        rrect(c, 1200, yp - 20, 320, 40, 8, EX2, ks)
        line(c, 1520, yp, 1560, yp, PAL["red"], 6, ks)
        polya_tail(c, 1575, yp, 5, ks)
        text(c, "mRNA前駆体", 200, yp + 12, 30, PAL["rna"], "heavy", "center", ks)
        if kg > 0:
            text(c, "GU", 720, yp - 40, 36, PAL["red"], "heavy", "center", kg, stroke=4)
            text(c, "AG", 1160, yp - 40, 36, PAL["red"], "heavy", "center", kg, stroke=4)
        kb = ease_back(prog(t, t_b, 0.5))
        if kb > 0:
            circle(c, 1060, yp, 26, 0xFFFF6FD8, kb)
            text_center(c, "A", 1060, yp, 30, 0xFF2A0020, "heavy", "center", kb)
            label(c, "ブランチ部位", 1060, yp + 80, 28, 0xFFFF6FD8, 0xFF2A0020, kb)
    kt = ease(prog(t, t_tab, 0.6))
    if kt > 0:
        panel(c, 300, 720, 1320, 170, kt, border=PAL["intron"])
        text(c, "ジストロフィン遺伝子：2400 kb、イントロン 78個、長さの 99% がイントロン（p.48）", 960, 770, 28, PAL["text"],
             "bold", "center", kt)
        x0, w = 360, 1200
        line(c, x0, 830, x0 + w, 830, PAL["intron"], 14, kt)
        for i in range(40):
            xx = x0 + w * (i + 0.5) / 40
            line(c, xx, 818, xx, 842, EX2, 3, kt)
    term_card(c, t, t_sp + 0.4, "不連続遺伝子", "エクソンの間がイントロンで分断されている", W / 2, 120, end=t_s - 0.2, color=EX1, size=54)
    cast(c, t, S, akari=False, nuku_x=1820, nuku_y=850, nuku_s=0.4)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0605 スプライソソーム（p.50–52）
YS = 600
X_GU, X_A, X_AG = 600, 1150, 1330


def intron_points(kl, n=60):
    """イントロン（GU→A→AG）。kl=1 で GU の G がブランチの A に結合した投げ縄。"""
    pts = []
    cx, cy = X_A - 140, YS - 120
    r = math.hypot(X_A - cx, YS - cy)
    a0 = math.atan2(YS - cy, X_A - cx)
    for i in range(n):
        u = i / (n - 1)
        sx, sy = X_GU + (X_A - X_GU) * u, YS
        ang = a0 + math.tau * (1 - u)   # A から一周
        lx, ly = cx + math.cos(ang) * r, cy + math.sin(ang) * r
        pts.append((lerp(sx, lx, kl), lerp(sy, ly, kl)))
    pts.append((X_AG, YS))
    return pts


@visual("spliceosome")
def spliceosome(c, t, S):
    background(c, "workshop", t)
    cue = {x: S.cue(x) for x in ("splice", "snrnp", "u1", "u2", "u456", "release", "lariat", "u5", "joined")}
    kl = ease(prog(t, cue["lariat"] + 1.5, 2.0))
    join = ease(prog(t, cue["joined"] + 0.3, 1.5))
    k = ease(prog(t, 0.1, 0.6))
    drift = join * 220
    # イントロン（投げ縄）
    ip = [(x, y - drift) for x, y in intron_points(kl)]
    a_int = k * (1 - join * 0.6)
    c.drawPath(path_from(ip), paint(0xFF4A6AE0, a_int, 9))
    # 5'エクソン（切断後はU5に支えられ、最後は 3'エクソンとつながる）
    ex1_x1 = lerp(X_GU, X_AG - 20, join) if kl > 0.9 else X_GU
    rrect(c, ex1_x1 - 380, YS - 22, 380, 44, 8, EX1, k)
    text(c, "エクソン", ex1_x1 - 190, YS + 70, 30, EX1, "heavy", "center", k)
    x2 = X_AG + (0 if kl < 0.9 else 20)
    rrect(c, x2 - (20 if join > 0 else 0), YS - 22, 380, 44, 8, EX2, k)
    text(c, "エクソン", x2 + 190, YS + 70, 30, EX2, "heavy", "center", k)
    text_center(c, "5'", ex1_x1 - 420, YS, 30, PAL["text"], "heavy", "center", k, stroke=4)
    text_center(c, "3'", x2 + 420, YS, 30, PAL["text"], "heavy", "center", k, stroke=4)
    if join < 0.5:
        gx, gy = ip[0]
        text(c, "GU", gx + 10, gy - 22, 30, PAL["red"], "heavy", "center", k * (1 - join * 2), stroke=4)
        text(c, "AG", X_AG - 40, YS - 22 - drift, 30, PAL["red"], "heavy", "center", k * (1 - join * 2), stroke=4)
    circle(c, X_A, YS - drift, 18, 0xFFFF6FD8, a_int)
    text_center(c, "A", X_A, YS - drift, 22, 0xFF2A0020, "heavy", "center", a_int)
    # snRNP
    rel = ease(prog(t, cue["release"] + 0.3, 1.0))
    rel4 = ease(prog(t, cue["release"] + 3.0, 1.0))
    k1 = ease_back(prog(t, cue["u1"] + 0.3, 0.6)) * (1 - rel)
    k2 = ease_back(prog(t, cue["u2"] + 0.8, 0.6))
    k2af = ease_back(prog(t, cue["u2"] + 0.3, 0.6))
    k456 = ease_back(prog(t, cue["u456"] + 0.3, 0.7))
    if k1 > 0:
        mol.snrnp(c, X_GU + 10 - rel * 300, YS - 70 - rel * 250, "U1", 48, k1 * (1 - rel) + (1 - rel) * 0, 0, t)
    if k2af > 0:
        mol.blob(c, X_A + 110, YS + 40, 90, 40, 0xFFE0E070, k2af * (1 - join), "U2AF", 20, shape="oval")
    if k2 > 0:
        ux, uy = lerp(X_A, X_A - 40, kl), YS - 70 - drift
        mol.snrnp(c, ux, uy, "U2", 50, k2 * (1 - join * 0.5), 1, t)
    if k456 > 0:
        # U4/U6 は対合して到着 → U4 が離れ、U6 は U2 へ
        u6x = lerp(900, X_A - 110, rel4)
        u6y = lerp(YS - 210, YS - 120, rel4) - drift
        mol.snrnp(c, u6x, u6y, "U6", 46, k456 * (1 - join * 0.5), 2, t)
        mol.snrnp(c, 900 + rel4 * 250, YS - 300 - rel4 * 300, "U4", 44, k456 * (1 - rel4), 3, t)
        u5x = lerp(X_GU + 60, X_AG - 60, ease(prog(t, cue["u5"], 1.5)))
        mol.snrnp(c, u5x, YS - 85 if kl < 0.5 else YS + 0, "U5", 46, k456 * (1 - join), 4, t)
    # 手順の札
    steps = [("u1", "① U1 が 5'末端の GU に結合"), ("u2", "② U2AF・U2 がブランチ部位へ"), ("u456", "③ U5・U4・U6 が集まる"),
             ("release", "④ U1 放出 → U4 放出、U6 は U2 へ"), ("lariat", "⑤ 切断、G が A と結合＝投げ縄"),
             ("u5", "U5 がエクソンを支える"), ("joined", "⑥ エクソンがつながる")]
    shown = [(cu, s) for cu, s in steps if t >= cue[cu] + 0.2]
    for i, (cu, s) in enumerate(shown):
        kk = ease(prog(t, cue[cu] + 0.2, 0.4))
        text(c, s, 60, 140 + i * 50, 30, PAL["text"] if i < len(shown) - 1 else PAL["yellow"], "heavy", alpha=kk, stroke=4)
    kla = ease(prog(t, cue["lariat"] + 3.0, 0.5))
    if kla > 0:
        label(c, "投げ縄構造（ラリアット）", X_A - 140, YS - 330 - drift, 34, 0xFF4A6AE0, 0xFF0A1030, kla, border=0xFF8AA0FF)
    if join > 0.9:
        glow(c, X_AG - 20, YS, 120, PAL["yellow"], 0.5)
    # スプライソソーム（キャラクター）
    ks = ease(prog(t, cue["splice"] - 0.3, 0.6)) * (1 - ease(prog(t, cue["u1"], 0.5))) + \
        ease(prog(t, cue["joined"], 0.5))
    if ks > 0:
        sx, sy = 1560, 250
        mol.blob(c, sx, sy, 200, 150, PAL["u5"], min(1, ks), shape="oval", show_face=True, e=S.expr("splice", t), t=t)
        for j, nm in enumerate(("U1", "U2", "U4", "U5", "U6")):
            a = -math.pi / 2 + j * math.tau / 5 + t * 0.4
            mol.snrnp(c, sx + math.cos(a) * 150, sy + math.sin(a) * 110, nm, 28, min(1, ks), j, t)
        label(c, "スプライソソーム（資料表記：スプライセオソーム）", sx - 120, sy + 130, 24, PAL["u5"], 0xFF1A0A2A, min(1, ks))
    ksn = ease(prog(t, cue["snrnp"], 0.5)) * (1 - ease(prog(t, cue["u1"], 0.5)))
    if ksn > 0:
        caption_box(c, ["snRNA ＋ タンパク質 ＝ snRNP（U1, U2, U4, U5, U6）"], 520, 760, 32, ksn, border=PAL["u5"])
    cast(c, t, S, akari=True, nuku=False, akari_s=0.4, akari_x=130)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0606 選択的スプライシング（p.49）
@visual("alt_splicing")
def alt_splicing(c, t, S):
    background(c, "workshop", t)
    t_a, t_b, t_m, t_g = (S.cue(x) for x in ("caseA", "caseB", "more", "gk"))
    show_gk = ease(prog(t, t_g, 0.6))
    k = ease(prog(t, 0.1, 0.6)) * (1 - show_gk)
    if k > 0:
        y = 250
        segs = [(150, EX1, "E1"), (130, None, ""), (40, EX4, ""), (130, None, ""), (130, EX3, "E3"), (40, None, ""),
                (200, EX2, "E4")]
        mrna_bar(c, 520, y, segs, k, tail=4)
        text(c, "E2", 520 + 150 + 130 + 20, y - 40, 26, EX4, "heavy", "center", k)
        text(c, "mRNA前駆体", 300, y + 10, 32, PAL["rna"], "heavy", "center", k)
        ka = ease(prog(t, t_a, 0.6))
        kb = ease(prog(t, t_b, 0.6))
        if ka > 0:
            line(c, 670, y + 50, 1100, y + 50, PAL["white"], 8, ka)
            text(c, "A", 885, y + 95, 32, PAL["white"], "heavy", "center", ka)
            text(c, "Aの場合", 300, 520, 36, PAL["text"], "heavy", "center", ka)
            mrna_bar(c, 520, 510, [(150, EX1, "E1"), (130, EX3, "E3"), (200, EX2, "E4")], ka, tail=4)
        if kb > 0:
            line(c, 840, y + 80, 1230, y + 80, PAL["white"], 8, kb)
            text(c, "B", 1035, y + 125, 32, PAL["white"], "heavy", "center", kb)
            text(c, "Bの場合", 300, 660, 36, PAL["text"], "heavy", "center", kb)
            mrna_bar(c, 520, 650, [(150, EX1, "E1"), (40, EX4, ""), (200, EX2, "E4")], kb, tail=4)
            text(c, "E2", 690, 610, 26, EX4, "heavy", "center", kb)
        km = ease(prog(t, t_m, 0.6))
        if km > 0:
            caption_box(c, ["1種類の mRNA前駆体 → 複数の mRNA", "→ 遺伝子の数より多くのタンパク質（p.71）"], 1150, 470, 34, km,
                        border=PAL["yellow"])
    if show_gk > 0:
        text(c, "グルコキナーゼ遺伝子の選択的プロモーター利用（p.49）", W / 2, 150, 38, PAL["yellow"], "heavy", "center", show_gk)
        exons = [("1B", 220), ("1L", 640), ("2A", 900), ("2", 960), ("3", 1010), ("4", 1100), ("5", 1210), ("6", 1250),
                 ("7", 1370), ("8", 1430), ("9", 1500), ("10", 1600)]
        for row, (nm, prom) in enumerate((("肝臓", "1L"), ("膵B細胞・下垂体", "1B"))):
            y = 380 + row * 260
            line(c, 140, y, 1720, y, PAL["text"], 4, show_gk)
            text(c, nm, 130, y - 60, 32, PAL["text"], "heavy", "left", show_gk)
            text(c, "（約30 kb）", 420, y - 30, 26, PAL["muted"], "bold", "center", show_gk)
            for en, x in exons:
                w = 70 if en == "10" else (60 if en in ("1B", "1L") else 34)
                used = not (en in ("1B", "1L") and en != prom)
                rrect(c, x - w / 2, y - 26, w, 52, 6, 0xFFD8D8E8 if used else 0xFF505068, show_gk)
                text(c, en, x, y + 70, 26, PAL["text"] if used else PAL["muted"], "heavy", "center", show_gk)
            px = dict(exons)[prom]
            line(c, px - 20, y - 30, px - 20, y - 70, PAL["green"], 5, show_gk)
            arrow(c, px - 20, y - 70, px + 40, y - 70, PAL["green"], 5, show_gk, head=16)
            # スプライシングの山（1つ目 → 2A）
            kk = ease(prog(t, t_g + 1.5 + row * 1.5, 1.0))
            p = path_from([(px + 30, y - 26), ((px + 900) / 2, y - 120), (880, y - 26)])
            c.drawPath(p, paint(PAL["yellow"], show_gk * kk, 4))
        caption_box(c, ["異なるプロモーター周辺配列を使い、組織特異的な転写調節をおこなう"], 300, 800 - 20, 30,
                    ease(prog(t, t_g + 4.0, 0.6)), border=PAL["green"])
    cast(c, t, S, akari_s=0.4, akari_x=130, nuku_x=1830, nuku_y=850, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0607 遺伝子の構造と核外輸送（p.46, 53）
@visual("gene_to_protein")
def gene_to_protein(c, t, S):
    background(c, "workshop", t)
    t_s, t_c, t_e = S.cue("structure"), S.cue("codon"), S.cue("export")
    exp = ease(prog(t, t_e, S.duration - t_e))
    k = ease(prog(t, 0.2, 0.6)) * (1 - exp * 0.8)
    y = 280
    if k > 0:
        line(c, 120, y, 1800, y, PAL["text"], 5, k)
        rrect(c, 160, y - 22, 300, 44, 10, 0xFFFF6FA0, k * 0.6, stroke=3)
        parts = [(500, 40, 0xFF4FD0E0), (640, 14, 0xFF4FD0E0), (654, 20, 0xFF7FF06F), (820, 40, 0xFF7FF06F),
                 (1020, 40, 0xFF7FF06F), (1200, 70, 0xFF7FF06F), (1270, 90, 0xFF4FD0E0)]
        for x, w, col in parts:
            rrect(c, x, y - 26, w, 52, 4, col, k)
        circle(c, 1370, y, 30, PAL["white"], k, stroke=4)
        items = [("プロモーター", 310, 0.0, -1), ("5'非翻訳領域", 500, 0.6, 1), ("開始コドン ATG", 660, 1.4, -1),
                 ("エクソン", 920, 2.4, 1), ("イントロン", 745, 3.2, 1), ("終止コドン TGA", 1220, 4.0, 1),
                 ("3'非翻訳領域", 1330, 4.8, -1), ("ポリアデニル化シグナル", 1560, 5.6, 1)]
        for s, x, dt, side in items:
            kk = ease(prog(t, t_s + dt, 0.4)) * k
            yy = y + side * 90
            line(c, x, y + side * 30, x, yy - side * 20, PAL["muted"], 2, kk)
            text(c, s, x, yy + (12 if side > 0 else 0) + (14 if side > 0 else -4), 28, PAL["text"], "heavy", "center", kk)
        kc = ease(prog(t, t_c, 0.6)) * k
        if kc > 0:
            text(c, "DNA：A G C T", 160, 500, 34, PAL["dna"], "heavy", alpha=kc)
            text(c, "RNA：U C G A", 160, 560, 34, PAL["rna"], "heavy", alpha=kc)
            mrna_bar(c, 700, 540, [(30, 0xFF4FD0E0, ""), (40, 0xFF7FF06F, ""), (40, 0xFF7FF06F, ""), (70, 0xFF7FF06F, ""),
                                   (90, 0xFF4FD0E0, "")], kc, tail=4, labels=False)
            text(c, "スプライシング後の mRNA", 840, 610, 28, PAL["rna"], "heavy", "center", kc)
            for i in range(4):
                rrect(c, 1250 + i * 70, 515, 62, 50, 8, 0xFF7FF06F, kc * ease(prog(t, t_c + 1.5 + i * 0.3, 0.3)))
                text_center(c, ["AUG", "…", "…", "UGA"][i], 1281 + i * 70, 540, 20, 0xFF102010, "heavy", "center", kc)
            text(c, "3塩基 → 1アミノ酸（コドン）", 1390, 620, 28, 0xFF7FF06F, "heavy", "center", kc)
    if exp > 0:
        # 核膜と核膜孔を通って細胞質へ
        a = exp
        c.drawPath(path_from([(1100, -20), (1060, 300), (1060, 1100)], smooth=True), paint(PAL["dna"], a, 18))
        rrect(c, 1035, 470, 50, 110, 20, 0xFF1A0E30, a)
        text(c, "核", 700, 760, 44, PAL["dna"], "heavy", "center", a)
        text(c, "細胞質", 1450, 760, 44, PAL["rna"], "heavy", "center", a)
        u = exp
        pts = [(600 + u * 900 + i * -24, 525 + math.sin(i * 0.6 + t * 3) * 8) for i in range(22)]
        mol.rna_path(c, pts, PAL["rna"], 10, a, cap=1.0)
        polya_tail(c, pts[-1][0] - 75, 525, 3, a)
    cast(c, t, S, akari_s=0.42, akari_x=140, nuku_x=1830, nuku_y=860, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S, fout=0.6)
