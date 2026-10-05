/**
 * 遺伝医学｜遺伝子の基礎 第5講「ゲノムの変異・多型と動く遺伝子」— the whole lecture as one gekiga film (完成版).
 *
 *   導入      title → 置換・挿入・欠失・染色体異常
 *   テーマ1   板書 → 置換の結果4通り（ナンセンス・ミスセンス・サイレント・センス）→ 板書「向きが逆」→ コドンの変化 → 読み枠のずれ → 一塩基多型
 *   テーマ2   アルコールの代謝（ADH・ALDH・アセトアルデヒド）→ 板書 → ALDH2 487番 Glu→Lys と GG/AG/AA → 板書「訓練では変わらない」
 *   テーマ3   トランスポゾン（DNA型・レトロ型、マクリントック、ゲノムの約45%）→ カット&ペーストとコピー&ペースト → 板書
 *             → 偽遺伝子2種 → レトロ転移の動き → 板書 → 挿入と遺伝性疾患 → 板書
 *   まとめ    今日覚えてほしい4つ → 次回予告（第6講：エピゲノム）
 *
 * Every spoken line is a cue of narrations/lecture-05.json, verbatim or a contiguous part of it (tests check).
 */
import type { SceneDef } from '../types';
import { beat, board, DARK_BG, endScene, fig, lecture, numbered, same, seg, summaryScene, titleScene, WARM_BG } from './kit';

const S = lecture('genetics-basics', 5);
const T1 = 'テーマ1　置換で何が起こるか', T2 = 'テーマ2　飲酒と遺伝子多型', T3 = 'テーマ3　動く遺伝子';
export const FILM5_KEY = 'genetics-basics:5:film';
const D = (s: string) => s.replace(/DNA/g, 'ディーエヌエー').replace(/mRNA/g, 'メッセンジャーアールエヌエー').replace(/RNA/g, 'アールエヌエー').replace(/ALDH2/g, 'エーエルディーエイチツー').replace(/ALDH/g, 'エーエルディーエイチ').replace(/ADH2/g, 'エーディーエイチツー').replace(/ADH/g, 'エーディーエイチ').replace(/\*\*/g, '').replace(/[「」]/g, '');

const title = () => titleScene({
  no: '第5講', title: ['ゲノムの変異・多型と', '動く遺伝子'],
  picture: '漆黒に墨が爆ぜ、二重らせんの影が回る。「ゲノムの変異・多型と動く遺伝子」の筆文字。',
  beats: [
    beat('open', S('導入', 'verbatim', ['0001']), [same('第5講です。', 'title', { post: 0.2 }), same('前回は、遺伝子がどう読まれてタンパク質になるのかを見ました。', 'prev', { post: 0.3 })]),
    beat('today', S('導入', 'verbatim', ['0002']), [same('今日は、その設計図の文字が変わったら、何が起こるのか。', 'what', { post: 0.15 }), same('病気の原因になる変化もあれば、お酒の強さのような「個性」になる変化もあります。', 'trait', { post: 0.5 })]),
  ],
  subs: [{ text: '設計図の文字が変わったら？', at: 'what', y: 505 }, { text: '病気の原因にも、「個性」にもなる', at: 'trait', y: 552, color: 'y' }],
});

const mutTypes = () => fig('mut-types', {
  title: '置換・挿入・欠失、そして染色体異常',
  picture: '塩基の列が4段。1文字が別の文字に置き換わる（置換）、余分な1文字が入り込む（挿入）、1文字が抜け落ちる（欠失）。最後に、もっと大きな変化として染色体ごとの異常。',
  note: 'スライド57、c05-0010〜0013',
  beats: [beat('kinds', S('全体像', 'verbatim', ['0010', '0011', '0012', '0013'], { slide: 57 }), [
    same('塩基対が別の塩基対に置き換わるのが**置換**。', 'sub', { post: 0.2 }),
    same('余分な塩基が入り込むのが**挿入**、', 'ins'),
    same('抜け落ちるのが**欠失**。', 'del', { post: 0.2 }),
    same('もっと大きな変化が、第3講で見た**染色体異常**です。', 'chr', { post: 0.45 }),
  ])],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 150, z: 1.4, note: '置換' },
    { at: 'ins', move: 'pan', x: 640, y: 260, z: 1.4, dur: 0.5, note: '挿入' },
    { at: 'del', move: 'pan', x: 640, y: 370, z: 1.4, dur: 0.5, note: '欠失' },
    { at: 'chr', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '染色体異常' },
  ],
  fx: [{ at: 'sub', kind: 'impact', dur: 0.3, min: 'gekiga' }, { at: 'chr', kind: 'impact', dur: 0.45, min: 'gekiga' }],
  sfx: [{ at: 'sub', kind: 'tick' }, { at: 'ins', kind: 'tick' }, { at: 'del', kind: 'tick' }, { at: 'chr', kind: 'boom', gain: 0.6 }],
});

const L = { bx: 90, by: 230, sx: 150, sy: 70, k: 0.62 };
const kindsBoard = () => board({
  title: '板書：変異の種類、置換の結果は4通り', chapter: T1, note: '第5講の黒板 l-h・l1〜l3、c05-0015',
  picture: '黒板の左「変異の種類」：置換・挿入・欠失（＋染色体異常：数的・構造的）／置換の結果は4通り。',
  beats: [beat('four', S(T1, 'verbatim', ['0015'], { board: ['l3'] }), [same('では、1つの塩基が置き換わると、タンパク質はどうなるか。', 'q', { post: 0.15 }), same('結果は**4通り**あります。', 'four', { post: 0.4 })])],
  items: [{ id: 'l-h', at: 'start-1' }, { id: 'l1', at: 'start-1' }, { id: 'l2', at: 'start-1' }, { id: 'l3', at: 'four' }],
  map: L,
  cams: [{ at: 'start', move: 'set', x: 560, y: 220, z: 1.0, note: '板書' }, { at: 'four', move: 'crash', x: 400, y: 280, z: 1.6, dur: 0.22, hold: 0.25, note: '4通り' }],
  fx: [{ at: 'four', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'four', kind: 'chalk', gain: 0.7 }],
});

