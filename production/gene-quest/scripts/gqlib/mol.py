"""分子の描画部品。形と色は講義資料の模式図に合わせる。

- RNAポリメラーゼ：資料 p.5, 13–17, 30 の「はさみ型（クランプ）」の水色の酵素
- σ因子：p.13 の赤橙のかぎ形
- TFIID（TBP）：p.30 の緑のカプセル（TBPは濃い緑の部分）、TFIIB：茶色のダンベル、TFIIE：黄土、TFIIH：サーモン、TFIIF：橙
- 介在因子（メディエーター）：p.34 の紫、クロマチン再構成複合体：濃い緑、ヒストン修飾酵素：黄
- snRNP：p.50–52 の U1 緑、U2 黄、U4 橙黄、U5 桃紫、U6 水色
色は区別の補助で、必ず名称ラベル・形と一緒に使う。
"""
from __future__ import annotations

import math

import skia

from .draw import (BASE_COLORS, PAL, circle, darken, glow, lighten, line, linear_shader, paint, path_from, rgba,
                   text, text_center)
from .chars import Expr, blink


# ---------------------------------------------------------------- 小さな顔（分子キャラクター用）
def face(c, x, y, s=1.0, e: Expr | None = None, t=0.0, eye=0xFF0E1630, seed=0.0, alpha=1.0):
    e = e or Expr()
    op = max(0.0, e.eye_open * blink(t, seed))
    for sgn in (-1, 1):
        ex, ey = x + sgn * 16 * s, y
        if e.smile_eyes > 0.5:
            p = skia.Path()
            p.moveTo(ex - 8 * s, ey + 3 * s)
            p.quadTo(ex, ey - 9 * s, ex + 8 * s, ey + 3 * s)
            c.drawPath(p, paint(eye, alpha, 4 * s))
            continue
        h = 10 * s * op
        if h < 1.5:
            c.drawLine(ex - 7 * s, ey, ex + 7 * s, ey, paint(eye, alpha, 3.5 * s))
            continue
        c.drawOval(skia.Rect.MakeXYWH(ex - 7 * s, ey - h, 14 * s, 2 * h), paint(eye, alpha))
        circle(c, ex + 2.5 * s, ey - h * 0.45, 3 * s, 0xFFFFFFFF, alpha)
    op_m = max(e.mouth_open, e.mouth_o * 0.6)
    if op_m < 0.06:
        p = skia.Path()
        p.moveTo(x - 7 * s, y + 13 * s)
        p.quadTo(x, y + (17 + 5 * e.mouth_smile) * s, x + 7 * s, y + 13 * s)
        c.drawPath(p, paint(eye, alpha, 3 * s))
    else:
        c.drawOval(skia.Rect.MakeXYWH(x - 7 * s, y + 10 * s, 14 * s, (4 + 12 * op_m) * s), paint(0xFF3A1020, alpha))


