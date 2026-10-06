#!/usr/bin/env python3
"""Thumbnails for 路地裏のゲノム (1280x720, YouTube size), built from the key art.

    python3 tools/thumbnail.py      # → thumbnails/thumb_a_cat.jpg, thumb_b_six.jpg, thumb_c_cas9.jpg
"""
import os
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PROD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(PROD, '.cache')
OUT = os.path.join(PROD, 'thumbnails')
W, H = 1280, 720
MINCHO_B = os.path.join(C, 'ttf', 'ShipporiMincho-Bold.ttf')
GOTHIC_B = os.path.join(C, 'ttf', 'ZenKakuGothicNew-Bold.ttf')


def key(i, w=W, h=H, cx=0.5, cy=0.5, zoom=1.0):
    im = Image.open(os.path.join(C, 'up', i + '.jpg')).convert('RGB')
    iw, ih = im.size
    s = max(w / iw, h / ih) * zoom
    im = im.resize((int(iw * s), int(ih * s)), Image.LANCZOS)
    x = int(min(max(0, im.width * cx - w / 2), im.width - w)); y = int(min(max(0, im.height * cy - h / 2), im.height - h))
    return im.crop((x, y, x + w, y + h))


def glow_text(base, xy, s, font, fill, glow, radius=18, stroke=0, anchor='la', spacing=0, strength=2):
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if spacing:
        x, y = xy
        for ch in s:
            d.text((x, y), ch, font=font, fill=glow, anchor=anchor)
            x += font.getlength(ch) + spacing
    else:
        d.text(xy, s, font=font, fill=glow, anchor=anchor)
    g = layer.filter(ImageFilter.GaussianBlur(radius))
    for _ in range(strength):
        base.alpha_composite(g)
    d2 = ImageDraw.Draw(base)
    if spacing:
        x, y = xy
        for ch in s:
            d2.text((x, y), ch, font=font, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(10, 12, 25, 255))
            x += font.getlength(ch) + spacing
    else:
        d2.text(xy, s, font=font, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(10, 12, 25, 255))


def shade(img, side='left', k=0.85, width=0.6):
    a = np.asarray(img).astype(np.float32)
    x = np.linspace(0, 1, img.width)[None, :, None]
    if side == 'left':
        m = np.clip(1 - x / width, 0, 1) ** 1.4
    elif side == 'right':
        m = np.clip((x - (1 - width)) / width, 0, 1) ** 1.4
    else:  # bottom
        y = np.linspace(0, 1, img.height)[:, None, None]
        m = np.clip((y - (1 - width)) / width, 0, 1) ** 1.3
    a = a * (1 - k * m)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def helix(d, x0, x1, y, amp, c1, c2, turns=6, w=3):
    for k, col in enumerate((c1, c2)):
        pts = [(x, y + amp * np.sin((x - x0) / (x1 - x0) * turns * 2 * np.pi + k * np.pi)) for x in np.linspace(x0, x1, 200)]
        d.line(pts, fill=col, width=w)


