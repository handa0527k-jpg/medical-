#!/usr/bin/env python3
"""script/script.txt → build/script.json（シーン・セリフ・文・字幕チャンク・音声用の読み）。

    python3 tools/parse_script.py
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from readings import reading  # noqa: E402

SPEAKERS = {
    'shun': '俊', 'sapo': 'サポちゃん', 'nar': '先生',
    'fibro': '線維芽細胞', 'macro': 'マクロファージ', 'plasma': '形質細胞', 'mast': '肥満細胞',
    'collagen': '膠原線維', 'reticular': '細網線維', 'elastic': '弾性線維',
    'white': '白色脂肪細胞', 'brown': '褐色脂肪細胞',
}
SUB_MAX = 58  # 字幕1枚（2行）に収める最大文字数


def sentences(text):
    """「。！？」で文に分ける（閉じかっこは前の文につける）。"""
    out, buf = [], ''
    i = 0
    while i < len(text):
        c = text[i]
        buf += c
        if c in '。！？!?':
            while i + 1 < len(text) and text[i + 1] in '!?！？」』）':
                i += 1
                buf += text[i]
            if buf.strip():
                out.append(buf.strip())
            buf = ''
        i += 1
    if buf.strip():
        out.append(buf.strip())
    # 短い感嘆（「ようこそ！」など）は単独だと合成が崩れるので、次の文とつなげる
    merged = []
    for x in out:
        if merged and len(merged[-1]) < 7:
            merged[-1] += ' ' + x
        else:
            merged.append(x)
    return merged


def chunks(sent):
    """長い文は「、」で字幕チャンクに分ける。"""
    if len(sent) <= SUB_MAX:
        return [sent]
    parts = re.split(r'(?<=、)', sent)
    out, buf = [], ''
    for p in parts:
        if buf and len(buf) + len(p) > SUB_MAX * 0.75:
            out.append(buf)
            buf = p
        else:
            buf += p
    if buf:
        out.append(buf)
    # 最後が短すぎれば前とつなぐ
    if len(out) > 1 and len(out[-1]) < 8:
        out[-2] += out.pop()
    return out


def parse(path):
    scenes, cur = [], None
    for raw in open(path, encoding='utf-8'):
        line = raw.rstrip('\n')
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        if line.startswith('@scene'):
            sid, title, bgm = [x.strip() for x in line[len('@scene'):].split('|')]
            cur = {'id': sid, 'title': title, 'bgm': bgm, 'items': []}
            scenes.append(cur)
            continue
        if line.startswith('@bgm'):
            cur['items'].append({'type': 'bgm', 'bgm': line.split()[1]})
            continue
        if line.startswith('@think'):
            cur['items'].append({'type': 'think', 'sec': float(line.split()[1])})
            continue
        if line.startswith('@pause'):
            cur['items'].append({'type': 'pause', 'sec': float(line.split()[1])})
            continue
        m = re.match(r'^(\w+)\.(\w+):\s*(.*)$', line)
        if not m:
            raise SystemExit(f'cannot parse: {line}')
        who, emo, rest = m.groups()
        if who not in SPEAKERS:
            raise SystemExit(f'unknown speaker {who}: {line}')
        text, opts = (rest.split('‖', 1) + [''])[:2]
        text = text.strip()
        o = {}
        for kv in opts.split():
            k, v = kv.split('=', 1)
            o[k] = v
        n = sum(1 for it in cur['items'] if it['type'] == 'line') + 1
        sents = []
        for s in sentences(text):
            sents.append({'text': s, 'reading': reading(s), 'chunks': chunks(s)})
        cur['items'].append({
            'type': 'line', 'id': f"{cur['id']}_{n:03d}", 'who': who, 'name': SPEAKERS[who], 'emo': emo,
            'text': text, 'sentences': sents, 'label': o.get('label'), 'sfx': o.get('sfx'),
            'quiz': o.get('quiz'), 'pause': float(o['pause']) if 'pause' in o else None,
        })
    return scenes


if __name__ == '__main__':
    sc = parse(os.path.join(ROOT, 'script', 'script.txt'))
    os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
    json.dump({'scenes': sc}, open(os.path.join(ROOT, 'build', 'script.json'), 'w'), ensure_ascii=False, indent=1)
    nl = sum(1 for s in sc for it in s['items'] if it['type'] == 'line')
    ns = sum(len(it['sentences']) for s in sc for it in s['items'] if it['type'] == 'line')
    nc = sum(len(it['text']) for s in sc for it in s['items'] if it['type'] == 'line')
    print(f'{len(sc)} scenes, {nl} lines, {ns} sentences, {nc} chars')
