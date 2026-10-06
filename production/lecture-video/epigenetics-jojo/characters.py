"""The cast: 航一朗先生 (a rigged, muscular manga lecturer), the concept mascots and the villain 誤解（ゴカイ）."""
import math
import random
import cairo
from gfx import (BLACK, WHITE, hexc, mix, src, text, ball, circle, clamp, ease_out, back_out, rrect)

# ── 航一朗先生 ──────────────────────────────────────────────────────────────────────────────
SKIN, SKIN_S = hexc("#ffd3a6"), hexc("#e48f5e")
HAIR, HAIR_H = hexc("#35208a"), hexc("#55e0ff")
SHIRT, SHIRT_S = hexc("#14b8a6"), hexc("#0b6f7a")
COAT, COAT_S = hexc("#ffffff"), hexc("#b9a6ff")
PANTS, PANTS_S = hexc("#3a3fd0"), hexc("#23238a")
GOLD, GOLD_S = hexc("#ffcf1f"), hexc("#d48a00")
SHOE = hexc("#c2185b")
LIP = hexc("#e0507a")

# angles: 0 = straight down, +90 = screen right, 180 = up.  u = upper arm/thigh, f = forearm/shin
POSES = {
    "stand":  dict(lean=-4, hip=0, head=6, lu=-28, lf=52, ru=118, rf=-150, lt=-14, ls=6, rt=18, rs=-4, lh="fist", rh="open", front="r", y=0),
    "rise":   dict(lean=0, hip=0, head=-4, lu=-30, lf=40, ru=30, rf=-40, lt=-8, ls=0, rt=8, rs=0, lh="fist", rh="fist", front="r", y=0),
    "jojo":   dict(lean=12, hip=10, head=-14, lu=40, lf=118, ru=165, rf=-168, lt=-24, ls=14, rt=24, rs=-20, lh="open", rh="open", front="l", y=0),
    "point":  dict(lean=6, hip=-4, head=10, lu=-30, lf=55, ru=96, rf=94, lt=-16, ls=8, rt=20, rs=-6, lh="fist", rh="point", front="r", y=0),
    "cross":  dict(lean=-2, hip=0, head=12, lu=-6, lf=98, ru=8, rf=-96, lt=-15, ls=7, rt=15, rs=-7, lh="fist", rh="fist", front="r", y=0),
    "fist":   dict(lean=-6, hip=4, head=-6, lu=-30, lf=50, ru=100, rf=178, lt=-20, ls=10, rt=18, rs=-8, lh="fist", rh="fist", front="r", y=0),
    "punch":  dict(lean=20, hip=14, head=8, lu=-70, lf=-10, ru=90, rf=90, lt=-34, ls=10, rt=36, rs=-30, lh="fist", rh="fist", front="r", y=0),
    "summon": dict(lean=-2, hip=0, head=-10, lu=-135, lf=-160, ru=135, rf=160, lt=-20, ls=10, rt=20, rs=-10, lh="open", rh="open", front="r", y=0),
}


def lerp_pose(a, b, k):
    out = {}
    for key, v in a.items():
        if isinstance(v, (int, float)):
            out[key] = v + (b[key] - v) * k
        else:
            out[key] = b[key] if k > 0.5 else v
    return out


def d(a):
    r = math.radians(a)
    return math.sin(r), math.cos(r)


def limb(ctx, p0, p1, w0, wm, w1, col, shade, lw=5, hatch=True):
    """a tapered, bulging limb segment with cel shading (light from the upper right)"""
    x0, y0 = p0
    x1, y1 = p1
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2

    def path():
        ctx.new_path()
        ctx.move_to(x0 + nx * w0 / 2, y0 + ny * w0 / 2)
        ctx.curve_to(mx + nx * wm * 0.62, my + ny * wm * 0.62, mx + nx * wm * 0.55, my + ny * wm * 0.55,
                     x1 + nx * w1 / 2, y1 + ny * w1 / 2)
        ctx.arc(x1, y1, w1 / 2, math.atan2(ny, nx), math.atan2(ny, nx) + math.pi)
        ctx.curve_to(mx - nx * wm * 0.55, my - ny * wm * 0.55, mx - nx * wm * 0.62, my - ny * wm * 0.62,
                     x0 - nx * w0 / 2, y0 - ny * w0 / 2)
        ctx.arc(x0, y0, w0 / 2, math.atan2(-ny, -nx), math.atan2(-ny, -nx) + math.pi)
        ctx.close_path()

    path()
    src(ctx, shade)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    # lit side: shift the shape toward the light, leaving a crescent of shadow
    ctx.translate(7, -6)
    path()
    src(ctx, col)
    ctx.fill()
    ctx.restore()
    if hatch:
        ctx.save()
        path()
        ctx.clip()
        src(ctx, BLACK, 0.55)
        ctx.set_line_width(2)
        sx, sy = (nx, ny) if nx < 0 or (nx == 0 and ny > 0) else (-nx, -ny)
        for k in (0.35, 0.5, 0.65):
            px, py = x0 + dx * k, y0 + dy * k
            ctx.move_to(px + sx * wm * 0.48, py + sy * wm * 0.48)
            ctx.line_to(px + sx * wm * 0.30 + dx * 0.05, py + sy * wm * 0.30 + dy * 0.05)
        ctx.stroke()
        ctx.restore()
    path()
    ctx.set_line_width(lw)
    src(ctx, BLACK)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()


