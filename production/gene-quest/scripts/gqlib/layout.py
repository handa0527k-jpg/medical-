"""画面の共通部品：キャラクターの配置、章タイトル、用語カード、出典表示、補足表示。

字幕は最終合成で画面下（y ≈ 930〜1060）に焼き込むので、ここでは下端 150px に重要な図を置かない。
"""
from __future__ import annotations

import math

import skia

from . import chars as ch
from .draw import (H, PAL, W, clamp, ease, ease_back, ease_out, glow, label, linear_shader, paint, panel, prog, rgba,
                   rrect, text, text_width)

SUB_TOP = 920   # 字幕帯の上端（これより下に図を置かない）


def cast(c, t, S, akari=True, nuku=True, akari_x=250, akari_y=1085, akari_s=0.62, nuku_x=1690, nuku_y=700,
         nuku_s=0.72, enter_a=0.0, enter_n=0.0, exit_t=None, nuku_point=None, akari_base="neutral", nuku_base="neutral",
         akari_alpha=1.0, nuku_alpha=1.0, akari_flip=False):
    """アカリ（左下の胸像）とヌク（右に浮かぶ）を、セリフに合わせて描く。"""
    out = 1.0 if exit_t is None else 1 - ease(prog(t, exit_t, 0.5))
    if akari:
        k = ease_out(prog(t, enter_a, 0.6)) * out
        if k > 0:
            e = S.expr("akari", t, akari_base) if S else ch.EXPRESSIONS[akari_base]
            talk = S.speaking("akari", t) if S else False
            if talk:
                glow(c, akari_x, akari_y - 330 * akari_s / 0.62, 260, PAL["akari"], 0.18)
            bob = math.sin(t * 9) * 3 * (e.mouth_open if talk else 0)
            ch.akari(c, akari_x - (1 - k) * 420, akari_y + bob, akari_s, e, t, alpha=akari_alpha * k, flip=akari_flip,
                     tilt=math.sin(t * 0.7) * 1.5 + (4 if talk else 0) * math.sin(t * 1.7))
    if nuku:
        k = ease_out(prog(t, enter_n, 0.6)) * out
        if k > 0:
            e = S.expr("nuku", t, nuku_base) if S else ch.EXPRESSIONS[nuku_base]
            if S and S.speaking("nuku", t):
                glow(c, nuku_x, nuku_y, 200, PAL["nuku"], 0.18)
            ch.nuku(c, nuku_x + (1 - k) * 380, nuku_y, nuku_s, e, t, alpha=nuku_alpha * k, point=nuku_point)


def hud(c, t, S, show_chapter=True, show_pages=True, alpha=1.0):
    """左上に章、右上に出典ページ、補足の行は「補足（資料外）」の札。"""
    if S is None:
        return
    a = alpha * ease(prog(t, 0.2, 0.6))
    if show_chapter and S.chapter:
        s = f"CHAPTER {S.chapter}"
        text(c, s, 48, 64, 24, PAL["muted"], "heavy", alpha=a * 0.9)
        text(c, S.chapter_title, 48 + text_width(s, 24, "heavy") + 16, 64, 24, PAL["text"], "bold", alpha=a * 0.9)
    if show_pages and S.pages:
        ps = "講義資料 p." + ", ".join(str(p) for p in S.pages[:4])
        w = text_width(ps, 22, "bold") + 28
        rrect(c, W - 48 - w, 38, w, 38, 19, 0xFF0E0B2A, a * 0.75)
        rrect(c, W - 48 - w, 38, w, 38, 19, 0xFF8A7CE0, a * 0.8, stroke=2)
        text(c, ps, W - 48 - w + 14, 64, 22, 0xFFD8D2FF, "bold", alpha=a)
    note = S.note_active(t)
    if note:
        ln = S.line_at(t)
        k = fade_line(t, ln)
        s = "補足（講義資料外の一般知識）"
        w = text_width(s, 24, "heavy") + 36
        rrect(c, 48, 92, w, 44, 22, 0xFF4A3A10, k * 0.92)
        rrect(c, 48, 92, w, 44, 22, PAL["yellow"], k, stroke=2.5)
        text(c, s, 66, 122, 24, PAL["yellow"], "heavy", alpha=k)
    why, kw = S.why_active(t)
    if why and kw > 0:
        # 必然性の問い：「なぜ？」の札（補足の札が出ているときはその下）
        y = 146 if note else 92
        q = why if why.endswith(("？", "?")) else why + "？"
        w = text_width("なぜ", 28, "heavy") + text_width(q, 26, "bold") + 64
        rrect(c, 48, y, w, 46, 23, 0xFF3A0F24, kw * 0.92)
        rrect(c, 48, y, w, 46, 23, PAL["red"], kw, stroke=2.5)
        text(c, "なぜ", 68, y + 32, 28, PAL["red"], "heavy", alpha=kw)
        text(c, q, 68 + text_width("なぜ", 28, "heavy") + 14, y + 32, 26, PAL["white"], "bold", alpha=kw)


def fade_line(t, ln, fin=0.25, fout=0.3):
    if not ln:
        return 0.0
    return clamp((t - ln["rel_start"] + 0.1) / fin) * clamp((ln["rel_end"] + 0.3 - t) / fout)


