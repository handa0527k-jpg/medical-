#!/usr/bin/env python3
"""
BLOOD STORY voices with Style-Bert-VITS2 (local, CPU) -> natural, processed 48 kHz WAV.

Runs inside its own venv (style-bert-vits2 2.5.0 needs Python <= 3.11 + torch; system python has no torch):

    # one-time setup (models + BERT stay OUTSIDE the repo, in $SBV2_HOME)
    export SBV2_HOME=~/.cache/blood-story-sbv2
    uv venv --python 3.11 $SBV2_HOME/venv
    uv pip install --python $SBV2_HOME/venv/bin/python torch==2.4.1 --index-url https://download.pytorch.org/whl/cpu
    uv pip install --python $SBV2_HOME/venv/bin/python style-bert-vits2==2.5.0 transformers==4.46.3 numpy==1.26.4 \
        "huggingface_hub<0.30" "setuptools<70" soundfile scipy pyloudnorm
    $SBV2_HOME/venv/bin/python tools/voices_sbv2.py --setup      # BERT + JVNV models + user dictionary

    # record (cached by hash: only changed lines are re-synthesised)
    $SBV2_HOME/venv/bin/python tools/voices_sbv2.py [--only N1,A2] [--only-prefix E01-] [--force]

* Same line list as voices.py (intro lines + episode01_lines.EPISODE01_LINES): `text` = subtitle, `speech` = reading
  hints. A few hints that pyopenjtalk (SBV2's front end) parses worse than the kanji are mapped back through
  SBV2_READINGS (each one checked with the g2p output); medical terms the dictionary misreads (ヘム -> "エム",
  好中球 -> "コウチュウダマ", ...) are fixed with a small user dictionary (USER_DICT).
* Cast and per-line emotion: CAST (model / default style / weights) and LINE_STYLE (style per line, optionally
  several segments with different emotions, e.g. 「120日かあ……」 Sad -> 「だったら毎日…」 Happy).
* Post-processing is the edge-tts chain of voices.py (pause caps, trim, per-character EQ / compression / small room,
  mouth envelope) so the mix sees the same kind of file.
* Output: audio/voice_sbv2/<ID>.wav (48 kHz mono 24-bit) + audio/voice_sbv2/voices.json (same keys as
  audio/voice/voices.json). Raw model output cached in audio/voice_sbv2/raw/<ID>_<hash>.flac (44.1 kHz).
  The edge-tts takes in audio/voice/ are kept as a fallback: BS_VOICE_ENGINE=edge switches the mix tools back
  (audio_lib.voice_meta()).
"""
from __future__ import annotations

import argparse, hashlib, json, os, sys, time

import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audio_lib import SR, AUDIO, write_wav, eq  # noqa: E402
import voices as EDGE  # noqa: E402  (line list + the per-character finishing chain; edge_tts is not imported)

SBV2_HOME = os.environ.get("SBV2_HOME", os.path.expanduser("~/.cache/blood-story-sbv2"))
BERT_DIR = os.path.join(SBV2_HOME, "bert", "deberta-v2-large-japanese-char-wwm")
MODEL_DIR = os.path.join(SBV2_HOME, "model_assets")
USER_DIC = os.path.join(SBV2_HOME, "blood_story_user.dic")
OUT_DIR = os.path.join(AUDIO, "voice_sbv2")
RAW_DIR = os.path.join(OUT_DIR, "raw")
FPS = 30
ENGINE_TAG = "sbv2-2.5.0"

# ----------------------------------------------------------------------------- models
# (hf repo, folder) - all JP-Extra. Licences / credits: CREDITS.md.
MODELS = {
    "jvnv-F1-jp": ("litagin/style_bert_vits2_jvnv", "jvnv-F1-jp"),
    "jvnv-F2-jp": ("litagin/style_bert_vits2_jvnv", "jvnv-F2-jp"),
    "jvnv-M1-jp": ("litagin/style_bert_vits2_jvnv", "jvnv-M1-jp"),
    "jvnv-M2-jp": ("litagin/style_bert_vits2_jvnv", "jvnv-M2-jp"),
}
BERT_REPO = "ku-nlp/deberta-v2-large-japanese-char-wwm"

