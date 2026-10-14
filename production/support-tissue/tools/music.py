#!/usr/bin/env python3
"""シーン別のオリジナルBGMを合成する（外部音源・サンプルを使わない、numpy の加算合成のみ）。

    python3 tools/music.py                   # render/data/timeline.json の各 BGM 区間の長さで作る
    python3 tools/music.py --demo 40         # 各曲 40 秒の試聴版

曲ごとに テンポ・調・和声進行・楽器編成・リズムを決め、メロディは和音の構成音を軸に（乱数の種を固定して）作曲する。
8小節のフレーズを A → A'（変奏）→ B（ドラム抜き）…と並べ、最後はフェードアウトする。
出力：build/music/<cue>.wav（ミックス用、44.1kHz ステレオ）と assets/music/<cue>.mp3（成果物）
"""
import json, os, subprocess, sys
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 44100
rng0 = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    e = np.full(n, s, np.float32)
    a = min(a, n)
    e[:a] = np.linspace(0, 1, a, endpoint=False) if a else e[:a]
    d2 = min(d, max(0, n - a))
    if d2:
        e[a:a + d2] = np.linspace(1, s, d2)
    if r:
        rr = min(r, n)
        e[n - rr:] *= np.linspace(1, 0, rr)
    return e


def additive(f, n, amps, detune=0.0, phase_rand=True, vib=0.0, vib_rate=5.0):
    t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    ph = t * 2 * np.pi * f
    if vib:
        ph = ph + (vib * f / vib_rate) * np.sin(2 * np.pi * vib_rate * t) * (np.clip(t / 0.4, 0, 1))
    for k, a in enumerate(amps, 1):
        if a == 0 or f * k > SR / 2 - 500:
            continue
        p0 = rng0.random() * 2 * np.pi if phase_rand else 0
        out += (a * np.sin(ph * k * (1 + detune * k * 0.0) + p0)).astype(np.float32)
    return out


def lowpass(x, fc, order=2):
    sos = butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos')
    return sosfilt(sos, x).astype(np.float32)


def highpass(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), 'high', output='sos')
    return sosfilt(sos, x).astype(np.float32)


def bandpass(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos')
    return sosfilt(sos, x).astype(np.float32)


# ───────── 楽器 ─────────
SAW = [1 / k for k in range(1, 40)]
SQR = [(1 / k if k % 2 else 0) for k in range(1, 40)]


def inst_piano(f, dur, vel):
    n = int((dur + 1.2) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    for k in range(1, 14):
        if f * k > 16000:
            break
        a = (1 / k ** 1.4) * np.exp(-t * (1.2 + 0.9 * k) * (1 + f / 900))
        out += (a * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * t)).astype(np.float32)
    out *= np.minimum(1, t / 0.004)
    rel = np.ones(n, np.float32)
    s = int(dur * SR)
    rel[s:] = np.exp(-(t[s:] - dur) * 9)
    return out * rel * vel * 0.5


def inst_epiano(f, dur, vel):  # FM ベル／エレピ
    n = int((dur + 1.5) * SR)
    t = np.arange(n) / SR
    idx = 1.8 * np.exp(-t * 4)
    out = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 1.0 * t)) * np.exp(-t * 2.2)
    out += 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 8)
    return (out * np.minimum(1, t / 0.003) * vel * 0.42).astype(np.float32)


def inst_bell(f, dur, vel):  # グロッケン
    n = int((dur + 2.0) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    for r, a, d in [(1, 1, 2.2), (2.76, 0.45, 4.5), (5.4, 0.25, 7), (8.93, 0.12, 10)]:
        out += (a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d)).astype(np.float32)
    return out * np.minimum(1, t / 0.002) * vel * 0.3


