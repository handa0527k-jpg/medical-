/**
 * 遺伝医学｜遺伝子の基礎 第6講「エピゲノムとミトコンドリアゲノム」— the whole lecture as one gekiga film (完成版), the last of the unit.
 *
 *   導入      title
 *   全体像    双子（見た目の違い＝環境）→ 70歳以上の双子1826人の研究
 *   テーマ1   遺伝型 → エピゲノム → … → 表現型 → 板書（左）
 *   テーマ2   凝集＝オフ／緩む＝オン → 板書（真ん中：スイッチのしくみ）→ 高メチル化・低メチル化 → 5'-CG-3' とエピジェネティック
 *             → スイッチの動き → 電気のイメージ → 運動とエピゲノム → 板書（運動の例）
 *   テーマ3   ミトコンドリアゲノム → 板書（右：試験ポイント）→ 今日のまとめ
 *   終わり    「遺伝子の基礎」6回の終わり
 *
 * Every spoken line is a cue of narrations/lecture-06.json, verbatim or a contiguous part of it (tests check).
 * Quiz option walk-throughs and the slide-74 lines that the switch animation repeats are left out.
 */
import type { SceneDef } from '../types';
import { beat, board, DARK_BG, endScene, fig, lecture, numbered, same, seg, summaryScene, titleScene, WARM_BG } from './kit';

const S = lecture('genetics-basics', 6);
const W = '全体像', T1 = 'テーマ1　遺伝型から表現型へ', T2 = 'テーマ2　スイッチのしくみ', T3 = 'テーマ3　ミトコンドリアゲノム';
export const FILM6_KEY = 'genetics-basics:6:film';
const D = (s: string) => s.replace(/PGC-1/g, 'ピージーシーワン').replace(/HDAC/g, 'エイチダック').replace(/DNA/g, 'ディーエヌエー').replace(/RNA/g, 'アールエヌエー')
  .replace(/遺伝型/g, 'いでんがた').replace(/表現型/g, 'ひょうげんがた').replace(/具体的/g, '具体てき').replace(/37個/g, 'さんじゅうななこ').replace(/\*\*/g, '').replace(/[「」]/g, '');

const title = () => titleScene({
  no: '第6講', title: ['エピゲノムと', 'ミトコンドリアゲノム'],
  picture: '漆黒に墨が爆ぜ、二重らせんの影が回る。「エピゲノムとミトコンドリアゲノム」の筆文字。単元の最終回。',
  beats: [
    beat('open', S('導入', 'verbatim', ['0001']), [same('第6講、この単元の最終回です。', 'title', { post: 0.3 })]),
    beat('today', S('導入', 'verbatim', ['0002']), [
      same('ここまで、設計図の文字、製本、読み方、そして誤植を見てきました。', 'prev', { post: 0.2 }),
      same('今日は、文字をまったく変えずに、設計図の「読み方」を変える仕組み。', 'what', { post: 0.15 }),
      same('エピゲノムです。', 'epi', { post: 0.5 }),
    ]),
  ],
  subs: [{ text: '文字を変えずに「読み方」を変える', at: 'what', y: 505 }, { text: 'エピゲノム', at: 'epi', y: 552, color: 'y' }],
});

