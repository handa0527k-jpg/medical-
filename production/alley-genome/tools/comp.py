#!/usr/bin/env python3
"""路地裏のゲノム — compositor. Every frame is a pure function of time:
key art (upscaled) → 2.5D camera with depth parallax → rain / light / particles → neon science overlays →
bloom, grade, grain → subtitles. Frames are piped to ffmpeg.

    python3 tools/comp.py --from 0 --to 30 --out sample/sample_30s_video.mp4
    python3 tools/comp.py --still 12.5 --png out.png          # one frame
"""
import argparse, functools, json, math, os, subprocess, sys
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

PROD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(PROD, '.cache')
W, H = 1920, 1080
FPS = 24
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import overlays as OV  # noqa: E402

TL = json.load(open(os.path.join(PROD, 'timeline.json'), encoding='utf-8'))
SPEC = json.load(open(os.path.join(PROD, 'shots.json'), encoding='utf-8'))
SCENES = {s['id']: s for s in TL['scenes']}
LINES = TL['lines']
COLORS = {'N': (255, 255, 255), 'KIRI': (160, 220, 255), 'MUSUBI': (255, 214, 120), 'TSUMUGI': (150, 255, 200),
          'YOMI': (130, 232, 255), 'HAKOBU': (205, 185, 255), 'KAGE': (255, 160, 80)}
CHAPTER = {'six': '壱', 'cut': '弐', 'tie': '参', 'planet': '肆', 'copy': '伍', 'pcr': '陸', 'gel': '漆', 'read': '捌', 'shadow': '玖', 'end': '終'}


def font(kind='mincho', size=40, bold=False):
    f = {'mincho': 'ShipporiMincho-Bold.ttf' if bold else 'ShipporiMincho-Medium.ttf',
         'gothic': 'ZenKakuGothicNew-Bold.ttf' if bold else 'ZenKakuGothicNew-Medium.ttf'}[kind]
    return _font(f, int(size))


@functools.lru_cache(64)
def _font(f, size):
    return ImageFont.truetype(os.path.join(C, 'ttf', f), size)


# ---------------------------------------------------------------- shots on the clock
def line_t(scene, i):
    for l in LINES:
        if l['scene'] == scene and l['i'] == i:
            return l
    raise KeyError((scene, i))


def build_shots():
    out = []
    for s in SPEC['shots']:
        sc = SCENES[s['scene']]
        t0 = sc['start'] if s['at'] == 0 else line_t(s['scene'], s['at'])['t0'] - 0.3
        out.append(dict(s, t0=t0))
    out.sort(key=lambda s: s['t0'])
    for a, b in zip(out, out[1:]):
        a['t1'] = b['t0']
    out[-1]['t1'] = TL['total']
    for s in out:  # a shot never runs past its scene
        s['t1'] = min(s['t1'], SCENES[s['scene']]['end'])
        s['lines'] = [l for l in LINES if l['scene'] == s['scene']]
    return out


SHOTS = build_shots()


def shot_at(t):
    for s in SHOTS:
        if s['t0'] <= t < s['t1']:
            return s
    return SHOTS[-1]


