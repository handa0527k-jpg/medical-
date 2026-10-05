#!/usr/bin/env python3
"""
Self-hosted font subsets for the 授業動画 renderer (public/fonts/*-lv.woff2).

Every font the film draws with must be complete in every render worker before the first frame:
Google Fonts serves Japanese faces in ~100 lazily loaded unicode-range pieces, so parallel headless
workers ended up drawing some characters in a fallback face — and interleaved frames visibly shook.
These subsets hold every character the films can show (all genetics narrations + boards + the
renderer's own labels), so a single FontFace load makes the face complete.

  python scripts/lecture-video/build-fonts.py        # needs fontTools + brotli; sources in .cache/fonts
"""
import glob
import json
import re
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / ".cache" / "fonts"
OUT = ROOT / "public" / "fonts"
GH = "https://raw.githubusercontent.com/google/fonts/main/ofl"

FACES = [  # (source file, output file, google/fonts path)
    ("zenkakugothicnew-ZenKakuGothicNew-Black.ttf", "ZenKakuGothicNew-Black-lv.woff2", "zenkakugothicnew/ZenKakuGothicNew-Black.ttf"),
    ("zenkakugothicnew-ZenKakuGothicNew-Bold.ttf", "ZenKakuGothicNew-Bold-lv.woff2", "zenkakugothicnew/ZenKakuGothicNew-Bold.ttf"),
    ("kleeone-KleeOne-SemiBold.ttf", "KleeOne-SemiBold-lv.woff2", "kleeone/KleeOne-SemiBold.ttf"),
]


def charset() -> str:
    chars = set()
    for f in glob.glob(str(ROOT / "src/content/courses/genetics-*/narrations/*.json")):
        chars |= set(json.dumps(json.load(open(f, encoding="utf-8")), ensure_ascii=False))
    for f in glob.glob(str(ROOT / "src/engine/lecture-video/**/*.ts"), recursive=True):
        chars |= set(open(f, encoding="utf-8").read())
    chars |= {chr(c) for c in range(0x20, 0x7F)}        # ASCII
    chars |= {chr(c) for c in range(0x3000, 0x30FF + 1)}  # CJK punctuation, hiragana, katakana
    chars |= {chr(c) for c in range(0xFF01, 0xFF5E + 1)}  # full-width forms
    chars |= set("′″‘’“”…・―–—→←↑↓⇄≡≒≠≦≧±×÷°℃μαβγδΔ①②③④⑤⑥⑦⑧⑨⑩₀₁₂₃₄₅₆₇₈₉⁺⁻")
    return "".join(sorted(c for c in chars if not re.match(r"\s", c) or c == " "))


def main() -> None:
    text = charset()
    OUT.mkdir(parents=True, exist_ok=True)
    for src, out, gh in FACES:
        p = SRC / src
        if not p.exists():
            raise SystemExit(f"missing {p} — download {GH}/{gh}")
        opt = subset.Options()
        opt.flavor = "woff2"
        opt.layout_features = ["*"]
        opt.name_IDs = ["*"]
        f = subset.load_font(str(p), opt)
        s = subset.Subsetter(opt)
        s.populate(text=text)
        s.subset(f)
        subset.save_font(f, str(OUT / out), opt)
        print(f"{out}: {len(text)} chars, {(OUT / out).stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
