"""The medical figures, drawn inside the tilted white card (content area 590 x 470, header strip 0..46).

Each diagram is f(ctx, step, lt, t): step = the figure state of the current line, lt = seconds since that state began.
Facts follow the lecture slides (エピジェネティクス2026)."""
import math
import cairo
from gfx import (BLACK, WHITE, hexc, mix, src, text, box, label_box, circle, ball, arrow, star_burst, lollipop,
                 ch3_flag, tag, nucleosome, chromosome, dna_ladder, cell, hexagon_ring, ease_out, back_out, clamp, rrect)

CW, CH = 590, 470

# ── Blender clips (out/blender/<clip>/f0000.png …, see blender/assets.py) ─────
from collections import OrderedDict
from pathlib import Path

CLIP_DIR = Path(__file__).resolve().parent / "out" / "blender"
FPS = 24
_meta, _cache = {}, OrderedDict()


def clip_surface(name, lt):
    """the frame of a 3D clip at lt seconds: the clip once, then its loop region; None if it was not rendered"""
    if name not in _meta:
        c = CLIP_DIR / name / "count.txt"
        _meta[name] = tuple(int(v) for v in c.read_text().split()) if c.exists() else None
    m = _meta[name]
    if not m:
        return None
    n, loop = m
    f = max(0, int(lt * FPS))
    if f >= n:
        f = loop + (f - loop) % max(1, n - loop) if loop < n - 1 else n - 1
    key = (name, f)
    if key in _cache:
        _cache.move_to_end(key)
        return _cache[key]
    p = CLIP_DIR / name / f"f{f:04d}.png"
    if not p.exists():
        return None
    sf = cairo.ImageSurface.create_from_png(str(p))
    _cache[key] = sf
    if len(_cache) > 48:
        _cache.popitem(last=False)
    return sf


def clip3d(ctx, name, lt, x, y, scale=1.0, alpha=1.0, center=False):
    sf = clip_surface(name, lt)
    if sf is None:
        return False
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    if center:
        ctx.translate(-sf.get_width() / 2, -sf.get_height() / 2)
    ctx.set_source_surface(sf, 0, 0)
    ctx.paint_with_alpha(alpha)
    ctx.restore()
    return True
BLUE, PINK, ORANGE, GREEN = hexc("#2b6cff"), hexc("#ff4fa3"), hexc("#ff8a1f"), hexc("#2fbf5f")
YELLOW, RED, PURPLE, CYAN = hexc("#ffd23f"), hexc("#ff3b3b"), hexc("#9b6bff"), hexc("#38c6ff")
GREY = hexc("#9aa0b5")


def appear(lt, delay=0.0, dur=0.35):
    return back_out((lt - delay) / dur) if lt > delay else 0.0


def fade(lt, delay=0.0, dur=0.3):
    return clamp((lt - delay) / dur)


def scaled(ctx, x, y, k, fn):
    if k <= 0.01:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(k, k)
    ctx.translate(-x, -y)
    fn()
    ctx.restore()


def header(ctx, s, col=hexc("#ff4fa3")):
    rrect(ctx, 0, 0, CW, 50, 14)
    src(ctx, col)
    ctx.fill()
    ctx.rectangle(0, 30, CW, 20)
    ctx.fill()
    ctx.set_line_width(4)
    src(ctx, BLACK)
    ctx.move_to(0, 50)
    ctx.line_to(CW, 50)
    ctx.stroke()
    from gfx import text_w
    size = min(26, 26 * 550 / max(1, text_w(ctx, s, "zen", 26)))
    text(ctx, s, CW / 2, 26, size, "zen", fill=WHITE, stroke=BLACK, sw=5)


# ── S02 definition ──────────────────────────────────────────────────────────
def definition(ctx, step, lt, t):
    if step <= 1:
        header(ctx, "エピジェネティクス＝配列を変えない発現制御", hexc("#7a5cff"))
        seq = "ATGCTCGACGGT"
        for i, ch in enumerate(seq):
            x = 70 + i * 38
            box(ctx, x - 16, 110, 32, 40, WHITE, r=6, lw=3, drop=2)
            text(ctx, ch, x, 130, 24, "dela", fill={"A": RED, "T": ORANGE, "G": GREEN, "C": BLUE}[ch])
        text(ctx, "配列はそのまま", 295, 182, 26, "zen", fill=BLACK)
        on = (t * 0.8) % 2 < 1
        cx, cy = 295, 320
        box(ctx, cx - 150, cy - 60, 300, 120, hexc("#fff7d6"), r=60, lw=5)
        circle(ctx, cx + (70 if on else -70), cy, 48, GREEN if on else GREY, lw=5)
        text(ctx, "ON" if on else "OFF", cx + (70 if on else -70), cy, 30, "dela", fill=WHITE, stroke=BLACK, sw=5)
        text(ctx, "遺伝子発現スイッチ", cx, cy + 96, 24, "zen", fill=BLACK)
    elif step == 2:
        header(ctx, "細胞分裂を越えて記憶される", hexc("#7a5cff"))
        k = clamp(lt / 1.2)
        cell(ctx, 150, 250, 80, hexc("#9ff0c8"), t=t, wobble=0.03)
        tag(ctx, "ON", 150, 250, 26, GREEN)
        for j, yy in enumerate((160, 340)):
            a = fade(lt, 0.3 + j * 0.2)
            arrow(ctx, 240, 250, 240 + 90 * a, 250 + (yy - 250) * 0.7 * a, color=YELLOW, lw=8, alpha=a)
            if a > 0.05:
                cell(ctx, 430, yy, 64 * appear(lt, 0.6 + j * 0.2), hexc("#9ff0c8"), t=t, wobble=0.03)
                tag(ctx, "ON", 430, yy, 22 * appear(lt, 0.6 + j * 0.2), GREEN)
        text(ctx, "娘細胞も同じ状態", 430, 440, 24, "zen", fill=BLACK, alpha=k)
    elif step == 3:
        header(ctx, "エピゲノム＝ゲノムのエピジェネティックな状態のすべて", hexc("#7a5cff"))
        dna_ladder(ctx, 40, 550, 170, amp=24, turns=4, phase=t)
        for i, x in enumerate((110, 230, 350, 470)):
            ch3_flag(ctx, x, 150, 1.0, alpha=fade(lt, 0.2 + i * 0.15))
        for i, x in enumerate((120, 250, 380, 500)):
            nucleosome(ctx, x, 340, 50, PINK)
            if i % 2 == 0:
                tag(ctx, "Ac", x + 30, 290, 18, ORANGE, alpha=fade(lt, 0.6 + i * 0.1))
            else:
                tag(ctx, "Me", x + 30, 290, 18, CYAN, alpha=fade(lt, 0.6 + i * 0.1))
        text(ctx, "DNAメチル化 ＋ ヒストン修飾 など", CW / 2, 440, 24, "zen", fill=BLACK)
    else:
        header(ctx, "エピジェネティクスの四つのしくみ", hexc("#7a5cff"))