const outcomes = () => fig('sub-outcomes', {
  title: '置換の結果：ナンセンス・ミスセンス・サイレント・センス',
  picture: '4枚のカード。ナンセンス：アミノ酸のコドン→終止コドン。ミスセンス：別のアミノ酸へ（保存的 Asp→Glu／非保存的 Arg→Gly）。サイレント：AGA↔CGA、どちらもアルギニン。センス：終止コドン→アミノ酸のコドン。下に「1つのアミノ酸に複数のコドン」。',
  note: 'スライド55、c05-0017〜0021',
  beats: [
    beat('non', S(T1, 'verbatim', ['0017'], { slide: 55 }), [same('**ナンセンス変異**は、アミノ酸のコドンが終止コドンに変わるもの。', 'non', { post: 0.25 })]),
    beat('mis', S(T1, 'verbatim', ['0018'], { slide: 55 }), [same('**ミスセンス変異**は、別のアミノ酸に変わるもの。', 'mis', { post: 0.15 }), seg('似た性質への保存的置換と、違う性質への非保存的置換があります。', '似た性質への保存てき置換と、違う性質への非保存てき置換があります。', 'cons', { post: 0.25 })]),
    beat('sil', S(T1, 'verbatim', ['0019'], { slide: 55 }), [same('**サイレント変異**は、コドンが変わってもアミノ酸が同じもの。', 'sil', { post: 0.1 }), seg('例えば、アルギニンのAGAとCGA。', '例えば、アルギニンのエージーエーとシージーエー。', 'arg', { post: 0.25 })]),
    beat('sen', S(T1, 'verbatim', ['0020'], { slide: 55 }), [same('**センス変異**は逆に、終止コドンが別のアミノ酸のコドンに変わるものです。', 'sen', { post: 0.25 })]),
    beat('table', S(T1, 'verbatim', ['0021'], { slide: 55 }), [same('下のコドン表のように、一つのアミノ酸に複数のコドンがある。', 'table', { post: 0.1 }), same('だからサイレント変異が起こるんです。', 'why', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: '4枚' },
    { at: 'non', move: 'push', x: 190, y: 280, z: 1.6, dur: 0.5, note: 'ナンセンス' },
    { at: 'mis', move: 'whip', x: 490, y: 280, z: 1.6, dur: 0.25, note: 'ミスセンス' },
    { at: 'sil', move: 'whip', x: 790, y: 280, z: 1.6, dur: 0.25, note: 'サイレント' },
    { at: 'sen', move: 'whip', x: 1090, y: 280, z: 1.6, dur: 0.25, note: 'センス' },
    { at: 'table', move: 'pull', x: 640, y: 350, z: 1.0, dur: 0.5, note: 'コドン表' },
  ],
  fx: [{ at: 'non', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'mis', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'sil', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'sen', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'why', kind: 'focus', dur: 0.9, min: 'gekiga' }],
  sfx: [{ at: 'non', kind: 'impact', gain: 0.6 }, { at: 'mis', kind: 'whoosh', gain: 0.5 }, { at: 'sil', kind: 'whoosh', gain: 0.5 }, { at: 'sen', kind: 'whoosh', gain: 0.5 }, { at: 'table', kind: 'shimmer', gain: 0.4 }],
  shots: [DARK_BG()],
});

const fourBoard = () => board({
  title: 'ナンセンスとセンスは向きが逆', note: '第5講の黒板 l4〜l7（l4に赤丸）、c05-0022・0023',
  picture: '黒板の左：ナンセンス … 終止コドンへ／ミスセンス … 別のアミノ酸へ（保存的 Asp⇔Glu／非保存的）／サイレント … アミノ酸は不変／センス … 終止コドンから別のアミノ酸へ。ナンセンスを赤で囲み、「向きが逆」の筆文字。',
  beats: [
    beat('w', S(T1, 'verbatim', ['0022'], { board: ['l4', 'l5', 'l5b', 'l6', 'l7'] }), [same('黒板に整理します。', 'w', { post: 0.1 }), same('ナンセンスは終止へ。', 'l4', { post: 0.1 }), same('ミスセンスは別のアミノ酸へ。', 'l5', { post: 0.1 }), same('サイレントは変わらない。', 'l6', { post: 0.1 }), same('センスは終止から。', 'l7', { post: 0.25 })]),
    beat('rev', S(T1, 'verbatim', ['0023']), [same('ナンセンスとセンスは、**向きが逆**です。', 'rev', { post: 0.15 }), same('ここ、非常に紛らわしいので、赤で囲んでおきます。', 'red', { post: 0.4 })]),
  ],
  items: [{ id: 'l-h', at: 'start-1' }, { id: 'l1', at: 'start-1' }, { id: 'l2', at: 'start-1' }, { id: 'l3', at: 'start-1' }, { id: 'l4', at: 'l4' }, { id: 'l5', at: 'l5' }, { id: 'l5b', at: 'l5+0.8' }, { id: 'l6', at: 'l6' }, { id: 'l7', at: 'l7' }],
  marks: [{ id: 'l4', at: 'red+0.3', color: 'r' }, { id: 'l7', at: 'red+0.6', color: 'r' }],
  slams: [{ text: '向きが逆', at: 'rev', x: 900, y: 360, size: 72, color: '#ff6a55', band: true }],
  map: L,
  cams: [{ at: 'start', move: 'set', x: 560, y: 330, z: 1.0, note: '板書' }, { at: 'l4', move: 'push', x: 420, y: 330, z: 1.4, dur: 0.6, note: '4通り' }, { at: 'rev', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.4, note: '向きが逆' }],
  fx: [{ at: 'rev', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'rev', kind: 'shake', dur: 0.3, min: 'gekiga' }],
  sfx: [{ at: 'l4', kind: 'chalk', gain: 0.5 }, { at: 'l5', kind: 'chalk', gain: 0.5 }, { at: 'l6', kind: 'chalk', gain: 0.5 }, { at: 'l7', kind: 'chalk', gain: 0.5 }, { at: 'rev', kind: 'boom', gain: 0.7 }],
});

const codonChange = () => fig('codon-change', {
  title: 'コドンの変化：サイレント・保存的／非保存的ミスセンス',
  picture: '2本鎖の5番目のA–T対がC–G対に置き換わる（置換）。続いてコドンのカード：アルギニンのCGA→AGAでもアルギニン（サイレント）、アスパラギン酸のGAC→GAAでグルタミン酸（似た性質＝保存的ミスセンス）、アルギニン→グリシン（違う性質＝非保存的ミスセンス）。',
  note: 'c05-0024〜0029。標準遺伝暗号：CGA・AGA Arg、GAC Asp、GAA Glu、GGA Gly',
  beats: [
    beat('see', S(T1, 'verbatim', ['0024']), [same('実際にコドンがどう変わるのか、動きで見てみましょう。', 'see', { post: 0.1 }), same('正常な塩基対です。', 'norm', { post: 0.25 })]),
    beat('sub', S(T1, 'verbatim', ['0025']), [seg('5番目の、AとTの対が、CとGの対に置き換わりました。', '5番目の、エーとティーの対が、シーとジーの対に置き換わりました。', 'sub', { post: 0.1 }), same('これが**置換**。', 'subn', { post: 0.25 })]),
    beat('sil', S(T1, 'verbatim', ['0026', '0027']), [seg('アルギニンのCGAが、AGAに変わっても……', 'アルギニンのシージーエーが、エージーエーに変わっても', 'cga', { post: 0.2 }), same('やはりアルギニン。', 'arg', { post: 0.1 }), same('これが**サイレント変異**です。', 'sil', { post: 0.25 })]),
    beat('cons', S(T1, 'verbatim', ['0028']), [seg('アスパラギン酸のGACがGAAになると、グルタミン酸に。', 'アスパラギン酸のジーエーシーがジーエーエーになると、グルタミン酸に。', 'asp', { post: 0.1 }), seg('似た性質への、**保存的**なミスセンス変異。', '似た性質への、保存てきなミスセンス変異。', 'cons', { post: 0.25 })]),
    beat('non', S(T1, 'verbatim', ['0029']), [seg('アルギニンがグリシンに変わるのは、性質の違う、**非保存的**なミスセンス変異。', 'アルギニンがグリシンに変わるのは、性質の違う、非保存てきなミスセンス変異。', 'gly', { post: 0.4 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 200, z: 1.2, note: '塩基対' },
    { at: 'sub', move: 'crash', x: 560, y: 200, z: 1.6, dur: 0.22, hold: 0.25, note: '5番目' },
    { at: 'cga', move: 'pull', x: 640, y: 380, z: 1.05, dur: 0.5, note: 'コドンのカード' },
    { at: 'asp', move: 'pan', x: 640, y: 420, z: 1.1, dur: 0.5, note: '保存的' },
  ],
  fx: [{ at: 'sub', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'arg', kind: 'flash', dur: 0.25, min: 'gekiga' }, { at: 'gly', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'sub', kind: 'impact' }, { at: 'cga', kind: 'tick' }, { at: 'arg', kind: 'shimmer', gain: 0.4 }, { at: 'asp', kind: 'tick' }, { at: 'gly', kind: 'impact', gain: 0.6 }],
});

const frameshift = () => fig('frameshift', {
  title: 'ナンセンス変異と、読み枠のずれ',
  picture: 'リボソームが読み進むmRNA。途中のコドンが終止コドンに変わると、そこで合成が止まる（ナンセンス）。次に1塩基が挿入されると3文字ずつの区切りが1つずれ、その後のアミノ酸がすべて変わる。',
  note: 'c05-0030〜0032。例：CGA（Arg）→UGA（終止）、1塩基挿入で読み枠がずれる',
  beats: [
    beat('non', S(T1, 'verbatim', ['0030']), [same('そして、アミノ酸のコドンが終止コドンに変わると、そこでタンパク質の合成が止まってしまいます。', 'stop', { post: 0.1 }), same('**ナンセンス変異**です。', 'non', { post: 0.3 })]),
    beat('fs', S(T1, 'verbatim', ['0031']), [same('最後は補足ですが、1塩基の挿入や欠失。', 'ins', { post: 0.15 }), same('コドンの区切り、**読み枠**がずれて、その後のアミノ酸がすべて変わってしまいます。', 'shift', { post: 0.25 })]),
    beat('size', S(T1, 'verbatim', ['0032']), [same('同じ1文字の変化でも、置換と挿入・欠失では、影響の大きさが違うわけです。', 'size', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 220, z: 1.1, note: '翻訳' },
    { at: 'non', move: 'crash', x: 640, y: 200, z: 1.35, dur: 0.22, hold: 0.25, note: '止まる' },
    { at: 'ins', move: 'pull', x: 640, y: 420, z: 1.05, dur: 0.5, note: '挿入' },
    { at: 'size', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '比べる' },
  ],
  fx: [{ at: 'non', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'non', kind: 'onoma', text: 'ブツッ', x: 1080, y: 150, dur: 0.9, min: 'gekiga' }, { at: 'shift', kind: 'speed', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'stop', kind: 'tick' }, { at: 'non', kind: 'impact' }, { at: 'ins', kind: 'tick' }, { at: 'shift', kind: 'whoosh' }],
});

const snp = () => fig('snp-count', {
  title: '一人のゲノムの違い：一塩基多型 約347万、アミノ酸が変わるのは約1万',
  picture: '1本のゲノムの帯に、無数の細い印（一塩基多型、ワトソン博士で約347万か所）。そのうちアミノ酸が変わる印（約1万か所）だけが赤い。大部分は病気ではなく「個性」＝多型。',
  note: 'スライド56、c05-0038〜0041',
  beats: [
    beat('q', S(T1, 'trimmed', ['0038'], { slide: 56 }), [same('一人の人のゲノムには、どれくらいの違いがあるのか。', 'q', { post: 0.25 })]),
    beat('snp', S(T1, 'verbatim', ['0039'], { slide: 56 }), [seg('**一塩基多型**は、ワトソン博士で約347万か所。', 'いちえんきたけいは、ワトソン博士で約さんびゃくよんじゅうななまんかしょ。', 'snp', { post: 0.25 })]),
    beat('aa', S(T1, 'verbatim', ['0040'], { slide: 56 }), [seg('そのうち、アミノ酸が変わるものは約1万か所です。', 'そのうち、アミノ酸が変わるものは約いちまんかしょです。', 'aa', { post: 0.25 })]),
    beat('poly', S(T1, 'verbatim', ['0041'], { slide: 56 }), [same('こうした違いの大部分は、病気ではなく、一人一人の個性、つまり**多型**です。', 'poly', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: 'ゲノムの帯' },
    { at: 'snp', move: 'push', x: 640, y: 300, z: 1.3, dur: 1.5, note: '無数の印' },
    { at: 'aa', move: 'crash', x: 500, y: 300, z: 1.6, dur: 0.22, hold: 0.25, note: '赤い印' },
    { at: 'poly', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.5, note: '個性' },
  ],
  fx: [{ at: 'snp', kind: 'flash', dur: 0.25, min: 'gekiga' }, { at: 'aa', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'poly', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'snp', kind: 'shimmer', gain: 0.5 }, { at: 'aa', kind: 'impact', gain: 0.6 }, { at: 'poly', kind: 'shimmer', gain: 0.4 }],
  shots: [DARK_BG()],
});

const alcohol = () => fig('alcohol', {
  title: 'アルコール → ADH → アセトアルデヒド → ALDH → 酢酸',
  chapter: T2,
  picture: 'アルコールの分子が、ADHでアセトアルデヒドに、ALDHで酢酸に、最後に二酸化炭素と水になる流れ。毒性の強いアセトアルデヒドが赤く脈打ち、「顔が赤くなる・気分が悪くなる原因」。人物の顔は描かない。ADH2には日本人でも多型。',
  note: 'スライド58、c05-0042〜0045',
  beats: [
    beat('q', S(T2, 'trimmed', ['0042'], { slide: 58 }), [same('その個性の代表例が、お酒の強さです。', 'q', { post: 0.25 })]),
    beat('path', S(T2, 'verbatim', ['0043'], { slide: 58 }), [seg('アルコールは、**ADH**でアセトアルデヒドに、', D('アルコールは、ADHでアセトアルデヒドに、'), 'adh'), seg('**ALDH**で酢酸になります。', D('ALDHで酢酸になります。'), 'aldh', { post: 0.25 })]),
    beat('tox', S(T2, 'verbatim', ['0044'], { slide: 58 }), [same('問題は**アセトアルデヒド**。', 'ach', { post: 0.1 }), same('毒性が強く、顔が赤くなったり、気持ちが悪くなる原因です。', 'tox', { post: 0.25 })]),
    beat('adh2', S(T2, 'verbatim', ['0045'], { slide: 58 }), [seg('ADHのうち、ADH2には日本人でも遺伝子多型があります。', D('ADHのうち、ADH2には日本人でも遺伝子多型があります。'), 'adh2', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 300, z: 1.0, note: '代謝の流れ' },
    { at: 'adh', move: 'push', x: 380, y: 280, z: 1.35, dur: 0.6, note: 'ADH' },
    { at: 'aldh', move: 'pan', x: 860, y: 280, z: 1.35, dur: 0.6, note: 'ALDH' },
    { at: 'ach', move: 'crash', x: 560, y: 280, z: 1.6, dur: 0.22, hold: 0.3, note: 'アセトアルデヒド' },
    { at: 'adh2', move: 'pull', x: 640, y: 320, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'ach', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'ach', kind: 'focus', dur: 1.2, min: 'gekiga' }, { at: 'tox', kind: 'onoma', text: 'ドクン', x: 1080, y: 160, dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'adh', kind: 'whoosh', gain: 0.5 }, { at: 'aldh', kind: 'whoosh', gain: 0.5 }, { at: 'ach', kind: 'boom', gain: 0.6 }, { at: 'tox', kind: 'heartbeat' }],
  shots: [WARM_BG()],
});

const C = { bx: 1120, by: 230, sx: 140, sy: 70, k: 0.85 };
const alcBoard = () => board({
  title: '板書：お酒の代謝、顔を赤くするのはアセトアルデヒド', note: '第5講の黒板 c-h・c1〜c3（c3に下線）、c05-0047',
  picture: '黒板の真ん中「飲酒と遺伝子多型」：アルコール→ADH→アセトアルデヒド→ALDH→酢酸→CO₂＋水／アセトアルデヒド＝顔が赤くなる原因（下線）。',
  beats: [beat('w', S(T2, 'verbatim', ['0047'], { board: ['c-h', 'c1', 'c2', 'c3'] }), [
    seg('アルコールから、ADHでアセトアルデヒド。', D('アルコールから、ADHでアセトアルデヒド。'), 'c1', { post: 0.1 }),
    seg('ALDHで酢酸、そして二酸化炭素と水。', D('ALDHで酢酸、そして二酸化炭素と水。'), 'c2', { post: 0.15 }),
    same('顔を赤くしているのは、**アセトアルデヒド**です。', 'c3', { post: 0.45 }),
  ])],
  items: [{ id: 'c-h', at: 'start' }, { id: 'c1', at: 'c1' }, { id: 'c2', at: 'c2' }, { id: 'c3', at: 'c3' }],
  marks: [{ id: 'c3', at: 'c3+1.5', color: 'r', kind: 'under' }],
  map: C,
  cams: [{ at: 'start', move: 'set', x: 560, y: 220, z: 1.0, note: '板書' }, { at: 'c1', move: 'push', x: 500, y: 170, z: 1.4, dur: 0.5, note: 'ADH' }, { at: 'c3', move: 'pan', x: 500, y: 290, z: 1.45, dur: 0.5, note: 'アセトアルデヒド' }],
  sfx: [{ at: 'c1', kind: 'chalk', gain: 0.6 }, { at: 'c2', kind: 'chalk', gain: 0.6 }, { at: 'c3', kind: 'chalk', gain: 0.6 }],
});

const aldh = () => fig('aldh2', {
  title: 'ALDH2：487番目 Glu→Lys、GG・AG・AA',
  picture: 'ALDH2のアミノ酸の鎖、487番目のグルタミン酸がリシンに置き換わる（ミスセンス）。3つの型のカード：GG＝強い、AG＝弱い、AA＝飲めない。ALDHが弱くADHが強いと、アセトアルデヒドがすぐにたまる。',
  note: 'スライド59、c05-0049〜0053',
  beats: [
    beat('q', S(T2, 'trimmed', ['0049'], { slide: 59 }), [seg('次に、ALDHのほうです。', D('次に、ALDHのほうです。'), 'q', { post: 0.2 })]),
    beat('pos', S(T2, 'verbatim', ['0050'], { slide: 59 }), [seg('ALDHの遺伝子は、487番目のアミノ酸を決める塩基の違いで、3つの型に分かれます。', D('ALDHの遺伝子は、487番目のアミノ酸を決める塩基の違いで、3つの型に分かれます。'), 'pos', { post: 0.25 })]),
    beat('glu', S(T2, 'verbatim', ['0051'], { slide: 59 }), [same('グルタミン酸がリシンに置き換わる。', 'glu', { post: 0.1 }), same('これもミスセンス変異ですね。', 'mis', { post: 0.25 })]),
    beat('types', S(T2, 'verbatim', ['0052'], { slide: 59 }), [seg('GG型はお酒が強い。', 'ジージー型はお酒が強い。', 'gg', { post: 0.1 }), seg('AG型は弱い。', 'エージー型は弱い。', 'ag', { post: 0.1 }), seg('AA型は飲めません。', 'エーエー型は飲めません。', 'aa', { post: 0.25 })]),
    beat('both', S(T2, 'verbatim', ['0053'], { slide: 59 }), [seg('ALDHが弱くてADHが強いと、アセトアルデヒドがすぐにたまる。', D('ALDHが弱くてADHが強いと、アセトアルデヒドがすぐにたまる。'), 'both', { post: 0.1 }), same('お酒が苦手なタイプです。', 'weak', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 200, z: 1.1, note: 'ALDH2の鎖' },
    { at: 'glu', move: 'crash', x: 640, y: 190, z: 1.5, dur: 0.22, hold: 0.25, note: '487番' },
    { at: 'gg', move: 'pull', x: 640, y: 420, z: 1.05, dur: 0.5, note: '3つの型' },
    { at: 'aa', move: 'push', x: 1000, y: 420, z: 1.3, dur: 0.4, note: 'AA' },
    { at: 'both', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: 'たまる' },
  ],
  fx: [{ at: 'glu', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'aa', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'both', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'glu', kind: 'impact' }, { at: 'gg', kind: 'tick' }, { at: 'ag', kind: 'tick' }, { at: 'aa', kind: 'boom', gain: 0.6 }],
  shots: [WARM_BG()],
});

const aldhBoard = () => board({
  title: 'AAは飲めない、訓練では変わらない', note: '第5講の黒板 c4〜c7（c7に赤の二重丸）、c05-0054・0055',
  picture: '黒板の真ん中下：ALDH2：487番 Glu→Lys／GG … 強い／AG … 弱い／AA … 飲めない（赤の二重丸）。「訓練では変わらない」の筆文字。',
  beats: [
    beat('w', S(T2, 'verbatim', ['0054'], { board: ['c4', 'c5', 'c6', 'c7'] }), [
      same('黒板に整理します。', 'w', { post: 0.1 }),
      seg('ALDHの487番目、グルタミン酸がリシンに。', D('ALDHの487番目、グルタミン酸がリシンに。'), 'c4', { post: 0.15 }),
      seg('GGは強い、AGは弱い、AAは飲めない。', 'ジージーは強い、エージーは弱い、エーエーは飲めない。', 'c5', { post: 0.25 }),
    ]),
    beat('train', S(T2, 'verbatim', ['0055']), [seg('AAは飲めない。', 'エーエーは飲めない。', 'aa', { post: 0.1 }), same('この型は、**訓練で変わるものではありません**。', 'train', { post: 0.15 }), same('遺伝子で決まっているからです。', 'gene', { post: 0.45 })]),
  ],
  items: [{ id: 'c-h', at: 'start-1' }, { id: 'c1', at: 'start-1' }, { id: 'c2', at: 'start-1' }, { id: 'c3', at: 'start-1' }, { id: 'c4', at: 'c4' }, { id: 'c5', at: 'c5' }, { id: 'c6', at: 'c5+1' }, { id: 'c7', at: 'c5+2' }],
  marks: [{ id: 'c7', at: 'aa', color: 'r' }],
  slams: [{ text: '訓練では変わらない', at: 'train', x: 640, y: 560, size: 56, color: '#ff6a55', band: true }],
  map: { bx: 1120, by: 230, sx: 140, sy: 50, k: 0.66 },
  cams: [{ at: 'start', move: 'set', x: 560, y: 300, z: 1.0, note: '板書' }, { at: 'c4', move: 'push', x: 460, y: 330, z: 1.4, dur: 0.5, note: '487番' }, { at: 'aa', move: 'pan', x: 460, y: 430, z: 1.45, dur: 0.4, note: 'AA' }, { at: 'train', move: 'pull', x: 640, y: 420, z: 1.05, dur: 0.4, note: '訓練では変わらない' }],
  fx: [{ at: 'train', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'train', kind: 'shake', dur: 0.3, min: 'gekiga' }],
  sfx: [{ at: 'c4', kind: 'chalk', gain: 0.6 }, { at: 'c5', kind: 'chalk', gain: 0.6 }, { at: 'aa', kind: 'impact', gain: 0.5 }, { at: 'train', kind: 'boom', gain: 0.7 }],
});

const transposon = () => fig('transposon', {
  title: 'トランスポゾン：ゲノムの上で位置を変える配列', chapter: T3,
  picture: 'DNAの上の一区画が光って跳び、別の場所に入る。DNAが直接動くDNA型と、RNAを経て逆転写されるRNA型（レトロポゾン）。マクリントックがトウモロコシのまだら模様から発見（1983年、81歳でノーベル賞）。ヒトゲノムの約45%がトランスポゾン関連の配列。',
  note: 'スライド63・64、c05-0066〜0070',
  beats: [
    beat('q', S(T3, 'trimmed', ['0066'], { slide: 63 }), [same('では、最後のテーマ。ゲノムの中を動く配列です。', 'q', { post: 0.25 })]),
    beat('def', S(T3, 'verbatim', ['0067'], { slide: 63 }), [same('**トランスポゾン**とは、ゲノムの上で位置を変えることができる塩基配列です。', 'def', { post: 0.25 })]),
    beat('types', S(T3, 'verbatim', ['0068'], { slide: 63 }), [seg('DNAが直接動くDNA型と、', D('DNAが直接動くDNA型と、'), 'dna'), seg('転写と逆転写を経るRNA型、**レトロポゾン**があります。', D('転写と逆転写を経るRNA型、レトロポゾンがあります。'), 'rna', { post: 0.25 })]),
    beat('mc', S(T3, 'verbatim', ['0069'], { slide: 63 }), [same('発見したのは**マクリントック**。', 'mc', { post: 0.1 }), seg('トウモロコシのまだら模様から見つけ、1983年、81歳でノーベル賞を受賞しました。', 'トウモロコシのまだら模様から見つけ、せんきゅうひゃくはちじゅうさんねん、はちじゅういっさいでノーベル賞を受賞しました。', 'corn', { post: 0.25 })]),
    beat('p45', S(T3, 'verbatim', ['0070'], { slide: 64 }), [seg('そして、ヒトゲノムの約**45パーセント**が、トランスポゾンに関連した配列です。', 'そして、ヒトゲノムの約よんじゅうごパーセントが、トランスポゾンに関連した配列です。', 'p45', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 250, z: 1.1, note: 'DNA' },
    { at: 'def', move: 'push', x: 640, y: 240, z: 1.3, dur: 2, note: '跳ぶ配列' },
    { at: 'mc', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.5, note: 'トウモロコシ' },
    { at: 'p45', move: 'crash', x: 900, y: 420, z: 1.3, dur: 0.22, hold: 0.25, note: '45%' },
  ],
  fx: [{ at: 'def', kind: 'speed', dur: 0.4, min: 'gekiga' }, { at: 'p45', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'def', kind: 'onoma', text: 'ピョン', x: 1080, y: 150, dur: 0.9, min: 'ultra' }],
  sfx: [{ at: 'def', kind: 'whoosh' }, { at: 'mc', kind: 'shimmer', gain: 0.4 }, { at: 'p45', kind: 'boom', gain: 0.6 }],
});

const cutCopy = () => fig('cut-copy', {
  title: 'カット&ペーストと、コピー&ペースト',
  picture: '左：DNA型はハサミで切り取って貼り付ける（数は増えない）、今のヒトでは動かない（灰色）。右：レトロトランスポゾンはコピーを作って貼り付ける（数が増える）。LINE-1・Alu・SVAは今も動く（光る）。',
  note: 'スライド65、c05-0071〜0073',
  beats: [
    beat('cut', S(T3, 'verbatim', ['0071'], { slide: 65 }), [seg('DNA型は、切り取って貼り付ける**カット・アンド・ペースト**。', D('DNA型は、切り取って貼り付ける**カット・アンド・ペースト**。'), 'cut', { post: 0.1 }), same('現在のヒトでは、もう動いていません。', 'dead', { post: 0.25 })]),
    beat('copy', S(T3, 'verbatim', ['0072'], { slide: 65 }), [same('レトロトランスポゾンは、**コピー・アンド・ペースト**。', 'copy', { post: 0.1 }), same('だから数が増えていきます。', 'more', { post: 0.25 })]),
    beat('act', S(T3, 'verbatim', ['0073'], { slide: 65 }), [seg('そのうち、LINE-1、Alu、SVAは、今も転移する活性を持っています。', 'そのうち、ラインワン、アルー、エスブイエーは、今も転移する活性を持っています。', 'act', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 330, y: 330, z: 1.3, note: 'カット&ペースト' },
    { at: 'copy', move: 'whip', x: 950, y: 330, z: 1.3, dur: 0.3, note: 'コピー&ペースト' },
    { at: 'act', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '今も動く' },
  ],
  fx: [{ at: 'dead', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'copy', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'act', kind: 'flash', dur: 0.25, min: 'gekiga' }],
  sfx: [{ at: 'cut', kind: 'tick' }, { at: 'dead', kind: 'impact', gain: 0.5 }, { at: 'copy', kind: 'whoosh' }, { at: 'more', kind: 'tick' }, { at: 'act', kind: 'shimmer' }],
});

const R = { bx: 2190, by: 230, sx: 140, sy: 70, k: 0.72 };
const tpBoard = () => board({
  title: '板書：動く遺伝子', note: '第5講の黒板 r-h・r1〜r4（r4に下線）、c05-0075',
  picture: '黒板の右「動く遺伝子」：トランスポゾン関連＝ゲノムの約45%／DNA型：カット&ペースト（今は不活性）／レトロ：コピー&ペースト（数が増える）／今も動く：LINE-1・Alu・SVA（下線）。',
  beats: [beat('w', S(T3, 'verbatim', ['0075'], { board: ['r1', 'r2', 'r3', 'r4'] }), [
    seg('ゲノムの約45パーセント。', 'ゲノムの約よんじゅうごパーセント。', 'r1', { post: 0.1 }),
    seg('DNA型は今は動かない。', D('DNA型は今は動かない。'), 'r2', { post: 0.1 }),
    same('レトロ型はコピー・アンド・ペーストで増える。', 'r3', { post: 0.1 }),
    seg('今も動いているのは、LINE-1、Alu、SVAです。', '今も動いているのは、ラインワン、アルー、エスブイエーです。', 'r4', { post: 0.45 }),
  ])],
  items: [{ id: 'r-h', at: 'start' }, { id: 'r1', at: 'r1' }, { id: 'r2', at: 'r2' }, { id: 'r3', at: 'r3' }, { id: 'r4', at: 'r4' }],
  marks: [{ id: 'r4', at: 'r4+2', color: 'y', kind: 'under' }],
  map: R,
  cams: [{ at: 'start', move: 'set', x: 560, y: 220, z: 1.0, note: '板書' }, { at: 'r2', move: 'push', x: 480, y: 210, z: 1.4, dur: 0.5, note: 'DNA型' }, { at: 'r4', move: 'pan', x: 440, y: 290, z: 1.45, dur: 0.5, note: '今も動く' }],
  sfx: [{ at: 'r1', kind: 'chalk', gain: 0.5 }, { at: 'r2', kind: 'chalk', gain: 0.5 }, { at: 'r3', kind: 'chalk', gain: 0.5 }, { at: 'r4', kind: 'chalk', gain: 0.6 }],
});

const pseudo = () => fig('pseudogene', {
  title: '偽遺伝子：プロセッシングを受けない／受けた',
  picture: '左：変異で働かなくなった元の遺伝子（エクソンとイントロンは残るが✕）＝プロセッシングを受けない偽遺伝子。右：レトロ転移でできた、イントロンのないコピー＝プロセッシングを受けた偽遺伝子。',
  note: 'スライド62、c05-0077〜0080',
  beats: [
    beat('q', S(T3, 'trimmed', ['0077'], { slide: 62 }), [same('このコピー・アンド・ペーストから生まれたのが、偽遺伝子の一部です。', 'q', { post: 0.25 })]),
    beat('non', S(T3, 'verbatim', ['0078'], { slide: 62 }), [same('偽遺伝子には二種類あります。', 'two', { post: 0.1 }), same('プロセッシングを受けない偽遺伝子は、変異で働かなくなった進化の名残。', 'non', { post: 0.25 })]),
    beat('pro', S(T3, 'verbatim', ['0079'], { slide: 62 }), [same('プロセッシングを受けた偽遺伝子は、**レトロ転移**で生まれます。', 'pro', { post: 0.25 })]),
    beat('why', S(T3, 'verbatim', ['0080'], { slide: 62 }), [seg('スプライシングを受けたmRNAが逆転写されてDNAになり、ゲノムに入り込む。', D('スプライシングを受けたmRNAが逆転写されてDNAになり、ゲノムに入り込む。'), 'rt', { post: 0.1 }), same('だから**イントロンがありません**。', 'nointron', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: '2種類' },
    { at: 'non', move: 'push', x: 330, y: 330, z: 1.35, dur: 0.6, note: '進化の名残' },
    { at: 'pro', move: 'whip', x: 950, y: 330, z: 1.35, dur: 0.3, note: 'レトロ転移' },
    { at: 'nointron', move: 'crash', x: 950, y: 330, z: 1.5, dur: 0.22, hold: 0.25, note: 'イントロンなし' },
  ],
  fx: [{ at: 'pro', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'nointron', kind: 'impact', dur: 0.45, min: 'gekiga' }],
  sfx: [{ at: 'non', kind: 'tick' }, { at: 'pro', kind: 'whoosh' }, { at: 'nointron', kind: 'boom', gain: 0.6 }],
  shots: [DARK_BG()],
});

const retro = () => fig('retro', {
  title: 'レトロ転移：mRNA → 逆転写 → 別の染色体へ',
  picture: '元の遺伝子（プロモーター・エクソン・イントロン）が転写され、スプライシングでイントロンのないmRNAに。逆転写酵素がmRNAを鋳型にDNAのコピーを作り（RNA→DNA、逆向き）、別の染色体に入り込む。できた配列にはイントロンもプロモーターもない＝プロセッシングを受けた偽遺伝子。',
  note: 'c05-0081〜0085',
  beats: [
    beat('gene', S(T3, 'verbatim', ['0081']), [same('動きで見てみましょう。', 'see', { post: 0.1 }), same('元の遺伝子です。', 'gene', { post: 0.1 }), same('プロモーター、エクソン、イントロン。', 'parts', { post: 0.25 })]),
    beat('mrna', S(T3, 'verbatim', ['0082']), [seg('転写されて、スプライシングを受けると、イントロンのないmRNAになります。', D('転写されて、スプライシングを受けると、イントロンのないmRNAになります。'), 'mrna', { post: 0.25 })]),
    beat('rt', S(T3, 'verbatim', ['0083']), [seg('ここで、**逆転写酵素**が、mRNAを鋳型にしてDNAのコピーを作ります。', 'ここで、逆転写酵素が、メッセンジャーアールエヌエーをいがたにしてディーエヌエーのコピーを作ります。', 'rt', { post: 0.1 }), seg('RNAからDNAへ。逆向きの流れです。', D('RNAからDNAへ。逆向きの流れです。'), 'rev', { post: 0.25 })]),
    beat('ins', S(T3, 'verbatim', ['0084']), [same('そのコピーが、別の染色体に入り込む。', 'ins', { post: 0.1 }), same('これが**レトロ転移**です。', 'retro', { post: 0.25 })]),
    beat('pg', S(T3, 'verbatim', ['0085']), [same('できあがった配列には、イントロンもプロモーターもありません。', 'none', { post: 0.1 }), same('だから、ふつうは働かない。', 'off', { post: 0.1 }), same('プロセッシングを受けた**偽遺伝子**です。', 'pg', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 130, z: 1.2, note: '元の遺伝子' },
    { at: 'mrna', move: 'pan', x: 640, y: 250, z: 1.15, dur: 0.6, note: 'mRNA' },
    { at: 'rt', move: 'pan', x: 640, y: 360, z: 1.15, dur: 0.6, note: '逆転写' },
    { at: 'ins', move: 'pan', x: 640, y: 480, z: 1.15, dur: 0.6, note: '別の染色体' },
    { at: 'pg', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'rev', kind: 'speed', dur: 0.4, min: 'gekiga' }, { at: 'retro', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'pg', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'mrna', kind: 'whoosh', gain: 0.5 }, { at: 'rt', kind: 'riser', gain: 0.5 }, { at: 'ins', kind: 'impact', gain: 0.6 }, { at: 'pg', kind: 'boom', gain: 0.6 }],
});

const pgBoard = () => board({
  title: '偽遺伝子にはイントロンがない', note: '第5講の黒板 r5〜r7（r7に赤丸）、c05-0086',
  picture: '黒板の右「偽遺伝子（プロセッシング済）」：mRNA→逆転写→DNA→再挿入／イントロンなし・別の染色体へ（赤丸）。',
  beats: [beat('w', S(T3, 'verbatim', ['0086'], { board: ['r5', 'r6', 'r7'] }), [same('黒板に書きます。', 'w', { post: 0.1 }), seg('mRNAが逆転写されて、再び挿入される。', D('mRNAが逆転写されて、再び挿入される。'), 'r6', { post: 0.15 }), same('だから**イントロンがない**。', 'r7', { post: 0.45 })])],
  items: [{ id: 'r-h', at: 'start-1' }, { id: 'r1', at: 'start-1' }, { id: 'r2', at: 'start-1' }, { id: 'r3', at: 'start-1' }, { id: 'r4', at: 'start-1' }, { id: 'r5', at: 'w' }, { id: 'r6', at: 'r6' }, { id: 'r7', at: 'r7' }],
  marks: [{ id: 'r7', at: 'r7+1', color: 'r' }],
  map: { bx: 2190, by: 230, sx: 140, sy: 50, k: 0.62 },
  cams: [{ at: 'start', move: 'set', x: 560, y: 300, z: 1.0, note: '板書' }, { at: 'r6', move: 'push', x: 440, y: 400, z: 1.45, dur: 0.5, note: '偽遺伝子' }],
  fx: [{ at: 'r7+1', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'r6', kind: 'chalk', gain: 0.6 }, { at: 'r7', kind: 'chalk', gain: 0.6 }],
});

const insertion = () => fig('insertion', {
  title: '挿入が起こすこと：遺伝性疾患65例以上、ユークロマチンに入りやすい',
  picture: '遺伝子のエクソンの真ん中に、跳んできた配列が割り込み、遺伝子が壊れる（挿入変異）。並ぶ札：血友病・嚢胞性線維症・デュシェンヌ型筋ジストロフィー…（少なくとも65例）。ほどけて開いたクロマチン（ユークロマチン）に入りやすい。',
  note: 'スライド67、c05-0094〜0097',
  beats: [
    beat('q', S(T3, 'trimmed', ['0094'], { slide: 67 }), [same('最後に、こうした挿入が何を起こすのか。', 'q', { post: 0.25 })]),
    beat('eff', S(T3, 'verbatim', ['0095'], { slide: 67 }), [same('遺伝子を壊す挿入変異や、ゲノムの再編成、発現の変化。', 'eff', { post: 0.25 })]),
    beat('dz', S(T3, 'verbatim', ['0096'], { slide: 67 }), [same('少なくとも**65例**で、遺伝性疾患の原因になっています。', 'n65', { post: 0.1 }), seg('血友病、嚢胞性線維症、デュシェンヌ型筋ジストロフィーなどです。', '血友病、のう胞性線維症、デュシェンヌ型筋ジストロフィーなどです。', 'dz', { post: 0.25 })]),
    beat('eu', S(T3, 'verbatim', ['0097'], { slide: 67 }), [same('しかも挿入は、転写が活発な**ユークロマチン**に起こりやすいのです。', 'eu', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 220, z: 1.2, note: '遺伝子' },
    { at: 'eff', move: 'crash', x: 640, y: 200, z: 1.4, dur: 0.22, hold: 0.25, note: '割り込む' },
    { at: 'n65', move: 'pull', x: 640, y: 380, z: 1.05, dur: 0.5, note: '65例' },
    { at: 'eu', move: 'pan', x: 640, y: 470, z: 1.1, dur: 0.6, note: 'ユークロマチン' },
  ],
  fx: [{ at: 'eff', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'eff', kind: 'onoma', text: 'ガツン', x: 1080, y: 150, dur: 0.9, min: 'gekiga' }, { at: 'eu', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'eff', kind: 'impact' }, { at: 'n65', kind: 'tick' }, { at: 'dz', kind: 'tick' }, { at: 'eu', kind: 'shimmer', gain: 0.4 }],
});

const disBoard = () => board({
  title: '生殖系列の挿入 → 遺伝性疾患65例〜、ユークロマチンに入りやすい', note: '第5講の黒板 r8・r9、c05-0098',
  picture: '黒板の右下：生殖系列の挿入→遺伝性疾患65例〜／ユークロマチンに入りやすい。',
  beats: [beat('w', S(T3, 'verbatim', ['0098'], { board: ['r8', 'r9'] }), [same('生殖系列で起こると、次の世代に伝わって病気の原因になりうる。', 'r8', { post: 0.1 }), same('65例以上。', 'n65', { post: 0.1 }), same('ユークロマチンに入りやすい。', 'r9', { post: 0.45 })])],
  items: [{ id: 'r-h', at: 'start-1' }, { id: 'r1', at: 'start-1' }, { id: 'r2', at: 'start-1' }, { id: 'r3', at: 'start-1' }, { id: 'r4', at: 'start-1' }, { id: 'r5', at: 'start-1' }, { id: 'r6', at: 'start-1' }, { id: 'r7', at: 'start-1' }, { id: 'r8', at: 'r8' }, { id: 'r9', at: 'r9' }],
  map: { bx: 2190, by: 230, sx: 140, sy: 50, k: 0.62 },
  cams: [{ at: 'start', move: 'set', x: 560, y: 300, z: 1.0, note: '板書' }, { at: 'r8', move: 'push', x: 440, y: 470, z: 1.45, dur: 0.5, note: '65例' }],
  sfx: [{ at: 'r8', kind: 'chalk', gain: 0.6 }, { at: 'r9', kind: 'chalk', gain: 0.6 }],
});

const summary = () => summaryScene({
  note: '第5講の黒板 sum-h・s1〜s4、c05-0104〜0108',
  beats: [
    beat('four', S('まとめ', 'verbatim', ['0104'], { board: ['sum-h'] }), [same('今日覚えてほしいのは、この4つです。', 'four', { post: 0.3 })]),
    beat('p1', S('まとめ', 'verbatim', ['0105'], { board: ['s1'] }), [same('ひとつ目。', 'p1', { post: 0.1 }), same('置換の結果は4通り。', 'p1b', { post: 0.1 }), same('ナンセンスは終止へ、センスは終止から。', 'p1c', { post: 0.1 }), same('ミスセンスは別のアミノ酸、サイレントは変わらない。', 'p1d', { post: 0.3 })]),
    beat('p2', S('まとめ', 'verbatim', ['0106'], { board: ['s2'] }), [same('ふたつ目。', 'p2', { post: 0.1 }), seg('ALDH2の487番、グルタミン酸がリシン。', D('ALDH2の487番、グルタミン酸がリシン。'), 'p2b', { post: 0.1 }), seg('AAは飲めない。', 'エーエーは飲めない。', 'p2c', { post: 0.1 }), same('遺伝子で決まっているので、訓練では変わりません。', 'p2d', { post: 0.3 })]),
    beat('p3', S('まとめ', 'verbatim', ['0107'], { board: ['s3'] }), [same('みっつ目。', 'p3', { post: 0.1 }), seg('ゲノムの約45パーセントがトランスポゾン関連。', 'ゲノムの約よんじゅうごパーセントがトランスポゾン関連。', 'p3b', { post: 0.1 }), seg('今も動くのはLINE-1、Alu、SVA。', '今も動くのはラインワン、アルー、エスブイエー。', 'p3c', { post: 0.3 })]),
    beat('p4', S('まとめ', 'verbatim', ['0108'], { board: ['s4'] }), [same('そして、レトロ転移でできた偽遺伝子には、**イントロンがない**。', 'p4', { post: 0.45 })]),
  ],
  marks: [{ id: 's1', at: 'p1d+1', color: 'y' }, { id: 's2', at: 'p2d+1', color: 'y' }, { id: 's3', at: 'p3c+1', color: 'y' }, { id: 's4', at: 'p4+3', color: 'r' }],
  endAt: 'p4+3.6',
});

const end = () => endScene({
  no: '次回 第6講', picture: '「次回 第6講（最終回）」の判。配列は変えずに働きを変える＝エピゲノム。黒にフェードアウト。', note: 'c05-0109',
  beats: [beat('next', S('まとめ', 'trimmed', ['0109']), [same('次の第6講、最終回では、', 'next'), same('塩基配列を変えずに遺伝子の働きを変える仕組み、', 'what'), same('**エピゲノム**を学びます。', 'epi', { post: 1.0 })])],
  l1: '塩基配列を変えずに働きを変える', l1At: 'what', l2: 'エピゲノム', l2At: 'epi', pic: 'chromosome',
});

/** the whole of 第5講, in lecture order */
export function lecture5Film(): SceneDef[] {
  return numbered([title(), mutTypes(), kindsBoard(), outcomes(), fourBoard(), codonChange(), frameshift(), snp(), alcohol(), alcBoard(), aldh(), aldhBoard(), transposon(), cutCopy(), tpBoard(), pseudo(), retro(), pgBoard(), insertion(), disBoard(), summary(), end()]);
}

export const FILM5_RATIONALE = [
  '第5講「ゲノムの変異・多型と動く遺伝子」を、講義の順（導入 → テーマ1〜3 → まとめ）に1本の劇画授業映像にした完成版。確認問題・症例問題の選択肢の解説は省いた。',
  '台詞はすべて第5講の講義台詞（narrations/lecture-05.json）の原文、またはその一部。板書は講義の黒板の文字をそのまま使う。',
  '医学図：置換・挿入・欠失、置換の結果4通り（標準遺伝暗号：AGA/CGA Arg、GAC Asp→GAA Glu、Arg→Gly、終止コドン）、読み枠のずれ、一塩基多型の数、アルコール代謝（ADH・ALDH、アセトアルデヒド）、ALDH2 487番 Glu→Lys と GG/AG/AA、トランスポゾン（DNA型・レトロ型）、レトロ転移とプロセッシングを受けた偽遺伝子（イントロン・プロモーターなし）。人物の顔は描かない。',
];
