#!/usr/bin/env python3
"""YouTube upload kit for the epigenetics film (KO先生): title, description with chapters, captions (SRT), tags, thumbnail.

  python3 production/lecture-video/youtube/make_epigenetics.py
"""
import json, math, sys
from pathlib import Path

R = Path(__file__).resolve().parents[3]
FILM = R / "production/lecture-video/epigenetics-jojo"
OUT = Path(__file__).resolve().parent
sys.path.insert(0, str(FILM))

T = json.loads((FILM / "timeline.json").read_text(encoding="utf-8"))
S = json.loads((FILM / "script.json").read_text(encoding="utf-8"))

TITLE = "【遺伝医学】エピジェネティクス｜KO先生の黄金の授業（DNAメチル化・ヒストン修飾・ゲノムインプリンティング）"
TAGS = ("遺伝医学, エピジェネティクス, エピゲノム, DNAメチル化, ヒストン修飾, クロマチンリモデリング, ゲノムインプリンティング, "
        "プラダー・ウィリー症候群, アンジェルマン症候群, X染色体不活性化, iPS細胞, 医学部, 医学生, 分子生物学, 授業動画, 国試対策")
CHAPTER = {
    "S01": "オープニング", "S02": "エピジェネティクスとは（配列を変えない・記憶される）",
    "S03": "ジェネティクス vs エピジェネティクス（不可逆と可逆）", "S04": "ヒストン修飾（HAT・HDAC・HMT・HP1）",
    "S05": "DNAメチル化（CpG・DNMT・CpGアイランド）", "S06": "誤解、乱入！ 配列は変わらない",
    "S07": "発生・分化とiPS細胞（リプログラミング）", "S08": "ゲノムインプリンティングと片親性ダイソミー",
    "S09": "プラダー・ウィリー症候群とアンジェルマン症候群", "S10": "X染色体不活性化（三毛猫とXist）",
    "S11": "個体差と老化（双子・エピジェネティッククロック）", "S12": "がんとエピジェネティクス（脱メチル化剤・HDAC阻害剤）",
    "S13": "栄養（DOHaD・SAM）とエピゲノム編集", "S14": "決着：四つの奥義 →「理解ッ！」",
}


def ts(s):
    s = int(s)
    return f"{s // 60}:{s % 60:02d}"


