"""CHAPTER 7 小さなRNAの大きな役割（資料 p.54–56, 58–60, 62–68）。"""
from __future__ import annotations

import math

import skia

from .. import mol
from ..bg import background
from ..draw import (BASE_COLORS, H, PAL, W, arrow, circle, clamp, ease, ease_back, ease_out, glow, label, lerp, line,
                    paint, panel, path_from, prog, rrect, text, text_center)
from ..layout import caption_box, cast, chapter_intro, hud, scene_fade, speaker_tag, term_card
from ..render import visual
from .ch6 import cap, mrna_bar, polya_tail

NAMES = {"mina": ("miRNA", PAL["mirna"])}


# ------------------------------------------------------------------ SC0701 ゲノムの構成（p.54–56）
SLICES = [  # (割合%, 名前, 色)
    (1.3, "アミノ酸指定配列 約1.3%", PAL["yellow"]), (24.0, "アミノ酸非指定配列 約24%", 0xFF7FB4FF),
    (0.4, "偽遺伝子 約0.4%", 0xFFB0B0C8), (26.3, "その他 約26.3%", 0xFF8A80C0), (48.0, "繰り返し配列 約48%", 0xFF5A5280)]


@visual("genome_pie")
def genome_pie(c, t, S):
    background(c, "nucleus", t)
    t_p, t_c, t_n = S.cue("pie"), S.cue("counts"), S.cue("ncrna")
    k = ease(prog(t, t_p - 0.4, 1.2)) * (1 - ease(prog(t, t_c, 0.6)))
    if k > 0:
        cx, cy, r = 620, 520, 290
        a0 = -90.0
        for pct, nm, col in SLICES:
            sweep = 360 * pct / 100 * k
            p = skia.Path()
            p.moveTo(cx, cy)
            p.arcTo(skia.Rect.MakeXYWH(cx - r, cy - r, 2 * r, 2 * r), a0, sweep, False)
            p.close()
            c.drawPath(p, paint(col, 1))
            c.drawPath(p, paint(0xFF100C28, 1, 3))
            a0 += sweep
        text(c, "ヒトの核ゲノム（約30億塩基対）", cx, 170, 36, PAL["text"], "heavy", "center", k)
        hl = ease(prog(t, t_p + 1.5, 0.6))
        glow(c, cx + 20, cy - r + 10, 90, PAL["yellow"], 0.6 * hl)
        arrow(c, cx + 300, 200, cx + 30, cy - r + 10, PAL["yellow"], 6, hl, curve=-60)
        for i, (pct, nm, col) in enumerate(SLICES):
            yy = 300 + i * 80
            rrect(c, 1050, yy - 22, 44, 44, 8, col, k)
            text(c, nm, 1120, yy + 12, 34, PAL["yellow"] if i == 0 else PAL["text"], "heavy", alpha=k)
        text(c, "遺伝子に関わる DNA 約25.3%／非遺伝子 DNA 約74.7%（p.54）", 1050, 740, 28, PAL["muted"], "bold", alpha=k)
    kc = ease(prog(t, t_c, 0.6)) * (1 - ease(prog(t, t_n, 0.6)))
    if kc > 0:
        text(c, "ヒトの全転写物 60,483（p.55）", W / 2, 200, 44, PAL["text"], "heavy", "center", kc)
        bars = [("ノンコーディングRNA", 25794, PAL["rna"]), ("メッセンジャーRNA", 19814, PAL["pol"]),
                ("その他（偽遺伝子など）", 14285, 0xFFB0B0C8)]
        for i, (nm, v, col) in enumerate(bars):
            kk = ease(prog(t, t_c + 0.5 + i * 0.5, 0.8)) * kc
            yy = 340 + i * 150
            text(c, nm, 560, yy + 12, 36, PAL["text"], "heavy", "right", kk)
            rrect(c, 600, yy - 30, 1000 * v / 25794 * kk, 60, 12, col, kk)
            text(c, f"{v:,}", 620 + 1000 * v / 25794 * kk, yy + 12, 34, PAL["white"], "heavy", alpha=kk)
    kn = ease(prog(t, t_n, 0.6))
    if kn > 0:
        caption_box(c, ["非コードRNA（ncRNA）遺伝子：", "遺伝子の機能性産物が RNA そのもの",
                        "タンパク質コード遺伝子とほぼ同数（2万〜2万5千）", "多くは機能が未解明（p.56）"], 420, 300, 40, kn,
                    border=PAL["rna"])
    cast(c, t, S, akari_s=0.42, akari_x=140, nuku_x=1830, nuku_y=860, nuku_s=0.38)
    hud(c, t, S)
    chapter_intro(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0702 rRNA（p.59, 60, 62, 63）
def subunit(c, x, y, w, h, col, alpha, name):
    p = skia.Path()
    p.addOval(skia.Rect.MakeXYWH(x - w / 2, y - h / 2, w, h))
    c.drawPath(p, paint(col, alpha))
    c.drawPath(p, paint(0xFF2F5A1A, alpha, 3))
    text_center(c, name, x, y, 40, 0xFF102010, "heavy", "center", alpha)


def rrna_coil(c, x, y, rows, col, alpha, size=1.0):
    """折りたたまれた rRNA（行数が長さの目安）。"""
    pts = []
    for i in range(rows + 1):
        yy = y + i * 16 * size
        pts.append((x - 34 * size if i % 2 == 0 else x + 34 * size, yy))
    c.drawPath(path_from(pts, smooth=True), paint(col, alpha, 7 * size))


@visual("rrna_ribosome")
def rrna_ribosome(c, t, S):
    background(c, "cytoplasm", t)
    t_s, t_c, t_45 = S.cue("subunits"), S.cue("copies"), S.cue("45s")
    split = ease(prog(t, t_s + 2.0, 1.2))
    k = ease(prog(t, 0.1, 0.6)) * (1 - ease(prog(t, t_c, 0.6)))
    if k > 0:
        x60, y60 = lerp(860, 600, split), lerp(380, 330, split)
        x40, y40 = lerp(980, 1300, split), lerp(470, 350, split)
        subunit(c, x60, y60, 320, 230, 0xFFB7E37A, k, "60S")
        subunit(c, x40, y40, 230, 160, 0xFF6CC24A, k, "40S")
        if split < 0.3:
            text(c, "80S リボソーム（真核生物）", 920, 680, 40, PAL["text"], "heavy", "center", k)
        ks = ease(prog(t, t_s + 3.0, 0.8)) * k
        if ks > 0:
            for i, (nm, nt) in enumerate((("5S rRNA", 120), ("28S rRNA", 4700), ("5.8S rRNA", 160))):
                x = 400 + i * 200
                rrna_coil(c, x, 480, max(3, nt // 450), PAL["blue"], ks, 1.0)
                text(c, nm, x, 690, 26, PAL["text"], "heavy", "center", ks)
                text(c, f"{nt} nt", x, 730, 24, PAL["muted"], "bold", "center", ks)
            rrna_coil(c, 1300, 480, 4, PAL["blue"], ks, 1.0)
            text(c, "18S rRNA", 1300, 690, 26, PAL["text"], "heavy", "center", ks)
            text(c, "1900 nt", 1300, 730, 24, PAL["muted"], "bold", "center", ks)
            text(c, "rRNA は4種類（p.62）", 920, 800, 34, PAL["yellow"], "heavy", "center", ks)
    kc = ease(prog(t, t_c, 0.6)) * (1 - ease(prog(t, t_45, 0.6)))
    if kc > 0:
        text(c, "常に大量に必要 → 遺伝子は多コピー（p.63）", W / 2, 230, 40, PAL["text"], "heavy", "center", kc)
        line(c, 160, 450, 1760, 450, PAL["dna"], 6, kc)
        for i in range(12):
            rrect(c, 190 + i * 130, 428, 100, 44, 8, PAL["blue"], kc * ease(prog(t, t_c + i * 0.08, 0.3)))
        text(c, "ヒト：rRNA 主転写単位 280、5S rRNA 遺伝子 2000、tRNA 遺伝子 1300", W / 2, 580, 32, PAL["muted"], "bold",
             "center", kc)
    k4 = ease(prog(t, t_45, 0.6))
    if k4 > 0:
        y = 300
        line(c, 200, y, 1700, y, PAL["dna"], 6, k4)
        for x, w, nm in ((420, 300, "18S"), (860, 110, "5.8S"), (1060, 460, "28S")):
            rrect(c, x, y - 22, w, 44, 8, PAL["blue"], k4)
            text_center(c, nm, x + w / 2, y, 26, 0xFF0A1830, "heavy", "center", k4)
        text(c, "プロモーター", 300, y - 50, 28, PAL["red"], "heavy", "center", k4)
        text(c, "ターミネーター", 1610, y - 50, 28, PAL["red"], "heavy", "center", k4)
        mol.polymerase(c, lerp(300, 1500, ease(prog(t, t_45 + 0.5, 2.5))), y - 120, 0.4, "both", k4, color=0xFFB59CFF, t=t)
        text(c, "RNAポリメラーゼI", 300, y - 170, 26, 0xFFB59CFF, "heavy", "center", k4)
        kp = ease(prog(t, t_45 + 2.0, 0.8))
        line(c, 400, 480, 1540, 480, PAL["rna"], 10, kp)
        label(c, "45S rRNA 前駆体", 970, 430, 30, PAL["rna"], 0xFF0A2028, kp)
        kq = ease(prog(t, t_45 + 4.0, 1.0))
        if kq > 0:
            for x, w, nm in ((420, 300, "18S"), (860, 110, "5.8S"), (1060, 460, "28S")):
                rrect(c, x, 640 - 15 + (1 - kq) * -100, w, 30, 8, PAL["rna"], kq)
                text(c, nm, x + w / 2, 710, 30, PAL["rna"], "heavy", "center", kq)
            text(c, "プロセシングで3種の rRNA に", 970, 790, 32, PAL["yellow"], "heavy", "center", kq)
    cast(c, t, S, akari_s=0.4, akari_x=130, nuku_x=1830, nuku_y=860, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0703 tRNA（p.59, 60, 64）
@visual("trna")
def trna(c, t, S):
    background(c, "cytoplasm", t)
    t_t, t_i = S.cue("trna"), S.cue("internal")
    k = ease(prog(t, t_t - 0.3, 0.8)) * (1 - ease(prog(t, t_i, 0.6)))
    if k > 0:
        glow_k = ease(prog(t, t_t + 2.5, 0.6))
        mol.trna(c, 760, 360, 1.5, k, anticodon_glow=glow_k)
        circle(c, 760, 105, 28, PAL["green"], k)
        text_center(c, "aa", 760, 105, 24, 0xFF102010, "heavy", "center", k)
        label(c, "アミノ酸", 900, 105, 28, PAL["green"], 0xFF0A2010, k)
        label(c, "アンチコドン", 1060, 700, 30, PAL["yellow"], 0xFF2A2000, glow_k, tx=800, ty=615)
        caption_box(c, ["tRNA（トランスファーRNA）", "リボソームにアミノ酸を運び、", "アンチコドンでコドンを読み取る",
                        "高度に修飾されている（p.64）"], 1150, 200, 34, ease(prog(t, t_t + 1.0, 0.6)) * k, border=PAL["orange"])
    ki = ease(prog(t, t_i, 0.6))
    if ki > 0:
        text(c, "RNAポリメラーゼIIIのプロモーターは遺伝子の内部（p.60）", W / 2, 220, 38, PAL["yellow"], "heavy", "center", ki)
        y = 480
        line(c, 300, y, 1600, y, PAL["text"], 5, ki)
        rrect(c, 760, y - 40, 600, 80, 10, 0xFF303040, ki)
        text(c, "遺伝子（tRNA など）", 1060, y - 60, 30, PAL["text"], "heavy", "center", ki)
        rrect(c, 920, y + 10, 260, 60, 10, PAL["orange"], ki)
        text(c, "内部制御領域（約50 bp）", 1050, y + 130, 30, PAL["orange"], "heavy", "center", ki)
        line(c, 760, y - 40, 760, y - 110, PAL["text"], 4, ki)
        arrow(c, 760, y - 110, 900, y - 110, PAL["text"], 4, ki, head=16)
        text(c, "+1", 740, y - 120, 28, PAL["yellow"], "heavy", "right", ki)
        caption_box(c, ["rRNA も tRNA も翻訳されず、RNA のまま働く", "（遺伝子発現の最終産物、p.59）"], 470, 680, 32,
                    ease(prog(t, t_i + 3.0, 0.6)), border=PAL["green"])
    cast(c, t, S, akari_s=0.42, akari_x=140, nuku_x=1830, nuku_y=860, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ miRNA（p.56, 67）
def hairpin_rna(c, x, y, s, alpha, col=PAL["mirna"], loop=True):
    """短いヘアピン（pre-miRNA）。"""
    for sg in (-1, 1):
        line(c, x + sg * 10 * s, y, x + sg * 10 * s, y - 120 * s, col, 7 * s, alpha)
    for i in range(6):
        line(c, x - 10 * s, y - 15 * s - i * 18 * s, x + 10 * s, y - 15 * s - i * 18 * s, lighten_(col), 3, alpha)
    if loop:
        circle(c, x, y - 140 * s, 22 * s, col, alpha, stroke=7 * s)


def lighten_(col):
    from ..draw import lighten
    return lighten(col, 0.5)


def mina_char(c, x, y, s, e, t, alpha):
    """ミーナ（成熟 miRNA）：短い青緑のRNAに顔。"""
    pts = [(x - 70 * s + i * 14 * s, y + math.sin(i * 0.9 + t * 3) * 8 * s) for i in range(11)]
    mol.rna_path(c, pts, PAL["mirna"], 14 * s, alpha)
    circle(c, x, y - 34 * s, 40 * s, PAL["mirna"], alpha)
    mol.face(c, x, y - 40 * s, 1.0 * s, e, t, alpha=alpha)
    text(c, "~22塩基", x, y + 50 * s, 24 * s, PAL["mirna"], "heavy", "center", alpha)


@visual("mirna_pathway")
def mirna_pathway(c, t, S):
    background(c, "nucleus", t)
    cue = {x: S.cue(x) for x in ("mina", "pri", "drosha", "exportin", "dicer", "risc")}
    k = ease(prog(t, 0.1, 0.6))
    # 核（左）と細胞質（右）、核膜と核膜孔
    rrect(c, -40, 140, 1060, 760, 60, 0xFF20164A, 0.5 * k)
    c.drawLine(1020, 140, 1020, 900, paint(PAL["dna"], k, 14))
    rrect(c, 995, 500, 50, 110, 20, 0xFF0A0820, k)
    text(c, "核", 120, 200, 40, PAL["dna"], "heavy", alpha=k)
    text(c, "細胞質", 1800, 200, 40, PAL["rna"], "heavy", "right", k)
    # ミーナの自己紹介
    km = ease(prog(t, cue["mina"], 0.6)) * (1 - ease(prog(t, cue["pri"], 0.6)))
    if km > 0:
        mina_char(c, W / 2, 500, 2.0, S.expr("mina", t), t, km)
    # pri-miRNA（キャップ・ポリA・複数のヘアピン）
    kp = ease(prog(t, cue["pri"], 0.8))
    if kp > 0:
        y = 420
        line(c, 120, 600, 900, 600, PAL["dna"], 6, kp * 0.7)
        text(c, "遺伝子", 200, 650, 28, PAL["dna"], "heavy", "center", kp)
        text(c, "RNAポリメラーゼIIで転写", 600, 650, 28, PAL["pol"], "heavy", "center", kp)
        dro = ease(prog(t, cue["drosha"] + 0.8, 1.0))
        exp = ease(prog(t, cue["exportin"] + 0.4, 2.0))
        dic = ease(prog(t, cue["dicer"] + 0.8, 1.0))
        if dro < 0.99:
            cap(c, 150, y, kp * (1 - dro), label_on=False)
            line(c, 170, y, 860, y, PAL["mirna"], 7, kp * (1 - dro))
            for hx in (330, 510, 690):
                hairpin_rna(c, hx, y, 1.0, kp * (1 - dro * (0.0 if hx == 510 else 1.0)))
            polya_tail(c, 880, y, 4, kp * (1 - dro))
            label(c, "pri-miRNA", 500, y + 70, 30, PAL["mirna"], 0xFF0A2028, kp * (1 - dro))
        kd = ease(prog(t, cue["drosha"], 0.5)) * (1 - ease(prog(t, cue["exportin"], 0.5)))
        if kd > 0:
            mol.blob(c, 510, y + 20, 160, 70, 0xFFFF9FD8, kd, "Drosha", 26, shape="oval")
            text(c, "60〜70 nt の pre-miRNA を切り出す", 510, y + 130, 28, PAL["text"], "bold", "center", kd)
        # pre-miRNA → Exportin 5 → 細胞質
        if dro > 0.5:
            hx = lerp(510, 1300, exp)
            hy = lerp(y, 460, exp)
            if dic < 0.99:
                hairpin_rna(c, hx, hy, 1.2, 1 - dic * 0.0, loop=dic < 0.5)
                if exp < 1:
                    label(c, "pre-miRNA", hx, hy + 60, 28, PAL["mirna"], 0xFF0A2028, 1 - exp * 0.5)
            ke = ease(prog(t, cue["exportin"], 0.5)) * (1 - ease(prog(t, cue["dicer"], 0.5)))
            if ke > 0:
                mol.blob(c, hx + 70, hy - 60, 120, 60, 0xFFFFD07A, ke, "Exportin 5", 20, shape="capsule")
            kdc = ease(prog(t, cue["dicer"], 0.5)) * (1 - ease(prog(t, cue["risc"], 0.5)))
            if kdc > 0:
                mol.blob(c, 1300, 300, 150, 66, 0xFFB0A0FF, kdc, "Dicer", 26, shape="oval")
                text(c, "21〜23 nt の成熟型へ", 1300, 640, 30, PAL["text"], "bold", "center", kdc)
            if dic > 0.5:
                for sg in (-1, 1):
                    line(c, 1300 + sg * 12 + (sg * 40 * ease(prog(t, cue["risc"], 1.0)) if sg > 0 else 0), 460,
                         1300 + sg * 12 + (sg * 40 * ease(prog(t, cue["risc"], 1.0)) if sg > 0 else 0), 330, PAL["mirna"], 8,
                         1 - (ease(prog(t, cue["risc"] + 0.5, 1.0)) if sg > 0 else 0))
        kr = ease(prog(t, cue["risc"] + 0.3, 0.8))
        if kr > 0:
            c.save()
            c.translate(1500, 420)
            mol.blob(c, 0, 0, 260, 170, 0xFF7A6AE0, kr, shape="oval")
            line(c, -70, 30, 70, 30, PAL["mirna"], 9, kr)
            text_center(c, "RISC", 0, -30, 40, PAL["white"], "heavy", "center", kr)
            c.restore()
            text(c, "遺伝子発現の抑制へ", 1500, 580, 32, PAL["yellow"], "heavy", "center", kr)
    # 手順の札（上段）
    steps = [("pri", "pri-miRNA"), ("drosha", "Drosha"), ("exportin", "Exportin 5"), ("dicer", "Dicer"), ("risc", "RISC")]
    for i, (cu, s) in enumerate(steps):
        kk = ease_back(prog(t, cue[cu] + 0.2, 0.4))
        x = 300 + i * 330
        label(c, s, x, 820, 30, 0xFF101030, [PAL["mirna"], 0xFFFF9FD8, 0xFFFFD07A, 0xFFB0A0FF, 0xFF9F8AFF][i], kk)
        if i < 4:
            arrow(c, x + 110, 820, x + 210, 820, PAL["muted"], 5, kk)
    speaker_tag(c, t, S, NAMES, x=W / 2, y=740)
    cast(c, t, S, akari=False, nuku_x=1840, nuku_y=930, nuku_s=0.36)
    hud(c, t, S, show_chapter=False)
    scene_fade(c, t, S)


@visual("mirna_action")
def mirna_action(c, t, S):
    background(c, "cytoplasm", t)
    t_b, t_d = S.cue("bind"), S.cue("degrade")
    k = ease(prog(t, 0.1, 0.6))
    # 上：普通に翻訳される mRNA
    mrna_bar(c, 300, 300, [(700, PAL["rna"], "")], k, tail=4, labels=False)
    mol.ribosome(c, lerp(400, 900, (t * 0.1) % 1), 270, 0.45, k)
    for i in range(5):
        circle(c, 1350 + i * 40, 300 + math.sin(i + t) * 10, 16, PAL["green"], k * 0.9)
    text(c, "mRNA の情報 → タンパク質", 1500, 380, 30, PAL["green"], "heavy", "center", k)
    # 下：miRNA が結合した mRNA
    kb = ease(prog(t, t_b + 0.5, 1.0))
    kd = ease(prog(t, t_d + 0.8, 1.5))
    y = 620
    if kd < 0.99:
        mrna_bar(c, 300, y, [(700, PAL["rna"], "")], k * (1 - kd), tail=4, labels=False)
    else:
        for i in range(14):
            line(c, 300 + i * 52 + math.sin(i) * 10, y + math.cos(i) * 30, 330 + i * 52, y + math.cos(i * 2) * 30,
                 PAL["rna"], 8, 1 - ease(prog(t, t_d + 2.3, 1.0)))
    if kb > 0:
        rx = lerp(1400, 700, kb)
        mol.blob(c, rx, y - 50, 200, 120, 0xFF7A6AE0, 1 - kd * 0.6, "RISC", 28, shape="oval", name_color=PAL["white"])
        line(c, rx - 70, y - 4, rx + 70, y - 4, PAL["mirna"], 10, 1 - kd * 0.6)
        mina_char(c, rx + 180, y - 160, 0.9, S.expr("mina", t), t, 1 - kd)
    if kd > 0:
        text(c, "✕ 分解され、タンパク質合成に使われない（p.67）", 1300, y + 110, 30, PAL["red"], "heavy", "center", kd)
    kn = ease(prog(t, S.L(4), 0.6))
    if kn > 0:
        caption_box(c, ["miRNA：1000以上が同定", "タンパク質コード遺伝子の30%以上を抑制すると推測（p.56）"], 300, 740, 30, kn,
                    border=PAL["mirna"])
    speaker_tag(c, t, S, NAMES, x=W / 2, y=150)
    cast(c, t, S, akari_s=0.4, akari_x=130, nuku_x=1830, nuku_y=860, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0706 lncRNA と snoRNA（p.56, 66, 68）
@visual("lncrna")
def lncrna(c, t, S):
    background(c, "cytoplasm", t)
    t_l, t_n, t_s = S.cue("lnc"), S.cue("notranslate"), S.cue("sno")
    k = ease(prog(t, 0.1, 0.6))
    for row, (nm, exons, y) in enumerate((("mRNA", 5, 300), ("lncRNA", 3, 560))):
        kk = k if row == 0 else ease(prog(t, t_l, 0.6))
        text(c, nm, 200, y + 12, 44, PAL["rna"] if row == 0 else PAL["mirna"], "heavy", "center", kk)
        segs = []
        for i in range(exons):
            segs += [(90, PAL["exon2"] if row == 0 else PAL["exon4"], str(i + 1))]
        mrna_bar(c, 400, y, segs, kk, tail=5)
        mol.ribosome(c, 1450, y - 20, 0.4, kk * (0.3 if row == 1 else 1))
        arrow(c, 1080 + 60 * (exons == 3) * -4, y, 1360, y, PAL["muted"], 6, kk)
        if row == 0:
            for i in range(4):
                circle(c, 1580 + i * 40, y, 16, PAL["green"], kk)
            text(c, "タンパク質", 1640, y + 60, 28, PAL["green"], "heavy", "center", kk)
        else:
            kn = ease_back(prog(t, t_n + 1.0, 0.5))
            text(c, "✕", 1450, y + 30, 120, PAL["red"], "heavy", "center", kn)
            text(c, "翻訳されない", 1650, y + 12, 32, PAL["red"], "heavy", "center", kn)
    kd = ease(prog(t, t_l + 0.8, 0.6)) * (1 - ease(prog(t, t_s, 0.5)))
    if kd > 0:
        caption_box(c, ["200塩基以上", "潜在的な ORF が 100アミノ酸残基以下（p.68）"], 400, 690, 32, kd, border=PAL["mirna"])
    kn2 = ease(prog(t, t_n, 0.6)) * (1 - ease(prog(t, t_s, 0.5)))
    if kn2 > 0:
        text(c, "どちらも 5'キャップ・ポリA・スプライシング", W / 2, 450, 32, PAL["yellow"], "heavy", "center", kn2)
    ks = ease(prog(t, t_s, 0.6))
    if ks > 0:
        caption_box(c, ["snoRNA（核小体低分子RNA）", "rRNA の修飾に関わる（p.56）"], 520, 680, 40, ks, border=PAL["orange"])
    cast(c, t, S, akari=False, nuku_x=1830, nuku_y=860, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0707 ncRNA と疾患（p.56）
def chromosome(c, x, y, h, alpha, label_s, del_from, del_to, blink):
    """端部着糸型の染色体（13番・15番）の模式図。del_from〜del_to（割合）を欠失として示す。"""
    w = 70
    rrect(c, x - w / 2, y, w, h, w / 2, 0xFFD8D0F0, alpha)
    circle(c, x, y + h * 0.12, w * 0.42, 0xFF8A80C0, alpha)
    for i in range(7):
        yy = y + h * (0.25 + i * 0.1)
        rrect(c, x - w / 2 + 4, yy, w - 8, h * 0.04, 4, 0xFF6A6090, alpha * 0.8)
    rrect(c, x - w / 2 - 8, y + h * del_from, w + 16, h * (del_to - del_from), 10, PAL["red"], alpha * (0.4 + 0.5 * blink), stroke=6)
    text(c, label_s, x, y + h + 60, 36, PAL["text"], "heavy", "center", alpha)


@visual("ncrna_disease")
def ncrna_disease(c, t, S):
    background(c, "somber", t)
    t_f, t_p = S.cue("feingold"), S.cue("pws")
    bl = 0.5 + 0.5 * math.sin(t * 4)
    kf = ease(prog(t, t_f - 0.3, 0.8))
    if kf > 0:
        chromosome(c, 250, 200, 520, kf, "13番染色体", 0.62, 0.74, bl)
        caption_box(c, ["miRNA 遺伝子群の欠失", "→ Feingold（ファインゴールド）症候群", "小頭症・低身長・手指の奇形を",
                        "特徴とする骨格系疾患"], 340, 220, 32, kf, border=PAL["mirna"])
    kp = ease(prog(t, t_p - 0.3, 0.8))
    if kp > 0:
        chromosome(c, 1120, 200, 520, kp, "15番染色体", 0.3, 0.42, bl)
        caption_box(c, ["snoRNA 遺伝子群の欠失", "→ Prader-Willi（プラダー・ウィリー）症候群", "肥満・性腺機能低下・認知障害を",
                        "特徴とする"], 1205, 480, 30, kp, border=PAL["orange"])
    text(c, "資料 p.56 の記載より（欠失の位置は模式）", W / 2, 860, 26, PAL["muted"], "bold", "center", kf)
    cast(c, t, S, akari_s=0.4, akari_x=130, nuku_x=1830, nuku_y=200, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S, fout=0.6)