# ---------------------------------------------------------------- DNA（平面のはしご）
def dna_ladder(c, x0, x1, y, gap=60, top_seq: str | None = None, bot_seq: str | None = None,
               bubble: tuple[float, float, float] | None = None, alpha=1.0, letters=True, step=None,
               color_top=PAL["dna"], color_bot=PAL["dna2"], ends=True, end_size=30, letter_size=None,
               rung_alpha=0.9, highlight: dict | None = None, width=7):
    """水平の二本鎖DNA。上の鎖は左が5'、下の鎖は左が3'。

    bubble=(bx0, bx1, k)：bx0〜bx1 の間を k（0〜1）だけほどく（転写バブル）。
    top_seq / bot_seq：塩基を1文字ずつ並べる（等間隔）。
    highlight：{index: color} で特定の塩基対を強調。
    戻り値：塩基の x 座標のリスト。
    """
    n = len(top_seq) if top_seq else max(2, int((x1 - x0) / (step or 34)))
    st = (x1 - x0) / n
    xs = [x0 + st * (i + 0.5) for i in range(n)]

    def off(x):
        if not bubble:
            return 0.0
        bx0, bx1, k = bubble
        if x <= bx0 or x >= bx1 or k <= 0:
            return 0.0
        u = (x - bx0) / (bx1 - bx0)
        return k * math.sin(math.pi * u) ** 0.6

    sep = gap * 0.9
    pts_top = [(x, y - gap / 2 - off(x) * sep) for x in [x0 + (x1 - x0) * i / 120 for i in range(121)]]
    pts_bot = [(x, y + gap / 2 + off(x) * sep) for x in [x0 + (x1 - x0) * i / 120 for i in range(121)]]
    ls = letter_size or min(st * 0.82, 30)
    for i, x in enumerate(xs):
        o = off(x)
        yt = y - gap / 2 - o * sep
        yb = y + gap / 2 + o * sep
        bt = top_seq[i] if top_seq else None
        bb = bot_seq[i] if bot_seq else None
        hc = highlight.get(i) if highlight else None
        if o < 0.08:
            col_t = BASE_COLORS.get(bt, 0xFFCCC4FF) if bt else 0xFFCCC4FF
            col_b = BASE_COLORS.get(bb, 0xFFCCC4FF) if bb else 0xFFCCC4FF
            line(c, x, yt, x, y, col_t, max(3, st * 0.28), alpha * rung_alpha)
            line(c, x, y, x, yb, col_b, max(3, st * 0.28), alpha * rung_alpha)
        else:
            # ほどけた部分は、それぞれの鎖から塩基が内側を向く
            for yy, b, d in ((yt, bt, 1), (yb, bb, -1)):
                col = BASE_COLORS.get(b, 0xFFCCC4FF) if b else 0xFFCCC4FF
                line(c, x, yy, x, yy + d * gap * 0.32, col, max(3, st * 0.28), alpha * rung_alpha)
        if hc:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - st * 0.45, yt - 8, st * 0.9, yb - yt + 16), 10, 10),
                        paint(hc, alpha, 3.5))
    c.drawPath(path_from(pts_top), paint(color_top, alpha, width))
    c.drawPath(path_from(pts_bot), paint(color_bot, alpha, width))
    if letters and (top_seq or bot_seq):
        for i, x in enumerate(xs):
            o = off(x)
            if top_seq:
                text_center(c, top_seq[i], x, y - gap / 2 - o * sep - ls * 0.95, ls, BASE_COLORS.get(top_seq[i], PAL["text"]),
                            "heavy", "center", alpha, stroke=4)
            if bot_seq:
                text_center(c, bot_seq[i], x, y + gap / 2 + o * sep + ls * 0.95, ls, BASE_COLORS.get(bot_seq[i], PAL["text"]),
                            "heavy", "center", alpha, stroke=4)
    if ends:
        es = end_size
        text_center(c, "5'", x0 - es * 1.1, y - gap / 2, es, PAL["text"], "heavy", "center", alpha, stroke=4)
        text_center(c, "3'", x1 + es * 1.1, y - gap / 2, es, PAL["text"], "heavy", "center", alpha, stroke=4)
        text_center(c, "3'", x0 - es * 1.1, y + gap / 2, es, PAL["text"], "heavy", "center", alpha, stroke=4)
        text_center(c, "5'", x1 + es * 1.1, y + gap / 2, es, PAL["text"], "heavy", "center", alpha, stroke=4)
    return xs


def strand(c, x0, x1, y, seq: str | None, color, alpha=1.0, step=None, letters_below=True, ends=("5'", "3'"),
           letter_size=None, width=7, n_visible=None, end_size=30):
    """1本鎖（RNAなど）。n_visible で左から何塩基まで見せるか。"""
    n = len(seq) if seq else max(2, int((x1 - x0) / (step or 34)))
    st = (x1 - x0) / n
    nv = n if n_visible is None else max(0, min(n, n_visible))
    if nv <= 0:
        return
    xe = x0 + st * nv
    line(c, x0, y, xe, y, color, width, alpha)
    ls = letter_size or min(st * 0.82, 30)
    d = 1 if letters_below else -1
    for i in range(int(math.ceil(nv))):
        x = x0 + st * (i + 0.5)
        a = alpha * min(1.0, nv - i)
        if seq:
            b = seq[i]
            line(c, x, y, x, y + d * 22, BASE_COLORS.get(b, 0xFFFFFFFF), max(3, st * 0.28), a)
            text_center(c, b, x, y + d * (22 + ls * 0.75), ls, BASE_COLORS.get(b, PAL["text"]), "heavy", "center", a, stroke=4)
    if ends:
        text_center(c, ends[0], x0 - end_size * 1.1, y, end_size, PAL["text"], "heavy", "center", alpha, stroke=4)
        if nv >= n - 0.01:
            text_center(c, ends[1], x1 + end_size * 1.1, y, end_size, PAL["text"], "heavy", "center", alpha, stroke=4)


