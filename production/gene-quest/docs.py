#!/usr/bin/env python3
"""Write the paperwork from the same data the film is built from.

    python3 production/gene-quest/docs.py
      → subtitles.srt   (every narration line, UTF-8)
      → TIMELINE.md     (scene, time, every line, music track, sound effects)
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audio import TRACKS  # noqa: E402

SCENE_TITLE = {
    'title': 'タイトル → 賢者の書斎', 'history': '伝説の石碑（年表）', 'smith': '第1章 刃の港町：制限酵素', 'ligase': '第2章 糸紡ぎの村：DNAリガーゼ',
    'puzzle': '第2章 つづき：ちがう酵素・同じ切り口', 'rt': '第3章 歌う森：逆転写酵素', 'market': '第4章 キャラバンの市場：ベクター',
    'factory': '第5章 歯車の工場：発現ベクター', 'gfp': '第6章 光の入り江：GFP', 'harbor': '第7章 宅配の港：ウイルスベクター',
    'library': '第8章 遺伝子の図書館：ライブラリー', 'pcr': '第9章 熱竜の炉：PCR（戦闘）', 'vntr': '第10章 探偵の事務所：PCRクローニングとDNA鑑定',
    'gel': '第11章 雷の川：電気泳動', 'qpcr': '第12章 灯台の観測所：RT-PCR と qPCR', 'sanger': '第13章 からくり塔：サンガー法',
    'ngs': '第14章 蛍の大平原：次世代シークエンサー', 'seq': '第15章 地図職人の谷：RNA-seq／シングルセル／Spatial',
    'crispr': '第16章 編集の祭壇：ゲノム編集（戦闘）', 'repair': '修復の分かれ道：NHEJ と HDR', 'finale': '最終章 病の影との決戦', 'epilogue': 'エピローグ：夕暮れの丘',
}
SE_JA = {
    'wind': '風', 'pin': 'おふれを貼る', 'menu': 'ウィンドウを開く', 'cursor': 'カーソル', 'select': '決定', 'beckon': '手招き', 'chest': '宝箱',
    'item': 'アイテム入手', 'levelup': 'レベルアップ', 'fanfareS': '章の始まり', 'page': 'ページめくり', 'chime': '光のチャイム', 'scan': '配列を走査',
    'ding': 'ひらめき', 'snip': 'ハサミで切る（突出末端）', 'chop': 'まっすぐ切る（平滑末端）', 'pop': 'ポップ', 'snap': 'カチッ', 'join': '接合の「ピタッ」',
    'sparkle': 'きらめき', 'jigsaw': 'ジグソーパズル合体', 'rec': '録音ピッ', 'lyre': '竪琴', 'tape': 'テープ巻き／ガムテープ', 'crowd': '市場の賑わい',
    'cash': '代金', 'factory': '工場稼働', 'factory2': '工場稼働（増産）', 'fanfare': 'ファンファーレ', 'glow': '発光', 'horn': '港の汽笛',
    'bell': '配達ベル／鐘', 'book': '本を引く', 'swirl': '戦闘への渦', 'encounter': 'エンカウント', 'spell': 'じゅもん', 'heat': '熱変性「シュー」',
    'anneal': 'アニーリング「ピタ」', 'extend': '伸長「タタタ」', 'hit': 'ヒット', 'print': 'コピー（プリント）', 'gel': 'ゲル走行音', 'scanner': 'スキャナー',
    'zap': '電撃', 'switch': 'スイッチ', 'alert': 'Ct 到達アラート', 'beepLow': '計測開始', 'clock': '歯車時計', 'tick': '精密作業「チクタク」',
    'beep': '読み取りピッ', 'jingle': '解析完了ジングル', 'beat': '連続ビート', 'cluster': 'クラスター生成ポップ', 'heatmap': 'ヒートマップ表示',
    'slash': '斬撃', 'impact': '衝撃波', 'ghost': 'オフターゲットの影', 'bad': '誤り（フレームシフト）', 'victory': '勝利のファンファーレ', 'bellSoft': '小さなベル',
}


def tc(s, sep=','):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); x, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{x:02d}{sep}{ms:03d}'


def mmss(s): return f'{int(s // 60)}:{s % 60:04.1f}'


def wrap(text, soft=20, hard=30):
    """Break at a comma/period once a line has ~20 characters; force a break at 30."""
    out, cur = [], ''
    for ch in text:
        cur += ch
        if (len(cur) >= soft and ch in '、。」') or len(cur) >= hard:
            out.append(cur); cur = ''
    if cur:
        if out and len(cur) <= 4: out[-1] += cur
        else: out.append(cur)
    return '\n'.join(out)


def main():
    timing = json.load(open(os.path.join(HERE, 'timing.json')))
    cues = json.load(open(os.path.join(HERE, 'cues.json')))
    lines = timing['lines']
    # SRT
    srt = []
    for i, l in enumerate(lines):
        nxt = lines[i + 1]['start'] if i + 1 < len(lines) else l['end'] + 2
        end = min(nxt - 0.05, l['end'] + 0.8)
        who = '師匠：' if l['who'] == '師匠' else ''
        srt.append(f"{i + 1}\n{tc(l['start'])} --> {tc(end)}\n{wrap(who + l['text'])}\n")
    open(os.path.join(HERE, 'subtitles.srt'), 'w', encoding='utf-8').write('\n'.join(srt))
    # TIMELINE.md
    md = ['# GENE QUEST ― 設計図の勇者 ― 最終タイムライン', '',
          f"全長 {mmss(timing['duration'])}（{timing['duration']} 秒）・24 fps。時刻は `timing.json`（実測の声の長さ）と `cues.json`（効果音）から自動で書き出しています。", '',
          '| # | 区間 | 場面 | BGM | 計画 → 実際 |', '|---|---|---|---|---|']
    for i, b in enumerate(timing['blocks']):
        end = b['end'] if b['end'] is not None else timing['duration']
        md.append(f"| {i + 1} | {mmss(b['start'])}–{mmss(end)} | {SCENE_TITLE[b['scene']]} | {TRACKS[b['scene']]['name']} | {mmss(b['plan'])} → {mmss(b['start'])} |")
    md += ['', '## 場面ごとの台詞と効果音', '']
    for i, b in enumerate(timing['blocks']):
        end = b['end'] if b['end'] is not None else timing['duration']
        tr = TRACKS[b['scene']]
        md += [f"### {i + 1}. {SCENE_TITLE[b['scene']]}（{mmss(b['start'])}–{mmss(end)}）", '',
               f"BGM：**{tr['name']}**（{tr['bpm']} BPM）", '']
        for l in [l for l in lines if l['block'] == b['id']]:
            who = '師匠' if l['who'] == '師匠' else 'ナレーター'
            md.append(f"- `{mmss(l['start'])}` **{who}**　{l['text']}")
        se = [c for c in cues if c['scene'] == b['scene'] and b['start'] <= c['t'] < end + 0.01]
        if se:
            md += ['', '効果音：' + '、'.join(f"{mmss(c['t'])} {SE_JA.get(c['name'], c['name'])}" for c in se)]
        md.append('')
    open(os.path.join(HERE, 'TIMELINE.md'), 'w', encoding='utf-8').write('\n'.join(md))
    print('wrote subtitles.srt and TIMELINE.md')


if __name__ == '__main__':
    main()
