# GENE LAB 3D 授業動画

講義の内容を、ラボと同じ**実物の分子モデル**（PDBの原子座標）で描いたナレーションつきの3Dアニメにします。
動画の1コマ1コマは「時刻 t」だけから決まるので、ブラウザでの再生と書き出した MP4 はまったく同じ映像になります。

| 動画 | 長さ | 内容 |
|---|---|---|
| `restriction` 制限酵素とDNAリガーゼ | 約4分 | 細菌の防御（メチル化で自分は守る）→ 回文配列 GGATCC → 本物の BamHI（1BHM）が滑って探し、G↓GATCC で上下をずらして切る → 5′突出・3′突出（PstI）・平滑（SmaI）→ 付着末端が仮どめ → ニック → リガーゼ（1X9N）が ATP でふさぐ → BamHI＋BglII＝GGATCT はどちらでも切れない |
| `cloning` プラスミドでクローニング | 約4分 | pUC18（ori・Amp^r・lacZ・MCS）→ BamHI で開いて遺伝子を入れ、リガーゼでつなぐ → 熱ショックで形質転換 → アンピシリン選択と青白選択 → 20分に1回分裂・10時間で約10億倍 → プラスミド精製 → 発現ベクターで GFP（1EMA） |
| `pcr` PCR | 約4分 | なぜ増やすか → 材料 → 1サイクル目を原子レベルで（95℃でほどけ、55℃でプライマー、72℃で2つの Taq 3KTQ が伸ばす）→ 棒で5サイクル：3サイクル目に目的の長さ2本、2ⁿ−2n → 30サイクルで約10億倍 → リアルタイムPCR の Ct |
| `sanger` サンガー法 | 約6分40秒 | 何が問題か → 材料（鋳型・プライマー・Taqポリメラーゼ・dNTP）→ 3′-OH がリン酸を攻撃して鎖が伸びる（原子レベル）→ ddNTP は 3′-O がないので止まる（本物の ddCTP：PDB 3KTQ）→ 偶然に止まる → あらゆる長さ → 電気泳動で下から読む → 4色蛍光＋キャピラリー → まとめ |
| `crispr` CRISPR-Cas9 | 約5分 | 細菌の免疫 → Cas9 とガイドRNA（5F9R）→ PAM（NGG）を探してほどき R-loop → HNH・RuvC が PAM の3塩基手前を切る → NHEJ の1塩基欠失でフレームシフト（タンパク質で確認）→ HDR で FLAG タグをノックイン → dCas9＋DNMT3A/TET1 のエピゲノム編集 → 2015年のヒト三前核胚と倫理 |

サンガー法の配列は講義スライド29と同じ（鋳型 3′-CGTATACAGTCAGGTC-5′、プライマー GCAT、読める配列 ATGTCAGTCCAG）。

## 見る

- 動画はアプリには入れず、YouTube にアップロードする前提です。タイトル・説明文・チャプターは `python3 film/youtube.py` で `film/youtube/<id>.txt` に書き出します
- 確認用：開発サーバーで `web/film.html?id=<id>`（チャプターから好きな場面へ飛べます）
- MP4：下の手順で `film/out/sanger-1080p.mp4`（と軽量版 `sanger-720p.mp4`）を書き出します

## 作り方

```bash
# 1. 台本 → ナレーション（Microsoft のニューラル音声 Nanami、edge-tts）と各文の時刻
SSL_CERT_FILE=/path/to/ca.pem python3 film/voice.py sanger
#    → web/public/film/sanger/narration.mp3, timing.json

# 2. （任意）近接撮影用に細かい分子表面を作る
FILM=1 python3 pipeline/molecules.py 3KTQ
FILM=1 blender -b --factory-startup --python blender/molecules.py -- 3KTQ
#    → web/public/film/models/3KTQ.glb（ラボ用の約3倍の細かさ）

# 3. 静止画で確認 → 本番書き出し
cd web && npm run build && npx vite preview --port 4176 &   # 書き出しは固定したビルドから（開発サーバーは編集で再読み込みされる）
node scripts/render-film.mjs sanger --url http://localhost:4176 --stills 30,100,170
cd .. && sh film/render.sh sanger pcr          # 3並列・10秒ずつのチャンクで書き出し、つないでナレーションを重ねる
W=1280 H=720 sh film/render.sh crispr          # 720p（約2倍速）
#   中断しても、もう一度実行すれば終わったチャンクの続きから再開する
```

- 描画は three.js（ラボと同じエンジン）。書き出しはヘッドレス Chromium＋Mesa（llvmpipe, EGL）で、1080p・24fps・約1.1 fps（3並列で約1.4 fps）
- 映画用の追加効果：被写界深度、アンビエントオクルージョン、ブルーム、周辺減光、細かい粒子
- 字幕・図・ラベルは HTML で描き、コマと一緒に撮影します（サイズは画面幅に対する割合なので、再生画面の大きさによらず同じ見え方）
- 台本は `film/<id>/script.json`。`text` が字幕、`speech` が読み上げ（ddNTP →「ディーディーエヌティーピー」、3′ →「さんダッシュ」など）。映像の出来事はすべて「どの文の何秒後」で決めているので、台本を直してナレーションを録り直しても映像は自動で合います

## 正確さについて

- DNA は 1BNA の実測座標から作った原子模型。3′-OH の酸素（O3′）は実際の原子で、ddNTP ではその原子を取り除き、C3′ に水素を付けて描いています
- dNTP の β・γ リン酸（ピロリン酸として外れる部分）は、α-リン酸から外向きに足した図解用の原子配置です（距離は実際に近い値）
- ポリメラーゼは化学反応を見せる場面では消しています（画面に注記あり）。「本物の結晶構造」の場面は 3KTQ の原子座標そのもの（酵素・DNA・ddCTP）です
- チューブ・ゲル・キャピラリーは模式図です。4色の割り当て（A 緑・T 赤・C 青・G 黄）は説明用で、実機では G を黒で表示することが多い