# ── S03 central dogma ───────────────────────────────────────────────────────
def dogma(ctx, step, lt, t):
    header(ctx, "セントラルドグマとエピジェネティクス", hexc("#00a88f"))
    y = 120
    xs = (90, 290, 480)
    for x, s in zip(xs, ("DNA", "RNA", "タンパク質")):
        box(ctx, x - (70 if s != "タンパク質" else 90), y - 32, 140 if s != "タンパク質" else 180, 64, WHITE, r=14, lw=5)
        text(ctx, s, x, y, 30 if s != "タンパク質" else 28, "dela", fill=BLACK)
    arrow(ctx, 165, y, 215, y, lw=8)
    arrow(ctx, 365, y, 385, y, lw=8)
    text(ctx, "転写", 190, y - 50, 22, "zen", fill=BLACK)
    text(ctx, "翻訳", 375, y - 50, 22, "zen", fill=BLACK)
    ctx.set_line_width(7)
    src(ctx, BLACK)
    ctx.arc_negative(26, y, 24, -math.pi / 2, math.pi / 2)
    ctx.stroke()
    text(ctx, "複製", 34, y - 52, 20, "zen", fill=BLACK)
    if step == 1 or step >= 4:
        k = appear(lt, 0.2) if step == 1 else 1.0
        scaled(ctx, 190, 230, k, lambda: (
            box(ctx, 60, 200, 300, 64, RED, r=16, lw=5),
            text(ctx, "エピジェネティクス", 210, 222, 26, "zen", fill=WHITE, stroke=BLACK, sw=5),
            text(ctx, "DNAメチル化・ヒストン修飾 等", 210, 248, 15, "zen", fill=WHITE),
            arrow(ctx, 190, 200, 190, 146, color=RED, lw=12, head=28)))
    if step == 2:
        seq = "ATGCTCGA"
        for i, ch in enumerate(seq):
            x = 120 + i * 48
            mut = i == 4
            box(ctx, x - 19, 230, 38, 48, hexc("#ffe0e0") if mut and lt > 0.6 else WHITE, r=6, lw=3, drop=2)
            text(ctx, ("A" if lt > 0.6 else ch) if mut else ch, x, 254, 28, "dela", fill=RED if mut else BLACK)
        if lt > 0.6:
            star_burst(ctx, 312, 210, 14, 30, 8, YELLOW, lw=3)
        box(ctx, 130, 320, 330, 100, hexc("#e8ecff"), r=16, lw=5)
        text(ctx, "ジェネティクス", 295, 350, 28, "zen", fill=BLACK)
        text(ctx, "塩基配列が変わる ＝ 不可逆", 295, 392, 22, "zen", fill=hexc("#3a3fd0"))
    if step == 3:
        on = (lt * 0.7) % 2 < 1
        for i in range(6):
            x = 110 + i * 75
            nucleosome(ctx, x, 270 if on else 270, 32, PINK)
            if not on and i % 2 == 0:
                ch3_flag(ctx, x, 236, 0.8)
            if on and i % 2 == 1:
                tag(ctx, "Ac", x, 225, 16, ORANGE)
        box(ctx, 130, 330, 330, 100, hexc("#fff1d6"), r=16, lw=5)
        text(ctx, "エピジェネティクス", 295, 360, 28, "zen", fill=BLACK)
        text(ctx, "配列はそのまま ＝ 可塑的・可逆的", 295, 402, 22, "zen", fill=hexc("#d1430a"))
        ctx.set_line_width(6)
        src(ctx, ORANGE)
        ctx.arc(520, 300, 30, t * 3, t * 3 + 4.6)
        ctx.stroke()
    if step >= 4:
        items = [("遺伝的背景", "(SNPs)", 70), ("加齢", "", 200), ("過食", "", 310), ("運動不足", "", 430)]
        for i, (a, b, x) in enumerate(items):
            k = appear(lt, 0.15 * i) if step == 4 else 1
            if k <= 0:
                continue
            box(ctx, x - 58, 360, 116, 50, hexc("#eaffea") if i else WHITE, r=10, lw=4, alpha=min(1, k))
            text(ctx, a, x, 385, 21, "zen", fill=BLACK, alpha=min(1, k))
            if b:
                text(ctx, b, x, 425, 16, "zen", fill=BLACK)
            arrow(ctx, x, 356, 160 + (x - 70) * 0.4, 270, color=GREEN if i else BLUE, lw=5, head=16, alpha=min(1, k))
        text(ctx, "環境因子", 370, 448, 22, "zen", fill=GREEN)


# ── S04 histone ─────────────────────────────────────────────────────────────
def octamer(ctx, cx, cy, s, lt, t, tails=True, tags=0.0):
    cols = [PINK, ORANGE, CYAN, hexc("#9dff5a")]
    labs = ["H2A", "H2B", "H3", "H4"]
    w, h = 300 * s, 210 * s
    for layer in (0, 1):
        for i in range(4):
            k = appear(lt, 0.1 * (i + layer * 4)) if lt < 2 else 1
            if k <= 0:
                continue
            x = cx - w / 2 + i * w / 4
            y = cy - h / 2 + layer * h / 2
            rrect(ctx, x + 3, y + 3, w / 4 - 6, h / 2 - 6, 14 * s)
            src(ctx, mix(cols[i], WHITE, 0.2 * layer))
            ctx.fill_preserve()
            ctx.set_line_width(4)
            src(ctx, BLACK)
            ctx.stroke()
            text(ctx, labs[i], x + w / 8, y + h / 4, 24 * s * min(1, k), "dela", fill=WHITE, stroke=BLACK, sw=4)
    if tails:
        for i, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1), (-1, 0), (1, 0))):
            bx, by = cx + sx * w / 2, cy + sy * h * 0.35
            ctx.set_line_width(5)
            src(ctx, BLACK)
            ctx.move_to(bx, by)
            ex, ey = bx, by
            for k in range(1, 7):
                ex = bx + sx * k * 14 * s
                ey = by + math.sin(t * 5 + k + i) * 7 + (sy * k * 5 * s)
                ctx.line_to(ex, ey)
            ctx.stroke()
            if tags > 0:
                kinds = [("Me", CYAN), ("P", YELLOW), ("Ac", ORANGE), ("Ub", GREEN), ("Ac", ORANGE), ("Me", CYAN)]
                lab, col = kinds[i]
                a = clamp((tags - i * 0.15) / 0.3)
                if a > 0:
                    tag(ctx, lab, ex + sx * 14, ey, 17 * back_out(a), col)


def chain(ctx, x0, y, n, gap, r, col, t, tag_kind=None, tagk=1.0, wave=0.0):
    pts = []
    for i in range(n):
        pts.append((x0 + i * gap, y + math.sin(i * 1.3 + t * 2) * wave))
    ctx.set_line_width(7)
    src(ctx, BLUE)
    ctx.move_to(pts[0][0] - 40, pts[0][1])
    for p in pts:
        ctx.line_to(*p)
    ctx.line_to(pts[-1][0] + 40, pts[-1][1])
    ctx.stroke()
    for i, (x, yy) in enumerate(pts):
        nucleosome(ctx, x, yy, r, col)
        if tag_kind and tagk > 0:
            lab, c = tag_kind
            a = clamp((tagk - i * 0.08) / 0.3)
            if a > 0:
                tag(ctx, lab, x + r * 0.5, yy - r - 8, 15 * back_out(a), c)


def histone(ctx, step, lt, t):
    if step <= 3:
        header(ctx, "ヒストン八量体（H2A・H2B・H3・H4 ×2）", hexc("#ff4fa3"))
        if clip3d(ctx, ("nuc_build", "nuc_wrap", "nuc_tags")[max(1, step) - 1], lt, CW / 2 + 25, 235, scale=1.2, center=True):
            for i, (lab, col) in enumerate((("H2A", PINK), ("H2B", ORANGE), ("H3", CYAN), ("H4", hexc("#7ee05a")))):
                tag(ctx, lab, 34, 90 + i * 46, 19, col, size=13)
            text(ctx, "×2", 34, 278, 20, "dela", fill=BLACK)
            if step >= 2:
                text(ctx, "DNAが約1.65回巻き付く" if step == 2 else "ヒストンテール（N末端）に修飾", CW / 2, 400, 22, "zen",
                     fill=BLACK, stroke=WHITE, sw=6)
        elif step >= 2:
            dna_ladder(ctx, 40, 550, 220, amp=125, turns=1.65, phase=0.6, c1=BLUE, c2=hexc("#1d3fa0"), lw=8,
                       alpha=0.9, rungs=False)
        if clip_surface("nuc_build", 0) is None:
            octamer(ctx, CW / 2, 220, 1.0, lt if step == 1 else 9, t, tails=step >= 2, tags=(lt / 1.4 if step == 3 else 0))
            if step >= 2:
                text(ctx, "ヒストンテール（N末端）", CW / 2, 380, 24, "zen", fill=BLACK, stroke=WHITE, sw=6)
        if step == 3:
            for i, (lab, col, nm) in enumerate((("Me", CYAN, "メチル化"), ("P", YELLOW, "リン酸化"),
                                               ("Ac", ORANGE, "アセチル化"), ("Ub", GREEN, "ユビキチン化"))):
                x = 80 + i * 145
                tag(ctx, lab, x - 40, 432, 17, col, alpha=fade(lt, 0.3 + i * 0.2))
                text(ctx, nm, x + 15, 432, 19, "zen", fill=BLACK, alpha=fade(lt, 0.3 + i * 0.2))
        return
    if step == 4:
        header(ctx, "アセチル化 → ユークロマチン → 転写ON", hexc("#ff8a1f"))
        k = ease_out(lt / 1.6)
        gap = 54 + 46 * k
        if not clip3d(ctx, "fiber_open", lt, 0, 60):
            chain(ctx, 70, 230, 6, gap, 30, PINK, t, ("Ac", ORANGE), tagk=lt / 1.2, wave=10 * k)
        text(ctx, "HAT", 90, 120, 26, "dela", fill=ORANGE, stroke=BLACK, sw=5)
        if lt > 1.4:
            arrow(ctx, 120, 360, 470, 360, color=GREEN, lw=12, head=30)
            text(ctx, "転写 ON！", 300, 410, 30, "dela", fill=GREEN, stroke=BLACK, sw=5)
        text(ctx, "ユークロマチン", 420, 120, 26, "zen", fill=BLACK)
        return
    header(ctx, "脱アセチル化＋メチル化 → ヘテロクロマチン", hexc("#3a7bff"))
    k = ease_out(lt / 1.6) if step == 5 else 1
    gap = 100 - 52 * k
    if not clip3d(ctx, "fiber_close", lt if step == 5 else 99, 0, 60):
        chain(ctx, 90 + 100 * k, 230, 6, gap, 30, PINK, t, ("Me", CYAN), tagk=(lt / 1.2 if step == 5 else 9))
    text(ctx, "HDAC", 90, 120, 24, "dela", fill=GREEN, stroke=BLACK, sw=5)
    text(ctx, "HMT", 210, 120, 24, "dela", fill=CYAN, stroke=BLACK, sw=5)
    if step == 6:
        for i in range(4):
            a = appear(lt, 0.2 + i * 0.15)
            if a > 0:
                ball(ctx, 210 + i * 52, 175, 22 * a, PURPLE)
                text(ctx, "HP1" if i % 2 == 0 else "Pc", 210 + i * 52, 175, 13 * a, "dela", fill=WHITE)
        circle(ctx, 300, 370, 40, RED, lw=5)
        ctx.set_line_width(10)
        src(ctx, WHITE)
        ctx.move_to(280, 350)
        ctx.line_to(320, 390)
        ctx.move_to(320, 350)
        ctx.line_to(280, 390)
        ctx.stroke()
        text(ctx, "転写 OFF", 430, 370, 30, "dela", fill=BLUE, stroke=BLACK, sw=5)
        text(ctx, "HP1・ポリコームが集合", 300, 440, 20, "zen", fill=BLACK)


