"""Write the production sheets for a story film from its sources:
TIMELINE.md (scenes, lines, music and ambience cues), ASSETS.md (motions, music, effects — where each is
used, with sources and licences). usage: python3 scripts/film/docs.py <course> <production dir>"""
import json, os, re, sys, glob, collections
course, prod = sys.argv[1], sys.argv[2]
tl = json.load(open(os.path.join(prod, 'timeline.json')))
clips = json.load(open('src/engine/story/motion/clips.json'))
fmt = lambda x: f'{int(x // 60)}:{x % 60:05.2f}'
sdir = f'src/content/courses/{course}/story/scenes'
titles = {s['id']: s['title'] for s in tl['scenes']}

# ---------- TIMELINE ----------
L = ['# タイムライン — 「午前二時の本社ビル」', '', f"全長 {fmt(tl['total'])}（{tl['total']:.1f} 秒）・{len(tl['lines'])} セリフ・{len(tl['scenes'])} 場面。時刻は映画の頭からの経過時間（アプリの再生位置と同じ）。", '']
L += ['## 場面', '', '| # | 場面 | 開始 | 終了 | 長さ | 描画ファイル |', '|---|---|---|---|---|---|']
fname = {'hq': 'hq.ts', 'gate': 'gate.ts', 'archive': 'archive.ts', 'nucleolus': 'nucleolus.ts', 'split': 'split.ts', 'branch': 'branch.ts', 'dawn': 'dawn.ts'}
for i, s in enumerate(tl['scenes']):
    L.append(f"| {i + 1} | {s['title']}（{s['id']}） | {fmt(s['start'])} | {fmt(s['end'])} | {s['end'] - s['start']:.1f} s | `story/scenes/{fname.get(s['id'], '?')}` |")
L += ['', '## セリフ', '', '| 時刻 | 場面 | 話者 | セリフ |', '|---|---|---|---|']
for l in tl['lines']:
    L.append(f"| {fmt(l['t0'])}–{fmt(l['t1'])} | {titles[l['scene']]} | {'語り' if l['who'] == 'N' else l['who']} | {l['text']} |")
L += ['', '## 音楽（BGM）', '', '| 区間 | 曲 | 曲中の開始位置 | 音量 |', '|---|---|---|---|']
for b in tl['bgm']: L.append(f"| {fmt(b['t0'])}–{fmt(b['t1'])} | {os.path.basename(b['file'])[:-4]} | {b.get('offset', 0)} s | {b.get('gain')} dB（セリフ中は −9 dB に自動ダッキング） |")
L += ['', '## 環境音', '', '| 区間 | 素材 | 音量 |', '|---|---|---|']
for b in tl['ambience']: L.append(f"| {fmt(b['t0'])}–{fmt(b['t1'])} | {os.path.basename(b['file'])} | {b.get('gain')} dB |")
L += ['', '## 効果音', '', '| 時刻 | 素材 | 音量 |', '|---|---|---|']
for e in tl['sfx']: L.append(f"| {fmt(e['t'])} | {os.path.basename(e['file'])} | {e.get('gain', 0)} dB |")
open(os.path.join(prod, 'TIMELINE.md'), 'w').write('\n'.join(L) + '\n')

# ---------- ASSETS ----------
use = collections.defaultdict(set)
for f in glob.glob(os.path.join(sdir, '*.ts')):
    src = open(f).read(); sid = os.path.basename(f)[:-3]
    for m in re.findall(r"clip: '([a-z_0-9]+)'", src): use[m].add(sid)
A = ['# 素材一覧と利用条件 — 「午前二時の本社ビル」', '']
A += ['## モーション（モーションキャプチャ）', '', '出典：**CMU Graphics Lab Motion Capture Database**（http://mocap.cs.cmu.edu/）。', '利用条件（サイト記載）：「This dataset of motions is free for all uses.」「You may include this data in commercially-sold products, but you may not resell this data directly, even in converted form.」 謝辞：「The database was created with funding from NSF EIA-0196217.」', '',
      'ASF/AMC を `scripts/film/amc2json.py` で関節位置に変換し、`src/engine/story/motion/clips.json` の区間だけを切り出して使用（各人物の身長に合わせて拡大縮小、向き・位置を配置、場面ごとに IK で手先を小道具へ、視線を相手へ補正）。', '',
      '| クリップ | CMU テイク | 内容（データベースの記述） | 区間（秒） | 使った場面 |', '|---|---|---|---|---|']
for k, c in clips.items():
    if k.startswith('_'): continue
    A.append(f"| {k} | {c['src']} | {c['desc']} | {c['from']}–{c['to']} | {'、'.join(sorted(use.get(k, []))) or '（未使用）'} |")
A += ['', '調べたが使わなかったもの：Mixamo・Rokoko Motion Library（いずれもアカウントでのダウンロードが必要で、生データの再配布は不可。リポジトリに含めて再編集できる形にできないため不採用）、Bandai Namco Research Motiondataset（CC BY-NC-ND 4.0：改変不可のため、2D人物への当てはめに使えない）。「Mocap ATLAS」という名前のダウンロード可能なライブラリは確認できなかった。', '']
A += ['## 音楽（BGM）', '', '作曲：**Kevin MacLeod（incompetech.com）**。Licensed under Creative Commons: By Attribution 4.0 License（http://creativecommons.org/licenses/by/4.0/）。映像のエンドタイトルとこの一覧にクレジットを表示。ファイルは `scripts/film/fetch_audio.sh` で incompetech.com から取得（リポジトリには含めない）。', '', '| 曲 | 使った場面 |', '|---|---|']
for b in tl['bgm']:
    sc = [s['title'] for s in tl['scenes'] if s['start'] <= b['t0'] + 1 < s['end']]
    A.append(f"| \"{os.path.basename(b['file'])[:-4]}\" Kevin MacLeod (incompetech.com) | {'、'.join(sc)} |")
A += ['', '## 効果音・環境音', '', '- **Kenney**（https://kenney.nl）RPG Audio / Impact Sounds / Interface Sounds — **CC0**（パブリックドメイン相当）。使用したファイルのみ `production/nucleus-hq/audio/se/kenney/` に同梱（License_*.txt つき）。',
      '- **自作の合成音**（`scripts/film/synth_se.py` がノイズと発振器から生成。第三者の音源なし）：環境音（夜の街、静かな部屋、機械のうなり、朝の街）、ほか。', '', '| 素材 | 種類 | 使用回数 |', '|---|---|---|']
cnt = collections.Counter(os.path.basename(e['file']) for e in tl['sfx'])
for b in tl['ambience']: cnt[os.path.basename(b['file'])] += 1
for f, n in sorted(cnt.items()): A.append(f"| {f} | {'Kenney (CC0)' if f.endswith('.ogg') else '自作（合成）'} | {n} |")
A += ['', '## 声', '', '- Microsoft Edge のニューラル音声（edge-tts、APIキー不要）で読み上げ。特定の実在人物の声はまねていない。', '- 口の動きは録音した声の大きさ（30 fps の包絡線、`story/lipsync.json`）に合わせている。', '']
open(os.path.join(prod, 'ASSETS.md'), 'w').write('\n'.join(A) + '\n')
print('wrote TIMELINE.md, ASSETS.md')