def inst_pluck(f, dur, vel):  # アコースティックギター風
    n = int((dur + 1.0) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    for k in range(1, 18):
        if f * k > 14000:
            break
        a = (1 / k) * (0.6 + 0.4 * np.sin(k * 1.7)) * np.exp(-t * (2.0 + 1.1 * k))
        out += (a * np.sin(2 * np.pi * f * k * t)).astype(np.float32)
    noise = lowpass(rng0.standard_normal(int(0.015 * SR)).astype(np.float32), 3000) * 0.3
    out[:len(noise)] += noise
    rel = np.ones(n, np.float32)
    s = int(min(dur + 0.3, dur * 1.5) * SR)
    if s < n:
        rel[s:] = np.exp(-(t[s:] - t[s]) * 12)
    return out * rel * vel * 0.5


def inst_pizz(f, dur, vel):
    return inst_pluck(f, min(dur, 0.18), vel) * 1.1


def inst_strings(f, dur, vel):
    n = int((dur + 0.9) * SR)
    out = np.zeros(n, np.float32)
    for dt in (-0.006, 0.0, 0.0065):
        out += additive(f * (1 + dt), n, SAW[:24], vib=0.004, vib_rate=5.2)
    out = lowpass(out, 2600 + f)
    return out * env_adsr(n, 0.35, 0.3, 0.85, 0.8) * vel * 0.09


def inst_pad(f, dur, vel):  # シンセパッド（神秘）
    n = int((dur + 1.5) * SR)
    out = np.zeros(n, np.float32)
    for dt in (-0.004, 0.004):
        out += additive(f * (1 + dt), n, [1, 0.5, 0.3, 0.2, 0.12, 0.08, 0.05])
    return out * env_adsr(n, 0.9, 0.5, 0.8, 1.4) * vel * 0.12


def inst_brass(f, dur, vel):
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    bright = np.clip(t / 0.06, 0, 1) * (0.7 + 0.3 * np.exp(-t * 3))
    out = np.zeros(n, np.float32)
    for k in range(1, 22):
        if f * k > 12000:
            break
        a = (1 / k) * np.clip(bright * 1.6 - (k - 1) * 0.07, 0, 1)
        out += (a * np.sin(2 * np.pi * f * k * t + 0.02 * np.sin(2 * np.pi * 5 * t) * k)).astype(np.float32)
    return out * env_adsr(n, 0.04, 0.1, 0.8, 0.2) * vel * 0.16


def inst_flute(f, dur, vel):
    n = int((dur + 0.3) * SR)
    out = additive(f, n, [1, 0.25, 0.08, 0.03], vib=0.006, vib_rate=5)
    breath = bandpass(rng0.standard_normal(n).astype(np.float32), f, min(f * 3, 15000)) * 0.04
    return (out + breath) * env_adsr(n, 0.06, 0.1, 0.85, 0.25) * vel * 0.25


def inst_lead(f, dur, vel):  # 矩形波リード
    n = int((dur + 0.15) * SR)
    out = lowpass(additive(f, n, SQR[:25], vib=0.005), 4000)
    return out * env_adsr(n, 0.01, 0.08, 0.7, 0.12) * vel * 0.14


def inst_arp(f, dur, vel):
    n = int((dur + 0.2) * SR)
    out = lowpass(additive(f, n, SQR[:15]), 2500)
    return out * env_adsr(n, 0.005, 0.15, 0.25, 0.1) * vel * 0.13


def inst_bass(f, dur, vel):
    n = int((dur + 0.12) * SR)
    t = np.arange(n) / SR
    out = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return (out * env_adsr(n, 0.008, 0.25, 0.6, 0.1) * vel * 0.4).astype(np.float32)


def inst_synbass(f, dur, vel):
    n = int((dur + 0.08) * SR)
    out = lowpass(additive(f, n, SAW[:30]), 900)
    return out * env_adsr(n, 0.005, 0.12, 0.5, 0.06) * vel * 0.32


def inst_dist(f, dur, vel):  # パワーコード（ルート＋5度）を歪ませる
    n = int((dur + 0.1) * SR)
    x = additive(f, n, SAW[:30]) + additive(f * 1.4983, n, SAW[:25]) * 0.8 + additive(f * 2, n, SAW[:15]) * 0.4
    x = np.tanh(x * 2.8)
    x = lowpass(x, 3200)
    return x * env_adsr(n, 0.005, 0.1, 0.8, 0.08) * vel * 0.11


def inst_bassoon(f, dur, vel):
    n = int((dur + 0.1) * SR)
    out = lowpass(additive(f, n, [1, 0.9, 0.7, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1]), 1500)
    return out * env_adsr(n, 0.02, 0.1, 0.7, 0.08) * vel * 0.2


# ───────── 打楽器 ─────────
def drum(name, vel=1.0):
    if name == 'kick':
        n = int(0.45 * SR); t = np.arange(n) / SR
        f = 48 + 110 * np.exp(-t * 28)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
        x[:200] += rng0.standard_normal(200) * 0.2
        return (x * vel * 0.9).astype(np.float32)
    if name == 'snare':
        n = int(0.3 * SR); t = np.arange(n) / SR
        noise = bandpass(rng0.standard_normal(n).astype(np.float32), 1200, 8000) * np.exp(-t * 16)
        tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25)
        return ((noise * 0.9 + tone * 0.5) * vel * 0.55).astype(np.float32)
    if name == 'hat':
        n = int(0.06 * SR); t = np.arange(n) / SR
        return (highpass(rng0.standard_normal(n).astype(np.float32), 7000) * np.exp(-t * 70) * vel * 0.22)
    if name == 'ohat':
        n = int(0.3 * SR); t = np.arange(n) / SR
        return (highpass(rng0.standard_normal(n).astype(np.float32), 6500) * np.exp(-t * 11) * vel * 0.16)
    if name == 'shaker':
        n = int(0.08 * SR); t = np.arange(n) / SR
        e = np.minimum(1, t / 0.02) * np.exp(-t * 40)
        return (bandpass(rng0.standard_normal(n).astype(np.float32), 5000, 12000) * e * vel * 0.18)
    if name == 'clap':
        n = int(0.25 * SR); t = np.arange(n) / SR
        e = np.exp(-t * 18) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 40) * (t > 0.012)
        return (bandpass(rng0.standard_normal(n).astype(np.float32), 900, 5000) * e * vel * 0.45)
    if name == 'timp':
        n = int(1.2 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * 82 * t) * np.exp(-t * 3) + 0.4 * np.sin(2 * np.pi * 131 * t) * np.exp(-t * 4)
        x[:400] += lowpass(rng0.standard_normal(400).astype(np.float32), 1500) * 0.4
        return (x * vel * 0.7).astype(np.float32)
    if name == 'tom':
        n = int(0.5 * SR); t = np.arange(n) / SR
        f = 110 + 60 * np.exp(-t * 15)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * vel * 0.6).astype(np.float32)
    if name == 'block':  # ウッドブロック
        n = int(0.12 * SR); t = np.arange(n) / SR
        return ((np.sin(2 * np.pi * 900 * t) + 0.5 * np.sin(2 * np.pi * 2300 * t)) * np.exp(-t * 45) * vel * 0.3).astype(np.float32)
    if name == 'clank':  # 金属音（工場）
        n = int(0.5 * SR); t = np.arange(n) / SR
        x = np.zeros(n)
        for r, a in [(1, 1), (2.41, 0.7), (3.77, 0.5), (5.13, 0.4), (7.2, 0.25)]:
            x += a * np.sin(2 * np.pi * 420 * r * t) * np.exp(-t * (9 + r))
        return (x * vel * 0.13).astype(np.float32)
    if name == 'crash':
        n = int(1.6 * SR); t = np.arange(n) / SR
        return (highpass(rng0.standard_normal(n).astype(np.float32), 4000) * np.exp(-t * 2.2) * vel * 0.2)
    raise KeyError(name)


