"""キャラクターの描画（アカリ・ヌク）。外見の定義は characters/character_bible.md と一致させる。

どの場面でも同じ関数で描くので、外見・配色は全編で変わらない。
表情は Expr で指定し、口の開きは音声の音量包絡（timeline の env）から与える。
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import skia

from .draw import PAL, circle, glow, paint, path_from, rgba

# アカリの配色
SKIN = 0xFFFFE3D2
SKIN_SH = 0xFFF2BFA8
HAIR = 0xFF2A2145
HAIR_HI = 0xFF5B4A8F
HAIR_DARK = 0xFF17122B
IRIS_TOP = 0xFF7A3B12
IRIS_BOT = 0xFFFFB45C
COAT = 0xFFF7F8FF
COAT_SH = 0xFFC9CCE6
SHIRT = 0xFF2BB5A3
TIE = 0xFFFF6F8A
LINE = 0xFF3A2440

# ヌクの配色
NUKU_IN = 0xFFD8FFF3
NUKU_MID = 0xFF6FF0C8
NUKU_OUT = 0xFF1FB58C
NUKU_EYE = 0xFF0E3B31


@dataclass
class Expr:
    """表情。値は 0〜1 程度。"""
    eye_open: float = 1.0      # 目の開き（まばたきで 0）
    smile_eyes: float = 0.0    # 目を細めて笑う（^ ^）
    brow: float = 0.0          # 眉を上げる（+）下げる（−）
    brow_tilt: float = 0.0     # 眉の内側を上げる（困り顔 +）、下げる（怒り −）
    mouth_open: float = 0.0    # 口の開き（音声で動かす）
    mouth_smile: float = 0.3   # 口角
    mouth_o: float = 0.0       # 「お」の口（驚き）
    blush: float = 0.25
    sweat: float = 0.0
    sparkle: float = 0.0       # 目の輝き
    look_x: float = 0.0        # 視線（−1 左 … +1 右）
    look_y: float = 0.0


EXPRESSIONS = {
    "neutral": Expr(),
    "happy": Expr(smile_eyes=0.85, mouth_smile=1.0, blush=0.5, brow=0.15),
    "surprise": Expr(eye_open=1.18, brow=0.9, mouth_o=0.8, mouth_smile=0.0, blush=0.2, sparkle=0.4),
    "think": Expr(brow=-0.1, brow_tilt=0.35, mouth_smile=0.0, look_x=0.5, look_y=-0.5),
    "worried": Expr(brow_tilt=0.8, brow=0.1, mouth_smile=-0.4, sweat=0.8),
    "sad": Expr(brow_tilt=0.9, eye_open=0.8, mouth_smile=-0.6, blush=0.1),
    "fear": Expr(eye_open=1.2, brow=0.7, brow_tilt=0.8, mouth_o=0.6, mouth_smile=-0.3, sweat=1.0),
    "determined": Expr(brow=-0.15, brow_tilt=-0.4, mouth_smile=0.6, sparkle=0.6),
    "excited": Expr(eye_open=1.1, brow=0.5, mouth_smile=1.0, blush=0.6, sparkle=1.0),
}
# 原稿の感情スタイル → 表情
EMO_TO_EXPR = {"Neutral": "neutral", "Happy": "happy", "Surprise": "surprise", "Fear": "fear", "Sad": "sad",
               "Angry": "determined", "Disgust": "worried"}


def blend_expr(a: Expr, b: Expr, k: float) -> Expr:
    k = max(0.0, min(1.0, k))
    return Expr(**{f: getattr(a, f) + (getattr(b, f) - getattr(a, f)) * k for f in a.__dataclass_fields__})


def blink(t: float, seed: float = 0.0) -> float:
    """3〜4秒に1回まばたき（0.12秒）。返り値は目の開き 0〜1。"""
    period = 3.4 + 0.9 * math.sin(seed * 7.1)
    ph = (t + seed * 1.7) % period
    if ph < 0.12:
        return abs(ph - 0.06) / 0.06
    return 1.0


# =====================================================================  アカリ
def akari(c: skia.Canvas, x: float, y: float, s: float = 1.0, e: Expr | None = None, t: float = 0.0,
          tilt: float = 0.0, alpha: float = 1.0, flip: bool = False, coat=True):
    """アカリの胸像。(x, y) は胸の下端中央、s は拡大率（1.0 で高さ約 560px）。"""
    e = e or Expr()
    if alpha <= 0.003:
        return
    c.save()
    c.translate(x, y)
    if flip:
        c.scale(-1, 1)
    c.scale(s, s)
    breath = math.sin(t * 2.2) * 2.5
    if alpha < 1:
        c.saveLayerAlpha(None, int(255 * alpha))
    # ---- 体（白衣）
    c.save()
    c.translate(0, breath * 0.3)
    _akari_body(c, coat)
    c.restore()
    # ---- 頭（首を支点に傾ける）
    c.save()
    c.translate(0, -300 + breath)
    c.rotate(tilt)
    _akari_head(c, e, t)
    c.restore()
    if alpha < 1:
        c.restore()
    c.restore()


def _akari_body(c, coat=True):
    # 首
    neck = path_from([(-34, -330), (34, -330), (40, -250), (-40, -250)], closed=True)
    c.drawPath(neck, paint(SKIN))
    c.drawPath(path_from([(-34, -300), (34, -300), (38, -262), (-38, -262)], closed=True), paint(SKIN_SH, 0.8))
    # 肩と胴
    body = skia.Path()
    body.moveTo(-200, 0)
    body.cubicTo(-205, -120, -190, -200, -120, -238)
    body.quadTo(-70, -262, -38, -262)
    body.lineTo(38, -262)
    body.quadTo(70, -262, 120, -238)
    body.cubicTo(190, -200, 205, -120, 200, 0)
    body.close()
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeLinear([(0, -260), (0, 0)], [COAT if coat else SHIRT, COAT_SH if coat else 0xFF1E8F80]))
    c.drawPath(body, p)
    c.drawPath(body, paint(LINE, 0.55, 3))
    if coat:
        # シャツとリボン
        shirt = path_from([(-46, -262), (46, -262), (16, -120), (-16, -120)], closed=True)
        c.drawPath(shirt, paint(SHIRT))
        rib = skia.Path()
        rib.moveTo(0, -238)
        rib.lineTo(-30, -255)
        rib.lineTo(-26, -218)
        rib.close()
        rib.moveTo(0, -238)
        rib.lineTo(30, -255)
        rib.lineTo(26, -218)
        rib.close()
        c.drawPath(rib, paint(TIE))
        circle(c, 0, -238, 7, 0xFFE0496A)
        # 襟（ラペル）
        for sgn in (-1, 1):
            lap = path_from([(sgn * 46, -264), (sgn * 96, -246), (sgn * 30, -90), (sgn * 14, -120)], closed=True)
            c.drawPath(lap, paint(0xFFFFFFFF))
            c.drawPath(lap, paint(LINE, 0.45, 2.5))
        # 胸ポケットと名札（DNAマーク）
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(70, -170, 70, 46), 6, 6), paint(0xFFE9EBFA))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(70, -170, 70, 46), 6, 6), paint(LINE, 0.4, 2))
        for i in range(5):
            yy = -160 + i * 7
            xx = 105 + math.sin(i * 1.3) * 12
            circle(c, xx, yy, 3, PAL["dna2"])
            circle(c, 210 - xx, yy, 3, PAL["rna"])
        # ペン
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-130, -182, 10, 52), 4, 4), paint(0xFF5B8CFF))


def _akari_head(c, e: Expr, t: float):
    # 後ろ髪
    back = skia.Path()
    back.moveTo(-150, -40)
    back.cubicTo(-175, -180, -110, -300, 0, -300)
    back.cubicTo(110, -300, 175, -180, 150, -40)
    back.cubicTo(140, 10, 110, 30, 90, 20)
    back.lineTo(-90, 20)
    back.cubicTo(-110, 30, -140, 10, -150, -40)
    back.close()
    c.drawPath(back, paint(HAIR_DARK))
    # 顔
    face = skia.Path()
    face.moveTo(-118, -170)
    face.cubicTo(-122, -90, -105, -30, -60, 8)
    face.quadTo(-22, 38, 0, 40)
    face.quadTo(22, 38, 60, 8)
    face.cubicTo(105, -30, 122, -90, 118, -170)
    face.cubicTo(110, -250, -110, -250, -118, -170)
    face.close()
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeLinear([(0, -220), (0, 40)], [0xFFFFEDE2, SKIN]))
    c.drawPath(face, p)
    c.drawPath(face, paint(LINE, 0.35, 2.2))
    # 耳
    for sgn in (-1, 1):
        ear = skia.Path()
        ear.addOval(skia.Rect.MakeXYWH(sgn * 118 - 14, -120, 28, 46))
        c.drawPath(ear, paint(SKIN_SH))
    # 頬の赤み
    if e.blush > 0:
        for sgn in (-1, 1):
            c.drawOval(skia.Rect.MakeXYWH(sgn * 66 - 26, -62, 52, 22), paint(0xFFFF8FA3, 0.45 * e.blush, blur=7))
    _akari_eyes(c, e, t)
    _akari_mouth(c, e)
    # 鼻
    c.drawPath(path_from([(4, -78), (0, -64), (6, -62)]), paint(0xFFD99A8A, 0.9, 2.2))
    # 前髪
    _akari_bangs(c, t)
    # 汗
    if e.sweat > 0:
        sp = skia.Path()
        sp.moveTo(112, -190)
        sp.cubicTo(100, -165, 104, -150, 114, -150)
        sp.cubicTo(126, -150, 128, -165, 112, -190)
        c.drawPath(sp, paint(0xFF9AD8FF, e.sweat))
        c.drawPath(sp, paint(0xFF4A90C8, e.sweat * 0.8, 2))


def _akari_bangs(c, t):
    sway = math.sin(t * 1.3) * 3
    side = skia.Path()
    # 左右のサイドの髪（顎のあたりまで）
    for sgn in (-1, 1):
        side = skia.Path()
        side.moveTo(sgn * 108, -230)
        side.cubicTo(sgn * 150, -150, sgn * 140, -40, sgn * (122 + sway * 0.3), 18)
        side.cubicTo(sgn * 112, -10, sgn * 104, -60, sgn * 98, -130)
        side.close()
        c.drawPath(side, paint(HAIR))
    # 前髪（房を重ねる）
    bang = skia.Path()
    bang.moveTo(-128, -150)
    bang.cubicTo(-140, -260, -60, -300, 0, -298)
    bang.cubicTo(70, -300, 142, -258, 128, -150)
    # 下端のギザギザ（房）
    tips = [(116, -150), (96, -196), (70, -168), (40, -204), (8, -176), (-24, -206), (-56, -172), (-86, -200), (-112, -158)]
    for i, (tx, ty) in enumerate(tips):
        bang.lineTo(tx + sway * (0.4 if i % 2 else 0.2), ty)
    bang.close()
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeLinear([(0, -300), (0, -120)], [HAIR_HI, HAIR]))
    c.drawPath(bang, p)
    # 髪のつや（天使の輪）
    shine = skia.Path()
    shine.addArc(skia.Rect.MakeXYWH(-95, -275, 190, 70), 200, 140)
    c.drawPath(shine, paint(0xFF8C7BD0, 0.55, 7))
    # ヘアクリップ（DNAのらせん）
    c.save()
    c.translate(84, -222)
    c.rotate(-30)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-30, -9, 60, 18), 9, 9), paint(0xFFF3F0FF))
    for i in range(6):
        xx = -24 + i * 9.6
        yy = math.sin(i * 1.2) * 5
        circle(c, xx, yy, 3.2, PAL["dna2"])
        circle(c, xx, -yy, 3.2, PAL["rna"])
    c.restore()


def _akari_eyes(c, e: Expr, t):
    open_ = max(0.0, e.eye_open * blink(t, 0.3))
    for sgn in (-1, 1):
        cx, cy = sgn * 50, -112
        # 眉（内側 = 顔の中心側）
        by = cy - 60 - e.brow * 14
        x_in, x_out = cx - sgn * 26, cx + sgn * 30
        y_in = by - e.brow_tilt * 9
        y_out = by + 4 + e.brow_tilt * 5
        bp = skia.Path()
        bp.moveTo(x_in, y_in)
        bp.quadTo(cx, by - 9, x_out, y_out)
        c.drawPath(bp, paint(HAIR, 1, 5))
        if e.smile_eyes > 0.5:
            # にっこり目（∩）
            sp = skia.Path()
            sp.moveTo(cx - 28, cy + 6)
            sp.quadTo(cx, cy - 26, cx + 28, cy + 6)
            c.drawPath(sp, paint(LINE, 1, 6))
            continue
        h = 40 * open_
        if h < 3:
            sp = skia.Path()
            sp.moveTo(cx - 28, cy + 4)
            sp.quadTo(cx, cy + 12, cx + 28, cy + 4)
            c.drawPath(sp, paint(LINE, 1, 5))
            continue
        # 白目
        c.save()
        clip = skia.Path()
        clip.addOval(skia.Rect.MakeXYWH(cx - 30, cy - h, 60, h * 2))
        c.drawPath(clip, paint(0xFFFFFFFF))
        c.clipPath(clip, skia.ClipOp.kIntersect, True)
        # 虹彩
        ix, iy = cx + e.look_x * 9, cy + e.look_y * 8 + 3
        ip = skia.Paint(AntiAlias=True)
        ip.setShader(skia.GradientShader.MakeLinear([(ix, iy - 34), (ix, iy + 34)], [IRIS_TOP, IRIS_BOT]))
        c.drawOval(skia.Rect.MakeXYWH(ix - 23, iy - 34, 46, 68), ip)
        c.drawOval(skia.Rect.MakeXYWH(ix - 11, iy - 14, 22, 28), paint(0xFF3B1A08))
        circle(c, ix + 9, iy - 15, 8, 0xFFFFFFFF)
        circle(c, ix - 9, iy + 12, 4, 0xFFFFFFFF, 0.9)
        if e.sparkle > 0:
            circle(c, ix - 12, iy - 10, 4 * e.sparkle, 0xFFFFFFFF)
        c.restore()
        # 上まぶた（まつげ）
        lp = skia.Path()
        lp.moveTo(cx - 34, cy - h * 0.25 + 4)
        lp.quadTo(cx, cy - h - 10, cx + 34, cy - h * 0.25)
        c.drawPath(lp, paint(LINE, 1, 7))
        # 目尻のまつげ
        out = sgn * 1
        c.drawLine(cx + out * 31, cy - h * 0.3, cx + out * 38, cy - h * 0.42, paint(LINE, 1, 3.5))
        # 下まぶた
        c.drawLine(cx - 18, cy + h * 0.95, cx + 18, cy + h * 0.95, paint(0xFFB98A8A, 0.7, 2.5))


def _akari_mouth(c, e: Expr):
    mx, my = 0, -20
    op = max(e.mouth_open, e.mouth_o * 0.7)
    if op < 0.06:
        sp = skia.Path()
        k = e.mouth_smile
        sp.moveTo(mx - 20, my - k * 4)
        sp.quadTo(mx, my + 8 * k + 2, mx + 20, my - k * 4)
        c.drawPath(sp, paint(0xFF9B3D4F, 1, 4))
        return
    w = 22 + 8 * e.mouth_smile - 10 * e.mouth_o
    h = 8 + 24 * op
    mp = skia.Path()
    mp.moveTo(mx - w, my - 2)
    mp.cubicTo(mx - w * 0.8, my + h * 1.1, mx + w * 0.8, my + h * 1.1, mx + w, my - 2)
    mp.quadTo(mx, my + 2 - 4 * e.mouth_smile, mx - w, my - 2)
    mp.close()
    c.drawPath(mp, paint(0xFF7A2236))
    c.save()
    c.clipPath(mp, skia.ClipOp.kIntersect, True)
    c.drawOval(skia.Rect.MakeXYWH(mx - w * 0.6, my + h * 0.45, w * 1.2, h * 0.9), paint(0xFFFF7F8F))
    c.drawRect(skia.Rect.MakeXYWH(mx - w, my - 4, w * 2, 6), paint(0xFFFFFFFF, 0.9))
    c.restore()
    c.drawPath(mp, paint(0xFF5A1626, 1, 2.5))


# =====================================================================  ヌク
def nuku(c: skia.Canvas, x: float, y: float, s: float = 1.0, e: Expr | None = None, t: float = 0.0,
         alpha: float = 1.0, point: tuple[float, float] | None = None):
    """ヌク（案内役）。(x, y) は体の中心、s=1 で直径約 190px。point=(px,py) でその方向を指す。"""
    e = e or Expr()
    if alpha <= 0.003:
        return
    bob = math.sin(t * 2.0) * 10
    sq = 1 + 0.06 * e.mouth_open
    c.save()
    c.translate(x, y + bob * s)
    c.scale(s, s)
    if alpha < 1:
        c.saveLayerAlpha(None, int(255 * alpha))
    # 影の光
    glow(c, 0, 0, 170, NUKU_MID, 0.35)
    # 軌道リング（後ろ半分）
    ring_rot = t * 40
    _nuku_ring(c, ring_rot, back=True)
    # 体
    c.save()
    c.scale(1 / sq ** 0.5, sq)
    body = skia.Paint(AntiAlias=True)
    body.setShader(skia.GradientShader.MakeRadial((-28, -34), 120, [NUKU_IN, NUKU_MID, NUKU_OUT], [0.0, 0.55, 1.0]))
    c.drawCircle(0, 0, 92, body)
    c.drawCircle(0, 0, 92, paint(0xFF0F7F62, 0.7, 3))
    # つや
    c.drawOval(skia.Rect.MakeXYWH(-56, -70, 46, 28), paint(0xFFFFFFFF, 0.65, blur=4))
    c.restore()
    # 芽（らせんの双葉）
    sway = math.sin(t * 2.6) * 6
    stem = skia.Path()
    stem.moveTo(0, -88)
    stem.quadTo(4 + sway * 0.3, -112, sway, -128)
    c.drawPath(stem, paint(0xFF1FB58C, 1, 5))
    for sgn, col in ((-1, PAL["dna"]), (1, PAL["rna"])):
        leaf = skia.Path()
        lx, ly = sway, -128
        leaf.moveTo(lx, ly)
        leaf.cubicTo(lx + sgn * 10, ly - 26, lx + sgn * 40, ly - 22, lx + sgn * 44, ly - 6)
        leaf.cubicTo(lx + sgn * 30, ly + 4, lx + sgn * 10, ly + 2, lx, ly)
        c.drawPath(leaf, paint(col))
        c.drawPath(leaf, paint(darken_safe(col), 0.8, 2))
    # 顔
    _nuku_face(c, e, t)
    # 手
    for sgn in (-1, 1):
        hx, hy = sgn * 104, 22 + math.sin(t * 2.4 + sgn) * 6
        if point is not None and sgn == (1 if point[0] > x else -1):
            ang = math.atan2(point[1] - (y + bob * s), point[0] - x)
            hx, hy = math.cos(ang) * 120, math.sin(ang) * 120
            c.drawLine(math.cos(ang) * 86, math.sin(ang) * 86, hx, hy, paint(NUKU_OUT, 1, 9))
        circle(c, hx, hy, 17, NUKU_MID)
        circle(c, hx, hy, 17, 0xFF0F7F62, 0.8, 2.5)
    _nuku_ring(c, ring_rot, back=False)
    if alpha < 1:
        c.restore()
    c.restore()


def darken_safe(col: int) -> int:
    from .draw import darken
    return darken(col, 0.35)


def _nuku_ring(c, rot, back: bool):
    c.save()
    c.translate(0, 52)
    c.rotate(-10)
    rect = skia.Rect.MakeXYWH(-138, -26, 276, 52)
    start = 180 if back else 0
    p = skia.Path()
    p.addArc(rect, start, 180)
    c.drawPath(p, paint(0xFFBFFFEF, 0.9 if not back else 0.45, 6))
    # リング上のビーズ（塩基の色）
    for i, col in enumerate((PAL["dna"], PAL["rna"], PAL["yellow"])):
        a = math.radians(rot + i * 120)
        bx, by = math.cos(a) * 138, math.sin(a) * 26
        if (by < 0) == back:
            circle(c, bx, by, 10, col)
            circle(c, bx - 3, by - 3, 3.5, 0xFFFFFFFF, 0.8)
    c.restore()


def _nuku_face(c, e: Expr, t):
    open_ = max(0.0, e.eye_open * blink(t, 0.9))
    for sgn in (-1, 1):
        ex, ey = sgn * 30 + e.look_x * 6, -12 + e.look_y * 5
        # 眉（小さめ）
        by = ey - 34 - e.brow * 10
        bp = skia.Path()
        bp.moveTo(ex - 13, by + sgn * e.brow_tilt * -5)
        bp.lineTo(ex + 13, by + sgn * e.brow_tilt * 5)
        c.drawPath(bp, paint(NUKU_EYE, 0.8, 4))
        if e.smile_eyes > 0.5:
            sp = skia.Path()
            sp.moveTo(ex - 14, ey + 4)
            sp.quadTo(ex, ey - 14, ex + 14, ey + 4)
            c.drawPath(sp, paint(NUKU_EYE, 1, 6))
            continue
        h = 20 * open_
        if h < 2:
            c.drawLine(ex - 12, ey, ex + 12, ey, paint(NUKU_EYE, 1, 5))
            continue
        c.drawOval(skia.Rect.MakeXYWH(ex - 13, ey - h, 26, h * 2), paint(NUKU_EYE))
        circle(c, ex + 4, ey - h * 0.45, 5.5, 0xFFFFFFFF)
        circle(c, ex - 4, ey + h * 0.4, 2.5, 0xFFFFFFFF, 0.8)
    # 頬
    for sgn in (-1, 1):
        c.drawOval(skia.Rect.MakeXYWH(sgn * 52 - 13, 8, 26, 12), paint(0xFFFF9FB5, 0.55, blur=4))
    # 口
    op = max(e.mouth_open, e.mouth_o * 0.6)
    if op < 0.06:
        sp = skia.Path()
        sp.moveTo(-12, 18 - e.mouth_smile * 2)
        sp.quadTo(0, 18 + 9 * e.mouth_smile + 2, 12, 18 - e.mouth_smile * 2)
        c.drawPath(sp, paint(NUKU_EYE, 1, 4))
    else:
        h = 5 + 16 * op
        mp = skia.Path()
        mp.addOval(skia.Rect.MakeXYWH(-12 - 3 * e.mouth_smile, 14, 24 + 6 * e.mouth_smile, h))
        c.drawPath(mp, paint(0xFF0B3A30))
        c.save()
        c.clipPath(mp, skia.ClipOp.kIntersect, True)
        c.drawOval(skia.Rect.MakeXYWH(-8, 14 + h * 0.5, 16, h * 0.7), paint(0xFFFF8FA3))
        c.restore()