# ── S05/S06 DNA methylation ─────────────────────────────────────────────────
TOP = "ATGCTCGACGGT"
BOT = "TACGAGCTGCCA"  # 3'→5' under the top strand


def cpg_sites():
    """indices i where top[i:i+2] == 'CG' (C on the top strand at i, C on the bottom strand at i+1)"""
    return [i for i in range(len(TOP) - 1) if TOP[i:i + 2] == "CG"]


def strands(ctx, x0, y, step_w=40, meth_top=0.0, meth_bot=0.0, glow=False, alpha=1.0, scale=1.0, t=0.0, hemi=False):
    sites = cpg_sites()
    text(ctx, "5'", x0 - 30, y, 18 * scale, "dela", fill=BLACK, alpha=alpha)
    text(ctx, "3'", x0 - 30, y + 50 * scale, 18 * scale, "dela", fill=BLACK, alpha=alpha)
    for i in range(len(TOP)):
        x = x0 + i * step_w
        hl = glow and (i in sites or i - 1 in sites)
        for row, s in ((0, TOP), (1, BOT)):
            yy = y + row * 50 * scale
            box(ctx, x - 16 * scale, yy - 20 * scale, 32 * scale, 40 * scale,
                YELLOW if hl and (t * 3) % 2 < 1.4 else WHITE, r=6, lw=3, drop=2, alpha=alpha)
            text(ctx, s[i], x, yy, 23 * scale, "dela",
                 fill={"A": RED, "T": ORANGE, "G": GREEN, "C": BLUE}[s[i]], alpha=alpha)
    for j, i in enumerate(sites):
        a = clamp(meth_top * len(sites) - j)
        if a > 0:
            ch3_flag(ctx, x0 + i * step_w, y - 20 * scale, 0.85 * scale * back_out(a), alpha=alpha)
        b = clamp(meth_bot * len(sites) - j)
        if b > 0 and not hemi:
            xx = x0 + (i + 1) * step_w
            ctx.save()
            ctx.translate(xx, y + 70 * scale)
            ctx.scale(1, -1)
            ch3_flag(ctx, 0, 0, 0.85 * scale * back_out(b), alpha=alpha)
            ctx.restore()
    text(ctx, "3'", x0 + len(TOP) * step_w - 6, y, 18 * scale, "dela", fill=BLACK, alpha=alpha)
    text(ctx, "5'", x0 + len(TOP) * step_w - 6, y + 50 * scale, 18 * scale, "dela", fill=BLACK, alpha=alpha)


def methylation(ctx, step, lt, t):
    if step == 1:
        header(ctx, "メチル化されるのは CpG のシトシン", hexc("#00a8c6"))
        if clip3d(ctx, "dna_spin", lt, CW / 2, 195, scale=1.0, center=True):
            strands(ctx, 150, 335, step_w=25, glow=True, t=t, scale=0.6)
            text(ctx, "5'-C-p-G-3'（シトシンの次がグアニン）", CW / 2, 408, 22, "zen", fill=BLACK)
            text(ctx, "※酵母など一部を除く真核生物", CW / 2, 442, 16, "zen", fill=hexc("#555577"))
        else:
            strands(ctx, 75, 170, glow=True, t=t)
            text(ctx, "5'-C-p-G-3'（シトシンの次がグアニン）", CW / 2, 330, 24, "zen", fill=BLACK)
            text(ctx, "※酵母など一部を除く真核生物", CW / 2, 380, 18, "zen", fill=hexc("#555577"))
    elif step == 2:
        header(ctx, "DNMT がシトシンの5位の炭素をメチル化", hexc("#00a8c6"))
        if not clip3d(ctx, "dna_drop", lt, CW / 2, 175, scale=0.95, center=True):
            strands(ctx, 75, 165, meth_top=lt / 1.2, meth_bot=lt / 1.2 - 0.3)
        # cytosine, clockwise from the top: N3, C4(-NH2), C5, C6, N1(-sugar), C2(=O)
        pts = hexagon_ring(ctx, 150, 345, 52, ["N", "C", None, "C", "N", "C"], CYAN)
        text(ctx, "NH2", pts[1][0] + 34, pts[1][1] - 16, 16, "dela", fill=BLACK)
        text(ctx, "=O", pts[5][0] - 30, pts[5][1] - 10, 16, "dela", fill=BLACK)
        text(ctx, "シトシン", 150, 440, 20, "zen", fill=BLACK)
        x5, y5 = pts[2]
        a = fade(lt, 0.8)
        circle(ctx, x5, y5, 18, YELLOW, lw=3)
        text(ctx, "C5", x5, y5, 15, "dela", fill=BLACK)
        if a > 0:
            arrow(ctx, x5 + 14, y5 + 12, x5 + 44, y5 + 40, lw=5, head=14, alpha=a)
            ball(ctx, x5 + 64, y5 + 56, 24, CYAN, alpha=a)
            text(ctx, "CH3", x5 + 64, y5 + 56, 15, "dela", fill=WHITE, stroke=BLACK, sw=3, alpha=a)
        box(ctx, 340, 320, 220, 96, hexc("#e6fbff"), r=14, lw=4)
        text(ctx, "哺乳類の体細胞", 450, 346, 20, "zen", fill=BLACK)
        text(ctx, "全CpGの約70%", 450, 386, 28, "dela", fill=BLUE)
    elif step == 3:
        header(ctx, "プロモーターのCpGアイランド", hexc("#00a8c6"))
        meth = (lt % 4) > 2
        for row, (m, lab) in enumerate(((False, "活性のある状態"), (True, "抑制された状態"))):
            y = 170 + row * 160
            text(ctx, lab, 110, y - 70, 20, "zen", fill=BLACK)
            ctx.set_line_width(8)
            src(ctx, BLACK)
            ctx.move_to(40, y)
            ctx.line_to(550, y)
            ctx.stroke()
            box(ctx, 330, y - 22, 200, 44, hexc("#ffb347"), r=6, lw=4, drop=0)
            text(ctx, "遺伝子", 430, y, 20, "zen", fill=BLACK)
            for i in range(8):
                lollipop(ctx, 70 + i * 30, y, m, h=26, r=10)
            if not m:
                arrow(ctx, 330, y - 50, 520, y - 50, color=GREEN, lw=8, head=20)
                text(ctx, "転写", 550, y - 50, 18, "zen", fill=GREEN)
            else:
                circle(ctx, 430, y - 56, 20, RED, lw=4)
                text(ctx, "×", 430, y - 56, 24, "dela", fill=WHITE)
        _ = meth
        text(ctx, "がん細胞ではがん抑制遺伝子の発現抑制にも", CW / 2, 440, 18, "zen", fill=RED)
    elif step == 4:
        header(ctx, "メチル化DNA → HDAC・HMT → HP1 → ヘテロクロマチン", hexc("#00a8c6"))
        if not clip3d(ctx, "fiber_close", lt, CW / 2, 285, scale=1.05, center=True):
            k = ease_out(lt / 2.0)
            chain(ctx, 80 + 90 * k, 300, 6, 90 - 40 * k, 30, PINK, t, ("Me", CYAN), tagk=lt / 1.5)
            for i in range(5):
                lollipop(ctx, 120 + i * 80, 200, True, h=24, r=10)
        a = appear(lt, 0.3)
        if a > 0:
            for i, (lab, col) in enumerate((("MBD", PURPLE), ("HDAC", GREEN), ("HMT", CYAN), ("HP1", hexc("#c04dff")))):
                aa = appear(lt, 0.3 + i * 0.35)
                if aa > 0:
                    label_box(ctx, lab, 110 + i * 125, 120, 20 * min(1.2, aa), col, fg=WHITE)
                    if i < 3:
                        arrow(ctx, 150 + i * 125, 120, 180 + i * 125, 120, lw=4, head=12, alpha=min(1, aa))
        text(ctx, "メチル化DNA結合タンパク質", 170, 410, 18, "zen", fill=BLACK)
        text(ctx, "転写抑制", 450, 410, 28, "dela", fill=BLUE, stroke=BLACK, sw=4)
    elif step == 5:
        header(ctx, "メチル化模様の 形成 → 維持 → 消去", hexc("#00a8c6"))
        strands(ctx, 120, 110, step_w=30, meth_top=1, meth_bot=1, scale=0.75)
        k = clamp(lt / 1.5)
        arrow(ctx, 200, 200, 120, 240, lw=6, head=16, alpha=k)
        arrow(ctx, 390, 200, 470, 240, lw=6, head=16, alpha=k)
        text(ctx, "複製", 295, 225, 22, "zen", fill=BLACK, alpha=k)
        if k > 0.3:
            fill_new = clamp((lt - 2.0) / 1.2)
            for j, x0 in enumerate((30, 320)):
                strands(ctx, x0 + 20, 300, step_w=20, meth_top=1, meth_bot=fill_new, scale=0.55)
            if lt > 1.8:
                label_box(ctx, "DNMTが新しい鎖に模様をコピー", CW / 2, 430, 19, YELLOW)
    else:
        header(ctx, "DNA脱メチル化経路（提唱されているモデル）", hexc("#00a8c6"))
        steps = [("5mC", CYAN, "メチル化シトシン"), ("5hmC など", ORANGE, "ヒドロキシル化など"), ("C", WHITE, "修復酵素で除去 → C")]
        for i, (a, col, b) in enumerate(steps):
            k = appear(lt, 0.3 + i * 0.5)
            if k <= 0:
                continue
            x = 100 + i * 195
            circle(ctx, x, 220, 56 * min(1.1, k), col, lw=5)
            text(ctx, a, x, 220, 22 * min(1.1, k), "dela", fill=BLACK)
            text(ctx, b, x, 310, 17, "zen", fill=BLACK)
            if i:
                arrow(ctx, x - 135, 220, x - 64, 220, lw=6, head=16)
        text(ctx, "作る・維持する・消す の総和＝メチル化状態", CW / 2, 410, 20, "zen", fill=BLUE)


