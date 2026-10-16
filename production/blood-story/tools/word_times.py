#!/usr/bin/env python3
"""
Word timestamps of voice files (faster-whisper, word_timestamps=True), stored with a kana reading
so keywords can be found regardless of the transcript's kanji (homophones).

    python3 tools/word_times.py [--prefix E01-] [--model medium]  -> audio/voice_sbv2/words_episode01.json
    (audio/voice/words_episode01.json with BS_VOICE_ENGINE=edge)

Used by episode01_timeline.py: K(line_id, "けっしょう") -> time the keyword is spoken (aligned on the kana reading).
"""
from __future__ import annotations

import argparse, json, os, sys
import numpy as np
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import AUDIO, read_wav, voice_meta, voice_dir  # noqa: E402
from verify_voices import to_kana  # noqa: E402

OUT = os.path.join(voice_dir(), "words_episode01.json")       # per voice engine


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prefix", default="E01-")
    ap.add_argument("--ids", default="")
    ap.add_argument("--model", default="medium")
    a = ap.parse_args()
    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    meta = voice_meta()
    ids = [s for s in a.ids.split(",") if s] or [k for k in meta if k.startswith(a.prefix)]
    res = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
    for lid in ids:
        x = read_wav(os.path.join(AUDIO, meta[lid]["file"]))
        x = x.mean(1) if x.ndim == 2 else x
        x = signal.resample_poly(x, 1, 3).astype(np.float32)
        segs, _ = model.transcribe(x, language="ja", beam_size=5, word_timestamps=True)
        words = []
        for s in segs:
            for w in s.words:
                words.append(dict(w=w.word, kana=to_kana(w.word), start=round(w.start, 3), end=round(w.end, 3)))
        res[lid] = words
        print(lid, " ".join(f"{w['w']}@{w['start']}" for w in words), flush=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
