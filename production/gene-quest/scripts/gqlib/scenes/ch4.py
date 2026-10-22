"""CHAPTER 4 真核生物の転写開始（資料 p.18, 28–33, 59）。"""
from __future__ import annotations

import math

import skia

from .. import mol
from ..bg import background
from ..draw import (H, PAL, W, arrow, circle, clamp, ease, ease_back, ease_out, glow, label, lerp, line, paint, panel,
                    prog, rrect, text, text_center)
from ..layout import caption_box, cast, chapter_intro, hud, scene_fade, speaker_tag, term_card
from ..render import visual

NAMES = {"pol": ("RNAポリメラーゼII", PAL["pol"]), "tfiid": ("TFIID", PAL["tfiid"])}
POL_COLORS = {"I": 0xFFB59CFF, "II": PAL["pol"], "III": 0xFF6FE0D0}


def chromatin_strip(c, t, y, alpha, x0=-50, x1=1970, r=34):
    """背景のヌクレオソームの列（真核のDNAの姿）。"""
    pts = []
    for i in range(int((x1 - x0) / 140) + 1):
        x = x0 + i * 140 + (t * 10) % 140
        pts.append((x, y + math.sin(i * 1.3) * 18))
    for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
        line(c, xa, ya, xb, yb, PAL["dna"], 6, alpha * 0.8)
    for x, yy in pts:
        mol.nucleosome(c, x, yy, r, alpha, t)


