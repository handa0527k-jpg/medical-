"""CHAPTER 1 細胞の中の冒険（資料 p.3, 4）。"""
from __future__ import annotations

import math

import skia

from .. import chars as ch
from .. import mol
from ..bg import background, dim, lab_background
from ..draw import (BASE_COLORS, H, PAL, W, arrow, circle, clamp, ease, ease_back, ease_out, glow, hash01, label, lerp,
                    linear_shader, paint, panel, path_from, prog, rgba, rrect, text, text_center, text_width)
from ..layout import cast, hud, scene_fade, term_card
from ..render import visual


# ------------------------------------------------------------------ SC0101 プロローグ
@visual("prologue_helix")
def prologue_helix(c, t, S):
    background(c, "black", t, particles=90)
    t_helix = S.cue("helix")
    appear = ease(prog(t, 1.0, 3.5))
    # らせんへ近づき、横に流れる
    dist = lerp(16.0, 5.2, ease(prog(t, 0.5, t_helix + 1.5)))
    cam_x = t * 0.55
    yaw = lerp(0.9, 0.42, ease(prog(t, 0, S.duration)))
    roll = -0.25 + 0.05 * math.sin(t * 0.3)
    if appear > 0:
        glow(c, W / 2, H / 2, 700, 0xFF5A3ACF, 0.25 * appear)
        mol.helix3d(c, t, cam_x=cam_x, length=34, radius=1.0, pitch=3.4, scale=230, yaw=yaw, pitch_angle=0.15, roll=roll,
                    cam_dist=dist, alpha=appear, spin=t * 0.35, fog=0.05)
    # 最後の行：二重らせんから、写しとられるRNA（青緑）の光が伸びる
    t_last = S.L(4)
    k = ease(prog(t, t_last + 0.6, 3.0))
    if k > 0:
        pts = []
        for i in range(int(60 * k) + 2):
            u = i / 60
            x = W * 0.2 + u * W * 0.65
            y = H * 0.62 + math.sin(u * 9 + t * 1.5) * 26 - u * 120
            pts.append((x, y))
        mol.rna_path(c, pts, PAL["rna"], 8, k * 0.95)
        glow(c, pts[-1][0], pts[-1][1], 90, PAL["rna"], 0.7 * k)
    term_card(c, t, t_helix + 0.3, "DNA", "二重らせん（右巻き）", W / 2, 170, end=S.L(4) - 0.2, color=PAL["dna"], size=70)
    # 終わりは白く光ってタイトルへ
    flash = clamp((t - (S.duration - 0.6)) / 0.6)
    if flash > 0:
        c.drawRect(skia.Rect(0, 0, W, H), paint(0xFFFFFFFF, flash * 0.85))
    a_in = 1 - clamp(t / 1.2)
    dim(c, a_in)


# ------------------------------------------------------------------ SC0102 タイトル
def title_logo(c, t, cx=W / 2, cy=H / 2 - 40, scale=1.0, alpha=1.0):
    c.save()
    c.translate(cx, cy)
    c.scale(scale, scale)
    # 背後のらせんの帯
    for i in range(80):
        u = i / 79
        x = -620 + u * 1240
        y1 = math.sin(u * 12 + t * 1.2) * 46
        y2 = math.sin(u * 12 + t * 1.2 + 2.2) * 46
        circle(c, x, y1 - 10, 6, PAL["dna"], alpha * 0.55)
        circle(c, x, y2 - 10, 6, PAL["rna"], alpha * 0.55)
    f = 150
    s = "GENE QUEST"
    w = text_width(s, f, "heavy")
    p = skia.Paint(AntiAlias=True)
    p.setShader(linear_shader(-w / 2, -f, w / 2, 0, [rgba(0xFFD8C8FF, alpha), rgba(0xFF9F7BFF, alpha), rgba(0xFF2EE6C9, alpha)],
                              [0.0, 0.5, 1.0]))
    text(c, s, 0, 40, f, 0xFF1A0F40, "heavy", "center", alpha, stroke=18, stroke_color=0xFF120A30,
         glow=0xFF7A5CFF)
    from ..draw import font
    blob = skia.TextBlob.MakeFromString(s, font(f, "heavy"))
    c.drawTextBlob(blob, -w / 2, 40, p)
    c.drawLine(-w / 2, 82, w / 2, 82, paint(0xFFBFAFFF, alpha * 0.8, 3))
    text(c, "遺伝情報を読み解け！", 0, 162, 62, PAL["white"], "heavy", "center", alpha, stroke=8, stroke_color=0xFF120A30,
         glow=0xFF2EE6C9)
    c.restore()