# ── S07 differentiation & iPS ───────────────────────────────────────────────
def cell_types(ctx, cx, cy, R, lt, t, labels=True):
    kinds = [("神経細胞", hexc("#ffd23f")), ("筋肉細胞", hexc("#ff7a7a")), ("赤血球", hexc("#ff3b3b")),
             ("皮膚細胞", hexc("#ffc6a0")), ("肝細胞", hexc("#a66bff")), ("血管内皮", hexc("#5ad1ff"))]
    for i, (nm, col) in enumerate(kinds):
        a = math.radians(-90 + i * 60)
        k = appear(lt, 0.2 + i * 0.12)
        if k <= 0:
            continue
        x, y = cx + math.cos(a) * R, cy + math.sin(a) * R * 0.8
        arrow(ctx, cx + math.cos(a) * 52, cy + math.sin(a) * 42, x - math.cos(a) * 40, y - math.sin(a) * 32,
              color=YELLOW, lw=5, head=14, alpha=min(1, k))
        if nm == "赤血球":
            ctx.save()
            ctx.translate(x, y)
            ctx.scale(1, 0.6)
            circle(ctx, 0, 0, 30 * k, col, lw=4)
            ctx.restore()
        elif nm == "神経細胞":
            cell(ctx, x, y, 24 * k, col, nucleus=True)
            ctx.set_line_width(4)
            src(ctx, BLACK)
            for j in range(5):
                b = j * 1.25 + t * 0.3
                ctx.move_to(x + math.cos(b) * 24 * k, y + math.sin(b) * 24 * k)
                ctx.line_to(x + math.cos(b) * 44 * k, y + math.sin(b) * 44 * k)
            ctx.stroke()
        elif nm == "筋肉細胞":
            rrect(ctx, x - 40 * k, y - 14 * k, 80 * k, 28 * k, 14 * k)
            src(ctx, col)
            ctx.fill_preserve()
            ctx.set_line_width(4)
            src(ctx, BLACK)
            ctx.stroke()
        else:
            cell(ctx, x, y, 28 * k, col)
        if labels:
            text(ctx, nm, x, y + 44, 16, "zen", fill=BLACK, stroke=WHITE, sw=4)


def differentiation(ctx, step, lt, t):
    if step == 1:
        header(ctx, "DNAメチル化レベルは発生・分化でダイナミックに変わる", hexc("#ff6a00"))
        ctx.set_line_width(4)
        src(ctx, BLACK)
        ctx.move_to(60, 90)
        ctx.line_to(60, 380)
        ctx.line_to(560, 380)
        ctx.stroke()
        text(ctx, "メチル化レベル", 100, 74, 18, "zen", fill=BLACK)
        pts = [(70, 300), (130, 360), (190, 250), (250, 150), (300, 150), (360, 330), (430, 200), (520, 150)]
        k = clamp(lt / 2.0)
        n = max(2, int(len(pts) * k) + 1)
        ctx.set_line_width(9)
        src(ctx, ORANGE)
        ctx.move_to(*pts[0])
        for p in pts[1:n]:
            ctx.line_to(*p)
        ctx.stroke()
        labels = [(130, "始原生殖細胞"), (270, "精子・卵子"), (360, "受精卵"), (520, "体細胞・成体")]
        for x, s in labels:
            text(ctx, s, x, 410, 17, "zen", fill=BLACK)
        text(ctx, "リセット", 130, 395 - 70, 18, "dela", fill=RED)
        text(ctx, "新生メチル化", 210, 200, 16, "zen", fill=BLUE)
        text(ctx, "加齢・環境で変動", 480, 120, 16, "zen", fill=GREEN)
    elif step == 2:
        header(ctx, "同じゲノム（約25,000遺伝子）→ 200種類以上の細胞", hexc("#ff6a00"))
        cell(ctx, CW / 2, 255, 48, hexc("#fff59d"), t=t, wobble=0.03)
        text(ctx, "受精卵", CW / 2, 255, 18, "zen", fill=BLACK)
        cell_types(ctx, CW / 2, 255, 175, lt, t)
    elif step == 3:
        header(ctx, "iPS細胞：エピジェノタイプの初期化", hexc("#ff6a00"))
        cell(ctx, 90, 250, 50, hexc("#ffc6a0"), t=t)
        text(ctx, "皮膚細胞", 90, 320, 18, "zen", fill=BLACK)
        facs = [("Oct3/4", PINK), ("Sox2", CYAN), ("Klf4", GREEN), ("c-Myc", ORANGE)]
        for i, (f, col) in enumerate(facs):
            k = appear(lt, 0.2 + i * 0.2)
            if k > 0:
                label_box(ctx, f, 225, 130 + i * 50, 18 * min(1.1, k), col, fg=WHITE)
        arrow(ctx, 150, 250, 300, 250, color=YELLOW, lw=10, head=24)
        g = 0.5 + 0.5 * math.sin(t * 6)
        star_burst(ctx, 380, 250, 50, 78, 12, mix(YELLOW, WHITE, g), rot=t, lw=3)
        cell(ctx, 380, 250, 46, hexc("#b9f6ff"), t=t, wobble=0.04)
        text(ctx, "iPS細胞", 380, 330, 20, "dela", fill=BLUE, stroke=WHITE, sw=4)
        for i, (nm, col) in enumerate((("神経", YELLOW), ("筋肉", hexc("#ff7a7a")), ("赤血球", RED))):
            k = appear(lt, 1.4 + i * 0.2)
            if k > 0:
                arrow(ctx, 430, 250, 500, 150 + i * 100, lw=4, head=12)
                cell(ctx, 530, 150 + i * 100, 24 * k, col, nucleus=nm != "赤血球")
                text(ctx, nm, 530, 186 + i * 100, 15, "zen", fill=BLACK)
        text(ctx, "分化誘導", 470, 420, 18, "zen", fill=BLACK)
    else:
        header(ctx, "注意：インプリンティングの記憶は残る", hexc("#ff3b5c"))
        cell(ctx, 200, 250, 80, hexc("#b9f6ff"), t=t, wobble=0.04)
        text(ctx, "iPS細胞", 200, 360, 22, "dela", fill=BLUE)
        k = appear(lt, 0.3)
        if k > 0:
            ctx.save()
            ctx.translate(410, 240)
            ctx.rotate(-0.2)
            ctx.scale(k, k)
            box(ctx, -100, -50, 200, 100, hexc("#ffe0ea"), r=16, lw=6)
            text(ctx, "Imprint", 0, -10, 34, "dela", fill=RED)
            text(ctx, "消えない！", 0, 28, 22, "zen", fill=BLACK)
            ctx.restore()
        arrow(ctx, 330, 240, 270, 250, color=RED, lw=6)


