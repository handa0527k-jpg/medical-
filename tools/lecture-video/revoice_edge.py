#!/usr/bin/env python3
"""
Re-voice a finished lecture film with Microsoft's neural voice (edge-tts), keeping the picture as rendered.

The film's frames are timed by the Kokoro segment lengths (audio/kokoro_timing.json). This tool keeps that timeline:
each beat (a run of lines) is synthesised in one breath, cut at the start of every line with the voice's own word
timings, and every line is placed exactly where its Kokoro line started, so subtitles, camera moves and figure
animations stay in sync. A beat that would not fit its slots is spoken a little faster (edge-tts `rate`), a beat with
much room a little slower, never by stretching the audio.

  python tools/lecture-video/revoice_edge.py production/lecture-video/genetics-basics-6-film [--voice ja-JP-KeitaNeural]

The Kokoro scene WAVs are kept in audio/kokoro_wav/ (run with --restore to put them back).
Output: audio/<scene>.wav (24 kHz mono, same lengths as before) and audio/edge_report.json.
Needs network access to speech.platform.bing.com; set SSL_CERT_FILE when TLS is re-terminated by a proxy.
"""
import argparse, asyncio, json, os, shutil, ssl, subprocess, sys, wave
from pathlib import Path

import numpy as np

SR = 24000
FORMAT = "audio-24khz-96kbitrate-mono-mp3"   # the best format the read-aloud endpoint serves


def ffmpeg() -> str:
    f = shutil.which("ffmpeg")
    if f:
        return f
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def edge_module():
    import edge_tts.communicate as M
    code = open(M.__file__, encoding="utf-8").read().replace("audio-24khz-48kbitrate-mono-mp3", FORMAT)
    exec(compile(code, M.__file__, "exec"), M.__dict__)
    ca = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    if ca and os.path.exists(ca):
        M._SSL_CTX = ssl.create_default_context(cafile=ca)
    return M