# ---------------------------------------------------------------- DNA（3D二重らせん）
def helix3d(c, t, cam_x=0.0, length=40.0, radius=1.0, pitch=3.4, x_center=960, y_center=540, scale=210,
            yaw=0.0, pitch_angle=0.0, roll=0.0, fov=1.6, cam_dist=6.0, alpha=1.0, color1=PAL["dna"],
            color2=PAL["dna2"], rungs=True, glow_on=True, x_from=None, x_to=None, spin=0.0, fog=0.08):
    """透視投影の二重らせん（右巻き）。らせん軸はワールドの x 軸。

    cam_x：カメラのx位置（らせんに沿って移動）。yaw/pitch_angle/roll：らせんの向き（ラジアン）。
    主溝と副溝の幅が違うよう、2本の鎖の位相差は π ではなく約 0.7π にしている。
    """
    segs = []
    k = math.tau / pitch
    x_from = cam_x - length / 2 if x_from is None else x_from
    x_to = cam_x + length / 2 if x_to is None else x_to
    n = int((x_to - x_from) * 10)
    cy, sy = math.cos(yaw), math.sin(yaw)
    cp, sp = math.cos(pitch_angle), math.sin(pitch_angle)
    cr, sr = math.cos(roll), math.sin(roll)

    def proj(wx, wy, wz):
        # らせん座標 → 回転 → カメラ座標（カメラは z=-cam_dist から +z を見る）
        X, Y, Z = wx - cam_x, wy, wz
        X, Z = X * cy + Z * sy, -X * sy + Z * cy
        Y, Z = Y * cp - Z * sp, Y * sp + Z * cp
        X, Y = X * cr - Y * sr, X * sr + Y * cr
        zc = Z + cam_dist
        if zc < 0.3:
            return None
        f = scale * fov / zc
        return x_center + X * f, y_center + Y * f, zc, f

    prev = [None, None]
    phase = [0.0, 0.7 * math.pi]
    pts_by_i = []
    for i in range(n + 1):
        wx = x_from + (x_to - x_from) * i / n
        row = []
        for sidx in range(2):
            a = wx * k + phase[sidx] + spin
            p = proj(wx, radius * math.cos(a), radius * math.sin(a))
            row.append(p)
            if p and prev[sidx]:
                segs.append(((p[2] + prev[sidx][2]) / 2, "bb", sidx, prev[sidx], p))
            prev[sidx] = p
        pts_by_i.append((wx, row))
    if rungs:
        step = max(1, int(10 * pitch / 10.5))  # 1回転に約10塩基対
        seq = "ATGCGTACGATCGTAGCTAGCATGCATCGA"
        for j, (wx, (p1, p2)) in enumerate(pts_by_i[::step]):
            if p1 and p2:
                b = seq[j % len(seq)]
                pair = {"A": "T", "T": "A", "G": "C", "C": "G"}[b]
                segs.append(((p1[2] + p2[2]) / 2 + 0.01, "rung", (b, pair), p1, p2))
    segs.sort(key=lambda s: -s[0])
    for z, kind, info, p1, p2 in segs:
        depth = max(0.0, min(1.0, 1 - (z - 2.0) * fog))
        a = alpha * (0.25 + 0.75 * depth)
        if kind == "bb":
            col = color1 if info == 0 else color2
            col = mix_depth(col, depth)
            w = max(1.5, 0.30 * (p1[3] + p2[3]) / 2)
            c.drawLine(p1[0], p1[1], p2[0], p2[1], paint(col, a, w))
            if glow_on and depth > 0.6:
                c.drawLine(p1[0], p1[1], p2[0], p2[1], paint(lighten(col, 0.5), a * 0.35, w * 0.35))
        else:
            b1, b2 = info
            mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
            w = max(1.0, 0.13 * (p1[3] + p2[3]) / 2)
            c.drawLine(p1[0], p1[1], mx, my, paint(mix_depth(BASE_COLORS[b1], depth), a * 0.9, w))
            c.drawLine(mx, my, p2[0], p2[1], paint(mix_depth(BASE_COLORS[b2], depth), a * 0.9, w))


