#!/usr/bin/env python3
"""Listen back to every voice clip with offline speech recognition (faster-whisper small) and compare the
reading with the intended one (kana). Prints lines below 0.8 and writes .cache/voice_check.json.

    nice -n 19 python3 tools/check_voice.py
"""
import difflib, hashlib, json, os, re, subprocess
import numpy as np
import pykakasi
from faster_whisper import WhisperModel

PROD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kks = pykakasi.kakasi()
LET = dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'エー ビー シー ディー イー エフ ジー エイチ アイ ジェー ケー エル エム エヌ オー ピー キュー アール エス ティー ユー ブイ ダブリュー エックス ワイ ゼット'.split()))


def kana(t):
    t = re.sub(r'[A-Za-zＡ-Ｚ]', lambda m: LET.get(m.group(0).upper(), m.group(0)), t)
    t = re.sub(r'[、。？！,.?!「」（）()\s・ー〜~…]', '', t)
    return ''.join(x['hira'] for x in kks.convert(t))


def main():
    s = json.load(open(os.path.join(PROD, 'script.json'), encoding='utf-8'))
    m = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=2)
    out = []
    for sc in s['scenes']:
        for i, l in enumerate(sc['lines']):
            c = s['cast'][l['who']]; say = l.get('speech', l['text'])
            key = hashlib.sha1(f"{c['voice']}|{c['rate']}|{c['pitch']}|{say}".encode()).hexdigest()[:16]
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(PROD, '.cache', 'voice', key + '.mp3'), '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
            segs, _ = m.transcribe(np.frombuffer(raw, np.int16).astype(np.float32) / 32768, language='ja', beam_size=5, condition_on_previous_text=False)
            heard = ''.join(x.text for x in segs)
            r = difflib.SequenceMatcher(None, kana(say), kana(heard)).ratio()
            out.append({'scene': sc['id'], 'i': i, 'ratio': round(r, 3), 'expected': say, 'heard': heard})
    json.dump(out, open(os.path.join(PROD, '.cache', 'voice_check.json'), 'w'), ensure_ascii=False, indent=0)
    print(f"mean {sum(x['ratio'] for x in out) / len(out):.3f}")
    for y in sorted(out, key=lambda y: y['ratio']):
        if y['ratio'] < 0.8:
            print(f"{y['scene']}#{y['i']} {y['ratio']:.2f} | {y['expected'][:50]} | {y['heard'][:50]}")


if __name__ == '__main__':
    main()
