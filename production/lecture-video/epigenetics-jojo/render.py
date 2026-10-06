#!/usr/bin/env python3
"""
JoJo-style bright lecture film「エピジェネティクス」: timeline, backgrounds, effects, subtitles and the frame renderer.

  python3 render.py timeline            # audio/lines.json → timeline.json (needs tts.py first)
  python3 render.py still 12.5 [out.png]  # one frame
  python3 render.py video [--jobs 4]     # out/picture.mp4 (silent)

Everything is drawn with pycairo; fonts: Zen Kaku Gothic New / Dela Gothic One / Reggae One (SIL OFL,
tools/lecture-video/fonts — install them for fontconfig, see README).
"""
import json, math, os, random, subprocess, sys, wave
from pathlib import Path

import cairo
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from gfx import (SafeContext, W, H, PIC_H, BLACK, WHITE, hexc, mix, src, text, text_w, font, clamp, ease_out, ease_io, back_out,
                 pop, star_burst, rrect, box)
from characters import POSES, lerp_pose, professor, mascot, gokai, MASCOT
from diagrams import DIAGRAMS, CW, CH, clip_surface, clip3d

FPS = 24
SR = 48000
CARD = (652, 74)          # top-left of the diagram card
GAP = 0.45

PALETTES = {
    "gold":    [("#fff7c2", "#ffc21f", "#ff7a00"), ("#fffbe0", "#ffd84a", "#ff9d00")],
    "sky":     [("#effcff", "#57c8ff", "#7a5cff"), ("#fff2fb", "#ff86d9", "#56b8ff"), ("#f2fff8", "#4fe3b0", "#3a86ff")],
    "lime":    [("#fbffe8", "#b4f04a", "#00b894"), ("#fffbe6", "#ffd23f", "#2ecf6f"), ("#f0fff4", "#6ee7b7", "#ff9f1c")],
    "pink":    [("#fff1f8", "#ff76bb", "#ffb347"), ("#fff6ea", "#ffa94d", "#ff4fa3"), ("#f8efff", "#c77dff", "#ff6fb5")],
    "cyan":    [("#ecfffd", "#38e0d0", "#3a86ff"), ("#f1f7ff", "#62a8ff", "#a06bff"), ("#effff6", "#4fe3a0", "#00b4d8")],
    "dark":    [("#5b1a86", "#24063c", "#07000f")],
    "rainbow": [("#fff8e8", "#ffb347", "#ff4fa3"), ("#eefcff", "#56ccf2", "#9b51e0"), ("#f3ffe8", "#9be15d", "#00b894"),
                ("#fff0f5", "#ff7eb3", "#ff9a3c")],
    "split":   [("#eef5ff", "#5b9cff", "#ff5f8f"), ("#fff0f5", "#ff8fb1", "#5b9cff")],
    "violet":  [("#f7efff", "#b77bff", "#ff6fb5"), ("#fff0fa", "#ff8fd0", "#8b5cf6")],
    "orange":  [("#fff6e6", "#ffa51f", "#ff4f4f"), ("#fffbe6", "#ffcf3f", "#ff7a00")],
    "teal":    [("#e9fffa", "#21c7a8", "#ffd23f"), ("#f0fbff", "#4cc9f0", "#2ec4b6")],
    "red":     [("#fff2e8", "#ff5a3a", "#ffc21f"), ("#fff7e0", "#ffb020", "#ff3b5c")],
    "green":   [("#f3ffe8", "#5edc6a", "#ffd23f"), ("#effff9", "#38d9a9", "#94d82d")],
}
DARK = PALETTES["dark"][0]
SPEED_COLS = [hexc(c) for c in ("#ff3b5c", "#ffd23f", "#38c6ff", "#9dff5a", "#ff8a1f", "#b06bff", "#ffffff")]


# ── timeline ────────────────────────────────────────────────────────────────
def load_script():
    return json.load(open(HERE / "script.json", encoding="utf-8"))


def build_timeline():
    S = load_script()
    rows = json.load(open(HERE / "audio" / "lines.json", encoding="utf-8"))
    t, n, scenes = 0.0, 0, []
    for si, sc in enumerate(S["scenes"]):
        lead = 2.6 if si == 0 else 0.9
        start = t
        t += lead
        lines = []
        for ln in sc["lines"]:
            r = rows[n]
            d = r["seconds"]
            L = dict(ln, idx=n, start=round(t, 3), dur=d, file=r["file"])
            gap = GAP + (0.25 if ln.get("big") else 0) + (2.2 if ln.get("title") else 0) + (5.5 if ln.get("finale") else 0)
            if ln["who"] == "gokai" and ln.get("enemy") in ("flee", "explode"):
                gap += 0.4
            t += d + gap
            L["end"] = round(t, 3)
            lines.append(L)
            n += 1
        scenes.append(dict(id=sc["id"], chapter=sc["chapter"], diagram=sc["diagram"], bg=sc["bg"],
                           enemy=sc.get("enemy", False), start=round(start, 3), end=round(t, 3), lines=lines))
    T = dict(fps=FPS, total=round(t + 0.5, 3), scenes=scenes)
    json.dump(T, open(HERE / "timeline.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return T


def envelopes(T):
    """per-line mouth envelope sampled at FPS"""
    env = {}
    for sc in T["scenes"]:
        for L in sc["lines"]:
            with wave.open(str(HERE / "audio" / "lines" / L["file"])) as w:
                x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
            hop = SR // FPS
            n = len(x) // hop + 1
            e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-9) for i in range(n)])
            e = np.clip(e / (np.percentile(e, 90) + 1e-6), 0, 1.2)
            env[L["idx"]] = e
    return env