def mix_depth(col, depth):
    from .draw import mix
    return mix(0xFF20184A, col, 0.35 + 0.65 * depth)


# ---------------------------------------------------------------- RNAポリメラーゼ（クランプ型）
def _pol_paths(s):
    """後ろ（奥）と前（手前）の2つの部品。DNA は間を通る。中心が (0,0)。"""
    back = skia.Path()
    back.moveTo(-150 * s, -10 * s)
    back.cubicTo(-160 * s, -120 * s, -40 * s, -150 * s, 40 * s, -128 * s)
    back.cubicTo(120 * s, -110 * s, 175 * s, -95 * s, 160 * s, -42 * s)
    back.cubicTo(150 * s, -14 * s, 110 * s, -20 * s, 92 * s, -36 * s)   # 上あごの先端（溝）
    back.cubicTo(60 * s, -60 * s, 0 * s, -40 * s, -20 * s, -20 * s)
    back.lineTo(-150 * s, -10 * s)
    back.close()
    front = skia.Path()
    front.moveTo(-158 * s, 0 * s)
    front.cubicTo(-170 * s, 70 * s, -100 * s, 105 * s, 10 * s, 100 * s)
    front.cubicTo(120 * s, 96 * s, 175 * s, 70 * s, 168 * s, 30 * s)
    front.cubicTo(160 * s, 6 * s, 120 * s, 12 * s, 90 * s, 22 * s)      # 下あご
    front.cubicTo(40 * s, 36 * s, -40 * s, 34 * s, -90 * s, 18 * s)
    front.cubicTo(-130 * s, 8 * s, -150 * s, 2 * s, -158 * s, 0 * s)
    front.close()
    return back, front


def polymerase(c, x, y, s=1.0, layer="both", alpha=1.0, color=PAL["pol"], e: Expr | None = None, t=0.0,
               show_face=False, ctd: float = 0.0, ctd_p: int = 0, glow_k=0.0):
    """RNAポリメラーゼ。layer='back' を先に、DNA、'front' を後に描くと DNA が中を通って見える。

    ctd：C末端領域（尾）の長さの割合（0で描かない）。ctd_p：リン酸（P）の数。
    """
    if alpha <= 0.003:
        return
    back, front = _pol_paths(s)
    c.save()
    c.translate(x, y)
    if layer in ("back", "both"):
        if glow_k > 0:
            glow(c, 0, 0, 260 * s, color, 0.45 * glow_k * alpha)
        p = skia.Paint(AntiAlias=True)
        p.setShader(linear_shader(0, -150 * s, 0, 0, [rgba(lighten(color, 0.45), alpha), rgba(darken(color, 0.15), alpha)]))
        c.drawPath(back, p)
        c.drawPath(back, paint(darken(color, 0.45), alpha * 0.8, 3))
        # 上あごのハイライト
        hl = skia.Path()
        hl.moveTo(-110 * s, -95 * s)
        hl.cubicTo(-60 * s, -128 * s, 40 * s, -126 * s, 110 * s, -100 * s)
        c.drawPath(hl, paint(0xFFFFFFFF, alpha * 0.45, 6 * s))
        if ctd > 0:
            _ctd(c, s, ctd, ctd_p, alpha, color, t)
    if layer in ("front", "both"):
        p = skia.Paint(AntiAlias=True)
        p.setShader(linear_shader(0, 0, 0, 105 * s, [rgba(lighten(color, 0.25), alpha), rgba(darken(color, 0.3), alpha)]))
        c.drawPath(front, p)
        c.drawPath(front, paint(darken(color, 0.5), alpha * 0.8, 3))
        if show_face:
            face(c, -60 * s, -88 * s, 1.5 * s, e, t, alpha=alpha)
    c.restore()