def grade(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255
    a = a / (1 + a * 0.15) * 1.1
    yy, xx = np.mgrid[-1:1:H * 1j, -1:1:W * 1j]
    a *= (1 - 0.35 * np.clip((xx ** 2 * 0.8 + yy ** 2) ** 1.3, 0, 1))[:, :, None]
    return Image.fromarray((a.clip(0, 1) * 255).astype(np.uint8))


def thumb_a():
    """The cat's amber eye + title."""
    bg = shade(key('r5', cx=0.62, zoom=1.08), 'left', 0.88, 0.62).convert('RGBA')
    lay = Image.new('RGBA', bg.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    helix(d, 64, 560, 505, 12, (90, 200, 255, 220), (255, 110, 200, 220), turns=5)
    bg.alpha_composite(lay.filter(ImageFilter.GaussianBlur(5))); bg.alpha_composite(lay)
    glow_text(bg, (60, 190), '路地裏の', ImageFont.truetype(MINCHO_B, 112), (240, 246, 255, 255), (110, 190, 255, 255), 20, 2)
    glow_text(bg, (60, 330), 'ゲノム', ImageFont.truetype(MINCHO_B, 150), (255, 236, 200, 255), (255, 170, 80, 255), 24, 2)
    glow_text(bg, (64, 535), '― 遺伝子工学の夜 ―', ImageFont.truetype(MINCHO_B, 44), (210, 225, 255, 255), (90, 160, 255, 200), 12)
    glow_text(bg, (64, 615), '切る・つなぐ・増やす・読む・書き換える', ImageFont.truetype(GOTHIC_B, 30), (255, 214, 140, 255), (255, 150, 60, 160), 10)
    return grade(bg)


def thumb_b():
    """The six + the cat: a lineup of faces under the title."""
    bg = key('r1', zoom=1.0)
    bg = Image.fromarray((np.asarray(bg).astype(np.float32) * 0.55).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)).convert('RGBA')
    cast = [('s3', 'キリ', '制限酵素', (160, 220, 255)), ('s4', 'ムスビ', 'リガーゼ', (255, 214, 120)), ('s5', 'ツムギ', 'ポリメラーゼ', (150, 255, 200)),
            ('r5', '猫', '', (255, 190, 90)), ('s6', 'ヨミ', 'シーケンサー', (130, 232, 255)), ('s2', 'ハコブ', 'プラスミド', (205, 185, 255)), ('s7', 'カゲ', 'Cas9', (255, 160, 80))]
    from imgutils.detect import detect_faces
    pw, ph, gap = 172, 360, 8
    x0 = (W - (pw * 7 + gap * 6)) // 2
    for k, (i, name, role, col) in enumerate(cast):
        src = Image.open(os.path.join(C, 'up', i + '.jpg')).convert('RGB')
        if i == 'r5':
            fx, fy = src.width * 0.66, src.height * 0.45; fs = src.height * 0.55
        else:
            f = detect_faces(src)
            (a, b, c, d_), *_ = f[0] if f else ((src.width * 0.4, src.height * 0.1, src.width * 0.6, src.height * 0.4), '', 0)
            fx, fy, fs = (a + c) / 2, (b + d_) / 2 + (d_ - b) * 0.25, (d_ - b) * 2.1
        cw = fs * pw / ph
        crop = src.crop((int(fx - cw / 2), int(fy - fs / 2), int(fx + cw / 2), int(fy + fs / 2))).resize((pw, ph), Image.LANCZOS)
        x = x0 + k * (pw + gap); y = 310 if i != 'r5' else 290
        frame = Image.new('RGBA', (pw + 6, ph + 6), col + (255,))
        glowf = frame.filter(ImageFilter.GaussianBlur(8))
        bg.alpha_composite(glowf, (x - 3, y - 3)); bg.alpha_composite(frame, (x - 3, y - 3))
        bg.paste(crop, (x, y))
        dd = ImageDraw.Draw(bg)
        dd.rectangle((x, y + ph - 70, x + pw, y + ph), fill=(8, 10, 22, 190))
        dd.text((x + pw / 2, y + ph - 46), name, font=ImageFont.truetype(GOTHIC_B, 28), fill=col + (255,), anchor='mm')
        if role:
            dd.text((x + pw / 2, y + ph - 16), role, font=ImageFont.truetype(GOTHIC_B, 18), fill=(230, 235, 255, 255), anchor='mm')
    glow_text(bg, (W // 2, 120), '路地裏のゲノム', ImageFont.truetype(MINCHO_B, 128), (245, 248, 255, 255), (110, 190, 255, 255), 22, 2, 'mm')
    glow_text(bg, (W // 2, 228), '遺伝子工学の夜 ｜ 制限酵素から CRISPR まで', ImageFont.truetype(GOTHIC_B, 36), (255, 222, 150, 255), (255, 150, 60, 170), 10, 0, 'mm')
    return grade(bg)


def thumb_c():
    """Kage's glowing eye + the Cas9 shadow: the dramatic one."""
    bg = shade(key('h5', cx=0.6, zoom=1.05), 'left', 0.9, 0.6).convert('RGBA')
    sh = np.asarray(key('h1', 640, 720, cx=0.3, zoom=1.0)).astype(np.float32)
    a = (np.linspace(1, 0, 640) ** 1.5)[None, :, None] * 0.55
    base = np.asarray(bg.convert('RGB')).astype(np.float32)
    base[:, :640] = base[:, :640] * (1 - a) + sh * a
    bg = Image.fromarray(base.clip(0, 255).astype(np.uint8)).convert('RGBA')
    lay = Image.new('RGBA', bg.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    seq = 'GAGAACGGCGAAAACTAACTTGG'
    f = ImageFont.truetype(GOTHIC_B, 30)
    for k, ch in enumerate(seq):
        col = (255, 200, 120, 255) if k >= 20 else (255, 140, 220, 235)
        d.text((60 + k * 24, 600), ch, font=f, fill=col)
    d.line([(60 + 17.5 * 24, 585), (60 + 17.5 * 24, 650)], fill=(255, 255, 255, 255), width=3)
    bg.alpha_composite(lay.filter(ImageFilter.GaussianBlur(6))); bg.alpha_composite(lay)
    glow_text(bg, (60, 150), '路地裏の', ImageFont.truetype(MINCHO_B, 104), (240, 246, 255, 255), (255, 140, 60, 255), 20, 2)
    glow_text(bg, (60, 280), 'ゲノム', ImageFont.truetype(MINCHO_B, 140), (255, 220, 180, 255), (255, 110, 40, 255), 24, 2)
    glow_text(bg, (64, 470), '狙った場所を、正確に切る。', ImageFont.truetype(MINCHO_B, 40), (255, 235, 220, 255), (255, 120, 50, 200), 12)
    glow_text(bg, (64, 530), 'CRISPR-Cas9 ／ 遺伝子工学の夜', ImageFont.truetype(GOTHIC_B, 28), (230, 230, 255, 255), (150, 120, 255, 150), 8)
    return grade(bg)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in (('thumb_a_cat', thumb_a), ('thumb_b_six', thumb_b), ('thumb_c_cas9', thumb_c)):
        im = fn()
        im.save(os.path.join(OUT, name + '.jpg'), quality=93)
        print(name)


if __name__ == '__main__':
    main()