# ── state at time t ─────────────────────────────────────────────────────────
class State:
    pass


def state_at(T, t):
    S = State()
    S.t = t
    sc = T["scenes"][-1]
    for s in T["scenes"]:
        if s["start"] <= t < s["end"]:
            sc = s
            break
    S.scene = sc
    S.si = T["scenes"].index(sc)
    lines = sc["lines"]
    cur, prev = None, None
    for i, L in enumerate(lines):
        if t >= L["start"]:
            cur, prev = L, (lines[i - 1] if i else None)
    S.line, S.prev = cur, prev
    S.lt = t - cur["start"] if cur else -1.0
    S.st = t - sc["start"]
    # diagram step and how long it has been showing
    step, since = 0, sc["start"]
    for L in lines:
        if L["start"] <= t:
            if L.get("step", step) != step:
                step, since = L.get("step", step), L["start"]
    S.step, S.step_t = step, t - since
    # enemy track
    S.enemy = None
    if sc["enemy"]:
        st, st_start, active = None, 0, False
        for L in lines:
            if L["start"] > t:
                break
            e = L.get("enemy")
            if e == "enter":
                active, st, st_start, S.enemy_since = True, "enter", L["start"], L["start"]
            elif e and active:
                st, st_start = e, L["start"]
            if e in ("flee", "explode"):
                S.enemy_end = L["start"]
        if active:
            S.enemy = st
            S.enemy_lt = t - st_start
            S.enemy_line = cur
    return S


def enemy_on(S):
    if S.enemy is None:
        return 0.0
    if S.enemy in ("flee", "explode"):
        return clamp(1 - (S.enemy_lt - 0.5) / 0.8)
    return 1.0


# ── backgrounds ─────────────────────────────────────────────────────────────
_halftone = {}


