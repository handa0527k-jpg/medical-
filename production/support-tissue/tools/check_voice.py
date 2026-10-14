#!/usr/bin/env python3
"""録音した各文をオフライン音声認識（faster-whisper）で書き起こし、意図した読みとカナで比べる。

    ../../.venv-sbv2/bin/python tools/check_voice.py [--only s01] [--th 0.8]

同音異字（膠原→公園 など）はカナにすると一致するので、残るのは「音が違う」ものだけ。
"""
import json, os, re, sys, difflib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(ROOT))
CACHE = os.path.join(os.environ.get('SBV2_DIR', os.path.join(REPO, '.sbv2')), 'cache')


def kana(s):
    import pyopenjtalk
    s = re.sub(r'[、。！？!?「」…・\s]', '', s)
    k = pyopenjtalk.g2p(s, kana=True)
    return re.sub(r'[、。！？・ー]', '', k)


def main():
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    th = float(sys.argv[sys.argv.index('--th') + 1]) if '--th' in sys.argv else 0.8
    from faster_whisper import WhisperModel
    m = WhisperModel(os.environ.get('WHISPER', 'small'), device='cpu', compute_type='int8')
    script = json.load(open(os.path.join(ROOT, 'build', 'script.json')))
    voice = json.load(open(os.path.join(ROOT, 'build', 'voice.json')))
    bad, n, tot = [], 0, 0.0
    for sc in script['scenes']:
        if only and sc['id'] != only:
            continue
        for it in sc['items']:
            if it['type'] != 'line' or it['id'] not in voice:
                continue
            for s, v in zip(it['sentences'], voice[it['id']]['sentences']):
                segs, _ = m.transcribe(os.path.join(CACHE, v['hash'] + '.wav'), language='ja', beam_size=5)
                hyp = ''.join(x.text for x in segs)
                a, b = kana(s['reading']), kana(hyp)
                r = difflib.SequenceMatcher(None, a, b).ratio()
                n += 1
                tot += r
                if r < th:
                    bad.append((r, it['id'], s['text'], hyp))
    for r, i, t, h in sorted(bad):
        print(f'{r:.2f} {i}  {t}\n      → {h}')
    print(f'{n} sentences, mean kana match {tot / max(1, n):.3f}, {len(bad)} below {th}')


if __name__ == '__main__':
    main()
