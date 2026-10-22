"""背景。静的な部分は1回だけ描いて画像として使い回し、動く粒子だけを毎フレーム描く。"""
from __future__ import annotations

import math

import skia

from .draw import H, PAL, W, circle, glow, hash01, linear_shader, paint, rgba, vignette

_CACHE: dict[str, skia.Image] = {}

THEMES = {
    # 名前: (上の色, 下の色, ぼかした塊の色, 粒子の色)
    "nucleus": (0xFF080B26, 0xFF22155A, [0xFF3B2A8F, 0xFF5B2E8F, 0xFF1E3F8F], 0xFFB9A8FF),
    "bacteria": (0xFF04161C, 0xFF0F3A3F, [0xFF1D5E5A, 0xFF235F44, 0xFF14404F], 0xFF9FF5DA),
    "workshop": (0xFF120A26, 0xFF3A1A4A, [0xFF6A2E6B, 0xFF4A2A80, 0xFF7A3A40], 0xFFFFC9A8),
    "cytoplasm": (0xFF071322, 0xFF1A2A55, [0xFF1F4F7A, 0xFF3A2E7A, 0xFF1F6A6A], 0xFF9FE8FF),
    "mito": (0xFF1A0A10, 0xFF4A1A22, [0xFF8A3A2A, 0xFF6A2A40, 0xFF8A5A2A], 0xFFFFC08A),
    "somber": (0xFF070A18, 0xFF1A2038, [0xFF2A3A5A, 0xFF30305A, 0xFF203A4A], 0xFFA8C0E8),
    "quiz": (0xFF0A0820, 0xFF1C1440, [0xFF3A2A7A, 0xFF2A3A7A, 0xFF4A2A6A], 0xFFFFE08A),
    "black": (0xFF000000, 0xFF05040F, [0xFF0A0820, 0xFF100A28, 0xFF080A20], 0xFF8A80C0),
}


def _static(name: str) -> skia.Image:
    if name in _CACHE:
        return _CACHE[name]
    top, bot, blobs, _ = THEMES[name]
    surf = skia.Surface(W, H)
    c = surf.getCanvas()
    p = skia.Paint()
    p.setShader(linear_shader(0, 0, W * 0.3, H, [top, bot]))
    c.drawRect(skia.Rect(0, 0, W, H), p)
    for i in range(14):
        x = hash01(i, 11) * W
        y = hash01(i, 12) * H
        r = 180 + hash01(i, 13) * 380
        glow(c, x, y, r, blobs[i % len(blobs)], 0.35 + 0.25 * hash01(i, 14))
    # 遠景の糸（クロマチン・細胞骨格のイメージ）
    for k in range(7):
        pts = skia.Path()
        y0 = hash01(k, 21) * H
        amp = 40 + hash01(k, 22) * 90
        ph = hash01(k, 23) * 6
        pts.moveTo(-50, y0)
        for x in range(-50, W + 60, 30):
            pts.lineTo(x, y0 + math.sin(x / (160 + 90 * hash01(k, 24)) + ph) * amp)
        c.drawPath(pts, paint(blobs[k % len(blobs)], 0.35, 10 + 14 * hash01(k, 25), blur=10))
    vignette(c, 0.55)
    img = surf.makeImageSnapshot()
    _CACHE[name] = img
    return img


def background(c: skia.Canvas, name: str, t: float, drift: float = 1.0, particles: int = 70, cam_x: float = 0.0):
    """背景を描く。cam_x でわずかに横へずらす（パララックス）。"""
    c.save()
    c.translate(-cam_x * 0.05 % 1, 0)
    c.drawImage(_static(name), 0, 0)
    c.restore()
    pc = THEMES[name][3]
    for i in range(particles):
        depth = 0.3 + 0.7 * hash01(i, 31)
        x = (hash01(i, 32) * (W + 200) - t * 14 * depth * drift - cam_x * depth * 0.3) % (W + 200) - 100
        y = (hash01(i, 33) * H + math.sin(t * 0.4 + i) * 18 * depth) % H
        r = 1.5 + depth * 4.5
        a = (0.18 + 0.45 * depth) * (0.6 + 0.4 * math.sin(t * 1.3 + i * 1.7))
        if depth > 0.85:
            glow(c, x, y, r * 4, pc, a * 0.5)
        circle(c, x, y, r, pc, a)