def halftone(c):
    key = c
    if key in _halftone:
        return _halftone[key]
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, PIC_H)
    x = cairo.Context(s)
    step = 22
    for j in range(PIC_H // step + 2):
        for i in range(W // step + 2):
            px, py = i * step + (step / 2 if j % 2 else 0), j * step
            dx, dy = (px - W / 2) / (W / 2), (py - PIC_H / 2) / (PIC_H / 2)
            r = max(0, (math.hypot(dx, dy) - 0.55)) * 11
            if r > 0.4:
                x.arc(px, py, min(r, 9), 0, 2 * math.pi)
    src(x, c, 0.28)
    x.fill()
    _halftone[key] = s
    return s


def background(ctx, pal, t, frame, focus=(780, 300), dark=False, gold=0.0):
    c1, c2, c3 = (hexc(c) for c in pal)
    g = cairo.RadialGradient(focus[0], focus[1], 20, focus[0], focus[1], 900)
    g.add_color_stop_rgb(0, *c1)
    g.add_color_stop_rgb(0.35, *c2)
    g.add_color_stop_rgb(1, *c3)
    ctx.rectangle(0, 0, W, PIC_H)
    ctx.set_source(g)
    ctx.fill()
    # rotating sunburst
    n = 22
    rot = t * 0.12
    for i in range(n):
        if i % 2:
            continue
        a0, a1 = rot + i * 2 * math.pi / n, rot + (i + 1) * 2 * math.pi / n
        ctx.move_to(*focus)
        ctx.line_to(focus[0] + math.cos(a0) * 1600, focus[1] + math.sin(a0) * 1600)
        ctx.line_to(focus[0] + math.cos(a1) * 1600, focus[1] + math.sin(a1) * 1600)
        ctx.close_path()
    src(ctx, WHITE if not dark else hexc("#b14dff"), 0.16 if not dark else 0.10)
    ctx.fill()
    ctx.set_source_surface(halftone(c3 if not dark else hexc("#000000")), 0, 0)
    ctx.paint()
    # colourful speed lines (集中線), re-drawn every 2 frames for the manga jitter
    rnd = random.Random(frame // 2)
    for i in range(110):
        a = rnd.uniform(0, 2 * math.pi)
        w = rnd.uniform(0.004, 0.016)
        r0 = rnd.uniform(330, 520)
        col = (BLACK if rnd.random() < 0.6 else hexc("#b14dff")) if dark else SPEED_COLS[rnd.randrange(len(SPEED_COLS))]
        ctx.move_to(focus[0] + math.cos(a) * r0, focus[1] + math.sin(a) * r0)
        ctx.line_to(focus[0] + math.cos(a - w) * 1500, focus[1] + math.sin(a - w) * 1500)
        ctx.line_to(focus[0] + math.cos(a + w) * 1500, focus[1] + math.sin(a + w) * 1500)
        ctx.close_path()
        src(ctx, col, 0.55 if not dark else 0.8)
        ctx.fill()
    if gold > 0:
        g = cairo.RadialGradient(300, 330, 10, 300, 330, 520)
        g.add_color_stop_rgba(0, 1, 1, 0.85, 0.95 * gold)
        g.add_color_stop_rgba(0.4, 1, 0.82, 0.2, 0.55 * gold)
        g.add_color_stop_rgba(1, 1, 0.7, 0, 0)
        ctx.rectangle(0, 0, W, PIC_H)
        ctx.set_source(g)
        ctx.fill()


def god_rays(ctx, x, y, t, k):
    if k <= 0:
        return
    for i in range(16):
        a = -math.pi / 2 + (i - 7.5) * 0.11 + math.sin(t * 0.7 + i) * 0.02
        w = 0.025 + 0.02 * math.sin(t * 2 + i * 1.7) ** 2
        ctx.move_to(x, y + 120)
        ctx.line_to(x + math.cos(a - w) * 900, y + math.sin(a - w) * 900)
        ctx.line_to(x + math.cos(a + w) * 900, y + math.sin(a + w) * 900)
        ctx.close_path()
    src(ctx, (1, 0.97, 0.7), 0.45 * k)
    ctx.fill()


def aura(ctx, drawfn, col, t, strength=1.0, rings=((14, 0.22), (26, 0.14), (40, 0.08))):
    """draw something with a glowing outline: dilate its silhouette by repeated masked offsets"""
    ctx.push_group()
    drawfn()
    pat = ctx.pop_group()
    for r, a in rings:
        for k in range(10):
            ang = k * math.pi / 5 + t * 0.6
            ctx.save()
            ctx.translate(math.cos(ang) * r, math.sin(ang) * r - r * 0.3)
            src(ctx, col, a * strength)
            ctx.mask(pat)
            ctx.restore()
    ctx.set_source(pat)
    ctx.paint()


def flames(ctx, x, y0, y1, w, t, col, alpha=1.0):
    rnd = random.Random(int(t * 12))
    for i in range(16):
        fx = x + rnd.uniform(-w, w)
        fy = rnd.uniform(y0, y1)
        h = rnd.uniform(40, 110)
        ctx.move_to(fx - 14, fy)
        ctx.curve_to(fx - 10, fy - h * 0.5, fx + rnd.uniform(-20, 20), fy - h * 0.8, fx, fy - h)
        ctx.curve_to(fx + 6, fy - h * 0.6, fx + 14, fy - h * 0.3, fx + 14, fy)
        ctx.close_path()
    src(ctx, col, 0.35 * alpha)
    ctx.fill()


def gokai3d(ctx, ex, ey, es, t, talk=0.0, hurt=0.0, alpha=1.0, crack=0.0):
    """the Blender worm (out/blender/gokai, 520×640, head centre at about (305, 168)); 2D hit flash and cracks on top"""
    sf = clip_surface("gokai", t)
    if sf is None:
        return False
    k = 0.75 * es
    hx, hy = ex + 70 * es + math.sin(t * 60) * hurt * 10, ey - 60 * es
    ctx.save()
    ctx.translate(hx, hy)
    ctx.scale(k * (1 - 0.03 * talk), k * (1 + 0.05 * talk))
    ctx.translate(-305, -168)
    ctx.push_group()
    ctx.set_source_surface(sf, 0, 0)
    ctx.paint()
    if hurt > 0:
        ctx.set_source_rgba(1, 1, 1, 0.85 * hurt)
        ctx.mask_surface(sf, 0, 0)
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)
    ctx.restore()
    if crack > 0 and alpha > 0:
        rnd = random.Random(7)
        ctx.set_line_width(4)
        src(ctx, WHITE, alpha)
        for i in range(int(3 + crack * 6)):
            a = rnd.uniform(0, 2 * math.pi)
            px, py = hx, hy
            ctx.move_to(px, py)
            for _ in range(4):
                a += rnd.uniform(-0.6, 0.6)
                px += math.cos(a) * 30 * es * crack
                py += math.sin(a) * 30 * es * crack
                ctx.line_to(px, py)
            ctx.stroke()
    return True


# ── lettering effects ───────────────────────────────────────────────────────
def onoma(ctx, s, t, lt, seed, dark=False, area=(0, 0, W, PIC_H), n=6):
    """JoJo-style floating 'ゴ' / 'ド' glyphs"""
    if not s:
        return
    ch = s[0]
    rnd = random.Random(seed)
    x0, y0, x1, y1 = area
    for i in range(n):
        k = clamp((lt - i * 0.12) / 0.25)
        if k <= 0:
            continue
        x = rnd.uniform(x0 + 40, x1 - 40)
        y = rnd.uniform(y0 + 60, y1 - 60)
        size = rnd.uniform(56, 96)
        jit = 3 if int(t * 24) % 2 else -3
        text(ctx, ch, x + jit, y - lt * 14, size * back_out(k), "reggae",
             fill=hexc("#b14dff") if not dark else hexc("#ff2bd6"), stroke=BLACK, sw=7, outer=WHITE, ow=15,
             rot=rnd.uniform(-0.3, 0.3), alpha=clamp(1.6 - lt * 0.25))


def big_word(ctx, s, lt, dur, col=None, cx=820, cy=300, dark=False):
    """ドーン！ — the keyword fills the screen, then settles as a banner"""
    if not s or lt < 0:
        return
    col = hexc(col) if col else hexc("#ff2b6a")
    k = back_out(lt / 0.28, 2.6) if lt < 0.28 else 1.0
    settle = ease_io((lt - 0.9) / 0.5)
    size = min(120, 600 / max(1, len(s)))
    scale = (2.4 - 1.4 * k) * (1 - 0.48 * settle)
    x = cx + (950 - cx) * settle
    y = cy + (588 - cy) * settle
    a = clamp(1 - (lt - dur - 0.3) / 0.3)
    if a <= 0:
        return
    shake = (1 - clamp(lt / 0.5)) * 10
    x += math.sin(lt * 90) * shake
    if settle < 0.99:
        ctx.save()
        star_burst(ctx, x, y, 140 * scale * 0.9, 230 * scale * 0.9, 18, hexc("#fff200"), rot=lt * 0.5, lw=6,
                   alpha=a * (1 - settle), jitter=[1, 0.82, 1.1, 0.9, 1.05])
        ctx.restore()
    g = cairo.LinearGradient(0, y - size * scale / 2, 0, y + size * scale / 2)
    g.add_color_stop_rgb(0, *mix(col, WHITE, 0.45))
    g.add_color_stop_rgb(0.5, *col)
    g.add_color_stop_rgb(1, *mix(col, BLACK, 0.25))
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-0.08)
    ctx.scale(scale, scale)
    ctx.translate(-x, -y)
    text(ctx, s, x, y, size, "dela", fill=g, stroke=BLACK, sw=10, outer=WHITE, ow=22, alpha=a,
         shadow=(8, 8, BLACK))
    ctx.restore()


def bubble(ctx, s, x, y, lt, dur, col=WHITE, tail=(-1, 1), spiky=True):
    if not s or lt < 0.1:
        return
    k = pop(lt - 0.1, 0.25)
    a = clamp(1 - (lt - dur) / 0.3)
    if a <= 0:
        return
    size = 30
    w = text_w(ctx, s, "reggae", size) + 50
    h = 74
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(k, k)
    rnd = random.Random(len(s))
    ctx.new_path()
    n = 26
    for i in range(n):
        ang = i * 2 * math.pi / n
        rr = (1.0 if i % 2 == 0 else 0.84) if spiky else 1.0
        rr *= rnd.uniform(0.95, 1.05)
        ctx.line_to(math.cos(ang) * w / 2 * rr * 1.05, math.sin(ang) * h / 2 * rr * 1.2)
    ctx.close_path()
    src(ctx, col, a)
    ctx.fill_preserve()
    ctx.set_line_width(5)
    src(ctx, BLACK, a)
    ctx.stroke()
    # tail
    ctx.move_to(tail[0] * w * 0.15, h * 0.4)
    ctx.line_to(tail[0] * w * 0.42, h * 0.95 * tail[1])
    ctx.line_to(tail[0] * w * 0.02, h * 0.5)
    src(ctx, col, a)
    ctx.fill_preserve()
    src(ctx, BLACK, a)
    ctx.stroke()
    text(ctx, s, 0, 0, size, "reggae", fill=BLACK, alpha=a)
    ctx.restore()


# ── subtitles ───────────────────────────────────────────────────────────────
NO_HEAD = set("、。！？…ッっャュョァィゥェォー」』）)")


def wrap(ctx, s, width, size):
    font(ctx, "zen", size)
    lines, cur = [], ""
    for ch in s:
        if ctx.text_extents(cur + ch).x_advance > width and cur:
            if ch in NO_HEAD:
                cur += ch
                continue
            lines.append(cur)
            cur = ch.lstrip() if ch != " " else ""
        else:
            cur += ch
    if cur:
        lines.append(cur)
    return lines


def subtitle(ctx, L, voices, alpha=1.0):
    g = cairo.LinearGradient(0, PIC_H, 0, H)
    g.add_color_stop_rgb(0, *hexc("#1b1035"))
    g.add_color_stop_rgb(1, *hexc("#0c0820"))
    ctx.rectangle(0, PIC_H, W, H - PIC_H)
    ctx.set_source(g)
    ctx.fill()
    ctx.rectangle(0, PIC_H, W, 5)
    src(ctx, hexc("#ffcf1f"))
    ctx.fill()
    if not L or alpha <= 0:
        return
    v = voices[L["who"]]
    col = hexc(v["color"])
    # speaker plate
    nw = text_w(ctx, v["name"], "zen", 19) + 26
    rrect(ctx, 18, PIC_H + 24, nw, 40, 10)
    src(ctx, col, alpha)
    ctx.fill_preserve()
    ctx.set_line_width(3)
    src(ctx, WHITE, alpha)
    ctx.stroke()
    text(ctx, v["name"], 18 + nw / 2, PIC_H + 44, 19, "zen", fill=BLACK, alpha=alpha)
    x0 = 18 + nw + 18
    width = W - x0 - 24
    size = 29
    lines = wrap(ctx, L["text"], width, size)
    if len(lines) > 2:
        size = 25
        lines = wrap(ctx, L["text"], width, size)
    keys = L.get("keys", [])
    hl = [False] * len(L["text"])
    for k in keys:
        p = L["text"].find(k)
        if p >= 0:
            for j in range(p, p + len(k)):
                hl[j] = True
    pos = 0
    lh = size + 8
    y0 = PIC_H + 45 - (len(lines) - 1) * lh / 2
    font(ctx, "zen", size)
    for li, line in enumerate(lines):
        x = x0
        y = y0 + li * lh
        while pos < len(L["text"]) and L["text"][pos] != line[0]:
            pos += 1
        for ch in line:
            c = hexc("#ffe14d") if pos < len(hl) and hl[pos] else WHITE
            ctx.move_to(x, y + size * 0.36)
            ctx.text_path(ch)
            ctx.set_line_width(5)
            src(ctx, BLACK, alpha)
            ctx.stroke_preserve()
            src(ctx, c, alpha)
            ctx.fill()
            x += ctx.text_extents(ch).x_advance
            pos += 1


# ── the frame ───────────────────────────────────────────────────────────────
class Film:
    def __init__(self):
        self.S = load_script()
        self.T = json.load(open(HERE / "timeline.json", encoding="utf-8"))
        self.env = envelopes(self.T)
        self.voices = self.S["voices"]
        self.title = self.S["title"]

    def talk(self, L, lt, who):
        if not L or L["who"] != who or lt < 0:
            return 0.0
        e = self.env[L["idx"]]
        i = int(lt * FPS)
        return float(e[i]) if 0 <= i < len(e) else 0.0

    def frame(self, fi):
        t = fi / FPS
        S = state_at(self.T, t)
        surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
        ctx = SafeContext(surf)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        L, lt = S.line, S.lt
        sc = S.scene
        en = enemy_on(S)
        is_title = sc["id"] == "S01"
        finale = L is not None and L.get("finale")

        # camera: slow push-in per line + impact shake
        shake = 0.0
        if L:
            fx = L.get("fx", [])
            for f, at in (("don", 0.1), ("hit", 0.55 * L["dur"]), ("boom", (0.7 * L["dur"]) if L.get("enemy") == "defeat" else 0.05)):
                if f in fx and lt >= at:
                    shake = max(shake, (1 - clamp((lt - at) / 0.45)) * (16 if f == "boom" else 9))
        zoom = 1.0 + 0.025 * ease_io(clamp(lt / max(1.0, (L["end"] - L["start"]) if L else 1)))
        ctx.save()
        ctx.rectangle(0, 0, W, PIC_H)
        ctx.clip()
        ctx.translate(W / 2 + math.sin(t * 77) * shake, PIC_H / 2 + math.cos(t * 63) * shake)
        ctx.scale(zoom, zoom)
        ctx.translate(-W / 2, -PIC_H / 2)

        # background: a new palette with every line
        pals = PALETTES[sc["bg"]]
        li = (L["idx"] if L else 0)
        pal = pals[li % len(pals)]
        dark = sc["bg"] == "dark" or en > 0.5
        if dark:
            pal = DARK
        gold = 0.0
        if is_title:
            gold = clamp(1 - abs(S.st - 1.6) / 2.5) * 0.9 + 0.3
        background(ctx, pal, t, fi, dark=dark, gold=gold)
        if is_title:
            god_rays(ctx, 300, 260, t, clamp(S.st / 1.0))

        # diagram card
        cast = L.get("cast", []) if L else []
        show_card = sc["diagram"] != "none" and len(cast) < 3 and not finale
        if show_card:
            card_in = ease_out(S.st / 0.6)
            ca = 1.0 - 0.75 * en
            ctx.save()
            ctx.translate(CARD[0] + (1 - card_in) * 700, CARD[1])
            ctx.rotate(-0.018)
            ctx.push_group()
            box(ctx, 0, 0, CW, CH, WHITE, r=16, lw=6, drop=10)
            ctx.save()
            rrect(ctx, 0, 0, CW, CH, 16)
            ctx.clip()
            DIAGRAMS[sc["diagram"]](ctx, S.step, S.step_t, t)
            ctx.restore()
            rrect(ctx, 0, 0, CW, CH, 16)
            ctx.set_line_width(6)
            src(ctx, BLACK)
            ctx.stroke()
            ctx.pop_group_to_source()
            ctx.paint_with_alpha(ca)
            ctx.restore()

        # professor: rises out of the golden light in the opening
        pose_name = "stand"
        prev_pose = "stand"
        if L and L["who"] == "koichiro":
            pose_name = L.get("pose", "stand")
        elif L:
            pose_name = "cross"
        if S.prev:
            prev_pose = S.prev.get("pose", "cross") if S.prev["who"] == "koichiro" else "cross"
        if L is None:
            pose_name = "rise"
        k = ease_io(lt / 0.35) if lt >= 0 else 1
        P = lerp_pose(POSES[prev_pose], POSES[pose_name], k)
        py = 664
        if is_title and S.si == 0:
            py += (1 - ease_out((t - 0.2) / 1.8)) * 520
        talkp = self.talk(L, lt, "koichiro")
        fierce = 1.0 if (L and (L.get("enemy") or pose_name in ("jojo", "punch", "fist"))) else 0.3
        if L and L.get("pose") == "punch":
            P = dict(P)
            P["hip"] += math.sin(clamp(lt / 0.3) * math.pi) * 30
        prof_col = hexc("#ffd84a")
        aura(ctx, lambda: professor(ctx, 290, py, 0.8, P, t, talk=talkp, fierce=fierce), prof_col, t,
             strength=1.0 + 0.6 * math.sin(t * 5) ** 2)
        flames(ctx, 290, 640, 160, 130, t, hexc("#ffcf1f"), alpha=0.8)

        # concept mascots
        if cast:
            speaker = L["who"]
            if len(cast) >= 3:
                xs = [720 + i * (450 / (len(cast) - 1)) for i in range(len(cast))]
                for i, (kind, x) in enumerate(zip(cast, xs)):
                    kk = back_out((t - self.first_cast_t(sc, t) - i * 0.15) / 0.4)
                    if kk <= 0:
                        continue
                    talking = speaker == kind
                    bounce = abs(math.sin(t * 7)) * 14 if talking else math.sin(t * 2 + i) * 4
                    mascot(ctx, kind, x, 360 - bounce, (1.05 if talking else 0.85) * min(1.05, kk), t,
                           talk=self.talk(L, lt, kind))
            else:
                kind = cast[0]
                talking = speaker == kind
                kk = back_out(lt / 0.4) if not (S.prev and kind in S.prev.get("cast", [])) else 1
                bounce = abs(math.sin(t * 7)) * 12 if talking else 0
                mascot(ctx, kind, 690, 470 - bounce, 0.9 * kk, t, talk=self.talk(L, lt, kind))

        # the villain
        if S.enemy:
            el = S.enemy_lt
            st = S.enemy
            ex, ey, es = 935, 255, 1.15
            hurt, crack, alpha = 0.0, 0.0, 1.0
            if st == "enter":
                ey += (1 - ease_out(el / 0.8)) * 500
            line_d = S.enemy_line["dur"] if S.enemy_line else 1
            if st == "hit":
                at = 0.55 * line_d
                if el >= at:
                    hurt = clamp(1 - (el - at) / 0.5)
                    ex += 40 * hurt
            if st == "defeat":
                at = 0.7 * line_d
                if el >= at:
                    q = el - at
                    hurt = clamp(1 - q / 0.8)
                    crack = clamp(q / 0.3)
                    ex += 80 * ease_out(q / 0.4)
                    ey += 30 * ease_out(q / 0.4)
            if st == "flee":
                crack = 1.0
                q = ease_io(el / 1.0)
                ex += 300 * q
                ey -= 260 * q
                es *= 1 - 0.7 * q
                alpha = clamp(1 - q)
            if st == "explode":
                crack = 1.0
                hurt = 1.0
                alpha = clamp(1 - el / 0.5)
            flames(ctx, ex + 30, 600, 120, 140, t, hexc("#b14dff"), alpha=alpha)
            if alpha > 0:
                if not gokai3d(ctx, ex, ey, es, t, talk=self.talk(L, lt, "gokai"), hurt=hurt, alpha=alpha, crack=crack):
                    gokai(ctx, ex, ey, es, t, talk=self.talk(L, lt, "gokai"), hurt=hurt, alpha=alpha, crack=crack)
            if st not in ("flee", "explode"):
                onoma(ctx, "ゴ", t, el if st == "enter" else 2.0, 11, dark=True, area=(640, 60, 1240, 560), n=5)
            if st in ("defeat", "explode") and el >= (0.7 * line_d if st == "defeat" else 0):
                q = el - (0.7 * line_d if st == "defeat" else 0)
                star_burst(ctx, ex + 20, ey - 40, 60 + q * 300, 120 + q * 500, 16, hexc("#fff200"),
                           rot=q, lw=6, alpha=clamp(1 - q / 0.7))
                if st == "defeat":
                    text(ctx, "ドゴォッ！", ex - 30, ey - 160, 84, "reggae", fill=hexc("#ff2b6a"), stroke=BLACK, sw=8,
                         outer=WHITE, ow=18, rot=-0.15, scale=back_out(q / 0.25), alpha=clamp(1.2 - q / 1.4))
            if st == "hit" and hurt > 0:
                star_burst(ctx, ex - 40, ey - 20, 40, 90, 12, WHITE, rot=t, lw=5, alpha=hurt)
                text(ctx, "バシィッ！", ex - 80, ey - 150, 70, "reggae", fill=hexc("#ffd23f"), stroke=BLACK, sw=8,
                     outer=WHITE, ow=16, rot=0.12, alpha=hurt)

        # onomatopoeia for the line
        if L and L.get("onoma") and L["who"] != "gokai":
            onoma(ctx, L["onoma"], t, lt, L["idx"], dark=dark, area=(480, 60, 1240, 560), n=7)
        if L and L.get("onoma") and L["who"] == "gokai":
            onoma(ctx, L["onoma"], t, lt, L["idx"] + 1, dark=True, area=(560, 40, 1100, 300), n=6)

        # title card
        if is_title:
            self.title_card(ctx, S, t)

        # big keyword
        if L and L.get("big"):
            big_word(ctx, L["big"], lt - 0.1, L["dur"], L.get("bigc"), dark=dark)

        # speech bubbles
        if L and L.get("bubble"):
            if L["who"] == "koichiro":
                bubble(ctx, L["bubble"], 470, 110, lt, L["dur"], tail=(-1, 1))
            elif L["who"] == "gokai":
                bubble(ctx, L["bubble"], 790, 90, lt, L["dur"], col=hexc("#f3d9ff"), tail=(1, 1))
            else:
                n = len(cast)
                bx = 690 if n < 3 else 720 + cast.index(L["who"]) * (500 / (n - 1))
                by = 300 if n < 3 else 140
                bubble(ctx, L["bubble"], min(max(bx + 60, 760), 1150), by, lt, L["dur"], tail=(-1, 1))
        elif L and L.get("onoma") and L["who"] == "koichiro" and not is_title:
            bubble(ctx, L["onoma"], 470, 110, lt, L["dur"], tail=(-1, 1))
        if is_title and L and L["idx"] == 0:
            bubble(ctx, "ゴゴゴゴゴ…", 520, 120, lt, L["dur"], tail=(-1, 1))

        # chapter tag
        if not is_title:
            k = ease_out(S.st / 0.5)
            ctx.save()
            ctx.translate(-300 * (1 - k), 0)
            label = f"第{S.si}幕  {sc['chapter']}"
            w = text_w(ctx, label, "zen", 22) + 40
            ctx.move_to(0, 14)
            ctx.line_to(w + 20, 14)
            ctx.line_to(w, 58)
            ctx.line_to(0, 58)
            ctx.close_path()
            src(ctx, BLACK)
            ctx.fill()
            text(ctx, label, 18, 36, 22, "zen", fill=hexc("#ffe14d"), align="left")
            ctx.restore()

        # finale: 理解ッ！
        if finale:
            self.finale(ctx, lt, t)
        ctx.restore()

        # white flash at every line change (the background changes with each explanation)
        if L and lt < 0.12 and not finale:
            ctx.rectangle(0, 0, W, PIC_H)
            src(ctx, WHITE, 0.55 * (1 - lt / 0.12))
            ctx.fill()
        if is_title and t < 0.6:
            ctx.rectangle(0, 0, W, PIC_H)
            src(ctx, WHITE, 1 - t / 0.6)
            ctx.fill()

        # subtitles
        show = L if (L and lt < L["dur"] + 0.35) else None
        subtitle(ctx, show, self.voices)
        # fade out at the very end
        tail = self.T["total"] - t
        if tail < 1.2:
            ctx.rectangle(0, 0, W, H)
            src(ctx, WHITE, clamp(1 - tail / 1.2))
            ctx.fill()
        return surf

    def first_cast_t(self, sc, t):
        for L in sc["lines"]:
            if len(L.get("cast", [])) >= 3:
                return L["start"]
        return sc["start"]

    def title_card(self, ctx, S, t):
        L = S.scene["lines"][1]
        lt = t - L["start"]
        if lt < 0:
            return
        k = back_out(lt / 0.35, 2.0) if lt < 0.35 else 1.0
        scale = 3.0 - 2.0 * k
        star_burst(ctx, 780, 300, 230 * k, 380 * k, 22, hexc("#fff200"), rot=t * 0.3, lw=7, alpha=clamp(lt / 0.2))
        g = cairo.LinearGradient(0, 220, 0, 360)
        g.add_color_stop_rgb(0, *hexc("#fff7a8"))
        g.add_color_stop_rgb(0.45, *hexc("#ffb300"))
        g.add_color_stop_rgb(1, *hexc("#ff5a00"))
        if clip_surface("logo_title", 0) is not None:
            # the 3D gold logo (Blender), with a white sticker edge so it reads on any background
            aura(ctx, lambda: clip3d(ctx, "logo_title", lt, 780, 285, scale=0.86, center=True), WHITE, 0,
                 rings=((5, 1.0), (10, 1.0)))
        else:
            ctx.save()
            ctx.translate(780, 290)
            ctx.rotate(-0.06)
            ctx.scale(scale, scale)
            text(ctx, self.title, 0, 0, 92, "dela", fill=g, stroke=BLACK, sw=12, outer=WHITE, ow=26, shadow=(10, 10, BLACK))
            ctx.restore()
        a = clamp((lt - 0.4) / 0.3)
        text(ctx, "Epigenetics", 800, 395, 46, "dela", fill=hexc("#ff2b6a"), stroke=BLACK, sw=7, outer=WHITE, ow=16,
             rot=-0.06, alpha=a)
        text(ctx, self.S["subtitle"], 800, 460, 26, "zen", fill=WHITE, stroke=BLACK, sw=7, alpha=a)
        text(ctx, "ドーン！", 1100, 130, 70, "reggae", fill=hexc("#ff2b6a"), stroke=BLACK, sw=8, outer=WHITE, ow=18,
             rot=0.2, scale=back_out((lt - 0.1) / 0.3), alpha=clamp(lt / 0.2))

    def finale(self, ctx, lt, t):
        q = max(0.0, lt)
        ctx.rectangle(0, 0, W, PIC_H)
        src(ctx, WHITE, clamp(1 - q / 0.5) * 0.9)
        ctx.fill()
        cx, cy = 780, 300
        rnd = random.Random(int(t * 8))
        for i in range(48):
            a = i * 2 * math.pi / 48 + t * 0.4
            w = 0.03 + 0.03 * rnd.random()
            ctx.move_to(cx, cy)
            ctx.line_to(cx + math.cos(a - w) * 1400, cy + math.sin(a - w) * 1400)
            ctx.line_to(cx + math.cos(a + w) * 1400, cy + math.sin(a + w) * 1400)
            ctx.close_path()
            src(ctx, SPEED_COLS[i % len(SPEED_COLS)], 0.5)
            ctx.fill()
        star_burst(ctx, cx, cy, 200 + 30 * math.sin(t * 9), 340 + 40 * math.sin(t * 7), 20, hexc("#fff200"),
                   rot=t * 0.5, lw=8, jitter=[1, 0.85, 1.12])
        # sparkles
        for i in range(30):
            a = rnd.uniform(0, 2 * math.pi)
            r = (q * 500 + rnd.uniform(0, 300)) % 700
            x, y = cx + math.cos(a) * r, cy + math.sin(a) * r * 0.7
            star_burst(ctx, x, y, 4, 16, 4, WHITE, rot=t * 3, lw=2)
        k = back_out(q / 0.4, 3.0) if q < 0.4 else 1.0
        scale = (3.4 - 2.4 * k) * (1 + 0.03 * math.sin(t * 8))
        g = cairo.LinearGradient(0, cy - 90, 0, cy + 90)
        g.add_color_stop_rgb(0, *hexc("#fffbd0"))
        g.add_color_stop_rgb(0.45, *hexc("#ffcf1f"))
        g.add_color_stop_rgb(1, *hexc("#ff4f00"))
        if clip_surface("logo_rikai", 0) is not None:
            aura(ctx, lambda: clip3d(ctx, "logo_rikai", q, cx, cy, scale=1.0 + 0.03 * math.sin(t * 8), center=True),
                 WHITE, 0, rings=((6, 1.0), (12, 1.0)))
        else:
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(-0.1)
            ctx.scale(scale, scale)
            text(ctx, "理解ッ！", 0, 0, 170, "dela", fill=g, stroke=BLACK, sw=14, outer=WHITE, ow=30, shadow=(12, 12, BLACK))
            ctx.restore()
        if q > 1.2:
            a = clamp((q - 1.2) / 0.5)
            text(ctx, "エピジェネティクス ― 完", cx, 520, 34, "zen", fill=WHITE, stroke=BLACK, sw=8, alpha=a)


# ── rendering ───────────────────────────────────────────────────────────────
def ffmpeg_writer(path, crf=16):
    return subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr0", "-s", f"{W}x{H}",
                             "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
                             "-tune", "animation", "-pix_fmt", "yuv420p", str(path)], stdin=subprocess.PIPE)