def chapter_card(c, t, n: int, title: str, start=0.0, dur=3.2):
    """章の始まりのタイトル（中央の帯に光が走る）。"""
    k_in = ease_out(prog(t, start, 0.6))
    k_out = 1 - ease(prog(t, start + dur - 0.6, 0.6))
    a = k_in * k_out
    if a <= 0.003:
        return
    c.drawRect(skia.Rect(0, 0, W, H), paint(0xFF000000, 0.45 * a))
    band_h = 230
    y0 = H / 2 - band_h / 2 - 40
    p = skia.Paint(AntiAlias=True)
    p.setShader(linear_shader(0, y0, W, y0, [rgba(0xFF1A1250, 0), rgba(0xFF1A1250, 0.92 * a), rgba(0xFF1A1250, 0.92 * a), rgba(0xFF1A1250, 0)],
                              [0.0, 0.25, 0.75, 1.0]))
    c.drawRect(skia.Rect.MakeXYWH(0, y0, W, band_h), p)
    sweep = (t - start) / dur
    glow(c, -200 + sweep * (W + 400), y0 + band_h / 2, 260, 0xFFBFAFFF, 0.35 * a)
    c.drawLine(W * 0.2, y0 + 8, W * 0.8, y0 + 8, paint(0xFFBFAFFF, 0.6 * a, 2))
    c.drawLine(W * 0.2, y0 + band_h - 8, W * 0.8, y0 + band_h - 8, paint(0xFFBFAFFF, 0.6 * a, 2))
    slide = (1 - k_in) * 60
    text(c, f"CHAPTER {n}", W / 2, y0 + 78, 44, 0xFFBFAFFF, "heavy", "center", a, glow=0xFF7A5CFF)
    text(c, title, W / 2 + slide, y0 + 172, 76, PAL["white"], "heavy", "center", a, stroke=6, stroke_color=0xFF120A30,
         glow=0xFF7A5CFF)


def term_card(c, t, start, term, sub="", x=W / 2, y=180, dur=4.0, color=PAL["yellow"], size=56, end=None):
    """重要語の短い強調表示。start で飛び出し、dur 秒（または end まで）表示する。"""
    stop = end if end is not None else start + dur
    if t < start - 0.01 or t > stop + 0.4:
        return
    k = ease_back(prog(t, start, 0.45))
    a = clamp((t - start) / 0.2) * (1 - clamp((t - stop) / 0.4))
    if a <= 0.003:
        return
    c.save()
    c.translate(x, y)
    c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k)
    w = max(text_width(term, size, "heavy"), text_width(sub, 26, "bold") if sub else 0) + 70
    h = size * 1.5 + (40 if sub else 0)
    rrect(c, -w / 2 + 6, -h / 2 + 10, w, h, 26, 0xFF000000, a * 0.4, blur=12)
    rrect(c, -w / 2, -h / 2, w, h, 26, 0xFF140F38, a * 0.94)
    rrect(c, -w / 2, -h / 2, w, h, 26, color, a, stroke=4)
    text(c, term, 0, -h / 2 + size * 1.12, size, color, "heavy", "center", a, glow=color)
    if sub:
        text(c, sub, 0, h / 2 - 20, 26, PAL["text"], "bold", "center", a)
    c.restore()


def caption_box(c, lines: list[str], x, y, size=34, alpha=1.0, color=PAL["text"], width=None, title=None,
                border=0xFF6E5CC8, title_color=PAL["yellow"]):
    """説明の札（箇条書き）。"""
    if alpha <= 0.003:
        return
    w = width or max(text_width(s, size, "bold") for s in lines) + 60
    h = len(lines) * size * 1.45 + 40 + (size * 1.4 if title else 0)
    panel(c, x, y, w, h, alpha, border=border)
    yy = y + 24 + size
    if title:
        text(c, title, x + 30, yy, size * 0.9, title_color, "heavy", alpha=alpha)
        yy += size * 1.4
    for s in lines:
        text(c, s, x + 30, yy, size, color, "bold", alpha=alpha)
        yy += size * 1.45


def scene_fade(c, t, S, fin=0.3, fout=0.3, strength=1.0):
    """シーンの頭と終わりの短いフェード（黒）。"""
    a_in = 1 - clamp(t / fin) if fin > 0 else 0.0
    a_out = clamp((t - (S.duration - fout)) / fout) if fout > 0 else 0.0
    a = max(a_in, a_out) * strength
    if a > 0:
        c.drawRect(skia.Rect(0, 0, W, H), paint(0xFF000000, a))


def speaker_tag(c, t, S, char_names: dict, x=None, y=None):
    """分子キャラクターが話すとき、名前の札を出す（字幕の色だけに頼らない）。"""
    ln = S.line_at(t)
    if not ln or ln["character_id"] in ("narr", "akari", "nuku"):
        return
    k = fade_line(t, ln)
    name, col = char_names.get(ln["character_id"], (ln["character_id"], PAL["text"]))
    label(c, name, x or W / 2, y or 860, 30, col, 0xFF120E30, k, border=col)


def chapter_intro(c, t, S):
    """章の最初のシーンで、ナレーション「チャプターN。…」の間だけ章タイトルを重ねる。"""
    for ln in S.lines[:1]:
        if ln["character_id"] == "narr" and ln["text"].startswith("チャプター"):
            chapter_card(c, t, S.chapter, S.chapter_title, start=max(0.0, ln["rel_start"] - 0.5),
                         dur=ln["rel_end"] - ln["rel_start"] + 1.6)
            return ln["rel_end"] + 0.6
    return 0.0


def char_badge(c, x, y, name, color, alpha=1.0):
    label(c, name, x, y, 28, color, 0xFF120E30, alpha, border=color)