# pyopenjtalk user dictionary (surface, reading, accent nucleus / morae). Checked with g2p.
USER_DICT = [
    ("ヘム", "ヘム", "1/2"),
    ("好中球", "コウチュウキュウ", "3/6"),
    ("好酸球", "コウサンキュウ", "3/6"),
    ("好塩基球", "コウエンキキュウ", "5/7"),
    ("巨核球", "キョカクキュウ", "3/5"),
    ("赤芽球", "セキガキュウ", "3/5"),
]

# speech (edge-tts reading hints) -> SBV2 text. Only where pyopenjtalk reads the kanji correctly and the
# hiragana hint got a broken word split / accent (e.g. 「こうさんきゅうは」 -> は read as "ハ").
SBV2_READINGS = [
    ("こうちゅうきゅう", "好中球"), ("こうさんきゅう", "好酸球"), ("こうえんききゅう", "好塩基球"),
    ("きょかくきゅう", "巨核球"), ("せきがきゅう", "赤芽球"), ("もうじょうせっけっきゅう", "網状赤血球"),
    ("けっぺい", "血餅"), ("けっせい", "血清"), ("けっしょう", "血漿"),
    ("りょうおうえんばん", "両凹円盤"), ("ひゃくにじゅうにち", "百二十日"),
]

# ----------------------------------------------------------------------------- cast
# sdp_ratio: share of the stochastic duration predictor (more = livelier rhythm), noise / noise_w: variation of
# the voice / of the durations, length: duration scale (>1 slower), intonation: SBV2 intonation scale.
CAST = {
    "N": dict(model="jvnv-F1-jp", style="Neutral", weight=1.0, sdp=0.2, noise=0.6, noise_w=0.8, length=1.0,
              intonation=1.0, seed=1),
    "アカネ": dict(model="jvnv-F2-jp", style="Happy", weight=2.0, sdp=0.3, noise=0.6, noise_w=0.8, length=1.0,
                intonation=1.0, seed=1),
    "シロウ": dict(model="jvnv-M1-jp", style="Neutral", weight=1.0, sdp=0.2, noise=0.6, noise_w=0.8, length=1.0,
                intonation=1.0, seed=1),
}

# per-line overrides: style / weight / sdp / noise / noise_w / length / intonation / seed / text,
# or segments=[dict(text=..., style=..., weight=..., gap=seconds of silence before), ...]
LINE_STYLE: dict[str, dict] = {}


# ----------------------------------------------------------------------------- helpers
def sbv2_text(speech: str) -> str:
    for a, b in SBV2_READINGS:
        speech = speech.replace(a, b)
    return speech


def line_settings(l: dict) -> dict:
    c = dict(CAST[l["who"]])
    o = LINE_STYLE.get(l["id"], {})
    c.update({k: v for k, v in o.items() if k != "segments"})
    text = o.get("text", sbv2_text(l["speech"]))
    segs = o.get("segments") or [dict(text=text)]
    c["segments"] = [dict({k: c[k] for k in ("style", "weight", "sdp", "noise", "noise_w", "length",
                                              "intonation", "seed")}, gap=0.0, **s) for s in segs]
    e = EDGE.settings(l)
    c["pause_cap"], c["comma_cap"] = e["pause_cap"], e["comma_cap"]
    return c


def take_hash(model: str, seg: dict) -> str:
    key = json.dumps([ENGINE_TAG, model, seg["text"], seg["style"], seg["weight"], seg["sdp"], seg["noise"],
                      seg["noise_w"], seg["length"], seg["intonation"], seg["seed"]], ensure_ascii=False)
    return hashlib.sha1(key.encode()).hexdigest()[:12]


