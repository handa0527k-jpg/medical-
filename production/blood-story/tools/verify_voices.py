#!/usr/bin/env python3
"""
Transcribe voice files with faster-whisper and compare to the intended text.

    python3 tools/verify_voices.py [--prefix E01-] [--model small] [--out audio/voice/verify_episode01.json]

Comparison is done on kana readings (pykakasi if available, otherwise raw text) so that
kanji/kana spelling differences in the transcript do not count as errors.
"""
from __future__ import annotations

import argparse, difflib, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import AUDIO  # noqa: E402

PUNCT = re.compile(r"[\s、。！？!?…・「」『』（）()ー〜~,.\-]")


def to_kana(s: str) -> str:
    try:
        import pykakasi
        k = pykakasi.kakasi()
        s = "".join(it["hira"] for it in k.convert(s))
    except Exception:
        pass
    return PUNCT.sub("", s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prefix", default="E01-")
    ap.add_argument("--ids", default="")
    ap.add_argument("--model", default="small")
    ap.add_argument("--out", default=os.path.join(AUDIO, "voice", "verify_episode01.json"))
    a = ap.parse_args()
    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    meta = json.load(open(os.path.join(AUDIO, "voice", "voices.json"), encoding="utf-8"))
    ids = [s for s in a.ids.split(",") if s] or [k for k in meta if k.startswith(a.prefix)]
    res = json.load(open(a.out, encoding="utf-8")) if os.path.exists(a.out) else {}
    for lid in ids:
        m = meta[lid]
        import numpy as np
        from scipy import signal
        from audio_lib import read_wav
        x = read_wav(os.path.join(AUDIO, m["file"]))
        x = x.mean(1) if x.ndim == 2 else x
        x = signal.resample_poly(x, 1, 3).astype(np.float32)          # 48k -> 16k (av.open API mismatch)
        segs, _ = model.transcribe(x, language="ja", beam_size=5)
        hyp = "".join(s.text for s in segs).strip()
        ref_k, hyp_k = to_kana(m["speech"]), to_kana(hyp)
        ratio = difflib.SequenceMatcher(None, ref_k, hyp_k).ratio()
        res[lid] = dict(text=m["text"], speech=m["speech"], whisper=hyp, kana_similarity=round(ratio, 3))
        print(f"{lid}  {ratio:.3f}\n   ref: {m['text']}\n   asr: {hyp}", flush=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
