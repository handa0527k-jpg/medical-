/**
 * 遺伝医学｜遺伝子の基礎 第3講「染色体 ― DNAの収納と数の異常」— the whole lecture as one gekiga film (完成版).
 *
 *   導入      title → DNA → ヌクレオソーム → クロマチン → 染色体
 *   テーマ1   板書 2・11・1400 nm → 収納の実際（裸のDNA → ヒストンに巻き付く → スペーサーとH1 → クロマチン → 染色体）
 *             → コアヒストン八量体とH1 → 板書「H1はコアではない」→ ヒストンの化学修飾（第6講への伏線）
 *   テーマ2   核型 46,XY → 板書 染色体の形 → メタ／アクロ／テロセントリック → 板書「テロセントリックはヒトにない」
 *   テーマ3   二倍体と一倍体 → 板書 減数分裂 → 減数分裂の動き（21番1対）→ 第1分裂の不分離 → 板書 → 加齢と不分離 → 板書 試験ポイント
 *   テーマ4   モノ／トリ／テトラソミー → 板書 生まれてくるトリソミー → 染色体ごとの遺伝子数
 *   まとめ    今日覚えてほしい4つ → 次回予告（第4講：遺伝子の構造）
 *
 * Every spoken line is a cue of narrations/lecture-03.json, verbatim or a contiguous part of it (tests check).
 */
import type { SceneDef } from '../types';
import { beat, board, DARK_BG, endScene, fig, lecture, numbered, same, seg, summaryScene, titleScene, WARM_BG } from './kit';

const S = lecture('genetics-basics', 3);
const T1 = 'テーマ1　収納の階層', T2 = 'テーマ2　染色体の数と形', T3 = 'テーマ3　減数分裂と不分離', T4 = 'テーマ4　数的異常と遺伝子数';
export const FILM3_KEY = 'genetics-basics:3:film';

const title = () => titleScene({
  no: '第3講', title: ['染色体 ―', 'DNAの収納と数の異常'],
  picture: '漆黒に墨が爆ぜ、二重らせんの影が回る。「染色体 ― DNAの収納と数の異常」の筆文字。',
  beats: [
    beat('open', S('導入', 'verbatim', ['0001']), [same('第3講を始めます。', 'title', { post: 0.2 }), seg('前回は、DNAが何でできているのかを見ました。', '前回は、ディーエヌエーが何でできているのかを見ました。', 'prev', { post: 0.3 })]),
    beat('today', S('導入', 'verbatim', ['0002']), [
      seg('今日は、その長いDNAを、細胞がどうやって片付けているのか。', '今日は、その長いディーエヌエーを、細胞がどうやって片付けているのか。', 'tidy', { post: 0.15 }),
      same('そして、片付け方や配り方を間違えると何が起こるのか。', 'wrong', { post: 0.15 }),
      same('**染色体**の話です。', 'chr', { post: 0.5 }),
    ]),
  ],
  subs: [{ text: '長いDNAをどう片付ける？', at: 'tidy', y: 505 }, { text: '片付け方・配り方を間違えると？', at: 'wrong', y: 552, color: 'y' }],
});

const packStrip = () => fig('pack-strip', {
  title: 'DNA → ヌクレオソーム → クロマチン → 染色体',
  picture: '4つのコマが左から順に灯る：裸のDNA → ヒストンに巻き付いたヌクレオソーム（数珠）→ 折りたたまれたクロマチン → 分裂期の染色体。',
  note: 'スライド25、c03-0010〜0013',
  beats: [beat('flow', S('全体像', 'verbatim', ['0010', '0011', '0012', '0013'], { slide: 25 }), [
    seg('DNAが、', 'ディーエヌエーが、', 'dna'),
    same('**ヒストン**に巻き付いて**ヌクレオソーム**になり、', 'nuc'),
    same('折りたたまれて**クロマチン**、', 'chrom'),
    same('分裂のときには**染色体**になります。', 'chr', { post: 0.45 }),
  ])],
  cams: [
    { at: 'start', move: 'set', x: 200, y: 340, z: 1.5, note: 'DNAのコマ' },
    { at: 'nuc', move: 'whip', x: 480, y: 340, z: 1.4, dur: 0.3, note: 'ヌクレオソームへ' },
    { at: 'chrom', move: 'whip', x: 800, y: 340, z: 1.4, dur: 0.3, note: 'クロマチンへ' },
    { at: 'chr', move: 'pull', x: 640, y: 350, z: 1.0, dur: 0.45, note: '4つを並べる' },
  ],
  fx: [{ at: 'nuc', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'chrom', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'chr', kind: 'impact', dur: 0.45, min: 'gekiga' }],
  sfx: [{ at: 'dna', kind: 'shimmer', gain: 0.4 }, { at: 'nuc', kind: 'whoosh', gain: 0.5 }, { at: 'chrom', kind: 'whoosh', gain: 0.5 }, { at: 'chr', kind: 'impact' }],
});

const L = { bx: 90, by: 230, sx: 150, sy: 70, k: 0.62 };
const levelsBoard = () => board({
  title: '収納の階層：2・11・1400 nm', chapter: T1, note: '第3講の黒板 l-h・l1〜l4（矢印は板書のとおり）、c03-0015・0016',
  picture: '黒板の左に「収納の階層」：DNA（2 nm）→ヌクレオソーム（11 nm）→クロマチン→染色体（1400 nm）。数字を言うたびにその行へ寄る。',
  beats: [
    beat('nums', S(T1, 'verbatim', ['0015'], { board: ['l1', 'l2', 'l3', 'l4'] }), [
      seg('DNAは**2ナノメートル**。', 'ディーエヌエーはにナノメートル。', 'd2', { post: 0.15 }),
      seg('ヌクレオソームで**11ナノメートル**。', 'ヌクレオソームでじゅういちナノメートル。', 'n11', { post: 0.15 }),
      seg('そしてクロマチンを経て、分裂期の染色体は**1400ナノメートル**。', 'そしてクロマチンを経て、分裂期の染色体はせんよんひゃくナノメートル。', 'c1400', { post: 0.3 }),
    ]),
    beat('memo', S(T1, 'verbatim', ['0016']), [same('数字も一緒に覚えておくと、図の問題で迷いません。', 'memo', { post: 0.4 })]),
  ],
  items: [{ id: 'l-h', at: 'start' }, { id: 'l1', at: 'd2' }, { id: 'l2', at: 'n11' }, { id: 'l3', at: 'c1400' }, { id: 'l4', at: 'c1400+1.4' }],
  arrows: [{ at: 'n11-0.3', from: [441, 190], to: [441, 226], color: 'w' }, { at: 'c1400-0.3', from: [441, 272], to: [441, 310], color: 'w' }, { at: 'c1400+1.1', from: [441, 357], to: [441, 396], color: 'w' }],
  marks: [{ id: 'l2', at: 'n11+0.8', color: 'y' }],
  map: L,
  cams: [
    { at: 'start', move: 'set', x: 560, y: 300, z: 1.0, note: '黒板の左' },
    { at: 'd2', move: 'push', x: 440, y: 160, z: 1.6, dur: 0.5, note: 'DNA 2 nm' },
    { at: 'n11', move: 'pan', x: 440, y: 245, z: 1.6, dur: 0.4, note: '11 nm' },
    { at: 'c1400', move: 'pan', x: 440, y: 380, z: 1.5, dur: 0.6, note: '1400 nm' },
    { at: 'memo', move: 'pull', x: 560, y: 300, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'c1400+1.4', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'd2', kind: 'chalk', gain: 0.5 }, { at: 'n11', kind: 'chalk', gain: 0.5 }, { at: 'c1400', kind: 'chalk', gain: 0.5 }, { at: 'c1400+1.4', kind: 'impact', gain: 0.5 }],
});

