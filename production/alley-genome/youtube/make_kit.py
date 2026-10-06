#!/usr/bin/env python3
"""YouTube upload kit for 路地裏のゲノム: video, title, description (with chapters), tags, Japanese SRT, thumbnail.

    python3 youtube/make_kit.py          # from production/alley-genome/
Needs final.mp4 (tools/render.py full) and thumbnails/thumb_c_cas9.jpg (tools/thumbnail.py).
"""
import json, os, shutil, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
PROD = os.path.dirname(HERE)
TL = json.load(open(os.path.join(PROD, 'timeline.json'), encoding='utf-8'))

CHAPTERS = {  # scene id → chapter label shown on YouTube
    'rain': 'オープニング：雨の路地',
    'six': '六人：遺伝子工学の道具たち（1953〜2004年）',
    'cut': '制限酵素：GATC、BamHIと回文配列、突出末端と平滑末端',
    'tie': 'DNAリガーゼ：BamHIとBglII、組換えDNA',
    'planet': 'プラスミド：ori・アンピシリン耐性・MCS、形質転換、GFP、ウイルスベクター',
    'copy': 'cDNA：逆転写酵素とオリゴdTプライマー',
    'pcr': 'PCR：95℃・55℃・72℃、2のn乗、リアルタイムPCRとCt値',
    'gel': '電気泳動：小さい断片ほど速い、DNA指紋',
    'read': 'シーケンス：サンガー法と次世代シーケンサー',
    'shadow': 'ゲノム編集：CRISPR-Cas9、NHEJとHDR、エピゲノム編集、倫理',
    'end': 'エンディング',
}

TITLE = '路地裏のゲノム ― 遺伝子工学の夜｜制限酵素・PCR・シーケンス・CRISPR-Cas9【学習アニメ】'

TAGS = ['遺伝子工学', '組換えDNA', '制限酵素', 'DNAリガーゼ', 'プラスミド', 'PCR', 'リアルタイムPCR', '電気泳動',
        'サンガー法', '次世代シーケンサー', 'CRISPR', 'Cas9', 'ゲノム編集', 'エピゲノム編集', '分子生物学', '遺伝医学',
        '医学部', '生物', '学習アニメ', 'アニメ']


def ts(x):
    x = int(x)
    return f'{x // 60}:{x % 60:02d}' if x < 3600 else f'{x // 3600}:{x // 60 % 60:02d}:{x % 60:02d}'


def description():
    ch = '\n'.join(f"{ts(s['start'])} {CHAPTERS[s['id']]}" for s in TL['scenes'])
    return f"""雨が三日降り続く夜、名前のない灰色の猫に導かれて入った路地裏で、「僕」は六人の若者に出会う。
彼らは、遺伝子を切り、つなぎ、運び、増やし、読み、書き換える道具の化身だった――。

遺伝子工学（組換えDNA技術）を、約11分半のアニメで一気に学ぶ学習用作品です。
制限酵素・DNAリガーゼ・プラスミドベクター・cDNA・PCR・電気泳動・DNAシーケンス・CRISPR-Cas9 と、
大学の講義で扱う流れをそのまま物語にしました。字幕は画面に表示されています。

▼ チャプター
{ch}

▼ 登場人物
キリ（制限酵素）／ムスビ（DNAリガーゼ）／ツムギ（DNAポリメラーゼ）／ヨミ（シーケンサー）／ハコブ（プラスミド＝運び屋）／カゲ（Cas9）／名前のない猫

▼ この動画で押さえること
・制限酵素は4〜8塩基の回文配列を認識して切る（BamHI：G^GATCC、SmaI：CCC^GGG）
・切り口が同じなら違うDNAどうしでもつながる（BamHIとBglIIはどちらもGATCの突出末端）
・プラスミドに必要なもの：複製起点（ori）・選択マーカー（アンピシリン耐性遺伝子）・マルチクローニングサイト
・PCRは 変性（95℃）→アニーリング（55℃）→伸長（72℃）を繰り返し、理論上は2のn乗に増える
・電気泳動では小さい断片ほど速く遠くへ進む
・サンガー法：ジデオキシヌクレオチドには3'-OHがないので伸長が止まる
・Cas9：ガイドRNA 20塩基＋PAM（NGG）、PAMの3塩基手前で二本鎖切断 → NHEJ（ノックアウト）／HDR（正確な書き換え）

▼ この動画について
・台詞・語りはすべて書き下ろしです。内容は大学の講義資料「遺伝子工学」に沿っています。
・声は音声合成（Microsoft ニューラル音声）、絵は画像生成AI（Nova Anime XL）で作ったキービジュアルを、自作のプログラムで動かしたものです。音楽・効果音も自作の合成です。
・学習用の作品です。研究・診断・治療の判断には使わないでください。

#遺伝子工学 #CRISPR #学習アニメ"""


def main():
    out = HERE
    open(os.path.join(out, 'title.txt'), 'w', encoding='utf-8').write(TITLE + '\n')
    open(os.path.join(out, 'description.txt'), 'w', encoding='utf-8').write(description() + '\n')
    open(os.path.join(out, 'tags.txt'), 'w', encoding='utf-8').write(', '.join(TAGS) + '\n')
    shutil.copy(os.path.join(PROD, 'final.srt'), os.path.join(out, 'rojiura_no_genome_ja.srt'))
    shutil.copy(os.path.join(PROD, 'thumbnails', 'thumb_c_cas9.jpg'), os.path.join(out, 'thumbnail.jpg'))
    assert len(TITLE) <= 100, len(TITLE)
    assert len(description()) <= 5000
    assert sum(len(t) for t in TAGS) + 2 * len(TAGS) <= 500
    # the video: YouTube's recommended 1080p24 SDR upload (H.264 High, ~8 Mbps, AAC-LC 48 kHz stereo, faststart)
    dst = os.path.join(out, 'rojiura_no_genome.mp4')
    if not os.path.exists(dst):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', os.path.join(PROD, 'final.mp4'), '-map', '0:v', '-map', '0:a',
                        '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-tune', 'animation', '-crf', '20',
                        '-maxrate', '10M', '-bufsize', '20M', '-g', '12', '-bf', '2', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709',
                        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '384k', '-ar', '48000', '-ac', '2',
                        '-metadata', 'title=路地裏のゲノム ― 遺伝子工学の夜', '-movflags', '+faststart', dst], check=True)
    print('kit:', sorted(os.listdir(out)))


if __name__ == '__main__':
    main()