# ── S08 imprinting ──────────────────────────────────────────────────────────
def stamp(ctx, x, y, k=1.0, s="Imprint"):
    if k <= 0:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-0.25)
    ctx.scale(k, k)
    rrect(ctx, -34, -13, 68, 26, 6)
    src(ctx, RED, 0.9)
    ctx.fill_preserve()
    ctx.set_line_width(3)
    src(ctx, BLACK)
    ctx.stroke()
    text(ctx, s, 0, 0, 14, "dela", fill=WHITE)
    ctx.restore()


def imprinting(ctx, step, lt, t):
    if step == 1:
        header(ctx, "片方の親由来の遺伝子だけが働く", hexc("#3a7bff"))
        for row, (who, col, on) in enumerate((("父由来", BLUE, True), ("母由来", PINK, False))):
            y = 160 + row * 150
            text(ctx, who, 70, y, 22, "zen", fill=col)
            rrect(ctx, 130, y - 22, 330, 44, 22)
            src(ctx, mix(col, WHITE, 0.5))
            ctx.fill_preserve()
            ctx.set_line_width(4)
            src(ctx, BLACK)
            ctx.stroke()
            box(ctx, 260, y - 24, 70, 48, YELLOW if on else GREY, r=8, lw=4, drop=0)
            text(ctx, "A", 295, y, 26, "dela", fill=BLACK)
            if on:
                arrow(ctx, 340, y - 40, 470, y - 40, color=GREEN, lw=7, head=18)
                text(ctx, "発現", 510, y - 40, 20, "zen", fill=GREEN)
            else:
                ch3_flag(ctx, 280, y - 24, 0.8)
                ch3_flag(ctx, 310, y - 24, 0.8)
                stamp(ctx, 410, y + 34, appear(lt, 0.4))
                text(ctx, "メチル化で不活性", 500, y, 18, "zen", fill=BLACK)
        text(ctx, "（どちらの親が印をつけるかは遺伝子ごとに決まっている）", CW / 2, 430, 15, "zen", fill=hexc("#555577"))
    elif step == 2:
        header(ctx, "親の印（imprint）は発生・分化を経ても記憶される", hexc("#3a7bff"))
        genes = "ABCDE"
        imp = {0: (1, 3), 1: (0, 2, 4)}
        for row, (who, col) in enumerate((("父親由来", BLUE), ("母親由来", PINK))):
            y = 170 + row * 140
            text(ctx, who, 75, y, 20, "zen", fill=col)
            for i, gch in enumerate(genes):
                x = 170 + i * 80
                box(ctx, x - 30, y - 25, 60, 50, mix(col, WHITE, 0.55), r=10, lw=4, drop=3)
                text(ctx, gch, x, y, 26, "dela", fill=BLACK)
                if i in imp[row]:
                    stamp(ctx, x, y - 42, appear(lt, 0.3 + i * 0.12), "Imp")
        text(ctx, "哺乳類では単為発生を防いでいると考えられる", CW / 2, 430, 19, "zen", fill=BLACK)
    elif step == 3:
        header(ctx, "生殖細胞で印をリセット → 父型・母型に刷り込み直し", hexc("#3a7bff"))
        nodes = [(110, 260, "始原生殖細胞", YELLOW), (300, 150, "精子（父型）", BLUE), (300, 370, "卵（母型）", PINK),
                 (480, 260, "受精卵", hexc("#9dff5a"))]
        for i, (x, y, s, col) in enumerate(nodes):
            k = appear(lt, 0.2 + i * 0.3)
            if k > 0:
                cell(ctx, x, y, 42 * min(1.1, k), col, t=t)
                text(ctx, s, x, y + 62, 17, "zen", fill=BLACK, stroke=WHITE, sw=4)
        arrow(ctx, 150, 235, 255, 170, lw=5)
        arrow(ctx, 150, 285, 255, 350, lw=5)
        arrow(ctx, 345, 170, 440, 235, lw=5)
        arrow(ctx, 345, 350, 440, 285, lw=5)
        label_box(ctx, "リセット（脱メチル化）", 130, 120, 17, WHITE)
        stamp(ctx, 330, 110, 1, "父型")
        stamp(ctx, 330, 420, 1, "母型")
    else:
        header(ctx, "片親性ダイソミー（UPD）＝染色体不分離が原因", hexc("#3a7bff"))
        cases = [("正常", (BLUE, PINK)), ("母性UPD", (PINK, PINK)), ("父性UPD", (BLUE, BLUE))]
        for i, (nm, cols) in enumerate(cases):
            k = appear(lt, 0.2 + i * 0.3)
            if k <= 0:
                continue
            x = 110 + i * 185
            box(ctx, x - 80, 100, 160, 230, WHITE, r=14, lw=4)
            for j, c in enumerate(cols):
                chromosome(ctx, x - 30 + j * 60, 210, 150 * min(1, k), c, w=24)
            text(ctx, nm, x, 300, 22, "zen", fill=BLACK)
        text(ctx, "3番・19番以外の全染色体で報告あり", CW / 2, 400, 22, "zen", fill=RED)


# ── S09 PWS / AS ────────────────────────────────────────────────────────────
def chr15(ctx, x, y, col, deleted=False, label="", k=1.0):
    chromosome(ctx, x, y, 210 * k, col, w=26, cen=0.2, band=(0.08, 0.3), band_col=YELLOW)
    if deleted:
        ctx.rectangle(x - 32, y - 210 * k / 2 + 210 * k * 0.2 + 8, 64, 210 * k * 0.8 * 0.22 + 6)
        src(ctx, WHITE)
        ctx.fill()
        ctx.set_line_width(5)
        src(ctx, RED)
        cy = y - 210 * k / 2 + 210 * k * 0.2 + 8 + 210 * k * 0.8 * 0.11
        ctx.move_to(x - 20, cy - 14)
        ctx.line_to(x + 20, cy + 14)
        ctx.move_to(x + 20, cy - 14)
        ctx.line_to(x - 20, cy + 14)
        ctx.stroke()
    if label:
        text(ctx, label, x, y + 125 * k, 16, "zen", fill=BLACK)


