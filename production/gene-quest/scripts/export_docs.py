#!/usr/bin/env python3
"""台本・タイムラインから、人が読む資料を書き出す。

  python scripts/export_docs.py

出力
  script/master_script.md       全編の脚本（シーンごとに時刻・目的・背景・キャラクター・セリフ・用語・演出・音・出典・確認状況）
  script/scene_manifest.json    （時刻を追記して上書き）
  research/page_mapping.csv     PDFページ → 使用したシーン
  research/accuracy_checklist.md 医学的正確性の管理表（シーンID・解説内容・根拠ページ・主要用語・確認状況）
  research/key_terms.md         重要用語一覧（初出シーン・根拠ページ・読み）
"""
from __future__ import annotations

import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import CONFIG, ROOT, SCRIPT  # noqa: E402
from gqlib.text import to_reading  # noqa: E402

RESEARCH = ROOT / "research"


def ts(t: float) -> str:
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:04.1f}"


# 各シーンの正確性確認で、特に注意して確かめた点（制作中に資料と照合した内容）
# 映像で使わなかったページと、その理由（ページ画像を見て確認した）
UNUSED_PAGES = {
    1: ("表紙", "内容なし"),
    12: ("「転写の概要」の図（原核の mRNA 合成を強調）", "章の区切りの再掲。内容は p.4・p.6 で扱った"),
    27: ("「転写の概要」の図（真核の転写開始を強調）", "章の区切りの再掲。内容は p.28 以降で扱った"),
    38: ("真核生物の転写調節配列（遠位・近位調節要素）", "p.35 と同じ図。SC0502 は p.35 を根拠にした"),
    44: ("「転写の概要」の図（転写調節領域を強調）", "章の区切りの再掲"),
    45: ("「転写の概要」の図（転写後プロセシングを強調）", "章の区切りの再掲。内容は p.46 以降で扱った"),
    57: ("スプライシング・GT-AG ルール・snRNP", "p.50–52 と同じ内容（SC0604, SC0605 で扱った）"),
    58: ("細菌の rRNA・tRNA 前駆体と RNase P による切断点", "30分の尺に収めるため、原核生物の rRNA/tRNA プロセシングの詳細は省いた（真核の rRNA は p.62–63 で扱った）"),
    61: ("ヒト遺伝子の構造上の特徴", "p.53 と同じ図（SC0607 で扱った）"),
    65: ("非コード RNA 遺伝子の一覧", "p.56 と同じ内容（SC0701, SC0706 で扱った）"),
    73: ("From RNA to Protein（工程の一覧）", "p.4 と同じ流れ（SC0105 で扱った）"),
}