def _ctd(c, s, k, n_p, alpha, color, t):
    """CTD（C末端領域）：ポリメラーゼの後ろから伸びる尾。"""
    pts = []
    L = 260 * s * k
    for i in range(41):
        u = i / 40
        pts.append((-140 * s - u * L * 0.75, -40 * s - u * 120 * s + math.sin(u * 5 + t * 2) * 12 * s))
    c.drawPath(path_from(pts, smooth=True), paint(lighten(color, 0.3), alpha, 18 * s))
    c.drawPath(path_from(pts, smooth=True), paint(darken(color, 0.3), alpha * 0.6, 3))
    for j in range(n_p):
        u = 0.35 + j * 0.25
        idx = min(40, int(u * 40))
        px, py = pts[idx]
        circle(c, px, py - 30 * s, 20 * s, PAL["yellow"], alpha)
        circle(c, px, py - 30 * s, 20 * s, 0xFFB08800, alpha, 2.5)
        text_center(c, "P", px, py - 30 * s, 24 * s, 0xFF5A3A00, "heavy", "center", alpha)


# ---------------------------------------------------------------- σ因子
def sigma(c, x, y, s=1.0, alpha=1.0, rot=0.0, e: Expr | None = None, t=0.0, show_face=True):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    p = skia.Path()
    p.moveTo(-60 * s, 30 * s)
    p.cubicTo(-80 * s, -40 * s, -30 * s, -70 * s, 0, -66 * s)
    p.cubicTo(40 * s, -70 * s, 82 * s, -40 * s, 60 * s, 30 * s)
    p.cubicTo(52 * s, 50 * s, 30 * s, 48 * s, 28 * s, 26 * s)
    p.cubicTo(30 * s, -10 * s, 12 * s, -24 * s, 0, -24 * s)
    p.cubicTo(-12 * s, -24 * s, -30 * s, -10 * s, -28 * s, 26 * s)
    p.cubicTo(-30 * s, 48 * s, -52 * s, 50 * s, -60 * s, 30 * s)
    p.close()
    sh = skia.Paint(AntiAlias=True)
    sh.setShader(linear_shader(0, -70 * s, 0, 50 * s, [rgba(lighten(PAL["sigma"], 0.3), alpha), rgba(PAL["sigma_dark"], alpha)]))
    c.drawPath(p, sh)
    c.drawPath(p, paint(darken(PAL["sigma_dark"], 0.3), alpha, 3))
    if show_face:
        face(c, 0, -44 * s, 0.9 * s, e, t, seed=2.0, alpha=alpha)
    c.restore()


# ---------------------------------------------------------------- 一般的なタンパク質の塊
def blob(c, x, y, w, h, color, alpha=1.0, name: str | None = None, name_size=None, rot=0.0, shape="capsule",
         e: Expr | None = None, t=0.0, show_face=False, name_color=0xFF10142E, outline=True):
    """カプセル・楕円・ダンベル形のタンパク質。"""
    if alpha <= 0.003:
        return
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    path = skia.Path()
    if shape == "capsule":
        path.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w / 2, -h / 2, w, h), h / 2, h / 2))
    elif shape == "oval":
        path.addOval(skia.Rect.MakeXYWH(-w / 2, -h / 2, w, h))
    elif shape == "dumbbell":
        r = h / 2
        path.addCircle(-w / 2 + r, 0, r)
        path.addCircle(w / 2 - r, 0, r)
        path.addRect(skia.Rect.MakeXYWH(-w / 2 + r, -h * 0.18, w - 2 * r, h * 0.36))
        path.setFillType(skia.PathFillType.kWinding)
        path = skia.Op(path, skia.Path(), skia.PathOp.kUnion_PathOp) or path
    elif shape == "arch":   # メディエーター（p.34）
        path.moveTo(-w / 2, h / 2)
        path.cubicTo(-w / 2, -h * 0.6, w / 2, -h * 0.6, w / 2, h / 2)
        path.lineTo(w / 2 - h * 0.35, h / 2)
        for i in range(5):  # 下面のでこぼこ
            xx = w / 2 - h * 0.35 - (w - h * 0.7) * (i + 0.5) / 5
            path.quadTo(xx + (w - h * 0.7) / 10, h * 0.05, xx, h / 2 if i % 2 == 0 else h * 0.3)
        path.lineTo(-w / 2, h / 2)
        path.close()
    elif shape == "crescent":
        path.moveTo(-w / 2, h / 2)
        path.cubicTo(-w / 2, -h / 2, w / 2, -h / 2, w / 2, h / 2)
        path.cubicTo(w / 4, 0, -w / 4, 0, -w / 2, h / 2)
        path.close()
    elif shape == "t":     # 転写活性化因子（p.34 の青いT字）
        path.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w / 2, -h / 2, w, h * 0.42), h * 0.2, h * 0.2))
        path.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w * 0.16, -h * 0.2, w * 0.32, h * 0.7), w * 0.1, w * 0.1))
        path.addOval(skia.Rect.MakeXYWH(-w * 0.32, h * 0.2, w * 0.64, h * 0.3))
    sh = skia.Paint(AntiAlias=True)
    sh.setShader(linear_shader(0, -h / 2, 0, h / 2, [rgba(lighten(color, 0.35), alpha), rgba(darken(color, 0.12), alpha)]))
    c.drawPath(path, sh)
    if outline:
        c.drawPath(path, paint(darken(color, 0.45), alpha * 0.9, 3))
    hl = skia.Path()
    hl.addArc(skia.Rect.MakeXYWH(-w / 2 + 10, -h / 2 + 6, w - 20, h * 0.6), 200, 140)
    c.drawPath(hl, paint(0xFFFFFFFF, alpha * 0.35, max(2, h * 0.08)))
    if show_face:
        face(c, -w * 0.18, -h * 0.05, min(w, h) / 70, e, t, alpha=alpha)
    if name:
        ns = name_size or min(h * 0.42, 34)
        text_center(c, name, 0 if not show_face else w * 0.18, 0, ns, name_color, "heavy", "center", alpha)
    c.restore()


