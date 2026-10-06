#!/usr/bin/env python3
"""
Voice every line of script.json with Microsoft's neural voices through edge-tts (open-source client, no Kokoro).

  SSL_CERT_FILE=/root/.ccr/ca-bundle.crt python3 production/lecture-video/epigenetics-jojo/tts.py

Writes audio/lines/<NNN>.wav (48 kHz mono, trimmed) and audio/lines.json (text, speaker, seconds).
Lines already voiced with the same text, voice, rate and pitch are kept.
"""
import asyncio, json, os, shutil, ssl, subprocess, sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
SR = 48000


def ffmpeg() -> str:
    return shutil.which("ffmpeg") or "ffmpeg"


def edge():
    import edge_tts.communicate as M
    ca = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    if ca and os.path.exists(ca):
        M._SSL_CTX = ssl.create_default_context(cafile=ca)
    return M


def reading(text: str, yomi: dict) -> str:
    for k in sorted(yomi, key=len, reverse=True):
        text = text.replace(k, yomi[k])
    return text


async def synth(M, text, v) -> np.ndarray:
    for attempt in range(5):
        try:
            c = M.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"], proxy=os.environ.get("HTTPS_PROXY"))
            mp3 = bytearray()
            async for ch in c.stream():
                if ch["type"] == "audio":
                    mp3 += ch["data"]
            break
        except Exception as e:  # network hiccups: retry with backoff
            if attempt == 4:
                raise
            print("  retry:", e, file=sys.stderr)
            await asyncio.sleep(2 ** (attempt + 1))
    pcm = subprocess.run([ffmpeg(), "-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                         input=bytes(mp3), capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.float32).copy()
    idx = np.nonzero(np.abs(x) > 0.006)[0]
    if len(idx):
        x = x[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.08 * SR)]
    return x


def write_wav(path: Path, x: np.ndarray):
    import wave
    y = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())


async def main():
    S = json.load(open(HERE / "script.json", encoding="utf-8"))
    out = HERE / "audio" / "lines"; out.mkdir(parents=True, exist_ok=True)
    rep_path = HERE / "audio" / "lines.json"
    old = {r["key"]: r for r in json.load(open(rep_path))} if rep_path.exists() else {}
    M = edge()
    rows, n = [], 0
    for sc in S["scenes"]:
        for ln in sc["lines"]:
            v = S["voices"][ln["who"]]
            say = ln.get("say") or reading(ln["text"], S["yomi"])
            key = f'{v["voice"]}|{v["rate"]}|{v["pitch"]}|{say}'
            wav = out / f"{n:03d}.wav"
            if key in old and old[key]["file"] == wav.name and wav.exists():
                rows.append(old[key])
            else:
                x = await synth(M, say, v)
                write_wav(wav, x)
                rows.append({"key": key, "file": wav.name, "who": ln["who"], "text": ln["text"], "say": say,
                             "seconds": round(len(x) / SR, 3)})
                print(f'{n:03d} {rows[-1]["seconds"]:5.2f}s {ln["who"]:9s} {ln["text"]}')
            n += 1
    json.dump(rows, open(rep_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{n} lines, {sum(r['seconds'] for r in rows):.1f} s of speech")


if __name__ == "__main__":
    asyncio.run(main())
