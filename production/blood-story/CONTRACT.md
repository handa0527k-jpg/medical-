# BLOOD STORY ― 体内を駆ける細胞たち ― 制作契約（全エージェント共通）

第1弾は「冒頭30秒サンプル」。その後に本編（同じ素材・同じ仕組みで数分）を作るので、
**すべての素材は再利用・拡張できる形**で作ること。

## 共通仕様
- 1920×1080, 30fps, 16:9。描画は Chromium の Canvas 2D（Playwright で1フレームずつ書き出す）。
- Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
- Playwright（npm）: `/tmp/claude-0/-home-user-medical-/cabe129b-da88-56c0-b315-974d7937f506/scratchpad/pw/node_modules/playwright`
  （`NODE_PATH` を通すか絶対パスで import。`chromium.launch({executablePath})`）
- 日本語フォント：`fonts/ZenKakuGothicNew-Bold.ttf`（見出し・字幕）と IPAゴシック（`/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf`）。web 側では `@font-face` で `../fonts/` にコピーして使う。
- 既存アニメ作品のキャラクター・デザインを真似しない（完全オリジナル）。
- 乱数は必ずシード付き（同じ t なら同じ絵）。描画関数は **時刻 t を引数に取る純関数**（状態を持たない）。
- ディレクトリ：`production/blood-story/`
  - `web/characters.js` … キャラクター（エージェントA）
  - `web/world.js` … 背景・細胞・エフェクト（エージェントB）
  - `audio/` … 声・BGM・効果音・ミックス（エージェントC）
  - `web/film.html` + `web/scenes/*.js` … シーン合成（監督＝統合担当）
  - `tools/` … レンダリング・ミックス用スクリプト

## JS モジュールの形
ES module ではなく、`<script src>` で読める素の JS。グローバル `window.BS` に登録する。
```js
window.BS = window.BS || {};
BS.chars = { drawAkane, drawShirou, drawWBCAlly, ... };
BS.world = { drawVesselTunnel, drawRBC, ... };
```
座標はすべてキャンバスの px（1920×1080 基準）。`ctx.save()/restore()` で状態を汚さないこと。

## キャラクター（A）
- **アカネ**（赤血球）：赤基調の制服と帽子、明るく元気。両凹円盤の形をエンブレム／帽子の意匠などに取り入れる。
  ただし本人は人型。実際の赤血球（world 側の drawRBC）とは見た目で明確に区別できること。
- **シロウ**（白血球・好中球）：白基調の制服、真面目で頼れる。分葉核（3〜4葉）の意匠を胸章などに。
- **白血球の仲間**：シロウと同じ隊の制服の別人物（色違いアクセント、体格違い）を数人。

API（全部同じ opts 形式）：
```
drawAkane(ctx, {
  x, y,            // 足元（地面との接点）の位置
  scale,           // 1 = 身長 約600px
  facing: 1|-1,    // 1=右向き
  view: 'side'|'front'|'threeq',
  pose: 'stand'|'run'|'hold'|'relieved'|'turn',
  runPhase,        // 走り周期 0..1（0 と 0.5 で接地＝足音）
  expr: 'happy'|'determined'|'surprised'|'relieved',
  mouth,           // 0..1 口の開き（リップシンク）
  blink,           // 0..1（1=閉じ）
  squash,          // 0..1 毛細血管で身をすくめる（0=通常）
  holdO2,          // true なら胸の前に O₂ の光を抱える
  t                // 秒（髪・服の揺れ用）
})
drawShirou(ctx, { 同上, expr: 'calm'|'alert'|'serious'|'shout', pose: 'stand'|'run'|'ready'|'turn' })
drawWBCAlly(ctx, { 同上, variant: 0..3 })
drawFaceCloseup?  … 顔アップはキャラ本体を大きな scale で描いて切り取ればよい（顔が破綻しない解像度で描くこと）
```
`web/sheet.html` にキャラクター設定表（正面・側面・走り・各表情）を並べ、PNG を `out/sheet_chars.png` に書き出す。