async def synth(M, text: str, voice: str, rate: int) -> tuple[np.ndarray, list[tuple[float, str]]]:
    c = M.Communicate(text, voice, rate=f"{rate:+d}%", boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
    mp3, words = bytearray(), []
    for attempt in range(4):
        try:
            mp3.clear(); words.clear()
            async for ch in c.stream():
                if ch["type"] == "audio":
                    mp3 += ch["data"]
                elif ch["type"] == "WordBoundary":
                    words.append((ch["offset"] / 1e7, ch["text"]))
            break
        except Exception:
            if attempt == 3:
                raise
            await asyncio.sleep(2 * (attempt + 1))
            c = M.Communicate(text, voice, rate=f"{rate:+d}%", boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
    pcm = subprocess.run([ffmpeg(), "-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                         input=bytes(mp3), capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).copy(), words


def char_starts(text: str, words: list[tuple[float, str]]) -> list[tuple[int, float]]:
    """(character position in text, time) of every word the voice reported"""
    out, cur = [], 0
    for t, w in words:
        j = text.find(w, cur)
        if j < 0:
            continue
        out.append((j, t)); cur = j + len(w)
    return out


def trim_tail(x: np.ndarray, thr=0.004) -> np.ndarray:
    idx = np.nonzero(np.abs(x) > thr)[0]
    return x[: idx[-1] + int(0.06 * SR)] if len(idx) else x[:0]


def pieces_of(text_parts: list[str], audio: np.ndarray, words) -> list[np.ndarray]:
    """cut the beat's audio at the start of each line (a little before its first word)"""
    text = "".join(text_parts)
    cs = char_starts(text, words)
    bounds, pos = [0.0], 0
    for p in text_parts[:-1]:
        pos += len(p)
        nxt = [t for j, t in cs if j >= pos]
        bounds.append(max(bounds[-1], (nxt[0] - 0.05) if nxt else bounds[-1]))
    out = []
    for i, b0 in enumerate(bounds):
        s0 = int(b0 * SR)
        s1 = int(bounds[i + 1] * SR) if i + 1 < len(bounds) else len(audio)
        out.append(trim_tail(audio[s0:s1]))
    return out


def read_wav(p: Path) -> np.ndarray:
    with wave.open(str(p)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return a if w.getnchannels() == 1 else a.reshape(-1, w.getnchannels()).mean(1)


def write_wav(p: Path, x: np.ndarray) -> None:
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


async def revoice(pkg: Path, voice: str) -> None:
    M = edge_module()
    script = json.loads((pkg / "kokoro" / "script.json").read_text(encoding="utf-8"))
    timing = json.loads((pkg / "audio" / "kokoro_timing.json").read_text(encoding="utf-8"))
    keep = pkg / "audio" / "kokoro_wav"
    keep.mkdir(exist_ok=True)
    report = {"voice": voice, "format": FORMAT, "scenes": []}
    for sc, tm in zip(script["scenes"], timing["scenes"]):
        wav = pkg / tm["file"]
        if not (keep / wav.name).exists():
            shutil.copy(wav, keep / wav.name)
        ref = read_wav(keep / wav.name)
        dur = tm["duration"]
        # the Kokoro slots: every line starts at s0 and may run until the next line starts
        t, starts = 0.0, []
        for seg, m in zip(sc["segs"], tm["segs"]):
            s0 = t + seg.get("pre", 0); starts.append(s0); t = s0 + m["speech"] + seg.get("post", 0)
        limits = [starts[i + 1] if i + 1 < len(starts) else dur - 0.05 for i in range(len(starts))]
        out = np.zeros(int(round(dur * SR)) + 1, dtype=np.float32)
        beats: list[list[int]] = []
        for i, seg in enumerate(sc["segs"]):
            if beats and sc["segs"][beats[-1][0]]["beat"] == seg["beat"]:
                beats[-1].append(i)
            else:
                beats.append([i])
        srep = {"id": sc["id"], "beats": []}
        end = 0.0                                       # where the voice so far ends (a late line pushes the next one on)
        for b in beats:
            parts = [sc["segs"][i]["say"] for i in b]
            slots = [limits[i] - starts[i] - 0.04 for i in b]
            rate, best = 0, None
            for _ in range(4):
                audio, words = await synth(M, "".join(parts), voice, rate)
                pcs = pieces_of(parts, audio, words)
                fit = max(len(p) / SR / max(0.2, s) for p, s in zip(pcs, slots))
                if best is None or (fit <= 1.0) or fit < best[2]:
                    best = (rate, pcs, fit)
                if fit <= 1.0 and (fit >= 0.8 or rate <= -10):
                    break
                # faster if a line runs over, slower (to at most -10 %) if every line has lots of room
                nr = rate + int(np.ceil((fit - 0.97) * 100)) if fit > 1.0 else max(-10, rate + int((fit - 0.9) * 100))
                nr = min(nr, 40)                        # beyond +40 % the voice gets hurried; let the line run on instead
                if nr == rate:
                    break
                rate = nr
            rate, pcs, fit = best
            for i, p in zip(b, pcs):
                s0 = max(starts[i], end + 0.03)        # never overlap the previous line
                a = int(s0 * SR)
                n = min(len(p), len(out) - a)
                if n > 0:
                    out[a:a + n] += p[:n]
                end = s0 + len(p) / SR
            srep["beats"].append({"beat": sc["segs"][b[0]]["beat"], "rate": rate, "fit": round(fit, 3), "late": round(max(0.0, end - limits[b[-1]]), 3)})
        # same loudness as the Kokoro track it replaces, so the effects mix stays balanced
        rms = lambda x: float(np.sqrt(np.mean(x[np.abs(x) > 0.01] ** 2))) if np.any(np.abs(x) > 0.01) else 0
        if rms(out) > 0 and rms(ref) > 0:
            out *= min(rms(ref) / rms(out), 0.97 / max(1e-6, float(np.abs(out).max())))
        write_wav(wav, out)
        report["scenes"].append(srep)
        late = max((x["late"] for x in srep["beats"]), default=0)
        print(f"  {sc['id']}  {len(beats)} beats  rate {min(x['rate'] for x in srep['beats']):+d}〜{max(x['rate'] for x in srep['beats']):+d}%  late {late:.2f}s", flush=True)
    (pkg / "audio" / "edge_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("package", type=Path)
    p.add_argument("--voice", default="ja-JP-KeitaNeural")
    p.add_argument("--restore", action="store_true", help="put the Kokoro scene WAVs back")
    a = p.parse_args()
    if a.restore:
        for f in (a.package / "audio" / "kokoro_wav").glob("*.wav"):
            shutil.copy(f, a.package / "audio" / f.name)
        print("Kokoro voice restored"); return
    asyncio.run(revoice(a.package, a.voice))


if __name__ == "__main__":
    main()