@visual("title_card")
def title_card(c, t, S):
    background(c, "nucleus", t, particles=120)
    k = ease_back(prog(t, 0.15, 0.9))
    shake = math.sin(t * 60) * 8 * max(0.0, 1 - t / 0.5)
    # 光の筋
    for i in range(12):
        a = i / 12 * math.tau + t * 0.15
        p = skia.Path()
        p.moveTo(W / 2, H / 2)
        p.lineTo(W / 2 + math.cos(a - 0.05) * 1400, H / 2 + math.sin(a - 0.05) * 1400)
        p.lineTo(W / 2 + math.cos(a + 0.05) * 1400, H / 2 + math.sin(a + 0.05) * 1400)
        p.close()
        c.drawPath(p, paint(0xFFBFAFFF, 0.06 * k))
    glow(c, W / 2, H / 2 - 40, 700, 0xFF6A4AE0, 0.45 * k)
    title_logo(c, t, W / 2 + shake, H / 2 - 40, 0.7 + 0.3 * k + 0.02 * t, clamp(k * 1.2))
    text(c, "転写（機構と疾患）を学ぶ 医学教育アニメーション", W / 2, H - 230, 32, PAL["muted"], "bold", "center",
         ease(prog(t, 1.2, 0.8)))
    # 白から入る
    c.drawRect(skia.Rect(0, 0, W, H), paint(0xFFFFFFFF, 0.85 * (1 - clamp(t / 0.5))))
    scene_fade(c, t, S, fin=0.01, fout=0.6)


# ------------------------------------------------------------------ SC0103 アカリ、細胞の世界へ
def thought_bubble(c, x, y, items, alpha, t):
    if alpha <= 0:
        return
    for i, (dx, dy, r) in enumerate(((-60, 90, 10), (-35, 55, 16))):
        circle(c, x + dx, y + dy, r, 0xFFFFFFFF, alpha * 0.9)
    rrect(c, x - 40, y - 120, 360, 150, 70, 0xFFFFFFFF, alpha * 0.92)
    for i, (s, col) in enumerate(items):
        text(c, s, x + 40 + i * 110, y - 30 + math.sin(t * 3 + i) * 5, 46, col, "heavy", "center", alpha, stroke=3,
             stroke_color=0xFFFFFFFF)


