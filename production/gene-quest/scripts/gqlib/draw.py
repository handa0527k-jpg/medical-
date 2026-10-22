"""描画の基本部品（skia）。色・文字・図形・矢印・ラベル・イージング。

座標系は 1920×1080（フルHD）。低解像度プレビューでは canvas 側を縮小するだけで、ここの座標は変えない。
"""
from __future__ import annotations

import math
from functools import lru_cache

import skia

from .paths import FONTS

W, H = 1920, 1080

# ---------------------------------------------------------------- 色（作品全体で共通）
PAL = {
    "night0": 0xFF070A1F, "night1": 0xFF14103A, "night2": 0xFF241A5C,
    "dna": 0xFFA78BFF, "dna2": 0xFF7C5CF0, "dna_dark": 0xFF4B2FB0,
    "rna": 0xFF2EE6C9, "rna_dark": 0xFF139C8A,
    "pol": 0xFF7FB4FF, "pol_dark": 0xFF2F5FBF, "pol_light": 0xFFD6E8FF,
    "sigma": 0xFFFF8A66, "sigma_dark": 0xFFC2462A,
    "tfiid": 0xFF7FD69A, "tbp": 0xFF2E9E5B, "tfiib": 0xFF9C6644, "tfiie": 0xFFE0A93B,
    "tfiih": 0xFFFF9E8F, "tfiif": 0xFFF29B38, "mediator": 0xFFA98BD6, "activator": 0xFF3FA4FF,
    "remodel": 0xFF2F8F57, "histmod": 0xFFFFE07A, "histone": 0xFFF2C7A5,
    "warm": 0xFFFFB347, "cool": 0xFF6FA8FF,
    "white": 0xFFFFFFFF, "ink": 0xFF0D1030, "text": 0xFFF4F1FF, "muted": 0xFFB9B3DD,
    "red": 0xFFFF5D73, "yellow": 0xFFFFD95E, "green": 0xFF6BE38E, "blue": 0xFF62B6FF, "orange": 0xFFFFA552,
    "exon1": 0xFFFF6B81, "exon2": 0xFF5EC8FF, "exon3": 0xFFFFD45E, "exon4": 0xFF6BE38E, "intron": 0xFFB8B4CC,
    "u1": 0xFF58D36A, "u2": 0xFFFFD84D, "u4": 0xFFFFB13D, "u5": 0xFFE7A6FF, "u6": 0xFF7FE0F5,
    "mirna": 0xFF7FE7F5, "akari": 0xFFFFB8C8, "nuku": 0xFF9FF5DA,
}
BASE_COLORS = {"A": 0xFFFF7A7A, "T": 0xFFFFD45E, "G": 0xFF6BE38E, "C": 0xFF62B6FF, "U": 0xFFFFA552}


def rgba(c: int, a: float = 1.0) -> int:
    """0xAARRGGBB の不透明度に a を掛ける。"""
    base = (c >> 24) & 0xFF
    return (int(max(0, min(1, a)) * base) << 24) | (c & 0xFFFFFF)


def mix(c1: int, c2: int, k: float) -> int:
    k = max(0.0, min(1.0, k))
    out = 0
    for sh in (24, 16, 8, 0):
        a, b = (c1 >> sh) & 0xFF, (c2 >> sh) & 0xFF
        out |= int(a + (b - a) * k) << sh
    return out


def lighten(c: int, k: float) -> int:
    return mix(c, 0xFFFFFFFF | (c & 0xFF000000), k)


def darken(c: int, k: float) -> int:
    return mix(c, 0xFF000000 | (c & 0xFF000000), k)


# ---------------------------------------------------------------- 時間とイージング
def clamp(x: float, a: float = 0.0, b: float = 1.0) -> float:
    return a if x < a else b if x > b else x


def lerp(a: float, b: float, k: float) -> float:
    return a + (b - a) * k


def prog(t: float, a: float, dur: float) -> float:
    """時刻 a から dur 秒かけて 0→1。"""
    if dur <= 0:
        return 1.0 if t >= a else 0.0
    return clamp((t - a) / dur)


def ease(x: float) -> float:
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x: float) -> float:
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x: float) -> float:
    x = clamp(x)
    return x ** 3


def ease_back(x: float) -> float:
    x = clamp(x)
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def pulse(t: float, speed: float = 1.0) -> float:
    return 0.5 + 0.5 * math.sin(t * math.tau * speed)


def fade_window(t: float, a: float, b: float, fin: float = 0.4, fout: float = 0.4) -> float:
    """[a, b] の間だけ表示（前後にフェード）。"""
    return clamp((t - a) / fin if fin > 0 else 1) * clamp((b - t) / fout if fout > 0 else 1)


