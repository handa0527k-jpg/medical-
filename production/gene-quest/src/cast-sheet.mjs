// The cast sheet (assets/cast.png): every character with its name and what it stands for.
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { sprite, FONT, C } from './engine.mjs';
import './sprites.mjs';
export const CAST = [
  ['hero', '勇者ルミナ', '主人公（無言の勇者）', '遺伝子工学を学ぶ見習い'],
  ['owl', '賢者オウルベルト', '師匠', '片眼鏡のフクロウ'],
  ['crab', '刃匠クラブロ', '制限酵素', 'ハサミの爪で配列を切る'],
  ['spider', '縫い蜘蛛ツムギ', 'DNAリガーゼ', '糸で 5\'-P と 3\'-OH を結ぶ'],
  ['fox', '吟遊狐ヴェルス', '逆転写酵素', 'mRNAの歌を本に写す'],
  ['camel', '商人キャラバ', 'ベクター', '乗り物（運べる長さ）を売る'],
  ['golem', '工場長ギアボルト', '発現ベクター', '細胞を工場に変える'],
  ['jelly', 'クラゲの精ルーチェ', 'GFP', '光る宝石の持ち主'],
  ['gull', '鴎船長ゲイル', 'ウイルスベクター', 'AAV・アデノ・レンチの船'],
  ['worm', '本の虫シオリ', 'ライブラリー', 'ゲノム／cDNAの棚の司書'],
  ['dragon', '熱竜サーモ', 'PCR', '95→55→72℃の炉'],
  ['tanuki', '探偵ダヌキのバンド', 'VNTR・DNA鑑定', 'バンドで見分ける'],
  ['eel', '電気ウナギのエレキ', '電気泳動', '電流で −極から ＋極へ'],
  ['flyBig', '灯台守ホタルのルクス', 'qPCR・NGS', '蛍光を数える'],
  ['robot', 'からくり読師リード', 'サンガー法', 'ddNTPで止めて読む'],
  ['mole', '地図モグラのマッパ', 'RNA-seq・Spatial', '位置を保った地図'],
  ['fairy', '妖精ナビ', 'ガイドRNA', '標的の20塩基を指す'],
  ['ghost', 'オフターゲットの影', '敵', '標的に似た配列'],
  ['raccoon', 'アライグマのラッシュ', 'NHEJ', '速いが不正確'],
  ['turtle', 'カメのトータス博士', 'HDR', '正確・ドナーを鋳型に'],
  ['mouseG', 'GFPマウス', 'トランスジェニック', '過剰発現のモデル'],
  ['boss', '病の影', '最終ボス', '病の原因（患者は描かない）'],
];
const S = 5, cw = 300, ch = 210, cols = 4;
const cv = createCanvas(cols * cw, Math.ceil(CAST.length / cols) * ch + 60);
const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
g.fillStyle = '#0c0f24'; g.fillRect(0, 0, cv.width, cv.height);
g.fillStyle = C.y; g.font = `32px ${FONT}`; g.fillText('GENE QUEST ― 設計図の勇者 ―　キャラクター', 20, 42);
CAST.forEach(([sp, name, role, desc], i) => {
  const x = (i % cols) * cw, y = 60 + Math.floor(i / cols) * ch, s = sprite(sp);
  const sc = sp === 'boss' ? 3 : S;
  g.drawImage(s, x + (cw - s.width * sc) / 2, y + 112 - s.height * sc, s.width * sc, s.height * sc);
  g.font = `16px ${FONT}`; g.textAlign = 'center';
  g.fillStyle = C.w; g.fillText(name, x + cw / 2, y + 140);
  g.fillStyle = C.y; g.fillText(role, x + cw / 2, y + 162);
  g.fillStyle = C.L; g.fillText(desc, x + cw / 2, y + 184);
  g.textAlign = 'left';
});
mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
writeFileSync(new URL('../assets/cast.png', import.meta.url), cv.toBuffer('image/png'));
console.log('assets/cast.png');