@visual("akari_dive")
def akari_dive(c, t, S):
    t_dive = S.cue("dive")
    t_in = S.cue("nuku_in")
    if t < t_dive + 0.6:
        lab_background(c, t)
        e = S.expr("akari", t)
        if t < t_dive:
            e.look_x = 0.7
            e.look_y = 0.2
        ch.akari(c, 420, 1085, 0.95, e, t, tilt=-3 + (t > t_dive) * 6)
        thought_bubble(c, 610, 310, [("DNA", PAL["dna"]), ("RNA", PAL["rna"]), ("？", PAL["red"])],
                       ease(prog(t, 0.6, 0.5)) * (1 - ease(prog(t, t_dive - 0.4, 0.4))), t)
        # 顕微鏡の光が強くなる
        k = ease(prog(t, t_dive - 0.3, 0.9))
        glow(c, 845, 625, 200 + 1600 * k, 0xFF9FF5DA, 0.35 + 0.65 * k)
        c.drawRect(skia.Rect(0, 0, W, H), paint(0xFFE8FFF8, k * 0.9))
    else:
        # トンネル：細胞 → 核 → 核の中
        u = prog(t, t_dive + 0.6, max(1.0, t_in - t_dive - 0.6))
        background(c, "nucleus", t, particles=120, drift=4.0)
        zoom = 1 + 9 * ease(u)
        for i in range(10):
            r = ((i * 140 + t * 600) % 1400)
            glow(c, W / 2, H / 2, r, 0xFF6FF0C8 if i % 2 else 0xFF9F7BFF, 0.08)
            circle(c, W / 2, H / 2, r, 0xFFBFAFFF, 0.25 * (1 - r / 1400), stroke=3)
        # 細胞（外）→ 核（内）のシルエットが拡大して通り抜ける
        cell_r = 300 * zoom
        if cell_r < 3000:
            circle(c, W / 2, H / 2, cell_r, 0xFF6FF0C8, 0.6 * (1 - u), stroke=10)
            text(c, "細胞", W / 2, H / 2 - cell_r - 20, 40, PAL["nuku"], "heavy", "center", 0.9 * (1 - u * 2))
        nuc_r = 110 * zoom
        if nuc_r < 3000:
            radial = skia.Paint(AntiAlias=True)
            radial.setShader(skia.GradientShader.MakeRadial((W / 2, H / 2), max(1, nuc_r),
                                                            [rgba(0xFF6A4AE0, 0.5 * (1 - u)), rgba(0xFF2A1A6A, 0.0)]))
            c.drawCircle(W / 2, H / 2, nuc_r, radial)
            circle(c, W / 2, H / 2, nuc_r, PAL["dna"], 0.8 * (1 - u), stroke=8)
            text(c, "核", W / 2, H / 2 + 14, 46 + 10 * zoom, PAL["dna"], "heavy", "center", 0.9 * (1 - u * 1.6))
        # 落ちていくアカリ
        if t < t_in + 0.4:
            e = S.expr("akari", t)
            ang = (t - t_dive) * 240
            sc = 0.55 * (1 - 0.35 * u)
            c.save()
            c.translate(W / 2 + math.sin(t * 2) * 120, H / 2 + 260)
            c.rotate(math.sin(t * 3) * 25 + ang * 0.05)
            ch.akari(c, 0, 0, sc, e, t)
            c.restore()
        else:
            cast(c, t, S, enter_a=t_in + 0.2, enter_n=t_in - 0.3, akari_base="surprise")
            k = ease(prog(t, t_in - 0.4, 0.6))
            for i in range(14):
                a = i / 14 * math.tau + t
                glow(c, 1690 + math.cos(a) * 180 * k, 700 + math.sin(a) * 180 * k, 30, PAL["nuku"], 0.6 * (1 - k * 0.6))
        flash = 1 - clamp((t - t_dive - 0.6) / 0.5)
        c.drawRect(skia.Rect(0, 0, W, H), paint(0xFFE8FFF8, flash * 0.9))
    if t > t_in:
        term_card(c, t, t_in + 0.4, "核", "真核細胞の遺伝情報（DNA）がある場所", W / 2, 200, dur=3.5, color=PAL["dna"])
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0104 セントラルドグマ（p.3）
def dogma_diagram(c, t, x0, y0, s, S, k_dna, k_tx, k_rna, k_tl, k_prot, k_loop, box_k):
    """資料 p.3 の図を、アニメーションつきで描く。"""
    c.save()
    c.translate(x0, y0)
    c.scale(s, s)
    # DNA（二本鎖、5'→3' / 3'←5'）
    if k_dna > 0:
        mol.dna_ladder(c, -360, 360, 0, 70, None, None, alpha=k_dna, letters=False, step=34, end_size=30)
        label(c, "DNA", 300, -78, 34, 0xFF2A1A00, PAL["yellow"], k_dna)
    if k_loop > 0:
        arrow(c, -230, -60, -110, -210, 0xFFD8D2FF, 5, k_loop, curve=60, progress=k_loop)
        arrow(c, 110, -210, 230, -60, 0xFFD8D2FF, 5, k_loop, curve=60, progress=k_loop)
        text(c, "DNA複製・DNA修復・遺伝的組換え", 0, -230, 30, PAL["text"], "bold", "center", k_loop)
    # 転写
    if k_tx > 0:
        arrow(c, 0, 70, 0, 200, PAL["rna"], 7, k_tx, progress=k_tx)
        text(c, "RNA合成（転写）", 30, 150, 36, PAL["rna"], "heavy", alpha=k_tx, stroke=4)
    if k_rna > 0:
        n = 18
        pts = [(-360 + i * 40, 250) for i in range(int(n * k_rna) + 1)]
        if len(pts) > 1:
            c.drawLine(pts[0][0], 250, pts[-1][0], 250, paint(PAL["rna"], k_rna, 9))
            for i, (px, py) in enumerate(pts[:-1]):
                b = "AUGCGUACGAUCGUAGCU"[i % 18]
                c.drawLine(px + 20, 250, px + 20, 278, paint(BASE_COLORS[b], k_rna, 10))
        text_center(c, "5'", -400, 250, 30, PAL["text"], "heavy", "center", k_rna, stroke=4)
        if k_rna > 0.98:
            arrow(c, 300, 250, 380, 250, PAL["rna"], 9, 1.0, head=26)
            text_center(c, "3'", 410, 250, 30, PAL["text"], "heavy", "center", 1.0, stroke=4)
        label(c, "RNA", 300, 195, 34, 0xFF002A2A, PAL["rna"], k_rna)
    if box_k > 0:
        rrect(c, -430, -110, 860, 420, 40, PAL["red"], box_k, stroke=7)
        text(c, "ここが今回の主役：転写", -420, 340, 30, PAL["red"], "heavy", alpha=box_k)
    # 翻訳
    if k_tl > 0:
        arrow(c, 0, 320, 0, 440, 0xFF8BE36B, 7, k_tl, progress=k_tl)
        text(c, "タンパク合成（翻訳）", 30, 395, 36, 0xFF8BE36B, "heavy", alpha=k_tl, stroke=4)
    if k_prot > 0:
        text(c, "H₂N", -420, 500, 30, PAL["text"], "heavy", alpha=k_prot)
        shapes = 8
        for i in range(int(shapes * k_prot)):
            x = -330 + i * 86
            if i % 3 == 0:
                c.drawOval(skia.Rect.MakeXYWH(x - 34, 470, 68, 38), paint(0xFF8BD66B))
            elif i % 3 == 1:
                c.drawRect(skia.Rect.MakeXYWH(x - 28, 468, 56, 42), paint(0xFF6FC24A))
            else:
                c.drawPath(path_from([(x - 36, 489), (x, 466), (x + 36, 489), (x, 512)], closed=True), paint(0xFF9BE37B))
            if i:
                c.drawLine(x - 52, 489, x - 34, 489, paint(0xFF2A4A1A, 1, 4))
        if k_prot > 0.98:
            text(c, "COOH", 360, 500, 30, PAL["text"], "heavy", alpha=1)
        label(c, "タンパク質", 280, 440, 32, 0xFF1A2A00, 0xFFB8F08A, k_prot)
    c.restore()