def lab_background(c: skia.Canvas, t: float, dawn: float = 0.0):
    """夜（dawn=0）〜夜明け（dawn=1）の研究室。窓、机、顕微鏡のシルエット。"""
    from .draw import mix
    top = mix(0xFF0B0E2A, 0xFF3A3F7A, dawn)
    bot = mix(0xFF1A1440, 0xFFFFB27A, dawn * 0.7)
    p = skia.Paint()
    p.setShader(linear_shader(0, 0, 0, H, [top, bot]))
    c.drawRect(skia.Rect(0, 0, W, H), p)
    # 窓
    wx, wy, ww, wh = 1120, 120, 640, 520
    c.drawRect(skia.Rect.MakeXYWH(wx, wy, ww, wh), paint(mix(0xFF141C4A, 0xFFFFC78A, dawn * 0.8)))
    sky = skia.Paint()
    sky.setShader(linear_shader(0, wy, 0, wy + wh, [mix(0xFF0A1035, 0xFF6A7AD0, dawn), mix(0xFF1A1A50, 0xFFFFC08A, dawn)]))
    c.drawRect(skia.Rect.MakeXYWH(wx + 14, wy + 14, ww - 28, wh - 28), sky)
    # 月 / 朝日
    glow(c, wx + ww * 0.72, wy + wh * (0.3 + 0.5 * dawn), 160, mix(0xFFE8E8FF, 0xFFFFE0A0, dawn), 0.6)
    circle(c, wx + ww * 0.72, wy + wh * (0.3 + 0.5 * dawn), 46, mix(0xFFF0F0FF, 0xFFFFE6B0, dawn))
    for i in range(30):
        circle(c, wx + 30 + hash01(i, 41) * (ww - 60), wy + 30 + hash01(i, 42) * (wh * 0.6), 1.5 + hash01(i, 43) * 1.5,
               0xFFFFFFFF, (1 - dawn) * (0.4 + 0.5 * math.sin(t * 2 + i)))
    c.drawRect(skia.Rect.MakeXYWH(wx + ww / 2 - 7, wy, 14, wh), paint(mix(0xFF20264A, 0xFF8A6A5A, dawn)))
    c.drawRect(skia.Rect.MakeXYWH(wx, wy + wh / 2 - 7, ww, 14), paint(mix(0xFF20264A, 0xFF8A6A5A, dawn)))
    # 本棚
    for i in range(9):
        x = 80 + i * 42
        h = 160 + hash01(i, 51) * 70
        c.drawRect(skia.Rect.MakeXYWH(x, 560 - h, 34, h), paint(mix(0xFF2A2350, 0xFF6A4A6A, dawn), 0.9))
    c.drawRect(skia.Rect.MakeXYWH(60, 560, 440, 16), paint(mix(0xFF1A1636, 0xFF5A3A4A, dawn)))
    # 机
    c.drawRect(skia.Rect.MakeXYWH(0, 760, W, 320), paint(mix(0xFF141030, 0xFF5A3A40, dawn)))
    c.drawRect(skia.Rect.MakeXYWH(0, 750, W, 18), paint(mix(0xFF2A2250, 0xFF8A5A50, dawn)))
    # 顕微鏡
    mx, my = 860, 750
    col = mix(0xFF2E3A6A, 0xFF7A6A8A, dawn)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(mx - 110, my - 30, 220, 30), 10, 10), paint(col))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(mx + 40, my - 290, 46, 270), 20, 20), paint(col))
    arm = skia.Path()
    arm.moveTo(mx + 60, my - 280)
    arm.lineTo(mx - 40, my - 330)
    arm.lineTo(mx - 70, my - 290)
    arm.lineTo(mx + 40, my - 230)
    arm.close()
    c.drawPath(arm, paint(col))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(mx - 90, my - 400, 40, 120), 12, 12), paint(lighten_safe(col)))
    c.drawRect(skia.Rect.MakeXYWH(mx - 100, my - 140, 170, 14), paint(lighten_safe(col)))
    glow(c, mx - 15, my - 125, 120, 0xFF9FF5DA, 0.25 + 0.1 * math.sin(t * 3))
    # ノート
    c.save()
    c.translate(1300, 820)
    c.rotate(-8)
    c.drawRect(skia.Rect.MakeXYWH(0, 0, 300, 190), paint(mix(0xFFCFCDE8, 0xFFFFF0E0, dawn), 0.9))
    for i in range(6):
        c.drawLine(20, 30 + i * 26, 270, 30 + i * 26, paint(0xFF8A88B0, 0.6, 2))
    c.restore()
    vignette(c, 0.5)


def lighten_safe(col):
    from .draw import lighten
    return lighten(col, 0.25)


def dim(c: skia.Canvas, a: float, color: int = 0xFF000000):
    if a > 0:
        c.drawRect(skia.Rect(0, 0, W, H), paint(color, a))


__all__ = ["background", "lab_background", "dim", "PAL", "rgba"]
