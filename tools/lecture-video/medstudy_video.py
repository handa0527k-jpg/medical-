#!/usr/bin/env python3
"""
MEDSTUDY 授業動画 — Windows 側の実行ツール（Linux / macOS でも動きます）

MEDSTUDY が書き出した「制作パッケージ」フォルダ（medstudy_video.json がある所）に対して:

  tts       Kokoro で講師音声を生成 → audio/S01.wav … と audio/kokoro_timing.json（実測の区間長）
  sfx       効果音を合成 → sfx/*.wav（外部素材なし・再現可能）
  comfy     ComfyUI（Wan 2.2）へ各ショットを投入 → wan/S01_a.webm …
  assemble  FFmpeg で 背景（Wan／無ければアニマティック）＋医学図レイヤー＋字幕＋音声＋効果音（＋BGM）を統合 → out/lecture.mp4
  check     何が揃っていて何が足りないかを表示
  all       tts → (MEDSTUDY でタイミング確定・レイヤー書き出し) → sfx → comfy → assemble の順のうち、実行できるものを実行

同期の順序：音声を先に確定させます。Kokoro の実測タイミング（audio/kokoro_timing.json）を MEDSTUDY に読み込むと、
映像の出来事（DNA の皿へ急接近、など）が「その語を言った瞬間」に合わせて引き直され、レイヤー・字幕・Wan のフレーム数が確定します。

必要なもの:
  pip install kokoro-onnx "misaki[ja]" fugashi unidic-lite soundfile numpy requests
  Kokoro モデル: kokoro-v1.0.onnx / voices-v1.0.bin（https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0）
  FFmpeg（PATH 上、または --ffmpeg で指定。libass 入りのビルド）
  ComfyUI（Wan 2.2 のモデルを配置済み、http://127.0.0.1:8188 で起動）
"""
from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import time
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
SR = 24000
FPS = 24
SCENE_TAIL = 0.15  # must match src/engine/lecture-video/timing.ts


def load(pkg: Path) -> dict:
    f = pkg / "medstudy_video.json"
    if not f.exists():
        sys.exit(f"medstudy_video.json がありません: {pkg}")
    return json.loads(f.read_text(encoding="utf-8"))


# --------------------------------------------------------------------------- Kokoro
def trim_silence(a, thr=0.012, pad=0.03):
    import numpy as np
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(pad * SR))
    e = min(len(a), idx[-1] + int(pad * SR))
    return a[s:e]


def make_g2p():
    """Kokoro's Japanese voices were trained on misaki's default (cutlet) phonemes — use them when fugashi +
    a UniDic dictionary are installed; fall back to the pyopenjtalk front end otherwise."""
    from misaki.ja import JAG2P
    try:
        g = JAG2P()
        g("テスト")
        return g, "cutlet"
    except Exception:  # noqa: BLE001
        return JAG2P(version="pyopenjtalk"), "pyopenjtalk"


def phonemes(g2p, text: str) -> str:
    """misaki's pyopenjtalk mode returns the phonemes followed by an equally long pitch-accent string
    (e.g. "noka." + "^^_jj"); Kokoro must get the phonemes only, or it voices the markup as stray sounds."""
    out, _ = g2p(text)
    half = len(out) // 2
    return out[:half] if len(out) % 2 == 0 and set(out[half:]) <= set("^_-j") else out


def utterances(segs: list) -> list:
    """Group a scene's segments into sentences. A sentence is read in one breath by Kokoro, so its
    intonation is not reset at every cue; it is cut back into segments at the pauses afterwards."""
    groups, cur = [], []
    short = lambda s: mora(s["say"]) <= 7  # list items (「DNA、RNA、脂質、…」) are read one by one
    for s in segs:
        if cur and (float(s.get("speed", 1)) != float(cur[-1].get("speed", 1)) or short(s) or short(cur[-1])):
            groups.append(cur); cur = []
        cur.append(s)
        if s["say"].rstrip()[-1:] in "。！？!?":
            groups.append(cur); cur = []
    if cur:
        groups.append(cur)
    return groups


def mora(t: str) -> float:
    import re
    t = re.sub(r"[ゃゅょぁぃぅぇぉャュョァィゥェォ]", "", t)
    return sum(1 if "\u3040" <= c <= "\u30ff" else 1.8 if "\u4e00" <= c <= "\u9fff" else 2.2 if c.isdigit() else 0 for c in t) or 1