# ----------------------------------------------------------------------------- engine
class Engine:
    def __init__(self, threads: int = 4):
        import torch
        torch.set_num_threads(threads)
        # torch 2.4 CPU: oneDNN's ConvTranspose1d is ~10x slower than the native kernel for the VITS decoder
        # (8.6 s -> 0.3 s per line); conv1d stays on oneDNN (faster there).
        _fwd = torch.nn.ConvTranspose1d.forward

        def _ct_forward(self, *a, **k):
            with torch.backends.mkldnn.flags(enabled=False):
                return _fwd(self, *a, **k)
        torch.nn.ConvTranspose1d.forward = _ct_forward
        self.torch = torch
        from style_bert_vits2.nlp import bert_models
        from style_bert_vits2.constants import Languages
        bert_models.load_model(Languages.JP, BERT_DIR)
        bert_models.load_tokenizer(Languages.JP, BERT_DIR)
        if os.path.exists(USER_DIC):
            from style_bert_vits2.nlp.japanese import pyopenjtalk_worker as pj
            pj.update_global_jtalk_with_user_dict(USER_DIC)
        self.models = {}

    def model(self, name: str):
        if name not in self.models:
            from style_bert_vits2.tts_model import TTSModel
            d = os.path.join(MODEL_DIR, name)
            st = sorted(f for f in os.listdir(d) if f.endswith(".safetensors"))[0]
            from pathlib import Path
            self.models[name] = TTSModel(model_path=Path(d, st), config_path=Path(d, "config.json"),
                                         style_vec_path=Path(d, "style_vectors.npy"), device="cpu")
        return self.models[name]

    def synth(self, model: str, seg: dict) -> tuple[int, np.ndarray]:
        m = self.model(model)
        self.torch.manual_seed(int(seg["seed"]))
        sr, a = m.infer(seg["text"], style=seg["style"], style_weight=float(seg["weight"]),
                        sdp_ratio=float(seg["sdp"]), noise=float(seg["noise"]), noise_w=float(seg["noise_w"]),
                        length=float(seg["length"]), intonation_scale=float(seg["intonation"]), line_split=False)
        a = np.asarray(a)
        a = a.astype(np.float64) / 32768.0 if a.dtype == np.int16 else a.astype(np.float64)
        return sr, a