# ---------------------------------------------------------------- images
@functools.lru_cache(4)
def variant(img_id, v):
    im = cv2.imread(os.path.join(C, 'up', f'{img_id}_{v}.jpg'))
    mk = cv2.imread(os.path.join(C, 'vmask', f'{img_id}_{v}.png'), cv2.IMREAD_GRAYSCALE)
    if im is None or mk is None:
        return None
    mk = cv2.resize(mk, (im.shape[1], im.shape[0]), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255
    return im.astype(np.float32) / 255, mk


SPEAKER = {'{KIRI}': 'KIRI', '{MUSUBI}': 'MUSUBI', '{TSUMUGI}': 'TSUMUGI', '{YOMI}': 'YOMI', '{HAKOBU}': 'HAKOBU', '{KAGE}': 'KAGE'}


def blink_w(t, seed):
    period = 3.2 + 1.8 * hash01(seed)
    ph = (t + hash01(seed * 3) * period) % period
    return max(0.0, 1 - abs(ph - 0.09) / 0.09) if ph < 0.18 else 0.0


def talk_w(t, who):
    for l in LINES:
        if l['who'] == who and l['t0'] <= t < l['t1']:
            k = int((t - l['t0']) * FPS)
            e = l['env'][min(k, len(l['env']) - 1)]
            return min(1.0, max(0.0, (e - 0.12) * 1.6))
    return 0.0


def animate_face(im, img_id, s, t):
    who = next((v for k, v in SPEAKER.items() if k in s.get('p', '')), None)
    if who is None:
        return im
    for v, w in (('talk', talk_w(t, who)), ('blink', blink_w(t, sum(map(ord, img_id))))):
        if w > 0.02:
            var = variant(img_id, v)
            if var is not None:
                vim, mk = var
                k = cv2.merge([mk * w] * 3)
                im = im + (vim - im) * k
    return im


@functools.lru_cache(6)
def plate(img_id):
    """(image float32 BGR 2688x1536, depth float32 same size/4, neon mask)"""
    bok = SPEC['bokeh'].get(img_id)
    if bok:
        return bokeh_plate(img_id, bok)
    im = cv2.imread(os.path.join(C, 'up', img_id + '.jpg'))
    if im is None:  # not generated yet: dark placeholder so timing can be checked
        im = np.full((1536, 2688, 3), 18, np.uint8)
    im = im.astype(np.float32) / 255
    dp = cv2.imread(os.path.join(C, 'depth', img_id + '.png'), cv2.IMREAD_UNCHANGED)
    dp = dp.astype(np.float32) / 65535 if dp is not None else np.full((384, 672), 0.5, np.float32)
    hsv = cv2.cvtColor(cv2.resize(im, (672, 384)), cv2.COLOR_BGR2HSV)
    neon = np.clip((hsv[:, :, 1] - 0.45) * 3, 0, 1) * np.clip((hsv[:, :, 2] - 0.55) * 3, 0, 1)
    neon = cv2.GaussianBlur(neon, (0, 0), 2)
    mt = cv2.imread(os.path.join(C, 'matte', img_id + '.png'), cv2.IMREAD_GRAYSCALE)
    mt = cv2.resize(mt, (672, 384)).astype(np.float32) / 255 if mt is not None else None
    return im, dp, neon, mt


def bokeh_plate(img_id, hexcol):
    """Diagram backdrop: the opening alley, defocused into bokeh and tinted."""
    src = cv2.imread(os.path.join(C, 'up', 'r1.jpg'))
    if src is None:
        src = np.full((1536, 2688, 3), 20, np.uint8)
    rng = np.random.default_rng(sum(map(ord, img_id)))
    small = cv2.resize(src, (672, 384)).astype(np.float32) / 255
    small = cv2.GaussianBlur(small, (0, 0), 14) * 0.55
    col = np.array([int(hexcol[5:7], 16), int(hexcol[3:5], 16), int(hexcol[1:3], 16)], np.float32) / 255
    gray = small.mean(2, keepdims=True)
    small = gray * 0.6 * col + small * 0.25 + 0.012
    for _ in range(46):  # out-of-focus lights
        x, y = rng.uniform(0, 672), rng.uniform(0, 384)
        r = rng.uniform(6, 26); a = rng.uniform(0.04, 0.22)
        c = col if rng.random() < 0.7 else np.array([1, 0.85, 0.7], np.float32)
        disk = np.zeros((384, 672), np.float32); cv2.circle(disk, (int(x), int(y)), int(r), 1.0, -1, cv2.LINE_AA)
        disk = cv2.GaussianBlur(disk, (0, 0), 1.5)
        small += disk[:, :, None] * c * a
    yy = np.linspace(-1, 1, 384)[:, None]; xx = np.linspace(-1, 1, 672)[None]
    small *= (1 - 0.55 * (xx ** 2 + yy ** 2) ** 1.2)[:, :, None].clip(0, 1)
    im = cv2.resize(small, (2688, 1536), interpolation=cv2.INTER_CUBIC)
    return im, np.full((384, 672), 0.3, np.float32), np.zeros((384, 672), np.float32), None


# ---------------------------------------------------------------- camera
def ease(u):
    u = min(1, max(0, u)); return u * u * (3 - 2 * u)


def camera(kind, u, t):
    # returns zoom, cx, cy (fractions of image, centre 0.5), parallax px,py, depth-zoom k
    e = ease(u) * 0.75 + u * 0.25
    sway = (math.sin(t * 0.7) * 0.0016, math.sin(t * 0.53 + 1) * 0.0012)
    z, cx, cy, px, py, k = 1.04, 0.5, 0.5, 0, 0, 0
    if kind == 'push':
        z = 1.02 + 0.13 * e; k = 0.07 * e
    elif kind == 'pushSlow':
        z = 1.03 + 0.07 * e; k = 0.04 * e
    elif kind == 'pull':
        z = 1.15 - 0.11 * e; k = 0.06 * (1 - e)
    elif kind == 'panR':
        z = 1.12; cx = 0.5 - 0.05 + 0.10 * e; px = -0.02 + 0.04 * e
    elif kind == 'panL':
        z = 1.12; cx = 0.5 + 0.05 - 0.10 * e; px = 0.02 - 0.04 * e
    elif kind == 'tiltU':
        z = 1.14; cy = 0.5 + 0.055 - 0.11 * e; py = 0.02 - 0.04 * e
    elif kind == 'tiltD':
        z = 1.14; cy = 0.5 - 0.055 + 0.11 * e; py = -0.02 + 0.04 * e
    elif kind == 'still':
        z = 1.03 + 0.03 * e
    return z, cx + sway[0], cy + sway[1], px, py, k


_grid = None
def warp(im, dp, kind, u, t, extra=None, matte=None):
    global _grid
    if _grid is None:
        _grid = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    gx, gy = _grid
    ih, iw = im.shape[:2]
    z, cx, cy, px, py, k = camera(kind, u, t)
    s0 = iw / W / z
    bx = (gx - W / 2) * s0 + cx * iw
    by = (gy - H / 2) * s0 + cy * ih
    d = cv2.remap(dp, bx / 4, by / 4, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) - 0.5
    mx = bx + px * iw * d - (bx - cx * iw) * k * d
    my = by + py * ih * d - (by - cy * ih) * k * d
    if matte is not None:  # breathing: the figure swells gently from its lowest point
        m = cv2.remap(matte, bx / 4, by / 4, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        b = 0.5 * (1 - math.cos(t * 2 * math.pi / 4.2))
        my = my + m * (ih - by) * 0.006 * (b - 0.5)
        mx = mx + m * (bx - cx * iw) * 0.002 * (b - 0.5)
    if extra is not None:
        mx, my = extra(mx, my, t)
    return cv2.remap(im, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT), (mx, my)


# ---------------------------------------------------------------- effects
def _rain_tile(seed, n, length, width, slant, alpha, h=2160, w=1920):
    rng = np.random.default_rng(seed)
    tile = np.zeros((h, w), np.float32)
    for _ in range(n):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        L = length * rng.uniform(0.6, 1.3)
        cv2.line(tile, (int(x), int(y)), (int(x + slant * L), int(y + L)), float(alpha * rng.uniform(0.4, 1)), width, cv2.LINE_AA)
    tile = cv2.GaussianBlur(tile, (0, 0), 0.6 + width * 0.3)
    return np.vstack([tile, tile])


@functools.lru_cache(1)
def rain_tiles():
    return [(_rain_tile(1, 1400, 26, 1, 0.12, 0.22), 1900), (_rain_tile(2, 520, 60, 2, 0.14, 0.30), 2900),
            (_rain_tile(3, 70, 150, 4, 0.16, 0.22), 4300)]


def add_rain(out, t, amount=1.0, lum=None):
    if amount <= 0:
        return out
    acc = np.zeros((H, W), np.float32)
    for i, (tile, speed) in enumerate(rain_tiles()):
        if amount < 0.5 and i == 2:
            continue
        off = int((t * speed) % 2160)
        acc += tile[2160 - off:2160 - off + H, :W]
    if lum is None:
        lum = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
    light = cv2.resize(cv2.GaussianBlur(cv2.resize(lum, (240, 135)), (0, 0), 6), (W, H))
    acc *= (0.18 + 1.5 * light) * amount
    return cv2.add(out, cv2.merge([acc, acc * 0.97, acc * 0.92]))


def add_splashes(out, t, lum=None, amount=1.0):
    layer = np.zeros((H // 2, W // 2), np.float32)
    for k in range(int(70 * amount)):
        slot = math.floor(t * 3 + hash01(k) * 3)
        ph = (t * 3 + hash01(k) * 3) - slot
        x = hash01(k * 7 + slot * 13.1) * W / 2
        y = H / 4 + hash01(k * 3 + slot * 5.7) ** 0.7 * H / 4
        r = 2 + ph * (5 + 12 * (y / (H / 2)))
        cv2.ellipse(layer, (int(x), int(y)), (int(r), max(1, int(r * 0.32))), 0, 0, 360, float(0.5 * (1 - ph)), 1, cv2.LINE_AA)
    if lum is None:
        lum = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
    layer = cv2.resize(layer, (W, H)) * 0.35 * (0.3 + lum * 2)
    return cv2.add(out, cv2.merge([layer] * 3))


def hash01(n):
    v = math.sin(n * 127.1 + 311.7) * 43758.5453
    return v - math.floor(v)


def particles(out, t, color, n=60, rise=40, size=4.0, seed=0, region=None):
    layer = np.zeros((H // 2, W // 2, 3), np.float32)
    col = np.array(color[::-1], np.float32) / 255
    x0, y0, x1, y1 = region or (0, 0, W, H)
    for k in range(n):
        h1, h2, h3 = hash01(k + seed * 100), hash01(k * 2.3 + seed), hash01(k * 5.1 + seed * 7)
        x = x0 + (h1 * (x1 - x0) + math.sin(t * (0.3 + h3) + k) * 30) % (x1 - x0)
        y = y1 - ((h2 * (y1 - y0) + t * rise * (0.5 + h3)) % (y1 - y0))
        tw = 0.5 + 0.5 * math.sin(t * (2 + 3 * h3) + k)
        r = size * (0.5 + h3)
        cv2.circle(layer, (int(x / 2), int(y / 2)), max(1, int(r / 2)), (col * (0.5 + tw)).tolist(), -1, cv2.LINE_AA)
    glow = cv2.GaussianBlur(layer, (0, 0), 6)
    layer = cv2.resize(layer + glow * 2.5, (W, H))
    return out + layer


def grade(out, t, warm=0.0, tint=None):
    small = cv2.resize(out, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    hi = np.clip(small - 0.55, 0, None) * 1.6
    bloom = cv2.GaussianBlur(hi, (0, 0), 9) + cv2.GaussianBlur(hi, (0, 0), 28) * 0.8
    out = out + cv2.resize(bloom, (W, H)) * 0.55
    # filmic shoulder + cool shadows / warm highlights
    out = cv2.divide(out, cv2.add(cv2.multiply(out, 0.18), 1.0), scale=1.12)
    k = np.clip(cv2.cvtColor(out, cv2.COLOR_BGR2GRAY) * 1.4, 0, 1)
    sh = (1.06, 1.0, 0.94); hi_ = (0.97, 1.0, 1.04 + warm)
    out = cv2.merge([cv2.multiply(ch, cv2.add(cv2.multiply(k, hi_[i] - sh[i]), sh[i])) for i, ch in enumerate(cv2.split(out))])
    if tint is not None:
        out = out * (1 - tint[3]) + out * np.array(tint[:3], np.float32) * tint[3]
    out = cv2.multiply(out, vignette())
    out = cv2.add(out, grain(t))
    return out


@functools.lru_cache(1)
def vignette():
    yy = np.linspace(-1, 1, H)[:, None]; xx = np.linspace(-1, 1, W)[None]
    v = 1 - 0.42 * np.clip((xx ** 2 * 0.8 + yy ** 2) ** 1.3, 0, 1)
    return cv2.merge([v.astype(np.float32)] * 3)


@functools.lru_cache(1)
def grain_tiles():
    rng = np.random.default_rng(5)
    return [cv2.merge([cv2.resize(rng.normal(0, 0.012, (H // 2, W // 2)).astype(np.float32), (W, H))] * 3) for _ in range(6)]


def grain(t):
    return grain_tiles()[int(t * FPS) % 6]


# ---------------------------------------------------------------- text
@functools.lru_cache(512)
def text_sprite(s, kind, size, color, stroke=0, bold=False, spacing=0):
    f = font(kind, size, bold)
    if spacing:
        ws = [f.getlength(ch) for ch in s]
        tw = int(sum(ws) + spacing * (len(s) - 1)) + 4 * stroke + 8
    else:
        tw = int(f.getlength(s)) + 4 * stroke + 8
    th = int(size * 1.45) + 4 * stroke
    img = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if spacing:
        x = 2 * stroke + 4
        for ch, w in zip(s, ws):
            d.text((x, 2 * stroke + size * 0.1), ch, font=f, fill=color + (255,), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
            x += w + spacing
    else:
        d.text((2 * stroke + 4, 2 * stroke + size * 0.1), s, font=f, fill=color + (255,), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
    a = np.asarray(img).astype(np.float32) / 255
    return a[:, :, [2, 1, 0]] * a[:, :, 3:4], a[:, :, 3:4]


def blit(out, spr, x, y, alpha=1.0, anchor='lt', add=False):
    rgb, a = spr
    h, w = a.shape[:2]
    if anchor[0] == 'm':
        x -= w // 2
    elif anchor[0] == 'r':
        x -= w
    if anchor[1] == 'm':
        y -= h // 2
    elif anchor[1] == 'b':
        y -= h
    x, y = int(x), int(y)
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x0 >= x1 or y0 >= y1:
        return
    sr, sa = rgb[y0 - y:y1 - y, x0 - x:x1 - x], a[y0 - y:y1 - y, x0 - x:x1 - x]
    if add:
        out[y0:y1, x0:x1] += sr * alpha
    else:
        out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - sa * alpha) + sr * alpha


def wrap(s, n=27):
    if len(s) <= n:
        return [s]
    mid = len(s) // 2
    best = None
    for i, ch in enumerate(s):
        if ch in '、。，」』）！？' and 6 < i < len(s) - 4:
            if best is None or abs(i - mid) < abs(best - mid):
                best = i
    cut = (best + 1) if best is not None else mid
    return [s[:cut]] + wrap(s[cut:], n)


def subtitles(out, t):
    for l in LINES:
        if l['t0'] - 0.12 <= t <= l['t1'] + 0.35:
            a = min(1, (t - l['t0'] + 0.12) / 0.2, (l['t1'] + 0.35 - t) / 0.25)
            rows = wrap(l['text'])
            col = COLORS.get(l['who'], (255, 255, 255))
            y = H - 70 - 62 * (len(rows) - 1)
            if l['who'] != 'N':
                blit(out, text_sprite(l['name'], 'gothic', 26, col, 3, True, 4), W // 2, y - 44, a, 'mb')
            for r in rows:
                spr = text_sprite(r, 'mincho', 46, (255, 255, 255) if l['who'] == 'N' else (250, 250, 255), 4)
                # soft shadow
                blit(out, (spr[0] * 0, spr[1]), W // 2 + 3, y + 3, a * 0.45, 'mm')
                blit(out, spr, W // 2, y, a, 'mm')
                y += 62
            break


def chapter_card(out, t):
    for s in TL['scenes']:
        if s['id'] in CHAPTER and s['start'] + 0.4 <= t <= s['start'] + 6.5:
            u = t - s['start'] - 0.4
            a = min(1, u / 0.8, (6.1 - u) / 0.8)
            num = text_sprite(CHAPTER[s['id']], 'mincho', 64, (235, 240, 255), 0, True)
            ttl = text_sprite(s['title'], 'mincho', 34, (220, 228, 255), 0, False, 6)
            x = 96
            blit(out, num, x, 70, a * 0.95)
            cv2.line(out, (x + 86, 112), (x + 86 + int(300 * min(1, u / 1.2)), 112), (0.9 * a, 0.85 * a, 0.8 * a), 1, cv2.LINE_AA)
            blit(out, ttl, x + 92, 74, a)


def fade_black(out, t):
    k = 1.0
    for i, s in enumerate(TL['scenes']):
        if i > 0 and abs(t - s['start']) < 0.6:
            k = min(k, abs(t - s['start']) / 0.6)
    if t < 1.2:
        k = min(k, t / 1.2)
    if t > TL['total'] - 3:
        k = min(k, (TL['total'] - t) / 3)
    return out * max(0, k) ** 1.5


# ---------------------------------------------------------------- frame
def frame(t):
    s = shot_at(t)
    u = (t - s['t0']) / max(0.1, s['t1'] - s['t0'])
    im, dp, neon, mt = plate(s.get('img', s['id']))
    im = animate_face(im, s.get('img', s['id']), s, t)
    if s.get('p') and not any(k in s['p'] for k in ('{KIRI}', '{MUSUBI}', '{TSUMUGI}', '{YOMI}', '{HAKOBU}', '{KAGE}', '{CAT}')):
        mt = None
    fx = s.get('fx', [])
    extra = None
    if 'heat' in fx:
        def extra(mx, my, tt):
            return mx + np.sin(my / 23 + tt * 6) * 2.2, my + np.sin(mx / 31 + tt * 4) * 1.4
    if 'ripples' in fx:
        def extra(mx, my, tt):
            k = np.clip((my / im.shape[0] - 0.45) * 2.5, 0, 1)
            return mx + np.sin(my / 9 + tt * 5) * 1.6 * k, my + np.sin(mx / 15 + tt * 3) * 1.0 * k
    out, (mx, my) = warp(im, dp, s['cam'], u, t, extra, mt)
    if 'neon' in fx or 'flicker' in fx or 'eyes' in fx:
        nm = cv2.remap(neon, mx / 4, my / 4, cv2.INTER_LINEAR)
        fl = 0.85 + 0.15 * math.sin(t * 11) * math.sin(t * 3.7 + 1)
        if hash01(math.floor(t * 6)) < 0.06:
            fl *= 0.55
        out = out * (1 + nm[:, :, None] * (fl - 0.85) * 1.6)
        if 'eyes' in fx:
            out = out + nm[:, :, None] * (0.25 + 0.1 * math.sin(t * 2)) * out
    if 'flicker' in fx:
        out = out * (0.9 + 0.1 * math.sin(t * 17) * (hash01(math.floor(t * 8)) > 0.2))
    if 'cycle' in fx:  # PCR: red → blue → green
        ph = (t * 0.6) % 3
        cols = [(0.75, 0.85, 1.35), (1.35, 1.0, 0.7), (0.8, 1.3, 0.8)]
        a, b = cols[int(ph)], cols[(int(ph) + 1) % 3]
        f = ease((ph % 1) * 1.6 - 0.3)
        out = out * np.array([a[i] * (1 - f) + b[i] * f for i in range(3)], np.float32)
    lum = cv2.cvtColor(np.ascontiguousarray(out, np.float32), cv2.COLOR_BGR2GRAY)
    if 'rain' in fx:
        out = add_rain(out, t, 1.0, lum); out = add_splashes(out, t, lum)
    elif 'rainSoft' in fx:
        out = add_rain(out, t, 0.45, lum)
    elif 'rainLight' in fx:
        out = add_rain(out, t, 0.3, lum); out = add_splashes(out, t, lum, amount=0.4)
    if 'sparks' in fx:
        out = particles(out, t, (190, 235, 255), 55, 30, 4, 1)
    if 'gold' in fx:
        out = particles(out, t, (255, 205, 110), 70, 22, 4.5, 2)
    if 'particles' in fx:
        out = particles(out, t, (120, 190, 255), 90, 14, 3.5, 3)
    if 'heat' in fx:
        out = out * np.array([0.85, 0.92, 1.18], np.float32)
    if 'windowRain' in fx:
        out = window_drops(out, t)
    if 'fadeOut' in fx:
        out = out * (1 - 0.6 * ease(u))
    ov = s.get('ov')
    if ov:
        out = OV.draw(ov, out, t, s, sys.modules[__name__])
    if 'title' in fx:
        out = OV.draw('title', out, t, s, sys.modules[__name__])
    out = grade(out, t, warm=0.04 if 'heat' in fx or 'gold' in fx else 0.0)
    chapter_card(out, t)
    subtitles(out, t)
    out = fade_black(out, t)
    return np.clip(out * 255, 0, 255).astype(np.uint8)


def window_drops(out, t):
    layer = np.zeros((H // 2, W // 2), np.float32)
    for k in range(90):
        x = hash01(k * 1.7) * W / 2
        sp = 20 + 60 * hash01(k * 3.1)
        y = (hash01(k * 9.3) * H / 2 + t * sp * (hash01(math.floor(t / 4 + k)) > 0.6)) % (H / 2)
        r = 2 + 5 * hash01(k * 4.4)
        cv2.circle(layer, (int(x), int(y)), int(r), 0.6, 1, cv2.LINE_AA)
        cv2.circle(layer, (int(x - r * 0.3), int(y - r * 0.3)), max(1, int(r * 0.3)), 0.9, -1, cv2.LINE_AA)
    return out + cv2.resize(layer, (W, H))[:, :, None] * 0.25


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--from', dest='a', type=float, default=0)
    ap.add_argument('--to', dest='b', type=float, default=None)
    ap.add_argument('--out', default=None)
    ap.add_argument('--still', type=float, default=None)
    ap.add_argument('--png', default=None)
    ap.add_argument('--crf', default='19')
    args = ap.parse_args()
    if args.still is not None:
        cv2.imwrite(args.png or 'still.png', frame(args.still)); return
    b = args.b if args.b is not None else TL['total']
    n0, n1 = round(args.a * FPS), round(b * FPS)
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'slow', '-crf', args.crf, '-tune', 'animation', '-pix_fmt', 'yuv420p', args.out],
                          stdin=subprocess.PIPE)
    import time
    t0 = time.time()
    for n in range(n0, n1):
        ff.stdin.write(frame(n / FPS).tobytes())
        if (n - n0) % 48 == 0:
            el = time.time() - t0
            print(f'\r{args.out}: {n - n0}/{n1 - n0} ({(n - n0 + 1) / max(el, 1e-3):.1f} fps)', end='', flush=True)
    ff.stdin.close(); ff.wait()
    print(f'\n{args.out}: done in {time.time() - t0:.0f}s')


if __name__ == '__main__':
    main()