const twins = () => fig('twins', {
  title: '双子：同じゲノムでも見た目が違う',
  picture: '双子を2枚のカードで表す（顔は描かない）。同じ縞模様のゲノムの帯。「見た目の年齢」の目盛りは赤ちゃんでは同じ、大人では一方だけ大きく上がる。片方に「生活・環境」の波が当たる。',
  note: 'スライド68、c06-0009〜0013',
  beats: [
    beat('look', S(W, 'trimmed', ['0009'], { slide: 68 }), [same('まず、この写真を見てください。', 'look', { post: 0.15 })]),
    beat('what', S(W, 'verbatim', ['0010', '0011'], { slide: 68 }), [same('この双子の、何が違うのでしょうか。', 'what', { post: 0.15 }), same('赤ちゃんのときは、そっくりです。', 'baby', { post: 0.2 })]),
    beat('adult', S(W, 'verbatim', ['0012'], { slide: 68 }), [same('ところが大人になると、一方は明らかに年上に見えます。', 'adult', { post: 0.1 }), same('同じ遺伝子を持っているはずなのに。', 'same', { post: 0.25 })]),
    beat('env', S(W, 'verbatim', ['0013'], { slide: 68 }), [same('違いを生んだのは、生活の違い、環境です。', 'env', { post: 0.1 }), same('では、環境はどうやって体を変えるのか。', 'how', { post: 0.1 }), same('それが今日のテーマです。', 'theme', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 300, z: 1.1, note: '双子' },
    { at: 'baby', move: 'push', x: 640, y: 380, z: 1.15, dur: 0.6, note: '見た目の年齢' },
    { at: 'adult', move: 'crash', x: 880, y: 400, z: 1.35, dur: 0.22, hold: 0.3, note: '年上に見える' },
    { at: 'same', move: 'pan', x: 640, y: 200, z: 1.3, dur: 0.5, note: '同じゲノム' },
    { at: 'env', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '環境' },
  ],
  fx: [{ at: 'adult', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'how', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'baby', kind: 'tick' }, { at: 'adult', kind: 'impact', gain: 0.6 }, { at: 'env', kind: 'whoosh', gain: 0.5 }, { at: 'theme', kind: 'boom', gain: 0.5 }],
  shots: [DARK_BG()],
});

const study = () => fig('twin-study', {
  title: '見た目年齢は健康寿命を予見する',
  picture: '「70歳以上の双子 1826人」の札。実年齢・生活習慣で補正しても、見た目年齢から「健康寿命を予見」へ矢印。さらにテロメアの長さ・認知機能とも関連。',
  note: 'スライド69、c06-0014〜0017',
  beats: [
    beat('q', S(W, 'trimmed', ['0014'], { slide: 69 }), [same('実際に、見た目の年齢が健康と関係するのか。', 'q', { post: 0.2 })]),
    beat('n', S(W, 'verbatim', ['0015'], { slide: 69 }), [seg('70歳以上の双子、1826人を調べた研究です。', 'ななじゅっさい以上の双子、せんはっぴゃくにじゅうろくにんを調べた研究です。', 'n', { post: 0.25 })]),
    beat('res', S(W, 'verbatim', ['0016', '0017'], { slide: 69 }), [same('実年齢や生活習慣で補正しても、見た目年齢は健康寿命を予見し、', 'pred', { post: 0.05 }), same('テロメアの長さや認知機能とも関連していました。', 'telo', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 200, z: 1.2, note: '研究' },
    { at: 'pred', move: 'pull', x: 640, y: 380, z: 1.0, dur: 0.5, note: '予見' },
  ],
  fx: [{ at: 'n', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'pred', kind: 'speed', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'n', kind: 'impact', gain: 0.5 }, { at: 'pred', kind: 'whoosh', gain: 0.5 }, { at: 'telo', kind: 'tick' }],
  shots: [DARK_BG()],
});

const omics = () => fig('omics', {
  title: '遺伝型 → エピゲノム → … → 表現型', chapter: T1,
  picture: '5段の箱：ゲノム（DNA）・エピゲノム（DNA・ヒストンの修飾）・トランスクリプトーム（RNA）・プロテオーム（タンパク質）・メタボローム（代謝物）。上が遺伝型、下が表現型。エピゲノムの段が光り、横にメチル化・アセチル化の印。',
  note: 'スライド47、c06-0018〜0021',
  beats: [
    beat('q', S(T1, 'trimmed', ['0018'], { slide: 47 }), [same('では、遺伝子から体までの道のりを、もう一度整理します。', 'q', { post: 0.2 })]),
    beat('g', S(T1, 'verbatim', ['0019'], { slide: 47 }), [same('一番上は、生まれつきのゲノム。', 'genome', { post: 0.1 }), seg('これが遺伝型。', D('これが遺伝型。'), 'geno', { post: 0.2 })]),
    beat('e', S(T1, 'verbatim', ['0020'], { slide: 47 }), [same('その下にエピゲノム。', 'epi', { post: 0.1 }), seg('DNAやヒストンの化学修飾です。', D('DNAやヒストンの化学修飾です。'), 'mod', { post: 0.25 })]),
    beat('p', S(T1, 'verbatim', ['0021'], { slide: 47 }), [seg('一番下の、タンパク質や代謝物が、表現型です。', D('一番下の、タンパク質や代謝物が、表現型です。'), 'pheno', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 340, z: 1.0, note: '5段' },
    { at: 'genome', move: 'push', x: 520, y: 150, z: 1.4, dur: 0.6, note: '遺伝型' },
    { at: 'epi', move: 'pan', x: 780, y: 220, z: 1.35, dur: 0.6, note: 'エピゲノム' },
    { at: 'pheno', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '表現型' },
  ],
  fx: [{ at: 'epi', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'epi', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'genome', kind: 'tick' }, { at: 'epi', kind: 'boom', gain: 0.5 }, { at: 'pheno', kind: 'tick' }],
});

const L = { bx: 90, by: 230, sx: 150, sy: 70, k: 0.62 };
const ax = 150 + (560 - 90) * 0.62, by = (y: number) => 70 + (y - 230) * 0.62;
const leftBoard = () => board({
  title: '板書：遺伝型と表現型の間にエピゲノム', note: '第6講の黒板 l-h・l1〜l7（l2に赤枠）、c06-0022〜0025',
  picture: '黒板の左：ゲノム（DNA）＝遺伝型 → エピゲノム → トランスクリプトーム → プロテオーム → メタボローム＝表現型。エピゲノムを赤で囲む。双子：同じゲノムでも見た目が違う → 違い＝環境 × エピゲノム。',
  beats: [
    beat('w', S(T1, 'verbatim', ['0022', '0023'], { board: ['l-h', 'l1', 'l2', 'l3', 'l4', 'l5'] }), [
      same('左側に、この流れを書いていきます。', 'w', { post: 0.1 }),
      seg('生まれつきのゲノムと、症状に直結する表現型。', D('生まれつきのゲノムと、症状に直結する表現型。'), 'l15', { post: 0.1 }),
      same('その間に、生活環境によって少しずつ変わっていくエピゲノムがある。', 'l2', { post: 0.15 }),
    ]),
    beat('main', S(T1, 'verbatim', ['0024']), [same('ここが今日の主役です。', 'main', { post: 0.25 })]),
    beat('twin', S(T1, 'verbatim', ['0025'], { board: ['l6', 'l7'] }), [same('さっきの双子。', 'twin', { post: 0.05 }), same('同じゲノムでも、環境によってエピゲノムが変わり、見た目が変わる。', 'l7', { post: 0.1 }), same('そう考えることができます。', 'think', { post: 0.45 })]),
  ],
  items: [
    { id: 'l-h', at: 'w' }, { id: 'l1', at: 'l15' }, { id: 'l5', at: 'l15+1.4' }, { id: 'l2', at: 'l2' },
    { id: 'l3', at: 'l2+1.4' }, { id: 'l4', at: 'l2+2' }, { id: 'l6', at: 'twin' }, { id: 'l7', at: 'l7' },
  ],
  map: L,
  arrows: [
    { at: 'l2+0.8', from: [ax, by(415)], to: [ax, by(482)], color: 'w' }, { at: 'l2+1.8', from: [ax, by(552)], to: [ax, by(619)], color: 'w' },
    { at: 'l2+2.2', from: [ax, by(690)], to: [ax, by(756)], color: 'w' }, { at: 'l2+2.6', from: [ax, by(827)], to: [ax, by(893)], color: 'w' },
  ],
  marks: [{ id: 'l2', at: 'main', color: 'r' }],
  cams: [
    { at: 'start', move: 'set', x: 600, y: 330, z: 1.0, note: '板書' },
    { at: 'l2', move: 'push', x: 450, y: 250, z: 1.35, dur: 0.6, note: 'エピゲノム' },
    { at: 'main', move: 'crash', x: 450, y: 250, z: 1.6, dur: 0.22, hold: 0.25, note: '今日の主役' },
    { at: 'twin', move: 'pan', x: 450, y: 560, z: 1.3, dur: 0.5, note: '双子' },
    { at: 'think', move: 'pull', x: 600, y: 330, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'main', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'w', kind: 'chalk', gain: 0.6 }, { at: 'l2', kind: 'chalk', gain: 0.6 }, { at: 'main', kind: 'impact', gain: 0.6 }, { at: 'twin', kind: 'chalk', gain: 0.6 }],
});

const chromatin = () => fig('chromatin', {
  title: '凝集＝転写オフ（ヘテロクロマチン）／緩む＝オン（ユークロマチン）', chapter: T2,
  picture: '左：ぎゅっと固まったヌクレオソームの塊（ヘテロクロマチン、OFF）。右：ほどけたビーズの糸（ユークロマチン、ON）。2つの間を行き来する矢印＝クロマチンリモデリング。',
  note: 'スライド40、c06-0026〜0029',
  beats: [
    beat('q', S(T2, 'trimmed', ['0026'], { slide: 40 }), [seg('では、エピゲノムは、具体的に何をしているのか。', D('では、エピゲノムは、具体的に何をしているのか。'), 'q', { post: 0.2 })]),
    beat('off', S(T2, 'verbatim', ['0027'], { slide: 40 }), [same('ぎゅっと凝集したクロマチンでは、遺伝子の転写がオフ。', 'off', { post: 0.1 }), same('これがヘテロクロマチン。', 'hetero', { post: 0.2 })]),
    beat('on', S(T2, 'verbatim', ['0028'], { slide: 40 }), [same('緩んだクロマチンでは、転写がオン。', 'on', { post: 0.1 }), same('こちらがユークロマチン。', 'eu', { post: 0.2 })]),
    beat('rem', S(T2, 'verbatim', ['0029'], { slide: 40 }), [same('この二つの状態を行き来させるのが、クロマチンリモデリングです。', 'rem', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '2つの状態' },
    { at: 'off', move: 'push', x: 340, y: 380, z: 1.35, dur: 0.6, note: 'オフ' },
    { at: 'on', move: 'whip', x: 950, y: 380, z: 1.35, dur: 0.3, note: 'オン' },
    { at: 'rem', move: 'pull', x: 640, y: 380, z: 1.0, dur: 0.5, note: '行き来' },
  ],
  fx: [{ at: 'off', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'on', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'rem', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'off', kind: 'impact', gain: 0.5 }, { at: 'on', kind: 'whoosh', gain: 0.5 }, { at: 'rem', kind: 'shimmer', gain: 0.4 }],
});

const C = { bx: 1110, by: 230, sx: 150, sy: 70, k: 0.62 };
const switchBoard = () => board({
  title: '板書：スイッチのしくみ（オフ／オン）', note: '第6講の黒板 c-h・nuc・c-off・c1・c2・c-on・c3〜c5、c06-0030〜0033',
  picture: '黒板の真ん中「スイッチのしくみ」：ヌクレオソームの並び。OFF：凝集＝ヘテロクロマチン（DNA高メチル化、ヒストン脱アセチル化）。ON：緩む＝ユークロマチン（ヒストンアセチル化 → 塩基性↓ → DNAとの結合↓ → プロモーター露出 → RNAポリメラーゼ）。',
  beats: [
    beat('w', S(T2, 'verbatim', ['0030', '0031'], { board: ['c-h', 'nuc'] }), [same('真ん中に、スイッチの仕組みを書きます。', 'w', { post: 0.1 }), seg('DNAがヒストンに巻き付いた、ヌクレオソームの並びです。', D('DNAがヒストンに巻き付いた、ヌクレオソームの並びです。'), 'nuc', { post: 0.25 })]),
    beat('off', S(T2, 'verbatim', ['0032'], { board: ['c-off', 'c1', 'c2'] }), [
      same('まずオフの側。', 'off', { post: 0.05 }),
      seg('DNAが高度にメチル化され、', D('DNAが高度にメチル化され、'), 'c1'),
      same('ヒストンのアセチル基が外されると、', 'c2'),
      same('クロマチンが凝集してヘテロクロマチンになり、転写はオフ。', 'offx', { post: 0.3 }),
    ]),
    beat('on', S(T2, 'verbatim', ['0033'], { board: ['c-on', 'c3', 'c4', 'c5'] }), [
      same('そしてオンの側。', 'on', { post: 0.05 }),
      same('ヒストンがアセチル化されると、', 'c3'),
      seg('塩基性が下がってDNAとの結合が弱まる。', D('塩基性が下がってDNAとの結合が弱まる。'), 'c4', { post: 0.1 }),
      seg('プロモーターが露出して、RNAポリメラーゼが結合できるようになります。', D('プロモーターが露出して、RNAポリメラーゼが結合できるようになります。'), 'c5', { post: 0.45 }),
    ]),
  ],
  items: [
    { id: 'c-h', at: 'w' }, { id: 'nuc', at: 'nuc', dur: 1.2 }, { id: 'c-off', at: 'off' }, { id: 'c1', at: 'c1' }, { id: 'c2', at: 'c2' },
    { id: 'c-on', at: 'on' }, { id: 'c3', at: 'c3' }, { id: 'c4', at: 'c4' }, { id: 'c5', at: 'c5' },
  ],
  map: C,
  marks: [{ id: 'c-off', at: 'offx+0.6', color: 'w' }, { id: 'c-on', at: 'c5+1.2', color: 'y' }],
  cams: [
    { at: 'start', move: 'set', x: 600, y: 330, z: 1.0, note: '板書' },
    { at: 'nuc', move: 'push', x: 450, y: 180, z: 1.4, dur: 0.6, note: 'ヌクレオソーム' },
    { at: 'off', move: 'pan', x: 450, y: 320, z: 1.4, dur: 0.5, note: 'オフ' },
    { at: 'on', move: 'pan', x: 450, y: 500, z: 1.35, dur: 0.5, note: 'オン' },
    { at: 'c5+2', move: 'pull', x: 600, y: 330, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'offx', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'c5', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'w', kind: 'chalk', gain: 0.6 }, { at: 'off', kind: 'chalk', gain: 0.6 }, { at: 'on', kind: 'chalk', gain: 0.6 }],
});

const methyl = () => fig('methylation', {
  title: '高メチル化で凝集・発現低下、低メチル化で緩み・発現増加',
  picture: '上：メチル基の印が多いDNA、ヌクレオソームが寄り集まる → 発現↓。下：印が少ないDNA、ヌクレオソームが離れる → 発現↑。',
  note: 'スライド72、c06-0035〜0038',
  beats: [
    beat('hi', S(T2, 'verbatim', ['0035', '0036'], { slide: 72 }), [seg('DNAの高メチル化で、', D('DNAの高メチル化で、'), 'hi'), same('凝集して発現が低下。', 'down', { post: 0.3 })]),
    beat('lo', S(T2, 'verbatim', ['0037', '0038'], { slide: 72 }), [same('低メチル化では、', 'lo'), same('緩んで発現が増加します。', 'up', { post: 0.6 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 230, z: 1.3, note: '高メチル化' },
    { at: 'lo', move: 'pan', x: 640, y: 470, z: 1.3, dur: 0.5, note: '低メチル化' },
    { at: 'up+1', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '比べる' },
  ],
  fx: [{ at: 'down', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'up', kind: 'flash', dur: 0.25, min: 'gekiga' }],
  sfx: [{ at: 'hi', kind: 'tick' }, { at: 'down', kind: 'impact', gain: 0.5 }, { at: 'lo', kind: 'tick' }, { at: 'up', kind: 'shimmer', gain: 0.4 }],
});

const cpg = () => fig('cpg', {
  title: "5'-CG-3' のシトシンは70%以上メチル化、配列は変わらない",
  picture: "塩基の列。CGの並びのシトシンにメチル基の印。5'-CG-3' の C は70%以上。メチル基を認識する複合体がヒストンもメチル化し、ヌクレオソームが強く凝集。塩基配列は一文字も変わらない。ジェネティック（配列が変わる）とエピジェネティック（配列は同じ）のカード。",
  note: 'スライド73、c06-0045〜0049',
  beats: [
    beat('cpg', S(T2, 'trimmed', ['0045', '0046'], { slide: 73 }), [same('メチル化について、もう少し詳しく。', 'more', { post: 0.15 }), seg('発現しない遺伝子のDNAでは、シトシンが高度にメチル化されています。', D('発現しない遺伝子のDNAでは、シトシンが高度にメチル化されています。'), 'cpg', { post: 0.2 })]),
    beat('70', S(T2, 'verbatim', ['0047'], { slide: 73 }), [seg('特に5ダッシュCG3ダッシュの並びでは、70パーセント以上。', '特に、ごダッシュ、シージー、さんダッシュの並びでは、ななじゅっパーセント以上。', 'p70', { post: 0.25 })]),
    beat('cx', S(T2, 'verbatim', ['0048'], { slide: 73 }), [same('それを認識する複合体が、ヒストンもメチル化して、クロマチンを強く凝集させます。', 'complex', { post: 0.25 })]),
    beat('epi', S(T2, 'verbatim', ['0049'], { slide: 73 }), [
      same('そして大事なのが、ここ。', 'imp', { post: 0.1 }), same('塩基配列の変化はありません。', 'nochg', { post: 0.15 }),
      same('だから、突然変異のようなジェネティックな変化に対して、', 'gen'), same('エピジェネティックな変化と呼ぶわけです。', 'epi', { post: 0.5 }),
    ]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 200, z: 1.25, note: '塩基の列' },
    { at: 'p70', move: 'crash', x: 640, y: 220, z: 1.45, dur: 0.22, hold: 0.25, note: '70%以上' },
    { at: 'complex', move: 'pan', x: 640, y: 400, z: 1.2, dur: 0.6, note: '凝集' },
    { at: 'imp', move: 'push', x: 640, y: 230, z: 1.3, dur: 0.4, note: '配列は同じ' },
    { at: 'gen', move: 'pull', x: 640, y: 420, z: 1.0, dur: 0.5, note: 'ジェネティックとエピジェネティック' },
  ],
  fx: [{ at: 'p70', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'imp', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'epi', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'cpg', kind: 'tick' }, { at: 'p70', kind: 'impact', gain: 0.6 }, { at: 'complex', kind: 'whoosh', gain: 0.5 }, { at: 'nochg', kind: 'shimmer', gain: 0.4 }, { at: 'epi', kind: 'boom', gain: 0.6 }],
});

const switchAnim = () => fig('epi-switch', {
  title: 'スイッチの動き：メチル化でオフ、アセチル化でオン、脱アセチル化で再びオフ',
  picture: 'ヌクレオソームの並び（RNAポリメラーゼは近づけない）。DNAにメチル基 → ヒストンもメチル化され、ぎゅっと集まる（ヘテロクロマチン、OFF）。次の場面：転写因子がエンハンサーに結合し、ヒストンアセチル化酵素を呼ぶ → しっぽにアセチル基 → 間が広がりプロモーターが現れる → RNAポリメラーゼが結合しRNAができる（ON）。脱アセチル化酵素がアセチル基を外すと再び凝集（OFF）。',
  note: 'c06-0054〜0060（スライド74の内容を動きで）',
  beats: [
    beat('row', S(T2, 'verbatim', ['0054']), [same('実際の動きで見てみましょう。', 'see', { post: 0.1 }), same('ヌクレオソームが並んでいます。', 'row', { post: 0.1 }), seg('このままでは、RNAポリメラーゼは近づけません。', D('このままでは、RNAポリメラーゼは近づけません。'), 'cant', { post: 0.25 })]),
    beat('me', S(T2, 'verbatim', ['0055']), [seg('DNAのシトシンに、メチル基が付いていきます。', D('DNAのシトシンに、メチル基が付いていきます。'), 'me', { post: 0.3 })]),
    beat('pack', S(T2, 'verbatim', ['0056']), [same('ヒストンもメチル化されて、ヌクレオソームがぎゅっと集まりました。', 'pack', { post: 0.15 }), same('ヘテロクロマチン。', 'hetero', { post: 0.1 }), same('転写はオフです。', 'off', { post: 0.4 })]),
    beat('tf', S(T2, 'verbatim', ['0057']), [same('今度は、転写因子がエンハンサーに結合して、ヒストンアセチル化酵素を呼び込みます。', 'tf', { post: 0.15 }), same('ヒストンのしっぽにアセチル基が付いていきます。', 'ac', { post: 0.3 })]),
    beat('open', S(T2, 'verbatim', ['0058']), [same('ヌクレオソームの間が広がって、プロモーターが現れました。', 'open', { post: 0.15 }), seg('RNAポリメラーゼが結合して、RNAが作られ始めます。', D('RNAポリメラーゼが結合して、RNAが作られ始めます。'), 'pol', { post: 0.1 }), same('転写オンです。', 'on', { post: 0.4 })]),
    beat('hdac', S(T2, 'verbatim', ['0059']), [same('最後に、脱アセチル化酵素がアセチル基を外すと、また凝集して、オフに戻ります。', 'hdac', { post: 0.4 })]),
    beat('sw', S(T2, 'verbatim', ['0060']), [same('スイッチは、入れたり切ったりできる。', 'switch', { post: 0.15 }), same('これがエピゲノムの大きな特徴です。', 'feat', { post: 0.6 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: '並び' },
    { at: 'me', move: 'push', x: 520, y: 330, z: 1.3, dur: 0.6, note: 'メチル基' },
    { at: 'pack', move: 'pan', x: 690, y: 380, z: 1.2, dur: 0.6, note: '凝集' },
    { at: 'tf', move: 'pan', x: 400, y: 300, z: 1.25, dur: 0.6, note: '転写因子とアセチル化酵素' },
    { at: 'open', move: 'pan', x: 760, y: 330, z: 1.2, dur: 0.6, note: 'プロモーター' },
    { at: 'hdac', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '戻る' },
  ],
  fx: [{ at: 'off', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'on', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'on', kind: 'onoma', text: 'パッ', x: 1080, y: 150, dur: 0.9, min: 'gekiga' }, { at: 'switch', kind: 'focus', dur: 1.2, min: 'gekiga' }],
  sfx: [{ at: 'me', kind: 'tick' }, { at: 'pack', kind: 'whoosh', gain: 0.5 }, { at: 'off', kind: 'impact', gain: 0.6 }, { at: 'tf', kind: 'tick' }, { at: 'open', kind: 'whoosh', gain: 0.5 }, { at: 'on', kind: 'shimmer', gain: 0.5 }, { at: 'hdac', kind: 'whoosh', gain: 0.5 }, { at: 'switch', kind: 'boom', gain: 0.6 }],
});

const charge = () => fig('charge', {
  title: '電気のイメージ：ヒストンはプラス、DNAはマイナス',
  picture: 'ヒストン（＋の印）にDNA（−の印）が巻き付き引き合う。アセチル化で＋がAcに置き換わると、DNAが緩んで離れる。「補足のイメージ」と小さく添える。',
  note: 'c06-0068（典型問題の補足）',
  beats: [beat('elec', S(T2, 'verbatim', ['0068']), [
    same('電気の話で考えると分かりやすいです。', 'elec', { post: 0.15 }),
    seg('ヒストンはプラス、DNAはマイナス。', D('ヒストンはプラス、DNAはマイナス。'), 'pm', { post: 0.2 }),
    seg('アセチル化でヒストンのプラスが減ると、DNAを手放す。', D('アセチル化でヒストンのプラスが減ると、DNAを手放す。'), 'release', { post: 0.2 }),
    same('これは補足のイメージですが、覚えやすいと思います。', 'note', { post: 0.45 }),
  ])],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 370, z: 1.2, note: 'ヒストン' },
    { at: 'release', move: 'pull', x: 640, y: 380, z: 1.0, dur: 0.8, note: '手放す' },
  ],
  fx: [{ at: 'pm', kind: 'flash', dur: 0.25, min: 'gekiga' }, { at: 'release', kind: 'speed', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'pm', kind: 'tick' }, { at: 'release', kind: 'whoosh' }],
  shots: [DARK_BG()],
});

const exercise = () => fig('exercise', {
  title: '運動でエピゲノムが変わる：メチル化↓・発現↑、HDACが核の外へ',
  picture: '縞のある筋線維が収縮する。核の中、PGC-1αなど代謝に関わる遺伝子のプロモーターからメチル基の印が外れ、RNAが次々に作られる（発現↑）。収縮のシグナルで、脱アセチル化酵素HDACが核の外へ出ていく。',
  note: 'スライド81・79、c06-0069〜0072',
  beats: [
    beat('q', S(T2, 'trimmed', ['0069'], { slide: 81 }), [same('では、生活でエピゲノムが本当に変わるのか。', 'q', { post: 0.1 }), same('運動の研究を紹介します。', 'study', { post: 0.2 })]),
    beat('meth', S(T2, 'verbatim', ['0070', '0071'], { slide: 81 }), [seg('激しい運動の直後、PGC-1アルファなど代謝に関わる遺伝子のプロモーターのメチル化が下がり、', D('激しい運動の直後、PGC-1アルファなど代謝に関わる遺伝子のプロモーターのメチル化が下がり、'), 'meth', { post: 0.05 }), same('同じ遺伝子の発現が上がっていました。', 'expr', { post: 0.3 })]),
    beat('hdac', S(T2, 'trimmed', ['0072'], { slide: 79 }), [seg('筋肉が収縮するシグナルで、脱アセチル化酵素のHDACが核の外に出ていきます。', D('筋肉が収縮するシグナルで、脱アセチル化酵素のHDACが核の外に出ていきます。'), 'hdac', { post: 0.5 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '筋肉と核' },
    { at: 'study', move: 'push', x: 330, y: 360, z: 1.3, dur: 0.6, note: '運動' },
    { at: 'meth', move: 'pan', x: 880, y: 350, z: 1.3, dur: 0.6, note: 'プロモーター' },
    { at: 'hdac', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: 'HDAC' },
  ],
  fx: [{ at: 'study', kind: 'speed', dur: 0.35, min: 'gekiga' }, { at: 'expr', kind: 'flash', dur: 0.25, min: 'gekiga' }, { at: 'hdac', kind: 'speed', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'study', kind: 'heartbeat' }, { at: 'meth', kind: 'tick' }, { at: 'expr', kind: 'shimmer', gain: 0.4 }, { at: 'hdac', kind: 'whoosh' }],
  shots: [WARM_BG()],
});

const C2 = { bx: 1110, by: 796, sx: 150, sy: 90, k: 0.85 };
const exBoard = () => board({
  title: '板書：運動 → HDACが核外へ、低メチル化 → 発現↑', note: '第6講の黒板 c-on・c3〜c5・c6・c7・c7b（c7bに下線）、c06-0073',
  picture: '黒板の真ん中の下：例：運動→HDACが核外へ／PGC-1αなどのプロモーター／低メチル化→発現↑。',
  beats: [beat('w', S(T2, 'verbatim', ['0073'], { board: ['c6', 'c7', 'c7b'] }), [
    same('黒板に書いておきます。', 'w', { post: 0.1 }),
    same('運動で、脱アセチル化酵素が核の外へ。', 'c6', { post: 0.1 }),
    same('プロモーターのメチル化が下がって、発現が上がる。', 'c7', { post: 0.1 }),
    seg('生活でエピゲノムが変わる、具体的な例です。', D('生活でエピゲノムが変わる、具体的な例です。'), 'ex', { post: 0.45 }),
  ])],
  items: [{ id: 'c-on', at: 'start-1' }, { id: 'c3', at: 'start-1' }, { id: 'c4', at: 'start-1' }, { id: 'c5', at: 'start-1' }, { id: 'c6', at: 'c6' }, { id: 'c7', at: 'c7' }, { id: 'c7b', at: 'c7+1.4' }],
  map: C2,
  marks: [{ id: 'c7b', at: 'ex', color: 'y', kind: 'under' }],
  cams: [{ at: 'start', move: 'set', x: 600, y: 340, z: 1.0, note: '板書' }, { at: 'c6', move: 'push', x: 520, y: 470, z: 1.35, dur: 0.5, note: '運動の例' }],
  fx: [{ at: 'ex', kind: 'focus', dur: 0.9, min: 'gekiga' }],
  sfx: [{ at: 'c6', kind: 'chalk', gain: 0.6 }, { at: 'c7', kind: 'chalk', gain: 0.6 }],
});

const mtdna = () => fig('mtdna', {
  title: 'ミトコンドリアゲノム：多コピー・37遺伝子・母系遺伝', chapter: T3,
  picture: '1つの細胞。核には父と母から1セットずつ。細胞質にはミトコンドリアが多数、それぞれに小さな環状DNA（細胞あたり10³〜10⁴コピー）。環状DNAの拡大：遺伝子37個（呼吸鎖の部品など）。核からミトコンドリアへタンパク質が運ばれる（大部分は核の遺伝子の産物）。家系図の記号だけで母系遺伝。',
  note: 'スライド82、c06-0079〜0083',
  beats: [
    beat('q', S(T3, 'trimmed', ['0079'], { slide: 82 }), [same('最後に、核とは別のゲノムの話です。', 'q', { post: 0.2 })]),
    beat('copy', S(T3, 'verbatim', ['0080'], { slide: 82 }), [
      seg('核のゲノムは両親から1セットずつですが、', '核のゲノムは両親からひとセットずつですが、', 'nuc', { post: 0.05 }),
      seg('ミトコンドリアのゲノムは、細胞あたり10の3乗から10の4乗コピーもあります。', 'ミトコンドリアのゲノムは、細胞あたり、じゅうのさんじょうから、じゅうのよんじょうコピーもあります。', 'copy', { post: 0.25 }),
    ]),
    beat('g37', S(T3, 'verbatim', ['0081'], { slide: 82 }), [seg('遺伝子は37個。', D('遺伝子は37個。'), 'g37', { post: 0.1 }), same('呼吸鎖の部品などです。', 'resp', { post: 0.25 })]),
    beat('imp', S(T3, 'verbatim', ['0082'], { slide: 82 }), [same('ミトコンドリアの中のタンパク質の大部分は、実は核の遺伝子の産物。', 'import', { post: 0.25 })]),
    beat('mat', S(T3, 'verbatim', ['0083'], { slide: 82 }), [same('そして、ミトコンドリアの遺伝子の変異は、母系遺伝を示します。', 'mat', { post: 0.5 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 370, z: 1.0, note: '細胞' },
    { at: 'nuc', move: 'push', x: 360, y: 380, z: 1.35, dur: 0.6, note: '核' },
    { at: 'copy', move: 'pan', x: 850, y: 300, z: 1.2, dur: 0.6, note: '多コピー' },
    { at: 'g37', move: 'push', x: 1020, y: 220, z: 1.45, dur: 0.5, note: '37個' },
    { at: 'import', move: 'pull', x: 640, y: 380, z: 1.0, dur: 0.5, note: '核から運ばれる' },
    { at: 'mat', move: 'pan', x: 640, y: 520, z: 1.15, dur: 0.5, note: '母系遺伝' },
  ],
  fx: [{ at: 'copy', kind: 'flash', dur: 0.25, min: 'gekiga' }, { at: 'g37', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'mat', kind: 'impact', dur: 0.45, min: 'gekiga' }],
  sfx: [{ at: 'nuc', kind: 'tick' }, { at: 'copy', kind: 'shimmer', gain: 0.5 }, { at: 'g37', kind: 'impact', gain: 0.6 }, { at: 'import', kind: 'whoosh', gain: 0.5 }, { at: 'mat', kind: 'boom', gain: 0.6 }],
  shots: [WARM_BG()],
});

const R = { bx: 2190, by: 230, sx: 140, sy: 60, k: 0.7 };
const pointBoard = () => board({
  title: '板書：試験ポイント（向きを取り違えない）', note: '第6講の黒板 r-h・r1〜r4（r2・r3に赤枠）・m-h・m1〜m3（m2に下線）、c06-0084〜0086',
  picture: '黒板の右「試験ポイント」：エピ＝塩基配列の変化なし／高メチル化・脱アセチル化→OFF／アセチル化→塩基性↓→ON／5\'-CG-3\' のCは70%以上メチル化。「ミトコンドリアゲノム」：遺伝子37個・10³〜10⁴コピー/細胞／変異は母系遺伝／中のタンパク質の大部分は核遺伝子。',
  beats: [
    beat('w', S(T3, 'verbatim', ['0084'], { board: ['r-h'] }), [same('右側に、今日の試験ポイントをまとめます。', 'w', { post: 0.15 })]),
    beat('r', S(T3, 'verbatim', ['0085'], { board: ['r1', 'r2', 'r3', 'r4'] }), [same('エピジェネティックは、配列が変わらない。', 'r1', { post: 0.1 }), same('メチル化はオフ、アセチル化はオン。', 'r23', { post: 0.1 }), same('向きを絶対に取り違えないでください。', 'warn', { post: 0.3 })]),
    beat('m', S(T3, 'verbatim', ['0086'], { board: ['m-h', 'm1', 'm2', 'm3'] }), [seg('ミトコンドリアは、37個の遺伝子、たくさんのコピー、母系遺伝。', D('ミトコンドリアは、37個の遺伝子、たくさんのコピー、母系遺伝。'), 'm1', { post: 0.1 }), same('そして、中のタンパク質の大部分は核の遺伝子から。', 'm3', { post: 0.45 })]),
  ],
  items: [
    { id: 'r-h', at: 'w' }, { id: 'r1', at: 'r1' }, { id: 'r2', at: 'r23' }, { id: 'r3', at: 'r23+0.9' }, { id: 'r4', at: 'warn+0.6' },
    { id: 'm-h', at: 'm1' }, { id: 'm1', at: 'm1+0.4' }, { id: 'm2', at: 'm1+1.6' }, { id: 'm3', at: 'm3' },
  ],
  map: R,
  marks: [{ id: 'r2', at: 'warn', color: 'r' }, { id: 'r3', at: 'warn+0.3', color: 'r' }, { id: 'm2', at: 'm3+1.6', color: 'y', kind: 'under' }],
  cams: [
    { at: 'start', move: 'set', x: 600, y: 330, z: 1.0, note: '板書' },
    { at: 'r1', move: 'push', x: 470, y: 200, z: 1.35, dur: 0.5, note: '配列は変わらない' },
    { at: 'warn', move: 'crash', x: 470, y: 230, z: 1.55, dur: 0.22, hold: 0.25, note: '向き' },
    { at: 'm1', move: 'pan', x: 470, y: 480, z: 1.35, dur: 0.5, note: 'ミトコンドリア' },
    { at: 'm3+1.2', move: 'pull', x: 600, y: 330, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'warn', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'w', kind: 'chalk', gain: 0.6 }, { at: 'r1', kind: 'chalk', gain: 0.6 }, { at: 'warn', kind: 'impact', gain: 0.6 }, { at: 'm1', kind: 'chalk', gain: 0.6 }],
});

const summary = () => summaryScene({
  note: '第6講の黒板 sum-h・s1〜s4、c06-0092〜0096',
  beats: [
    beat('four', S(T3, 'verbatim', ['0092'], { board: ['sum-h'] }), [same('今日覚えてほしいのは、この4つです。', 'four', { post: 0.3 })]),
    beat('p1', S(T3, 'verbatim', ['0093'], { board: ['s1'] }), [same('ひとつ目。', 'p1', { post: 0.1 }), seg('遺伝型と表現型の間にあるエピゲノム。', D('遺伝型と表現型の間にあるエピゲノム。'), 'p1b', { post: 0.1 }), same('塩基配列を変えずに、遺伝子の働きを変えます。', 'p1c', { post: 0.3 })]),
    beat('p2', S(T3, 'verbatim', ['0094'], { board: ['s2'] }), [same('ふたつ目。', 'p2', { post: 0.1 }), same('高メチル化と脱アセチル化で凝集してオフ。', 'p2b', { post: 0.1 }), same('アセチル化で緩んでオン。', 'p2c', { post: 0.3 })]),
    beat('p3', S(T3, 'verbatim', ['0095'], { board: ['s3'] }), [same('みっつ目。', 'p3', { post: 0.1 }), same('エピゲノムは、運動などの生活で変わりうる。', 'p3b', { post: 0.3 })]),
    beat('p4', S(T3, 'verbatim', ['0096'], { board: ['s4'] }), [same('そして、ミトコンドリアのゲノムは、', 'p4'), seg('37個の遺伝子、多コピー、母系遺伝。', D('37個の遺伝子、多コピー、母系遺伝。'), 'p4b', { post: 0.45 })]),
  ],
  marks: [{ id: 's1', at: 'p1c+1', color: 'y' }, { id: 's2', at: 'p2c+1', color: 'r' }, { id: 's3', at: 'p3b+1', color: 'y' }, { id: 's4', at: 'p4b+1', color: 'y' }],
  endAt: 'p4b+1.6',
});

const end = () => {
  const s = endScene({
    no: '第6講　終', picture: '「第6講 終」の判。「遺伝子の基礎 全6回」「おつかれさまでした」。ミトコンドリアの絵。黒にフェードアウト。', note: 'c06-0097・0106',
    beats: [
      beat('next', S('まとめ', 'trimmed', ['0097']), [seg('これで「遺伝子の基礎」の6回がすべて終わりです。', 'これで遺伝子の基礎のろっかいがすべて終わりです。', 'next', { post: 0.4 })]),
      beat('bye', S('本番問題', 'verbatim', ['0106']), [same('第6講、そして遺伝子の基礎の授業は、これで終わりです。', 'bye', { post: 1.4 })]),
    ],
    l1: '遺伝子の基礎　全6回', l1At: 'next', l2: 'おつかれさまでした', l2At: 'bye', pic: 'mito',
  });
  s.title = '終わり：遺伝子の基礎 全6回';
  return s;
};

/** the whole of 第6講, in lecture order */
export function lecture6Film(): SceneDef[] {
  return numbered([title(), twins(), study(), omics(), leftBoard(), chromatin(), switchBoard(), methyl(), cpg(), switchAnim(), charge(), exercise(), exBoard(), mtdna(), pointBoard(), summary(), end()]);
}

export const FILM6_RATIONALE = [
  '第6講「エピゲノムとミトコンドリアゲノム」を、講義の順（導入 → 全体像 → テーマ1〜3 → まとめ）に1本の劇画授業映像にした完成版。確認問題・典型問題・本番問題の選択肢の解説と、スイッチの動きと重なるスライド74の説明は省いた。',
  '台詞はすべて第6講の講義台詞（narrations/lecture-06.json）の原文、またはその一部。板書は講義の黒板の文字をそのまま使う。',
  '医学図：遺伝型→エピゲノム→表現型、凝集（ヘテロクロマチン・オフ）と緩み（ユークロマチン・オン）、高メチル化／低メチル化、5\'-CG-3\' のシトシン（70%以上）、アセチル化で塩基性↓・プロモーター露出、運動で低メチル化・HDACが核外へ、ミトコンドリアゲノム（10³〜10⁴コピー・37遺伝子・大部分のタンパク質は核遺伝子・母系遺伝）。双子は抽象的なカードと目盛りで表し、人物の顔は描かない。',
];