@visual("central_dogma")
def central_dogma(c, t, S):
    background(c, "nucleus", t)
    t_tx, t_tl, t_dg = S.cue("transcription"), S.cue("translation"), S.cue("dogma")
    k_dna = ease(prog(t, 0.2, 0.8))
    k_loop = ease(prog(t, 0.9, 1.2))
    k_tx = ease(prog(t, t_tx, 1.0))
    k_rna = ease(prog(t, t_tx + 0.6, 2.0))
    k_tl = ease(prog(t, t_tl, 1.0))
    k_prot = ease(prog(t, t_tl + 0.6, 2.0))
    box = ease(prog(t, S.L(6) + 0.5, 0.8))
    # パン：上から下へ（転写の場面では DNA と RNA の間に寄る）
    cy = lerp(450, 330, ease(prog(t, t_tl - 0.5, 2.0)))
    s = lerp(0.92, 0.82, ease(prog(t, t_tl, 2.0)))
    panel(c, W / 2 - 520, cy - 300 * s - 40, 1040, 720 * s + 80, 0.55 * k_dna)
    dogma_diagram(c, t, W / 2, cy, s, S, k_dna, k_tx, k_rna, k_tl, k_prot, k_loop, box)
    term_card(c, t, t_dg + 0.2, "セントラルドグマ", "DNA → RNA → タンパク質（細菌からヒトまで共通）", W / 2, 150, dur=4.5,
              color=PAL["yellow"], size=60)
    cast(c, t, S, akari_s=0.58, nuku_y=640)
    hud(c, t, S, show_chapter=True)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0105 冒険の地図（p.4）
