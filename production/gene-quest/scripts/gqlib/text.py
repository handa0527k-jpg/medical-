"""字幕テキスト（正式表記）から音声合成用の読みを作る。"""
from __future__ import annotations

import re
import unicodedata
from functools import lru_cache

import yaml

from .paths import CONFIG


@lru_cache(maxsize=1)
def _dictionary() -> list[tuple[str, str]]:
    d = yaml.safe_load((CONFIG / "pronunciation_dictionary.yaml").read_text(encoding="utf-8"))
    pairs = [(t["display"], t["reading"]) for t in d.get("terms", [])]
    pairs += [(t["display"], t["reading"]) for t in d.get("kanji", [])]
    # 長い表記から置換する（RNAポリメラーゼIII → II → I の順など）
    pairs.sort(key=lambda p: -len(p[0]))
    return pairs


LETTERS = dict(zip("ABCDEFGHIJKLMNOPQRSTUVWXYZ", [
    "エー", "ビー", "シー", "ディー", "イー", "エフ", "ジー", "エイチ", "アイ", "ジェー", "ケー", "エル", "エム",
    "エヌ", "オー", "ピー", "キュー", "アール", "エス", "ティー", "ユー", "ブイ", "ダブリュー", "エックス", "ワイ", "ゼット"]))


def normalize(text: str) -> str:
    """記号の揺れをそろえる（’ ′ → '、全角英数 → 半角）。マイナス記号 − は残す。"""
    text = text.replace("’", "'").replace("′", "'").replace("ʼ", "'")
    out = []
    for ch in text:
        if ch in "−–":
            out.append(ch)
        elif unicodedata.east_asian_width(ch) == "F" and ch.isascii() is False and unicodedata.normalize("NFKC", ch).isascii():
            out.append(unicodedata.normalize("NFKC", ch))
        else:
            out.append(ch)
    return "".join(out)


def to_reading(text: str) -> str:
    """辞書を使って、英字・記号・専門用語を読みに置き換える。"""
    s = normalize(text)
    # 置換済みの部分を再置換しないよう、私用領域の文字で囲んだ番号に置き換えておく
    slots: list[str] = []
    for disp, read in _dictionary():
        if disp in s:
            def put(_m, read=read):
                slots.append(read)
                return "\ue000" + str(len(slots) - 1) + "\ue001"
            s = re.sub(re.escape(disp), put, s)
    # 辞書に無い大文字の並び（塩基配列など）は1文字ずつ読む：GU → ジーユー
    s = re.sub(r"[A-Z]{1,12}", lambda m: "".join(LETTERS[c] for c in m.group(0)), s)
    s = re.sub("\ue000(\\d+)\ue001", lambda m: slots[int(m.group(1))], s)
    s = s.replace("……", "、").replace("…", "、")
    s = s.replace("（", "、").replace("）", "、").replace("(", "、").replace(")", "、")
    s = re.sub(r"、+", "、", s)
    return s.strip("、 ")


def leftover_latin(reading: str) -> list[str]:
    """読みに残ったアルファベット（辞書に無い英字）を返す。検証用。"""
    return re.findall(r"[A-Za-z][A-Za-z0-9\-']*", reading)
