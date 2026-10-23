"""Write YouTube title / description / chapters for each film (film/youtube/<id>.txt).

    python3 film/youtube.py sanger pcr ...

Chapters come from the scene starts in web/public/film/<id>/timing.json; the
first chapter is always 0:00 and the short title card is folded into it
(YouTube needs chapters of 10 s or more).
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ABOUT = {
    'transcription': ('転写（DNA→RNA）を、最初から最後まで「ひとつの料理店の物語」で解説する2Dアニメ。秘伝のレシピ本（DNA）を書き写し係（RNAポリメラーゼ）がメモ（RNA）に写す話から、鋳型鎖、5′→3′、プロモーター、原核生物のσ因子・終結・lacオペロン、真核生物のPol I〜III・基本転写因子 D・B・F・E・H・エンハンサー、mRNAのキャップ・ポリA・スプライシング、miRNA、時計遺伝子、ミトコンドリアまで。各場面は「物語 → 教科書の言葉では → 一言で」の3段です。',
                      'イラストはすべて模式図（アニメ）です'),
    'restriction': ('制限酵素が回文配列 GGATCC を見つけて切り、付着末端ができ、DNAリガーゼが切れ目をふさぐまでを、実際の結晶構造（BamHI・BglII・DNAリガーゼI）と原子レベルのDNAで見ます。',
                    'BamHI PDB 1BHM（Newman 1995）／BglII PDB 1DFM（Lukacs 2000）／ヒトDNAリガーゼI PDB 1X9N（Pascal 2004）'),
    'cloning': ('pUC18 に遺伝子を入れ、大腸菌に形質転換し、アンピシリンと青白選択で選び、増やして取り出すまで。発現ベクターで GFP を作らせる例も。',
                'GFP PDB 1EMA（Ormö 1996）。プラスミド・大腸菌・培地は模式図'),
    'pcr': ('PCR の1サイクル（95℃・55℃・72℃）を原子レベルで、本物の Taq ポリメラーゼの結晶構造で見ます。3サイクル目に目的の長さが現れ、2ⁿ−2n で増えるしくみと、リアルタイムPCR の Ct 値まで。',
            'Taq DNAポリメラーゼ PDB 3KTQ（Li, Korolev, Waksman 1998）'),
    'sanger': ('サンガー法（ジデオキシ法）で何が起きているのかを、本物の Taq ポリメラーゼと ddCTP の結晶構造、原子レベルのDNAで見ます。3′-OH がなぜ大事か、ddNTP でなぜ止まるのか、止まった長さからどう配列が読めるのか。',
               'Taq DNAポリメラーゼ・DNA・ddCTP PDB 3KTQ（Li, Korolev, Waksman 1998）'),
    'crispr': ('Cas9 が PAM（NGG）を探してDNAをほどき、ガイドRNAと対合して切るまでを、実際の Cas9–sgRNA–DNA の結晶構造で見ます。NHEJ のフレームシフト、HDR のノックイン、dCas9 のエピゲノム編集、ヒト胚の編集と倫理まで。',
               'SpCas9–sgRNA–標的DNA PDB 5F9R（Jiang 2016）'),
}


def ts(s):
    s = int(s)
    return f'{s // 60}:{s % 60:02d}'


def main(ids):
    out_dir = os.path.join(ROOT, 'film', 'youtube')
    os.makedirs(out_dir, exist_ok=True)
    for fid in ids:
        t = json.load(open(os.path.join(ROOT, 'web', 'public', 'film', fid, 'timing.json')))
        lines = []
        # the title card is shorter than YouTube's 10 s minimum, so it opens the first chapter
        scenes = [sc for sc in t['scenes'] if sc['id'] != 'title']
        for i, sc in enumerate(scenes):
            lines.append(f"{ts(0 if i == 0 else sc['start'])} {sc['label'].replace('  ', ' ')}")
        about, pdb = ABOUT[fid]
        intro = f'{pdb}\n' if fid == 'transcription' else f'分子はすべて Protein Data Bank の原子座標から作った実物の形です。\n分子構造：{pdb}\nDNA：B型DNA PDB 1BNA（Drew 1981）の原子座標から作成\n'
        music = json.load(open(os.path.join(ROOT, 'film', 'music.json')))['films'][fid]
        text = f"""タイトル：
{t['title']}｜{t['subtitle']}【{'アニメで学ぶ遺伝医学' if fid == 'transcription' else '3Dアニメ授業・組換えDNA技術'}】

説明：
{about}

チャプター
{chr(10).join(lines)}

{intro}ナレーション：合成音声（Microsoft Nanami{'・Keita' if fid == 'transcription' else ''}）
音楽：{music['title']}（{music['en']}）／演奏 Musopen・パブリックドメイン
制作：{'SVG アニメ（Chromium で書き出し）・ffmpeg' if fid == 'transcription' else 'three.js・Blender・gemmi'} などのオープンソースソフトウェア

タグ：
{t['title']},{'セントラルドグマ,RNAポリメラーゼ,スプライシング,lacオペロン,アニメ' if fid == 'transcription' else '遺伝子工学,組換えDNA,3Dアニメ'},分子生物学,生物,医学,授業
"""
        p = os.path.join(out_dir, f'{fid}.txt')
        open(p, 'w').write(text)
        print(p)


if __name__ == '__main__':
    main(sys.argv[1:] or list(ABOUT))
