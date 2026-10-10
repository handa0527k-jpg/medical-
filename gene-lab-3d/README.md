# GENE LAB 3D — 組換えDNA技術を、本物の分子で手を動かして学ぶ

講義資料「組換えDNA技術・遺伝子導入技術（2026）」を題材にした、独立した3D学習アプリです。
出てくる酵素やウイルスは **Protein Data Bank の原子座標から作った実物の形**。学習者は見るだけでなく、
酵素を運んで切り、温度を変えてPCRを回し、Cas9でゲノムを編集し、モデルそのものを掴んで回して確かめます。

## ラボ（すべて自分で操作する）

| | ラボ | やること | 使う実構造 |
|---|---|---|---|
| 01 | 制限酵素で切って、つなぐ | 酵素カードをDNAへドラッグ → 認識配列でだけ止まって切断 → 5'/3'突出・平滑末端を観察 → リガーゼでつなぐ。つなぎ替え実験（BamHI末端＋BglII末端＝GGATCT、どちらでも再切断されない） | BamHI 1BHM / EcoRI 1ERI / HindIII 2E52 / BglII 1DFM / リガーゼI 1X9N |
| 02 | プラスミドでクローニング | pUC18をBamHIで開く → 遺伝子を差し込む → 大腸菌へドラッグ（形質転換）→ アンピシリン選択 → 培養時間スライダー → プラスミド精製 | （模式図） |
| 03 | PCR | 温度を自分で 95/55/72℃ に。1サイクル目は原子レベルで鎖がほどけ、プライマーが結合し、Taqポリメラーゼが伸ばす。以降は全分子を棒で表示し、3サイクル目に「目的の長さ」が2本（講義スライドと同じ）。プライマー等を抜く実験、30サイクル自動、リアルタイムPCRのCt | Taqポリメラーゼ 3KTQ |
| 04 | サンガー法 | 本物のddCTP（3KTQ内）を調べる → 4本のチューブにddNTPをドラッグ → 反応 → 電気泳動 → バンドを下からクリックして読む → 4色キャピラリー | 3KTQ |
| 05 | CRISPR-Cas9 | sgRNAの20塩基をDNA上でドラッグ → PAM（NGG）がある所でだけCas9が結合（R-loopは結晶構造そのもの）→ HNH/RuvCで切断 → NHEJ（フレームシフト）かHDR（FLAGタグのノックイン）を選び、タンパク質配列で結果を確認 | Cas9–sgRNA–DNA 5F9R |
| 06 | 実物大ギャラリー | DNA・GFP・AAV・アデノ・レトロウイルスを同じ縮尺で並べ、倍率スライダーで比較。GFPに波長を選んだ光を当てて光らせる | GFP 1EMA / AAV2 1LP3（60量体） |

**授業動画（YouTube 用・アプリとは別）**：ラボと同じ実物の分子モデルで描いた、ナレーション・字幕つきの3Dアニメ5本を MP4 に書き出します。YouTube のタイトル・説明・チャプターは `film/youtube/<id>.txt`。作り方は [film/README.md](film/README.md)。

| id | 動画 | 長さ | 使う実構造 |
|---|---|---|---|
| `restriction` | 制限酵素とDNAリガーゼ | 約4分 | BamHI 1BHM / BglII 1DFM / リガーゼI 1X9N |
| `cloning` | プラスミドでクローニング | 約4分 | GFP 1EMA（プラスミド・大腸菌は模式図） |
| `pcr` | PCR | 約4分 | Taqポリメラーゼ 3KTQ |
| `sanger` | サンガー法 | 約7分 | Taqポリメラーゼ＋ddCTP 3KTQ |
| `crispr` | CRISPR-Cas9 | 約5分 | Cas9–sgRNA–DNA 5F9R |

**3Dモデル図鑑**（`#/models`）では、すべてのモデルを自由に回し、タンパク質・DNA・sgRNAなどを部分ごとに表示／半透明にできます。

### 3Dモデルを自由に動かす

どの画面でも、ビュー左上で操作モードを切り替えます（キーボード：V / G / R）。