INST = {'piano': inst_piano, 'epiano': inst_epiano, 'bell': inst_bell, 'pluck': inst_pluck, 'pizz': inst_pizz,
        'strings': inst_strings, 'pad': inst_pad, 'brass': inst_brass, 'flute': inst_flute, 'lead': inst_lead,
        'arp': inst_arp, 'bass': inst_bass, 'synbass': inst_synbass, 'dist': inst_dist, 'bassoon': inst_bassoon}
# 楽器ごとの音量補正（1音の RMS を測って、旋律が和音に埋もれないようにした値）
MIXGAIN = {'brass': 1.9, 'lead': 2.1, 'arp': 2.0, 'dist': 1.8, 'strings': 0.65, 'pad': 0.75, 'bass': 0.75,
           'bell': 1.3, 'epiano': 1.3, 'bassoon': 0.8}

# ───────── 曲（キュー）の設計 ─────────
MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]
LYDIAN = [0, 2, 4, 6, 7, 9, 11]

CUES = {
    # 1 人体シティへようこそ：壮大で明るい冒険（オーケストラ＋電子音）
    'adventure': dict(bpm=124, key=60, scale=MAJOR, prog=[1, 5, 6, 4, 1, 5, 4, 5], mel='brass', mel_oct=12, mel_rhythm='bright',
                      chords='strings', comp=None, arp='bell', arp_pat='8', bass='bass', bass_pat='q', drums='march', vol=1.0),
    # 2 街づくり会社：軽快なピアノとギターのポップ
    'pop': dict(bpm=118, key=65, scale=MAJOR, prog=[1, 6, 2, 5, 1, 6, 4, 5], mel='epiano', mel_oct=12, mel_rhythm='bouncy',
                chords=None, comp='piano', arp='pluck', arp_pat='8up', bass='bass', bass_pat='pop', drums='pop', vol=1.0),
    # 3 4つの仕事：支持＝安定感のあるオーケストラ／交換＝流れる電子音とピアノ／防御＝速いアクション／貯蔵＝穏やか
    'support': dict(bpm=100, key=62, scale=MAJOR, prog=[1, 4, 1, 5, 6, 4, 1, 5], mel='brass', mel_oct=0, mel_rhythm='calm',
                    chords='strings', comp=None, arp=None, bass='bass', bass_pat='h', drums='timp', vol=0.95),
    'exchange': dict(bpm=108, key=69, scale=MAJOR, prog=[1, 3, 4, 5, 6, 3, 4, 5], mel='piano', mel_oct=12, mel_rhythm='flow',
                     chords='pad', comp=None, arp='arp', arp_pat='16', bass='synbass', bass_pat='8', drums='soft', vol=0.95),
    'defense': dict(bpm=152, key=64, scale=MINOR, prog=[1, 6, 3, 7, 1, 6, 7, 7], mel='lead', mel_oct=12, mel_rhythm='action',
                    chords='brass_stab', comp=None, arp=None, bass='synbass', bass_pat='8', drums='action', vol=0.9),
    'storage': dict(bpm=84, key=67, scale=MAJOR, prog=[1, 4, 1, 5, 6, 4, 2, 5], mel='flute', mel_oct=12, mel_rhythm='calm',
                    chords='strings', comp=None, arp='pluck', arp_pat='8up', bass='bass', bass_pat='h', drums='shaker', vol=0.95),
    # 4 不思議なゼリー：透明感のある神秘的なシンセとピアノ
    'mystic': dict(bpm=68, key=62, scale=LYDIAN, prog=[1, 2, 6, 4, 1, 2, 3, 5], mel='piano', mel_oct=12, mel_rhythm='sparse',
                   chords='pad', comp=None, arp='bell', arp_pat='slow', bass='bass', bass_pat='w', drums=None, sevenths=True, vol=1.0),
    # 5 コラーゲン工場：力強い工場のリズム
    'factory': dict(bpm=112, key=64, scale=MINOR, prog=[1, 1, 6, 7, 1, 1, 4, 5], mel='brass', mel_oct=0, mel_rhythm='strong',
                    chords='strings', comp=None, arp=None, bass='synbass', bass_pat='8', drums='factory', vol=0.95),
    # 6 3種類の線維：テンポのよいロック
    'rock': dict(bpm=144, key=64, scale=MINOR, prog=[1, 6, 7, 1, 4, 6, 7, 5], mel='lead', mel_oct=12, mel_rhythm='action',
                 chords='dist', comp=None, arp=None, bass='synbass', bass_pat='8', drums='rock', vol=0.85),
    # 7 住人たち：明るくコミカルなキャラクター紹介
    'comic': dict(bpm=132, key=67, scale=MAJOR, prog=[1, 6, 4, 5, 1, 6, 2, 5], mel='bell', mel_oct=12, mel_rhythm='bouncy',
                  chords=None, comp='pizz', arp=None, bass='bassoon', bass_pat='walk', drums='comic', vol=1.0),
    # 8 基底膜：落ち着いたピアノとストリングス
    'calm': dict(bpm=72, key=60, scale=MAJOR, prog=[1, 3, 4, 5, 6, 4, 1, 5], mel='piano', mel_oct=12, mel_rhythm='sparse',
                 chords='strings', comp=None, arp='piano', arp_pat='8up', bass='bass', bass_pat='w', drums=None, vol=1.0),
    # 9 脂肪細胞：温かいアコースティック
    'acoustic': dict(bpm=96, key=67, scale=MAJOR, prog=[1, 5, 6, 4, 1, 5, 4, 1], mel='piano', mel_oct=12, mel_rhythm='calm',
                     chords=None, comp=None, arp='pluck', arp_pat='8up', bass='bass', bass_pat='h', drums='shaker', vol=1.0),
    # 10 最終試験：達成感のあるオーケストラと軽快なドラム
    'climax': dict(bpm=136, key=62, scale=MAJOR, prog=[1, 5, 6, 4, 4, 5, 1, 1], mel='brass', mel_oct=12, mel_rhythm='bright',
                   chords='strings', comp=None, arp='bell', arp_pat='8', bass='bass', bass_pat='q', drums='climax', vol=1.0),
}