def hand(ctx, p, ang, kind, s=1.0):
    x, y = p
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-math.radians(ang))
    ctx.scale(s, s)
    if kind == "fist":
        rrect(ctx, -19, -6, 38, 36, 12)
        src(ctx, SKIN)
        ctx.fill_preserve()
        ctx.set_line_width(4.5)
        src(ctx, BLACK)
        ctx.stroke()
        ctx.set_line_width(2.5)
        for k in (-8, 1, 10):
            ctx.move_to(k, 14)
            ctx.line_to(k, 28)
        ctx.stroke()
    elif kind == "point":
        rrect(ctx, -17, -6, 34, 30, 11)
        src(ctx, SKIN)
        ctx.fill_preserve()
        ctx.set_line_width(4.5)
        src(ctx, BLACK)
        ctx.stroke()
        rrect(ctx, -6, 16, 13, 42, 6)
        src(ctx, SKIN)
        ctx.fill_preserve()
        src(ctx, BLACK)
        ctx.stroke()
    else:  # open hand, fingers spread (the classic dramatic hand)
        for i, a in enumerate((-48, -20, 2, 24, 62)):
            ctx.save()
            ctx.rotate(math.radians(a))
            ln = 34 if i in (1, 2, 3) else 26
            rrect(ctx, -5.5, 6, 11, ln, 5.5)
            src(ctx, SKIN)
            ctx.fill_preserve()
            ctx.set_line_width(3.5)
            src(ctx, BLACK)
            ctx.stroke()
            ctx.restore()
        ctx.arc(0, 8, 17, 0, 2 * math.pi)
        src(ctx, SKIN)
        ctx.fill_preserve()
        ctx.set_line_width(4.5)
        src(ctx, BLACK)
        ctx.stroke()
    ctx.restore()