def pwsas(ctx, step, lt, t):
    if step == 1:
        header(ctx, "15番染色体長腕 15q11–q13", hexc("#9b4dff"))
        chr15(ctx, 200, 250, BLUE, label="父由来")
        chr15(ctx, 390, 250, PINK, label="母由来")
        label_box(ctx, "PWS関連遺伝子は父由来だけが働く", CW / 2, 120, 17, hexc("#d8e6ff"))
        label_box(ctx, "UBE3A（AS）は母由来だけが働く", CW / 2, 420, 17, hexc("#ffe0ee"))
        return
    if step == 2:
        header(ctx, "違いを決めるのは「どちらの親由来か」", hexc("#9b4dff"))
        for i, (nm, col) in enumerate((("プラダー・ウィリー", BLUE), ("アンジェルマン", PINK))):
            k = appear(lt, 0.2 + i * 0.3)
            if k > 0:
                x = 150 + i * 290
                box(ctx, x - 125, 140, 250, 200, mix(col, WHITE, 0.75), r=18, lw=5)
                text(ctx, nm, x, 190, 24 * min(1.1, k), "zen", fill=BLACK)
                text(ctx, "15q11–q13", x, 260, 26, "dela", fill=col)
        text(ctx, "同じ領域の欠失でも症状は大きく異なる", CW / 2, 410, 20, "zen", fill=RED)
        return
    if step in (3, 4):
        pws = step == 3
        header(ctx, "プラダー・ウィリー症候群（PWS）" if pws else "アンジェルマン症候群（AS）",
               BLUE if pws else hexc("#ff4fa3"))
        a, b = (BLUE, PINK) if pws else (PINK, BLUE)
        text(ctx, "欠失", 115, 90, 20, "zen", fill=BLACK)
        chr15(ctx, 80, 250, a, deleted=True, label="父由来" if pws else "母由来", k=0.85)
        chr15(ctx, 150, 250, b, label="母由来" if pws else "父由来", k=0.85)
        text(ctx, "または", 220, 250, 18, "zen", fill=BLACK)
        k = appear(lt, 0.4)
        if k > 0:
            text(ctx, "母性UPD" if pws else "父性UPD", 325, 90, 20, "zen", fill=BLACK)
            chr15(ctx, 290, 250, b, label="", k=0.85 * min(1, k))
            chr15(ctx, 360, 250, b, label="", k=0.85 * min(1, k))
        box(ctx, 415, 110, 160, 290, WHITE, r=14, lw=4)
        feats = ["SNORD116 など", "が働かない", "", "強迫的な過食", "肥満", "軽度の発達遅延"] if pws else \
                ["UBE3A", "が働かない", "", "重度の発達遅延", "運動失調", "笑い発作"]
        for i, f in enumerate(feats):
            if f:
                text(ctx, f, 495, 140 + i * 42, 17 if i > 1 else 18, "zen",
                     fill=(BLUE if pws else hexc("#d81b60")) if i < 2 else BLACK, alpha=fade(lt, 0.6 + i * 0.15))
        return
    header(ctx, "原因の内訳（スライド29）", hexc("#9b4dff"))
    rows = [("欠失", "70%", "70%"), ("UPD", "母性 25–30%", "父性 7%"), ("インプリンティング異常", "1%", "2–5%"),
            ("UBE3A点突然変異", "—", "10%")]
    text(ctx, "PWS", 350, 90, 26, "dela", fill=BLUE)
    text(ctx, "AS", 500, 90, 26, "dela", fill=hexc("#ff4fa3"))
    for i, (a, b, c) in enumerate(rows):
        k = fade(lt, 0.2 + i * 0.25)
        y = 150 + i * 72
        box(ctx, 20, y - 28, 550, 56, hexc("#f4ecff") if i % 2 == 0 else WHITE, r=10, lw=3, drop=0, alpha=k)
        text(ctx, a, 140, y, 19, "zen", fill=BLACK, alpha=k)
        text(ctx, b, 350, y, 22, "dela", fill=BLUE, alpha=k)
        text(ctx, c, 500, y, 22, "dela", fill=hexc("#d81b60"), alpha=k)


# ── S10 X inactivation ──────────────────────────────────────────────────────
def calico(ctx, x, y, s, t):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)

    def body():
        ctx.new_path()
        ctx.move_to(-110, 40)
        ctx.curve_to(-120, -40, -40, -60, 30, -50)
        ctx.line_to(60, -90)
        ctx.line_to(70, -60)
        ctx.line_to(100, -92)
        ctx.line_to(106, -52)
        ctx.curve_to(130, -30, 120, 10, 90, 20)
        ctx.curve_to(90, 60, 70, 70, 60, 70)
        ctx.line_to(-90, 70)
        ctx.curve_to(-140, 70, -150, 10, -170, -20)
        ctx.curve_to(-150, 0, -130, 30, -110, 40)
        ctx.close_path()

    for lx in (-80, -45, 25, 55):
        rrect(ctx, lx, 40, 24, 62, 11)
        src(ctx, WHITE)
        ctx.fill_preserve()
        ctx.set_line_width(5)
        src(ctx, BLACK)
        ctx.stroke()
    body()
    src(ctx, WHITE)
    ctx.fill()
    ctx.save()
    body()
    ctx.clip()
    for (px, py, r, c) in ((-60, -20, 40, "#ff8a1f"), (20, 30, 34, "#222222"), (90, -50, 26, "#ff8a1f"),
                           (-120, 30, 30, "#222222"), (40, -40, 22, "#222222"), (-20, 60, 28, "#ff8a1f")):
        circle(ctx, px, py, r, hexc(c), lw=0)
    ctx.restore()
    body()
    ctx.set_line_width(6)
    src(ctx, BLACK)
    ctx.stroke()
    # closed happy eyes, whiskers
    ctx.set_line_width(4)
    for ex in (70, 98):
        ctx.arc(ex, -28, 7, math.pi * 1.1, math.pi * 1.9)
        ctx.stroke()
    for k in (-1, 1):
        ctx.move_to(110, -12)
        ctx.line_to(150, -12 + k * 10)
    ctx.stroke()
    ctx.restore()


def xinact(ctx, step, lt, t):
    if step == 1:
        header(ctx, "遺伝子量補償：働くX染色体は1本", hexc("#ff6a00"))
        for i, (sym, chroms) in enumerate((("♂", ("X", "Y")), ("♀", ("X", "X")))):
            x0 = 150 + i * 290
            text(ctx, sym, x0, 110, 44, "dela", fill=BLUE if i == 0 else PINK)
            for j, c in enumerate(chroms):
                off = i == 1 and j == 1 and lt > 0.8
                chromosome(ctx, x0 - 40 + j * 80, 250, 150 if c == "X" else 90, GREY if off else (YELLOW if c == "X" else CYAN),
                           w=26, cen=0.45)
                text(ctx, c, x0 - 40 + j * 80, 350, 26, "dela", fill=BLACK)
                if off:
                    text(ctx, "不活性", x0 + 40, 160, 18, "zen", fill=RED)
            box(ctx, x0 - 80, 390, 160, 40, WHITE, r=10, lw=3, drop=0)
            ctx.rectangle(x0 - 70, 400, 140 if (i == 0 or lt > 0.8) else 140, 20)
            src(ctx, GREEN)
            ctx.fill()
            text(ctx, "X遺伝子量 ×1", x0, 410, 15, "zen", fill=BLACK)
    elif step == 2:
        header(ctx, "胚の各細胞でランダムに1本が不活性化", hexc("#ff6a00"))
        import random
        rnd = random.Random(3)
        for r in range(5):
            for c in range(8):
                k = appear(lt, (r * 8 + c) * 0.03)
                if k <= 0:
                    continue
                pm = rnd.random() < 0.5
                cell(ctx, 70 + c * 64, 110 + r * 62, 26 * k, hexc("#ffb347") if pm else hexc("#55617a"), nucleus=True)
        text(ctx, "不活性X＝ほぼ全体がヘテロクロマチン化", CW / 2, 440, 19, "zen", fill=BLACK)
    elif step == 3:
        header(ctx, "三毛猫（メス）のまだら模様", hexc("#ff6a00"))
        calico(ctx, 300, 250, 1.35 * min(1, appear(lt, 0.1)), t)
        label_box(ctx, "茶のXが不活性 → 黒", 150, 410, 16, WHITE)
        label_box(ctx, "黒のXが不活性 → 茶", 440, 410, 16, hexc("#ffe0c0"))
    else:
        header(ctx, "XistRNAがX染色体を覆う → メチル化 → 沈黙", hexc("#ff3b5c"))
        chromosome(ctx, 170, 250, 230, YELLOW, w=36, cen=0.45)
        text(ctx, "活性X", 170, 400, 22, "zen", fill=BLACK)
        k = clamp(lt / 2.0) if step == 4 else 1
        col = mix(YELLOW, hexc("#6a5a8a"), k if step == 5 else 0.3 * k)
        chromosome(ctx, 420, 250, 230 * (1 - (0.25 * clamp(lt / 1.5) if step == 5 else 0)), col, w=36, cen=0.45)
        ctx.set_line_width(7)
        src(ctx, RED)
        for j in range(int(10 * k)):
            yy = 150 + j * 20
            ctx.move_to(380, yy)
            ctx.curve_to(400, yy - 12 + math.sin(t * 4 + j) * 4, 440, yy + 12, 460, yy)
        ctx.stroke()
        text(ctx, "不活性X", 420, 400, 22, "zen", fill=BLACK)
        if step == 5:
            for j in range(4):
                ch3_flag(ctx, 470, 180 + j * 40, 0.7, alpha=fade(lt, 0.3 + j * 0.2))
            text(ctx, "ヘテロクロマチン", 420, 440, 20, "dela", fill=PURPLE)


# ── S11 twins & aging ───────────────────────────────────────────────────────
def figure_card(ctx, x, y, s, col, alpha=1.0):
    """an abstract person (no face): head circle and body"""
    circle(ctx, x, y - 50 * s, 22 * s, col, lw=4, alpha=alpha)
    rrect(ctx, x - 26 * s, y - 24 * s, 52 * s, 70 * s, 20 * s)
    src(ctx, col, alpha)
    ctx.fill_preserve()
    ctx.set_line_width(4)
    src(ctx, BLACK, alpha)
    ctx.stroke()