# ---------------------------------------------------------------- 文字
@lru_cache(maxsize=None)
def typeface(weight: str = "bold") -> skia.Typeface:
    f = {"medium": "MPLUSRounded1c-Medium.ttf", "bold": "MPLUSRounded1c-Bold.ttf",
         "heavy": "MPLUSRounded1c-ExtraBold.ttf", "gothic": "ZenKakuGothicNew-Bold.ttf"}[weight]
    return skia.Typeface.MakeFromFile(str(FONTS / f))


@lru_cache(maxsize=4096)
def font(size: float, weight: str = "bold") -> skia.Font:
    f = skia.Font(typeface(weight), size)
    f.setEdging(skia.Font.Edging.kAntiAlias)
    f.setSubpixel(True)
    return f


def text_width(s: str, size: float, weight: str = "bold") -> float:
    return font(size, weight).measureText(s)


def text(c: skia.Canvas, s: str, x: float, y: float, size: float = 40, color: int = PAL["text"],
         weight: str = "bold", align: str = "left", alpha: float = 1.0, stroke: float = 0.0,
         stroke_color: int = 0xFF0B0A24, shadow: bool = False, glow: int | None = None) -> float:
    """y はベースライン。幅を返す。"""
    if alpha <= 0.003:
        return 0.0
    f = font(size, weight)
    w = f.measureText(s)
    if align == "center":
        x -= w / 2
    elif align == "right":
        x -= w
    blob = skia.TextBlob.MakeFromString(s, f)
    if blob is None:
        return w
    if glow is not None:
        p = skia.Paint(AntiAlias=True, Color=rgba(glow, 0.8 * alpha),
                       MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, size * 0.18))
        c.drawTextBlob(blob, x, y, p)
    if shadow:
        p = skia.Paint(AntiAlias=True, Color=rgba(0xFF000000, 0.55 * alpha),
                       MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, size * 0.08))
        c.drawTextBlob(blob, x + size * 0.04, y + size * 0.06, p)
    if stroke > 0:
        p = skia.Paint(AntiAlias=True, Color=rgba(stroke_color, alpha), Style=skia.Paint.kStroke_Style,
                       StrokeWidth=stroke, StrokeJoin=skia.Paint.kRound_Join)
        c.drawTextBlob(blob, x, y, p)
    c.drawTextBlob(blob, x, y, skia.Paint(AntiAlias=True, Color=rgba(color, alpha)))
    return w


def text_center(c, s, x, y_center, size=40, *args, **kw):
    """縦方向の中心を y_center に合わせる（引数は text と同じ）。"""
    return text(c, s, x, y_center + size * 0.36, size, *args, **kw)


# ---------------------------------------------------------------- 図形
def paint(color: int, alpha: float = 1.0, stroke: float = 0.0, blur: float = 0.0, cap_round=True) -> skia.Paint:
    p = skia.Paint(AntiAlias=True, Color=rgba(color, alpha))
    if stroke > 0:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        if cap_round:
            p.setStrokeCap(skia.Paint.kRound_Cap)
            p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur > 0:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return p


def rrect(c, x, y, w, h, r, color, alpha=1.0, stroke=0.0, blur=0.0):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), paint(color, alpha, stroke, blur))


def circle(c, x, y, r, color, alpha=1.0, stroke=0.0, blur=0.0):
    c.drawCircle(x, y, r, paint(color, alpha, stroke, blur))


def line(c, x1, y1, x2, y2, color, width=3.0, alpha=1.0, dash: tuple | None = None):
    p = paint(color, alpha, width)
    if dash:
        p.setPathEffect(skia.DashPathEffect.Make(list(dash), 0))
    c.drawLine(x1, y1, x2, y2, p)


def glow(c, x, y, r, color, alpha=1.0):
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial((x, y), max(1, r), [rgba(color, alpha), rgba(color, 0)]))
    c.drawCircle(x, y, r, p)


def radial_fill(c, x, y, r, inner, outer, cx=None, cy=None):
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial((cx if cx is not None else x, cy if cy is not None else y), r, [inner, outer]))
    c.drawCircle(x, y, r, p)


def linear_shader(x0, y0, x1, y1, colors, pos=None):
    return skia.GradientShader.MakeLinear([(x0, y0), (x1, y1)], colors, pos)


def path_from(points, closed=False, smooth=False) -> skia.Path:
    p = skia.Path()
    if not points:
        return p
    p.moveTo(*points[0])
    if smooth and len(points) > 2:
        for i in range(1, len(points) - 1):
            mx = (points[i][0] + points[i + 1][0]) / 2
            my = (points[i][1] + points[i + 1][1]) / 2
            p.quadTo(points[i][0], points[i][1], mx, my)
        p.lineTo(*points[-1])
    else:
        for pt in points[1:]:
            p.lineTo(*pt)
    if closed:
        p.close()
    return p


