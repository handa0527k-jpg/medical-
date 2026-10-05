#!/usr/bin/env python3
"""YouTube upload kit for the six genetics films: thumbnails, captions (SRT), title/description with chapters."""
import json, re, shutil
from pathlib import Path
from PIL import Image

R = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
d = json.loads((R / 'production/lecture-video/films-page/chapters.json').read_text(encoding='utf-8'))
T = {1: '遺伝子とは何か', 2: '核酸の化学とDNAの二重らせん', 3: '染色体 ―DNAの収納と数の異常', 4: '遺伝子の構造と遺伝情報の発現', 5: 'ゲノムの変異・多型と動く遺伝子', 6: 'エピゲノムとミトコンドリアゲノム'}
A = {
 1: '受精卵1個から60兆個の細胞へ。設計図の正体がDNAであることをエイブリーの形質転換実験で確かめ、DNA→RNA→タンパク質のセントラルドグマと、遺伝子の変化が疾患につながる生体の階層を見ます。',
 2: 'ヌクレオチド（リン酸・五炭糖・塩基）の成り立ち、リボースとデオキシリボース、プリンとピリミジン。逆平行の二重らせん、塩基対の水素結合、ホスホジエステル結合、そして核酸の代謝と痛風まで。',
 3: '2 nm のDNAがヌクレオソーム、クロマチンを経て1400 nm の染色体にたたまれるしくみ。核型と染色体の形、減数分裂の不分離からトリソミーが生まれる理由、13・18・21番の特徴。',
 4: '遺伝子の定義と構造（プロモーター・UTR・エクソン・イントロン）、転写とスプライシング、AUG から終止コドンまでの翻訳、エンハンサーとサイレンサー、ゲノムの構成と ncRNA。',
 5: '置換・挿入・欠失。置換の結果4通り（ナンセンス・ミスセンス・サイレント・センス）と読み枠のずれ、一塩基多型、ALDH2 とお酒の強さ、トランスポゾンとレトロ転移、偽遺伝子。',
 6: '配列を変えずに働きを変えるエピゲノム。メチル化でオフ、アセチル化でオン、生活（運動）で変わるエピゲノム。そしてミトコンドリアゲノムの多コピー・37遺伝子・母系遺伝。シリーズの最終回です。',
}
TAGS = '遺伝医学, 遺伝子の基礎, 医学部, 医学生, 生化学, 分子生物学, DNA, 遺伝子, 授業動画, 国試対策'
fmt = lambda s: f"{int(s)//60}:{int(s)%60:02d}"
lines = []
for f in d:
    L = f['lecture']
    # YouTube chapters: start at 0:00, each at least 10 s long; short scenes are folded into the previous chapter
    ch = []
    for c in f['chapters']:
        name = 'オープニング' if c['title'].startswith('タイトル：') else c['title']
        if c['chapter'] and not re.fullmatch(r'第\d講', c['chapter']):
            name = f"【{c['chapter'].replace('　', ' ')}】{name}"
        if ch and c['t'] - ch[-1][0] < 10:
            continue
        ch.append((c['t'], name))
    ch = [(t, n) for (t, n) in ch if f['total'] - t >= 10 or t == 0]
    ch[0] = (0, ch[0][1])
    title = f"【遺伝子の基礎 第{L}講】{T[L]}｜劇画で学ぶ遺伝医学"
    desc = f"""{A[L]}

遺伝医学「遺伝子の基礎（構造と機能）」全6講の第{L}講を、講義まるごと1本の劇画授業にしました。字幕は「字幕（CC）」ボタンで表示できます。

▼ チャプター
""" + "\n".join(f"{fmt(t)} {n}" for t, n in ch) + f"""

▼ シリーズ（全6講）
""" + "\n".join(f"第{k}講 {T[k]}" for k in range(1, 7)) + """

▼ この動画について
・講義の台詞・板書は講義資料に沿って作成し、図（DNA・染色体・遺伝暗号など）はすべて描き起こしています。患者の顔は描いていません。
・講師の声は音声合成（Microsoft Neural 音声）、映像は自作の描画プログラムによるアニメーションです。
・学習用の教材です。診断や治療の判断には使わないでください。

#遺伝医学 #医学部 #分子生物学"""
    assert len(title) <= 100 and len(desc) <= 5000, (L, len(title), len(desc))
    (OUT / f'lecture{L}_title.txt').write_text(title + '\n', encoding='utf-8')
    (OUT / f'lecture{L}_description.txt').write_text(desc + '\n', encoding='utf-8')
    shutil.copy(R / f'production/lecture-video/genetics-basics-{L}-film/subtitles.srt', OUT / f'lecture{L}_ja.srt')
    t = 5 if L == 1 else 8.5
    Image.open(R / f'production/lecture-video/genetics-basics-{L}-film/layers/full_{int(t*24):05d}.jpg').convert('RGB').save(OUT / f'lecture{L}_thumbnail.jpg', quality=92)
    lines.append(f"| 第{L}講 | lecture{L}.mp4 | {fmt(f['total'])} | {len(ch)} |")
(OUT / 'tags.txt').write_text(TAGS + '\n', encoding='utf-8')
print("\n".join(lines))