def tfiid(c, x, y, s=1.0, alpha=1.0, show_face=False, e=None, t=0.0, labels=True, bend=0.0):
    """TFIID（緑のカプセル）と TBP（下の濃い緑の部分）。"""
    blob(c, x, y, 230 * s, 76 * s, PAL["tfiid"], alpha, None, show_face=show_face, e=e, t=t)
    tbp = skia.Path()
    tbp.addOval(skia.Rect.MakeXYWH(x - 95 * s, y + 4 * s, 90 * s, 40 * s))
    c.save()
    c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 115 * s, y - 38 * s, 230 * s, 76 * s), 38 * s, 38 * s), True)
    c.drawPath(tbp, paint(PAL["tbp"], alpha))
    c.restore()
    if labels:
        text_center(c, "TFIID", x + 40 * s, y - 6 * s, 30 * s, 0xFF0D2A18, "heavy", "center", alpha)
        text_center(c, "TBP", x - 50 * s, y + 22 * s, 22 * s, 0xFFE8FFE8, "heavy", "center", alpha)


# ---------------------------------------------------------------- RNA の鎖
def rna_path(c, pts, color=PAL["rna"], width=9, alpha=1.0, cap=0.0, polya=0, smooth=True, beads=False):
    """点列に沿ったRNA。cap>0 で5'キャップ（m7G）の丸、polya>0 で 3'末端に A の列。"""
    if alpha <= 0.003 or len(pts) < 2:
        return
    path = path_from(pts, smooth=smooth)
    c.drawPath(path, paint(darken(color, 0.4), alpha, width + 4))
    c.drawPath(path, paint(color, alpha, width))
    if beads:
        meas = skia.PathMeasure(path, False)
        L = meas.getLength()
        i = 0.0
        while i < L:
            ok, pos, _tan = meas.getPosTan(i)
            if ok:
                circle(c, pos.x(), pos.y(), width * 0.35, lighten(color, 0.6), alpha * 0.7)
            i += width * 2.2
    if cap > 0:
        x, y = pts[0]
        circle(c, x, y, 18 * cap, PAL["yellow"], alpha)
        circle(c, x, y, 18 * cap, 0xFFB08800, alpha, 3)
        text_center(c, "m7G", x, y - 34, 24, PAL["yellow"], "heavy", "center", alpha * cap, stroke=4)
    if polya > 0:
        (ax, ay), (bx, by) = pts[-2], pts[-1]
        ang = math.atan2(by - ay, bx - ax)
        for i in range(polya):
            px = bx + math.cos(ang) * (16 + i * 22)
            py = by + math.sin(ang) * (16 + i * 22)
            text_center(c, "A", px, py, 24, BASE_COLORS["A"], "heavy", "center", alpha, stroke=4)