def to48k(a: np.ndarray, sr: int) -> np.ndarray:
    g = np.gcd(sr, SR)
    return signal.resample_poly(a, SR // g, sr // g)


def raw_take(engine: Engine | None, lid: str, model: str, seg: dict, force=False) -> tuple[str, np.ndarray]:
    import soundfile as sf
    h = take_hash(model, seg)
    path = os.path.join(RAW_DIR, f"{lid}_{h}.flac")
    if force or not os.path.exists(path):
        if engine is None:
            raise RuntimeError("engine required")
        t0 = time.time()
        sr, a = engine.synth(model, seg)
        os.makedirs(RAW_DIR, exist_ok=True)
        sf.write(path, a, sr, subtype="PCM_16")
        print(f"  synth {lid} [{seg['style']} x{seg['weight']}] {len(a) / sr:.2f}s in {time.time() - t0:.1f}s  "
              f"{seg['text']}", flush=True)
    a, sr = sf.read(path, dtype="float64")
    return path, to48k(a, sr)


def assemble(engine, l: dict, s: dict, force=False) -> tuple[list[str], np.ndarray]:
    """synthesise (or load) every segment, trim the joins, and put `gap` seconds of silence between them."""
    paths, parts = [], []
    for k, seg in enumerate(s["segments"]):
        p, x = raw_take(engine, l["id"], s["model"], seg, force)
        paths.append(p)
        if len(s["segments"]) > 1:
            on, off = EDGE.speech_bounds(x, thr_db=-45)
            x = x[max(0, int((on - 0.03) * SR)): int((off + 0.06) * SR)]
            if k:
                parts.append(np.zeros(int(seg["gap"] * SR)))
        parts.append(x)
    return paths, np.concatenate(parts)


def process(l: dict, s: dict, x: np.ndarray) -> tuple[np.ndarray, dict]:
    """the voices.py chain: pause caps, trim, per-character finishing, -1 dBFS peak, mouth envelope."""
    ch = EDGE.CHARACTERS[l["who"]]
    x = x - np.mean(x)
    x = signal.sosfilt(signal.butter(2, 50, "hp", fs=SR, output="sos"), x)
    x = EDGE.shorten_pauses(x, s["pause_cap"], s["comma_cap"])
    x = EDGE.trim(x)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.5
    dry = eq(x, ch["eq"])
    y = EDGE.finish(x, ch)
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.89
    on, off = EDGE.speech_bounds(x)
    return y, dict(length=round(len(y) / SR, 3), speech_on=round(on, 3), speech_off=round(off, 3),
                   mouth=EDGE.mouth_envelope(dry[: int(off * SR) + SR // FPS]))


def build(only=None, prefix="", force=False):
    engine = None
    todo = [l for l in EDGE.LINES if (not only or l["id"] in only) and (not prefix or l["id"].startswith(prefix))]
    # load the engine only if some take is missing
    for l in todo:
        s = line_settings(l)
        if force or any(not os.path.exists(os.path.join(RAW_DIR, f"{l['id']}_{take_hash(s['model'], g)}.flac"))
                        for g in s["segments"]):
            engine = Engine()
            break
    meta_path = os.path.join(OUT_DIR, "voices.json")
    meta = json.load(open(meta_path, encoding="utf-8")) if os.path.exists(meta_path) else {}
    for l in todo:
        s = line_settings(l)
        raws, x = assemble(engine, l, s, force)
        y, info = process(l, s, x)
        write_wav(os.path.join(OUT_DIR, f"{l['id']}.wav"), y)
        meta[l["id"]] = dict(who=l["who"], text=l["text"], speech=l["speech"], file=f"voice_sbv2/{l['id']}.wav",
                             raw=[os.path.relpath(p, AUDIO) for p in raws], engine=ENGINE_TAG, model=s["model"],
                             segments=s["segments"], pause_cap=s["pause_cap"], comma_cap=s["comma_cap"], **info)
        st = "+".join(f"{g['style']}x{g['weight']}" for g in s["segments"])
        print(f"  {l['id']:8s} {s['model']:11s} {st:22s} len {s['segments'][0]['length']:.2f}  "
              f"speech {info['speech_on']:.2f}-{info['speech_off']:.2f}s ({info['speech_off'] - info['speech_on']:.2f}s)",
              flush=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    meta = {k: meta[k] for k in [l["id"] for l in EDGE.LINES] if k in meta}
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)


def prune():
    """delete raw takes that no line references any more"""
    keep = set()
    for l in EDGE.LINES:
        s = line_settings(l)
        keep |= {f"{l['id']}_{take_hash(s['model'], g)}.flac" for g in s["segments"]}
    for f in os.listdir(RAW_DIR):
        if f not in keep:
            os.remove(os.path.join(RAW_DIR, f))
            print("  removed", f)


def setup():
    """download BERT + voice models into $SBV2_HOME and compile the user dictionary"""
    from huggingface_hub import snapshot_download
    snapshot_download(BERT_REPO, local_dir=BERT_DIR,
                      allow_patterns=["*.json", "vocab.txt", "model.safetensors", "README.md"])
    for name, (repo, folder) in MODELS.items():
        snapshot_download(repo, local_dir=MODEL_DIR, allow_patterns=[f"{folder}/*", "README.md"])
    csv = USER_DIC.replace(".dic", ".csv")
    with open(csv, "w", encoding="utf-8") as f:
        for surf, read, acc in USER_DICT:
            f.write(f"{surf},,,1,名詞,一般,*,*,*,*,{surf},{read},{read},{acc},*\n")
    import pyopenjtalk
    pyopenjtalk.mecab_dict_index(csv, USER_DIC)
    print("SBV2_HOME ready:", SBV2_HOME)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--only-prefix", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--setup", action="store_true")
    ap.add_argument("--prune", action="store_true")
    a = ap.parse_args()
    if a.setup:
        setup()
    elif a.prune:
        prune()
    else:
        build([s for s in a.only.split(",") if s], a.only_prefix, a.force)