def meth_bar(ctx, x, y, w, diffs, seed, t, alpha=1.0):
    import random
    rnd = random.Random(seed)
    n = 16
    for i in range(n):
        on = rnd.random() < 0.5
        ctx.rectangle(x + i * w / n, y, w / n - 2, 22)
        src(ctx, CYAN if on else WHITE, alpha)
        ctx.fill_preserve()
        ctx.set_line_width(2)
        src(ctx, BLACK, alpha)
        ctx.stroke()
        if i in diffs:
            ctx.rectangle(x + i * w / n, y + 24, w / n - 2, 22)
            src(ctx, YELLOW if (t * 4) % 2 < 1.3 else ORANGE, alpha)
            ctx.fill_preserve()
            src(ctx, BLACK, alpha)
            ctx.stroke()
        else:
            ctx.rectangle(x + i * w / n, y + 24, w / n - 2, 22)
            src(ctx, CYAN if on else WHITE, alpha)
            ctx.fill_preserve()
            src(ctx, BLACK, alpha)
            ctx.stroke()


def twins(ctx, step, lt, t):
    if step <= 1:
        header(ctx, "一卵性双生児＝全く同じ遺伝情報", hexc("#00a88f"))
        figure_card(ctx, 220, 260, 1.6, hexc("#7ad7ff"))
        figure_card(ctx, 370, 260, 1.6, hexc("#7ad7ff"))
        text(ctx, "同じゲノム", 295, 140, 28, "dela", fill=BLUE, stroke=WHITE, sw=6)
        if step == 1:
            k = appear(lt, 0.2)
            scaled(ctx, 295, 395, k, lambda: label_box(ctx, "3〜74歳の一卵性双生児80組（2005）", 295, 395, 20, YELLOW))
        return
    if step == 2:
        header(ctx, "エピゲノムの差は加齢とともに増える", hexc("#00a88f"))
        text(ctx, "3歳の双子", 140, 110, 22, "zen", fill=BLACK)
        meth_bar(ctx, 40, 140, 220, {5}, 1, t)
        text(ctx, "50歳の双子", 440, 110, 22, "zen", fill=BLACK)
        meth_bar(ctx, 330, 140, 220, {1, 3, 6, 8, 11, 14} if lt > 0.6 else {5}, 1, t)
        text(ctx, "黄色＝メチル化が異なる領域", CW / 2, 230, 17, "zen", fill=BLACK)
        ctx.set_line_width(4)
        src(ctx, BLACK)
        ctx.move_to(120, 420)
        ctx.line_to(470, 420)
        ctx.stroke()
        h3 = 40
        h50 = 40 + 100 * clamp((lt - 0.6) / 1.2) * 1.3
        for x, h, s in ((210, h3, "3歳"), (380, h50, "50歳")):
            box(ctx, x - 40, 420 - h, 80, h, ORANGE if s == "50歳" else CYAN, r=4, lw=4, drop=0)
            text(ctx, s, x, 440, 18, "zen", fill=BLACK)
        if lt > 1.8:
            text(ctx, "3倍以上！", 470, 270, 30, "dela", fill=RED, stroke=WHITE, sw=6)
        return
    if step == 3:
        header(ctx, "離れて育った双子ほど差が大きい", hexc("#00a88f"))
        k = ease_out(lt / 1.2)
        for i, (x, col) in enumerate(((295 - 60 - 120 * k, hexc("#7ad7ff")), (295 + 60 + 120 * k, hexc("#ffb3d9")))):
            # houses
            hx = x
            ctx.new_path()
            ctx.move_to(hx - 70, 240)
            ctx.line_to(hx, 160)
            ctx.line_to(hx + 70, 240)
            ctx.close_path()
            src(ctx, RED if i == 0 else BLUE)
            ctx.fill_preserve()
            ctx.set_line_width(4)
            src(ctx, BLACK)
            ctx.stroke()
            box(ctx, hx - 55, 240, 110, 90, hexc("#fff4d6"), r=4, lw=4, drop=0)
            figure_card(ctx, hx, 330, 0.9, col)
        text(ctx, "環境がエピゲノムを刻む", CW / 2, 420, 26, "dela", fill=GREEN, stroke=BLACK, sw=4)
        return
    if step == 4:
        header(ctx, "暦年齢と生物学的年齢（アカゲザルのカロリー制限）", hexc("#00a88f"))
        for i, (nm, col) in enumerate((("Control", hexc("#c9c9d9")), ("CR", hexc("#9dff5a")))):
            x = 170 + i * 250
            box(ctx, x - 100, 90, 200, 70, col, r=14, lw=4)
            text(ctx, nm, x, 125, 28, "dela", fill=BLACK)
        rows = [("暦年齢", "Control ＝ CR"), ("生物学的年齢", "Control ＞ CR")]
        for i, (a, b) in enumerate(rows):
            k = fade(lt, 0.4 + i * 0.5)
            y = 230 + i * 90
            box(ctx, 40, y - 32, 510, 64, WHITE, r=12, lw=4, alpha=k)
            text(ctx, a, 150, y, 22, "zen", fill=BLACK, alpha=k)
            text(ctx, b, 390, y, 26, "dela", fill=RED if i else BLUE, alpha=k)
        text(ctx, "CRで老化関連疾患の発症と死亡が遅れた（2009）", CW / 2, 430, 17, "zen", fill=BLACK)
        return
    header(ctx, "エピジェネティッククロック", hexc("#00a88f"))
    cx, cy = 160, 260
    circle(ctx, cx, cy, 110, WHITE, lw=6)
    for i in range(12):
        a = i * math.pi / 6
        lollipop(ctx, cx + math.cos(a) * 92, cy + math.sin(a) * 92 + 14, i % 3 != 0, h=14, r=8)
    ctx.set_line_width(8)
    src(ctx, BLACK)
    ctx.move_to(cx, cy)
    ctx.line_to(cx + math.cos(t - 1.57) * 70, cy + math.sin(t - 1.57) * 70)
    ctx.stroke()
    text(ctx, "DNAメチル化レベル", cx, 410, 18, "zen", fill=BLACK)
    # scatter: DNAm age vs chronological age
    ox, oy = 320, 380
    ctx.set_line_width(4)
    ctx.move_to(ox, 110)
    ctx.line_to(ox, oy)
    ctx.line_to(560, oy)
    ctx.stroke()
    import random
    rnd = random.Random(5)
    for i in range(24):
        if fade(lt, i * 0.04) <= 0:
            continue
        u = rnd.random()
        circle(ctx, ox + 10 + u * 220, oy - 10 - u * 240 + rnd.uniform(-18, 18), 6, ORANGE, lw=2)
    ctx.set_line_width(4)
    src(ctx, BLUE)
    ctx.move_to(ox, oy)
    ctx.line_to(560, 120)
    ctx.stroke()
    text(ctx, "暦年齢", 470, 410, 17, "zen", fill=BLACK)
    text(ctx, "DNAm年齢", 380, 100, 17, "zen", fill=BLACK)


# ── S12 cancer ──────────────────────────────────────────────────────────────
def gene_with_locks(ctx, y, locks, on, lt):
    ctx.set_line_width(8)
    src(ctx, BLACK)
    ctx.move_to(40, y)
    ctx.line_to(550, y)
    ctx.stroke()
    box(ctx, 300, y - 26, 230, 52, hexc("#9dff5a") if on else hexc("#c9c9d9"), r=8, lw=4, drop=0)
    text(ctx, "がん抑制遺伝子", 415, y, 20, "zen", fill=BLACK)
    for i in range(6):
        lollipop(ctx, 70 + i * 36, y, i < locks, h=26, r=10)
    if on:
        arrow(ctx, 300, y - 54, 520, y - 54, color=GREEN, lw=8, head=20)
    else:
        circle(ctx, 415, y - 56, 18, RED, lw=4)
        text(ctx, "×", 415, y - 56, 22, "dela", fill=WHITE)


