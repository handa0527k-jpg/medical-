#!/usr/bin/env python3
"""シーンごとの音（声・BGM・効果音）をミックスする。

    python3 tools/mix.py            # 全シーン → build/mix/<scene>.wav
    python3 tools/mix.py s03        # 1シーン

- 声：Style-Bert-VITS2 の文ごとの録音（.sbv2/cache）を、timeline の時刻に置く
- BGM：build/music/<cue>.wav。シーン内で曲が替わるところは 1.5 秒のクロスフェード。
  セリフの間は自動で 11 dB 下げ（ダッキング）、シーンの頭と終わりはフェードで自然につなぐ
- 効果音：build/sfx/<name>.wav。考える時間（@think）は 1 秒ごとに時計の音
"""
import json, os, sys
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(ROOT))
CACHE = os.path.join(os.environ.get('SBV2_DIR', os.path.join(REPO, '.sbv2')), 'cache')
SR = 44100
BGM_GAIN = 0.62
DUCK_DB = -11
SFX_GAIN = {'default': 0.45, 'tick': 0.35, 'rumble': 0.7, 'whoosh': 0.35, 'fanfare': 0.5, 'alarm': 0.3, 'fire': 0.4, 'water': 0.4}


def load(p):
    sr, a = wavfile.read(p)
    a = a.astype(np.float32) / 32768.0
    assert sr == SR, p
    return a if a.ndim == 2 else np.stack([a, a], 1)


def smooth(env, att, rel):
    out = np.empty_like(env)
    a, r = np.exp(-1 / (att * SR / 64)), np.exp(-1 / (rel * SR / 64))
    # 64 サンプルごとに計算して補間（速さのため）
    e = env[::64]
    o = np.empty_like(e)
    y = e[0]
    for i, x in enumerate(e):
        c = a if x < y else r  # ダッキング（x が小さい＝下げる）は速く、戻りはゆっくり
        y = c * y + (1 - c) * x
        o[i] = y
    out[:] = np.interp(np.arange(len(env)), np.arange(len(o)) * 64, o)
    return out


def mix_scene(sc):
    n = int(sc['dur'] * SR)
    out = np.zeros((n, 2), np.float32)
    voice = np.zeros(n, np.float32)
    active = np.zeros(n, np.float32)
    vmap = json.load(open(os.path.join(ROOT, 'build', 'voice.json')))
    for ln in sc['lines']:
        for s, vs in zip(ln['sents'], vmap[ln['id']]['sentences']):
            a = load(os.path.join(CACHE, vs['hash'] + '.wav'))[:, 0]
            rms = np.sqrt(np.mean(a ** 2) + 1e-12)
            a = a * (10 ** (-17 / 20) / rms)
            i = int(s['t0'] * SR)
            a = a[:n - i]
            voice[i:i + len(a)] += a
            j0, j1 = max(0, i - int(0.15 * SR)), min(n, i + len(a) + int(0.25 * SR))
            active[j0:j1] = 1
    # BGM
    bgm = np.zeros((n, 2), np.float32)
    xf = int(1.5 * SR)
    for k, b in enumerate(sc['bgm']):
        x = load(os.path.join(ROOT, 'build', 'music', f"{b['name']}.wav"))
        i0, i1 = int(b['t0'] * SR), min(n, int(b['t1'] * SR) + (xf if k + 1 < len(sc['bgm']) else 0))
        seg = x[:i1 - i0].copy()
        if len(seg) < i1 - i0:
            seg = np.concatenate([seg, np.zeros((i1 - i0 - len(seg), 2), np.float32)])
        if k > 0:
            seg[:xf] *= np.linspace(0, 1, xf)[:, None]
        if k + 1 < len(sc['bgm']):
            seg[-xf:] *= np.linspace(1, 0, xf)[:, None]
        bgm[i0:i0 + len(seg)] += seg[:n - i0]
    fi, fo = int(1.0 * SR), int(1.8 * SR)
    bgm[:fi] *= np.linspace(0, 1, fi)[:, None]
    bgm[-fo:] *= np.linspace(1, 0, fo)[:, None]
    duck = smooth(1 - active * (1 - 10 ** (DUCK_DB / 20)), 0.12, 0.6)
    out += bgm * (duck * BGM_GAIN)[:, None]
    out += voice[:, None]
    # 効果音
    for e in sc['sfx']:
        p = os.path.join(ROOT, 'build', 'sfx', f"{e['name']}.wav")
        if not os.path.exists(p):
            print('  missing sfx', e['name'])
            continue
        x = load(p) * SFX_GAIN.get(e['name'], SFX_GAIN['default'])
        times = [e['t'] + k for k in range(int(e.get('dur', 0)))] if e['name'] == 'tick' else [e['t']]
        for t in times:
            i = int(t * SR)
            if i >= n:
                continue
            y = x[:n - i]
            out[i:i + len(y)] += y
    # マスター：ソフトリミッター
    peak = np.max(np.abs(out))
    out = np.tanh(out * 1.05) if peak > 0.9 else out
    return out


def main():
    tl = json.load(open(os.path.join(ROOT, 'render', 'data', 'timeline.json')))
    only = sys.argv[1:] or [s['id'] for s in tl['scenes']]
    d = os.path.join(ROOT, 'build', 'mix')
    os.makedirs(d, exist_ok=True)
    for sc in tl['scenes']:
        if sc['id'] not in only:
            continue
        x = mix_scene(sc)
        wavfile.write(os.path.join(d, f"{sc['id']}.wav"), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
        print(f"{sc['id']}: {sc['dur']:.1f} s  peak {np.max(np.abs(x)):.2f}")


if __name__ == '__main__':
    main()
