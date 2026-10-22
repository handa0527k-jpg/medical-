"""CHAPTER 8 遺伝子発現と疾患（資料 p.39–43, 72）。"""
from __future__ import annotations

import math

import skia

from .. import mol
from ..bg import background
from ..draw import (H, PAL, W, arrow, circle, clamp, ease, ease_back, glow, inhibit, label, lerp, line, paint, panel,
                    path_from, prog, rrect, text, text_center)
from ..layout import caption_box, cast, chapter_intro, hud, scene_fade, term_card
from ..render import visual


# ------------------------------------------------------------------ SC0801 メタロチオネインとカドミウム（p.39）
MT_MAP = [("GRE", -250, 70, 0xFF9090B0), ("エンハンサー", -200, 110, PAL["warm"]), ("MRE", -158, 30, PAL["red"]),
          ("MRE", -145, 26, PAL["red"]), ("エンハンサー", -110, 90, PAL["warm"]), ("MRE", -70, 26, PAL["red"]),
          ("GC", -58, 14, PAL["yellow"]), ("MRE", -45, 22, PAL["red"]), ("TATA", -30, 18, 0xFF8FCB4A)]


@visual("metallothionein")
def metallothionein(c, t, S):
    background(c, "somber", t)
    t_m, t_a, t_s, t_x = S.cue("map"), S.cue("activate"), S.cue("stop"), S.cue("toxic")
    km = ease(prog(t, t_m - 0.3, 0.8)) * (1 - 0.6 * ease(prog(t, t_x, 0.6)))
    y = 250
    if km > 0:
        sx = lambda p: 1600 + p * 5.4  # noqa: E731
        line(c, sx(-280), y, sx(40), y, PAL["text"], 5, km)
        for nm, p, w, col in MT_MAP:
            kk = km * (1.0 if nm != "MRE" else 0.5 + 0.5 * ease(prog(t, t_m + 1.5, 0.6)))
            rrect(c, sx(p) - w * 2.2 / 2, y - 18, w * 2.2, 36, 6, col, kk)
            if nm in ("GRE", "エンハンサー", "TATA", "GC") or (nm == "MRE" and p in (-158, -70)):
                text(c, nm, sx(p), y - 34, 26, col, "heavy", "center", kk)
        rrect(c, sx(20), y - 26, 140, 52, 8, 0xFFD0D0E0, km)
        text_center(c, "遺伝子", sx(20) + 70, y, 26, 0xFF101020, "heavy", "center", km)
        for p in (-250, -200, -150, -100, -50):
            text(c, str(p), sx(p), y + 52, 24, PAL["muted"], "bold", "center", km)
        label(c, "MRE：金属応答配列", 500, y + 120, 30, PAL["red"], 0xFF2A0A10, km * ease(prog(t, t_m + 1.5, 0.6)))
    # 負のフィードバックの環（p.39 下段）
    kc = ease(prog(t, t_a, 0.8)) * (1 - ease(prog(t, t_x, 0.6)))
    if kc > 0:
        cx, cy, R = 960, 620, 230
        nodes = [("Cd²⁺ が入る", -90, PAL["yellow"]), ("活性化された転写因子が MRE に結合", 0, PAL["red"]),
                 ("メタロチオネイン増加", 90, PAL["green"]), ("Cd²⁺ に結合 → 細胞内 Cd²⁺ 減少", 180, PAL["cool"])]
        for i, (s, ang, col) in enumerate(nodes):
            tt = t_a + i * 1.6 if i < 2 else t_s + (i - 2) * 1.8
            kk = ease_back(prog(t, tt, 0.5)) * kc
            a = math.radians(ang)
            label(c, s, cx + math.cos(a) * R * 2.3, cy + math.sin(a) * R * 0.85, 30, PAL["text"], 0xFF101030, kk, border=col)
            a2 = math.radians(ang + 90)
            arrow(c, cx + math.cos(a + 0.35) * R * 1.2, cy + math.sin(a + 0.35) * R * 0.65,
                  cx + math.cos(a2 - 0.35) * R * 1.2, cy + math.sin(a2 - 0.35) * R * 0.65, PAL["muted"], 5, kk, curve=-30)
        kst = ease(prog(t, t_s + 3.5, 0.6))
        if kst > 0:
            text(c, "転写因子が活性化されず → さらなる発現は起こらない", cx, 895, 30, PAL["cool"], "heavy", "center", kst, stroke=5)
        for i in range(10):
            a = t * 0.8 + i * 0.63
            circle(c, cx + math.cos(a) * 80, cy - 20 + math.sin(a) * 50, 10, PAL["yellow"],
                   kc * (1 - 0.8 * ease(prog(t, t_s + 1.5, 1.5))))
    kx = ease(prog(t, t_x, 0.6))
    if kx > 0:
        caption_box(c, ["カドミウムは、酵素のチオール基・カルボキシル基・アミノ基と", "相互作用して酵素活性を阻害し、",
                        "肝臓障害、骨軟化症、高血圧などを引き起こす（p.39）"], 300, 420, 34, kx, border=PAL["red"],
                    title="資料の記載")
        ki = ease(prog(t, S.cue("smoke", S.L(7)), 0.6))
        if ki > 0:
            caption_box(c, ["食物から 75〜100 μg を摂取", "喫煙でも余分に摂取（タバコ1本に約2 μg）"], 300, 700, 32, ki,
                        border=PAL["yellow"])
    cast(c, t, S, akari_s=0.4, akari_x=130, nuku_x=1830, nuku_y=860, nuku_s=0.38)
    hud(c, t, S)
    chapter_intro(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0802 時計遺伝子のループ（p.40, 41）
@visual("clock_loop")
def clock_loop(c, t, S):
    background(c, "somber", t)
    t_c, t_a, t_i, t_r = S.cue("clock"), S.cue("activate"), S.cue("inhibit"), S.cue("rre")
    # 昼夜の輪
    day = (t * 0.15) % 1.0
    glow(c, 960 + math.cos(day * math.tau) * 900, 520 + math.sin(day * math.tau) * 400, 300, 0xFFFFD080, 0.12)
    ko = ease(prog(t, t_c, 0.6)) * (1 - ease(prog(t, t_a, 0.6)))
    if ko > 0:
        for i, (title, items, x) in enumerate((("脳（中枢）の時計", ["睡眠／覚醒", "摂食／エネルギー消費", "グルコースの恒常性"], 560),
                                                ("末梢の時計", ["脂肪合成", "食物の吸収", "インスリン分泌", "グルコースのクリアランス", "脂肪の蓄積"], 1300))):
            panel(c, x - 300, 200, 600, 560, ko, border=PAL["yellow"])
            text(c, title, x, 270, 38, PAL["yellow"], "heavy", "center", ko)
            circle(c, x, 380, 70, 0xFFDDE6F5, ko, stroke=8)
            ang = t * 1.5
            line(c, x, 380, x + math.cos(ang) * 50, 380 + math.sin(ang) * 50, PAL["text"], 6, ko)
            for j, s in enumerate(items):
                text(c, s, x, 500 + j * 50, 30, PAL["text"], "bold", "center", ko)
        text(c, "約24時間のリズム（Cell 134, 2008 の図より、p.40）", W / 2, 820, 28, PAL["muted"], "bold", "center", ko)
    k = ease(prog(t, t_a, 0.8))
    if k > 0:
        y1, y2 = 380, 700
        line(c, 260, y1, 1300, y1, PAL["text"], 6, k)
        rrect(c, 420, y1 - 26, 220, 52, 8, 0xFFA8E0E8, k)
        text_center(c, "E/E'-box", 530, y1, 28, 0xFF102028, "heavy", "center", k)
        rrect(c, 900, y1 - 30, 260, 60, 6, 0xFF2A2A8A, k)
        text(c, "Per, Cry, Rev-erbα, RORα", 1030, y1 + 70, 28, PAL["text"], "heavy", "center", k)
        line(c, 900, y1 - 30, 900, y1 - 80, PAL["text"], 5, k)
        arrow(c, 900, y1 - 80, 980, y1 - 80, PAL["text"], 5, k, head=16)
        kb = ease_back(prog(t, t_a + 0.5, 0.6))
        mol.blob(c, 470, y1 - 75, 150, 60, 0xFFB8F06A, kb, "BMAL1", 26, shape="oval")
        mol.blob(c, 600, y1 - 75, 150, 60, 0xFFF4A8A0, kb, "CLOCK", 26, shape="oval")
        kact = ease(prog(t, t_a + 3.0, 0.6))
        if kact > 0:
            glow(c, 1030, y1, 160, PAL["warm"], 0.4 * kact)
            arrow(c, 1160, y1, 1430, 200, PAL["muted"], 5, kact, curve=40)
            mol.blob(c, 1480, 170, 110, 60, 0xFFF0F07A, kact, "PER", 24, shape="oval")
            mol.blob(c, 1600, 170, 110, 60, 0xFFE070F0, kact, "CRY", 24, shape="oval")
        ki = ease(prog(t, t_i, 0.8))
        if ki > 0:
            inhibit(c, 1430, 140, 700, 230, PAL["red"], 7, ki, curve=60, progress=ki)
            text(c, "抑制", 1060, 150, 32, PAL["red"], "heavy", "center", ki)
        kr = ease(prog(t, t_r, 0.8))
        if kr > 0:
            line(c, 260, y2, 1300, y2, PAL["text"], 6, kr)
            rrect(c, 420, y2 - 26, 200, 52, 8, 0xFFA8E0E8, kr)
            text_center(c, "RRE", 520, y2, 28, 0xFF102028, "heavy", "center", kr)
            rrect(c, 900, y2 - 30, 220, 60, 6, 0xFF101010, kr)
            text_center(c, "BMAL1", 1010, y2, 28, PAL["white"], "heavy", "center", kr)
            mol.blob(c, 330, y2 - 160, 140, 70, PAL["orange"], kr, "Rev-erbα", 22, shape="oval")
            mol.blob(c, 720, y2 - 160, 140, 70, 0xFF9AA8F0, kr, "RORα", 24, shape="oval")
            inhibit(c, 360, y2 - 120, 480, y2 - 34, PAL["red"], 6, kr)
            arrow(c, 690, y2 - 120, 580, y2 - 34, PAL["green"], 6, kr)
            arrow(c, 900, y2 + 20, 330, y1 - 70, PAL["muted"], 5, kr * ease(prog(t, t_r + 2.0, 0.8)), curve=-220,
                  dash=(14, 10), progress=ease(prog(t, t_r + 2.0, 1.2)))
            text(c, "フィードバックループ → 約24時間のリズム", 1350, 820, 32, PAL["yellow"], "heavy", "center",
                 ease(prog(t, t_r + 3.0, 0.6)))
    cast(c, t, S, akari_s=0.4, akari_x=130, nuku_x=1830, nuku_y=860, nuku_s=0.38)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0803 時計の乱れと病気（p.42, 43）
@visual("clock_disease")
def clock_disease(c, t, S):
    background(c, "somber", t)
    t_m, t_h = S.cue("mice"), S.cue("human")
    km = ease(prog(t, t_m, 0.6)) * (1 - ease(prog(t, t_h, 0.6)))
    if km > 0:
        text(c, "時計遺伝子に異常のあるマウス（p.42）", W / 2, 180, 40, PAL["yellow"], "heavy", "center", km)
        rows = [("Clock 異常マウス", "高脂血症・高血糖"), ("Bmal1 欠損マウス", "高脂血症・耐糖能異常"), ("Per2 欠損マウス", "肥満"),
                ("Cry1/Cry2 欠損マウス", "食塩感受性高血圧")]
        for i, (a, b) in enumerate(rows):
            kk = ease(prog(t, t_m + 0.4 + i * 0.6, 0.4)) * km
            y = 300 + i * 120
            rrect(c, 360, y - 45, 1200, 90, 20, 0xFF141838, kk * 0.9)
            text(c, a, 420, y + 12, 38, PAL["text"], "heavy", alpha=kk)
            text(c, b, 1500, y + 12, 38, PAL["orange"], "heavy", "right", kk)
    kh = ease(prog(t, t_h, 0.6))
    if kh > 0:
        panel(c, 120, 200, 560, 560, kh, border=PAL["cool"])
        for i, (h1, items) in enumerate((("遺伝的", ["FASPS（per2, CK1δ）", "DSPS（per3）"]),
                                          ("環境", ["行動の同調の乱れ", "睡眠不足・交代勤務"]), ("生理的", ["加齢"]))):
            y = 270 + i * 170
            text(c, h1, 400, y, 36, PAL["cool"], "heavy", "center", kh)
            for j, s in enumerate(items):
                text(c, s, 400, y + 48 + j * 42, 28, PAL["text"], "bold", "center", kh)
        cx, cy = 980, 480
        circle(c, cx, cy, 170, 0xFFDDE6F5, kh, stroke=12)
        ck = ease(prog(t, t_h + 1.0, 0.4))
        for i in range(6):
            a = i * 1.1
            line(c, cx, cy, cx + math.cos(a) * 160 * ck, cy + math.sin(a) * 160 * ck, PAL["text"], 3, kh)
        outs = ["睡眠障害", "がん", "気分障害", "メタボリックシンドローム", "炎症"]
        for i, s in enumerate(outs):
            kk = ease(prog(t, t_h + 1.5 + i * 0.5, 0.4)) * kh
            y = 260 + i * 110
            arrow(c, cx + 170, cy + (y - cy) * 0.3, 1350, y, PAL["cool"], 6, kk)
            text(c, s, 1380, y + 12, 34, PAL["text"], "heavy", alpha=kk)
        text(c, "概日時計の破綻と疾患（p.43 の図）：関連を示した図で、機序は書かれていない", W / 2, 840, 28, PAL["yellow"],
             "bold", "center", ease(prog(t, S.L(3), 0.6)))
    cast(c, t, S, akari_s=0.38, akari_x=120, nuku_x=1850, nuku_y=930, nuku_s=0.34)
    hud(c, t, S)
    scene_fade(c, t, S)


# ------------------------------------------------------------------ SC0804 ミトコンドリアゲノム（p.72）
@visual("mito")
def mito(c, t, S):
    background(c, "mito", t)
    t_g, t_p, t_w = S.cue("genome"), S.cue("polymerase"), S.cue("whole")
    zoom = ease(prog(t, 0.0, max(1.0, t_g)))
    k = 1 - zoom
    if k > 0.01:
        mol.mitochondrion(c, 960, 520, 900, 420, k, t)
    cx, cy, R = 900, 500, 260
    kg = ease(prog(t, t_g - 0.5, 1.0))
    if kg > 0:
        circle(c, cx, cy, R, 0xFFFFE0C0, kg, stroke=14)
        circle(c, cx, cy, R - 30, 0xFFFFB27A, kg, stroke=10)
        text(c, "16,569 bp", cx, cy + 14, 46, PAL["white"], "heavy", "center", kg)
        text(c, "（約16 kb の環状ゲノム）", cx, cy + 66, 28, PAL["text"], "bold", "center", kg)
        for i in range(37):
            a = i / 37 * math.tau
            col = PAL["red"] if i % 3 == 0 else (0xFF4FD0E0 if i % 3 == 1 else 0xFF7FF06F)
            circle(c, cx + math.cos(a) * R, cy + math.sin(a) * R, 8, col, kg * ease(prog(t, t_g + 1.0 + i * 0.04, 0.3)))
        label(c, "遺伝子 37個", cx - 420, cy - 260, 34, PAL["yellow"], 0xFF2A1A00, ease(prog(t, t_g + 2.5, 0.5)))
    kp = ease(prog(t, t_p, 0.8))
    if kp > 0:
        rrect(c, 1380, 560, 400, 260, 60, 0xFF20164A, kp)
        text(c, "核", 1580, 620, 34, PAL["dna"], "heavy", "center", kp)
        text(c, "核ゲノムにコード", 1580, 670, 26, PAL["text"], "bold", "center", kp)
        u = ease(prog(t, t_p + 1.0, 1.5))
        mol.polymerase(c, lerp(1580, cx + R + 40, u), lerp(760, cy, u), 0.35, "both", kp, color=0xFFFFC08A, t=t)
        label(c, "ミトコンドリア特異的 RNAポリメラーゼ", 1500, 900 - 40, 28, 0xFFFFC08A, 0xFF2A1000, kp)
    kw = prog(t, t_w, 3.0)
    if kw > 0:
        for j, (rr, col) in enumerate(((R + 40, 0xFFFFD08A), (R - 70, 0xFF8AE0FF))):
            p = skia.Path()
            p.addArc(skia.Rect.MakeXYWH(cx - rr, cy - rr, 2 * rr, 2 * rr), -90 if j == 0 else 270, (360 if j == 0 else -360) * ease(kw))
            c.drawPath(p, paint(col, 0.9, 10))
        kq = ease(prog(t, t_w + 3.2, 0.8))
        if kq > 0:
            for i, (s, col) in enumerate((("mRNA", PAL["rna"]), ("tRNA", PAL["orange"]), ("rRNA", PAL["blue"]))):
                x = 1350 + i * 160
                rrect(c, x - 60, 250, 120, 40, 10, col, kq)
                text_center(c, s, x, 270, 26, 0xFF101020, "heavy", "center", kq)
            text(c, "各鎖の全体を転写 → プロセッシング", 1510, 210, 30, PAL["yellow"], "heavy", "center", kq)
    cast(c, t, S, akari_s=0.4, akari_x=130, nuku_x=1840, nuku_y=150, nuku_s=0.36)
    hud(c, t, S)
    scene_fade(c, t, S, fout=0.6)