CHECK_NOTES = {
    "SC0104": "DNA→RNA（転写）→タンパク質（翻訳）。DNA→DNA は複製・修復・組換え（p.3）。RNAに写す必然性：mRNA は核で作られ細胞質へ運ばれてから翻訳に使われる（p.4, 71）",
    "SC0105": "核内の工程の順序は p.4 の図どおり",
    "SC0201": "ポリメラーゼの部位名（活性部位・NTPの入り口・RNAの出口・DNA/RNAらせん）は p.5 の図",
    "SC0202": "鋳型鎖 3'-TACTTTACGAT-5' → RNA 5'-AUGAAAUGCUA-3'＝非鋳型鎖の T を U に（p.7）",
    "SC0203": "鋳型 3'-TAGCCTATC-5' → RNA 5'-AUCGGAUAG-3'（p.10）。3'OH に 5'三リン酸、ピロリン酸が外れる（p.8）",
    "SC0204": "遺伝子 c, d が逆向き（p.11）。プロモーターの役割は p.71 の文言",
    "SC0205": "ファインマン・チェック。誤解「鋳型鎖と同じ配列」を、鋳型鎖とは相補的・非鋳型鎖と同じ（T→U）に訂正（p.7, 10）",
    "SC0301": "ホロ酵素＝コア酵素＋σ因子（p.14）。細菌に核がないことは補足として表示",
    "SC0302": "−35 TTGACA、−10 TATAAT（非鋳型鎖 5'→3'）、+1/+2 の最初の結合、約10ヌクレオチドで σ 解離（p.16, 18）",
    "SC0303": "ステムループの配列は p.21、ρ と A–U 塩基対は p.20",
    "SC0304": "遺伝子1〜3 の活性化／抑制の入れ替わりは p.23 の図どおり",
    "SC0305": "lacZYA と転写単位、lacI（p.25）。各遺伝子と酵素の対応は資料に図示がないため示さない",
    "SC0306": "CRP 結合領域・オペレーターはプロモーター内（p.22 注、p.24）。ラクトース由来物質による解除は補足と表示",
    "SC0401": "Pol I/II/III の担当は p.28 の表（p.59 の表とも整合）。多数の転写基本因子が必要な理由：ヌクレオソーム・クロマチン（p.28, 34）と巨大なゲノム（p.32）",
    "SC0402": "TATA は約25塩基上流、TFIID→TFIIB→Pol II/TFIIF→TFIIE/TFIIH（p.30 の図）。各因子の役割は p.32 の表。ゆがみが巨大なゲノムの中の物理的目印（p.32 の文言）",
    "SC0403": "TFIIH が ATP で DNA をほどき CTD の Ser5 をリン酸化（p.30, 32）。図(E)で TFIID は TATA に残る",
    "SC0404": "CAAT 5'-CCAAT-3'、GC 5'-GGGCGG-3'（p.33）",
    "SC0501": "活性化因子・介在因子・クロマチン再構成複合体・ヒストン修飾酵素は p.34 の図の配置",
    "SC0502": "遠位／近位調節要素・プロモーター・基礎的／調節的発現は p.35 の図",
    "SC0503": "ユークロマチン＝発現しうる、ヘテロクロマチン＝発現しない（p.70）。エピジェネティック制御は語句一覧のみ → 補足",
    "SC0504": "p.36 のオン/オフの並びをそのまま使用。p.37 の図に疾患名はないので付けない",
    "SC0505": "ファインマン・チェック。誤解「エンハンサーは遺伝子のすぐ前」を、数百〜数千bp離れた上流・下流、DNAループ、介在因子に訂正（p.34, 35）",
    "SC0506": "原核＝転写調節、真核＝＋転写後調節（p.70）。転写は核・翻訳は細胞質（p.4）",
    "SC0602": "5'ppp に G 付加 → 7位の N をメチル化（p.47）",
    "SC0603": "AAUAAA と GU に富む配列の間を切断、250個まで（20〜250個）の A（p.47）。キャップとポリAがエキソヌクレアーゼから守る（p.47）",
    "SC0604": "GT-AG 則、ブランチ部位 A、ジストロフィン 2400 kb・99%（p.48, 50）。読み枠のずれの説明は補足と表示（3塩基＝1アミノ酸は p.71）",
    "SC0605": "U1→U2AF/U2→U5・U4・U6→U1放出→U4放出・U6がU2へ→GUの5'側で切断・GとAが結合（投げ縄）→U5がエクソン保持（p.51, 52）",
    "SC0606": "A: E1-E3-E4、B: E1-E2-E4。グルコキナーゼ：肝臓 1L、膵B細胞/下垂体 1B（p.49）",
    "SC0607": "ファインマン・チェック。取り違え「エクソンを捨てる」を、イントロンが投げ縄で外れエクソンがつながる、に訂正（p.48, 50–52）",
    "SC0608": "遺伝子の構造は p.53（開始 ATG、終止 TGA、ポリアデニル化シグナル）",
    "SC0701": "ゲノムの割合は p.54、転写物の数は p.55（3項目の和は 59,893 で総数 60,483 と一致しない：資料の値をそのまま表示）",
    "SC0702": "80S＝60S（5S・28S・5.8S）＋40S（18S）、45S 前駆体（p.62, 63）",
    "SC0703": "Pol III のプロモーターは遺伝子内部（約50 bp、p.60）",
    "SC0704": "pri → Drosha（60〜70 nt）→ Exportin 5 → Dicer（21〜23 nt）→ RISC（p.67）",
    "SC0705": "結合した mRNA は分解（p.67 の図）、1000以上・30%以上（p.56）",
    "SC0706": "200塩基以上・ORF 100アミノ酸残基以下、キャップ・ポリA・スプライシングあり、翻訳なし（p.68）",
    "SC0707": "疾患名と特徴は p.56 の記載のみ。欠失の位置は模式と明記",
    "SC0801": "MRE と負のフィードバックは p.39 の図、毒性と摂取量は p.39 のテキスト層",
    "SC0308": "ファインマン・チェック。誤解「ラクトースだけで発現」を、グルコース（−）かつラクトース（＋）の二条件に訂正（p.24）",
    "SC0405": "ファインマン・チェック。誤解「Pol II が TATA に直接結合」を、TBP→TFIIB→Pol II の順に訂正（p.30, 32）",
    "SC0708": "ファインマン・チェック。誤解「非コードRNAはおまけ」を、rRNA・tRNA（翻訳）、miRNA（抑制）、欠失と疾患（p.56, 59, 67）に訂正",
    "SC0802": "BMAL1/CLOCK→E-box→Per, Cry, Rev-erbα, RORα、PER/CRY が抑制、Rev-erbα⊣RRE、RORα→RRE（p.41）。時計が必要な理由は p.42 の文言（太陽エネルギーを効率よく安全に利用するため）",
    "SC0803": "ファインマン・チェック。誤解「Per/Cry を作って終わり」を、PER/CRY が BMAL1/CLOCK を抑えるループに訂正（p.40, 41）",
    "SC0804": "マウスの表現型は p.42、疾患は p.43 の図（関連のみと明示）",
    "SC0805": "37 遺伝子、約16 kb（図 16,569 bp）、核にコードされたミトコンドリア特異的 RNA ポリメラーゼ、各鎖の全体を転写（p.72）",
}