def arrow(c, x1, y1, x2, y2, color, width=5.0, alpha=1.0, head=18.0, curve=0.0, dash=None, progress=1.0):
    """直線または曲線の矢印。progress で根元から伸ばす。"""
    if alpha <= 0 or progress <= 0:
        return
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    cx, cy = mx - dy / L * curve, my + dx / L * curve
    pts = []
    n = 40
    for i in range(int(n * progress) + 1):
        u = i / n
        px = (1 - u) ** 2 * x1 + 2 * (1 - u) * u * cx + u * u * x2
        py = (1 - u) ** 2 * y1 + 2 * (1 - u) * u * cy + u * u * y2
        pts.append((px, py))
    if len(pts) < 2:
        return
    p = paint(color, alpha, width)
    if dash:
        p.setPathEffect(skia.DashPathEffect.Make(list(dash), 0))
    c.drawPath(path_from(pts), p)
    (ax, ay), (bx, by) = pts[-2], pts[-1]
    ang = math.atan2(by - ay, bx - ax)
    hp = skia.Path()
    hp.moveTo(bx + math.cos(ang) * head * 0.35, by + math.sin(ang) * head * 0.35)
    hp.lineTo(bx + math.cos(ang + 2.6) * head, by + math.sin(ang + 2.6) * head)
    hp.lineTo(bx + math.cos(ang - 2.6) * head, by + math.sin(ang - 2.6) * head)
    hp.close()
    c.drawPath(hp, paint(color, alpha))


def inhibit(c, x1, y1, x2, y2, color, width=5.0, alpha=1.0, curve=0.0, progress=1.0):
    """抑制を表す ⊣ 型の線。"""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    cx, cy = mx - dy / L * curve, my + dx / L * curve
    pts = []
    n = 40
    for i in range(int(n * progress) + 1):
        u = i / n
        pts.append(((1 - u) ** 2 * x1 + 2 * (1 - u) * u * cx + u * u * x2, (1 - u) ** 2 * y1 + 2 * (1 - u) * u * cy + u * u * y2))
    if len(pts) < 2:
        return
    c.drawPath(path_from(pts), paint(color, alpha, width))
    if progress >= 0.99:
        (ax, ay), (bx, by) = pts[-2], pts[-1]
        ang = math.atan2(by - ay, bx - ax) + math.pi / 2
        hl = 18
        line(c, bx - math.cos(ang) * hl, by - math.sin(ang) * hl, bx + math.cos(ang) * hl, by + math.sin(ang) * hl, color, width + 1, alpha)


def label(c, s, x, y, size=34, color=PAL["text"], bg=0xFF15123A, alpha=1.0, align="center",
          border: int | None = None, pad=14, weight="bold", tx=None, ty=None, pointer_color=None):
    """角丸の札にした名称ラベル。(tx, ty) を渡すと引き出し線を引く。"""
    if alpha <= 0.003:
        return
    w = text_width(s, size, weight) + pad * 2
    h = size * 1.45
    if align == "center":
        x0 = x - w / 2
    elif align == "right":
        x0 = x - w
    else:
        x0 = x
    y0 = y - h / 2
    if tx is not None:
        line(c, x0 + w / 2 if align == "center" else (x0 + w if align == "right" else x0), y, tx, ty,
             pointer_color or border or color, 3, alpha * 0.9)
        circle(c, tx, ty, 6, pointer_color or border or color, alpha)
    rrect(c, x0 + 3, y0 + 5, w, h, h / 2.6, 0xFF000000, alpha * 0.35, blur=6)
    rrect(c, x0, y0, w, h, h / 2.6, bg, alpha * 0.92)
    if border is not None:
        rrect(c, x0, y0, w, h, h / 2.6, border, alpha, stroke=3)
    text(c, s, x0 + pad, y0 + h / 2 + size * 0.36, size, color, weight, alpha=alpha)
    return w, h


def panel(c, x, y, w, h, alpha=1.0, color=0xFF120F35, border=0xFF6E5CC8, r=28):
    rrect(c, x + 6, y + 10, w, h, r, 0xFF000000, alpha * 0.35, blur=14)
    rrect(c, x, y, w, h, r, color, alpha * 0.86)
    rrect(c, x, y, w, h, r, border, alpha * 0.9, stroke=3)


def vignette(c, strength=0.65):
    p = skia.Paint()
    p.setShader(skia.GradientShader.MakeRadial((W / 2, H / 2), W * 0.72, [0x00000000, rgba(0xFF000000, strength)], [0.55, 1.0]))
    c.drawRect(skia.Rect(0, 0, W, H), p)


def hash01(i: int, salt: int = 0) -> float:
    """決定的な疑似乱数（フレームごとに同じ値）。"""
    x = (i * 374761393 + salt * 668265263) & 0xFFFFFFFF
    x = (x ^ (x >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((x ^ (x >> 16)) & 0xFFFFFF) / 0xFFFFFF