STAGES = [
    ("転写開始", "CH2–4", PAL["pol"]),
    ("キャップ形成・伸長・スプライシング", "CH6", PAL["u5"]),
    ("切断・ポリA付加・転写終結", "CH6", PAL["orange"]),
    ("核外へ輸送", "CH6", PAL["rna"]),
    ("翻訳・mRNAの分解", "細胞質", 0xFF8BE36B),
]


@visual("quest_map")
def quest_map(c, t, S):
    background(c, "nucleus", t)
    t_st = S.cue("stages")
    # 核（大きな角丸）と細胞質
    k = ease(prog(t, 0.1, 0.8))
    rrect(c, 140, 150, 1180, 700, 90, 0xFF1A1250, 0.65 * k)
    rrect(c, 140, 150, 1180, 700, 90, PAL["dna"], 0.9 * k, stroke=6)
    text(c, "核（NUCLEUS）", 190, 215, 34, PAL["dna"], "heavy", alpha=k)
    rrect(c, 1240, 150, 540, 700, 60, 0xFF0F2A2A, 0.45 * k)
    text(c, "細胞質（CYTOSOL）", 1290, 215, 32, PAL["rna"], "heavy", alpha=k)
    pts = [(330, 360), (620, 460), (900, 360), (1180, 520), (1520, 420)]
    for i in range(len(pts) - 1):
        kk = ease(prog(t, t_st + 0.6 * i, 0.8))
        arrow(c, pts[i][0] + 50, pts[i][1], pts[i + 1][0] - 50, pts[i + 1][1], 0xFFD8D2FF, 6, kk, curve=40, progress=kk,
              dash=(18, 12))
    for i, (p, (name, chap, col)) in enumerate(zip(pts, STAGES)):
        kk = ease_back(prog(t, t_st + 0.6 * i - 0.2, 0.5))
        if kk <= 0:
            continue
        glow(c, p[0], p[1], 90, col, 0.5 * kk)
        circle(c, p[0], p[1], 44 * kk, col, 1)
        circle(c, p[0], p[1], 44 * kk, 0xFFFFFFFF, 0.8, stroke=4)
        text_center(c, str(i + 1), p[0], p[1], 44 * kk, 0xFF120A30, "heavy", "center")
        lines = name.split("・") if len(name) > 10 else [name]
        for j, s in enumerate(lines):
            text(c, s, p[0], p[1] + 88 + j * 36, 30, PAL["white"], "heavy", "center", kk, stroke=5)
        label(c, chap, p[0], p[1] - 76, 24, 0xFF120A30, col, kk)
    # 冒険のルール（必然性 × ファインマン法）
    for i, (cue, head, body) in enumerate([("rule1", "ルール1　必然性", "なぜ、そうでなければならないのか？を考える"),
                                           ("rule2", "ルール2　ファインマン法", "難しい言葉を使わずに、自分の言葉で説明する")]):
        if cue not in S.cues:
            continue
        kr = ease(prog(t, S.cue(cue) - 0.1, 0.5))
        y = 690 + i * 78
        rrect(c, 440, y, 1080, 64, 32, 0xFF120F35, kr * 0.9)
        rrect(c, 440, y, 1080, 64, 32, PAL["yellow"] if i == 0 else PAL["green"], kr, stroke=3)
        text(c, head, 470, y + 43, 30, PAL["yellow"] if i == 0 else PAL["green"], "heavy", alpha=kr)
        text(c, body, 860, y + 43, 30, PAL["white"], "bold", alpha=kr)
    # START スタンプ
    t_go = S.cue("go", S.L(3))
    kk = ease_back(prog(t, t_go + 0.3, 0.4))
    if kk > 0:
        c.save()
        c.translate(330, 360)
        c.rotate(-12)
        c.scale(2.2 - 1.2 * kk, 2.2 - 1.2 * kk)
        rrect(c, -110, -50, 220, 100, 18, PAL["red"], kk, stroke=8)
        text(c, "START!", 0, 22, 56, PAL["red"], "heavy", "center", kk)
        c.restore()
    cast(c, t, S, akari_s=0.56, nuku_y=760, nuku_s=0.62)
    hud(c, t, S)
    scene_fade(c, t, S, fout=0.6)
