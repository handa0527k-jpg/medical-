# 監督ノート：本編 第1話のシーン合成（合成担当エージェント向け）

## 仕組み
- `web/film.html?cut=episode01` が `web/scenes/episode01.js` を読み、`audio/cues_episode01.json` の `scenes` に従って
  `BS.ep01[sceneId](ctx, t, E, S)` を呼ぶ。`t` は**映画全体の秒**、`S = {id, start, end, beats}`。
  シーン境界は 0.5 秒のディゾルブを episode01.js が自動でかける（自分のシーンは S.start〜S.end を全部描くこと）。
- 字幕（セリフ）は common.js が自動で焼き込む（画面下 約 y>900 は字幕帯。重要な図・文字を置かない）。
- **時刻は絶対にハードコードしない**：`S.beats.xxx`、`E.line('E01-10').start/end`、`E.mouth('アカネ', t)` を使う。音声担当が時刻を微調整しても絵が追従するように。
- 図の進行 `p` は beats を区切りに `keys(t, [[beatA, pA], [beatB, pB], ...])` で写像し、各図の docstring にある段階（例：「O₂ が 0.52/0.62/0.72/0.82 でカチッ」）を音の beat に合わせる。
- ヘルパー（`BS.common`）：`clamp, lerp, ease.{in,out,inOut,back,expoOut}, prog(t,a,b,e), keys(t,[[t,v]...],e), shake(t,amp), camera(ctx,{x,y,zoom,rot,sx,sy},fn), renderTo(i,fn)`（オフスクリーン 1〜4 は共通層が使う。自分は 5 以上を使う）, `playShots(ctx,t,shots,E)`（shots の a/b は**絶対時刻**。`{a,b,draw(ctx,lt,t,shot,E),tin:{type:'dissolve'|'whip'|'flash',dur}}`）。
- 例として `web/scenes/intro.js`（冒頭30秒）と `episode01.js` の avant/title を読むこと。

## 使える部品（詳細は各ファイル冒頭の docstring）
- 背景：`BS.world` — drawVesselTunnel / drawRBCField3D（一人称）, drawVesselSide（横・groundY≈891、`layers:'back'`→キャラ→`drawFlowCells({layer:'front'})`）, drawCapillary / drawCapillarySide, drawTissueCell, drawRBC, drawPlatelet, drawO2, drawO2Transfer, drawPathogenSilhouette, drawAlarm, drawGrade, drawSpeedLines, drawParticles, drawVignette, drawLightRays, drawInfoCard, drawTelop, drawTitleLogo, heartbeat(t)。
- キャラ：`BS.chars` — drawAkane / drawShirou / drawWBCAlly(variant 0 ユズ好酸球,1 ゴウ好塩基球,2 ソウ単球,3 リンリンパ球)。
  opts: x,y(足元), scale(1≈600px), yaw(0正面〜90側面〜180背面) か view, pose('stand','run','hold','relieved','turn','ready','point','present','cheer','think','wave','walk','reach','battle','pose','look_up'), runPhase/walkPhase, reachAmt, pointAt{x,y}, expr('happy','determined','surprised','relieved','calm','alert','serious','shout','worried','sad','proud','smile'), mouth(=E.mouth(話者,t)), blink(=BS.chars.blinkAt(t,seed)), holdO2, holo, squash, rim{color,strength}, tint, look{x,y}, t, speed, alpha。
  `headAnchor(who,opts)`（顔アップの枠取り）, `handAnchor(who,opts).holo`（手の上のホログラム位置）。
  顔アップは scale 3〜3.4、`camera` の zoom 1.1〜1.6 で headAnchor を中心に。真横（yaw 90）の顔は弱いので会話は yaw 20〜60 で。
- 赤血球系の図：`BS.diag` — centrifugeTube, clotTube, plasmaProteins, rbcModel, membraneSkeleton, hemoglobin, lungTissueLoop, co2Transport, erythropoiesis, rbcLifespan, hemeRecycle, holoPanel（`web/diag_rbc.js` 冒頭に p の段階表。`BS.diag.SIZE[name]` が自然サイズ。横長の erythropoiesis/hemeRecycle は scale 0.6〜0.7）。
- 白血球・凝固：`BS.diag` — bacterium, phagocytosis, engulfFX, wbcLineup, neutrophilCard, allyCards, woundAndClot, bodyPullback, victoryFX（`web/diag_wbc.js` 冒頭に段階表）。
- 設定表：`out/sheet_chars.jpg`, `out/sheet_chars2.jpg`, `out/sheet_world.jpg`, `out/diag_rbc_sheet.jpg`, `out/diag_wbc_sheet.jpg`。

## 演出の方針
- **静止画を並べない**：常にカメラ（ゆっくりした寄り・パン・回り込み）、背景の流れ、キャラの呼吸・まばたき・口パクを動かす。
- 1シーンにつき 3〜6 ショット。セリフの話者が映っているときは口パク（`mouth: E.mouth(who,t)`）。ナレーション中はホログラム図を主役に、アカネ／シロウが横で指さす・見上げる・うなずく（`pose:'point'`, `pointAt`, `look`）。
- 図はアカネの手首（holo）から投影されるホログラムとして出すと世界観が揃う。図の文字は画面上部〜中央、字幕帯（下 180px）を避ける。
- 医学的正確さは図の作者が担保済み。数値・ラベルを勝手に変えない。
- 1フレームの描画は 250ms 以内（4並列で書き出すため）。

## 確認方法
- 静止画：`node tools/stills.mjs episode01 out/frames/<名前>.jpg 72 75.5 80 ...`（3列のコンタクトシートができる。Read で見て直す）
- 自分の担当区間だけ動画：`node tools/render.mjs episode01 out/<名前>.mp4 --from 70.6 --to 95 --workers 2 --audio audio/mix_episode01.wav`
- 全体の本番書き出しは監督が行う。
