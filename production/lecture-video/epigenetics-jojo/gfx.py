"""Drawing helpers on top of pycairo: colours, outlined manga lettering, arrows, molecules."""
import math
import cairo

W, H = 1280, 720
PIC_H = 630            # picture area; the subtitle band sits below it

FONTS = {
    "zen": ("Zen Kaku Gothic New", cairo.FONT_WEIGHT_BOLD),
    "dela": ("Dela Gothic One", cairo.FONT_WEIGHT_NORMAL),
    "reggae": ("Reggae One", cairo.FONT_WEIGHT_NORMAL),
}
BLACK = (0.06, 0.04, 0.10)
WHITE = (1, 1, 1)


def hexc(h, a=None):
    h = h.lstrip("#")
    c = tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return c if a is None else c + (a,)


def mix(a, b, k):
    return tuple(a[i] + (b[i] - a[i]) * k for i in range(3))


def src(ctx, c, a=1.0):
    if len(c) == 4:
        ctx.set_source_rgba(*c)
    else:
        ctx.set_source_rgba(c[0], c[1], c[2], a)


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_io(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def back_out(x, s=2.2):
    x = clamp(x)
    x -= 1
    return x * x * ((s + 1) * x + s) + 1


def pop(t, dur=0.35):
    """0 → overshoot → 1"""
    return back_out(t / dur) if t < dur else 1.0


def font(ctx, name, size):
    fam, wt = FONTS[name]
    ctx.select_font_face(fam, cairo.FONT_SLANT_NORMAL, wt)
    ctx.set_font_size(size)


def text_w(ctx, s, name, size):
    font(ctx, name, size)
    return ctx.text_extents(s).x_advance


def text(ctx, s, x, y, size, name="zen", fill=BLACK, stroke=None, sw=0.0, outer=None, ow=0.0,
         align="center", rot=0.0, alpha=1.0, scale=1.0, shadow=None):
    """outlined lettering; (x, y) is the visual centre (align=center) or left/right edge, middle height"""
    if not s or scale <= 0.001 or alpha <= 0.001 or size <= 0.5:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(scale, scale)
    font(ctx, name, size)
    adv = ctx.text_extents(s).x_advance
    ox = -adv / 2 if align == "center" else (-adv if align == "right" else 0)
    oy = size * 0.36
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    if shadow:
        ctx.move_to(ox + shadow[0], oy + shadow[1])
        ctx.text_path(s)
        src(ctx, shadow[2], alpha)
        if ow or sw:
            ctx.set_line_width(max(ow, sw))
            ctx.stroke_preserve()
        ctx.fill()
    ctx.move_to(ox, oy)
    ctx.text_path(s)
    if outer is not None and ow > 0:
        src(ctx, outer, alpha)
        ctx.set_line_width(ow)
        ctx.stroke_preserve()
    if stroke is not None and sw > 0:
        src(ctx, stroke, alpha)
        ctx.set_line_width(sw)
        ctx.stroke_preserve()
    if isinstance(fill, cairo.Pattern):
        ctx.set_source(fill)
    else:
        src(ctx, fill, alpha)
    ctx.fill()
    ctx.restore()


def rrect(ctx, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()


def box(ctx, x, y, w, h, fill, r=12, lw=4, line=BLACK, alpha=1.0, drop=5):
    if drop:
        rrect(ctx, x + drop, y + drop, w, h, r)
        src(ctx, BLACK, 0.85 * alpha)
        ctx.fill()
    rrect(ctx, x, y, w, h, r)
    src(ctx, fill, alpha)
    ctx.fill_preserve()
    ctx.set_line_width(lw)
    src(ctx, line, alpha)
    ctx.stroke()


def label_box(ctx, s, x, y, size, fill, fg=BLACK, pad=12, lw=3.5, alpha=1.0, name="zen", r=10):
    w = text_w(ctx, s, name, size) + pad * 2
    h = size + pad * 1.2
    box(ctx, x - w / 2, y - h / 2, w, h, fill, r=r, lw=lw, alpha=alpha, drop=4)
    text(ctx, s, x, y, size, name, fill=fg, alpha=alpha)
    return w


def circle(ctx, x, y, r, fill, lw=4, line=BLACK, alpha=1.0):
    r = max(r, 0.0)
    ctx.arc(x, y, r, 0, 2 * math.pi)
    src(ctx, fill, alpha)
    ctx.fill_preserve()
    if lw:
        ctx.set_line_width(lw)
        src(ctx, line, alpha)
        ctx.stroke()
    else:
        ctx.new_path()


def ball(ctx, x, y, r, base, lw=4, alpha=1.0):
    """shaded sphere with a hard manga highlight"""
    if r <= 0.5:
        return
    g = cairo.RadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05)
    g.add_color_stop_rgba(0, *mix(base, WHITE, 0.55), alpha)
    g.add_color_stop_rgba(0.55, *base, alpha)
    g.add_color_stop_rgba(1, *mix(base, BLACK, 0.35), alpha)
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.set_source(g)
    ctx.fill_preserve()
    ctx.set_line_width(lw)
    src(ctx, BLACK, alpha)
    ctx.stroke()
    ctx.save()
    ctx.translate(x - r * 0.38, y - r * 0.42)
    ctx.rotate(-0.6)
    ctx.scale(r * 0.28, r * 0.14)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    src(ctx, WHITE, 0.9 * alpha)
    ctx.fill()


def arrow(ctx, x1, y1, x2, y2, color=BLACK, lw=7, head=20, alpha=1.0, outline=True):
    a = math.atan2(y2 - y1, x2 - x1)
    bx, by = x2 - math.cos(a) * head * 0.9, y2 - math.sin(a) * head * 0.9
    pts = [(x2, y2), (x2 - head * math.cos(a - 0.5), y2 - head * math.sin(a - 0.5)),
           (x2 - head * math.cos(a + 0.5), y2 - head * math.sin(a + 0.5))]
    for pass_ in ((0, 1) if outline else (1,)):
        c = BLACK if pass_ == 0 else color
        w = lw + 5 if pass_ == 0 else lw
        if pass_ == 0 and color == BLACK:
            continue
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_width(w)
        src(ctx, c, alpha)
        ctx.move_to(x1, y1)
        ctx.line_to(bx, by)
        ctx.stroke()
        ctx.move_to(*pts[0])
        ctx.line_to(*pts[1])
        ctx.line_to(*pts[2])
        ctx.close_path()
        if pass_ == 0:
            ctx.set_line_width(5)
            ctx.set_line_join(cairo.LINE_JOIN_ROUND)
            ctx.stroke_preserve()
        ctx.fill()


def star_burst(ctx, x, y, r1, r2, n, fill, rot=0.0, lw=5, alpha=1.0, jitter=None):
    ctx.new_path()
    for i in range(n * 2):
        rr = r2 if i % 2 == 0 else r1
        if jitter:
            rr *= jitter[i % len(jitter)]
        a = rot + i * math.pi / n
        ctx.line_to(x + math.cos(a) * rr, y + math.sin(a) * rr * 0.72)
    ctx.close_path()
    src(ctx, fill, alpha)
    ctx.fill_preserve()
    ctx.set_line_width(lw)
    ctx.set_line_join(cairo.LINE_JOIN_MITER)
    src(ctx, BLACK, alpha)
    ctx.stroke()


def lollipop(ctx, x, y, filled, h=34, r=11, alpha=1.0):
    """CpG mark: white = unmethylated, black = methylated"""
    ctx.set_line_width(4)
    src(ctx, BLACK, alpha)
    ctx.move_to(x, y)
    ctx.line_to(x, y - h)
    ctx.stroke()
    circle(ctx, x, y - h - r, r, BLACK if filled else WHITE, lw=4, alpha=alpha)


def ch3_flag(ctx, x, y, s=1.0, alpha=1.0, col=None):
    col = col or hexc("#38c6ff")
    ctx.set_line_width(3.5 * s)
    src(ctx, BLACK, alpha)
    ctx.move_to(x, y)
    ctx.line_to(x, y - 26 * s)
    ctx.stroke()
    ball(ctx, x, y - 26 * s - 13 * s, 14 * s, col, lw=3, alpha=alpha)
    text(ctx, "Me", x, y - 39 * s, 13 * s, "dela", fill=WHITE, stroke=BLACK, sw=3, alpha=alpha)


def tag(ctx, s, x, y, r, col, alpha=1.0, size=None):
    ball(ctx, x, y, r, col, lw=3.5, alpha=alpha)
    text(ctx, s, x, y, size or r * 0.9, "dela", fill=WHITE, stroke=BLACK, sw=3, alpha=alpha)


def nucleosome(ctx, x, y, r, col, alpha=1.0, tilt=-0.35, dna=hexc("#2b6cff")):
    """a histone spool seen from the side, DNA wrapped across it"""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.scale(0.62, 1.0)
    g = cairo.LinearGradient(-r, 0, r, 0)
    g.add_color_stop_rgba(0, *mix(col, BLACK, 0.25), alpha)
    g.add_color_stop_rgba(0.45, *mix(col, WHITE, 0.35), alpha)
    g.add_color_stop_rgba(1, *mix(col, BLACK, 0.15), alpha)
    ctx.arc(0, 0, r, 0, 2 * math.pi)
    ctx.set_source(g)
    ctx.fill_preserve()
    ctx.restore()
    ctx.set_line_width(4)
    src(ctx, BLACK, alpha)
    ctx.stroke()
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.set_line_width(max(3, r * 0.16))
    src(ctx, dna, alpha)
    for k in (-0.45, 0.0, 0.45):
        ctx.move_to(-r * 0.62, r * k - r * 0.22)
        ctx.line_to(r * 0.62, r * k + r * 0.22)
        ctx.stroke()
    ctx.restore()


def chromosome(ctx, x, y, h, col, w=26, alpha=1.0, cen=0.42, band=None, band_col=None, rot=0.0):
    """one chromatid pair (X shape simplified to a pinched rod)"""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    top = -h / 2
    cy = top + h * cen
    for side in (-1, 1):
        ctx.new_path()
        ox = side * w * 0.52
        rrect(ctx, ox - w / 2, top, w, cy - top - 4, w / 2)
        rrect(ctx, ox - w / 2, cy + 4, w, h / 2 - cy - 4, w / 2)
        src(ctx, col, alpha)
        ctx.fill_preserve()
        ctx.set_line_width(4)
        src(ctx, BLACK, alpha)
        ctx.stroke()
        if band:
            y0, y1 = band
            ctx.rectangle(ox - w / 2 + 2, cy + 4 + (h / 2 - cy) * y0, w - 4, (h / 2 - cy) * (y1 - y0))
            src(ctx, band_col or hexc("#ffd23f"), alpha)
            ctx.fill()
    ctx.restore()


def dna_ladder(ctx, x1, x2, y, amp=26, turns=3.0, phase=0.0, c1=hexc("#2b6cff"), c2=hexc("#ff4fa3"), lw=7,
               alpha=1.0, rungs=True):
    n = 120
    pts1, pts2 = [], []
    for i in range(n + 1):
        u = i / n
        x = x1 + (x2 - x1) * u
        a = u * turns * 2 * math.pi + phase
        pts1.append((x, y + math.sin(a) * amp))
        pts2.append((x, y - math.sin(a) * amp))
    if rungs:
        ctx.set_line_width(3)
        for i in range(0, n + 1, 4):
            src(ctx, (0.25, 0.2, 0.35), alpha * 0.8)
            ctx.move_to(*pts1[i])
            ctx.line_to(*pts2[i])
            ctx.stroke()
    for pts, c in ((pts1, c1), (pts2, c2)):
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
        ctx.set_line_width(lw + 4)
        src(ctx, BLACK, alpha)
        ctx.stroke_preserve()
        ctx.set_line_width(lw)
        src(ctx, c, alpha)
        ctx.stroke()


def cell(ctx, x, y, r, col, alpha=1.0, nucleus=True, wobble=0.0, t=0.0):
    ctx.new_path()
    for i in range(37):
        a = i / 36 * 2 * math.pi
        rr = r * (1 + wobble * math.sin(a * 3 + t * 2))
        ctx.line_to(x + math.cos(a) * rr, y + math.sin(a) * rr)
    ctx.close_path()
    g = cairo.RadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
    g.add_color_stop_rgba(0, *mix(col, WHITE, 0.6), alpha)
    g.add_color_stop_rgba(1, *col, alpha)
    ctx.set_source(g)
    ctx.fill_preserve()
    ctx.set_line_width(4)
    src(ctx, BLACK, alpha)
    ctx.stroke()
    if nucleus:
        circle(ctx, x + r * 0.08, y + r * 0.05, r * 0.36, mix(col, BLACK, 0.3), lw=3, alpha=alpha)


def hexagon_ring(ctx, x, y, r, labels, col, alpha=1.0, hl=None):
    """6-membered ring, vertex 0 at the top, clockwise; labels per vertex (None = carbon, no letter)"""
    pts = [(x + r * math.sin(i * math.pi / 3), y - r * math.cos(i * math.pi / 3)) for i in range(6)]
    ctx.new_path()
    for p in pts:
        ctx.line_to(*p)
    ctx.close_path()
    src(ctx, col, alpha * 0.35)
    ctx.fill_preserve()
    ctx.set_line_width(5)
    src(ctx, BLACK, alpha)
    ctx.stroke()
    for i, lab in enumerate(labels):
        px, py = pts[i]
        if hl is not None and i == hl:
            circle(ctx, px, py, 17, hexc("#ffd23f"), lw=3, alpha=alpha)
        if lab:
            circle(ctx, px, py, 14, WHITE, lw=0, alpha=alpha)
            text(ctx, lab, px, py, 22, "dela", fill=BLACK, alpha=alpha)
    return pts
