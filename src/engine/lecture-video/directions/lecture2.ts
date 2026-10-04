/**
 * 遺伝医学｜遺伝子の基礎 第2講「核酸の化学とDNAの二重らせん」— the whole lecture as one gekiga film (完成版).
 *
 *   導入      title → 細胞の4種類の小さな有機分子（ヌクレオチドがつながると核酸）
 *   テーマ1   核酸の単位はヌクレオチド（塩基・五炭糖・リン酸）→ ヌクレオシドとの違い「シドはリン酸なし」
 *   テーマ2   リボースと2-デオキシリボース（2'のOHがH）→ プリンとピリミジン、RNAではTの代わりにU → NMP/NDP/NTP・ATP・cAMP・dNTP
 *   テーマ3   板書の2本鎖 → 二重らせん（幅2 nm・1回転3.4 nm）→ ほどくと逆平行のはしご → 塩基対の水素結合（2本/3本、幅1.08 nm）
 *             → ホスホジエステル結合と5'→3' → 試験ポイント → G-C対が多いほど引き離しにくい
 *   テーマ4   核酸の代謝（ピリミジン→NH₃＋CO₂、プリン→尿酸）→ 痛風、食べた核酸はそのまま使わない
 *   まとめ    今日覚えてほしい4つ → 次回予告（第3講：染色体）
 *
 * Every spoken line is a cue of narrations/lecture-02.json, verbatim or a contiguous part of it (tests check).
 */
import type { Beat, Fx, SceneDef, Segment, SourceRef } from '../types';

const COURSE = 'genetics-basics', LECTURE = 2;
const S = (section: string, mode: SourceRef['mode'], cues: string[], extra: Partial<SourceRef> = {}): SourceRef => ({ course: COURSE, lecture: LECTURE, section, cues, mode, ...extra });
const seg = (text: string, say: string, cue?: string, o: Partial<Segment> = {}): Segment => ({ text, say, cue, ...o });
const same = (text: string, cue?: string, o: Partial<Segment> = {}): Segment => seg(text, text.replace(/\*\*/g, ''), cue, o);
const beat = (id: string, src: SourceRef, segs: Segment[]): Beat => ({ id, src, segs });
const TONE: Fx = { at: 'start', kind: 'tone', dur: 999, min: 'gekiga' };
const HALL = 'a dark empty lecture hall at night, a huge slate blackboard, a single hard shaft of light cutting through floating chalk dust, dust motes drifting slowly';
const MOLECULAR = 'a dark watery molecular world inside a cell nucleus, soft out-of-focus particles drifting, cold rim light, slow push-in';
const NO_TEXT = 'no text, no letters, no labels';
const BOARD_BG = { id: 'a', from: 'start', mode: 'background' as const, desc: '夜の講義室。', subject: HALL, accuracy: 'no people, no writing on the board' };
const MOL_BG = (desc = '細胞核の中の暗い水の世界。', extra = '') => ({ id: 'a', from: 'start', mode: 'background' as const, desc, subject: MOLECULAR + extra, accuracy: 'background only, no molecules in focus, ' + NO_TEXT });

const T1 = 'テーマ1　ヌクレオチドの成り立ち', T2 = 'テーマ2　糖と塩基', T3 = 'テーマ3　二重らせん', T4 = 'テーマ4　核酸の代謝と臨床';

export const FILM2_KEY = 'genetics-basics:2:film';