def split_at_pauses(wav, parts: list) -> list:
    """Cut one sentence's audio into len(parts) pieces at the quiet points the voice made at the punctuation
    between them. Each cut is searched near the position the reading predicts, never closer than 45 % of
    the neighbouring pieces' predicted lengths (so a short list item cannot collapse), at the quietest
    10 ms frame (smoothed), with a small pull toward the prediction."""
    import numpy as np
    n = len(parts)
    if n == 1:
        return [wav]
    hop = int(0.01 * SR)
    env = np.array([np.sqrt(np.mean(wav[i:i + hop] ** 2)) for i in range(0, len(wav) - hop, hop)])
    env = np.convolve(env, np.ones(3) / 3, mode="same")
    w = np.array([mora(p) for p in parts], dtype=float)
    pred = w / w.sum() * len(env)  # predicted frames per piece
    cuts, prev = [], 0
    for k in range(n - 1):
        guess = prev + pred[k]
        lo = int(prev + pred[k] * 0.45)
        rest = pred[k + 1:].sum()
        hi = int(min(len(env) - rest * 0.45, guess + max(35, pred[k] * 0.6)))
        lo = max(lo, int(guess - max(35, pred[k] * 0.6)), prev + 1)
        if hi <= lo:
            c = int(guess)
        else:
            idx = np.arange(lo, hi)
            score = env[lo:hi] / (env.max() + 1e-9) + 0.25 * np.abs(idx - guess) / max(1.0, pred[k])
            c = int(idx[np.argmin(score)])
        cuts.append(c); prev = c
    edges = [0] + [c * hop for c in cuts] + [len(wav)]
    return [wav[edges[i]:edges[i + 1]] for i in range(n)]


def finish(audio):
    """Light finishing so the voice sits like a lecturer in a room: high-pass, gentle compression,
    a very short room tail, loudness to about −18 LUFS-ish RMS with peaks under −1 dBFS."""
    import numpy as np
    a = audio.astype(np.float64)
    # 1st-order high-pass at ~70 Hz
    k = np.exp(-2 * np.pi * 70 / SR); y = np.empty_like(a); xp = yp = 0.0
    for i, x in enumerate(a):
        yp = k * (yp + x - xp); xp = x; y[i] = yp
    # soft compression (above −20 dBFS, ratio ~2.5)
    w = int(0.02 * SR)
    env = np.sqrt(np.convolve(y ** 2, np.ones(w) / w, mode="same")) + 1e-9
    thr = 0.1
    gain = np.where(env > thr, (thr * (env / thr) ** (1 / 2.5)) / env, 1.0)
    y *= gain
    # short room: a few decaying early reflections + diffuse tail (≈ 0.25 s, −24 dB)
    rng = np.random.default_rng(7)
    ir_len = int(0.25 * SR)
    ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / (0.06 * SR)) * 0.035
    ir[0] = 1.0
    for d, g in ((0.011, 0.12), (0.019, 0.09), (0.027, 0.06)):
        ir[int(d * SR)] += g
    y = np.convolve(y, ir)[: len(y)]
    rms = np.sqrt(np.mean(y[np.abs(y) > 0.003] ** 2)) if np.any(np.abs(y) > 0.003) else 1
    y *= 0.12 / rms
    peak = np.max(np.abs(y))
    if peak > 0.89:
        y *= 0.89 / peak
    return y.astype(np.float32)