def head(ctx, x, y, rot, t, talk, look=0.0, fierce=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(math.radians(rot))
    # back hair: spikes sweeping up and back
    ctx.new_path()
    spikes = [(-46, -10), (-62, -40), (-52, -52), (-70, -86), (-36, -76), (-30, -118), (-6, -88), (10, -132),
              (22, -90), (52, -122), (44, -78), (74, -82), (50, -48), (62, -26), (44, -12)]
    ctx.move_to(-40, 10)
    for i, (px, py) in enumerate(spikes):
        wob = math.sin(t * 6 + i) * 2.5
        ctx.line_to(px + wob, py)
    ctx.line_to(40, 10)
    ctx.close_path()
    src(ctx, HAIR)
    ctx.fill_preserve()
    ctx.set_line_width(5)
    ctx.set_line_join(cairo.LINE_JOIN_MITER)
    src(ctx, BLACK)
    ctx.stroke()
    # ears
    for sx in (-1, 1):
        ctx.save()
        ctx.translate(sx * 40, 4)
        ctx.scale(0.55, 1)
        ctx.arc(0, 0, 13, 0, 2 * math.pi)
        ctx.restore()
        src(ctx, SKIN)
        ctx.fill_preserve()
        ctx.set_line_width(4)
        src(ctx, BLACK)
        ctx.stroke()

    def face():
        ctx.new_path()
        ctx.move_to(-38, -40)
        ctx.line_to(-41, 8)
        ctx.line_to(-32, 38)
        ctx.line_to(-14, 56)
        ctx.line_to(14, 56)
        ctx.line_to(32, 38)
        ctx.line_to(41, 8)
        ctx.line_to(38, -40)
        ctx.close_path()

    face()
    src(ctx, SKIN_S)
    ctx.fill()
    ctx.save()
    face()
    ctx.clip()
    ctx.translate(9, -4)
    face()
    src(ctx, SKIN)
    ctx.fill()
    ctx.restore()
    # cheek hatching (JoJo-style shading lines)
    ctx.set_line_width(2.2)
    src(ctx, BLACK, 0.7)
    for k in range(3):
        ctx.move_to(-33 + k * 4, 22 + k * 3)
        ctx.line_to(-24 + k * 4, 14 + k * 3)
    ctx.stroke()
    face()
    ctx.set_line_width(5)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    src(ctx, BLACK)
    ctx.stroke()
    # brows: heavy, slanting down to the centre
    for sx in (-1, 1):
        ctx.new_path()
        ctx.move_to(sx * 36, -22 - fierce * 2)
        ctx.line_to(sx * 6, -12 + fierce * 3)
        ctx.line_to(sx * 7, -5 + fierce * 3)
        ctx.line_to(sx * 34, -13 - fierce * 2)
        ctx.close_path()
        src(ctx, BLACK)
        ctx.fill()
    # eyes: sharp, small pupils
    blink = 1.0 if (t % 3.7) > 0.12 else 0.15
    for sx in (-1, 1):
        ex = sx * 18
        ctx.save()
        ctx.translate(ex, 0)
        ctx.scale(1, blink)
        ctx.new_path()
        ctx.move_to(-13, 1)
        ctx.curve_to(-6, -7, 6, -7, 13, -2)
        ctx.curve_to(6, 5, -6, 6, -13, 1)
        ctx.close_path()
        src(ctx, WHITE)
        ctx.fill_preserve()
        ctx.set_line_width(2.5)
        src(ctx, BLACK)
        ctx.stroke()
        circle(ctx, 1 + look * 5, -0.5, 4.6, hexc("#0e9fb0"), lw=1.5)
        circle(ctx, 1 + look * 5, -0.5, 2.2, BLACK, lw=0)
        circle(ctx, -0.5 + look * 5, -2.4, 1.3, WHITE, lw=0)
        ctx.set_line_width(4.5)
        src(ctx, BLACK)
        ctx.move_to(-14, 1)
        ctx.curve_to(-6, -8, 6, -8, 14, -3)
        ctx.stroke()
        ctx.restore()
        ctx.set_line_width(2)
        src(ctx, BLACK, 0.8)
        ctx.move_to(ex - 9, 9)
        ctx.line_to(ex + 7, 8)
        ctx.stroke()
    # nose
    ctx.set_line_width(3)
    src(ctx, BLACK)
    ctx.move_to(-1, -2)
    ctx.line_to(-6, 20)
    ctx.line_to(2, 22)
    ctx.stroke()
    ctx.new_path()
    ctx.move_to(-1, -2)
    ctx.line_to(-6, 20)
    ctx.line_to(-12, 18)
    ctx.close_path()
    src(ctx, SKIN_S, 0.8)
    ctx.fill()
    # mouth
    op = clamp(talk) * 11
    if op > 1.5:
        ctx.new_path()
        ctx.move_to(-13, 33)
        ctx.curve_to(-6, 31, 6, 31, 13, 33)
        ctx.curve_to(8, 33 + op * 1.4, -8, 33 + op * 1.4, -13, 33)
        ctx.close_path()
        src(ctx, hexc("#5a0d1e"))
        ctx.fill_preserve()
        ctx.set_line_width(3)
        src(ctx, BLACK)
        ctx.stroke()
        ctx.rectangle(-9, 32, 18, 3.5)
        src(ctx, WHITE)
        ctx.fill()
    else:
        ctx.set_line_width(3.5)
        src(ctx, BLACK)
        ctx.move_to(-13, 33)
        ctx.curve_to(-5, 35, 5, 35, 13, 32)
        ctx.stroke()
    ctx.set_line_width(3)
    src(ctx, LIP)
    ctx.move_to(-8, 40 + op * 0.9)
    ctx.curve_to(-3, 43 + op * 0.9, 3, 43 + op * 0.9, 8, 40 + op * 0.9)
    ctx.stroke()
    # front hair: pompadour and sharp bangs over the forehead
    ctx.new_path()
    ctx.move_to(-44, -30)
    ctx.line_to(-30, -52)
    ctx.line_to(-34, -26)
    ctx.line_to(-18, -50)
    ctx.line_to(-16, -24)
    ctx.line_to(0, -54)
    ctx.line_to(6, -28)
    ctx.line_to(22, -52)
    ctx.line_to(24, -26)
    ctx.line_to(40, -46)
    ctx.line_to(44, -24)
    ctx.line_to(48, -60)
    ctx.curve_to(30, -96, -30, -96, -50, -62)
    ctx.close_path()
    src(ctx, HAIR)
    ctx.fill_preserve()
    ctx.set_line_width(5)
    src(ctx, BLACK)
    ctx.stroke()
    ctx.set_line_width(5)
    src(ctx, HAIR_H)
    ctx.move_to(-30, -74)
    ctx.curve_to(-14, -86, 10, -88, 30, -76)
    ctx.stroke()
    ctx.set_line_width(3)
    ctx.move_to(-20, -64)
    ctx.line_to(-8, -70)
    ctx.stroke()
    ctx.restore()


def professor(ctx, x, y, s, P, t, talk=0.0, glow=1.0, fierce=0.0):
    """draw 航一朗先生 with his feet at (x, y)"""
    ctx.save()
    ctx.translate(x, y + P.get("y", 0))
    ctx.scale(s, s)
    breath = math.sin(t * 2.4) * 3
    lean = P["lean"]
    pel = (P["hip"], -300 + breath * 0.3)
    u = (math.sin(math.radians(lean)), -math.cos(math.radians(lean)))
    r = (-u[1], u[0])

    def T(px, py):
        return (pel[0] + r[0] * px + u[0] * py, pel[1] + r[1] * px + u[1] * (py + breath * 0.5))

    neck = T(0, 205)
    shL, shR = T(-88, 182), T(88, 182)
    hipL, hipR = T(-38, 0), T(38, 0)

    def arm(sh, au, af):
        e = (sh[0] + d(au)[0] * 120, sh[1] + d(au)[1] * 120)
        h = (e[0] + d(af)[0] * 112, e[1] + d(af)[1] * 112)
        return e, h

    def leg(hp, at, as_):
        k = (hp[0] + d(at)[0] * 150, hp[1] + d(at)[1] * 150)
        f = (k[0] + d(as_)[0] * 148, k[1] + d(as_)[1] * 148)
        return k, f

    eL, hL = arm(shL, P["lu"], P["lf"])
    eR, hR = arm(shR, P["ru"], P["rf"])
    kL, fL = leg(hipL, P["lt"], P["ls"])
    kR, fR = leg(hipR, P["rt"], P["rs"])

    def draw_arm(sh, e, h, af, kind):
        limb(ctx, sh, e, 58, 62, 46, COAT, COAT_S)
        limb(ctx, e, h, 46, 54, 34, SKIN, SKIN_S)
        circle(ctx, e[0], e[1], 18, SKIN, lw=0)
        # gold cuff at the wrist
        cx, cy = e[0] + (h[0] - e[0]) * 0.8, e[1] + (h[1] - e[1]) * 0.8
        circle(ctx, cx, cy, 15, GOLD, lw=4)
        hand(ctx, h, af, kind)

    def draw_leg(hp, k, f, side):
        limb(ctx, hp, k, 64, 68, 50, PANTS, PANTS_S)
        limb(ctx, k, f, 50, 50, 38, PANTS, PANTS_S)
        circle(ctx, k[0], k[1], 20, PANTS, lw=0)
        ctx.save()
        ctx.translate(*f)
        ctx.new_path()
        ctx.move_to(-22, -8)
        ctx.line_to(30 * side + (6 if side < 0 else 0), 2)
        ctx.line_to(46 * side, 12)
        ctx.line_to(-24 * side, 14)
        ctx.close_path()
        src(ctx, SHOE)
        ctx.fill_preserve()
        ctx.set_line_width(4.5)
        src(ctx, BLACK)
        ctx.stroke()
        ctx.restore()

    # coat tails (behind everything), streaming in the wind
    wind = math.sin(t * 3.1) * 14
    ctx.new_path()
    a, b = T(-92, 185), T(92, 185)
    ctx.move_to(*a)
    c1 = T(-150 - wind, -40)
    c2 = T(-120 - wind * 1.6, -250)
    ctx.line_to(*c1)
    ctx.line_to(*T(-170 - wind * 2, -300))
    ctx.line_to(*T(-60 - wind, -250))
    ctx.line_to(*T(60 - wind, -260))
    ctx.line_to(*T(150 - wind * 1.4, -290))
    ctx.line_to(*T(130 - wind * 0.5, -40))
    ctx.line_to(*b)
    ctx.close_path()
    src(ctx, COAT_S)
    ctx.fill_preserve()
    ctx.set_line_width(5)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    src(ctx, BLACK)
    ctx.stroke()
    _ = c2

    back_arm = (shL, eL, hL, P["lf"], P["lh"]) if P["front"] == "r" else (shR, eR, hR, P["rf"], P["rh"])
    front_arm = (shR, eR, hR, P["rf"], P["rh"]) if P["front"] == "r" else (shL, eL, hL, P["lf"], P["lh"])
    draw_arm(*back_arm)
    draw_leg(hipL, kL, fL, -1)
    draw_leg(hipR, kR, fR, 1)

    # torso: V-shaped, tight shirt, pecs and abs
    def torso():
        ctx.new_path()
        ctx.move_to(*T(-96, 190))
        ctx.curve_to(*T(-104, 160), *T(-86, 120), *T(-66, 60))
        ctx.curve_to(*T(-56, 30), *T(-52, 10), *T(-58, -20))
        ctx.line_to(*T(58, -20))
        ctx.curve_to(*T(52, 10), *T(56, 30), *T(66, 60))
        ctx.curve_to(*T(86, 120), *T(104, 160), *T(96, 190))
        ctx.curve_to(*T(40, 214), *T(-40, 214), *T(-96, 190))
        ctx.close_path()

    torso()
    src(ctx, SHIRT_S)
    ctx.fill()
    ctx.save()
    torso()
    ctx.clip()
    ctx.translate(12, -8)
    torso()
    src(ctx, SHIRT)
    ctx.fill()
    ctx.restore()
    ctx.set_line_width(3.5)
    src(ctx, BLACK)
    for sx in (-1, 1):  # pecs
        ctx.move_to(*T(sx * 6, 168))
        ctx.curve_to(*T(sx * 30, 124), *T(sx * 64, 126), *T(sx * 78, 146))
    ctx.stroke()
    ctx.set_line_width(3)
    ctx.move_to(*T(0, 160))
    ctx.line_to(*T(0, 20))
    for yy in (100, 70, 42):  # abs
        for sx in (-1, 1):
            ctx.move_to(*T(sx * 6, yy))
            ctx.curve_to(*T(sx * 18, yy + 6), *T(sx * 30, yy + 2), *T(sx * 36, yy - 6))
    ctx.stroke()
    torso()
    ctx.set_line_width(5)
    src(ctx, BLACK)
    ctx.stroke()
    # belt with a golden buckle
    ctx.new_path()
    ctx.move_to(*T(-60, 4))
    ctx.line_to(*T(60, 4))
    ctx.line_to(*T(60, -22))
    ctx.line_to(*T(-60, -22))
    ctx.close_path()
    src(ctx, hexc("#2a1640"))
    ctx.fill_preserve()
    ctx.set_line_width(4)
    src(ctx, BLACK)
    ctx.stroke()
    bx, by = T(0, -9)
    circle(ctx, bx, by, 17, GOLD, lw=4)
    text(ctx, "航", bx, by, 18, "dela", fill=BLACK)
    # open coat panels with a high collar
    for sx in (-1, 1):
        ctx.new_path()
        ctx.move_to(*T(sx * 96, 192))
        ctx.line_to(*T(sx * 40, 214))
        ctx.line_to(*T(sx * 52, 150))
        ctx.line_to(*T(sx * 64, 40))
        ctx.line_to(*T(sx * 76, -150 - (wind if sx < 0 else -wind) * 0.4))
        ctx.line_to(*T(sx * 124, -140))
        ctx.line_to(*T(sx * 108, 120))
        ctx.close_path()
        src(ctx, COAT)
        ctx.fill_preserve()
        ctx.set_line_width(5)
        src(ctx, BLACK)
        ctx.stroke()
        ctx.set_line_width(3)
        src(ctx, COAT_S)
        ctx.move_to(*T(sx * 70, 100))
        ctx.line_to(*T(sx * 86, -120))
        ctx.stroke()
        # collar
        ctx.new_path()
        ctx.move_to(*T(sx * 34, 206))
        ctx.line_to(*T(sx * 70, 262))
        ctx.line_to(*T(sx * 98, 196))
        ctx.close_path()
        src(ctx, COAT)
        ctx.fill_preserve()
        ctx.set_line_width(5)
        src(ctx, BLACK)
        ctx.stroke()
    # golden pin on the collar
    px, py = T(-62, 170)
    ctx.save()
    ctx.translate(px, py)
    ctx.new_path()
    ctx.move_to(0, -14)
    ctx.curve_to(-18, -28, -24, 4, 0, 16)
    ctx.curve_to(24, 4, 18, -28, 0, -14)
    src(ctx, GOLD)
    ctx.fill_preserve()
    ctx.set_line_width(3.5)
    src(ctx, BLACK)
    ctx.stroke()
    ctx.restore()
    # neck and head
    hx, hy = neck[0] + u[0] * 62, neck[1] + u[1] * 62
    limb(ctx, neck, (hx, hy + 10), 46, 46, 42, SKIN, SKIN_S, hatch=False)
    head(ctx, hx, hy, P["head"] + lean * 0.4, t, talk, look=0.35, fierce=fierce)
    draw_arm(*front_arm)
    ctx.restore()
    return (x + hx * s, y + (hy - 60) * s)


# ── concept mascots ─────────────────────────────────────────────────────────────────────────
MASCOT = {
    "methyl":  dict(col=hexc("#3f7bff"), name="メチル", sub="CH3"),
    "acetyl":  dict(col=hexc("#ff8a1f"), name="アセチル", sub="Ac"),
    "histone": dict(col=hexc("#ff5fae"), name="ヒストン八人衆", sub="H2A·H2B·H3·H4"),
    "hdac":    dict(col=hexc("#2fbf5f"), name="HDAC", sub="脱アセチル化酵素"),
    "remodel": dict(col=hexc("#ffd21f"), name="リモデリング因子", sub="クロマチン"),
    "ncrna":   dict(col=hexc("#e040fb"), name="ncRNA", sub="ノンコーディング"),
    "xist":    dict(col=hexc("#ff3b5c"), name="Xist", sub="ncRNA"),
    "aza":     dict(col=hexc("#9b6bff"), name="アザシチジン", sub="DNA脱メチル化剤"),
}


def face(ctx, x, y, s, talk, t, mood="happy", lashes=False, mask=False):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    blink = 1.0 if (t % 3.1) > 0.1 else 0.2
    if mask:
        ctx.new_path()
        ctx.move_to(-36, -12)
        ctx.curve_to(-20, -24, 20, -24, 36, -12)
        ctx.curve_to(30, 10, 6, 6, 0, 0)
        ctx.curve_to(-6, 6, -30, 10, -36, -12)
        src(ctx, BLACK)
        ctx.fill()
    for sx in (-1, 1):
        ctx.save()
        ctx.translate(sx * 15, -6)
        ctx.scale(1, blink)
        ctx.arc(0, 0, 10, 0, 2 * math.pi)
        src(ctx, WHITE)
        ctx.fill_preserve()
        ctx.set_line_width(3)
        src(ctx, BLACK)
        ctx.stroke()
        circle(ctx, 2 * sx * 0 + 1.5, 1, 5, BLACK, lw=0)
        circle(ctx, 0, -2, 2, WHITE, lw=0)
        ctx.restore()
        ctx.set_line_width(4)
        src(ctx, BLACK)
        ctx.move_to(sx * 26, -22 if mood != "angry" else -26)
        ctx.line_to(sx * 6, -18 if mood != "angry" else -14)
        ctx.stroke()
        if lashes:
            ctx.set_line_width(2.5)
            ctx.move_to(sx * 22, -12)
            ctx.line_to(sx * 28, -17)
            ctx.stroke()
    op = clamp(talk)
    ctx.new_path()
    if op > 0.1:
        ctx.move_to(-10, 12)
        ctx.curve_to(-6, 14 + op * 16, 6, 14 + op * 16, 10, 12)
        ctx.close_path()
        src(ctx, hexc("#7a1022"))
        ctx.fill_preserve()
        ctx.set_line_width(3)
        src(ctx, BLACK)
        ctx.stroke()
    else:
        ctx.set_line_width(3.5)
        src(ctx, BLACK)
        ctx.move_to(-10, 12)
        ctx.curve_to(-4, 18, 4, 18, 10, 12)
        ctx.stroke()
    ctx.restore()


def legs(ctx, x, y, s, col, t, n=2):
    for i, sx in enumerate((-1, 1)):
        k = math.sin(t * 7 + i * 3) * 4
        ctx.set_line_width(9 * s)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        src(ctx, BLACK)
        ctx.move_to(x + sx * 18 * s, y)
        ctx.line_to(x + sx * 24 * s, y + 34 * s + k)
        ctx.stroke()
        ctx.set_line_width(5 * s)
        src(ctx, col)
        ctx.move_to(x + sx * 18 * s, y)
        ctx.line_to(x + sx * 24 * s, y + 34 * s + k)
        ctx.stroke()


def mascot(ctx, kind, x, y, s, t, talk=0.0, alpha=1.0, name=True):
    """(x, y) = centre of the body"""
    M = MASCOT[kind]
    col = M["col"]
    if alpha < 1:
        ctx.push_group()
    if kind == "methyl":
        legs(ctx, x, y + 40 * s, s, col, t)
        for ang in (-30, 30):
            a = math.radians(ang - 90)
            ctx.set_line_width(7 * s)
            src(ctx, BLACK)
            hx, hy = x + math.cos(a) * 76 * s, y + math.sin(a) * 76 * s
            ctx.move_to(x, y)
            ctx.line_to(hx, hy)
            ctx.stroke()
            ball(ctx, hx, hy, 22 * s, hexc("#f4f6ff"))
            text(ctx, "H", hx, hy, 20 * s, "dela", fill=BLACK)
        hx, hy = x + 78 * s, y + 20 * s
        ctx.move_to(x, y)
        ctx.line_to(hx, hy)
        ctx.set_line_width(7 * s)
        src(ctx, BLACK)
        ctx.stroke()
        ball(ctx, hx, hy, 22 * s, hexc("#f4f6ff"))
        text(ctx, "H", hx, hy, 20 * s, "dela", fill=BLACK)
        ball(ctx, x, y, 52 * s, col, lw=5)
        face(ctx, x, y + 4 * s, s, talk, t)
        # cool shades pushed up on the head
        ctx.save()
        ctx.translate(x, y - 36 * s)
        ctx.scale(s, s)
        for sx in (-1, 1):
            rrect(ctx, sx * 4 - (22 if sx < 0 else 0), -8, 22, 12, 5)
            src(ctx, BLACK)
            ctx.fill()
        ctx.restore()
        text(ctx, "C", x - 34 * s, y + 30 * s, 18 * s, "dela", fill=WHITE, stroke=BLACK, sw=3)
    elif kind == "acetyl":
        legs(ctx, x, y + 40 * s, s, col, t)
        ctx.set_line_width(5 * s)
        src(ctx, BLACK)
        for off in (-5, 5):
            ctx.move_to(x + off * s, y - 46 * s)
            ctx.line_to(x + off * s, y - 74 * s)
        ctx.stroke()
        ball(ctx, x, y - 88 * s, 18 * s, hexc("#ff3b3b"))
        text(ctx, "O", x, y - 88 * s, 18 * s, "dela", fill=WHITE, stroke=BLACK, sw=3)
        # ponytail
        ctx.new_path()
        sw = math.sin(t * 5) * 8
        ctx.move_to(x + 40 * s, y - 30 * s)
        ctx.curve_to(x + 90 * s, y - 40 * s + sw, x + 100 * s, y + 10 * s + sw, x + 80 * s, y + 30 * s)
        ctx.curve_to(x + 80 * s, y, x + 70 * s, y - 20 * s, x + 40 * s, y - 14 * s)
        src(ctx, hexc("#ffb347"))
        ctx.fill_preserve()
        ctx.set_line_width(4)
        src(ctx, BLACK)
        ctx.stroke()
        ball(ctx, x, y, 52 * s, col, lw=5)
        face(ctx, x, y + 4 * s, s, talk, t, lashes=True)
        text(ctx, "Ac", x - 34 * s, y + 30 * s, 16 * s, "dela", fill=WHITE, stroke=BLACK, sw=3)
    elif kind == "histone":
        legs(ctx, x, y + 52 * s, s, col, t)
        cols = [hexc(c) for c in ("#ff5fae", "#ffb347", "#5ad1ff", "#9dff5a")]
        w, h = 120 * s, 104 * s
        for layer in (1, 0):
            yy = y - h / 2 + layer * h / 2
            for i in range(4):
                rrect(ctx, x - w / 2 + i * w / 4, yy, w / 4, h / 2, 6 * s)
                src(ctx, mix(cols[i], WHITE, 0.15 * layer))
                ctx.fill_preserve()
                ctx.set_line_width(3.5)
                src(ctx, BLACK)
                ctx.stroke()
        for i, lab in enumerate(("2A", "2B", "3", "4")):
            text(ctx, lab, x - w / 2 + (i + 0.5) * w / 4, y + h / 2 - 14 * s, 13 * s, "dela", fill=BLACK)
        # DNA wrapped around the spool
        ctx.set_line_width(9 * s)
        for k in (0.12, 0.36):
            src(ctx, BLACK)
            ctx.move_to(x - w * 0.62, y + h * k - 18 * s)
            ctx.curve_to(x - w * 0.2, y + h * k + 26 * s, x + w * 0.2, y + h * k - 26 * s, x + w * 0.62, y + h * k + 18 * s)
            ctx.stroke_preserve()
            ctx.set_line_width(5 * s)
            src(ctx, hexc("#2b6cff"))
            ctx.stroke()
            ctx.set_line_width(9 * s)
        # tails
        for i, sx in enumerate((-1, 1)):
            ctx.set_line_width(4)
            src(ctx, BLACK)
            ctx.move_to(x + sx * w / 2, y - h / 3)
            for k in range(1, 6):
                ctx.line_to(x + sx * (w / 2 + k * 9 * s), y - h / 3 - k * 6 * s + math.sin(t * 6 + k + i) * 5 * s)
            ctx.stroke()
        face(ctx, x, y - 24 * s, s * 0.95, talk, t, mood="angry")
    elif kind == "hdac":
        legs(ctx, x, y + 40 * s, s, col, t)
        ball(ctx, x, y, 52 * s, col, lw=5)
        face(ctx, x, y + 4 * s, s, talk, t, mood="angry")
        # scissors arm
        ctx.save()
        ctx.translate(x + 58 * s, y)
        ctx.scale(s, s)
        op = 0.35 + 0.25 * math.sin(t * 9)
        for sg in (-1, 1):
            ctx.save()
            ctx.rotate(sg * op)
            ctx.new_path()
            ctx.move_to(0, 0)
            ctx.line_to(70, -6)
            ctx.line_to(76, 0)
            ctx.line_to(0, 8)
            ctx.close_path()
            src(ctx, hexc("#d9e6f2"))
            ctx.fill_preserve()
            ctx.set_line_width(3.5)
            src(ctx, BLACK)
            ctx.stroke()
            circle(ctx, -14, 0, 11, hexc("#ff3b3b"), lw=3.5)
            ctx.restore()
        ctx.restore()
    elif kind == "remodel":
        legs(ctx, x, y + 44 * s, s, col, t)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(t * 0.8)
        ctx.new_path()
        for i in range(24):
            a = i * math.pi / 12
            rr = (60 if i % 2 == 0 else 48) * s
            ctx.line_to(math.cos(a) * rr, math.sin(a) * rr)
        ctx.close_path()
        src(ctx, col)
        ctx.fill_preserve()
        ctx.set_line_width(5)
        src(ctx, BLACK)
        ctx.stroke()
        ctx.restore()
        ball(ctx, x, y, 40 * s, mix(col, WHITE, 0.3), lw=4)
        face(ctx, x, y + 2 * s, s * 0.85, talk, t)
    elif kind in ("ncrna", "xist"):
        ctx.new_path()
        ctx.move_to(x - 10 * s, y + 70 * s)
        for k in range(1, 12):
            ctx.line_to(x + math.sin(k * 0.9 + t * 4) * 30 * s, y + 70 * s - k * 9 * s)
        ctx.set_line_width(22 * s)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        src(ctx, BLACK)
        ctx.stroke_preserve()
        ctx.set_line_width(14 * s)
        src(ctx, col)
        ctx.stroke()
        ball(ctx, x, y - 34 * s, 46 * s, col, lw=5)
        face(ctx, x, y - 30 * s, s * 0.9, talk, t, lashes=(kind == "xist"))
        if kind == "xist":  # a bow
            for sx in (-1, 1):
                ctx.new_path()
                ctx.move_to(x, y - 78 * s)
                ctx.line_to(x + sx * 30 * s, y - 96 * s)
                ctx.line_to(x + sx * 30 * s, y - 64 * s)
                ctx.close_path()
                src(ctx, hexc("#ffd23f"))
                ctx.fill_preserve()
                ctx.set_line_width(3.5)
                src(ctx, BLACK)
                ctx.stroke()
    elif kind == "aza":
        legs(ctx, x, y + 46 * s, s, col, t)
        pts = [(x + 58 * s * math.sin(i * math.pi / 3), y - 58 * s * math.cos(i * math.pi / 3)) for i in range(6)]
        ctx.new_path()
        for p in pts:
            ctx.line_to(*p)
        ctx.close_path()
        g = cairo.LinearGradient(x - 58 * s, y - 58 * s, x + 58 * s, y + 58 * s)
        g.add_color_stop_rgb(0, *mix(col, WHITE, 0.4))
        g.add_color_stop_rgb(1, *col)
        ctx.set_source(g)
        ctx.fill_preserve()
        ctx.set_line_width(5)
        src(ctx, BLACK)
        ctx.stroke()
        # nitrogen at ring position 5 (the disguise: looks like cytosine)
        px, py = pts[4]
        circle(ctx, px, py, 14 * s, hexc("#ffd23f"), lw=3)
        text(ctx, "N", px, py, 17 * s, "dela", fill=BLACK)
        face(ctx, x, y + 4 * s, s, talk, t, mask=True)
    if name:
        sub = M["sub"]
        text(ctx, M["name"], x, y + 98 * s, 24 * s, "zen", fill=WHITE, stroke=BLACK, sw=6 * s)
        text(ctx, sub, x, y + 124 * s, 15 * s, "zen", fill=BLACK, stroke=WHITE, sw=4 * s)
    if alpha < 1:
        ctx.pop_group_to_source()
        ctx.paint_with_alpha(alpha)


# ── 誤解（ゴカイ）: a purple sea-worm of misunderstanding ──────────────────────────────────────
def gokai(ctx, x, y, s, t, talk=0.0, hurt=0.0, alpha=1.0, crack=0.0):
    if alpha < 1:
        ctx.push_group()
    rnd = random.Random(7)
    shake = hurt * 10
    x += math.sin(t * 60) * shake
    # body: segments along a swaying curve, rising from below
    segs = []
    for i in range(11):
        k = i / 10
        segs.append((x + math.sin(t * 2.2 + k * 4) * 40 * s * (1 - k * 0.4) + k * 60 * s,
                     y + 280 * s - k * 300 * s, (44 - k * 8) * s))
    for i, (sx, sy, r) in enumerate(reversed(segs)):
        # parapodia: little bristly legs
        for side in (-1, 1):
            ctx.set_line_width(4)
            src(ctx, BLACK)
            ctx.move_to(sx + side * r * 0.9, sy)
            ctx.line_to(sx + side * (r + 22 * s), sy + math.sin(t * 9 + i) * 8 * s)
            ctx.stroke()
        g = cairo.RadialGradient(sx - r * 0.3, sy - r * 0.3, r * 0.1, sx, sy, r)
        g.add_color_stop_rgb(0, *mix(hexc("#d58bff"), WHITE, hurt * 0.8))
        g.add_color_stop_rgb(1, *mix(hexc("#5b1489"), WHITE, hurt * 0.8))
        ctx.arc(sx, sy, r, 0, 2 * math.pi)
        ctx.set_source(g)
        ctx.fill_preserve()
        ctx.set_line_width(5)
        src(ctx, BLACK)
        ctx.stroke()
    hx, hy, hr = segs[-1][0] + 10 * s, segs[-1][1] - 40 * s, 70 * s
    # head
    g = cairo.RadialGradient(hx - hr * 0.3, hy - hr * 0.4, hr * 0.1, hx, hy, hr * 1.1)
    g.add_color_stop_rgb(0, *mix(hexc("#e2a6ff"), WHITE, hurt * 0.8))
    g.add_color_stop_rgb(1, *mix(hexc("#4a0c78"), WHITE, hurt * 0.8))
    ctx.save()
    ctx.translate(hx, hy)
    ctx.scale(1.15, 1)
    ctx.arc(0, 0, hr, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source(g)
    ctx.fill_preserve()
    ctx.set_line_width(6)
    src(ctx, BLACK)
    ctx.stroke()
    # antennae
    for side in (-1, 1):
        ctx.set_line_width(5)
        ctx.move_to(hx + side * 30 * s, hy - hr * 0.8)
        ctx.curve_to(hx + side * 50 * s, hy - hr * 1.6, hx + side * 90 * s, hy - hr * 1.5 + math.sin(t * 5) * 10,
                     hx + side * 100 * s, hy - hr * 1.2)
        src(ctx, BLACK)
        ctx.stroke()
        circle(ctx, hx + side * 100 * s, hy - hr * 1.2, 9 * s, hexc("#ff2bd6"), lw=3)
    # angry glowing eyes
    for side in (-1, 1):
        ex, ey = hx + side * 30 * s, hy - 14 * s
        ctx.new_path()
        ctx.move_to(ex - side * 22 * s, ey - 16 * s)
        ctx.line_to(ex + side * 22 * s, ey - 2 * s)
        ctx.line_to(ex - side * 14 * s, ey + 10 * s)
        ctx.close_path()
        src(ctx, hexc("#fff200"))
        ctx.fill_preserve()
        ctx.set_line_width(4)
        src(ctx, BLACK)
        ctx.stroke()
        circle(ctx, ex, ey - 1 * s, 4 * s, hexc("#ff0033"), lw=0)
    # jagged mouth
    op = 10 + clamp(talk) * 26
    ctx.new_path()
    ctx.move_to(hx - 40 * s, hy + 22 * s)
    for i in range(9):
        ctx.line_to(hx - 40 * s + i * 10 * s, hy + 22 * s + (8 if i % 2 else 0) * s)
    ctx.line_to(hx + 40 * s, hy + 22 * s)
    ctx.line_to(hx + 30 * s, hy + (22 + op) * s)
    ctx.line_to(hx - 30 * s, hy + (22 + op) * s)
    ctx.close_path()
    src(ctx, hexc("#2a0033"))
    ctx.fill_preserve()
    ctx.set_line_width(4)
    src(ctx, BLACK)
    ctx.stroke()
    ctx.new_path()
    for i in range(8):
        bx = hx - 36 * s + i * 10 * s
        ctx.move_to(bx, hy + 22 * s)
        ctx.line_to(bx + 5 * s, hy + 34 * s)
        ctx.line_to(bx + 10 * s, hy + 22 * s)
    src(ctx, WHITE)
    ctx.fill()
    # the kanji on its forehead
    text(ctx, "誤解", hx, hy - 50 * s, 34 * s, "dela", fill=hexc("#ff2bd6"), stroke=BLACK, sw=6, outer=WHITE, ow=12)
    if crack > 0:
        ctx.set_line_width(4)
        src(ctx, WHITE)
        for i in range(int(3 + crack * 6)):
            a = rnd.uniform(0, 2 * math.pi)
            px, py = hx, hy
            ctx.move_to(px, py)
            for k in range(4):
                a += rnd.uniform(-0.6, 0.6)
                px += math.cos(a) * hr * 0.35 * crack
                py += math.sin(a) * hr * 0.35 * crack
                ctx.line_to(px, py)
            ctx.stroke()
    if alpha < 1:
        ctx.pop_group_to_source()
        ctx.paint_with_alpha(alpha)
    return hx, hy - hr