## 世界・エフェクト（B）
```
drawVesselTunnel(ctx, {t, z, radius, tint, curve})   // 一人称で血管内を前進（z=進んだ距離）。壁の質感・光。
drawRBC(ctx, {x, y, r, tiltX, tiltY, rot, deform, alpha, blur}) // 両凹円盤（中央が薄く明るい）。deform で細長く変形（毛細血管通過）
drawRBCField3D(ctx, {t, z, count, seed, speed})      // 透視投影の赤血球群。手前に大きく両凹がわかる個体
drawVesselSide(ctx, {t, scrollX, top, bottom})       // 横から見た血管内（多層パララックス）。キャラの走行シーンの背景
drawFlowCells(ctx, {t, scrollX, layer})               // 横流れする赤血球・血小板・血漿の粒（奥/手前レイヤ）
drawCapillary(ctx, {t, z, narrow})                    // 毛細血管（正面・一人称寄り）。narrow 0..1 で細くなる
drawCapillarySide(ctx, {t, scrollX, narrow})          // 毛細血管の横断面（キャラを横から追う時）
drawTissueCell(ctx, {x, y, r, t, glow})               // 酸素を受け取る組織の細胞
drawO2(ctx, {x, y, size, alpha, t})                   // 光る O₂ 記号
drawPathogenSilhouette(ctx, {x, y, size, t, reveal})  // 異物の影（全貌は見せない）
drawAlarm(ctx, {t, intensity})                        // 警報（赤い点滅・ビネット）
drawSpeedLines(ctx, {t, cx, cy, intensity}) / drawParticles(ctx, {t, seed, ...}) / drawVignette(ctx, {strength}) / drawLightRays(...)
drawInfoCard(ctx, {x, y, w, title, lines, alpha, t})  // 解説パネル（学習用）
drawTelop(ctx, {text, x, y, size, alpha, style})      // 予告テロップ等
```
`web/world_sheet.html` で一覧し、`out/sheet_world.png` に書き出す。

## 音声（C）
- 声：edge-tts（ja-JP-NanamiNeural / ja-JP-KeitaNeural）。アカネ・シロウ・ナレーションの声を区別。**自然な抑揚**を最優先（過度な早口・ピッチ改変はしない）。
- BGM・効果音：numpy で合成（著作権問題なし）。
- 出力：`audio/voice/*.wav`、`audio/se/*.wav`、`audio/bgm/*.wav`、`audio/cues.json`、`audio/mix_intro.wav`（30.0秒ちょうど, 48kHz stereo）。
- `cues.json` に各セリフの開始・終了時刻、文字、話者、30fps の口パク値（0..1 の配列）を書く。

## 冒頭30秒の台本と目安の時刻（秒）
| 場面 | 時間 | 内容 | セリフ（開始目安） |
|---|---|---|---|
| S1 血管突入 | 0–5 | 暗赤 → 鼓動 → 血管内へ高速前進、赤血球の群れ | N1 0.9「ここは、私たちの体の中。今日も無数の細胞たちが、命を支えている。」 |
| S2 アカネ登場 | 5–12 | O₂受け取り → 顔アップ → 走り出す（横追い→前へ回り込み） | A1 6.4「よーし！酸素を届けに行くよ！」 |
| S3 毛細血管 | 12–20 | 細くなる血管、正面から、変形して通過、組織細胞へ O₂ | A2 13.2「細い道でも大丈夫！私たちは、全身に酸素を届けるんだから！」 |
| S4 異変 | 20–24.5 | ほっと一息 → 警報 → 振り向き → 異物の影 → シロウ察知 | A3 21.0「えっ！？何が起きたの！？」 S1 22.6「異物を発見……！」 |
| S5 出動 | 24.5–30 | シロウ顔アップ → 走る → 仲間 → 正面回り込み | S2 24.7「体を守るのが、俺たち白血球の仕事だ！」 N2 直後「運ぶ赤血球。そして、体を守る白血球。血液の中では、今日も戦いが続いている。」(29.8までに終える) |

効果音の目安：鼓動 0–5、加速の風切り 1.5/3.3、流れの風 1–12、O₂受け取り 6.0、走り出し 8.5、足音 8.6–12（0.2秒間隔）、
狭い通路 13–16、O₂受け渡し 17.6、安堵 20.0、警報 20.3–24.3、振り向き 20.6/22.3、シロウ足音 25.6–29.6（0.18秒間隔）、インパクト 29.5。
BGM：0–5 期待感（オーケストラ風の盛り上がり）→ 5–20 明るい疾走 → 20.3 緊迫 → 24.5 力強い疾走 → 29.5 ヒット、暗転せず余韻で次へつなぐ。