RHYTHMS = {
    'bright': [[1, 0.5, 0.5, 1, 1], [1.5, 0.5, 2], [0.5, 0.5, 1, 1, 1], [2, 1, 1], [1, 1, 2]],
    'bouncy': [[0.5, 0.5, 0.5, 0.5, 1, 1], [1, 0.5, 0.5, 2], [0.5, 1, 0.5, 2], [0.75, 0.25, 1, 2]],
    'calm': [[2, 1, 1], [3, 1], [1, 1, 2], [4], [1.5, 0.5, 2]],
    'flow': [[1, 1, 1, 1], [1.5, 0.5, 1, 1], [2, 2], [1, 0.5, 0.5, 2]],
    'action': [[0.5] * 8, [0.5, 0.5, 1, 0.5, 0.5, 1], [1, 0.5, 0.5, 1, 1], [0.5, 0.5, 0.5, 0.5, 2]],
    'sparse': [[2, 2], [4], [1, 3], [3, 1], [2, 1, 1]],
    'strong': [[1, 1, 2], [0.5, 0.5, 1, 2], [1, 0.5, 0.5, 2], [2, 2]],
}


def chord_notes(cue, deg, octave=0):
    sc, key = cue['scale'], cue['key']
    idx = [deg - 1, deg + 1, deg + 3] + ([deg + 5] if cue.get('sevenths') else [])
    return [key + octave + sc[i % 7] + 12 * (i // 7) for i in idx]


def scale_pitch(cue, step):
    sc, key = cue['scale'], cue['key']
    return key + sc[step % 7] + 12 * (step // 7)


def compose_melody(cue, seed):
    """8小節の旋律：2小節の動機 → 和音に合わせて反復 → 新しい2小節 → 主音で終止。"""
    rng = np.random.default_rng(seed)
    rh = RHYTHMS[cue['mel_rhythm']]
    prog = cue['prog']
    notes = []  # (beat, dur, midi)
    cur = 7 + 2  # 音階の段（主音の1オクターブ上付近から）

    def chord_steps(deg):
        return [(deg - 1) % 7, (deg + 1) % 7, (deg + 3) % 7]

    motif = None
    for bar, deg in enumerate(prog):
        if bar in (2, 3) and motif is not None:
            src = motif[bar - 2]
            shift = (deg - prog[bar - 2])
            for (b, d, st) in src:
                notes.append((bar * 4 + b, d, st + shift))
            cur = src[-1][2] + shift
            continue
        pat = rh[rng.integers(len(rh))] if bar < 7 else [2, 2] if sum(rh[0]) == 4 else [4]
        b = 0.0
        bar_notes = []
        for i, d in enumerate(pat):
            cs = chord_steps(deg)
            if i == 0 or (b % 2 == 0):
                # 強拍は和音の構成音のうち近いもの
                cands = [c + 7 * o for c in cs for o in range(0, 3)]
                cur = min(cands, key=lambda c: abs(c - cur) + rng.random() * 1.5)
            else:
                cur += int(rng.choice([-2, -1, -1, 1, 1, 2]))
            cur = int(np.clip(cur, 5, 15))
            if bar == 7 and i == len(pat) - 1:
                cur = 7  # 主音で終わる
            bar_notes.append((b, d, cur))
            b += d
        if bar in (0, 1):
            motif = (motif or []) + [bar_notes]
        notes += [(bar * 4 + x, d, st) for x, d, st in bar_notes]
    return [(b, d, scale_pitch(cue, st) + cue['mel_oct'] - 12) for b, d, st in notes]


def render_cue(name, seconds, seed=1):
    cue = CUES[name]
    spb = 60 / cue['bpm']
    bar_s = 4 * spb
    nbars = int(np.ceil(seconds / bar_s)) + 1
    n = int((seconds + 3) * SR)
    L = np.zeros(n, np.float32)
    R = np.zeros(n, np.float32)
    cache = {}

    def put(x, t, pan=0.0, gain=1.0):
        i = int(t * SR)
        if i >= n:
            return
        x = x[:n - i] * gain
        L[i:i + len(x)] += x * np.sqrt((1 - pan) / 2)
        R[i:i + len(x)] += x * np.sqrt((1 + pan) / 2)

    def note(inst, m, t, d, vel=0.8, pan=0.0):
        k = (inst, m, round(d, 3), round(vel, 2))
        if k not in cache:
            cache[k] = INST[inst](hz(m), d, vel) * MIXGAIN.get(inst, 1.0)
        put(cache[k], t, pan)

    melodies = [compose_melody(cue, seed * 10 + v) for v in range(2)]
    for bar in range(nbars):
        t0 = bar * bar_s
        phrase, pbar = divmod(bar, 8)
        deg = cue['prog'][pbar]
        ch = chord_notes(cue, deg)
        intro = bar < 2
        section_b = phrase % 4 == 2  # 3フレーズめは軽くする（ドラム・旋律を休む）
        # 和音
        if cue['chords'] == 'strings':
            for m in ch:
                note('strings', m - 12, t0, bar_s, 0.8, pan=-0.3 + 0.3 * (m % 3))
            note('strings', ch[0] - 24, t0, bar_s, 0.6, pan=0)
        elif cue['chords'] == 'pad':
            for m in ch:
                note('pad', m - 12, t0, bar_s, 0.8, pan=-0.4 + 0.25 * (m % 4))
        elif cue['chords'] == 'brass_stab':
            for b in (0, 1.5, 3):
                for m in ch:
                    note('brass', m - 12, t0 + b * spb, spb * 0.4, 0.6, pan=0.2)
        elif cue['chords'] == 'dist' and not intro:
            for b in np.arange(0, 4, 0.5):
                note('dist', ch[0] - 24, t0 + b * spb, spb * 0.45, 0.8 if b % 1 == 0 else 0.6, pan=-0.25)
                note('dist', ch[0] - 24, t0 + b * spb + 0.012, spb * 0.45, 0.6, pan=0.25)
        # 伴奏（ピアノ・ピチカート）
        if cue['comp'] == 'piano':
            for b in (0.5, 1.5, 2.5, 3.5):
                for m in ch:
                    note('piano', m, t0 + b * spb, spb * 0.4, 0.45, pan=0.15)
        elif cue['comp'] == 'pizz':
            for b, m in zip((0, 1, 2, 3), (ch[0], ch[2], ch[1], ch[2])):
                note('pizz', m, t0 + b * spb, spb * 0.5, 0.7, pan=0.3)
        # アルペジオ
        if cue['arp']:
            pat = cue['arp_pat']
            seq = ch + [ch[1] + 12, ch[0] + 12, ch[2]]
            if pat == '8':
                steps = [(i * 0.5, seq[i % 4] + 12) for i in range(8)]
            elif pat == '8up':
                steps = [(i * 0.5, (ch + [ch[0] + 12, ch[1] + 12])[[0, 1, 2, 3, 4, 3, 2, 1][i]]) for i in range(8)]
            elif pat == '16':
                steps = [(i * 0.25, (ch + [ch[0] + 12])[[0, 1, 2, 3][i % 4]] + 12) for i in range(16)]
            else:  # slow
                steps = [(i * 1.0, (ch + [ch[0] + 12])[i % 4] + 12) for i in range(4)]
            vel = 0.5 if cue['arp'] != 'bell' else 0.55
            for b, m in steps:
                note(cue['arp'], m, t0 + b * spb, spb * 0.45, vel * (0.85 if b % 1 else 1.0), pan=0.35)
        # ベース
        root = ch[0] - 24
        bp = cue['bass_pat']
        if bp == 'q':
            for b in range(4):
                note(cue['bass'], root + (7 if b == 2 else 0), t0 + b * spb, spb * 0.8, 0.85)
        elif bp == 'h':
            note(cue['bass'], root, t0, spb * 1.8, 0.85); note(cue['bass'], root + 7, t0 + 2 * spb, spb * 1.8, 0.75)
        elif bp == 'w':
            note(cue['bass'], root, t0, bar_s * 0.95, 0.8)
        elif bp == '8':
            for b in np.arange(0, 4, 0.5):
                note(cue['bass'], root + (12 if b in (1.5, 3.5) else 0), t0 + b * spb, spb * 0.4, 0.8)
        elif bp == 'pop':
            for b, o in ((0, 0), (1.5, 0), (2, 7), (3, 0), (3.5, 12)):
                note(cue['bass'], root + o, t0 + b * spb, spb * 0.45, 0.8)
        elif bp == 'walk':
            for b, o in ((0, 0), (1, 4), (2, 7), (3, 9)):
                note(cue['bass'], root + o, t0 + b * spb, spb * 0.5, 0.8)
        # 旋律
        if not intro and not (section_b and cue['mel_rhythm'] != 'sparse' and pbar % 2 == 1):
            mel = melodies[phrase % 2]
            for b, d, m in mel:
                if pbar * 4 <= b < pbar * 4 + 4:
                    note(cue['mel'], m, t0 + (b - pbar * 4) * spb, d * spb * 0.92, 0.75, pan=-0.05)
        # 打楽器
        dk = cue['drums']
        if dk and not (section_b and dk not in ('timp', 'shaker')) and not (intro and bar == 0 and dk not in ('timp', 'shaker')):
            hit = lambda nm, b, v=1.0, p=0.0: put(drum(nm, v), t0 + b * spb, p)
            if dk == 'march':
                hit('kick', 0); hit('kick', 2); hit('snare', 1, 0.5); hit('snare', 3, 0.6); hit('snare', 3.5, 0.35)
                if pbar == 0: hit('timp', 0, 0.8); hit('crash', 0, 0.6)
            elif dk == 'pop':
                for b in (0, 2.5): hit('kick', b)
                for b in (1, 3): hit('snare', b, 0.7); hit('clap', b, 0.4)
                for b in np.arange(0, 4, 0.5): hit('hat', b, 0.7 if b % 1 else 1.0, 0.3)
            elif dk == 'timp':
                hit('timp', 0, 0.7)
                if pbar % 2 == 1: hit('timp', 2, 0.5)
            elif dk == 'soft':
                hit('kick', 0, 0.6); hit('kick', 2, 0.5)
                for b in np.arange(0, 4, 0.5): hit('shaker', b, 0.8, 0.4)
            elif dk == 'action':
                for b in (0, 0.75, 2, 2.5): hit('kick', b)
                for b in (1, 3): hit('snare', b, 0.9)
                for b in np.arange(0, 4, 0.5): hit('hat', b, 0.8, 0.3)
                if pbar == 0: hit('crash', 0, 0.7)
            elif dk == 'shaker':
                for b in np.arange(0, 4, 0.5): hit('shaker', b, 0.9 if b % 1 == 0 else 0.6, 0.3)
            elif dk == 'factory':
                for b in range(4): hit('kick', b, 0.9)
                for b in (1, 3): hit('snare', b, 0.6); hit('clap', b, 0.5)
                for b in (0.5, 1.5, 2.5, 3.5): hit('clank', b, 1.0, 0.4)
                if pbar % 4 == 3: hit('clank', 3.75, 0.8, -0.4)
            elif dk == 'rock':
                for b in (0, 1.5, 2, 2.75): hit('kick', b)
                for b in (1, 3): hit('snare', b, 1.0)
                for b in np.arange(0, 4, 0.5): hit('ohat' if b == 3.5 else 'hat', b, 0.9, 0.3)
                if pbar == 0: hit('crash', 0, 0.8)
                if pbar == 7: [hit('tom', 3 + i * 0.25, 0.7) for i in range(4)]
            elif dk == 'comic':
                hit('kick', 0, 0.6); hit('kick', 2, 0.5)
                for b in (1, 3): hit('block', b, 0.8, 0.5)
                for b in (1.5, 3.5): hit('block', b, 0.5, -0.5)
            elif dk == 'climax':
                for b in (0, 1, 2, 3): hit('kick', b, 0.8)
                for b in (1, 3): hit('snare', b, 0.85)
                for b in np.arange(0, 4, 0.5): hit('hat', b, 0.7, 0.3)
                if pbar == 0: hit('crash', 0, 0.8); hit('timp', 0, 0.8)
                if pbar == 7: [hit('snare', 3 + i * 0.125, 0.3 + i * 0.08) for i in range(8)]
    # 残響
    ir_n = int(2.0 * SR)
    t = np.arange(ir_n) / SR
    wet = 0.22 if name not in ('mystic', 'calm') else 0.36
    for ch_, seed2 in ((L, 1), (R, 2)):
        ir = np.random.default_rng(seed2).standard_normal(ir_n).astype(np.float32) * np.exp(-t * (2.6 if wet < 0.3 else 1.6))
        ir = lowpass(ir, 6000)
        ir /= np.sqrt(np.sum(ir ** 2))
        rev = fftconvolve(ch_, ir)[:n].astype(np.float32)
        ch_ += rev * wet
    x = np.stack([L, R], 1)[:int(seconds * SR)]
    x = highpass(x.T, 35).T
    # 音量をそろえる（RMS -19 dBFS）・ソフトクリップ
    rms = np.sqrt(np.mean(x ** 2) + 1e-12)
    x *= (10 ** (-19 / 20) / rms) * cue['vol']
    x = np.tanh(x * 1.1) / 1.1
    # フェードイン・アウト
    fi, fo = int(0.6 * SR), int(min(2.5, seconds / 4) * SR)
    x[:fi] *= np.linspace(0, 1, fi)[:, None]
    x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return x


def write(name, x, mp3=True):
    from scipy.io import wavfile
    d = os.path.join(ROOT, 'build', 'music')
    os.makedirs(d, exist_ok=True)
    w = os.path.join(d, f'{name}.wav')
    wavfile.write(w, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    if mp3:
        a = os.path.join(ROOT, 'assets', 'music')
        os.makedirs(a, exist_ok=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-b:a', '160k', os.path.join(a, f'{name}.mp3')], check=True)
    return w


def main():
    if '--demo' in sys.argv:
        sec = float(sys.argv[sys.argv.index('--demo') + 1])
        for i, name in enumerate(CUES):
            write(f'demo_{name}', render_cue(name, sec, seed=i + 1), mp3=False)
            print('demo', name)
        return
    tl = json.load(open(os.path.join(ROOT, 'render', 'data', 'timeline.json')))
    # 各キューの必要な長さ（同じキューが複数区間で使われるときは最長＋余裕）
    need = {}
    for sc in tl['scenes']:
        for b in sc['bgm']:
            need[b['name']] = max(need.get(b['name'], 0), b['t1'] - b['t0'] + 3)
    seeds = {name: i + 1 for i, name in enumerate(CUES)}
    for name, sec in need.items():
        x = render_cue(name, sec, seed=seeds[name])
        write(name, x)
        print(f'{name}: {sec:.1f} s')


if __name__ == '__main__':
    main()
