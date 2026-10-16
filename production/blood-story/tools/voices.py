#!/usr/bin/env python3
"""
BLOOD STORY voices (edge-tts neural voices -> natural, processed 48 kHz WAV).

    SSL_CERT_FILE=/root/.ccr/ca-bundle.crt python3 tools/voices.py [--only N1,A2] [--force]

* Each line is recorded in ONE request (one breath) so the voice keeps its own sentence prosody.
  Readings that the engine could get wrong are spelled in kana in `speech` (体 -> からだ);
  `text` is the subtitle (original kanji).
* Only long sentence pauses are shortened afterwards (pause_cap) - the audio is never time-stretched,
  speed changes go through the engine's own `rate` (kept small).
* Per-character finishing (EQ / gentle compression / a very small room) gives each voice presence.
* Output: audio/voice/<ID>.wav (48 kHz mono, 24-bit), audio/voice/voices.json (durations, settings,
  lip-sync envelope at 30 fps). Raw engine output is cached in audio/voice/raw/<hash>.mp3.

New lines for the full episode: add entries to LINES (id, who, text, speech, overrides) and re-run.
"""
from __future__ import annotations

import argparse, asyncio, hashlib, json, os, ssl, subprocess, sys

import numpy as np
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import SR, AUDIO, write_wav, eq, compress, make_ir, reverb, hp, lp  # noqa: E402

VOICE_DIR = os.path.join(AUDIO, "voice")
RAW_DIR = os.path.join(VOICE_DIR, "raw")
FORMAT = "audio-24khz-96kbitrate-mono-mp3"     # best quality the read-aloud endpoint serves
FPS = 30

# ----------------------------------------------------------------------------- characters
# rate/pitch stay inside the range where the neural voice still sounds like itself.
CHARACTERS = {
    "N": dict(name="ナレーション", voice="ja-JP-NanamiNeural", rate=0, pitch=-10,
              pause_cap=0.50, comma_cap=0.30,
              # warm, close, documentary: a touch of low-mid body, soft top, very small dry room
              eq=[("hp", 75, 0.7, 0), ("lowshelf", 220, 0.7, 2.0), ("peak", 3200, 1.0, -1.0),
                  ("peak", 5200, 2.0, 1.0)],
              comp=dict(thresh_db=-20, ratio=2.2, att=0.008, rel=0.18, makeup_db=2.0),
              room=dict(dur=0.45, damp_hz=6000, wet=0.06)),
    "アカネ": dict(name="アカネ", voice="ja-JP-NanamiNeural", rate=8, pitch=24,
                pause_cap=0.38, comma_cap=0.22,
                # bright, forward: less low end, presence lift
                eq=[("hp", 120, 0.7, 0), ("peak", 300, 1.0, -1.5), ("peak", 3000, 0.9, 2.5),
                    ("highshelf", 8000, 0.7, 1.5)],
                comp=dict(thresh_db=-20, ratio=3.0, att=0.004, rel=0.12, makeup_db=2.5),
                room=dict(dur=0.7, damp_hz=5000, wet=0.10)),
    "シロウ": dict(name="シロウ", voice="ja-JP-KeitaNeural", rate=4, pitch=-4,
                pause_cap=0.36, comma_cap=0.24,
                # firm: chest body, a little bite at 2.5 kHz, tighter compression
                eq=[("hp", 85, 0.7, 0), ("peak", 160, 0.9, 2.0), ("peak", 450, 1.2, -1.5),
                    ("peak", 2500, 1.0, 2.5), ("highshelf", 7500, 0.7, 0.5)],
                comp=dict(thresh_db=-22, ratio=3.5, att=0.003, rel=0.10, makeup_db=3.0),
                room=dict(dur=0.7, damp_hz=5000, wet=0.10)),
}

# ----------------------------------------------------------------------------- lines
# text = subtitle (original), speech = what the engine reads (reading hints in kana).
LINES = [
    dict(id="N1", who="N", text="ここは、私たちの体の中。今日も無数の細胞たちが、命を支えている。",
         speech="ここは、私たちのからだの中。今日も無数の細胞たちが、命を支えている。", rate=8, pause_cap=0.42),
    dict(id="A1", who="アカネ", text="よーし！酸素を届けに行くよ！",
         speech="よーし！酸素を届けに行くよ！", pause_cap=0.30),
    dict(id="A2", who="アカネ", text="細い道でも大丈夫！私たちは、全身に酸素を届けるんだから！",
         speech="細い道でも大丈夫！私たちは、全身に酸素を届けるんだから！"),
    dict(id="A3", who="アカネ", text="えっ！？何が起きたの！？",
         speech="えっ！？何が起きたの！？", rate=10, pause_cap=0.22),
    dict(id="S1", who="シロウ", text="異物を発見……！",
         speech="異物を発見……！"),
    dict(id="S2", who="シロウ", text="体を守るのが、俺たち白血球の仕事だ！",
         speech="からだを守るのが、俺たち白血球の仕事だ！", rate=6, comma_cap=0.20),
    # the 30 s intro only has ~2.9 s after S2 (24.0-26.8) before 29.8 -> short closing narration.
    # The full sentence (N2_full, 7.65 s) is kept for the episode / an extended intro.
    dict(id="N2", who="N", text="運ぶ赤血球。守る白血球。",
         speech="運ぶ赤血球。守る白血球。", rate=4, pause_cap=0.30),
    # full closing narration for the episode (does not fit in the 30 s intro after S2)
    dict(id="N2_full", who="N", text="運ぶ赤血球。そして、体を守る白血球。血液の中では、今日も戦いが続いている。",
         speech="運ぶ赤血球。そして、からだを守る白血球。血液の中では、今日も戦いが続いている。", rate=6),
]