# ---------------------------------------------------------------- ヌクレオソーム・クロマチン
def nucleosome(c, x, y, r=40, alpha=1.0, t=0.0, open_k=0.0):
    """ヒストン八量体（円盤）とそれに巻きつくDNA。"""
    radial = skia.Paint(AntiAlias=True)
    radial.setShader(skia.GradientShader.MakeRadial((x - r * 0.3, y - r * 0.3), r * 1.3,
                                                    [rgba(0xFFFFE8D6, alpha), rgba(PAL["histone"], alpha), rgba(0xFFC98E6A, alpha)]))
    c.drawCircle(x, y, r, radial)
    c.drawCircle(x, y, r, paint(0xFF8A5A3E, alpha * 0.7, 2.5))
    wrap = 1.0 - open_k
    for k in range(2):
        rect = skia.Rect.MakeXYWH(x - r * 1.12, y - r * (0.55 + 0.25 * k), r * 2.24, r * (1.1 + 0.5 * k))
        p = skia.Path()
        p.addArc(rect, 200 + k * 10, 300 * wrap)
        c.drawPath(p, paint(PAL["dna"], alpha, max(3, r * 0.16)))


# ---------------------------------------------------------------- snRNP
def snrnp(c, x, y, name, r=46, alpha=1.0, wobble=0.0, t=0.0):
    col = {"U1": PAL["u1"], "U2": PAL["u2"], "U4": PAL["u4"], "U5": PAL["u5"], "U6": PAL["u6"]}[name]
    path = skia.Path()
    n = 18
    for i in range(n + 1):
        a = math.tau * i / n
        rr = r * (1 + 0.08 * math.sin(a * 3 + t * 2 + wobble))
        px, py = x + math.cos(a) * rr * 1.15, y + math.sin(a) * rr * 0.9
        if i == 0:
            path.moveTo(px, py)
        else:
            path.lineTo(px, py)
    path.close()
    sh = skia.Paint(AntiAlias=True)
    sh.setShader(skia.GradientShader.MakeRadial((x - r * 0.3, y - r * 0.3), r * 1.5, [rgba(lighten(col, 0.4), alpha), rgba(col, alpha)]))
    c.drawPath(path, sh)
    c.drawPath(path, paint(darken(col, 0.45), alpha, 3))
    text_center(c, name, x, y, r * 0.62, 0xFF1A1030, "heavy", "center", alpha)


# ---------------------------------------------------------------- リボソーム・tRNA
def ribosome(c, x, y, s=1.0, alpha=1.0):
    big = skia.Path()
    big.addOval(skia.Rect.MakeXYWH(x - 120 * s, y - 120 * s, 240 * s, 150 * s))
    small = skia.Path()
    small.addOval(skia.Rect.MakeXYWH(x - 100 * s, y + 10 * s, 200 * s, 90 * s))
    c.drawPath(big, paint(0xFFB7E37A, alpha))
    c.drawPath(big, paint(0xFF5E8F2A, alpha, 3))
    c.drawPath(small, paint(0xFF6CC24A, alpha))
    c.drawPath(small, paint(0xFF2F6E1E, alpha, 3))


def trna(c, x, y, s=1.0, alpha=1.0, anticodon_glow=0.0):
    """tRNA のクローバー葉構造（模式）。"""
    col = PAL["orange"]
    w = 10 * s
    # 幹
    line(c, x, y - 150 * s, x, y + 20 * s, col, w, alpha)
    text(c, "3'", x + 14 * s, y - 150 * s, 26 * s, PAL["text"], "heavy", alpha=alpha, stroke=3)
    for ang, L, lab in ((180, 95, "DHU"), (0, 95, "TΨC"), (90, 110, "アンチコドン")):
        a = math.radians(ang)
        ex, ey = x + math.cos(a) * L * s, y + math.sin(a) * L * s
        line(c, x, y, ex, ey, col, w, alpha)
        circle(c, ex + math.cos(a) * 34 * s, ey + math.sin(a) * 34 * s, 34 * s, col, alpha, w * 0.8)
        if lab == "アンチコドン":
            gx, gy = ex + math.cos(a) * 34 * s, ey + math.sin(a) * 34 * s + 30 * s
            if anticodon_glow > 0:
                glow(c, gx, gy, 70 * s, PAL["yellow"], anticodon_glow * alpha)
            for j in range(3):
                circle(c, gx - 22 * s + j * 22 * s, gy, 10 * s, 0xFF404040, alpha)
    circle(c, x, y, 14 * s, col, alpha)


