"""ファインマン・チェック（各章の終わり）：アカリが自分の言葉で説明 → ヌクが詰まりどころを指摘 → 言い直す。

板書の文は原稿のシーン見出し（card_title, card_try, card_wrong, card_gap, card_fix）から読む。
"""
from __future__ import annotations

from ..bg import background
from ..draw import PAL, W, ease, ease_back, line, panel, prog, rrect, text, text_center, text_width
from ..layout import cast, hud, scene_fade
from ..render import visual

X0, X1 = 430, 1590          # 板書の左右（左下のアカリ、右のヌクにかからない幅）
SIZE = 34


def wrap_width(s: str, size: float, width: float) -> list[str]:
    """幅に収まるように1文字ずつ折り返す（行頭に句読点を置かない）。"""
    rows, cur = [], ""
    for ch in s:
        if cur and text_width(cur + ch, size, "bold") > width and ch not in "、。）」！？":
            rows.append(cur)
            cur = ""
        cur += ch
    if cur:
        rows.append(cur)
    return rows


def block(c, t0, t, y, tag, body, color, wrong="", k_wrong=0.0):
    """見出し札と本文。wrong の部分に、指摘の時点から赤い取り消し線を引く。"""
    k = ease(prog(t, t0 - 0.1, 0.5))
    if k <= 0:
        return y
    tw = text_width(tag, 26, "heavy") + 32
    rrect(c, X0 + 40, y - 30, tw, 40, 20, color, k * 0.95)
    text(c, tag, X0 + 56, y - 2, 26, 0xFF120A30, "heavy", alpha=k)
    rows = wrap_width(body, SIZE, X1 - X0 - 120)
    pos = 0
    span = (body.find(wrong), body.find(wrong) + len(wrong)) if wrong and wrong in body else None
    for i, r in enumerate(rows):
        yy = y + 52 + i * 50
        text(c, r, X0 + 60, yy, SIZE, PAL["text"], "bold", alpha=k)
        if span and k_wrong > 0:
            a, b = max(span[0], pos), min(span[1], pos + len(r))
            if a < b:
                xa = X0 + 60 + text_width(r[: a - pos], SIZE, "bold")
                xb = X0 + 60 + text_width(r[: b - pos], SIZE, "bold")
                rrect(c, xa - 4, yy - 34, (xb - xa + 8), 44, 8, PAL["red"], 0.22 * k_wrong)
                line(c, xa, yy - 12, xa + (xb - xa) * k_wrong, yy - 12, PAL["red"], 4, k_wrong)
        pos += len(r)
    return y + 52 + len(rows) * 50 + 40


@visual("feynman_check")
def feynman_check(c, t, S):
    background(c, "quiz", t)
    cards = S.d.get("cards", {})
    t_try, t_gap, t_fix = S.cue("try"), S.cue("gap"), S.cue("fix")
    # 見出し
    k = ease_back(prog(t, 0.1, 0.6))
    c.save()
    c.translate(W / 2, 110)
    c.scale(k, k)
    rrect(c, -300, -44, 600, 88, 44, PAL["yellow"], 1)
    text_center(c, "FEYNMAN CHECK", 0, 0, 46, 0xFF2A1A00, "heavy", "center")
    c.restore()
    text(c, cards.get("title", "自分の言葉で説明してみよう"), W / 2, 206, 34, PAL["white"], "heavy", "center",
         ease(prog(t, 0.4, 0.6)))
    # 板書
    kp = ease(prog(t, t_try - 0.4, 0.6))
    panel(c, X0, 240, X1 - X0, 610, kp, border=PAL["yellow"])
    k_wrong = ease(prog(t, t_gap + 0.4, 0.6))
    y = 300
    y = block(c, t_try, t, y, "① アカリの説明", cards.get("try", ""), PAL["blue"], cards.get("wrong", ""), k_wrong)
    y = block(c, t_gap, t, y, "② 詰まったところ", cards.get("gap", ""), PAL["orange"])
    block(c, t_fix, t, y, "③ 言い直し", cards.get("fix", ""), PAL["green"])
    # 終わりに、方法の要点
    t_end = S.Lend(len(S.lines))
    ke = ease(prog(t, S.Lend(len(S.lines) - 1) if len(S.lines) > 1 else t_end, 0.6))
    text(c, "説明に詰まったところ ＝ まだ分かっていないところ", W / 2, 885, 28, PAL["muted"], "bold", "center", ke * kp)
    cast(c, t, S, akari_s=0.55, nuku_x=1760, nuku_y=640, nuku_s=0.5)
    hud(c, t, S)
    scene_fade(c, t, S)