# Episode 1 (script #2-#36): ids "E01-xx". Build them with  --only-prefix E01-  (intro files untouched).
from episode01_lines import EPISODE01_LINES  # noqa: E402
LINES += EPISODE01_LINES


# ----------------------------------------------------------------------------- engine
def edge_module():
    import edge_tts.communicate as M
    src = open(M.__file__, encoding="utf-8").read().replace(
        '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"', f'"outputFormat":"{FORMAT}"')
    exec(compile(src, M.__file__, "exec"), M.__dict__)
    ca = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    if not ca and os.path.exists("/root/.ccr/ca-bundle.crt"):
        ca = "/root/.ccr/ca-bundle.crt"
    if ca and os.path.exists(ca):
        M._SSL_CTX = ssl.create_default_context(cafile=ca)
    return M


async def record(M, speech, voice, rate, pitch, out):
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    for k in range(5):
        try:
            c = M.Communicate(speech, voice, rate=f"{rate:+d}%", pitch=f"{pitch:+d}Hz", proxy=proxy)
            await c.save(out + ".part")
            if os.path.getsize(out + ".part") > 1000:
                os.replace(out + ".part", out)
                return
        except Exception as e:
            print("  retry", k + 1, e, flush=True)
        await asyncio.sleep(1.5 * (k + 1))
    raise RuntimeError("could not record " + speech)


def decode(path) -> np.ndarray:
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f64le", "-ac", "1", "-ar", "24000", "pipe:1"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.float64).copy()
    return signal.resample_poly(x, 2, 1)          # 24k -> 48k


# ----------------------------------------------------------------------------- editing
def frame_db(x, hop=0.01):
    h = int(hop * SR)
    n = len(x) // h
    e = np.sqrt(np.mean(x[: n * h].reshape(n, h) ** 2, 1) + 1e-12)
    return 20 * np.log10(e / (np.max(e) + 1e-12) + 1e-12), h


def shorten_pauses(x, cap, comma_cap, thr_db=-38):
    """shorten internal silences: > ~0.45 s (sentence) -> cap, 0.2-0.45 s (comma) -> comma_cap."""
    d, h = frame_db(x)
    sil = d < thr_db
    runs, s = [], None
    for i, v in enumerate(sil):
        if v and s is None:
            s = i
        elif not v and s is not None:
            runs.append((s, i)); s = None
    voiced = np.nonzero(~sil)[0]
    if len(voiced) == 0:
        return x
    first, last = voiced[0], voiced[-1]
    out, pos = [], 0
    xf = int(0.006 * SR)
    for a, b in runs:
        if a <= first or b > last:          # leading / trailing silence handled by trim
            continue
        L = (b - a) * 0.01
        target = cap if L > 0.45 else (comma_cap if L > 0.2 else L)
        if L - target < 0.03:
            continue
        cut = int((L - target) * SR)
        mid = (a * h + b * h) // 2
        c0, c1 = mid - cut // 2, mid - cut // 2 + cut
        seg = x[pos:c0].copy()
        if out:
            pass
        out.append(seg)
        pos = c1
    out.append(x[pos:])
    # tiny crossfades at joins (inside silence; mainly safety)
    y = out[0]
    for seg in out[1:]:
        n = min(xf, len(y), len(seg))
        w = np.linspace(0, 1, n)
        y = np.concatenate([y[:-n], y[-n:] * (1 - w) + seg[:n] * w, seg[n:]]) if n else np.concatenate([y, seg])
    return y


def trim(x, lead=0.02, tail=0.10, thr_db=-48):
    d, h = frame_db(x)
    idx = np.nonzero(d > thr_db)[0]
    a = max(0, idx[0] * h - int(lead * SR))
    b = min(len(x), (idx[-1] + 1) * h + int(tail * SR))
    y = x[a:b].copy()
    n = int(0.004 * SR); y[:n] *= np.linspace(0, 1, n)
    n = int(0.03 * SR); y[-n:] *= np.linspace(1, 0, n) ** 2
    return y