def cmd_tts(pkg: Path, a) -> None:
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro

    m = load(pkg)
    ks = m["kokoro"]
    model = Path(a.model or HERE / "models" / "kokoro-v1.0.onnx")
    voices = Path(a.voices or HERE / "models" / "voices-v1.0.bin")
    if not model.exists() or not voices.exists():
        sys.exit(f"Kokoro モデルが見つかりません: {model} / {voices}（README の手順で配置してください）")
    kk = Kokoro(str(model), str(voices))
    g2p, g2p_name = make_g2p()
    voice = a.voice or ks["voice"]
    base = float(a.speed or ks["speed"])
    print(f"Kokoro {voice}  speed {base}  G2P {g2p_name}")
    out = {"plan": ks["plan"], "voice": voice, "speed": base, "g2p": g2p_name, "scenes": []}
    (pkg / "audio").mkdir(exist_ok=True)
    for sc in ks["scenes"]:
        chunks, segs = [], []
        for group in utterances(sc["segs"]):
            say = "".join(s["say"] for s in group)
            wav, sr = kk.create(phonemes(g2p, say), voice=voice, speed=base * float(group[0].get("speed", 1)), is_phonemes=True)
            assert sr == SR, sr
            pieces = split_at_pauses(trim_silence(np.asarray(wav, dtype=np.float32)), [s["say"] for s in group])
            for s, piece in zip(group, pieces):
                chunks += [np.zeros(int(s.get("pre", 0) * SR), np.float32), piece, np.zeros(int(s.get("post", 0) * SR), np.float32)]
                segs.append({"beat": s["beat"], "i": s["i"], "speech": round(len(piece) / SR, 4)})
                print(f"  {sc['id']} {s['beat']}/{s['i']}  {len(piece) / SR:5.2f}s  {s['text']}")
        chunks.append(np.zeros(int(SCENE_TAIL * SR), np.float32))
        audio = finish(np.concatenate(chunks)) if not a.raw else np.concatenate(chunks)
        sf.write(pkg / sc["file"], audio, SR, subtype="PCM_16")
        out["scenes"].append({"id": sc["id"], "file": sc["file"], "duration": round(len(audio) / SR, 4), "segs": segs})
    total = sum(s["duration"] for s in out["scenes"])
    (pkg / "audio" / "kokoro_timing.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"音声 {total:.2f} 秒 → audio/kokoro_timing.json（MEDSTUDY の「Kokoroタイミングを読み込む」で映像を同期）")


# --------------------------------------------------------------------------- SFX
def synth(kind: str):
    """Short effects made from noise and sine waves (deterministic, no samples needed)."""
    import numpy as np
    rng = np.random.default_rng(zlib.crc32(kind.encode()))

    def env(n, a=0.005, d=0.3):
        t = np.arange(n) / SR
        return np.minimum(1, t / a) * np.exp(-t / d)

    def lp(x, k):  # one-pole low-pass, k = 0..1
        y = np.empty_like(x); acc = 0.0
        for i, v in enumerate(x):
            acc += k * (v - acc); y[i] = acc
        return y

    n = lambda s: int(s * SR)
    t = lambda s: np.arange(n(s)) / SR
    if kind == "whoosh":
        x = rng.standard_normal(n(0.55)); k = np.linspace(0.02, 0.35, len(x))
        y = np.empty_like(x); acc = 0
        for i, v in enumerate(x):
            acc += k[i] * (v - acc); y[i] = acc
        w = np.sin(np.linspace(0, math.pi, len(x))) ** 2
        return y * w * 1.6
    if kind == "impact":
        tt = t(0.6)
        return (lp(rng.standard_normal(len(tt)), 0.5) * env(len(tt), 0.001, 0.05) * 1.2 + np.sin(2 * math.pi * (90 - 40 * tt) * tt) * env(len(tt), 0.002, 0.18))
    if kind == "boom":
        tt = t(1.4)
        return np.sin(2 * math.pi * (58 - 18 * tt) * tt) * env(len(tt), 0.004, 0.45) * 1.3 + lp(rng.standard_normal(len(tt)), 0.08) * env(len(tt), 0.002, 0.25)
    if kind == "tick":
        tt = t(0.12)
        return np.sin(2 * math.pi * 1800 * tt) * env(len(tt), 0.0005, 0.02) * 0.6 + rng.standard_normal(len(tt)) * env(len(tt), 0.0005, 0.008) * 0.4
    if kind == "heartbeat":
        out = np.zeros(n(1.0))
        for at, g in ((0.0, 1.0), (0.24, 0.75)):
            tt = t(0.3); b = np.sin(2 * math.pi * 52 * tt) * env(len(tt), 0.004, 0.08) * g
            i = n(at); out[i:i + len(b)] += b
        return out * 1.5
    if kind == "riser":
        tt = t(1.3)
        f = 200 + 900 * (tt / tt[-1]) ** 2
        return (np.sin(2 * math.pi * np.cumsum(f) / SR) * 0.25 + lp(rng.standard_normal(len(tt)), 0.2) * 0.35) * (tt / tt[-1]) ** 1.5
    if kind == "chalk":
        out = np.zeros(n(0.9))
        for i in range(6):
            s = n(0.12 * i); d = n(0.07)
            out[s:s + d] += lp(rng.standard_normal(d), 0.6) * np.hanning(d) * 0.35
        return out
    if kind == "shimmer":
        tt = t(1.1)
        return sum(np.sin(2 * math.pi * f * tt) for f in (1320, 1760, 2640)) / 3 * env(len(tt), 0.02, 0.5) * (0.6 + 0.4 * np.sin(2 * math.pi * 9 * tt)) * 0.5
    raise ValueError(kind)


def cmd_sfx(pkg: Path, a) -> None:
    import numpy as np
    import soundfile as sf
    (pkg / "sfx").mkdir(exist_ok=True)
    for k in ("whoosh", "impact", "boom", "tick", "heartbeat", "riser", "chalk", "shimmer"):
        x = synth(k).astype(np.float32)
        x = x / max(1e-6, float(np.max(np.abs(x)))) * 0.8
        sf.write(pkg / "sfx" / f"{k}.wav", x, SR, subtype="PCM_16")
    print("効果音 → sfx/*.wav")


# --------------------------------------------------------------------------- ComfyUI
def cmd_comfy(pkg: Path, a) -> None:
    import requests
    m = load(pkg)
    prof = a.profile or m["wan"]["profile"]
    sub = f"{prof}-4step" if a.fast else prof
    server = a.server.rstrip("/")
    try:
        requests.get(f"{server}/system_stats", timeout=5).raise_for_status()
    except Exception as e:  # noqa: BLE001
        sys.exit(f"ComfyUI に接続できません（{server}）: {e}")
    (pkg / "wan").mkdir(exist_ok=True)
    for j in m["wan"]["jobs"]:
        dst = pkg / "wan" / f"{j['name']}.webm"
        if dst.exists() and not a.force:
            print(f"  {j['name']}: 既にあります（--force で作り直し）"); continue
        key = pkg / j["keyframe"]
        if not key.exists():
            sys.exit(f"キーフレームがありません: {key}（MEDSTUDY でレイヤーを書き出してください）")
        with open(key, "rb") as fh:
            up = requests.post(f"{server}/upload/image", files={"image": (key.name, fh, "image/png")}, data={"overwrite": "true"}, timeout=60).json()
        wf = json.loads((pkg / "comfy" / sub / f"{j['name']}.api.json").read_text(encoding="utf-8"))
        for node in wf.values():
            if node["class_type"] == "LoadImage":
                node["inputs"]["image"] = up["name"]
        pid = requests.post(f"{server}/prompt", json={"prompt": wf, "client_id": "medstudy"}, timeout=60).json()["prompt_id"]
        print(f"  {j['name']}: 投入 {pid}（{j['frames']} フレーム）", flush=True)
        t0 = time.time()
        while True:
            h = requests.get(f"{server}/history/{pid}", timeout=30).json()
            if pid in h:
                outs = [f for n in h[pid]["outputs"].values() for k in ("images", "gifs", "videos") for f in n.get(k, [])]
                vid = next((f for f in outs if str(f.get("filename", "")).endswith((".webm", ".mp4"))), None)
                if not vid:
                    sys.exit(f"{j['name']}: 出力が見つかりません: {h[pid].get('status')}")
                r = requests.get(f"{server}/view", params={"filename": vid["filename"], "subfolder": vid.get("subfolder", ""), "type": vid.get("type", "output")}, timeout=600)
                dst.write_bytes(r.content)
                print(f"  {j['name']}: 完了 {time.time() - t0:.0f}s → {dst.name}")
                break
            time.sleep(3)


# --------------------------------------------------------------------------- FFmpeg
def ffmpeg_bin(a) -> str:
    f = a.ffmpeg or shutil.which("ffmpeg")
    if not f:
        try:
            import imageio_ffmpeg
            f = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:  # noqa: BLE001
            sys.exit("FFmpeg が見つかりません（--ffmpeg で指定）")
    return f


def mix_audio(pkg: Path, e: dict, a):
    import numpy as np
    import soundfile as sf
    parts = []
    for sc in e["scenes"]:
        x, sr = sf.read(pkg / sc["audio"], dtype="float32")
        assert sr == SR
        parts.append(x)
    voice = np.concatenate(parts)
    mix = voice.copy()
    for sc in e["scenes"]:
        for s in sc["sfx"]:
            f = pkg / "sfx" / f"{s['kind']}.wav"
            if not f.exists():
                continue
            x, _ = sf.read(f, dtype="float32")
            i = int(s["t"] * SR)
            x = x[: max(0, len(mix) - i)] * 0.42 * float(s.get("gain", 1))
            mix[i:i + len(x)] += x
    if a.bgm:
        tmp = pkg / "out" / "_bgm.wav"
        subprocess.run([ffmpeg_bin(a), "-y", "-v", "error", "-i", a.bgm, "-ac", "1", "-ar", str(SR), str(tmp)], check=True)
        b, _ = sf.read(tmp, dtype="float32")
        b = np.resize(b, len(mix))
        # duck under the voice: envelope of the narration (50 ms window)
        w = int(0.05 * SR)
        envv = np.convolve(np.abs(voice), np.ones(w) / w, mode="same")
        duck = 1 - 0.7 * np.clip(envv / 0.05, 0, 1)
        mix += b * float(a.bgm_gain) * duck
    peak = float(np.max(np.abs(mix)))
    if peak > 0.97:
        mix *= 0.97 / peak
    sf.write(pkg / "out" / "mix.wav", mix, SR, subtype="PCM_16")
    return len(mix) / SR


def cmd_assemble(pkg: Path, a) -> None:
    e = json.loads((pkg / "edit.json").read_text(encoding="utf-8"))
    (pkg / "out").mkdir(exist_ok=True)
    plate = pkg / "layers" / "plate_00000.jpg"
    overlay = pkg / "layers" / "overlay_00000.png"
    full = pkg / "layers" / "full_00000.jpg"
    shots_all = [s for sc in e["scenes"] for s in sc["shots"]]
    if full.exists() and not overlay.exists():
        if any((pkg / s["wan"]).exists() for s in shots_all) and not a.animatic:
            sys.exit("Wan クリップを重ねるには医学図レイヤー（overlay）が必要です：render-layers.mjs を --full なしで実行してください")
        return assemble_full(pkg, e, a)
    if not overlay.exists():
        sys.exit("layers/overlay_*.png がありません（MEDSTUDY の「レイヤーを書き出す」または scripts/lecture-video/render-layers.mjs）")
    dur = mix_audio(pkg, e, a)
    frames = int(round(dur * FPS))
    ins, fc, segs, used_wan = [], [], [], 0
    shots = [s for sc in e["scenes"] for s in sc["shots"]]
    ins += ["-framerate", str(FPS), "-i", str(pkg / "layers" / "plate_%05d.jpg")]  # 0
    ins += ["-framerate", str(FPS), "-i", str(pkg / "layers" / "overlay_%05d.png")]  # 1
    fc.append(f"[0:v]split={len(shots)}" + "".join(f"[p{i}]" for i in range(len(shots))))
    for i, s in enumerate(shots):
        f0, f1 = s["f0"], s["f1"] if i + 1 < len(shots) else frames
        n = max(1, f1 - f0)
        wan = pkg / s["wan"]
        if wan.exists() and not a.animatic:
            used_wan += 1
            ins += ["-i", str(wan)]
            k = sum(1 for x in ins if x == "-i") - 1  # input index
            look = ",eq=brightness=-0.07:saturation=0.75:contrast=1.08" if s["mode"] == "background" else ""
            fc.append(f"[p{i}]null[d{i}]")
            fc.append(f"[{k}:v]fps={FPS},scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1{look},"
                      f"tpad=stop_mode=clone:stop_duration=10,trim=end_frame={n},setpts=PTS-STARTPTS[s{i}]")
        else:
            fc.append(f"[p{i}]trim=start_frame={f0}:end_frame={f0 + n},setpts=PTS-STARTPTS,setsar=1[s{i}]")
    fc.append("".join(f"[s{i}]" for i in range(len(shots))) + f"concat=n={len(shots)}:v=1:a=0[bg]")
    fc.append(f"[1:v]trim=end_frame={frames},setpts=PTS-STARTPTS[ov]")
    fc.append("[bg][ov]overlay=0:0:format=auto[v0]")
    inv = [w for sc in e["scenes"] for w in sc.get("invert", [])]
    last = "v0"
    if inv:
        cond = "+".join(f"between(t,{t:.3f},{t + d:.3f})" for t, d in inv)
        fc.append(f"[v0]negate=enable='{cond}'[v1]"); last = "v1"
    fonts = Path(a.fonts or HERE / "fonts")
    sub = str(pkg / e["subtitles"]).replace("\\", "/").replace(":", "\\:")
    fd = str(fonts).replace("\\", "/").replace(":", "\\:")
    if not a.no_subs:
        fc.append(f"[{last}]ass='{sub}':fontsdir='{fd}'[v]"); last = "v"
    # be honest in the picture: shots without a Wan clip carry a small corner tag
    tag = [(s["t0"], s["t0"] + s["dur"]) for s in shots if a.animatic or not (pkg / s["wan"]).exists()]
    if tag and not a.no_tag:
        tf = pkg / "out" / "_tag.ass"
        ev = "\n".join(f"Dialogue: 0,{ass_t(t0)},{ass_t(t1)},Tag,,0,0,0,,MEDSTUDY アニマティック（Wan 2.2 生成前）" for t0, t1 in tag)
        tf.write_text(TAG_ASS + ev + "\n", encoding="utf-8")
        tp = str(tf).replace("\\", "/").replace(":", "\\:")
        fc.append(f"[{last}]ass='{tp}':fontsdir='{fd}'[vt]"); last = "vt"
    ins += ["-i", str(pkg / "out" / "mix.wav")]
    ai = sum(1 for x in ins if x == "-i") - 1
    out = pkg / "out" / (a.out or "lecture.mp4")
    cmd = [ffmpeg_bin(a), "-y", "-v", "error", *ins, "-filter_complex", ";".join(fc), "-map", f"[{last}]", "-map", f"{ai}:a",
           "-c:v", "libx264", "-preset", "medium", "-crf", str(a.crf), "-pix_fmt", "yuv420p", "-r", str(FPS),
           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-t", f"{dur:.3f}", str(out)]
    (pkg / "out" / "ffmpeg_command.txt").write_text(" ".join(f'"{c}"' if " " in c or ";" in c else c for c in cmd), encoding="utf-8")
    subprocess.run(cmd, check=True)
    print(f"完成 → {out}（{dur:.2f} 秒・Wan クリップ {used_wan}/{len(shots)} ショット、残りは MEDSTUDY アニマティック）")


def ass_t(s: float) -> str:
    h, r = divmod(s, 3600); m, x = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{x:05.2f}"


TAG_ASS = """[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Tag,Zen Kaku Gothic New,15,&H40FFFFFF,&H40FFFFFF,&H80000000,&H80000000,-1,0,0,0,100,100,0,0,1,1.5,0,9,20,20,16,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def assemble_full(pkg: Path, e: dict, a) -> None:
    """No Wan clip yet: the composited MEDSTUDY animatic frames + subtitles + voice + SFX."""
    dur = mix_audio(pkg, e, a)
    frames = int(round(dur * FPS))
    fonts = Path(a.fonts or HERE / "fonts")
    fd = str(fonts).replace("\\", "/").replace(":", "\\:")
    fc = [f"[0:v]trim=end_frame={frames},setpts=PTS-STARTPTS,setsar=1[v0]"]
    last = "v0"
    if a.sub_band:
        # the picture at 87.5 % on top, a black band below it for the subtitles: they never cover the figures' own lettering
        fc.append(f"[{last}]scale=1120:630,pad=1280:720:80:0:black,setsar=1[vb]"); last = "vb"
    inv = [w for sc in e["scenes"] for w in sc.get("invert", [])]  # already inverted in the animatic frames
    sub = str(pkg / e["subtitles"]).replace("\\", "/").replace(":", "\\:")
    if not a.no_subs and a.sub_band:
        fc.append(f"[{last}]subtitles='{sub}':fontsdir='{fd}':force_style='MarginV=6,Fontsize=32'[v1]"); last = "v1"
    elif not a.no_subs:
        fc.append(f"[{last}]ass='{sub}':fontsdir='{fd}'[v1]"); last = "v1"
    if not a.no_tag:
        shots = [s for sc in e["scenes"] for s in sc["shots"]]
        tf = pkg / "out" / "_tag.ass"
        ev = "\n".join(f"Dialogue: 0,{ass_t(s['t0'])},{ass_t(s['t0'] + s['dur'])},Tag,,0,0,0,,MEDSTUDY アニマティック（Wan 2.2 生成前）" for s in shots)
        tf.write_text(TAG_ASS + ev + "\n", encoding="utf-8")
        tp = str(tf).replace("\\", "/").replace(":", "\\:")
        fc.append(f"[{last}]ass='{tp}':fontsdir='{fd}'[v2]"); last = "v2"
    out = pkg / "out" / (a.out or "lecture.mp4")
    cmd = [ffmpeg_bin(a), "-y", "-v", "error", "-framerate", str(FPS), "-i", str(pkg / "layers" / "full_%05d.jpg"), "-i", str(pkg / "out" / "mix.wav"),
           "-filter_complex", ";".join(fc), "-map", f"[{last}]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", str(a.crf),
           "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-ar", "48000", "-b:a", a.audio_bitrate, "-movflags", "+faststart", "-t", f"{dur:.3f}", str(out)]
    (pkg / "out" / "ffmpeg_command.txt").write_text(" ".join(f'"{c}"' if " " in c or ";" in c else c for c in cmd), encoding="utf-8")
    subprocess.run(cmd, check=True)
    print(f"完成 → {out}（{dur:.2f} 秒・MEDSTUDY アニマティック（Wan 2.2 未生成）{'' if not inv else '・白黒反転は描画済み'}）")


# --------------------------------------------------------------------------- check / all
def cmd_check(pkg: Path, a) -> None:
    m = load(pkg)
    ok = lambda b: "✓" if b else "—"
    print(f"テーマ: {m['theme']}")
    print(f"  {ok((pkg / 'audio' / 'kokoro_timing.json').exists())} Kokoro 音声と実測タイミング（audio/）")
    print(f"  {ok(m['timing']['source'] == 'kokoro')} タイミング確定（MEDSTUDY に Kokoro タイミングを読み込んで書き出し済み）")
    print(f"  {ok((pkg / 'layers' / 'overlay_00000.png').exists())} 医学図レイヤー（layers/overlay・plate）  {ok((pkg / 'layers' / 'full_00000.jpg').exists())} 合成済みアニマティック（layers/full）")
    for j in m["wan"]["jobs"]:
        print(f"  {ok((pkg / j['keyframe']).exists())} キーフレーム {j['name']}   {ok((pkg / 'wan' / (j['name'] + '.webm')).exists())} Wan クリップ")
    print(f"  {ok((pkg / 'sfx' / 'boom.wav').exists())} 効果音（sfx/）")
    print(f"  {ok((pkg / 'out' / 'lecture.mp4').exists())} 完成動画（out/lecture.mp4）")


def cmd_all(pkg: Path, a) -> None:
    if not (pkg / "audio" / "kokoro_timing.json").exists():
        cmd_tts(pkg, a)
        print("\n→ 次に MEDSTUDY で audio/kokoro_timing.json を読み込み、確定パッケージ（レイヤー込み）を書き出してから、もう一度 all を実行してください。")
        return
    cmd_sfx(pkg, a)
    if not a.skip_comfy:
        cmd_comfy(pkg, a)
    cmd_assemble(pkg, a)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("command", choices=["tts", "sfx", "comfy", "assemble", "check", "all"])
    p.add_argument("package", type=Path)
    p.add_argument("--model"); p.add_argument("--voices"); p.add_argument("--voice"); p.add_argument("--speed")
    p.add_argument("--raw", action="store_true", help="音声の仕上げ処理（低域カット・整音・短い残響）をしない")
    p.add_argument("--server", default="http://127.0.0.1:8188"); p.add_argument("--profile"); p.add_argument("--fast", action="store_true", help="14B を 4 ステップ LoRA で")
    p.add_argument("--force", action="store_true"); p.add_argument("--skip-comfy", action="store_true")
    p.add_argument("--ffmpeg"); p.add_argument("--fonts"); p.add_argument("--bgm"); p.add_argument("--bgm-gain", default="0.18")
    p.add_argument("--crf", default="18"); p.add_argument("--out"); p.add_argument("--no-subs", action="store_true")
    p.add_argument("--animatic", action="store_true", help="Wan クリップがあっても MEDSTUDY アニマティックで組む")
    p.add_argument("--no-tag", action="store_true", help="アニマティック部分の小さな表示を付けない")
    p.add_argument("--audio-bitrate", default="192k", help="完成した MP4 の音声（AAC・48 kHz）のビットレート")
    p.add_argument("--sub-band", action="store_true", help="絵を 87.5%% に縮めて上に置き、下の黒い帯に字幕を出す（図の文字と字幕が重ならない）")
    a = p.parse_args()
    {"tts": cmd_tts, "sfx": cmd_sfx, "comfy": cmd_comfy, "assemble": cmd_assemble, "check": cmd_check, "all": cmd_all}[a.command](a.package.resolve(), a)


if __name__ == "__main__":
    main()