# ---------------------------------------------------------------- 細胞・核・細菌・ミトコンドリア
def bacterium(c, x, y, w, h, alpha=1.0, t=0.0):
    p = skia.Path()
    p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - w / 2, y - h / 2, w, h), h / 2, h / 2))
    sh = skia.Paint(AntiAlias=True)
    sh.setShader(skia.GradientShader.MakeRadial((x, y), w * 0.6, [rgba(0xFF2A6B66, alpha), rgba(0xFF123A42, alpha)]))
    c.drawPath(p, sh)
    c.drawPath(p, paint(0xFF7DF2D2, alpha, 6))
    c.drawPath(p, paint(0xFF2FB09A, alpha * 0.6, 14, blur=8))


def mitochondrion(c, x, y, w, h, alpha=1.0, t=0.0):
    p = skia.Path()
    p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - w / 2, y - h / 2, w, h), h / 2, h / 2))
    sh = skia.Paint(AntiAlias=True)
    sh.setShader(skia.GradientShader.MakeRadial((x, y), w * 0.6, [rgba(0xFFFFB27A, alpha), rgba(0xFFC2552E, alpha)]))
    c.drawPath(p, sh)
    c.drawPath(p, paint(0xFF7A2A10, alpha, 5))
    # クリステ
    c.save()
    c.clipPath(p, skia.ClipOp.kIntersect, True)
    for i in range(7):
        xx = x - w / 2 + w * (i + 0.7) / 7.4
        q = skia.Path()
        top = (i % 2 == 0)
        y0 = y - h / 2 if top else y + h / 2
        q.moveTo(xx - 18, y0)
        q.cubicTo(xx - 18, y + (0.15 if top else -0.15) * h, xx + 18, y + (0.15 if top else -0.15) * h, xx + 18, y0)
        c.drawPath(q, paint(0xFFFFD9B8, alpha * 0.9, 6))
    c.restore()


# ---------------------------------------------------------------- 任意の曲線に沿った二本鎖DNA
def resample(pts, step):
    """折れ線を等間隔の点列にする。"""
    out = [pts[0]]
    acc = 0.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0)
        if L == 0:
            continue
        d = step - acc
        while d <= L:
            out.append((x0 + (x1 - x0) * d / L, y0 + (y1 - y0) * d / L))
            d += step
        acc = L - (d - step)
    return out


def ladder_path(c, pts, gap=56, alpha=1.0, step=26, color_top=PAL["dna"], color_bot=PAL["dna2"], width=6,
                bubble: tuple[float, float, float] | None = None, rung_color=0xFFCCC4FF, rung_alpha=0.75):
    """点列 pts に沿った二本鎖（模式）。bubble=(開始割合, 終了割合, 開き具合)。"""
    if alpha <= 0.003 or len(pts) < 2:
        return
    P = resample(pts, 4.0)
    n = len(P)
    tops, bots = [], []
    for i, (x, y) in enumerate(P):
        a = P[max(0, i - 1)]
        b = P[min(n - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        o = 0.0
        if bubble:
            u = i / (n - 1)
            u0, u1, k = bubble
            if u0 < u < u1:
                o = k * math.sin(math.pi * (u - u0) / (u1 - u0)) ** 0.6
        h = gap / 2 * (1 + o * 0.9)
        tops.append((x + nx * h, y + ny * h))
        bots.append((x - nx * h, y - ny * h))
    every = max(1, int(step / 4.0))
    for i in range(0, n, every):
        if bubble:
            u = i / (n - 1)
            u0, u1, k = bubble
            if u0 < u < u1 and k > 0.1:
                for (sx, sy), (ex, ey) in ((tops[i], P[i]), (bots[i], P[i])):
                    c.drawLine(sx, sy, sx + (ex - sx) * 0.35, sy + (ey - sy) * 0.35, paint(rung_color, alpha * rung_alpha, 3))
                continue
        c.drawLine(tops[i][0], tops[i][1], bots[i][0], bots[i][1], paint(rung_color, alpha * rung_alpha, 3))
    c.drawPath(path_from(tops), paint(color_top, alpha, width))
    c.drawPath(path_from(bots), paint(color_bot, alpha, width))