def speech_bounds(x, thr_db=-40):
    d, h = frame_db(x)
    idx = np.nonzero(d > thr_db)[0]
    return idx[0] * h / SR, (idx[-1] + 1) * h / SR


def finish(x, ch):
    y = eq(x, ch["eq"])
    y = compress(y, **ch["comp"])
    # very small room, summed to mono (placement happens in the mix)
    r = ch["room"]
    ir = make_ir(dur=r["dur"], predelay=0.006, damp_hz=r["damp_hz"], seed=11)
    wet = reverb(y, ir, wet=r["wet"], dry=1.0).mean(1)
    tail = int(r["dur"] * 0.5 * SR)
    wet = wet[: len(y) + tail]
    n = tail; wet[-n:] *= np.linspace(1, 0, n) ** 2
    return wet


def mouth_envelope(x, fps=FPS):
    """per-frame 0..1 mouth opening from the dry voice RMS (smoothed, gated, soft-knee)."""
    hop = SR // fps
    n = int(np.ceil(len(x) / hop))
    pad = np.zeros(n * hop); pad[: len(x)] = x
    # speech band only, so breaths / room do not move the mouth
    v = signal.sosfilt(signal.butter(2, [200, 3500], "band", fs=SR, output="sos"), pad)
    r = np.sqrt(np.mean(v.reshape(n, hop) ** 2, 1))
    ref = np.percentile(r[r > 0], 95) if np.any(r > 0) else 1
    m = np.clip(r / (ref + 1e-9), 0, 1.2)
    m = np.clip((m - 0.08) / 0.8, 0, 1) ** 0.7          # gate + soft curve
    # fast open, slower close (attack ~1 frame, release ~2 frames)
    out = np.zeros_like(m); e = 0.0
    for i, v_ in enumerate(m):
        e = v_ if v_ > e else e * 0.45 + v_ * 0.55
        out[i] = e
    out = np.convolve(out, [0.25, 0.5, 0.25], mode="same")
    return [round(float(min(1.0, v_)), 3) for v_ in out]


# ----------------------------------------------------------------------------- main
def settings(line):
    ch = CHARACTERS[line["who"]]
    return dict(voice=line.get("voice", ch["voice"]), rate=line.get("rate", ch["rate"]),
                pitch=line.get("pitch", ch["pitch"]), pause_cap=line.get("pause_cap", ch["pause_cap"]),
                comma_cap=line.get("comma_cap", ch["comma_cap"]))


async def build(only=None, force=False, prefix=""):
    os.makedirs(RAW_DIR, exist_ok=True)
    M = edge_module()
    todo = [l for l in LINES if (not only or l["id"] in only) and (not prefix or l["id"].startswith(prefix))]

    async def one(l):
        s = settings(l)
        h = hashlib.sha1(f"{s['voice']}|{s['rate']}|{s['pitch']}|{FORMAT}|{l['speech']}".encode()).hexdigest()[:12]
        raw = os.path.join(RAW_DIR, f"{l['id']}_{h}.mp3")
        if force or not os.path.exists(raw):
            await record(M, l["speech"], s["voice"], s["rate"], s["pitch"], raw)
            print("  rec", l["id"], l["speech"], flush=True)
        return raw

    raws = await asyncio.gather(*(one(l) for l in todo))
    meta_path = os.path.join(VOICE_DIR, "voices.json")
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    for l, raw in zip(todo, raws):
        s = settings(l)
        ch = CHARACTERS[l["who"]]
        x = decode(raw)
        x = shorten_pauses(x, s["pause_cap"], s["comma_cap"])
        x = trim(x)
        x = x / (np.max(np.abs(x)) + 1e-9) * 0.5
        dry = eq(x, ch["eq"])
        y = finish(x, ch)
        y = y / (np.max(np.abs(y)) + 1e-9) * 0.89          # -1 dBFS peak per file
        on, off = speech_bounds(x)
        path = os.path.join(VOICE_DIR, f"{l['id']}.wav")
        write_wav(path, y)
        meta[l["id"]] = dict(who=l["who"], text=l["text"], speech=l["speech"], file=f"voice/{l['id']}.wav",
                             raw=os.path.relpath(raw, AUDIO), **s,
                             length=round(len(y) / SR, 3), speech_on=round(on, 3), speech_off=round(off, 3),
                             mouth=mouth_envelope(dry[: int(off * SR) + SR // FPS]))
        print(f"  {l['id']:8s} {s['voice'][6:]:14s} rate {s['rate']:+d}% pitch {s['pitch']:+d}Hz  "
              f"speech {on:.2f}-{off:.2f}s ({off - on:.2f}s)", flush=True)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only-prefix", default="", help="e.g. E01- : only the episode-1 lines")
    a = ap.parse_args()
    asyncio.run(build([s for s in a.only.split(",") if s], a.force, a.only_prefix))
