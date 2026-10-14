#!/usr/bin/env python3
"""全セリフを Style-Bert-VITS2（CPU）で録音する。

    ../../.venv-sbv2/bin/python tools/tts.py            # build/script.json → 音声
    ../../.venv-sbv2/bin/python tools/tts.py --only s01  # 1シーンだけ

- 1文ずつ合成し、.sbv2/cache/<hash>.wav に保存（話者・スタイル・読みが同じなら再合成しない）
- 1セリフ＝1ファイルを audio/narration/<scene>/ と audio/dialogue/<scene>/ に MP3 で書き出す
- 文ごとの長さと口パク用の音量（30fps）を build/voice.json に記録する
"""
import hashlib, json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(ROOT))
SBV2 = os.environ.get('SBV2_DIR', os.path.join(REPO, '.sbv2'))
CACHE = os.path.join(SBV2, 'cache')
SR = 44100
FPS = 30
GAP = 0.22  # 同じセリフの中の文と文の間


def load_models(names):
    from style_bert_vits2.nlp import bert_models
    from style_bert_vits2.constants import Languages
    from style_bert_vits2.tts_model import TTSModel
    bert_models.load_model(Languages.JP, 'ku-nlp/deberta-v2-large-japanese-char-wwm').float()  # 新しい transformers は fp16 で読むため
    bert_models.load_tokenizer(Languages.JP, 'ku-nlp/deberta-v2-large-japanese-char-wwm')
    out = {}
    for n in names:
        d = os.path.join(SBV2, 'models', n)
        sf = [f for f in os.listdir(d) if f.endswith('.safetensors')][0]
        out[n] = TTSModel(model_path=os.path.join(d, sf), config_path=os.path.join(d, 'config.json'),
                          style_vec_path=os.path.join(d, 'style_vectors.npy'), device='cpu')
    return out


def trim(a, thr=0.012, pad=0.04):
    env = np.abs(a)
    idx = np.where(env > thr)[0]
    if len(idx) == 0:
        return a
    p = int(pad * SR)
    return a[max(0, idx[0] - p): min(len(a), idx[-1] + p)]


def mouth(a):
    hop = SR // FPS
    n = int(np.ceil(len(a) / hop))
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    v = np.clip((20 * np.log10(rms + 1e-9) + 42) / 24, 0, 1)  # -42dB→0, -18dB→1
    return ''.join(str(int(round(x * 9))) for x in v)


def read_wav(p):
    from scipy.io import wavfile
    sr, a = wavfile.read(p)
    a = a.astype(np.float32) / (32768.0 if a.dtype == np.int16 else 1.0)
    assert sr == SR, (p, sr)
    return a


def write_wav(p, a):
    from scipy.io import wavfile
    wavfile.write(p, SR, (np.clip(a, -1, 1) * 32767).astype(np.int16))


def main():
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    cfg = json.load(open(os.path.join(HERE, 'voices.json')))
    script = json.load(open(os.path.join(ROOT, 'build', 'script.json')))
    os.makedirs(CACHE, exist_ok=True)
    jobs = []
    for sc in script['scenes']:
        if only and sc['id'] != only:
            continue
        for it in sc['items']:
            if it['type'] != 'line':
                continue
            v = cfg['voices'][it['who']]
            style = v.get('fixed_style') or cfg['styles'].get(it['emo'], v.get('default_style', 'Neutral'))
            if style == 'Neutral' and v.get('default_style'):
                style = v['default_style'] if it['emo'] not in ('confused', 'think', 'normal') else 'Neutral'
            weight = 1.0 if style == 'Neutral' else v['weight']
            for s in it['sentences']:
                key = json.dumps([v['model'], style, weight, v['length'], v['pitch'], v['intonation'], s['reading']], ensure_ascii=False)
                s['_hash'] = hashlib.sha1(key.encode()).hexdigest()[:16]
                s['_job'] = (v, style, weight)
                if not os.path.exists(os.path.join(CACHE, s['_hash'] + '.wav')):
                    jobs.append(s)
    print(f'{len(jobs)} sentences to record', flush=True)
    if jobs:
        import torch
        torch.set_num_threads(os.cpu_count() or 4)
        models = load_models(sorted({j['_job'][0]['model'] for j in jobs}))
        for k, s in enumerate(jobs):
            v, style, weight = s['_job']
            sr, a = models[v['model']].infer(text=s['reading'], style=style, style_weight=weight, length=v['length'],
                                             pitch_scale=v['pitch'], intonation_scale=v['intonation'])
            assert sr == SR
            a = a.astype(np.float32) / 32768.0 if a.dtype == np.int16 else a.astype(np.float32)
            write_wav(os.path.join(CACHE, s['_hash'] + '.wav'), trim(a))
            if k % 10 == 0:
                print(f'  {k + 1}/{len(jobs)} {s["text"][:24]}', flush=True)

    # セリフごとの音声ファイルと timing
    vpath = os.path.join(ROOT, 'build', 'voice.json')
    voice = json.load(open(vpath)) if os.path.exists(vpath) else {}
    for sc in script['scenes']:
        if only and sc['id'] != only:
            continue
        for it in sc['items']:
            if it['type'] != 'line':
                continue
            parts, sents, t = [], [], 0.0
            for i, s in enumerate(it['sentences']):
                a = read_wav(os.path.join(CACHE, s['_hash'] + '.wav'))
                if i:
                    parts.append(np.zeros(int(GAP * SR), np.float32))
                    t += GAP
                parts.append(a)
                sents.append({'t0': round(t, 3), 'dur': round(len(a) / SR, 3), 'hash': s['_hash'], 'mouth': mouth(a)})
                t += len(a) / SR
            full = np.concatenate(parts)
            kind = 'narration' if it['who'] == 'nar' else 'dialogue'
            d = os.path.join(ROOT, 'audio', kind, sc['id'])
            os.makedirs(d, exist_ok=True)
            mp3 = os.path.join(d, f"{it['id']}_{it['who']}.mp3")
            tmp = os.path.join(ROOT, 'build', 'tmp_line.wav')
            write_wav(tmp, full)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-b:a', '96k', mp3], check=True)
            voice[it['id']] = {'dur': round(len(full) / SR, 3), 'sentences': sents, 'file': os.path.relpath(mp3, ROOT)}
    json.dump(voice, open(vpath, 'w'), ensure_ascii=False)
    tot = sum(x['dur'] for x in voice.values())
    print(f'voice: {len(voice)} lines, {tot / 60:.1f} min')


if __name__ == '__main__':
    main()