def main() -> None:
    tl = json.loads((SCRIPT / "timeline.json").read_text(encoding="utf-8"))
    man = json.loads((SCRIPT / "scene_manifest.json").read_text(encoding="utf-8"))
    voices = yaml.safe_load((CONFIG / "voice_config.yaml").read_text(encoding="utf-8"))["characters"]
    times = {s["scene_id"]: s for s in tl["scenes"]}
    lines = {ln["line_id"]: ln for ln in json.loads((SCRIPT / "dialogue.json").read_text(encoding="utf-8"))["lines"]}
    # scene_manifest に時刻を追記
    for sc in man["scenes"]:
        t = times[sc["scene_id"]]
        sc["start"], sc["end"], sc["duration"] = t["start"], t["end"], t["duration"]
        sc["video"] = f"video/scenes/{sc['scene_id']}.mp4"
        sc["audio"] = f"audio/dialogue/scenes/{sc['scene_id']}.wav"
        sc["accuracy_check"] = CHECK_NOTES.get(sc["scene_id"], "")
    (SCRIPT / "scene_manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=1), encoding="utf-8")
    # master_script.md
    out = ["# GENE QUEST — 遺伝情報を読み解け！ 全編脚本", "",
           f"全編 {ts(tl['duration'])}（実際の音声の長さから算出）／{len(man['scenes'])} シーン／{len(lines)} セリフ", "",
           "時刻は完成版の時刻。根拠ページは講義資料 PDF のページ番号。原稿の一次情報は `script/source_script.md`。", ""]
    ch = None
    for sc in man["scenes"]:
        t = times[sc["scene_id"]]
        if sc["chapter"] != ch:
            ch = sc["chapter"]
            out += [f"## CHAPTER {ch} {sc['chapter_title']}", ""]
        out += [f"### {sc['scene_id']} {sc['title']}（{ts(t['start'])}–{ts(t['end'])}）", "",
                "| 項目 | 内容 |", "|---|---|",
                f"| 目的 | {sc.get('purpose', '')} |", f"| 背景 | {sc.get('bg', '')} |",
                f"| キャラクター | {', '.join(voices[c]['name'] for c in sc['chars'] if c in voices) or '—'} |",
                f"| 映像演出・カメラ | {sc.get('camera', '')}（描画: `{sc.get('visual')}`） |",
                f"| 画面上の専門用語 | {', '.join(sc['terms']) or '—'} |",
                f"| BGM | {sc.get('bgm', '')} |", f"| 効果音 | {', '.join(sc['sfx']) or '—'} |",
                f"| 根拠ページ | {', '.join('p.' + str(p) for p in sc['pages']) or '—'} |",
                f"| 正確性確認 | {sc['accuracy']}{'：' + CHECK_NOTES[sc['scene_id']] if sc['scene_id'] in CHECK_NOTES else ''} |", "",
                "| 時刻 | 話者 | セリフ（字幕） | 感情 | 備考 |", "|---|---|---|---|---|"]
        for tln in t["lines"]:
            ln = lines[tln["line_id"]]
            note = "補足（資料外）" if ln["note"] else ""
            if ln["reading_source"] == "manual":
                note = (note + " 読み指定").strip()
            out.append(f"| {ts(tln['start'])} | {voices[ln['character_id']]['name']} | {ln['text']} | {ln['emotion']} | {note} |")
        out.append("")
    (SCRIPT / "master_script.md").write_text("\n".join(out), encoding="utf-8")
    # page_mapping.csv
    pages = defaultdict(list)
    for sc in man["scenes"]:
        for p in sc["pages"]:
            pages[p].append(sc["scene_id"])
    RESEARCH.mkdir(exist_ok=True)
    with open(RESEARCH / "page_mapping.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["pdf_page", "scenes", "used"])
        for p in range(1, 74):
            w.writerow([p, " ".join(pages.get(p, [])), "yes" if p in pages else "no"])
    # accuracy_checklist.md
    acc = ["# 医学的正確性の確認表", "",
           "根拠ページは PDF のページ番号（全73ページを画像とテキストで確認済み）。確認方法：各シーンの台本と描画（静止画の書き出し）を、",
           "該当ページの図・本文と照合した。資料外の一般知識は台本で `{note=補足}` とし、画面に「補足（講義資料外の一般知識）」と表示する。", "",
           "| シーンID | 時刻 | 解説内容 | 根拠ページ | 主要用語 | 正確性確認 | 照合した点 |", "|---|---|---|---|---|---|---|"]
    for sc in man["scenes"]:
        t = times[sc["scene_id"]]
        status = "確認済み" if sc["pages"] else "対象外"
        acc.append(f"| {sc['scene_id']} | {ts(t['start'])} | {sc['title']} | {', '.join(map(str, sc['pages'])) or '—'} | "
                   f"{'、'.join(sc['terms'][:6]) or '—'} | {status} | {CHECK_NOTES.get(sc['scene_id'], '—')} |")
    acc += ["", "## 確認項目（制作指示 2-3）", "",
            "| 項目 | 結果 |", "|---|---|",
            "| DNAとRNAの塩基を混同していないか | 映像の配列はすべて相補性を手で検算（SC0202, SC0203, SC0302）。RNA は U、DNA は T |",
            "| 鋳型鎖と非鋳型鎖 | 鋳型鎖を読む。非鋳型鎖と RNA は同じ配列（T→U）（p.7） |",
            "| RNAの合成方向 | 常に 5'→3'。転写中の図は p.19 の向き（上が鋳型鎖 3'→5'、RNA は 5'末端から出る） |",
            "| 原核と真核の混同 | −10/−35・σ因子・オペロン・レギュロンは CH3 のみ、TATA・基本転写因子・スプライシングは CH4 以降。CH4 の比較と第2問で区別 |",
            "| RNAポリメラーゼと転写因子 | 合成するのはポリメラーゼ、因子は認識・配置・開始の補助（p.32） |",
            "| 転写と翻訳 | CH1 で定義を分け、翻訳は流れの説明に限る |",
            "| イントロンとエクソン | イントロンは転写されるが除かれる。エクソンには UTR も含むため「タンパク質の情報＝エクソン」とは言わない |",
            "| スプライシングの順序 | p.51–52 の 5 段階どおり（SC0605、第4問） |",
            "| miRNA と mRNA | miRNA は mRNA に結合して翻訳を抑える側（SC0705） |",
            "| 疾患の因果 | Feingold／Prader-Willi は資料の記載どおり。時計遺伝子と疾患は「関連」と明示。p.37 に疾患名を付けない |",
            "", "## 使わなかったページ", "",
            "| ページ | 内容 | 使わなかった理由 |", "|---|---|---|"]
    acc += [f"| {p} | {what} | {why} |" for p, (what, why) in UNUSED_PAGES.items() if p not in pages]
    acc += ["", "## 資料の記載が不明瞭・誤記と思われる箇所", "", "research/lecture_summary.md の「要確認事項」Q1〜Q10 を参照。"]
    (RESEARCH / "accuracy_checklist.md").write_text("\n".join(acc) + "\n", encoding="utf-8")
    # key_terms.md
    seen = {}
    for sc in man["scenes"]:
        for term in sc["terms"]:
            seen.setdefault(term, (sc["scene_id"], sc["pages"]))
    kt = ["# 重要用語一覧", "", "| 用語（字幕表記） | 音声の読み | 初出シーン | 根拠ページ |", "|---|---|---|---|"]
    for term, (sid, pg) in seen.items():
        kt.append(f"| {term} | {to_reading(term)} | {sid} | {', '.join(map(str, pg))} |")
    (RESEARCH / "key_terms.md").write_text("\n".join(kt) + "\n", encoding="utf-8")
    print("master_script.md / scene_manifest.json / page_mapping.csv / accuracy_checklist.md / key_terms.md を更新")


if __name__ == "__main__":
    main()