# ------------------------------------------------------------------ SC0401 三つのポリメラーゼ（p.28, 29, 59）
@visual("three_polymerases")
def three_polymerases(c, t, S):
    background(c, "nucleus", t)
    t_ch, t1, t2, t3, t_gt = (S.cue(x) for x in ("chromatin", "pol1", "pol2", "pol3", "gtfs"))
    kc = ease(prog(t, S.L(2) - 0.3, 0.8)) * (1 - 0.7 * ease(prog(t, t1 - 0.3, 0.6)))
    chromatin_strip(c, t, 260, kc)
    if ease(prog(t, t_ch, 0.5)) * kc > 0:
        label(c, "ヌクレオソーム", 960, 360, 32, PAL["histone"], 0xFF2A1A10, ease(prog(t, t_ch, 0.5)) * kc)
    rows = [("I", t1, ["5.8S, 18S, 28S の", "rRNA 遺伝子"]),
            ("II", t2, ["タンパク質を指令する遺伝子すべて", "snoRNA・miRNA・siRNA 遺伝子", "ほとんどの snRNA 遺伝子"]),
            ("III", t3, ["tRNA 遺伝子・5S rRNA 遺伝子", "一部の snRNA 遺伝子", "ほかの小さな RNA の遺伝子"])]
    hl2 = ease(prog(t, S.cue("gtfs") - 0.1, 0.6))
    for i, (nm, tt, desc) in enumerate(rows):
        k = ease_back(prog(t, tt - 0.2, 0.6))
        if k <= 0:
            continue
        x = 330 + i * 630
        a = k * (1 - 0.6 * hl2 if nm != "II" else 1)
        mol.polymerase(c, x, 470, 0.85, "both", a, color=POL_COLORS[nm], t=t)
        label(c, f"RNAポリメラーゼ{nm}", x, 600, 34, 0xFF101030, POL_COLORS[nm], a)
        for j, s in enumerate(desc):
            text(c, s, x, 680 + j * 44, 30, PAL["text"], "bold", "center", a)
    if hl2 > 0:
        x = 960
        glow(c, x, 470, 260, PAL["pol"], 0.35 * hl2)
        mol.rna_path(c, [(x - 120, 520), (x - 200, 580), (x - 300, 560), (x - 380, 610)], PAL["rna"], 8, hl2)
        label(c, "mRNA前駆体", x - 330, 520, 28, PAL["rna"], 0xFF0A2028, hl2)
        for j in range(8):
            a = j / 8 * math.tau + t * 0.6
            mol.blob(c, x + math.cos(a) * 250, 450 + math.sin(a) * 120, 60, 38,
                     [PAL["tfiid"], PAL["tfiib"], PAL["tfiie"], PAL["tfiih"], PAL["tfiif"]][j % 5], hl2 * 0.9, shape="oval")
        term_card(c, t, t_gt + 0.6, "転写基本因子", "真核の開始には多数のタンパク質が必要（細菌は σ因子だけ）", W / 2, 140,
                  end=S.duration, color=PAL["tfiid"], size=56)
    cast(c, t, S, akari_s=0.48, nuku_x=1810, nuku_y=830, nuku_s=0.45)
    hud(c, t, S)
    chapter_intro(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ 転写開始前複合体（p.30–32）
X_TATA = 760
X_START = 1000
Y_DNA = 560


def euk_dna(c, t, bend=0.0, open_k=0.0, alpha=1.0):
    """真核のプロモーター：灰色のDNA、緑のTATAボックス、赤い転写領域（p.30 の配色）。"""
    pts = []
    for i in range(121):
        x = -40 + i * 17
        d = (x - (X_TATA + 20)) / 90
        y = Y_DNA + bend * 46 * math.exp(-d * d)
        pts.append((x, y))
    bub = None
    if open_k > 0:
        bub = ((X_START - 40 + 40) / 2040, (X_START + 150 + 40) / 2040, open_k)
    mol.ladder_path(c, pts, 50, alpha, 22, 0xFFAEB0C8, 0xFF8A8CA8, 6, bubble=bub)
    # TATA と転写領域の色帯
    for x0, x1, col in ((X_TATA - 50, X_TATA + 50, 0xFF8FCB4A), (X_START, 1900, 0xFFD23A3A)):
        seg = [(x, y) for x, y in pts if x0 <= x <= x1]
        if len(seg) > 1:
            c.drawPath(mol.path_from(seg), paint(col, alpha * 0.75, 12))
    return pts


def start_arrow(c, alpha):
    line(c, X_START, Y_DNA - 40, X_START, Y_DNA - 100, PAL["text"], 5, alpha)
    arrow(c, X_START, Y_DNA - 100, X_START + 110, Y_DNA - 100, PAL["text"], 5, alpha, head=16)
    text(c, "転写開始", X_START + 60, Y_DNA - 115, 28, PAL["text"], "heavy", "center", alpha)


FACTOR_ROLES = [
    ("tfiid", "TFIID（TBP＋約11個のTAF）", "TBP が TATAボックスを識別", PAL["tfiid"]),
    ("tfiib", "TFIIB", "RNAポリメラーゼを開始部位へ正しく配置", PAL["tfiib"]),
    ("pol2", "TFIIF", "ポリメラーゼと TBP・TFIIB の結合を安定化", PAL["tfiif"]),
    ("tfiie", "TFIIE", "TFIIH を引き寄せ、調節する", PAL["tfiie"]),
    ("tfiie", "TFIIH", "DNAをほどき、CTD の Ser5 をリン酸化（次の場面）", PAL["tfiih"]),
]


def pic(c, t, k_d, k_b, k_p, k_eh, bend, alpha=1.0, pol_dx=0.0, factors_leave=0.0, ctd_p=0, show_face_tfiid=False,
        e_tfiid=None, e_pol=None, open_k=0.0):
    """転写開始前複合体の各部品を、到着の度合いに合わせて描く。"""
    pts = euk_dna(c, t, bend, open_k, alpha)
    start_arrow(c, alpha * (1 - k_p * 0.6))
    fl = factors_leave
    # TFIIB（茶のダンベル：TFIID の左奥）
    if k_b > 0:
        mol.blob(c, X_TATA - 150 + (1 - k_b) * -300, Y_DNA - 60 - (1 - k_b) * 200 - fl * 220, 170, 60, PAL["tfiib"],
                 alpha * k_b * (1 - fl), "TFIIB", 24, shape="dumbbell", name_color=0xFFFFFFFF)
    # Pol II ＋ TFIIF
    if k_p > 0:
        px = lerp(1700, X_START + 70, ease_out(k_p)) + pol_dx
        py = lerp(260, Y_DNA + 6, ease_out(k_p))
        mol.polymerase(c, px, py, 1.05, "back", alpha, t=t, ctd=1.0, ctd_p=ctd_p)
        mol.polymerase(c, px, py, 1.05, "front", alpha * 0.9, t=t, show_face=e_pol is not None, e=e_pol)
        circle(c, px - 40, py - 150, 26, PAL["tfiif"], alpha * (1 - fl))
        text_center(c, "F", px - 40, py - 150, 26, 0xFF3A1A00, "heavy", "center", alpha * (1 - fl))
        label(c, "RNAポリメラーゼII", px + 40, py + 150, 28, PAL["pol"], 0xFF0A1830, alpha * (1 - fl * 0.5))
    # TFIIE・TFIIH
    if k_eh > 0:
        ex = lerp(X_TATA - 600, X_TATA - 40, ease_out(k_eh))
        mol.blob(c, ex - 60, Y_DNA - 140 - fl * 260, 110, 56, PAL["tfiie"], alpha * k_eh * (1 - fl), "IIE", 24, shape="oval")
    # TFIID（TBP が TATA に乗る）。資料の図では伸長期にも TATA に残っている
    if k_d > 0:
        dy = (1 - ease_out(k_d)) * -360
        mol.tfiid(c, X_TATA, Y_DNA - 50 + dy, 0.95, alpha, show_face=show_face_tfiid, e=e_tfiid, t=t)
    if k_eh > 0:
        hx = lerp(X_TATA - 500, X_TATA + 120, ease_out(k_eh))
        mol.blob(c, hx, Y_DNA + 30 + fl * 300, 150, 66, PAL["tfiih"], alpha * k_eh * (1 - fl), "TFIIH", 26, shape="oval")


@visual("pic_assembly")
def pic_assembly(c, t, S):
    background(c, "nucleus", t)
    tt, t_d, t_bend, t_b, t_p, t_eh, t_pic = (S.cue(x) for x in ("tata", "tfiid", "bend", "tfiib", "pol2", "tfiie", "pic"))
    k_d = ease(prog(t, t_d - 0.2, 1.2))
    bend = ease(prog(t, t_bend + 0.3, 1.0))
    k_b = ease(prog(t, t_b, 1.0))
    k_p = ease(prog(t, t_p, 1.6))
    k_eh = ease(prog(t, t_eh, 1.2))
    zoom = lerp(1.25, 1.0, ease(prog(t, t_d, 3.0)))
    c.save()
    c.translate(X_TATA, Y_DNA)
    c.scale(zoom, zoom)
    c.translate(-X_TATA, -Y_DNA)
    pic(c, t, k_d, k_b, k_p, k_eh, bend, show_face_tfiid=True, e_tfiid=S.expr("tfiid", t))
    kt = ease(prog(t, tt, 0.6)) * (1 - ease(prog(t, t_d + 1.0, 0.5)))
    if kt > 0:
        label(c, "TATAボックス", X_TATA, Y_DNA + 90, 34, 0xFF1A2A00, 0xFF8FCB4A, kt)
        arrow(c, X_START, Y_DNA + 150, X_TATA, Y_DNA + 150, PAL["yellow"], 5, kt, head=16)
        text(c, "約25塩基上流", (X_TATA + X_START) / 2, Y_DNA + 200, 30, PAL["yellow"], "heavy", "center", kt)
    if bend > 0:
        label(c, "DNA の大きなゆがみ", X_TATA, Y_DNA + 140, 30, PAL["yellow"], 0xFF2A2000,
              bend * (1 - ease(prog(t, t_b, 0.5))))
    c.restore()
    # 役割の一覧（p.32 の表）
    shown = [r for r in FACTOR_ROLES if t >= S.cue(r[0]) + 0.5]
    if shown:
        x0, y0 = 60, 110
        for i, (_, nm, role, col) in enumerate(shown):
            kk = ease(prog(t, S.cue(shown[i][0]) + 0.5, 0.5))
            rrect(c, x0, y0 + i * 62, 18, 44, 6, col, kk)
            text(c, nm, x0 + 34, y0 + i * 62 + 31, 28, col, "heavy", alpha=kk)
            text(c, role, x0 + 470, y0 + i * 62 + 31, 26, PAL["text"], "bold", alpha=kk)
    term_card(c, t, t_pic + 0.1, "転写開始前複合体", "TFIID・TFIIB・Pol II・TFIIF・TFIIE・TFIIH", W / 2, 860 - 40, end=S.duration,
              color=PAL["yellow"], size=56)
    speaker_tag(c, t, S, NAMES, x=X_TATA, y=300)
    cast(c, t, S, akari_s=0.45, nuku_x=1820, nuku_y=200, nuku_s=0.42)
    hud(c, t, S, show_chapter=False)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0403 TFIIH と CTD（p.30–32）
@visual("tfiih_ctd")
def tfiih_ctd(c, t, S):
    background(c, "nucleus", t)
    t_u, t_c, t_e, t_go, t_r = (S.cue(x) for x in ("unwind", "ctd", "escape", "go", "recycle"))
    open_k = ease(prog(t, t_u + 1.0, 1.2))
    n_p = int(clamp((t - t_c - 1.2) / 0.6, 0, 2) + (1 if t > t_c + 1.2 else 0))
    n_p = min(2, n_p)
    leave = ease(prog(t, t_e + 0.8, 1.5))
    go = ease(prog(t, t_go, S.duration - t_go))
    pic(c, t, 1, 1, 1, 1, 1.0, pol_dx=go * 520, factors_leave=leave, ctd_p=n_p, open_k=open_k * (1 - go),
        e_pol=S.expr("pol", t))
    # ATP
    ka = ease(prog(t, t_u, 0.6)) * (1 - ease(prog(t, t_u + 2.4, 0.6)))
    if ka > 0:
        circle(c, X_TATA + 80, Y_DNA - 150, 34, PAL["yellow"], ka)
        text_center(c, "ATP", X_TATA + 80, Y_DNA - 150, 24, 0xFF3A2A00, "heavy", "center", ka)
        arrow(c, X_TATA + 110, Y_DNA - 130, X_START + 20, Y_DNA - 40, PAL["yellow"], 5, ka, curve=-40)
    if open_k > 0:
        label(c, "DNAをほどき、鋳型鎖を露出", X_START + 100, Y_DNA + 140, 30, PAL["tfiih"], 0xFF2A1010,
              open_k * (1 - ease(prog(t, t_c, 0.5))))
    kc = ease(prog(t, t_c, 0.6))
    if kc > 0:
        label(c, "CTD（C末端領域）", X_START - 420 + go * 520, Y_DNA - 240, 30, PAL["pol_light"], 0xFF0A1830,
              kc * (1 - go) * (1 - ease(prog(t, t_r, 0.4))), tx=X_START - 160 + go * 520, ty=Y_DNA - 150)
        if n_p:
            glow(c, X_START - 200 + go * 520, Y_DNA - 190, 140, PAL["yellow"], 0.4 * kc * (1 - prog(t, t_c + 4, 1)))
            text(c, "Ser5 をリン酸化（P）", X_START - 260 + go * 520, Y_DNA - 300, 32, PAL["yellow"], "heavy", "center",
                 kc * (1 - go) * (1 - ease(prog(t, t_r, 0.4))), stroke=5)
    if go > 0:
        mol.rna_path(c, [(X_START + 40 + go * 520 - i * 30, Y_DNA + 60 + i * 9 + math.sin(i + t) * 6)
                         for i in range(int(4 + go * 14))], PAL["rna"], 8, go)
    kr = ease(prog(t, t_r, 0.6))
    if kr > 0:
        caption_box(c, ["ほとんどの転写基本因子は DNA を離れ、", "次の転写開始に利用される（p.32）",
                        "図では TFIID は TATAボックスに残っている（p.30）"], 120, 110, 30, kr, border=PAL["tfiid"])
    term_card(c, t, t_e + 0.2, "転写伸長期へ", "リン酸化で立体構造が変わり、基本因子から離れる", W / 2, 140, end=t_r - 0.2,
              color=PAL["pol"], size=54)
    speaker_tag(c, t, S, NAMES, x=1500, y=300)
    cast(c, t, S, akari_s=0.45, nuku_x=1820, nuku_y=820, nuku_s=0.42)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0404 上流プロモーター要素と原核との比較（p.18, 28, 33）
@visual("upstream_compare")
def upstream_compare(c, t, S):
    background(c, "nucleus", t)
    t_b, t_cmp = S.cue("boxes"), S.cue("compare")
    ke = ease(prog(t, 0.2, 0.8))
    panel(c, 80, 120, 1760, 360, ke, border=PAL["pol"])
    text(c, "真核生物（RNAポリメラーゼII）", 130, 180, 36, PAL["pol"], "heavy", alpha=ke)
    y = 330
    line(c, 140, y, 1780, y, PAL["dna"], 8, ke)
    items = [(380, "CAATボックス", "5'-CCAAT-3'", PAL["orange"], 0.5), (720, "GCボックス", "5'-GGGCGG-3'", PAL["yellow"], 1.6),
             (1180, "TATAボックス", "", 0xFF8FCB4A, 0.0)]
    for x, nm, seq, col, dt in items:
        kk = ease(prog(t, t_b + dt, 0.5)) if seq else ke
        rrect(c, x - 90, y - 26, 180, 52, 10, col, kk)
        text_center(c, nm.replace("ボックス", ""), x, y, 28, 0xFF101010, "heavy", "center", kk)
        text(c, nm, x, y - 50, 28, col, "heavy", "center", kk)
        if seq:
            text(c, seq, x, y + 70, 30, PAL["white"], "heavy", "center", kk)
            mol.blob(c, x, y - 110, 120, 54, col, kk * ease(prog(t, t_b + 3.5, 0.6)), shape="oval")
    mol.tfiid(c, 1180, y - 60, 0.7, ke, labels=True)
    line(c, 1420, y - 30, 1420, y - 80, PAL["text"], 4, ke)
    arrow(c, 1420, y - 80, 1520, y - 80, PAL["text"], 4, ke, head=14)
    text(c, "+1", 1420, y + 60, 30, PAL["yellow"], "heavy", "center", ke)
    kup = ease(prog(t, t_b + 4.0, 0.6))
    if kup > 0:
        label(c, "上流プロモーター要素：転写効率を高める", 560, 455, 28, PAL["text"], 0xFF101030, kup, border=PAL["orange"])
    kp = ease(prog(t, t_cmp, 0.8))
    if kp > 0:
        panel(c, 80, 520, 1760, 340, kp, border=PAL["sigma"])
        text(c, "原核生物（大腸菌）", 130, 580, 36, PAL["sigma"], "heavy", alpha=kp)
        y2 = 720
        line(c, 140, y2, 1780, y2, PAL["dna"], 8, kp)
        for x, nm, seq, col in ((700, "−35", "TTGACA", PAL["orange"]), (1100, "−10", "TATAAT", PAL["green"])):
            rrect(c, x - 90, y2 - 26, 180, 52, 10, col, kp)
            text_center(c, seq, x, y2, 28, 0xFF101010, "heavy", "center", kp)
            text(c, nm + "ボックス", x, y2 + 70, 28, col, "heavy", "center", kp)
        text(c, "+1", 1420, y2 + 60, 30, PAL["yellow"], "heavy", "center", kp)
        mol.polymerase(c, 1000, y2 - 130, 0.5, "both", kp, t=t)
        mol.sigma(c, 960, y2 - 190, 0.45, kp, t=t, show_face=False)
        text(c, "σ因子だけで開始", 1550, y2 - 120, 32, PAL["sigma"], "heavy", "center", kp)
        text(c, "多数の転写基本因子", 1600, 230, 32, PAL["tfiid"], "heavy", "center", kp)
    cast(c, t, S, akari=True, nuku=False, akari_s=0.42, akari_x=170)
    hud(c, t, S)
    scene_fade(c, t, S)