def cancer(ctx, step, lt, t):
    if step == 1:
        header(ctx, "がん：CpGアイランドの異常なメチル化", hexc("#ff3b3b"))
        gene_with_locks(ctx, 190, 6, False, lt)
        import random
        rnd = random.Random(2)
        n = 3 + int(clamp(lt / 3) * 9)
        for i in range(n):
            cell(ctx, 200 + rnd.uniform(-120, 160), 340 + rnd.uniform(-50, 60), 30, hexc("#ff7a7a"), t=t + i, wobble=0.08)
        text(ctx, "増殖・浸潤・転移", 470, 420, 20, "zen", fill=RED)
    elif step == 2:
        header(ctx, "DNA脱メチル化剤：シトシンにそっくり", hexc("#9b6bff"))
        hexagon_ring(ctx, 160, 230, 70, ["N", "C", "C", "C", "N", "C"], CYAN, hl=2)
        text(ctx, "シトシン", 160, 340, 22, "zen", fill=BLACK)
        hexagon_ring(ctx, 420, 230, 70, ["N", "C", "N", "C", "N", "C"], PURPLE, hl=2 if (t * 2) % 2 < 1.3 else None)
        text(ctx, "5-アザシチジン", 420, 340, 22, "zen", fill=BLACK)
        text(ctx, "5位の C が N に", 420, 380, 18, "zen", fill=PURPLE)
        text(ctx, "→ 複製時にDNAへ取り込まれる", CW / 2, 430, 20, "zen", fill=BLACK)
    elif step == 3:
        header(ctx, "DNMTと非可逆的に結合 → 新しい鎖はメチル化されない", hexc("#9b6bff"))
        strands(ctx, 90, 130, step_w=36, meth_top=1, meth_bot=0, scale=0.85, hemi=True)
        k = ease_out(lt / 1.2)
        x = 120 + 300 * k
        ball(ctx, x, 290, 44, CYAN)
        text(ctx, "DNMT", x, 290, 18, "dela", fill=WHITE, stroke=BLACK, sw=4)
        if lt > 1.2:
            ctx.set_line_width(8)
            src(ctx, PURPLE)
            for a in range(6):
                ang = a * math.pi / 3 + t
                ctx.move_to(x + math.cos(ang) * 30, 290 + math.sin(ang) * 30)
                ctx.line_to(x + math.cos(ang) * 64, 290 + math.sin(ang) * 64)
            ctx.stroke()
            label_box(ctx, "5aza", x + 60, 250, 18, PURPLE, fg=WHITE)
            text(ctx, "封印！", x, 380, 30, "dela", fill=RED, stroke=WHITE, sw=6)
    else:
        header(ctx, "脱メチル化剤 ＋ HDAC阻害剤 → 再活性化", hexc("#ff3b3b"))
        locks = max(0, 6 - int(lt * 4))
        gene_with_locks(ctx, 190, locks, locks == 0, lt)
        label_box(ctx, "DNA脱メチル化剤", 150, 330, 20, PURPLE, fg=WHITE)
        label_box(ctx, "HDAC阻害剤", 420, 330, 20, GREEN, fg=WHITE)
        if locks == 0:
            star_burst(ctx, 415, 110, 20, 40, 10, YELLOW, rot=t, lw=3)
            text(ctx, "がん細胞を抑制", CW / 2, 420, 24, "dela", fill=GREEN, stroke=BLACK, sw=4)


# ── S13 nutrition & editing ─────────────────────────────────────────────────
def nutrition(ctx, step, lt, t):
    if step == 1:
        header(ctx, "DOHaD仮説：胎児期の栄養が成人の病気に", hexc("#2fbf5f"))
        figure_card(ctx, 120, 250, 1.6, hexc("#ffb3d9"))
        circle(ctx, 135, 255, 26, hexc("#ffd6ea"), lw=4)
        text(ctx, "妊娠中の母", 120, 360, 18, "zen", fill=BLACK)
        ctx.save()
        ctx.translate(250, 150)
        ctx.scale(1, 0.4)
        circle(ctx, 0, 0, 50, WHITE, lw=4)
        ctx.restore()
        text(ctx, "飢餓", 250, 110, 22, "dela", fill=RED)
        arrow(ctx, 220, 260, 330, 260, lw=8, color=YELLOW)
        figure_card(ctx, 400, 260, 1.6, hexc("#7ad7ff"))
        text(ctx, "成人した子", 400, 360, 18, "zen", fill=BLACK)
        for i, s in enumerate(("肥満", "耐糖能異常", "高血圧")):
            k = appear(lt, 0.6 + i * 0.3)
            if k > 0:
                label_box(ctx, s, 520, 150 + i * 60, 17 * min(1.1, k), hexc("#ffe0e0"))
        text(ctx, "オランダ飢餓（第二次大戦末期）", CW / 2, 420, 20, "zen", fill=BLACK)
    elif step == 2:
        header(ctx, "メチル基の供給源 SAM（メチオニン・葉酸代謝）", hexc("#2fbf5f"))
        nodes = [("メチオニン", 295, 110, YELLOW), ("SAM", 470, 200, CYAN), ("SAH", 400, 350, WHITE),
                 ("ホモシステイン", 190, 350, WHITE), ("5-CH3-THF", 110, 200, hexc("#9dff5a"))]
        cx, cy = 295, 240
        for i, (s, x, y, col) in enumerate(nodes):
            k = appear(lt, 0.1 + i * 0.2)
            if k > 0:
                label_box(ctx, s, x, y, 19 * min(1.1, k), col)
        for i in range(5):
            a1 = nodes[i]
            a2 = nodes[(i + 1) % 5]
            if fade(lt, 0.3 + i * 0.2) > 0:
                arrow(ctx, a1[1] + (a2[1] - a1[1]) * 0.3, a1[2] + (a2[2] - a1[2]) * 0.3,
                      a1[1] + (a2[1] - a1[1]) * 0.7, a1[2] + (a2[2] - a1[2]) * 0.7, lw=5, head=14, color=GREEN)
        label_box(ctx, "DNA・ヒストンのメチル化", 470, 290, 15, hexc("#d6f4ff"))
        label_box(ctx, "ビタミンB12", 165, 130, 15, hexc("#ffe0c0"))
        label_box(ctx, "葉酸 → THF", 70, 270, 15, hexc("#ffe0c0"))
        text(ctx, "妊娠期の葉酸・B12不足 → 胎児のエピゲノムに影響", CW / 2, 430, 17, "zen", fill=RED)
        _ = (cx, cy)
    else:
        header(ctx, "エピゲノム編集：配列を変えずにスイッチだけ", hexc("#2fbf5f"))
        on = (lt * 0.6) % 2 < 1
        ctx.set_line_width(8)
        src(ctx, BLACK)
        ctx.move_to(40, 200)
        ctx.line_to(550, 200)
        ctx.stroke()
        box(ctx, 260, 174, 220, 52, hexc("#9dff5a") if on else hexc("#c9c9d9"), r=8, lw=4, drop=0)
        text(ctx, "目的遺伝子", 370, 200, 20, "zen", fill=BLACK)
        for i in range(5):
            if on:
                lollipop(ctx, 70 + i * 36, 200, False, h=24, r=9)
            else:
                lollipop(ctx, 70 + i * 36, 200, True, h=24, r=9)
        box(ctx, 30, 270, 260, 130, hexc("#eaffea"), r=14, lw=4, alpha=1 if on else 0.5)
        text(ctx, "活性化", 160, 298, 22, "dela", fill=GREEN)
        text(ctx, "DNA脱メチル化", 160, 335, 17, "zen", fill=BLACK)
        text(ctx, "ヒストンのアセチル化", 160, 365, 17, "zen", fill=BLACK)
        box(ctx, 300, 270, 260, 130, hexc("#eef0ff"), r=14, lw=4, alpha=1 if not on else 0.5)
        text(ctx, "不活性化", 430, 298, 22, "dela", fill=BLUE)
        text(ctx, "DNAのメチル化", 430, 335, 17, "zen", fill=BLACK)
        text(ctx, "ヒストンのメチル化", 430, 365, 17, "zen", fill=BLACK)
        text(ctx, "実験動物で治療法の開発が進む", CW / 2, 435, 18, "zen", fill=BLACK)


# ── S14 summary ─────────────────────────────────────────────────────────────
SUMMARY = [
    ("壱", "配列を変えずに発現を変え、分裂を越えて記憶", hexc("#7a5cff")),
    ("弐", "アセチル化＝ON／脱アセチル化・CpGメチル化＝OFF", hexc("#ff8a1f")),
    ("参", "インプリンティング（親の印）とX不活性化（Xist）", hexc("#ff4fa3")),
    ("肆", "環境・加齢・がん → 脱メチル化剤・HDAC阻害剤・編集", hexc("#2fbf5f")),
]


def summary(ctx, step, lt, t):
    header(ctx, "エピジェネティクス 四つの奥義", hexc("#ffb300"))
    for i, (n, s, col) in enumerate(SUMMARY):
        if i + 1 > step:
            break
        k = appear(lt, 0.0) if i + 1 == step else 1
        y = 110 + i * 92
        ctx.save()
        ctx.translate(-(1 - min(1, k)) * 300, 0)
        box(ctx, 20, y - 36, 550, 72, mix(col, WHITE, 0.75), r=14, lw=4)
        circle(ctx, 60, y, 28, col, lw=4)
        text(ctx, n, 60, y, 28, "dela", fill=WHITE, stroke=BLACK, sw=4)
        text(ctx, s, 320, y, 19, "zen", fill=BLACK)
        ctx.restore()


DIAGRAMS = dict(definition=definition, dogma=dogma, histone=histone, methylation=methylation,
                differentiation=differentiation, imprinting=imprinting, pwsas=pwsas, xinact=xinact, twins=twins,
                cancer=cancer, nutrition=nutrition, summary=summary)