/* ---------- 導入 ---------- */
function titleOpen(): SceneDef {
  return {
    id: 'X', title: 'タイトル：第2講 核酸の化学とDNAの二重らせん', visual: 'title-open', chapter: '第2講',
    picture: '漆黒に墨が爆ぜ、右巻きの二重らせんの影が回る。「核酸の化学と／DNAの二重らせん」の筆文字。「何でできているのか」で、らせんの文字（塩基）と紙（骨格）に光が走る。',
    diagram: { id: 'helix', title: 'DNA二重らせん（影）', note: '右巻き・主溝/副溝の非対称を保った背景図。文字は MEDSTUDY が描く' },
    beats: [
      beat('open', S('導入', 'verbatim', ['c02-0001']), [
        same('はい、第2講を始めます。', 'title', { post: 0.2 }),
        seg('前回、遺伝の本体は**DNA**だ、というところまで来ました。', '前回、遺伝の本体はディーエヌエーだ、というところまで来ました。', 'prev', { post: 0.3 }),
      ]),
      beat('today', S('導入', 'verbatim', ['c02-0002']), [
        seg('今日は、そのDNAが「何でできているのか」。', '今日は、そのディーエヌエーが何でできているのか。', 'what', { post: 0.2 }),
        same('設計図の、文字と紙の話です。', 'paper', { post: 0.5 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.3, note: '墨の中から' },
      { at: 'title', move: 'crash', x: 640, y: 330, z: 1.12, dur: 0.22, hold: 0.3, note: '題名で急接近 → 静止' },
      { at: 'prev', move: 'pull', x: 640, y: 360, z: 1.0, dur: 3.0, note: 'ゆっくり引く' },
      { at: 'what', move: 'push', x: 640, y: 420, z: 1.15, dur: 2.0, note: 'らせんへ寄る' },
    ],
    fx: [{ at: 'title', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'title', kind: 'focus', dur: 1.4, min: 'gekiga' }, { at: 'title', kind: 'shake', dur: 0.3, min: 'gekiga' }, { at: 'paper', kind: 'flash', dur: 0.25, min: 'gekiga' }, TONE],
    sfx: [{ at: 'start', kind: 'riser', gain: 0.5 }, { at: 'title', kind: 'boom' }, { at: 'what', kind: 'shimmer', gain: 0.5 }],
    shots: [{ id: 'a', from: 'start', mode: 'feature', desc: '漆黒の空間で墨が爆ぜ、二重らせんの影がゆっくり回る。',
      subject: 'pitch black void, sumi ink exploding and swirling like smoke in water, the dark silhouette of a right-handed DNA double helix slowly rotating in the ink',
      accuracy: 'the helix is right-handed with a wide major groove and a narrow minor groove; ' + NO_TEXT }],
    data: { dy: -60, unit: '遺伝医学｜遺伝子の基礎', unitAt: 'start+0.2', title: ['核酸の化学と', 'DNAの二重らせん'], no: '第2講', subs: [{ text: 'DNAは何でできている？', at: 'what', y: 505 }, { text: '文字（塩基）と 紙（骨格）', at: 'paper', y: 552, color: 'y' }] },
  };
}

function monomers(): SceneDef {
  return {
    id: 'X', title: '4種類の小さな有機分子 → ヌクレオチドがつながると核酸', visual: 'monomers',
    picture: '4つのコマに小さな分子：糖・脂肪酸・アミノ酸・ヌクレオチド。それぞれがつながって多糖・膜・タンパク質へ。最後のヌクレオチドの列が「核酸」になる瞬間に急接近し、主役のヌクレオチドが画面いっぱいに。',
    diagram: { id: 'monomers', title: '細胞内の4種類の小有機分子', note: 'スライド17：糖→多糖、脂肪酸→脂肪・脂質・膜、アミノ酸→タンパク質、ヌクレオチド→核酸' },
    beats: [
      beat('four', S('全体像', 'trimmed', ['c02-0013'], { slide: 17 }), [same('細胞の中には、4種類の小さな有機分子があります。', 'four', { post: 0.25 })]),
      beat('poly', S('全体像', 'verbatim', ['c02-0014', 'c02-0015', 'c02-0016', 'c02-0017'], { slide: 17 }), [
        same('糖は多糖に、', 'sug'), same('脂肪酸は膜に、', 'fat'), same('アミノ酸はタンパク質に。', 'aa', { post: 0.25 }),
        seg('そして、ヌクレオチドがつながると……', 'そして、ヌクレオチドがつながると', 'nuc', { post: 0.35 }),
        same('**核酸**になります。', 'na', { pre: 0.1, post: 0.2 }),
        same('今日の主役は、この**ヌクレオチド**です。', 'star', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '4つのコマ' },
      { at: 'sug', move: 'push', x: 640, y: 380, z: 1.05, dur: 4, note: 'ゆっくり寄る' },
      { at: 'nuc', move: 'push', x: 1110, y: 400, z: 1.5, dur: 1.2, note: 'ヌクレオチドのコマへ' },
      { at: 'na', move: 'crash', x: 1110, y: 500, z: 1.9, dur: 0.22, hold: 0.25, note: '「核酸」で急接近' },
      { at: 'star', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.4, note: '主役のヌクレオチドを大写しに' },
    ],
    fx: [{ at: 'na', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'na', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'star', kind: 'flash', dur: 0.3, min: 'gekiga' }, { at: 'na', kind: 'onoma', text: 'ガシッ', x: 260, y: 150, dur: 0.9, min: 'ultra' }, TONE],
    sfx: [{ at: 'sug', kind: 'tick' }, { at: 'fat', kind: 'tick' }, { at: 'aa', kind: 'tick' }, { at: 'nuc', kind: 'riser', gain: 0.5 }, { at: 'na', kind: 'impact' }, { at: 'star', kind: 'shimmer' }],
    shots: [MOL_BG('細胞の中の暗い水の世界。粒がゆっくり漂う。')],
  };
}

/* ---------- テーマ1 ---------- */
const LEFT = { bx: 90, by: 230, sx: 150, sy: 90, k: 0.85 };
function unitBoard(): SceneDef {
  return {
    id: 'X', title: '核酸の単位はヌクレオチド', visual: 'board', lecturer: true, chapter: T1,
    picture: '黒板の左に「核酸の単位」「ヌクレオチド→核酸」（黄色の下線）「＝塩基＋五炭糖＋リン酸」（板書 l-h・l1・l2）。',
    diagram: { id: 'board-unit', title: '板書：核酸の単位', note: '第2講の黒板 l-h・l1・l2' },
    beats: [
      beat('unit', S(T1, 'verbatim', ['c02-0019'], { board: ['l-h', 'l1'] }), [
        same('核酸の単位は**ヌクレオチド**。', 'unit', { post: 0.15 }),
        same('まずこれを押さえてください。', 'press', { post: 0.3 }),
      ]),
      beat('parts', S(T1, 'verbatim', ['c02-0020'], { board: ['l2'] }), [
        same('ヌクレオチドは、三つの部品でできています。', 'three', { post: 0.15 }),
        seg('**塩基**、**五炭糖**、そして**リン酸**。', '塩基、ごたんとう、そしてリン酸。', 'parts', { post: 0.4 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 600, y: 320, z: 1.0, note: '黒板の左' },
      { at: 'unit', move: 'push', x: 480, y: 220, z: 1.4, dur: 0.8, note: '「ヌクレオチド→核酸」へ' },
      { at: 'parts', move: 'crash', x: 480, y: 300, z: 1.55, dur: 0.22, hold: 0.2, note: '三つの部品で急接近' },
      { at: 'parts+2.4', move: 'pull', x: 600, y: 320, z: 1.0, dur: 0.5, note: '引く' },
    ],
    fx: [{ at: 'unit', kind: 'focus', dur: 0.9, min: 'gekiga' }, { at: 'parts', kind: 'impact', dur: 0.4, min: 'gekiga' }, TONE],
    sfx: [{ at: 'start', kind: 'chalk', gain: 0.5 }, { at: 'unit', kind: 'chalk', gain: 0.6 }, { at: 'parts', kind: 'impact', gain: 0.7 }],
    shots: [BOARD_BG],
    data: { items: [{ id: 'l-h', at: 'start' }, { id: 'l1', at: 'unit' }, { id: 'l2', at: 'parts', dur: 1.2 }], marks: [{ id: 'l1', at: 'press', color: 'y', kind: 'under' }], map: LEFT, lecturerX: 1060 },
  };
}

function nucleotide(): SceneDef {
  return {
    id: 'X', title: 'ヌクレオチド＝リン酸・糖・塩基／ヌクレオシド＝糖・塩基', visual: 'nucleotide',
    picture: '分子の世界に、左の丸（リン酸）・真ん中の五角形（五炭糖）・右の六角形（塩基）が一つずつ飛び込んで結合する。リン酸は糖の5\'に、塩基は1\'に付く。「ヌクレオシド」で糖と塩基だけが赤い点線で囲まれ、リン酸が外れる。',
    diagram: { id: 'nucleotide', title: 'ヌクレオチドとヌクレオシド', note: '板書 nuc、スライド19：塩基＋五炭糖＝ヌクレオシド、糖のヒドロキシ基（5\'）にリン酸が付くとヌクレオチド' },
    beats: [
      beat('pic', S(T1, 'verbatim', ['c02-0021'], { board: ['nuc'] }), [
        same('絵にすると、こうなります。', 'pic', { post: 0.15 }),
        same('左の丸が**リン酸**、', 'P'), same('真ん中の五角形が**糖**、', 'S'), same('右の六角形が**塩基**です。', 'B', { post: 0.35 }),
      ]),
      beat('side', S(T1, 'trimmed', ['c02-0025'], { slide: 19 }), [
        same('塩基と糖だけのかたまりを、', 'bs'),
        same('**ヌクレオシド**と呼びます。', 'side', { pre: 0.1, post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 0.95, note: '全景' },
      { at: 'P', move: 'push', x: 380, y: 380, z: 1.25, dur: 0.5, note: 'リン酸へ' },
      { at: 'S', move: 'whip', x: 640, y: 380, z: 1.25, dur: 0.25, note: '糖へ高速パン' },
      { at: 'B', move: 'whip', x: 900, y: 380, z: 1.25, dur: 0.25, note: '塩基へ高速パン' },
      { at: 'bs', move: 'pull', x: 700, y: 370, z: 1.0, dur: 0.5, note: '引いて全体' },
      { at: 'side', move: 'crash', x: 760, y: 380, z: 1.35, dur: 0.22, hold: 0.3, note: '「ヌクレオシド」で急接近' },
    ],
    fx: [{ at: 'P', kind: 'speed', dur: 0.25, min: 'ultra' }, { at: 'S', kind: 'speed', dur: 0.25, min: 'gekiga' }, { at: 'B', kind: 'speed', dur: 0.25, min: 'gekiga' }, { at: 'side', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'side', kind: 'focus', dur: 1.2, min: 'gekiga' }, { at: 'side', kind: 'onoma', text: 'バッ', x: 1100, y: 160, dur: 0.9, min: 'ultra' }, TONE],
    sfx: [{ at: 'P', kind: 'impact', gain: 0.5 }, { at: 'S', kind: 'impact', gain: 0.5 }, { at: 'B', kind: 'impact', gain: 0.5 }, { at: 'bs', kind: 'whoosh', gain: 0.5 }, { at: 'side', kind: 'boom', gain: 0.8 }],
    shots: [MOL_BG()],
  };
}

const LEFT2 = { bx: 90, by: 230, sx: 160, sy: 70, k: 0.6 };
function sidoBoard(): SceneDef {
  return {
    id: 'X', title: 'シドはリン酸なし', visual: 'board', lecturer: true,
    picture: '黒板の左下に「塩基＋糖＝ヌクレオシド」「＋リン酸＝ヌクレオチド」（板書 l3・l4）。「シドはリン酸なし」で赤く囲み、筆文字が叩きつけられる。',
    diagram: { id: 'board-sido', title: '板書：ヌクレオシドとヌクレオチド', note: '第2講の黒板 l3・l4、c02-0027・0028' },
    beats: [
      beat('sort', S(T1, 'verbatim', ['c02-0027'], { board: ['l3', 'l4'] }), [
        same('黒板に整理します。', 'sort', { post: 0.1 }),
        seg('塩基と糖だけならヌクレオ「シド」。', '塩基と糖だけならヌクレオシド。', 'sid', { post: 0.2 }),
        seg('リン酸が付くとヌクレオ「チド」。', 'リン酸が付くとヌクレオチド。', 'tid', { post: 0.35 }),
      ]),
      beat('trap', S(T1, 'verbatim', ['c02-0028']), [
        same('試験では、この二つを入れ替えた選択肢が必ず出ます。', 'trap', { post: 0.2 }),
        seg('「**シドはリン酸なし**」。', 'シドはリン酸なし。', 'rule', { pre: 0.15, post: 0.25 }),
        same('これだけ覚えれば大丈夫です。', 'ok', { post: 0.4 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 560, y: 330, z: 1.0, note: '黒板の左' },
      { at: 'sid', move: 'push', x: 420, y: 460, z: 1.5, dur: 0.6, note: '「シド」の行へ' },
      { at: 'tid', move: 'pan', x: 420, y: 520, z: 1.5, dur: 0.5, note: '「チド」の行へ' },
      { at: 'trap', move: 'pull', x: 560, y: 360, z: 1.0, dur: 0.5, note: '引く' },
      { at: 'rule', move: 'crash', x: 640, y: 320, z: 1.15, dur: 0.2, hold: 0.3, note: '「シドはリン酸なし」で急接近' },
    ],
    fx: [{ at: 'rule', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'rule', kind: 'focus', dur: 1.3, min: 'gekiga' }, { at: 'rule', kind: 'shake', dur: 0.35, min: 'gekiga' }, { at: 'rule', kind: 'invert', dur: 0.1, min: 'ultra' }, { at: 'rule', kind: 'onoma', text: 'ドンッ', x: 1080, y: 150, dur: 1.0, min: 'gekiga' }, TONE],
    sfx: [{ at: 'sid', kind: 'chalk', gain: 0.6 }, { at: 'tid', kind: 'chalk', gain: 0.6 }, { at: 'rule', kind: 'boom' }],
    shots: [BOARD_BG, { id: 'b', from: 'trap', mode: 'background', desc: '同じ講義室、光の筋が強くなる。', subject: HALL + ', the light grows harsher', accuracy: 'no people, no writing on the board' }],
    data: {
      items: [{ id: 'l-h', at: 'start-1' }, { id: 'l1', at: 'start-1' }, { id: 'l2', at: 'start-1' }, { id: 'nuc', at: 'start-1' }, { id: 'l3', at: 'sid' }, { id: 'l4', at: 'tid' }],
      marks: [{ id: 'l3', at: 'rule', color: 'r' }], map: LEFT2, lecturerX: 1080,
      slams: [{ text: 'シドはリン酸なし', at: 'rule', x: 640, y: 300, size: 72, color: '#ff6a55', band: true }],
    },
  };
}

/* ---------- テーマ2 ---------- */
function sugar(): SceneDef {
  return {
    id: 'X', title: 'リボースと2-デオキシリボース', visual: 'sugar', chapter: T2,
    picture: '五炭糖を2つ並べる（ハース式：環は炭素4つと酸素1つ、1\'〜5\'の番号）。左がリボース（RNA）、右が2-デオキシリボース（DNA）。「2ダッシュ」で右の2\'へ急接近：OHの酸素が弾け飛びHになる。最後に「DNAのD」の筆文字。',
    diagram: { id: 'sugar', title: 'リボースと2-デオキシリボース', note: 'スライド18・板書 c-r・c-d・c-d2。β-D-リボフラノース（1\'OH上、2\'・3\'OH下、4\'にCH₂OH〔5\'〕上）。2-デオキシ体は2\'がH' },
    beats: [
      beat('c5', S(T2, 'verbatim', ['c02-0038'], { slide: 18, board: ['c-h1', 'c-r', 'c-d'] }), [
        seg('核酸の糖は、炭素が五つの**五炭糖**。', '核酸の糖は、炭素が五つのごたんとう。', 'c5', { post: 0.2 }),
        seg('RNAは**リボース**、', 'アールエヌエーはリボース、', 'rib'),
        seg('DNAは**2デオキシリボース**です。', 'ディーエヌエーはにデオキシリボースです。', 'deo', { post: 0.35 }),
      ]),
      beat('deoxy', S(T2, 'verbatim', ['c02-0039'], { slide: 18, board: ['c-d2'] }), [
        seg('デオキシ、というのは「酸素が取れた」という意味。', 'デオキシ、というのは酸素が取れたという意味。', 'mean', { post: 0.2 }),
        seg('2ダッシュの位置のヒドロキシ基が、**水素**になっています。', 'にダッシュの位置のヒドロキシ基が、水素になっています。', 'oh', { post: 0.25 }),
        seg('DNAのDは、このデオキシのDです。', 'ディーエヌエーのディーは、このデオキシのディーです。', 'dd', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '2つの五炭糖' },
      { at: 'c5', move: 'push', x: 640, y: 370, z: 1.08, dur: 2.0, note: '炭素の番号が灯る' },
      { at: 'rib', move: 'push', x: 360, y: 380, z: 1.3, dur: 0.5, note: 'リボースへ' },
      { at: 'deo', move: 'whip', x: 920, y: 380, z: 1.3, dur: 0.25, note: '2-デオキシリボースへ高速パン' },
      { at: 'mean', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '並べる' },
      { at: 'oh', move: 'crash', x: 960, y: 480, z: 2.0, dur: 0.22, hold: 0.3, note: '「2ダッシュ」の位置へ急接近' },
      { at: 'dd', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.4, note: '「DNAのD」で引く' },
    ],
    fx: [{ at: 'deo', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'oh', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'oh', kind: 'focus', dur: 1.2, min: 'gekiga' }, { at: 'oh', kind: 'onoma', text: 'パキン', x: 1090, y: 160, dur: 1.0, min: 'gekiga' }, { at: 'dd', kind: 'flash', dur: 0.3, min: 'gekiga' }, TONE],
    sfx: [{ at: 'c5', kind: 'tick' }, { at: 'rib', kind: 'whoosh', gain: 0.5 }, { at: 'deo', kind: 'whoosh', gain: 0.6 }, { at: 'oh', kind: 'impact' }, { at: 'dd', kind: 'boom', gain: 0.7 }],
    shots: [MOL_BG()],
  };
}

function bases(): SceneDef {
  return {
    id: 'X', title: 'プリンとピリミジン、RNAではTの代わりにU', visual: 'bases',
    picture: '窒素（N）を含む環の塩基が5つ。左に環2つのプリン（A・G）、右に環1つのピリミジン（C・T・U）。「チミンの代わりにウラシル」でTとUが前に出て入れ替わり（違いはTの5位のメチル基だけ）、赤で囲む。',
    diagram: { id: 'bases', title: 'プリン塩基とピリミジン塩基', note: 'スライド20、板書 c-h2・c-pu・c-py・c-u。環の窒素の位置（プリン N1・N3・N7・N9、ピリミジン N1・N3）、置換基は正しい位置' },
    beats: [
      beat('two', S(T2, 'verbatim', ['c02-0044'], { slide: 20, board: ['c-h2'] }), [
        same('次は塩基。', 'base', { post: 0.1 }),
        same('窒素を含む環状の化合物で、大きく二つに分かれます。', 'ring', { post: 0.25 }),
      ]),
      beat('pp', S(T2, 'verbatim', ['c02-0045'], { slide: 20, board: ['c-pu', 'c-py'] }), [
        same('環が二つの**プリン**。', 'pu', { post: 0.1 }), same('アデニンとグアニン。', 'ag', { post: 0.2 }),
        same('環が一つの**ピリミジン**。', 'py', { post: 0.1 }), same('シトシン、チミン、ウラシルです。', 'ctu', { post: 0.3 }),
      ]),
      beat('tu', S(T2, 'verbatim', ['c02-0046'], { slide: 20, board: ['c-u'] }), [
        same('そして重要なのが、', 'imp'),
        seg('RNAでは**チミン**の代わりに**ウラシル**が使われる、ということ。', 'アールエヌエーではチミンの代わりにウラシルが使われる、ということ。', 'tu', { post: 0.3 }),
      ]),
      beat('red', S(T2, 'verbatim', ['c02-0047']), [
        same('赤で囲んでおきます。', 'red', { post: 0.1 }),
        seg('TとU、試験ではここを入れ替えてきます。', 'ティーとユー、試験ではここを入れ替えてきます。', 'swap', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '5つの塩基' },
      { at: 'ring', move: 'push', x: 640, y: 360, z: 1.08, dur: 2.5, note: '窒素の位置が光る' },
      { at: 'pu', move: 'push', x: 340, y: 360, z: 1.35, dur: 0.5, note: 'プリンへ' },
      { at: 'py', move: 'whip', x: 900, y: 360, z: 1.3, dur: 0.25, note: 'ピリミジンへ高速パン' },
      { at: 'tu', move: 'crash', x: 900, y: 420, z: 1.6, dur: 0.22, hold: 0.25, note: 'TとUへ急接近' },
      { at: 'red', move: 'pull', x: 640, y: 380, z: 1.05, dur: 0.4, note: '引く' },
      { at: 'swap', move: 'push', x: 900, y: 420, z: 1.4, dur: 0.6, note: 'TとUに寄る' },
    ],
    fx: [{ at: 'py', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'tu', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'tu', kind: 'focus', dur: 1.2, min: 'gekiga' }, { at: 'swap', kind: 'shake', dur: 0.3, min: 'gekiga' }, { at: 'swap', kind: 'onoma', text: 'ギラッ', x: 1100, y: 150, dur: 0.9, min: 'ultra' }, TONE],
    sfx: [{ at: 'ring', kind: 'shimmer', gain: 0.4 }, { at: 'pu', kind: 'impact', gain: 0.5 }, { at: 'py', kind: 'whoosh', gain: 0.6 }, { at: 'tu', kind: 'impact' }, { at: 'red', kind: 'chalk', gain: 0.6 }, { at: 'swap', kind: 'boom', gain: 0.6 }],
    shots: [MOL_BG()],
  };
}

function ntp(): SceneDef {
  return {
    id: 'X', title: 'NMP・NDP・NTP、ATP・cAMP・dNTP', visual: 'ntp',
    picture: 'ヌクレオシドの5\'にリン酸が1つ（NMP）→2つ（NDP）→3つ（NTP）と連なる。「ATP」で塩基がAになり、末端のリン酸から光（エネルギーの供給役）。「cAMP」では1つのリン酸が3\'と5\'をつないで環になる。「dNTP」では2\'がHのデオキシ型。',
    diagram: { id: 'ntp', title: 'ヌクレオチドの種類', note: 'スライド21：リン酸は1〜3個（3つが多い）、ATP（エネルギー供給）、cAMP（シグナル伝達、リン酸が3\'と5\'を環状に結ぶ）、DNA用はdNTP' },
    beats: [
      beat('n', S(T2, 'verbatim', ['c02-0052'], { slide: 21 }), [
        seg('リン酸が一つならNMP、', 'リン酸が一つならエヌエムピー、', 'nmp'),
        seg('二つならNDP、', '二つならエヌディーピー、', 'ndp'),
        seg('三つならNTP。', '三つならエヌティーピー。', 'ntp', { post: 0.15 }),
        same('実際には三つ付いたものが多いんです。', 'many', { post: 0.3 }),
      ]),
      beat('atp', S(T2, 'verbatim', ['c02-0053'], { slide: 21 }), [
        seg('体の中で働くヌクレオチドの代表が**ATP**。', '体の中で働くヌクレオチドの代表がエーティーピー。', 'atp', { post: 0.1 }),
        same('エネルギーの供給役です。', 'energy', { post: 0.25 }),
      ]),
      beat('camp', S(T2, 'verbatim', ['c02-0054'], { slide: 21 }), [seg('そして、シグナル伝達で働く**cAMP**。', 'そして、シグナル伝達で働くサイクリックエーエムピー。', 'camp', { post: 0.35 })]),
      beat('dntp', S(T2, 'verbatim', ['c02-0055'], { slide: 21 }), [
        seg('DNAの材料になるデオキシのほうは、', 'ディーエヌエーの材料になるデオキシのほうは、', 'deo'),
        seg('まとめて**dNTP**と書きます。', 'まとめてディーエヌティーピーと書きます。', 'dntp', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: 'ヌクレオシド' },
      { at: 'nmp', move: 'push', x: 520, y: 380, z: 1.2, dur: 1.0, note: 'リン酸が付く所へ' },
      { at: 'ntp', move: 'crash', x: 480, y: 380, z: 1.35, dur: 0.2, hold: 0.2, note: '3つ目で急接近' },
      { at: 'many', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '引く' },
      { at: 'energy', move: 'push', x: 330, y: 380, z: 1.3, dur: 0.5, note: '末端のリン酸の光' },
      { at: 'camp', move: 'whip', x: 640, y: 360, z: 1.0, dur: 0.3, note: 'cAMPへ' },
      { at: 'dntp', move: 'push', x: 700, y: 400, z: 1.15, dur: 0.6, note: '2\'のHへ' },
    ],
    fx: [{ at: 'ntp', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'energy', kind: 'flash', dur: 0.3, min: 'gekiga' }, { at: 'energy', kind: 'onoma', text: 'バチッ', x: 260, y: 170, dur: 0.9, min: 'gekiga' }, { at: 'camp', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'dntp', kind: 'focus', dur: 0.9, min: 'gekiga' }, TONE],
    sfx: [{ at: 'nmp', kind: 'tick' }, { at: 'ndp', kind: 'tick' }, { at: 'ntp', kind: 'impact', gain: 0.7 }, { at: 'energy', kind: 'boom', gain: 0.6 }, { at: 'camp', kind: 'whoosh' }, { at: 'dntp', kind: 'impact', gain: 0.6 }],
    shots: [MOL_BG()],
  };
}

/* ---------- テーマ3 ---------- */
const LAD = { bx: 1140, by: 849, sx: 330, sy: 130, k: 1.08 };
function ladderBoard(): SceneDef {
  return {
    id: 'X', title: '黒板：DNAの2本の鎖', visual: 'board', lecturer: true, chapter: T3,
    picture: '黒板に2本の縦の鎖。左にA・T・G・C、右にその相手T・A・C・G（板書 lad）。左は上から下へ5\'→3\'、右は下から上：矢印が逆向きに走る。',
    diagram: { id: 'board-ladder', title: '板書：2本鎖', note: '第2講の黒板 lad、c02-0057・0058・0061' },
    beats: [
      beat('form', S(T3, 'verbatim', ['c02-0056']), [seg('では、いよいよDNAの形です。', 'では、いよいよディーエヌエーの形です。', 'form', { post: 0.3 })]),
      beat('left', S(T3, 'verbatim', ['c02-0057'], { board: ['lad'] }), [
        seg('黒板に、DNAの二本の鎖を書いてみます。', '黒板に、ディーエヌエーの二本の鎖を書いてみます。', 'write', { post: 0.15 }),
        seg('左の鎖にA、T、G、C。', '左の鎖にエー、ティー、ジー、シー。', 'atgc', { post: 0.25 }),
      ]),
      beat('right', S(T3, 'verbatim', ['c02-0058']), [
        same('右の鎖には、それぞれの相手が来ます。', 'mate', { post: 0.1 }),
        seg('AにはT、TにはA、GにはC、CにはG。', 'エーにはティー、ティーにはエー、ジーにはシー、シーにはジー。', 'pairs', { post: 0.3 }),
      ]),
      beat('anti', S(T3, 'verbatim', ['c02-0061']), [
        seg('左の鎖は上から下へ5ダッシュ、3ダッシュ。', '左の鎖は上から下へごダッシュ、さんダッシュ。', 'l53', { post: 0.1 }),
        same('右の鎖は下から上。', 'r53', { post: 0.1 }),
        same('向きが**逆**になっていますね。', 'rev', { post: 0.4 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 560, y: 360, z: 1.0, note: '黒板' },
      { at: 'write', move: 'push', x: 520, y: 360, z: 1.15, dur: 3, note: '鎖が書かれていく' },
      { at: 'pairs', move: 'push', x: 520, y: 380, z: 1.3, dur: 1.5, note: '相手の塩基へ' },
      { at: 'l53', move: 'pan', x: 420, y: 380, z: 1.3, dur: 0.6, note: '左の鎖' },
      { at: 'r53', move: 'whip', x: 640, y: 380, z: 1.3, dur: 0.25, note: '右の鎖' },
      { at: 'rev', move: 'crash', x: 530, y: 360, z: 1.15, dur: 0.22, hold: 0.25, note: '「逆」で急接近' },
    ],
    fx: [{ at: 'r53', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'rev', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'rev', kind: 'focus', dur: 1.0, min: 'gekiga' }, TONE],
    sfx: [{ at: 'write', kind: 'chalk', gain: 0.6 }, { at: 'atgc', kind: 'chalk', gain: 0.5 }, { at: 'pairs', kind: 'chalk', gain: 0.5 }, { at: 'l53', kind: 'whoosh', gain: 0.5 }, { at: 'r53', kind: 'whoosh', gain: 0.5 }, { at: 'rev', kind: 'impact' }],
    shots: [BOARD_BG],
    data: {
      items: [{ id: 'lad', at: 'write', dur: 6 }], map: LAD, lecturerX: 1040
    },
  };
}

function dnaHelix(): SceneDef {
  return {
    id: 'X', title: 'DNAの二重らせん：幅2 nm・1回転3.4 nm', visual: 'dna-helix',
    picture: '縦に立つ右巻きの二重らせんがゆっくり回る。黄色と青の骨格（糖とリン酸）、内側の横棒が塩基対。「幅」で横に2 nmの寸法線、「一回転」で縦に3.4 nm（10塩基対）の寸法線が走る。',
    diagram: { id: 'dna-helix', title: 'B型DNAの二重らせん', note: 'c02-0063・0064、板書 r5：幅2 nm、1回転3.4 nm（10塩基対）。右巻き、主溝と副溝' },
    beats: [
      beat('this', S(T3, 'verbatim', ['c02-0063']), [
        seg('これがDNAの**二重らせん**です。', 'これがディーエヌエーの二重らせんです。', 'this', { post: 0.2 }),
        same('黄色と青が、糖とリン酸の骨格。', 'bb', { post: 0.15 }),
        same('内側の横棒が**塩基対**です。', 'bp', { post: 0.35 }),
      ]),
      beat('size', S(T3, 'verbatim', ['c02-0064'], { board: ['r5'] }), [
        seg('らせんの幅は約2ナノメートル。', 'らせんの幅は約にナノメートル。', 'w', { post: 0.2 }),
        seg('一回転で3.4ナノメートル進みます。', '一回転でさんてんよんナノメートル進みます。', 'pitch', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.15, note: 'らせんの大写し' },
      { at: 'start', move: 'pull', x: 640, y: 360, z: 1.0, dur: 2.2, note: '引いて全体' },
      { at: 'bb', move: 'push', x: 560, y: 330, z: 1.4, dur: 0.6, note: '骨格へ' },
      { at: 'bp', move: 'pan', x: 640, y: 360, z: 1.4, dur: 0.5, note: '塩基対へ' },
      { at: 'w', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.4, note: '幅の寸法線' },
      { at: 'pitch', move: 'push', x: 700, y: 360, z: 1.1, dur: 1.0, note: '1回転の寸法線' },
    ],
    fx: [{ at: 'this', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'this', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'w', kind: 'speed', dur: 0.3, min: 'ultra' }, { at: 'pitch', kind: 'impact', dur: 0.35, min: 'gekiga' }, TONE],
    sfx: [{ at: 'this', kind: 'boom', gain: 0.7 }, { at: 'bb', kind: 'shimmer', gain: 0.4 }, { at: 'w', kind: 'tick' }, { at: 'pitch', kind: 'tick' }, { at: 'pitch+0.4', kind: 'impact', gain: 0.5 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '細胞核の中の暗い水の世界、ゆっくり回り込む。', subject: MOLECULAR + ', the camera slowly orbits', accuracy: 'background only, no helix, ' + NO_TEXT }],
  };
}

function ladder(): SceneDef {
  return {
    id: 'X', title: 'ほどくと、逆平行のはしご', visual: 'ladder',
    picture: '横たわった二重らせんがほどけ、平らなはしごになる。上の鎖に左→右の矢印「5\'→3\'」、下の鎖に右→左の矢印。「逆平行」の筆文字。',
    diagram: { id: 'ladder', title: '逆平行の2本鎖', note: 'c02-0065・0066、板書 r2' },
    beats: [
      beat('flat', S(T3, 'verbatim', ['c02-0065']), [
        same('ほどいて、平らにしてみます。', 'flat', { post: 0.15 }),
        same('はしごのような形になりました。', 'ladder', { post: 0.3 }),
      ]),
      beat('dir', S(T3, 'verbatim', ['c02-0066'], { board: ['r2'] }), [
        seg('上の鎖は左から右へ5ダッシュ、3ダッシュ。', '上の鎖は左から右へごダッシュ、さんダッシュ。', 'top', { post: 0.1 }),
        same('下の鎖はその逆。', 'bot', { post: 0.15 }),
        same('二本の鎖は逆向き、**逆平行**です。', 'anti', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '横たわるらせん' },
      { at: 'flat', move: 'push', x: 640, y: 360, z: 1.1, dur: 2.5, note: 'ほどける' },
      { at: 'top', move: 'pan', x: 700, y: 280, z: 1.25, dur: 1.6, note: '上の鎖に沿って右へ' },
      { at: 'bot', move: 'whip', x: 580, y: 440, z: 1.25, dur: 0.25, note: '下の鎖' },
      { at: 'anti', move: 'crash', x: 640, y: 360, z: 1.15, dur: 0.22, hold: 0.25, note: '「逆平行」で急接近' },
    ],
    fx: [{ at: 'flat', kind: 'speed', dur: 0.5, min: 'ultra' }, { at: 'bot', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'anti', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'anti', kind: 'focus', dur: 1.2, min: 'gekiga' }, { at: 'anti', kind: 'onoma', text: 'ズバッ', x: 1080, y: 150, dur: 0.9, min: 'ultra' }, TONE],
    sfx: [{ at: 'flat', kind: 'riser', gain: 0.5 }, { at: 'ladder', kind: 'impact', gain: 0.5 }, { at: 'top', kind: 'whoosh', gain: 0.5 }, { at: 'bot', kind: 'whoosh', gain: 0.6 }, { at: 'anti', kind: 'boom' }],
    shots: [MOL_BG('暗い水の世界でカメラが横に流れる。', ', the camera tracks sideways')],
  };
}

function basepair(): SceneDef {
  return {
    id: 'X', title: '塩基対：A=T は2本、G≡C は3本の水素結合', visual: 'basepair',
    picture: '塩基対の大写し。上にアデニン–チミン（水素結合2本の点線）、下にグアニン–シトシン（3本）。原子の位置どおり（A N6–H…O4 T、A N1…H–N3 T／G O6…H–N4 C、G N1–H…N3 C、G N2–H…O2 C）。「幅」で両方の対の糖の付け根の間に同じ長さの寸法線（1.08 nm）。',
    diagram: { id: 'basepair', title: 'ワトソン・クリック型塩基対', note: 'c02-0067・0068、板書 r1。プリン（環2つ）とピリミジン（環1つ）が必ず組み、対の幅がそろう' },
    beats: [
      beat('hb', S(T3, 'verbatim', ['c02-0067'], { board: ['r1'] }), [
        same('塩基対に寄ってみましょう。', 'zoom', { post: 0.15 }),
        same('アデニンとチミンは、水素結合が**2本**。', 'at', { post: 0.2 }),
        same('グアニンとシトシンは、**3本**です。', 'gc', { post: 0.35 }),
      ]),
      beat('width', S(T3, 'verbatim', ['c02-0068']), [
        same('プリンは環が二つ、ピリミジンは環が一つ。', 'rings', { post: 0.15 }),
        same('必ずプリンとピリミジンが組むので、', 'pp'),
        seg('塩基対の幅はどれも**1.08ナノメートル**にそろいます。', '塩基対の幅はどれもいってんぜろはちナノメートルにそろいます。', 'same', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 0.8, note: 'はしごの全景から' },
      { at: 'zoom', move: 'push', x: 640, y: 360, z: 1.0, dur: 1.0, note: '塩基対へ寄る' },
      { at: 'at', move: 'push', x: 640, y: 230, z: 1.45, dur: 0.5, note: 'A–T' },
      { at: 'gc', move: 'whip', x: 640, y: 500, z: 1.45, dur: 0.25, note: 'G–Cへ高速パン' },
      { at: 'rings', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '並べる' },
      { at: 'same', move: 'crash', x: 640, y: 380, z: 1.12, dur: 0.22, hold: 0.25, note: '「そろいます」で急接近' },
    ],
    fx: [{ at: 'at', kind: 'focus', dur: 0.9, min: 'gekiga' }, { at: 'gc', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'gc', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'same', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'gc', kind: 'onoma', text: 'ガチッ', x: 1100, y: 600, dur: 0.9, min: 'ultra' }, TONE],
    sfx: [{ at: 'zoom', kind: 'whoosh', gain: 0.5 }, { at: 'at', kind: 'tick' }, { at: 'at+0.3', kind: 'tick' }, { at: 'gc', kind: 'tick' }, { at: 'gc+0.25', kind: 'tick' }, { at: 'gc+0.5', kind: 'tick' }, { at: 'same', kind: 'impact' }],
    shots: [MOL_BG()],
  };
}

function backbone(): SceneDef {
  return {
    id: 'X', title: '骨格：ホスホジエステル結合、5\'→3\'', visual: 'backbone',
    picture: '縦に並ぶ3つのヌクレオチド。糖の3\'炭素から酸素・リン酸・酸素を経て、次の糖の5\'炭素へ。その鎖が光り「ホスホジエステル結合」。最後に下（3\'末端）へ新しいヌクレオチドが加わり、5\'→3\'の矢印。',
    diagram: { id: 'backbone', title: 'ホスホジエステル結合', note: 'c02-0069・0070、板書 r3・c-ph3：3\'炭素―次の5\'リン酸' },
    beats: [
      beat('link', S(T3, 'verbatim', ['c02-0069'], { board: ['r3'] }), [
        same('最後に骨格。', 'bone', { post: 0.15 }),
        seg('3ダッシュの炭素と、次の5ダッシュのリン酸がつながっていく。', 'さんダッシュの炭素と、次のごダッシュのリン酸がつながっていく。', 'link', { post: 0.2 }),
        same('これが**ホスホジエステル結合**です。', 'pde', { post: 0.35 }),
      ]),
      beat('grow', S(T3, 'verbatim', ['c02-0070']), [seg('鎖は、5ダッシュから3ダッシュの方向へ伸びていきます。', '鎖は、ごダッシュからさんダッシュの方向へ伸びていきます。', 'grow', { post: 0.5 })]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '3つのヌクレオチド' },
      { at: 'link', move: 'push', x: 560, y: 340, z: 1.45, dur: 0.8, note: '3\'炭素→リン酸→5\'炭素' },
      { at: 'pde', move: 'crash', x: 700, y: 330, z: 1.12, dur: 0.22, hold: 0.25, note: '「ホスホジエステル結合」で急接近' },
      { at: 'grow', move: 'pan', x: 640, y: 470, z: 1.05, dur: 2.0, note: '下へ伸びる' },
    ],
    fx: [{ at: 'pde', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'pde', kind: 'focus', dur: 1.1, min: 'gekiga' }, { at: 'grow', kind: 'speed', dur: 0.4, min: 'gekiga' }, TONE],
    sfx: [{ at: 'link', kind: 'riser', gain: 0.4 }, { at: 'pde', kind: 'boom', gain: 0.7 }, { at: 'grow', kind: 'whoosh' }, { at: 'grow+1.2', kind: 'impact', gain: 0.5 }],
    shots: [MOL_BG()],
  };
}

const RIGHT = { bx: 2190, by: 230, sx: 140, sy: 70, k: 0.85 };
function examBoard(): SceneDef {
  return {
    id: 'X', title: '試験ポイント', visual: 'board', lecturer: true,
    picture: '黒板の右に「試験ポイント」。A=T（2本）・G≡C（3本）を赤で二重に囲み、逆向き・鎖の中はホスホジエステル結合・鎖の間は水素結合・幅2 nm／1回転3.4 nm（板書 r-h・r1〜r5）。',
    diagram: { id: 'board-exam', title: '板書：試験ポイント', note: '第2講の黒板 r-h・r1〜r5、c02-0072〜0074' },
    beats: [
      beat('n', S(T3, 'verbatim', ['c02-0072'], { board: ['r-h', 'r1'] }), [
        same('まず、水素結合の本数。', 'n', { post: 0.1 }),
        seg('A=Tは2本、G≡Cは3本。', 'エーティーは2本、ジーシーは3本。', 'n23', { post: 0.2 }),
        same('ここ、非常によく問われます。', 'often', { post: 0.3 }),
      ]),
      beat('kinds', S(T3, 'verbatim', ['c02-0073'], { board: ['r2', 'r3', 'r4'] }), [
        same('二本の鎖は逆向き。', 'rev', { post: 0.15 }),
        same('鎖の中は**ホスホジエステル結合**、', 'in'),
        same('鎖と鎖の間は**水素結合**。', 'between', { post: 0.15 }),
        same('結合の種類を入れ替えた選択肢に注意してください。', 'care', { post: 0.3 }),
      ]),
      beat('num', S(T3, 'verbatim', ['c02-0074'], { board: ['r5'] }), [seg('数字では、幅2ナノメートル、一回転3.4ナノメートル。', '数字では、はばにナノメートル、一回転さんてんよんナノメートル。', 'num', { post: 0.45 })]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 560, y: 300, z: 1.0, note: '試験ポイント' },
      { at: 'n23', move: 'crash', x: 480, y: 120, z: 1.6, dur: 0.22, hold: 0.25, note: 'A=T・G≡Cで急接近' },
      { at: 'rev', move: 'pan', x: 480, y: 210, z: 1.35, dur: 0.5, note: '逆向き' },
      { at: 'in', move: 'pan', x: 480, y: 280, z: 1.35, dur: 0.5, note: '鎖の中' },
      { at: 'between', move: 'pan', x: 400, y: 340, z: 1.35, dur: 0.4, note: '鎖の間' },
      { at: 'care', move: 'pull', x: 560, y: 300, z: 1.0, dur: 0.5, note: '並べる' },
      { at: 'num', move: 'push', x: 520, y: 460, z: 1.3, dur: 0.6, note: '数字' },
    ],
    fx: [{ at: 'n23', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'n23', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'care', kind: 'shake', dur: 0.3, min: 'gekiga' }, { at: 'care', kind: 'onoma', text: 'ギクッ', x: 1100, y: 160, dur: 0.9, min: 'ultra' }, TONE],
    sfx: [{ at: 'n', kind: 'chalk', gain: 0.5 }, { at: 'n23', kind: 'impact' }, { at: 'rev', kind: 'chalk', gain: 0.5 }, { at: 'in', kind: 'chalk', gain: 0.5 }, { at: 'between', kind: 'chalk', gain: 0.5 }, { at: 'num', kind: 'chalk', gain: 0.5 }],
    shots: [BOARD_BG],
    data: {
      items: [{ id: 'r-h', at: 'n' }, { id: 'r1', at: 'n23' }, { id: 'r2', at: 'rev' }, { id: 'r3', at: 'in' }, { id: 'r4', at: 'between' }, { id: 'r5', at: 'num' }],
      marks: [{ id: 'r1', at: 'often', color: 'r' }], map: RIGHT, lecturerX: 1100,
    },
  };
}

function tug(): SceneDef {
  return {
    id: 'X', title: 'G-C対が多いほど引き離しにくい', visual: 'tug',
    picture: '2本のDNAを左右から引っ張る綱引き。上はG-C対が多いDNA（横棒に水素結合3本）、下はA-T対が多いDNA（2本）。同じ力で引くと、下のA-Tの多い鎖のほうが先にほどけ、上はこらえる。「引き離しにくく」で上のDNAが光る。',
    diagram: { id: 'tug', title: '塩基対の種類と二本鎖の結びつき', note: 'c02-0076・0079・0084。G-C対は水素結合3本、A-T対は2本' },
    beats: [
      beat('q', S(T3, 'verbatim', ['c02-0076']), [
        seg('G-C対が多いDNAと、A-T対が多いDNA。', 'ジーシー対が多いディーエヌエーと、エーティー対が多いディーエヌエー。', 'q', { post: 0.2 }),
        same('二本鎖を引き離すのに、', 'pull'),
        same('より大きなエネルギーが必要なのはどちらでしょう。', 'which', { post: 0.7 }),
      ]),
      beat('a', S(T3, 'trimmed', ['c02-0079']), [
        seg('G-C対は水素結合が**3本**、A-T対は**2本**。', 'ジーシー対は水素結合が3本、エーティー対は2本。', 'ans', { post: 0.2 }),
        seg('G-C対が多いほど水素結合の総数が多いので、', 'ジーシー対が多いほど水素結合の総数が多いので、', 'total'),
        same('**引き離しにくく**なります。', 'hard', { post: 0.35 }),
      ]),
      beat('think', S(T3, 'trimmed', ['c02-0084']), [seg('本数の暗記で終わらせずに、「だからどうなるか」まで考える。', '本数の暗記で終わらせずに、だからどうなるかまで考える。', 'think', { post: 0.5 })]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '2本のDNA' },
      { at: 'pull', move: 'push', x: 640, y: 360, z: 1.1, dur: 1.5, note: '綱引きが始まる' },
      { at: 'which', move: 'crash', x: 640, y: 360, z: 1.2, dur: 0.22, hold: 0.3, note: '「どちら」で急接近' },
      { at: 'ans', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.4, note: '本数' },
      { at: 'total', move: 'push', x: 640, y: 470, z: 1.3, dur: 0.8, note: 'A-Tの鎖がほどける' },
      { at: 'hard', move: 'whip', x: 640, y: 230, z: 1.3, dur: 0.25, note: 'G-Cの鎖はこらえる' },
      { at: 'think', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: '引く' },
    ],
    fx: [{ at: 'which', kind: 'focus', dur: 1.3, min: 'gekiga' }, { at: 'which', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'total', kind: 'shake', dur: 0.5, min: 'gekiga' }, { at: 'total', kind: 'onoma', text: 'ブチッ', x: 1080, y: 560, dur: 0.9, min: 'gekiga' }, { at: 'hard', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'hard', kind: 'onoma', text: 'ググッ', x: 1080, y: 150, dur: 1.0, min: 'ultra' }, TONE],
    sfx: [{ at: 'pull', kind: 'riser', gain: 0.6 }, { at: 'which', kind: 'boom' }, { at: 'total', kind: 'impact' }, { at: 'hard', kind: 'impact' }, { at: 'think', kind: 'shimmer', gain: 0.4 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '暗い背景に光の筋。', subject: 'abstract dark background, slow streaks of warm light drifting, subtle film grain', accuracy: NO_TEXT }],
  };
}

/* ---------- テーマ4 ---------- */
function digest(): SceneDef {
  return {
    id: 'X', title: '核酸の代謝：ピリミジン→NH₃＋CO₂、プリン→尿酸', visual: 'digest', chapter: T4,
    picture: '食事の核酸（ヌクレオチドの鎖）が小腸に入り、ペントースリン酸と塩基に切り分けられる。塩基は2つの道へ：環1つのピリミジンはNH₃とCO₂へ、環2つのプリンは尿酸の結晶へ。',
    diagram: { id: 'digest', title: 'ヌクレオチド（核酸）の代謝', note: 'スライド22、c02-0086〜0088' },
    beats: [
      beat('food', S(T4, 'verbatim', ['c02-0086'], { slide: 22 }), [
        same('食事でとった核酸は、', 'food'),
        same('小腸でペントースリン酸と塩基に分解されます。', 'split', { post: 0.3 }),
      ]),
      beat('py', S(T4, 'verbatim', ['c02-0087'], { slide: 22 }), [same('吸収された**ピリミジン塩基**は、アンモニアと二酸化炭素に代謝されます。', 'py', { post: 0.3 })]),
      beat('pu', S(T4, 'verbatim', ['c02-0088'], { slide: 22 }), [same('一方、**プリン塩基**は、', 'pu'), same('**尿酸**として排泄されます。', 'ua', { post: 0.4 })]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 420, y: 360, z: 1.15, note: '食事の核酸' },
      { at: 'split', move: 'pan', x: 560, y: 360, z: 1.1, dur: 1.2, note: '小腸で切り分け' },
      { at: 'py', move: 'push', x: 900, y: 230, z: 1.3, dur: 0.6, note: 'ピリミジンの道' },
      { at: 'pu', move: 'whip', x: 900, y: 500, z: 1.3, dur: 0.25, note: 'プリンの道へ高速パン' },
      { at: 'ua', move: 'crash', x: 1040, y: 500, z: 1.6, dur: 0.22, hold: 0.25, note: '「尿酸」で急接近' },
    ],
    fx: [{ at: 'split', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'pu', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'ua', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'ua', kind: 'focus', dur: 1.0, min: 'gekiga' }, TONE],
    sfx: [{ at: 'food', kind: 'whoosh', gain: 0.5 }, { at: 'split', kind: 'impact', gain: 0.7 }, { at: 'py', kind: 'shimmer', gain: 0.4 }, { at: 'pu', kind: 'whoosh', gain: 0.6 }, { at: 'ua', kind: 'boom', gain: 0.7 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '体の中の暖かく暗い世界。', subject: 'a dark warm organic interior, soft glowing particles flowing slowly, warm rim light', accuracy: 'background only, no organs in focus, ' + NO_TEXT }],
  };
}

function gout(): SceneDef {
  return {
    id: 'X', title: '尿酸 → 痛風／食べた核酸はそのまま使わない', visual: 'gout',
    picture: '足の側面図。血中の尿酸の粒が増え、親指の付け根の関節に針状の結晶が沈着し、関節が赤く脈打つ（痛風）。人物の顔は描かない。続いて、食べた核酸の鎖が「自分のDNA・RNA」へ直接は入れず✕、小さな材料から新しく合成される。',
    diagram: { id: 'gout', title: '尿酸と痛風、核酸は新しく合成する', note: 'スライド22、c02-0089・0090' },
    beats: [
      beat('gout', S(T4, 'verbatim', ['c02-0089'], { slide: 22 }), [
        same('尿酸は関節に沈着しやすいので、', 'dep'),
        same('血中の尿酸値が高いと、', 'high'),
        same('関節炎を起こす**痛風**の原因になります。', 'gout', { post: 0.4 }),
      ]),
      beat('new', S(T4, 'trimmed', ['c02-0090'], { slide: 22, board: ['r8'] }), [
        seg('吸収した核酸を、自分のDNAやRNAとしてそのまま使うことはありません。', '吸収した核酸を、自分のディーエヌエーやアールエヌエーとしてそのまま使うことはありません。', 'no', { post: 0.2 }),
        same('必ず**新しく合成**して使います。', 'new', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 380, z: 1.0, note: '足の側面' },
      { at: 'high', move: 'push', x: 760, y: 420, z: 1.3, dur: 1.2, note: '親指の付け根へ' },
      { at: 'gout', move: 'crash', x: 860, y: 470, z: 1.9, dur: 0.22, hold: 0.3, note: '「痛風」で関節へ急接近' },
      { at: 'no', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.45, note: '核酸の鎖へ' },
      { at: 'new', move: 'push', x: 640, y: 400, z: 1.05, dur: 0.8, note: '新しく合成' },
    ],
    fx: [{ at: 'gout', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'gout', kind: 'shake', dur: 0.4, min: 'gekiga' }, { at: 'gout', kind: 'onoma', text: 'ズキッ', x: 1080, y: 170, dur: 1.1, min: 'gekiga' }, { at: 'gout', kind: 'invert', dur: 0.1, min: 'ultra' }, { at: 'no', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'new', kind: 'flash', dur: 0.3, min: 'gekiga' }, TONE],
    sfx: [{ at: 'dep', kind: 'tick' }, { at: 'high', kind: 'riser', gain: 0.5 }, { at: 'gout', kind: 'heartbeat' }, { at: 'gout+0.4', kind: 'boom', gain: 0.6 }, { at: 'no', kind: 'impact', gain: 0.6 }, { at: 'new', kind: 'shimmer' }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '暗い赤みを帯びた体の内側の世界。', subject: 'a dark reddish organic interior, slow pulsing glow, particles drifting', accuracy: 'background only, no body parts, no faces, ' + NO_TEXT },
      { id: 'b', from: 'no', mode: 'background', desc: '暗い空間に光の粒が集まる。', subject: 'abstract dark space, small glowing particles gathering and assembling slowly', accuracy: 'background only, ' + NO_TEXT }],
  };
}

const RIGHT2 = { bx: 2190, by: 230, sx: 160, sy: 50, k: 0.62 };
function uricBoard(): SceneDef {
  return {
    id: 'X', title: '黒板：プリン→尿酸（痛風）', visual: 'board', lecturer: true,
    picture: '試験ポイントの下に「プリン→尿酸（痛風）」「ピリミジン→NH₃＋CO₂」「食事の核酸はそのまま再利用しない」（板書 r6〜r8）。「線を引いて」でプリン→尿酸に赤い下線。',
    diagram: { id: 'board-uric', title: '板書：核酸の代謝', note: '第2講の黒板 r6・r7・r8、c02-0091・0092' },
    beats: [
      beat('w', S(T4, 'verbatim', ['c02-0091'], { board: ['r6', 'r7', 'r8'] }), [
        same('黒板にも書いておきます。', 'w', { post: 0.15 }),
        same('プリンは尿酸、そして痛風。', 'pu', { post: 0.15 }),
        same('ピリミジンはアンモニアと二酸化炭素。', 'py', { post: 0.15 }),
        same('食べた核酸は、そのまま自分の遺伝子にはならない。', 'eat', { post: 0.3 }),
      ]),
      beat('line', S(T4, 'verbatim', ['c02-0092']), [same('プリンと尿酸。', 'line', { post: 0.1 }), same('ここに線を引いておきましょう。', 'under', { post: 0.45 })]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 560, y: 330, z: 1.0, note: '黒板の右' },
      { at: 'pu', move: 'push', x: 440, y: 400, z: 1.45, dur: 0.6, note: 'プリン→尿酸' },
      { at: 'py', move: 'pan', x: 440, y: 450, z: 1.45, dur: 0.5, note: 'ピリミジン' },
      { at: 'eat', move: 'pan', x: 480, y: 500, z: 1.4, dur: 0.5, note: '食事の核酸' },
      { at: 'line', move: 'crash', x: 420, y: 410, z: 1.7, dur: 0.22, hold: 0.25, note: '「プリンと尿酸」で急接近' },
    ],
    fx: [{ at: 'line', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'under', kind: 'focus', dur: 1.0, min: 'gekiga' }, TONE],
    sfx: [{ at: 'pu', kind: 'chalk', gain: 0.6 }, { at: 'py', kind: 'chalk', gain: 0.6 }, { at: 'eat', kind: 'chalk', gain: 0.6 }, { at: 'line', kind: 'impact', gain: 0.7 }, { at: 'under', kind: 'chalk', gain: 0.7 }],
    shots: [BOARD_BG],
    data: {
      items: [{ id: 'r-h', at: 'start-1' }, { id: 'r1', at: 'start-1' }, { id: 'r2', at: 'start-1' }, { id: 'r3', at: 'start-1' }, { id: 'r4', at: 'start-1' }, { id: 'r5', at: 'start-1' }, { id: 'r6', at: 'pu' }, { id: 'r7', at: 'py' }, { id: 'r8', at: 'eat' }],
      marks: [{ id: 'r6', at: 'under+0.3', color: 'r', kind: 'under' }], map: RIGHT2, lecturerX: 1110,
    },
  };
}

/* ---------- まとめ ---------- */
function summary(): SceneDef {
  return {
    id: 'X', title: '今日のまとめ：4つ', visual: 'board', lecturer: true, chapter: 'まとめ',
    picture: '黒板の下段に「今日のまとめ」①〜④（板書 sum-h・s1〜s4）。読み上げに合わせて1行ずつ書かれ、言い終わるごとに下線。',
    diagram: { id: 'board-summary4', title: '板書：今日のまとめ', note: '第2講の黒板 sum-h・s1〜s4、c02-0104〜0108' },
    beats: [
      beat('four', S('まとめ', 'verbatim', ['c02-0104'], { board: ['sum-h'] }), [same('今日覚えてほしいのは、この4つです。', 'four', { post: 0.3 })]),
      beat('p1', S('まとめ', 'verbatim', ['c02-0105'], { board: ['s1'] }), [
        same('ひとつ目。', 'p1', { post: 0.1 }),
        seg('ヌクレオチドは塩基と五炭糖とリン酸。', 'ヌクレオチドは塩基とごたんとうとリン酸。', 'p1b', { post: 0.15 }),
        same('リン酸がなければ**ヌクレオシド**。', 'p1c', { post: 0.3 }),
      ]),
      beat('p2', S('まとめ', 'verbatim', ['c02-0106'], { board: ['s2'] }), [
        same('ふたつ目。', 'p2', { post: 0.1 }),
        seg('プリンはAとG、ピリミジンはCとTとU。', 'プリンはエーとジー、ピリミジンはシーとティーとユー。', 'p2b', { post: 0.15 }),
        seg('RNAではTの代わりに**U**。', 'アールエヌエーではティーの代わりにユー。', 'p2c', { post: 0.3 }),
      ]),
      beat('p3', S('まとめ', 'verbatim', ['c02-0107'], { board: ['s3'] }), [
        same('みっつ目。', 'p3', { post: 0.1 }),
        seg('二本鎖は逆向きで、A=Tは2本、G≡Cは3本の水素結合。', '二本鎖は逆向きで、エーティーは2本、ジーシーは3本の水素結合。', 'p3b', { post: 0.3 }),
      ]),
      beat('p4', S('まとめ', 'verbatim', ['c02-0108'], { board: ['s4'] }), [
        same('そして、プリンの代謝産物は**尿酸**。', 'p4', { post: 0.1 }),
        same('痛風につながります。', 'p4b', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: 'まとめの板書' },
      { at: 'p1', move: 'push', x: 560, y: 190, z: 1.3, dur: 0.6, note: '①へ' },
      { at: 'p2', move: 'pan', x: 560, y: 285, z: 1.3, dur: 0.5, note: '②へ' },
      { at: 'p3', move: 'pan', x: 560, y: 380, z: 1.3, dur: 0.5, note: '③へ' },
      { at: 'p4', move: 'pan', x: 560, y: 475, z: 1.3, dur: 0.5, note: '④へ' },
      { at: 'p4b+1.2', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.5, note: '4つを並べて引く' },
    ],
    fx: [{ at: 'p1', kind: 'impact', dur: 0.3, min: 'ultra' }, { at: 'p4b+1.2', kind: 'focus', dur: 0.9, min: 'gekiga' }, TONE],
    sfx: [{ at: 'four', kind: 'chalk', gain: 0.5 }, { at: 'p1', kind: 'chalk', gain: 0.5 }, { at: 'p2', kind: 'chalk', gain: 0.5 }, { at: 'p3', kind: 'chalk', gain: 0.5 }, { at: 'p4', kind: 'chalk', gain: 0.5 }, { at: 'p4b+1.2', kind: 'impact', gain: 0.6 }],
    shots: [{ ...BOARD_BG, desc: '夜の講義室。光がゆっくり強くなる。', subject: HALL + ', the light slowly grows warmer' }],
    data: {
      items: [
        { id: 'sum-h', at: 'four', x: 130, y: 70, k: 0.85 },
        { id: 's1', at: 'p1', x: 130, y: 165, k: 0.6 }, { id: 's2', at: 'p2', x: 130, y: 260, k: 0.6 },
        { id: 's3', at: 'p3', x: 130, y: 355, k: 0.6 }, { id: 's4', at: 'p4', x: 130, y: 450, k: 0.6 },
      ],
      marks: [{ id: 's1', at: 'p1c+1.2', color: 'y', kind: 'under' }, { id: 's2', at: 'p2c+1.2', color: 'y', kind: 'under' }, { id: 's3', at: 'p3b+2.5', color: 'y', kind: 'under' }, { id: 's4', at: 'p4b', color: 'r', kind: 'under' }],
      lecturerX: 1150, lecturerFace: -1,
    },
  };
}

function endCard(): SceneDef {
  return {
    id: 'X', title: '次回：第3講', visual: 'end-card',
    picture: '「次回 第3講」の判。長いDNAを核にしまう＝染色体（2本の姉妹染色分体）の影。黒にフェードアウト。',
    diagram: { id: 'end', title: '次回予告', note: 'c02-0109' },
    beats: [beat('next', S('まとめ', 'trimmed', ['c02-0109']), [
      same('次の第3講では、', 'next'),
      seg('この長いDNAを、どうやって細胞の核にしまっているのか。', 'この長いディーエヌエーを、どうやって細胞の核にしまっているのか。', 'what', { post: 0.2 }),
      same('**染色体**の話に進みます。', 'chr', { post: 1.0 }),
    ])],
    cams: [{ at: 'start', move: 'set', x: 640, y: 360, z: 1.15, note: '予告' }, { at: 'start', move: 'pull', x: 640, y: 360, z: 1.0, dur: 6, note: 'ゆっくり引いて終わる' }],
    fx: [{ at: 'next', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'chr', kind: 'focus', dur: 1.0, min: 'gekiga' }, TONE],
    sfx: [{ at: 'next', kind: 'impact', gain: 0.6 }, { at: 'chr', kind: 'shimmer', gain: 0.5 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '漆黒に墨がゆっくり広がる。', subject: 'pitch black void, sumi ink spreading slowly, gentle', accuracy: NO_TEXT }],
    data: { no: '次回 第3講', l1: '長いDNAを、核にどうしまう？', l1At: 'what', l2: '染色体', l2At: 'chr', pic: 'chromosome' },
  };
}

/** the whole of 第2講, in lecture order */
export function lecture2Film(): SceneDef[] {
  const scenes = [titleOpen(), monomers(), unitBoard(), nucleotide(), sidoBoard(), sugar(), bases(), ntp(), ladderBoard(), dnaHelix(), ladder(), basepair(), backbone(), examBoard(), tug(), digest(), gout(), uricBoard(), summary(), endCard()];
  scenes.forEach((s, i) => { s.id = `S${String(i + 1).padStart(2, '0')}`; });
  return scenes;
}

export const FILM2_RATIONALE = [
  '第2講「核酸の化学とDNAの二重らせん」を、講義の順（導入 → テーマ1〜4 → まとめ）に1本の劇画授業映像にした完成版。確認問題の選択肢の解説は省き、考える問題（G-C対とA-T対）は本文として残した。',
  '台詞はすべて第2講の講義台詞（narrations/lecture-02.json）の原文、またはその一部。板書は講義の黒板の文字をそのまま使う。',
  '医学図：ヌクレオチド（リン酸は糖の5\'、塩基は1\'）、リボース／2-デオキシリボース（2\'のOH→H）、プリン（環2つ：A・G）とピリミジン（環1つ：C・T・U、TとUの違いは5位のメチル基）、右巻きの二重らせん（幅2 nm・1回転3.4 nm＝10塩基対）、逆平行、ワトソン・クリック型塩基対（A=T 2本・G≡C 3本、幅1.08 nm）、ホスホジエステル結合（3\'–O–P–O–5\'）、プリン→尿酸・ピリミジン→NH₃＋CO₂、痛風（顔は描かない）。',
];