- **視点**：ドラッグでカメラを回す、ホイール・ピンチで拡大（ラボの操作はこのモード）
- **移動**：モデルをつかんで動かす。ホイールでモデルの大きさを変える
- **回転**：モデルをつかんで好きな向きに回す
- **元に戻す**：動かしたモデルを元の位置へ

ラボの判定（酵素が溝に合わせて座る位置など）はDNA自身の座標系で計算しているので、DNAを動かしたり回したりしてもそのまま実験を続けられます。

## 正確さについて

- DNAは配列から**原子レベル**で組み立てています。型はB型DNAの実測構造 1BNA の4種の塩基対で、標準塩基対座標系（Olson 2001）で測った **ねじれ 34.3°／ライズ 0.335 nm（10.5 bp/回転）** で並べます
- 酵素は結晶構造中のDNAの軸と**副溝の向き**を測り、ラボのDNAの溝に合わせて座らせます。Taqポリメラーゼの進む向きは結晶中のddNTPの位置から決めています
- 構造が登録されていない制限酵素（SacI・KpnI・SmaI・XbaI・SalI・PstI・SphI）は、BamHIの形で代用し、その旨を画面に表示します
- プラスミド・大腸菌・アデノウイルス・レトロウイルスは原子構造がない（または大きすぎる）ため模式図です（ウイルスは実寸）
- 末端の形・PCRの本数（n サイクル後 2^n − 2n 本が目的の長さ）・サンガー法の読み・PAMと切断位置・フレームシフトは `web/tests/logic.test.ts` で検証しています

## しくみ（すべてオープンソース）

```
pipeline/molecules.py     PDB(mmCIF) → 生物学的集合体（gemmi）→ ガウス分子表面（numpy + scikit-image の marching cubes）
                          → 原子に応じた頂点色、DNAの軸・溝・目印の座標 → .cache/mesh/<ID>/*.ply と web/public/models/<ID>.json
pipeline/dna_template.py  1BNA → 塩基対の原子テンプレート（web/public/models/bdna.json）
blender/molecules.py      Blender 4.5（ヘッドレス）：PLY取り込み → 間引き → AOを頂点色に焼き込み → Draco圧縮glTF、Cycles描画
blender/assets.py, build.py  模式図の部品（プラスミド・大腸菌・ウイルス・チューブ）を手続き的にモデリング → kit.glb
blender/render.py         部品のCycles描画
web/                      Vite + TypeScript + three.js（ラボ・3D図鑑）
```

再生成：

```bash
pip install gemmi scikit-image scipy numpy
python3 pipeline/molecules.py            # 表面メッシュ（PDBは .cache/pdb に自動取得）
python3 pipeline/dna_template.py
blender -b --factory-startup --python blender/molecules.py -- --render
blender -b --factory-startup --python blender/build.py -- web/public/models/kit.glb
blender -b --factory-startup --python blender/render.py -- web/public/renders
```

Webアプリ：

```bash
cd web
npm install
npm run dev          # 開発サーバ
npm run build        # dist/（相対パスなのでどこに置いても動く。BASE_PATH=/sub/ も可）
npm test             # ロジックの単体テスト
npm run test:e2e     # 全ラボと3D図鑑の表示・モデル操作（Playwright）
npm run build:hosted # 厳しいCSPのホスト向け（claude.aiのArtifactなど）：Draco/WebAssemblyを使わず、
                     # 量子化したGLBをJSONに包んで同一オリジンのfetchだけで読み込む
```

画質ボタンで影とアンビエントオクルージョン（GTAO）を切り替えられます（スマートフォンでは既定で軽量）。

## 出典

分子構造：RCSB Protein Data Bank —
1BHM（Newman 1995）, 1ERI（Kim 1990）, 2E52（Watanabe 2009）, 1DFM（Lukacs 2000）, 1X9N（Pascal 2004）,
3KTQ（Li, Korolev, Waksman 1998）, 5F9R（Jiang 2016）, 1EMA（Ormö 1996）, 1LP3（Xie 2002）, 1BNA（Drew 1981）。
フォント：Zen Kaku Gothic New（SIL OFL、`web/src/assets/OFL-ZenKakuGothicNew.txt`）。