def render_range(a, b, path):
    F = Film()
    p = ffmpeg_writer(path)
    for fi in range(a, b):
        s = F.frame(fi)
        s.flush()
        p.stdin.write(bytes(s.get_data()))
    p.stdin.close()
    p.wait()


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "video"
    if cmd == "timeline":
        T = build_timeline()
        print(f"total {T['total']:.1f}s, {len(T['scenes'])} scenes")
        return
    if cmd == "still":
        t = float(sys.argv[2])
        out = sys.argv[3] if len(sys.argv) > 3 else str(HERE / "out" / f"still_{t:07.2f}.png")
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        Film().frame(int(t * FPS)).write_to_png(out)
        print(out)
        return
    if cmd == "video":
        jobs = int(sys.argv[sys.argv.index("--jobs") + 1]) if "--jobs" in sys.argv else os.cpu_count() or 4
        T = json.load(open(HERE / "timeline.json"))
        n = int(T["total"] * FPS)
        if "--frames" in sys.argv:
            a, b = (int(v) for v in sys.argv[sys.argv.index("--frames") + 1].split(":"))
        else:
            a, b = 0, n
        out = HERE / "out"
        out.mkdir(exist_ok=True)
        from multiprocessing import Process
        chunk = (b - a + jobs - 1) // jobs
        procs, parts = [], []
        for j in range(jobs):
            s0, s1 = a + j * chunk, min(b, a + (j + 1) * chunk)
            if s0 >= s1:
                break
            part = out / f"part{j:02d}.mp4"
            parts.append(part)
            pr = Process(target=render_range, args=(s0, s1, part))
            pr.start()
            procs.append(pr)
        for pr in procs:
            pr.join()
        lst = out / "parts.txt"
        lst.write_text("".join(f"file '{p.name}'\n" for p in parts))
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy",
                        str(out / "picture.mp4")], check=True)
        for p in parts:
            p.unlink()
        lst.unlink()
        print(out / "picture.mp4", f"{(b - a) / FPS:.1f}s")


if __name__ == "__main__":
    main()