const packing = () => fig('packing', {
  title: '収納の実際：2 nm → ヌクレオソーム → クロマチン → 1400 nm',
  picture: '裸のDNA（直径2 nm）が、ヒストンの塊（コア）に約1.7周巻き付いてヌクレオソームに。数珠のつなぎ（スペーサー）にH1が付く。数珠がさらに折りたたまれてクロマチン、分裂期には幅約1400 nmの染色体へ凝縮する。',
  note: 'c03-0017〜0022。1つのコアに約140塩基対、スペーサーにH1',
  beats: [
    beat('naked', S(T1, 'verbatim', ['0017']), [
      same('実際にどれくらい小さくたたまれているのか、見てみましょう。', 'look', { post: 0.15 }),
      seg('まずは裸のDNA。', 'まずは裸のディーエヌエー。', 'naked', { post: 0.1 }),
      seg('直径わずか**2ナノメートル**です。', '直径わずかにナノメートルです。', 'd2', { post: 0.3 }),
    ]),
    beat('wrap', S(T1, 'verbatim', ['0018']), [same('これが、**ヒストン**の塊に巻き付いていきます。', 'wrap', { post: 0.25 })]),
    beat('nuc', S(T1, 'verbatim', ['0019']), [
      seg('一つのコアに約140塩基対が巻き付いて、**ヌクレオソーム**になります。', '一つのコアに約ひゃくよんじゅう塩基対が巻き付いて、ヌクレオソームになります。', 'nuc', { post: 0.15 }),
      same('つなぎの部分が**スペーサー**。', 'spacer', { post: 0.1 }),
      seg('ここに**H1**が結合します。', 'ここにエイチワンが結合します。', 'h1', { post: 0.3 }),
    ]),
    beat('fold', S(T1, 'verbatim', ['0020']), [same('ヌクレオソームの連なりが、さらに折りたたまれて**クロマチン**に。', 'fold', { post: 0.25 })]),
    beat('chr', S(T1, 'verbatim', ['0021']), [seg('分裂期には、ここまで凝縮して、幅約1400ナノメートルの**染色体**になります。', '分裂期には、ここまで凝縮して、幅約せんよんひゃくナノメートルの染色体になります。', 'chr', { post: 0.3 })]),
    beat('end', S(T1, 'verbatim', ['0022']), [same('細い糸が、何段階にも折りたたまれて、ようやく目に見える形になるわけです。', 'end', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 360, z: 1.3, note: '裸のDNAの大写し' },
    { at: 'd2', move: 'push', x: 640, y: 360, z: 1.5, dur: 0.6, note: '2 nm' },
    { at: 'wrap', move: 'pull', x: 640, y: 360, z: 1.1, dur: 0.6, note: 'コアに巻き付く' },
    { at: 'nuc', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '数珠' },
    { at: 'h1', move: 'push', x: 560, y: 380, z: 1.5, dur: 0.4, note: 'H1へ' },
    { at: 'fold', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '折りたたみ' },
    { at: 'chr', move: 'crash', x: 640, y: 360, z: 1.12, dur: 0.22, hold: 0.25, note: '染色体で急接近' },
    { at: 'end', move: 'pull', x: 640, y: 360, z: 1.0, dur: 1.0, note: '引く' },
  ],
  fx: [{ at: 'wrap', kind: 'speed', dur: 0.4, min: 'ultra' }, { at: 'nuc', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'h1', kind: 'focus', dur: 0.9, min: 'gekiga' }, { at: 'chr', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'chr', kind: 'onoma', text: 'ギュッ', x: 1090, y: 160, dur: 0.9, min: 'ultra' }],
  sfx: [{ at: 'naked', kind: 'shimmer', gain: 0.4 }, { at: 'wrap', kind: 'whoosh', gain: 0.5 }, { at: 'nuc', kind: 'impact', gain: 0.6 }, { at: 'h1', kind: 'tick' }, { at: 'fold', kind: 'whoosh' }, { at: 'chr', kind: 'boom', gain: 0.7 }],
});

const octamer = () => fig('octamer', {
  title: 'コアヒストン八量体とH1',
  picture: 'ヌクレオソームの大写し。コアは H2A・H2B・H3・H4 が2個ずつの8個の玉（八量体）で、DNAが外側を約1.7周。コアとコアのつなぎ（スペーサー）のDNAに、別の黄色い玉 H1 が付く。',
  note: 'スライド39、c03-0023・0024。コアヒストン H2A・H2B・H3・H4 各2個、H1はスペーサーでDNAと結合',
  beats: [
    beat('core', S(T1, 'verbatim', ['0023'], { slide: 39, board: ['h1', 'h1b'] }), [
      same('ヒストンを整理します。', 'sort', { post: 0.1 }),
      seg('コアになるのは、H2A、H2B、H3、H4が2個ずつ。', 'コアになるのは、エイチツーエー、エイチツービー、エイチスリー、エイチフォーが2個ずつ。', 'core', { post: 0.15 }),
      seg('合わせて**八量体**です。', '合わせてはちりょうたいです。', 'oct', { post: 0.3 }),
    ]),
    beat('h1', S(T1, 'verbatim', ['0024'], { slide: 39, board: ['h2'] }), [seg('H1だけは、コアではなく、ヌクレオソームの間のスペーサーのところでDNAと結合しています。', 'エイチワンだけは、コアではなく、ヌクレオソームの間のスペーサーのところでディーエヌエーと結合しています。', 'h1', { post: 0.4 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 600, y: 360, z: 1.05, note: 'ヌクレオソーム' },
    { at: 'core', move: 'push', x: 600, y: 360, z: 1.2, dur: 2.0, note: '8個の玉' },
    { at: 'oct', move: 'crash', x: 560, y: 340, z: 1.3, dur: 0.22, hold: 0.25, note: '「八量体」' },
    { at: 'h1', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.6, note: 'スペーサーとH1' },
  ],
  fx: [{ at: 'oct', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'oct', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'h1+1.5', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'core', kind: 'tick' }, { at: 'core+0.5', kind: 'tick' }, { at: 'core+1.0', kind: 'tick' }, { at: 'core+1.5', kind: 'tick' }, { at: 'oct', kind: 'boom', gain: 0.6 }, { at: 'h1', kind: 'whoosh', gain: 0.5 }],
});

const histoneBoard = () => board({
  title: 'H1はコアではない', note: '第3講の黒板 h-h・h1・h1b・h2（下線）、c03-0025',
  picture: '黒板の左下「ヒストン」：コア＝H2A・H2B・H3・H4 各2個 → 八量体（約140塩基対が巻き付く）、H1 … スペーサーでDNAと結合。H1の行に下線、「H1はコアではない」の筆文字。',
  beats: [beat('line', S(T1, 'verbatim', ['0025'], { board: ['h2'] }), [
    same('ここに線を引いておきます。', 'line', { post: 0.1 }),
    seg('**H1はコアではない**。', 'エイチワンはコアではない。', 'rule', { pre: 0.15, post: 0.2 }),
    same('これがよく問われます。', 'often', { post: 0.4 }),
  ])],
  items: [{ id: 'h-h', at: 'start-1' }, { id: 'h1', at: 'start-1' }, { id: 'h1b', at: 'start-1' }, { id: 'h2', at: 'start-1' }],
  marks: [{ id: 'h2', at: 'line+0.3', color: 'y', kind: 'under' }],
  slams: [{ text: 'H1はコアではない', at: 'rule', x: 640, y: 470, size: 68, color: '#ff6a55', band: true }],
  map: { bx: 90, by: 856, sx: 150, sy: 110, k: 0.85 },
  cams: [{ at: 'start', move: 'set', x: 560, y: 260, z: 1.05, note: 'ヒストンの板書' }, { at: 'line', move: 'push', x: 480, y: 340, z: 1.4, dur: 0.6, note: 'H1の行' }, { at: 'rule', move: 'crash', x: 640, y: 380, z: 1.1, dur: 0.2, hold: 0.3, note: '「H1はコアではない」' }],
  fx: [{ at: 'rule', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'rule', kind: 'shake', dur: 0.3, min: 'gekiga' }, { at: 'rule', kind: 'onoma', text: 'ドンッ', x: 1080, y: 150, dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'line', kind: 'chalk', gain: 0.7 }, { at: 'rule', kind: 'boom' }],
});

const histmod = () => fig('histmod', {
  title: 'ヒストンの化学修飾 → 遺伝子発現の制御（第6講へ）',
  picture: 'ヌクレオソームのヒストンから尾が伸び、そこに小さな印（化学修飾）が付く。印の付き方が違う2つの細胞で、同じ遺伝子のスイッチが点いたり消えたりする。最後に「第6講 エピゲノム」の札。',
  note: 'スライド39、c03-0027・0028',
  beats: [
    beat('mod', S(T1, 'trimmed', ['0027'], { slide: 39 }), [same('ヒストンは**化学修飾**を受けて、ヌクレオソームの性質を変えます。', 'mod', { post: 0.25 })]),
    beat('cell', S(T1, 'verbatim', ['0028'], { slide: 39 }), [
      same('この修飾が細胞ごとに違い、遺伝子発現の制御に関わる。', 'cell', { post: 0.15 }),
      same('第6講の**エピゲノム**につながる、大事な伏線です。', 'epi', { post: 0.45 }),
    ]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 340, z: 1.2, note: 'ヒストンの尾' },
    { at: 'mod', move: 'push', x: 640, y: 320, z: 1.35, dur: 2.0, note: '印が付く' },
    { at: 'cell', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '2つの細胞' },
    { at: 'epi', move: 'crash', x: 640, y: 380, z: 1.1, dur: 0.22, hold: 0.25, note: '第6講へ' },
  ],
  fx: [{ at: 'epi', kind: 'flash', dur: 0.3, min: 'gekiga' }, { at: 'epi', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'mod', kind: 'tick' }, { at: 'mod+0.6', kind: 'tick' }, { at: 'mod+1.2', kind: 'tick' }, { at: 'cell', kind: 'whoosh', gain: 0.5 }, { at: 'epi', kind: 'shimmer' }],
});

const karyotype = () => fig('karyotype', {
  title: '核型：46,XY', chapter: T2,
  picture: 'G分染法で縞模様に染まった染色体が、長い順に1〜22番、最後にXとYが並ぶ（正常男性の核型、模式図）。「46,XY」の判。',
  note: 'スライド26、c03-0035・0036。相対的な長さとセントロメアの位置はおおよそ（模式図）',
  beats: [
    beat('band', S(T2, 'verbatim', ['0035'], { slide: 26 }), [
      seg('G分染法で染めて並べたものが**核型**。', 'ジー分染法で染めて並べたものがかくがた。', 'band', { post: 0.15 }),
      seg('正常な男性は46,XYと書きます。', '正常な男性はよんじゅうろく、エックスワイと書きます。', 'xy', { post: 0.25 }),
    ]),
    beat('n', S(T2, 'verbatim', ['0036'], { slide: 26 }), [same('ヒトは**46本**。', 'n46', { post: 0.1 }), same('長い方から1番から22番、残りの2本が性染色体です。', 'order', { post: 0.4 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: '核型の全景' },
    { at: 'band', move: 'push', x: 330, y: 160, z: 1.6, dur: 1.5, note: '縞模様' },
    { at: 'xy', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '全体' },
    { at: 'order', move: 'push', x: 960, y: 520, z: 1.4, dur: 1.2, note: '性染色体' },
  ],
  fx: [{ at: 'xy', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'n46', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'band', kind: 'shimmer', gain: 0.4 }, { at: 'xy', kind: 'impact' }, { at: 'order', kind: 'tick' }],
  shots: [DARK_BG('暗い背景に、顕微鏡の視野のような柔らかい光。')],
});

const C = { bx: 1120, by: 230, sx: 150, sy: 60, k: 0.9 };
const shapeBoard = () => board({
  title: '染色体の形：セントロメア・短腕p・長腕q・テロメア', note: '第3講の黒板 c-h・chr・c1〜c2、c03-0038・0039',
  picture: '黒板の真ん中に分裂期のX字形の染色体を描き、くびれ＝セントロメア、上の短腕p、下の長腕q、末端＝テロメアを書き込む。横に「46本／常染色体22対／＋XY・XX／長い順に1〜22番」。',
  beats: [
    beat('x', S(T2, 'verbatim', ['0038'], { board: ['chr'] }), [
      seg('分裂期の染色体は、こういうX字形です。', '分裂期の染色体は、こういうエックス字形です。', 'x', { post: 0.15 }),
      same('くびれたところが**セントロメア**。', 'cen', { post: 0.1 }),
      seg('上の短い腕が**短腕p**、', '上の短い腕がたんわんピー、', 'p'),
      seg('下の長い腕が**長腕q**。', '下の長い腕がちょうわんキュー。', 'q', { post: 0.1 }),
      same('末端が**テロメア**です。', 'tel', { post: 0.3 }),
    ]),
    beat('n', S(T2, 'verbatim', ['0039'], { board: ['c1', 'c1b', 'c1c', 'c2'] }), [same('ヒトは46本。', 'n46', { post: 0.1 }), same('常染色体22対と、性染色体。', 'auto', { post: 0.1 }), same('番号は長さの順です。', 'len', { post: 0.4 })]),
  ],
  items: [{ id: 'c-h', at: 'start' }, { id: 'chr', at: 'x', dur: 4 }, { id: 'c1', at: 'n46' }, { id: 'c1b', at: 'auto' }, { id: 'c1c', at: 'auto+1' }, { id: 'c2', at: 'len' }],
  map: C, lecturerX: 1170,
  cams: [
    { at: 'start', move: 'set', x: 560, y: 320, z: 1.0, note: '黒板の真ん中' },
    { at: 'cen', move: 'push', x: 400, y: 300, z: 1.5, dur: 0.5, note: 'セントロメア' },
    { at: 'p', move: 'pan', x: 400, y: 240, z: 1.5, dur: 0.4, note: '短腕p' },
    { at: 'q', move: 'pan', x: 400, y: 380, z: 1.5, dur: 0.4, note: '長腕q' },
    { at: 'tel', move: 'pan', x: 400, y: 470, z: 1.5, dur: 0.4, note: 'テロメア' },
    { at: 'n46', move: 'pull', x: 640, y: 320, z: 1.0, dur: 0.5, note: '46本' },
  ],
  fx: [{ at: 'cen', kind: 'focus', dur: 0.8, min: 'gekiga' }, { at: 'n46', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'x', kind: 'chalk', gain: 0.6 }, { at: 'cen', kind: 'tick' }, { at: 'p', kind: 'tick' }, { at: 'q', kind: 'tick' }, { at: 'tel', kind: 'tick' }, { at: 'n46', kind: 'chalk', gain: 0.5 }],
});

const centromere = () => fig('centromere', {
  title: 'メタ／アクロ／テロセントリック',
  picture: '3本の染色体が並ぶ。セントロメアが真ん中＝メタセントリック（1・3・16・19・20番）、端に近い＝アクロセントリック（13・14・15・21・22番・Y）、完全に端＝テロセントリック。最後のテロセントリックに赤い✕「ヒトにない」。',
  note: 'スライド28、c03-0040〜0043',
  beats: [
    beat('class', S(T2, 'trimmed', ['0040'], { slide: 28 }), [same('セントロメアの位置で、形が分類されます。', 'class', { post: 0.2 })]),
    beat('meta', S(T2, 'verbatim', ['0041'], { slide: 28 }), [same('セントロメアが真ん中にあるのが**メタセントリック**。', 'meta', { post: 0.1 }), same('ヒトでは1、3、16、19、20番。', 'metaN', { post: 0.25 })]),
    beat('acro', S(T2, 'verbatim', ['0042'], { slide: 28 }), [same('セントロメアが端に近いのが**アクロセントリック**。', 'acro', { post: 0.1 }), seg('13、14、15、21、22番とYの6本です。', '13、14、15、21、22番とワイの6本です。', 'acroN', { post: 0.25 })]),
    beat('telo', S(T2, 'verbatim', ['0043'], { slide: 28 }), [same('そして、完全に端にあるテロセントリック。', 'telo', { post: 0.1 }), same('これは**ヒトの染色体にはありません**。', 'none', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 340, z: 1.0, note: '3本' },
    { at: 'meta', move: 'push', x: 260, y: 330, z: 1.45, dur: 0.5, note: 'メタ' },
    { at: 'acro', move: 'whip', x: 640, y: 330, z: 1.45, dur: 0.25, note: 'アクロ' },
    { at: 'telo', move: 'whip', x: 1020, y: 330, z: 1.45, dur: 0.25, note: 'テロ' },
    { at: 'none', move: 'crash', x: 1020, y: 330, z: 1.6, dur: 0.2, hold: 0.3, note: '「ヒトにない」' },
  ],
  fx: [{ at: 'acro', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'telo', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'none', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'none', kind: 'shake', dur: 0.3, min: 'gekiga' }, { at: 'none', kind: 'onoma', text: 'バツッ', x: 1100, y: 600, dur: 0.9, min: 'ultra' }],
  sfx: [{ at: 'meta', kind: 'tick' }, { at: 'acro', kind: 'whoosh', gain: 0.5 }, { at: 'telo', kind: 'whoosh', gain: 0.5 }, { at: 'none', kind: 'boom' }],
  shots: [DARK_BG()],
});

const C2 = { bx: 1120, by: 230, sx: 150, sy: 50, k: 0.75 };
const acroBoard = () => board({
  title: 'テロセントリックはヒトにない', note: '第3講の黒板 c3・c4（下線）、c03-0044・0045',
  picture: '染色体の形の下に「アクロ … 13・14・15・21・22・Y」「テロセントリックはヒトにない」。後者に赤い下線。',
  beats: [
    beat('w', S(T2, 'verbatim', ['0044'], { board: ['c3', 'c4'] }), [
      same('黒板にも書きます。', 'w', { post: 0.1 }),
      seg('アクロセントリックは13、14、15、21、22、Y。', 'アクロセントリックは13、14、15、21、22、ワイ。', 'acro', { post: 0.15 }),
      same('**テロセントリックはヒトにはない**。', 'none', { post: 0.2 }),
    ]),
    beat('often', S(T2, 'verbatim', ['0045']), [same('ヒトにないもの、これも選択肢によく出ます。', 'often', { post: 0.4 })]),
  ],
  items: [{ id: 'c-h', at: 'start-1' }, { id: 'chr', at: 'start-1' }, { id: 'c1', at: 'start-1' }, { id: 'c1b', at: 'start-1' }, { id: 'c1c', at: 'start-1' }, { id: 'c2', at: 'start-1' }, { id: 'c3', at: 'acro' }, { id: 'c4', at: 'none' }],
  marks: [{ id: 'c4', at: 'none+0.8', color: 'r', kind: 'under' }],
  map: C2, lecturerX: 1150,
  cams: [{ at: 'start', move: 'set', x: 560, y: 320, z: 1.0, note: '形の板書' }, { at: 'acro', move: 'push', x: 520, y: 470, z: 1.45, dur: 0.5, note: 'アクロ' }, { at: 'none', move: 'crash', x: 520, y: 520, z: 1.6, dur: 0.2, hold: 0.25, note: 'ヒトにない' }, { at: 'often', move: 'pull', x: 560, y: 340, z: 1.0, dur: 0.5, note: '引く' }],
  fx: [{ at: 'none', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'acro', kind: 'chalk', gain: 0.6 }, { at: 'none', kind: 'chalk', gain: 0.7 }, { at: 'none+0.8', kind: 'impact', gain: 0.5 }],
});

const ploidy = () => fig('ploidy', {
  title: '二倍体（46）と一倍体（23）', chapter: T3,
  picture: '左に体細胞：46本（父由来23本＝青、母由来23本＝赤）の二倍体。矢印「減数分裂（2回の分裂）」の先に、23本の一倍体の卵子と精子。',
  note: 'スライド32、c03-0046〜0049',
  beats: [
    beat('q', S(T3, 'trimmed', ['0046']), [same('では、この46本の染色体が、どうやって次の世代に配られるのか。', 'q', { post: 0.25 })]),
    beat('dip', S(T3, 'verbatim', ['0047'], { slide: 32 }), [same('体細胞は46本。', 'soma', { post: 0.1 }), same('一方は母親から、もう一方は父親から来ています。', 'parents', { post: 0.1 }), same('これが**二倍体**。', 'dip', { post: 0.25 })]),
    beat('hap', S(T3, 'verbatim', ['0048'], { slide: 32 }), [same('精子と卵子は23本。', 'gam', { post: 0.1 }), same('**一倍体**です。', 'hap', { post: 0.25 })]),
    beat('mei', S(T3, 'verbatim', ['0049'], { slide: 32 }), [same('生殖細胞の分裂を**減数分裂**と呼び、', 'mei'), same('2回の分裂で、二倍体を一倍体に半減させます。', 'half', { post: 0.4 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 350, z: 1.0, note: '全景' },
    { at: 'soma', move: 'push', x: 330, y: 340, z: 1.35, dur: 0.6, note: '体細胞' },
    { at: 'gam', move: 'whip', x: 950, y: 340, z: 1.3, dur: 0.25, note: '配偶子' },
    { at: 'mei', move: 'pull', x: 640, y: 350, z: 1.0, dur: 0.5, note: '減数分裂の矢印' },
  ],
  fx: [{ at: 'dip', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'gam', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'half', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'soma', kind: 'shimmer', gain: 0.4 }, { at: 'dip', kind: 'impact', gain: 0.6 }, { at: 'gam', kind: 'whoosh' }, { at: 'half', kind: 'impact', gain: 0.6 }],
  shots: [WARM_BG()],
});

const M = { bx: 1120, by: 940, sx: 150, sy: 100, k: 0.9 };
const meiosisBoard = () => board({
  title: '減数分裂：第1分裂は相同染色体、第2分裂は姉妹染色分体', note: '第3講の黒板 m-h・m1〜m3、c03-0050',
  picture: '黒板の真ん中下「減数分裂」：2n（46）→n（23）：2回の分裂／第1分裂 … 相同染色体が分かれる／第2分裂 … 姉妹染色分体が分かれる。',
  beats: [beat('w', S(T3, 'verbatim', ['0050'], { board: ['m-h', 'm1', 'm2', 'm3'] }), [
    same('黒板に整理します。', 'w', { post: 0.1 }),
    same('2回の分裂で、46本が23本に。', 'two', { post: 0.15 }),
    same('第1分裂では**相同染色体**が、', 'm1'),
    seg('第2分裂では**姉妹染色分体**が分かれます。', '第2分裂ではしまいせんしょくぶんたいが分かれます。', 'm2', { post: 0.4 }),
  ])],
  items: [{ id: 'm-h', at: 'start' }, { id: 'm1', at: 'two' }, { id: 'm2', at: 'm1' }, { id: 'm3', at: 'm2' }],
  map: M,
  cams: [{ at: 'start', move: 'set', x: 560, y: 260, z: 1.0, note: '減数分裂の板書' }, { at: 'm1', move: 'push', x: 520, y: 270, z: 1.45, dur: 0.5, note: '第1分裂' }, { at: 'm2', move: 'pan', x: 520, y: 335, z: 1.45, dur: 0.5, note: '第2分裂' }],
  fx: [{ at: 'm1', kind: 'focus', dur: 0.8, min: 'gekiga' }, { at: 'm2', kind: 'focus', dur: 0.8, min: 'gekiga' }],
  sfx: [{ at: 'two', kind: 'chalk', gain: 0.6 }, { at: 'm1', kind: 'chalk', gain: 0.6 }, { at: 'm2', kind: 'chalk', gain: 0.6 }],
});

const meiosis = () => fig('meiosis', {
  title: '減数分裂の動き（21番の1対）',
  picture: '細胞の中に21番の1対（父由来＝青、母由来＝赤）。DNA複製で姉妹染色分体になり、相同染色体が並び、第1分裂で青と赤が別々の細胞へ、第2分裂で姉妹染色分体が分かれ、1本ずつの配偶子が4つできる。',
  note: 'c03-0051〜0056（講義のアニメーションと同じ流れ。交叉は省略）',
  beats: [
    beat('see', S(T3, 'verbatim', ['0051']), [same('動きで確認しましょう。', 'see', { post: 0.1 }), same('ここでは1対、例えば21番だけを追います。', 'one', { post: 0.1 }), same('青が父親由来、赤が母親由来です。', 'col', { post: 0.25 })]),
    beat('rep', S(T3, 'verbatim', ['0052']), [seg('まずDNAが複製されて、それぞれの染色体が2本の**姉妹染色分体**になります。', 'まずディーエヌエーが複製されて、それぞれの染色体が2本のしまいせんしょくぶんたいになります。', 'rep', { post: 0.25 })]),
    beat('pair', S(T3, 'verbatim', ['0053']), [seg('相同染色体どうしが並んで……', '相同染色体どうしが並んで', 'pair', { post: 0.2 })]),
    beat('m1', S(T3, 'verbatim', ['0054']), [same('**第1分裂**。', 'm1', { post: 0.1 }), same('相同染色体が、別々の細胞へ分かれます。', 'sep1', { post: 0.25 })]),
    beat('m2', S(T3, 'verbatim', ['0055']), [seg('**第2分裂**。今度は姉妹染色分体が分かれて……', '第2分裂。今度はしまいせんしょくぶんたいが分かれて', 'm2', { post: 0.2 })]),
    beat('four', S(T3, 'verbatim', ['0056']), [same('4つの配偶子ができました。', 'four', { post: 0.1 }), same('どれも1本ずつです。', 'one1', { post: 0.4 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 340, z: 1.25, note: '1つの細胞' },
    { at: 'rep', move: 'push', x: 640, y: 340, z: 1.45, dur: 1.0, note: '複製' },
    { at: 'm1', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.4, note: '第1分裂' },
    { at: 'four', move: 'push', x: 640, y: 350, z: 1.05, dur: 1.0, note: '4つの配偶子' },
  ],
  fx: [{ at: 'm1', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'm2', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'four', kind: 'flash', dur: 0.25, min: 'gekiga' }],
  sfx: [{ at: 'rep', kind: 'shimmer', gain: 0.5 }, { at: 'pair', kind: 'tick' }, { at: 'm1', kind: 'whoosh' }, { at: 'm2', kind: 'whoosh' }, { at: 'four', kind: 'impact', gain: 0.6 }],
});

const nondisjunction = () => fig('nondisjunction', {
  title: '第1分裂の不分離 → トリソミー／モノソミー',
  picture: '同じ1対が第1分裂で分かれず、両方が片方の細胞へ。第2分裂後、2本もつ配偶子が2つ、1本ももたない配偶子が2つ。正常な精子（1本）と受精すると、3本（トリソミー）と1本（モノソミー）。最後に第2分裂の不分離（1・1・2・0）も小さく示す。',
  note: 'c03-0057〜0059',
  beats: [
    beat('q', S(T3, 'verbatim', ['0057']), [same('では、第1分裂で、相同染色体が**分かれなかったら**どうなるでしょう。', 'q', { post: 0.3 })]),
    beat('g', S(T3, 'verbatim', ['0058']), [same('2本持った配偶子と、1本も持たない配偶子ができます。', 'g', { post: 0.15 }), same('これが受精すると、3本の**トリソミー**、1本の**モノソミー**になります。', 'tri', { post: 0.35 })]),
    beat('m2', S(T3, 'verbatim', ['0059']), [seg('第2分裂で姉妹染色分体が分かれない場合も、同じように本数が狂います。', '第2分裂でしまいせんしょくぶんたいが分かれない場合も、同じように本数が狂います。', 'm2', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 300, z: 1.15, note: '並んだ1対' },
    { at: 'q', move: 'push', x: 640, y: 300, z: 1.3, dur: 1.5, note: '分かれない' },
    { at: 'g', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '配偶子' },
    { at: 'tri', move: 'push', x: 640, y: 420, z: 1.15, dur: 0.6, note: '受精' },
    { at: 'm2', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '第2分裂の不分離' },
  ],
  fx: [{ at: 'q+1.2', kind: 'shake', dur: 0.3, min: 'gekiga' }, { at: 'tri', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'tri', kind: 'onoma', text: 'ズレッ', x: 1080, y: 150, dur: 0.9, min: 'ultra' }],
  sfx: [{ at: 'q', kind: 'riser', gain: 0.4 }, { at: 'q+1.2', kind: 'impact', gain: 0.6 }, { at: 'g', kind: 'whoosh' }, { at: 'tri', kind: 'boom', gain: 0.7 }],
});

const ndBoard = () => board({
  title: '不分離 → n＋1 → 受精でトリソミー', note: '第3講の黒板 m4（赤丸）、c03-0061',
  picture: '減数分裂の板書の下に一行「不分離→n＋1→受精でトリソミー」。赤い丸で囲む。',
  beats: [beat('w', S(T3, 'verbatim', ['0061'], { board: ['m4'] }), [same('黒板に一行。', 'w', { post: 0.1 }), same('不分離が起こると、1本多い配偶子ができて、受精すると**トリソミー**になります。', 'm4', { post: 0.45 })])],
  items: [{ id: 'm-h', at: 'start-1' }, { id: 'm1', at: 'start-1' }, { id: 'm2', at: 'start-1' }, { id: 'm3', at: 'start-1' }, { id: 'm4', at: 'm4' }],
  marks: [{ id: 'm4', at: 'm4+2.5', color: 'r' }],
  map: M,
  cams: [{ at: 'start', move: 'set', x: 560, y: 280, z: 1.0, note: '板書' }, { at: 'm4', move: 'push', x: 520, y: 410, z: 1.45, dur: 0.6, note: '一行' }],
  fx: [{ at: 'm4+2.5', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'm4', kind: 'chalk', gain: 0.7 }, { at: 'm4+2.5', kind: 'impact', gain: 0.5 }],
});

const maternalAge = () => fig('maternal-age', {
  title: '母の加齢は不分離、父の加齢は塩基レベルの変異',
  picture: '左：卵子は減数第1分裂の前期で長い間止まっている（時計の針が進む）→年齢とともに不分離。右：精子はDNA複製を繰り返し、年齢とともに塩基の書き間違いが増える。下：ダウン症候群の頻度の棒（母20歳 約1/1500、35歳 約1/350、40歳 約1/100）。',
  note: 'スライド33、c03-0063〜0066',
  beats: [
    beat('why', S(T3, 'trimmed', ['0063'], { slide: 33 }), [same('では、なぜ不分離が起こるのか。', 'why', { post: 0.25 })]),
    beat('egg', S(T3, 'verbatim', ['0064'], { slide: 33 }), [same('卵子は、減数第1分裂の前期で長い間止まっています。', 'egg', { post: 0.15 }), same('だから年齢が上がると**不分離**を起こしやすい。', 'age', { post: 0.25 })]),
    beat('sperm', S(T3, 'verbatim', ['0065'], { slide: 33 }), [seg('精子は、年齢とともにDNA複製のエラーが増えて、', '精子は、年齢とともにディーエヌエー複製のエラーが増えて、', 'sperm'), same('塩基レベルの**突然変異**を起こしやすくなります。', 'mut', { post: 0.25 })]),
    beat('down', S(T3, 'verbatim', ['0066'], { slide: 33 }), [
      same('ダウン症候群は、', 'down'),
      seg('母親が20歳で約1500人に1人、', '母親がはたちで約せんごひゃくにんにひとり、', 'a20'),
      seg('35歳で約350人に1人、', 'さんじゅうごさいで約さんびゃくごじゅうにんにひとり、', 'a35'),
      seg('40歳で約100人に1人です。', 'よんじゅっさいで約ひゃくにんにひとりです。', 'a40', { post: 0.45 }),
    ]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 300, z: 1.0, note: '卵子と精子' },
    { at: 'egg', move: 'push', x: 330, y: 220, z: 1.4, dur: 0.6, note: '卵子' },
    { at: 'sperm', move: 'whip', x: 950, y: 220, z: 1.4, dur: 0.25, note: '精子' },
    { at: 'down', move: 'pull', x: 640, y: 400, z: 1.05, dur: 0.5, note: '頻度の棒' },
    { at: 'a40', move: 'crash', x: 900, y: 450, z: 1.3, dur: 0.2, hold: 0.25, note: '40歳' },
  ],
  fx: [{ at: 'age', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'sperm', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'a40', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'egg', kind: 'tick' }, { at: 'egg+0.5', kind: 'tick' }, { at: 'egg+1.0', kind: 'tick' }, { at: 'age', kind: 'impact', gain: 0.6 }, { at: 'sperm', kind: 'whoosh' }, { at: 'a20', kind: 'tick' }, { at: 'a35', kind: 'tick' }, { at: 'a40', kind: 'boom', gain: 0.6 }],
  shots: [WARM_BG()],
});

const R = { bx: 2190, by: 230, sx: 140, sy: 70, k: 0.75 };
const examBoard = () => board({
  title: '試験ポイント：母の加齢＝不分離、父の加齢＝点変異', note: '第3講の黒板 r-h・r1〜r3（r1bに赤の二重丸）、c03-0068・0069',
  picture: '黒板の右「試験ポイント」：卵子は減数第1分裂前期で停止→母の加齢で不分離↑／精子は加齢でDNA複製エラー→父の加齢で点変異↑／ダウン：35歳 約1/350、40歳 約1/100。',
  beats: [
    beat('cmp', S(T3, 'verbatim', ['0068'], { board: ['r1b', 'r2b'] }), [same('母親の加齢は**不分離**、', 'mom'), same('父親の加齢は**塩基レベルの変異**。', 'dad', { post: 0.1 }), same('この対比、よく問われます。', 'often', { post: 0.25 })]),
    beat('num', S(T3, 'verbatim', ['0069'], { board: ['r3'] }), [same('数字も一つだけ覚えるなら、', 'one'), seg('35歳で約350人に1人です。', 'さんじゅうごさいで約さんびゃくごじゅうにんにひとりです。', 'n350', { post: 0.45 })]),
  ],
  items: [{ id: 'r-h', at: 'start' }, { id: 'r1', at: 'start+0.3' }, { id: 'r1b', at: 'mom' }, { id: 'r2', at: 'dad-0.6' }, { id: 'r2b', at: 'dad' }, { id: 'r3', at: 'n350' }],
  marks: [{ id: 'r1b', at: 'often', color: 'r' }],
  map: R,
  cams: [{ at: 'start', move: 'set', x: 560, y: 260, z: 1.0, note: '試験ポイント' }, { at: 'mom', move: 'push', x: 440, y: 160, z: 1.5, dur: 0.5, note: '母' }, { at: 'dad', move: 'pan', x: 520, y: 270, z: 1.45, dur: 0.5, note: '父' }, { at: 'n350', move: 'pan', x: 480, y: 380, z: 1.45, dur: 0.5, note: '35歳' }],
  fx: [{ at: 'often', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'mom', kind: 'chalk', gain: 0.6 }, { at: 'dad', kind: 'chalk', gain: 0.6 }, { at: 'often', kind: 'impact', gain: 0.5 }, { at: 'n350', kind: 'chalk', gain: 0.6 }],
});

const aneuploid = () => fig('aneuploid', {
  title: 'モノソミー・トリソミー・テトラソミー', chapter: T4,
  picture: '同じ番号の染色体が1本（モノソミー）、3本（トリソミー）、4本（テトラソミー）。常染色体の完全トリソミーで生まれてくるのは13・18・21番だけ（他は早期に流産）。性染色体の過剰（XXYなど）は軽く、性染色体のモノソミーはターナー（45,X）だけ。',
  note: 'スライド31、c03-0080〜0083',
  beats: [
    beat('n', S(T4, 'verbatim', ['0080'], { slide: 31 }), [same('1本なら**モノソミー**、', 'mono'), same('3本なら**トリソミー**、', 'tri'), same('4本なら**テトラソミー**。', 'tetra', { post: 0.25 })]),
    beat('born', S(T4, 'verbatim', ['0081'], { slide: 31 }), [same('常染色体の完全トリソミーで生まれてくるのは、13番、18番、21番だけ。', 'born', { post: 0.15 }), same('多くのトリソミーは、早期に流産すると考えられています。', 'loss', { post: 0.25 })]),
    beat('sex', S(T4, 'verbatim', ['0082', '0083'], { slide: 31 }), [same('性染色体の過剰は不活性化されるため症状が軽く、', 'sex'), same('性染色体のモノソミーは、**ターナー症候群**だけです。', 'turner', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 300, z: 1.0, note: '本数' },
    { at: 'born', move: 'push', x: 640, y: 340, z: 1.25, dur: 0.6, note: '13・18・21' },
    { at: 'sex', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.6, note: '性染色体' },
    { at: 'turner', move: 'crash', x: 900, y: 480, z: 1.3, dur: 0.2, hold: 0.25, note: 'ターナーのみ' },
  ],
  fx: [{ at: 'tetra', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'born', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'turner', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'mono', kind: 'tick' }, { at: 'tri', kind: 'tick' }, { at: 'tetra', kind: 'tick' }, { at: 'born', kind: 'impact', gain: 0.6 }, { at: 'turner', kind: 'boom', gain: 0.6 }],
  shots: [DARK_BG()],
});

const T = { bx: 2190, by: 745, sx: 140, sy: 70, k: 0.75 };
const trisomyBoard = () => board({
  title: '生まれてくるトリソミー：13・18・21', note: '第3講の黒板 t-h・t1〜t6、c03-0084・0085',
  picture: '黒板の右「生まれてくるトリソミー」：13 … ペイトー（パトウ）／18 … エドワーズ／21 … ダウン／性染色体モノソミー＝ターナーのみ／性染色体の過剰は軽い／5p- … 猫鳴き症候群。',
  beats: [
    beat('t', S(T4, 'verbatim', ['0084'], { board: ['t-h', 't1', 't2', 't3'] }), [same('右側に書きます。', 'w', { post: 0.1 }), same('13番ペイトー、18番エドワーズ、21番ダウン。', 't', { post: 0.25 })]),
    beat('sex', S(T4, 'verbatim', ['0085'], { board: ['t4', 't5', 't6'] }), [same('ターナーだけが性染色体のモノソミー。', 'turner', { post: 0.1 }), same('性染色体の過剰は軽い。', 'mild', { post: 0.1 }), seg('5p-は猫鳴き。', 'ごピーマイナスはねこなき。', 'cat', { post: 0.4 })]),
  ],
  items: [{ id: 't-h', at: 'start' }, { id: 't1', at: 't' }, { id: 't2', at: 't+1.2' }, { id: 't3', at: 't+2.4' }, { id: 't4', at: 'turner' }, { id: 't5', at: 'mild' }, { id: 't6', at: 'cat' }],
  map: T,
  cams: [{ at: 'start', move: 'set', x: 560, y: 270, z: 1.0, note: '板書' }, { at: 't', move: 'push', x: 400, y: 200, z: 1.5, dur: 0.6, note: '13・18・21' }, { at: 'turner', move: 'pan', x: 480, y: 330, z: 1.45, dur: 0.5, note: 'ターナー' }, { at: 'cat', move: 'pan', x: 400, y: 430, z: 1.45, dur: 0.5, note: '5p-' }],
  sfx: [{ at: 't', kind: 'chalk', gain: 0.6 }, { at: 'turner', kind: 'chalk', gain: 0.6 }, { at: 'mild', kind: 'chalk', gain: 0.5 }, { at: 'cat', kind: 'chalk', gain: 0.5 }],
});

const geneCount = () => fig('genecount', {
  title: '13・18・21番は遺伝子が特に少ない',
  picture: '常染色体1〜22番の遺伝子数の棒グラフ（概数）。13番、18番、21番の棒が順に赤く灯り、ひときわ低い。「1本多くても余分な遺伝子が少ない → 生まれてこられる」。',
  note: 'スライド30、c03-0086〜0091。棒の高さはおおよその遺伝子数（タンパク質をコードする遺伝子の概数）',
  beats: [
    beat('why', S(T4, 'trimmed', ['0086'], { slide: 30 }), [same('では、なぜ13、18、21番だけが生まれてくるのか。', 'why', { post: 0.25 })]),
    beat('graph', S(T4, 'verbatim', ['0087'], { slide: 30 }), [same('右のグラフは、染色体ごとの遺伝子の数です。', 'graph', { post: 0.2 })]),
    beat('three', S(T4, 'verbatim', ['0088', '0089', '0090'], { slide: 30 }), [same('13番、', 'g13'), same('18番、', 'g18'), same('そして21番。', 'g21', { post: 0.1 }), same('この3本は、遺伝子の数が**特に少ない**んです。', 'few', { post: 0.25 })]),
    beat('live', S(T4, 'trimmed', ['0091'], { slide: 30 }), [seg('1本多くても、余分な遺伝子の量が比較的少ない。', '1本多くても、余分な遺伝子の量が比較てき少ない。', 'extra', { post: 0.1 }), same('だから、致死にならずに生まれてこられる。', 'live', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 350, z: 1.0, note: 'グラフ' },
    { at: 'g13', move: 'push', x: 700, y: 420, z: 1.3, dur: 0.5, note: '13番' },
    { at: 'g21', move: 'pan', x: 900, y: 420, z: 1.3, dur: 0.6, note: '21番' },
    { at: 'few', move: 'pull', x: 640, y: 350, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'few', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'live', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'graph', kind: 'shimmer', gain: 0.4 }, { at: 'g13', kind: 'tick' }, { at: 'g18', kind: 'tick' }, { at: 'g21', kind: 'tick' }, { at: 'few', kind: 'impact', gain: 0.6 }],
  shots: [DARK_BG()],
});

const summary = () => summaryScene({
  note: '第3講の黒板 sum-h・s1〜s4、c03-0104〜0108',
  beats: [
    beat('four', S('まとめ', 'verbatim', ['0104'], { board: ['sum-h'] }), [same('今日覚えてほしいのは、この4つです。', 'four', { post: 0.3 })]),
    beat('p1', S('まとめ', 'verbatim', ['0105'], { board: ['s1'] }), [same('ひとつ目。', 'p1', { post: 0.1 }), seg('DNAからヌクレオソーム、クロマチン、染色体へ。', 'ディーエヌエーからヌクレオソーム、クロマチン、染色体へ。', 'p1b', { post: 0.1 }), seg('2、11、1400ナノメートル。', 'に、じゅういち、せんよんひゃくナノメートル。', 'p1c', { post: 0.3 })]),
    beat('p2', S('まとめ', 'verbatim', ['0106'], { board: ['s2'] }), [same('ふたつ目。', 'p2', { post: 0.1 }), same('コアヒストンは4種類が2個ずつ。', 'p2b', { post: 0.1 }), seg('H1はスペーサー。', 'エイチワンはスペーサー。', 'p2c', { post: 0.3 })]),
    beat('p3', S('まとめ', 'verbatim', ['0107'], { board: ['s3'] }), [same('みっつ目。', 'p3', { post: 0.1 }), same('不分離でトリソミー。', 'p3b', { post: 0.1 }), same('生まれてくるのは13、18、21番。', 'p3c', { post: 0.3 })]),
    beat('p4', S('まとめ', 'verbatim', ['0108'], { board: ['s4'] }), [same('そして、母親の加齢は不分離、父親の加齢は**点変異**です。', 'p4', { post: 0.45 })]),
  ],
  marks: [{ id: 's1', at: 'p1c+1', color: 'y' }, { id: 's2', at: 'p2c+0.8', color: 'y' }, { id: 's3', at: 'p3c+1', color: 'y' }, { id: 's4', at: 'p4+3', color: 'r' }],
  endAt: 'p4+3.6',
});

const end = () => endScene({
  no: '次回 第4講', picture: '「次回 第4講」の判。染色体の上の遺伝子：エクソンとイントロンが並ぶ遺伝子の模式図。黒にフェードアウト。', note: 'c03-0109',
  beats: [beat('next', S('まとめ', 'trimmed', ['0109']), [same('次の第4講では、', 'next'), same('この染色体の上にある「遺伝子」そのものの構造と、', 'what'), same('それが読まれる仕組みを見ていきます。', 'read', { post: 1.0 })])],
  l1: '染色体の上の「遺伝子」', l1At: 'what', l2: 'その構造と、読まれる仕組み', l2At: 'read', pic: 'gene',
});

/** the whole of 第3講, in lecture order */
export function lecture3Film(): SceneDef[] {
  return numbered([title(), packStrip(), levelsBoard(), packing(), octamer(), histoneBoard(), histmod(), karyotype(), shapeBoard(), centromere(), acroBoard(), ploidy(), meiosisBoard(), meiosis(), nondisjunction(), ndBoard(), maternalAge(), examBoard(), aneuploid(), trisomyBoard(), geneCount(), summary(), end()]);
}

export const FILM3_RATIONALE = [
  '第3講「染色体 ― DNAの収納と数の異常」を、講義の順（導入 → テーマ1〜4 → まとめ）に1本の劇画授業映像にした完成版。確認問題の選択肢の解説は省いた。',
  '台詞はすべて第3講の講義台詞（narrations/lecture-03.json）の原文、またはその一部。板書は講義の黒板の文字をそのまま使う。',
  '医学図：ヌクレオソーム（コアはH2A・H2B・H3・H4各2個の八量体、DNAが約1.7周・約140塩基対、スペーサーにH1）、収納の階層（2・11・1400 nm）、核型（模式図）、メタ／アクロ／テロセントリック、二倍体と一倍体、減数分裂（第1分裂で相同染色体、第2分裂で姉妹染色分体）、不分離、加齢とダウン症候群の頻度、遺伝子数（概数）。患者の顔は描かない。',
];