def srt_time(x):
    ms = int(round(x * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def description():
    ch = []
    for sc in T["scenes"]:
        t = 0 if sc["id"] == "S01" else sc["start"]
        ch.append(f"{ts(t)} {CHAPTER[sc['id']]}")
    return f"""DNAの配列を変えずに、遺伝子のスイッチを入れたり切ったりする「エピジェネティクス」。
ヒストン修飾とDNAメチル化、発生・分化とiPS細胞、ゲノムインプリンティング（プラダー・ウィリー症候群／アンジェルマン症候群）、X染色体不活性化、双子と老化、がんの治療、栄養とエピゲノム編集まで。
黄金のオーラをまとった KO先生（こうせんせい）が、紛れ込んだ「誤解」を正しい知識で撃破しながら、講義1コマ分を約9分半で解説します。

▼ チャプター
{chr(10).join(ch)}

▼ 登場キャラクター
KO先生（こうせんせい）／メチル（DNAメチル化）／アセチル（ヒストンのアセチル化）／ヒストン八人衆（H2A・H2B・H3・H4 ×2）／HDAC／Xist／アザシチジン（DNA脱メチル化剤）／誤解（ゴカイ）

▼ この動画について
・内容は遺伝医学の講義資料「エピジェネティクス」に沿って作成し、図（DNA・ヌクレオソーム・クロマチン・染色体など）はすべて描き起こしています。患者の顔は描いていません。
・声は音声合成（Microsoft Neural 音声）、映像は自作の描画プログラムと Blender による3DCGのアニメーションです。キャラクターはすべてオリジナルです。
・字幕は映像に入っています。
・学習用の教材です。診断や治療の判断には使わないでください。

#遺伝医学 #エピジェネティクス #医学部
"""


def srt():
    out, n = [], 1
    for sc in T["scenes"]:
        for L in sc["lines"]:
            a, b = L["start"], L["start"] + L["dur"] + 0.25
            out.append(f"{n}\n{srt_time(a)} --> {srt_time(b)}\n{L['text']}\n")
            n += 1
    return "\n".join(out)


def thumbnail(path):
    import cairo
    import render
    from gfx import hexc, text, star_burst, WHITE, BLACK
    from characters import POSES, professor, gokai
    from render import background, aura, god_rays
    from diagrams import clip_surface

    W, H = 1280, 720
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    ctx = render.SafeContext(surf)
    ctx.save()
    ctx.scale(1, H / 630)          # the picture background is drawn for 630 px; stretch to the full thumbnail
    background(ctx, render.PALETTES["gold"][0], 3.0, 7, focus=(820, 300), gold=0.6)
    god_rays(ctx, 330, 250, 3.0, 1.0)
    ctx.restore()
    # villain on the right, purple aura
    if not render.gokai3d(ctx, 1080, 330, 1.05, 0.4):
        gokai(ctx, 1080, 330, 1.05, 0.4)
    star_burst(ctx, 1010, 240, 40, 110, 12, WHITE, rot=0.3, lw=5)
    text(ctx, "撃破ッ！", 1060, 640, 86, "reggae", fill=hexc("#ff2b6a"), stroke=BLACK, sw=10, outer=WHITE, ow=22,
         rot=-0.12)
    # KO先生 in the dramatic pose
    aura(ctx, lambda: professor(ctx, 205, 760, 0.95, POSES["jojo"], 1.0, talk=0.6, fierce=1.0), hexc("#ffd84a"), 0.0,
         strength=1.6)
    # title
    star_burst(ctx, 770, 160, 150, 260, 20, hexc("#fff200"), rot=0.2, lw=7)
    sf = clip_surface("logo_title", 4.0)
    if sf is not None:
        aura(ctx, lambda: (ctx.save(), ctx.translate(775, 150), ctx.scale(0.8, 0.8),
                           ctx.translate(-sf.get_width() / 2, -sf.get_height() / 2),
                           ctx.set_source_surface(sf, 0, 0), ctx.paint(), ctx.restore()), WHITE, 0,
             rings=((6, 1.0), (12, 1.0)))
    else:
        text(ctx, "エピジェネティクス", 775, 150, 80, "dela", fill=hexc("#ffc21f"), stroke=BLACK, sw=12, outer=WHITE, ow=26)
    text(ctx, "配列は変えないッ！", 720, 330, 62, "dela", fill=hexc("#38c6ff"), stroke=BLACK, sw=10, outer=WHITE, ow=22,
         rot=-0.06, shadow=(7, 7, BLACK))
    text(ctx, "メチル化・ヒストン修飾・インプリンティング", 720, 420, 32, "zen", fill=WHITE, stroke=BLACK, sw=9, rot=-0.06)
    text(ctx, "ゴゴゴゴ", 600, 560, 70, "reggae", fill=hexc("#b14dff"), stroke=BLACK, sw=8, outer=WHITE, ow=18, rot=-0.2)
    # label
    ctx.rectangle(0, 0, 420, 64)
    ctx.set_source_rgb(*hexc("#14102a")[:3])
    ctx.fill()
    text(ctx, "遺伝医学｜KO先生の黄金の授業", 18, 33, 26, "zen", fill=hexc("#ffe14d"), align="left")
    surf.flush()
    tmp = path.with_suffix(".png")
    surf.write_to_png(str(tmp))
    from PIL import Image
    Image.open(tmp).convert("RGB").save(path, quality=92)
    tmp.unlink()


def main():
    (OUT / "epigenetics_title.txt").write_text(TITLE + "\n", encoding="utf-8")
    assert len(TITLE) <= 100, len(TITLE)
    (OUT / "epigenetics_description.txt").write_text(description(), encoding="utf-8")
    (OUT / "epigenetics_ja.srt").write_text(srt(), encoding="utf-8")
    (OUT / "epigenetics_tags.txt").write_text(TAGS + "\n", encoding="utf-8")
    assert len(TAGS) <= 500
    thumbnail(OUT / "epigenetics_thumbnail.jpg")
    print("title", len(TITLE), "chars; tags", len(TAGS), "chars")


if __name__ == "__main__":
    main()
