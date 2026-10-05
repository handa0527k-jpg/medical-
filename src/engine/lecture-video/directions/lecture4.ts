/**
 * 遺伝医学｜遺伝子の基礎 第4講「遺伝子の構造と遺伝情報の発現」— the whole lecture as one gekiga film (完成版).
 *
 *   導入      title → 全体像（プロモーター・エクソン/イントロン → 転写 → スプライシング → 翻訳）
 *   テーマ1   遺伝子の定義（アミノ酸配列 or 翻訳されないRNA）→ 板書 → ゲノム31億塩基対／遺伝子2.5万・転写の向き → 板書 → 板書 遺伝子の形
 *   テーマ2   空欄の遺伝子図を埋める
 *   テーマ3   板書 流れ → 転写とスプライシング → mRNAの搬出と翻訳（AUG Met・GCU Ala・GUU Val・UAG 終止）→ 板書 mRNA → エンハンサー／サイレンサー
 *   テーマ4   ゲノムの構成（遺伝子関連25.3%・アミノ酸指定1.3%・繰り返し48%）→ 板書 → ncRNA（miRNA・snoRNA と症候群）→ 板書 → 解読の歴史 → 板書 試験ポイント
 *   まとめ    今日覚えてほしい4つ → 次回予告（第5講：変異と個人差）
 *
 * Every spoken line is a cue of narrations/lecture-04.json, verbatim or a contiguous part of it (tests check).
 */
import type { SceneDef } from '../types';
import { beat, board, DARK_BG, endScene, fig, lecture, numbered, same, seg, summaryScene, titleScene } from './kit';

const S = lecture('genetics-basics', 4);
const T1 = 'テーマ1　遺伝子とは何か', T2 = 'テーマ2　遺伝子の構造', T3 = 'テーマ3　転写・スプライシング・翻訳', T4 = 'テーマ4　ゲノムの構成とncRNA';
export const FILM4_KEY = 'genetics-basics:4:film';
const D = (s: string) => s.replace(/DNA/g, 'ディーエヌエー').replace(/mRNA/g, 'メッセンジャーアールエヌエー').replace(/RNA/g, 'アールエヌエー').replace(/\*\*/g, '').replace(/[「」]/g, '');

const title = () => titleScene({
  no: '第4講', title: ['遺伝子の構造と', '遺伝情報の発現'],
  picture: '漆黒に墨が爆ぜ、二重らせんの影が回る。「遺伝子の構造と遺伝情報の発現」の筆文字。',
  beats: [
    beat('open', S('導入', 'verbatim', ['0001']), [same('第4講です。', 'title', { post: 0.2 }), seg('ここまでで、DNAの材料、そしてDNAが染色体にしまわれる仕組みを見てきました。', D('ここまでで、DNAの材料、そしてDNAが染色体にしまわれる仕組みを見てきました。'), 'prev', { post: 0.3 })]),
    beat('today', S('導入', 'verbatim', ['0002']), [same('今日はいよいよ、その中の「**遺伝子**」です。', 'gene', { post: 0.15 }), same('設計図のどこが遺伝子で、それがどう読まれてタンパク質になるのか。', 'how', { post: 0.5 })]),
  ],
  subs: [{ text: '設計図のどこが遺伝子？', at: 'gene', y: 505 }, { text: 'どう読まれてタンパク質になる？', at: 'how', y: 552, color: 'y' }],
});

const overview = () => fig('gene-flow', {
  title: '全体像：プロモーター → 転写 → スプライシング → 翻訳',
  picture: '左端のプロモーター、緑の四角（エクソン）と間の線（イントロン）の遺伝子。転写でRNAになり、スプライシングでイントロンが除かれ、コドンがアミノ酸に変換される（翻訳）。上から下へ流れる1枚。',
  note: 'スライド41、c04-0010〜0013',
  beats: [beat('flow', S('全体像', 'verbatim', ['0010', '0011', '0012', '0013'], { slide: 41 }), [
    same('左端の**プロモーター**から転写が始まります。', 'pro', { post: 0.15 }),
    same('緑の四角が**エクソン**、その間の線が**イントロン**。', 'ex', { post: 0.15 }),
    seg('転写されたRNAから、**スプライシング**でイントロンが除かれて……', D('転写されたRNAから、スプライシングでイントロンが除かれて'), 'spl', { post: 0.2 }),
    same('最後に、コドンの情報がアミノ酸に変換される。', 'aa', { post: 0.1 }),
    same('これが**翻訳**です。', 'trl', { post: 0.45 }),
  ])],
  cams: [
    { at: 'start', move: 'set', x: 300, y: 160, z: 1.6, note: 'プロモーター' },
    { at: 'ex', move: 'pan', x: 640, y: 160, z: 1.3, dur: 0.6, note: 'エクソンとイントロン' },
    { at: 'spl', move: 'pan', x: 640, y: 330, z: 1.2, dur: 0.6, note: 'スプライシング' },
    { at: 'aa', move: 'pan', x: 640, y: 470, z: 1.2, dur: 0.6, note: '翻訳' },
    { at: 'trl', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'spl', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'trl', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'trl', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'pro', kind: 'tick' }, { at: 'ex', kind: 'tick' }, { at: 'spl', kind: 'whoosh' }, { at: 'trl', kind: 'impact' }],
});

const definition = () => fig('gene-def', {
  title: '遺伝子とは：アミノ酸配列、または翻訳されないRNAの塩基配列を決める領域', chapter: T1,
  picture: 'DNAの長い帯の一部が光る＝遺伝子。そこから2本の道：アミノ酸がつながったタンパク質へ、そして翻訳されずRNAのまま働くRNAへ。',
  note: 'スライド42、c04-0015〜0017',
  beats: [
    beat('dna', S(T1, 'verbatim', ['0015'], { slide: 42 }), [seg('遺伝情報を担うDNAは、生物の構造や機能を決める設計図です。', D('遺伝情報を担うDNAは、生物の構造や機能を決める設計図です。'), 'dna', { post: 0.25 })]),
    beat('what', S(T1, 'trimmed', ['0016'], { slide: 42 }), [same('遺伝情報は、どんなタンパク質を、どの細胞が、どんな環境で、どれだけ作るか。', 'what', { post: 0.3 })]),
    beat('def', S(T1, 'trimmed', ['0017'], { slide: 42 }), [
      seg('遺伝子とは、DNAの中で、', D('遺伝子とは、DNAの中で、'), 'def'),
      same('タンパク質の**アミノ酸配列**、', 'prot'),
      seg('あるいは翻訳されない**RNAの塩基配列**を決める情報を持った領域です。', D('あるいは翻訳されないRNAの塩基配列を決める情報を持った領域です。'), 'rna', { post: 0.45 }),
    ]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 300, z: 1.0, note: 'DNAの帯' },
    { at: 'def', move: 'push', x: 640, y: 260, z: 1.3, dur: 0.6, note: '遺伝子の領域' },
    { at: 'prot', move: 'pan', x: 420, y: 420, z: 1.25, dur: 0.5, note: 'タンパク質' },
    { at: 'rna', move: 'whip', x: 860, y: 420, z: 1.25, dur: 0.3, note: 'RNA' },
    { at: 'rna+2.5', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.6, note: '両方' },
  ],
  fx: [{ at: 'def', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'rna', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'dna', kind: 'shimmer', gain: 0.4 }, { at: 'def', kind: 'impact', gain: 0.6 }, { at: 'prot', kind: 'tick' }, { at: 'rna', kind: 'whoosh' }],
});

const L = { bx: 90, by: 230, sx: 150, sy: 80, k: 0.85 };
const defBoard = () => board({
  title: '遺伝子はRNAのまま働くものも含む', note: '第4講の黒板 l-h・l1〜l3（l3に下線）、c04-0019・0020',
  picture: '黒板の左「遺伝子とは」：DNAのうち、次を決める領域／・タンパク質のアミノ酸配列／・翻訳されないRNAの塩基配列（下線）。',
  beats: [
    beat('two', S(T1, 'verbatim', ['0019'], { board: ['l3'] }), [same('ポイントは、二つ目。', 'two', { post: 0.1 }), same('遺伝子は、タンパク質を作るものだけではない。', 'only', { post: 0.1 }), seg('**RNAのまま働くもの**も含まれます。', D('RNAのまま働くものも含まれます。'), 'rna', { post: 0.25 })]),
    beat('line', S(T1, 'verbatim', ['0020']), [same('ここに線を引いておきます。', 'line', { post: 0.1 }), seg('後で、このRNAの話に戻ってきます。', D('後で、このRNAの話に戻ってきます。'), 'later', { post: 0.4 })]),
  ],
  items: [{ id: 'l-h', at: 'start-1' }, { id: 'l1', at: 'start-1' }, { id: 'l2', at: 'start-1' }, { id: 'l3', at: 'start-1' }],
  marks: [{ id: 'l3', at: 'line+0.3', color: 'y', kind: 'under' }],
  map: L,
  cams: [{ at: 'start', move: 'set', x: 560, y: 280, z: 1.0, note: '定義の板書' }, { at: 'rna', move: 'crash', x: 460, y: 320, z: 1.5, dur: 0.22, hold: 0.25, note: 'RNAのまま働く' }, { at: 'later', move: 'pull', x: 560, y: 280, z: 1.0, dur: 0.5, note: '引く' }],
  fx: [{ at: 'rna', kind: 'impact', dur: 0.4, min: 'gekiga' }],
  sfx: [{ at: 'rna', kind: 'impact', gain: 0.6 }, { at: 'line', kind: 'chalk', gain: 0.7 }],
});

const genome = () => fig('genome-dir', {
  title: 'ゲノム約31億塩基対・遺伝子約2.5万、転写の向きはプロモーターが決める',
  picture: '長い2本鎖のDNA（ゲノム）の上に、遺伝子がとびとびに並ぶ。上の鎖を鋳型にする遺伝子と下の鎖を鋳型にする遺伝子があり、それぞれ先頭のプロモーター（旗）から向きが決まって矢印が走る。',
  note: 'スライド52、c04-0022・0023',
  beats: [
    beat('g', S(T1, 'verbatim', ['0022'], { slide: 52 }), [same('遺伝子の全体を**ゲノム**と呼びます。', 'genome', { post: 0.15 }), same('ヒトのゲノムは約31億塩基対、遺伝子は約25000です。', 'num', { post: 0.3 })]),
    beat('dir', S(T1, 'verbatim', ['0023'], { slide: 52 }), [seg('どちらの鎖を鋳型にするかは遺伝子ごとに違い、', 'どちらの鎖をいがたにするかは遺伝子ごとに違い、', 'strand'), same('転写の向きを決めるのは、それぞれの遺伝子の**プロモーター**です。', 'pro', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: 'ゲノム' },
    { at: 'strand', move: 'push', x: 420, y: 330, z: 1.4, dur: 0.8, note: '遺伝子ごとの向き' },
    { at: 'pro', move: 'pan', x: 860, y: 330, z: 1.4, dur: 0.8, note: 'プロモーター' },
    { at: 'pro+2.5', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'num', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'pro', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'genome', kind: 'shimmer', gain: 0.4 }, { at: 'num', kind: 'impact', gain: 0.6 }, { at: 'strand', kind: 'whoosh', gain: 0.5 }, { at: 'pro', kind: 'tick' }],
});

const numBoard = () => board({
  title: '31億は塩基対、2万5千は遺伝子', note: '第4講の黒板 l4、c04-0024',
  picture: '定義の下に「ゲノム約31億塩基対／遺伝子約2.5万」。「混ぜた選択肢に注意」の筆文字。',
  beats: [beat('mix', S(T1, 'verbatim', ['0024'], { board: ['l4'] }), [same('31億は**塩基対**の数、2万5千は**遺伝子**の数。', 'num', { post: 0.15 }), same('この二つを混ぜた選択肢に注意です。', 'care', { post: 0.45 })])],
  items: [{ id: 'l-h', at: 'start-1' }, { id: 'l1', at: 'start-1' }, { id: 'l2', at: 'start-1' }, { id: 'l3', at: 'start-1' }, { id: 'l4', at: 'num' }],
  slams: [{ text: '混ぜた選択肢に注意', at: 'care', x: 640, y: 520, size: 60, color: '#ff6a55', band: true }],
  map: L,
  cams: [{ at: 'start', move: 'set', x: 560, y: 300, z: 1.0, note: '板書' }, { at: 'num', move: 'push', x: 520, y: 360, z: 1.5, dur: 0.6, note: '31億と2.5万' }, { at: 'care', move: 'pull', x: 640, y: 380, z: 1.05, dur: 0.4, note: '注意' }],
  fx: [{ at: 'care', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'care', kind: 'shake', dur: 0.3, min: 'gekiga' }],
  sfx: [{ at: 'num', kind: 'chalk', gain: 0.7 }, { at: 'care', kind: 'boom', gain: 0.7 }],
});

const C = { bx: 1120, by: 230, sx: 140, sy: 70, k: 1.0 };
const shapeBoard = () => board({
  title: '板書：遺伝子の形', note: '第4講の黒板 c-h・gene、c04-0026〜0028',
  picture: '黒板の真ん中に遺伝子の形：左からプロモーター、エクソン・イントロン・エクソン…、右端にポリアデニル化シグナル。最初と最後のエクソンの青い部分が5\'UTRと3\'UTR。',
  beats: [
    beat('draw', S(T1, 'verbatim', ['0026'], { board: ['gene'] }), [same('左から、**プロモーター**。', 'pro', { post: 0.15 }), seg('そしてエクソン、イントロン、エクソン、イントロン……', 'そしてエクソン、イントロン、エクソン、イントロン', 'ex', { post: 0.2 })]),
    beat('poly', S(T1, 'verbatim', ['0027']), [same('右端が**ポリアデニル化シグナル**です。', 'poly', { post: 0.25 })]),
    beat('utr', S(T1, 'verbatim', ['0028']), [same('最初と最後のエクソンの青い部分は、翻訳されない領域。', 'utr', { post: 0.1 }), seg('**5ダッシュUTR**と**3ダッシュUTR**です。', '5ダッシュユーティーアールと3ダッシュユーティーアールです。', 'utr2', { post: 0.4 })]),
  ],
  items: [{ id: 'c-h', at: 'start' }, { id: 'gene', at: 'pro', dur: 7 }],
  map: C, lecturerX: 1180,
  cams: [{ at: 'start', move: 'set', x: 560, y: 260, z: 1.0, note: '遺伝子の形' }, { at: 'pro', move: 'push', x: 260, y: 230, z: 1.6, dur: 0.6, note: 'プロモーター' }, { at: 'ex', move: 'pan', x: 600, y: 230, z: 1.4, dur: 2.5, note: 'エクソンとイントロン' }, { at: 'poly', move: 'pan', x: 900, y: 230, z: 1.5, dur: 0.5, note: 'ポリA' }, { at: 'utr', move: 'pull', x: 560, y: 260, z: 1.0, dur: 0.5, note: 'UTR' }],
  fx: [{ at: 'poly', kind: 'focus', dur: 0.8, min: 'gekiga' }, { at: 'utr2', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'pro', kind: 'chalk', gain: 0.6 }, { at: 'ex', kind: 'chalk', gain: 0.6 }, { at: 'poly', kind: 'chalk', gain: 0.6 }, { at: 'utr2', kind: 'impact', gain: 0.5 }],
});

const blank = () => fig('gene-blank', {
  title: '空欄の遺伝子図を埋める', chapter: T2,
  picture: '遺伝子の構造図の枠が空欄で並ぶ。読み上げに合わせて1つずつ判が押される：プロモーター → 5\'UTR → 開始コドン → エクソン → イントロン → 終止コドン → ポリアデニル化シグナル。',
  note: 'スライド51（スライド41の空欄版）、c04-0030〜0032',
  beats: [
    beat('q', S(T2, 'verbatim', ['0030'], { slide: 51 }), [same('この左下の枠、何が入りますか。', 'q', { post: 0.5 })]),
    beat('a', S(T2, 'verbatim', ['0031'], { slide: 51 }), [same('答えは**プロモーター**。', 'pro', { post: 0.3 })]),
    beat('rest', S(T2, 'verbatim', ['0032'], { slide: 51 }), [
      same('残りの枠も、', 'rest'),
      seg('5ダッシュUTR、', '5ダッシュユーティーアール、', 'utr5'), same('開始コドン、', 'atg'), same('エクソン、', 'exon'), same('イントロン、', 'intron'), same('終止コドン、', 'stop'), same('ポリアデニル化シグナル。', 'polya', { post: 0.15 }),
      same('全部言えたら、この図は大丈夫です。', 'ok', { post: 0.45 }),
    ]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 340, z: 1.0, note: '空欄の図' },
    { at: 'q', move: 'push', x: 220, y: 440, z: 1.6, dur: 0.8, note: '左下の枠' },
    { at: 'pro', move: 'crash', x: 220, y: 440, z: 1.8, dur: 0.2, hold: 0.2, note: '答え' },
    { at: 'rest', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '残り' },
  ],
  fx: [{ at: 'pro', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'ok', kind: 'flash', dur: 0.3, min: 'gekiga' }],
  sfx: [{ at: 'pro', kind: 'impact' }, { at: 'utr5', kind: 'tick' }, { at: 'atg', kind: 'tick' }, { at: 'exon', kind: 'tick' }, { at: 'intron', kind: 'tick' }, { at: 'stop', kind: 'tick' }, { at: 'polya', kind: 'tick' }, { at: 'ok', kind: 'shimmer' }],
  shots: [DARK_BG()],
});

const F = { bx: 1120, by: 560, sx: 140, sy: 90, k: 0.95 };
const flowBoard = () => board({
  title: '流れ：転写 → スプライシング → 翻訳（TはUに）', chapter: T3, note: '第4講の黒板 f1〜f4、c04-0033・0034',
  picture: '遺伝子の形の下に流れ：転写：DNA→前駆体RNA（イントロンも）／スプライシング：イントロンを除く／翻訳：コドン→アミノ酸／文字：A G C T→U C G A（TがUに）。',
  beats: [
    beat('f', S(T3, 'verbatim', ['0033'], { board: ['f1', 'f2', 'f3'] }), [
      same('流れを書きます。', 'w', { post: 0.1 }),
      seg('転写で、イントロンも含んだRNAができる。', D('転写で、イントロンも含んだRNAができる。'), 'f1', { post: 0.15 }),
      same('スプライシングで、イントロンを取り除く。', 'f2', { post: 0.15 }),
      same('そして翻訳。', 'f3', { post: 0.25 }),
    ]),
    beat('tu', S(T3, 'verbatim', ['0034'], { board: ['f4'] }), [seg('転写のとき、DNAのTは、RNAでは**U**になります。', D('転写のとき、DNAのティーは、RNAではユーになります。'), 'tu', { post: 0.15 }), same('第2講でやったウラシルですね。', 'u', { post: 0.4 })]),
  ],
  items: [{ id: 'f1', at: 'f1' }, { id: 'f2', at: 'f2' }, { id: 'f3', at: 'f3' }, { id: 'f4', at: 'tu' }],
  map: F,
  cams: [{ at: 'start', move: 'set', x: 560, y: 200, z: 1.0, note: '流れの板書' }, { at: 'f1', move: 'push', x: 560, y: 110, z: 1.35, dur: 0.6, note: '転写' }, { at: 'f2', move: 'pan', x: 520, y: 180, z: 1.35, dur: 0.5, note: 'スプライシング' }, { at: 'tu', move: 'pan', x: 560, y: 320, z: 1.35, dur: 0.6, note: 'TがUに' }],
  sfx: [{ at: 'f1', kind: 'chalk', gain: 0.6 }, { at: 'f2', kind: 'chalk', gain: 0.6 }, { at: 'f3', kind: 'chalk', gain: 0.6 }, { at: 'tu', kind: 'chalk', gain: 0.6 }],
});

const txSplice = () => fig('tx-splice', {
  title: '転写とスプライシング',
  picture: 'DNA上の遺伝子。RNAポリメラーゼがプロモーターに結合し、読み進めながらRNAを合成する（イントロンの部分も写し取られる）。続いてイントロンが輪のように外れ、エクソンだけがつながった成熟mRNAになる。',
  note: 'c04-0035〜0039',
  beats: [
    beat('see', S(T3, 'verbatim', ['0035']), [same('では、実際の流れを分子のレベルで見てみましょう。', 'see', { post: 0.1 }), seg('DNAの上の遺伝子です。', D('DNAの上の遺伝子です。'), 'gene', { post: 0.25 })]),
    beat('bind', S(T3, 'verbatim', ['0036']), [seg('**RNAポリメラーゼ**が、プロモーターに結合します。', D('RNAポリメラーゼが、プロモーターに結合します。'), 'bind', { post: 0.1 }), same('ここが読み始めの場所。', 'here', { post: 0.25 })]),
    beat('tx', S(T3, 'verbatim', ['0037']), [seg('ポリメラーゼがDNAを読み進めながら、RNAを合成していきます。', D('ポリメラーゼがDNAを読み進めながら、RNAを合成していきます。'), 'tx', { post: 0.15 }), same('この時点では、イントロンの部分も写し取られています。', 'pre', { post: 0.25 })]),
    beat('spl', S(T3, 'verbatim', ['0038']), [seg('次に**スプライシング**。イントロンが輪のように外れて……', '次にスプライシング。イントロンが輪のように外れて', 'spl', { post: 0.2 })]),
    beat('mrna', S(T3, 'verbatim', ['0039']), [seg('エクソンだけがつながった、成熟した**mRNA**になります。', D('エクソンだけがつながった、成熟したmRNAになります。'), 'mrna', { post: 0.4 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 300, z: 1.0, note: 'DNA上の遺伝子' },
    { at: 'bind', move: 'push', x: 260, y: 260, z: 1.5, dur: 0.6, note: 'プロモーター' },
    { at: 'tx', move: 'pan', x: 760, y: 280, z: 1.2, dur: 3.0, note: '読み進める' },
    { at: 'spl', move: 'pull', x: 640, y: 400, z: 1.05, dur: 0.5, note: 'スプライシング' },
    { at: 'mrna', move: 'crash', x: 640, y: 470, z: 1.25, dur: 0.22, hold: 0.25, note: '成熟mRNA' },
  ],
  fx: [{ at: 'bind', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'spl', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'spl', kind: 'onoma', text: 'パチン', x: 1080, y: 160, dur: 0.9, min: 'ultra' }, { at: 'mrna', kind: 'focus', dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'bind', kind: 'impact', gain: 0.6 }, { at: 'tx', kind: 'riser', gain: 0.4 }, { at: 'spl', kind: 'whoosh' }, { at: 'mrna', kind: 'shimmer' }],
});

const translate = () => fig('translate4', {
  title: '核から細胞質へ、そして翻訳：AUG・GCU・GUU・UAG',
  picture: 'mRNAが核膜孔から細胞質へ。リボソームが開始コドンAUGから3塩基ずつ読み、メチオニン・アラニン・バリンをつなぐ。終止コドンUAGにはアミノ酸がなく、合成が終わる。',
  note: 'c04-0040〜0043。標準遺伝暗号：AUG Met、GCU Ala、GUU Val、UAG 終止',
  beats: [
    beat('out', S(T3, 'verbatim', ['0040']), [seg('mRNAは、核から細胞質へ出ていきます。', D('mRNAは、核から細胞質へ出ていきます。'), 'out', { post: 0.25 })]),
    beat('trl', S(T3, 'verbatim', ['0041']), [
      same('ここから**翻訳**です。', 'trl', { post: 0.1 }),
      seg('開始コドンAUGから、3塩基ずつ読まれていきます。', '開始コドンエーユージーから、3塩基ずつ読まれていきます。', 'aug', { post: 0.15 }),
      seg('AUGはメチオニン、', 'エーユージーはメチオニン、', 'met'), seg('GCUはアラニン、', 'ジーシーユーはアラニン、', 'ala'), seg('GUUはバリン。', 'ジーユーユーはバリン。', 'val', { post: 0.2 }),
    ]),
    beat('stop', S(T3, 'verbatim', ['0042']), [seg('そして、終止コドンのUAG。', 'そして、終止コドンのユーエージー。', 'uag', { post: 0.1 }), same('ここにはアミノ酸がありません。', 'none', { post: 0.1 }), same('合成はここで終わります。', 'end', { post: 0.25 })]),
    beat('three', S(T3, 'verbatim', ['0043']), [same('メチオニン、アラニン、バリン。', 'mav', { post: 0.1 }), same('3つのアミノ酸がつながりました。', 'done', { post: 0.4 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 400, y: 330, z: 1.2, note: '核膜孔' },
    { at: 'trl', move: 'pan', x: 640, y: 360, z: 1.15, dur: 0.6, note: 'リボソーム' },
    { at: 'met', move: 'push', x: 560, y: 360, z: 1.35, dur: 0.4, note: 'AUG' },
    { at: 'ala', move: 'pan', x: 660, y: 360, z: 1.35, dur: 0.4, note: 'GCU' },
    { at: 'val', move: 'pan', x: 760, y: 360, z: 1.35, dur: 0.4, note: 'GUU' },
    { at: 'uag', move: 'crash', x: 860, y: 380, z: 1.5, dur: 0.2, hold: 0.25, note: 'UAG' },
    { at: 'mav', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '3つ' },
  ],
  fx: [{ at: 'aug', kind: 'focus', dur: 0.9, min: 'gekiga' }, { at: 'uag', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'uag', kind: 'onoma', text: 'ピタッ', x: 1080, y: 160, dur: 0.9, min: 'ultra' }, { at: 'done', kind: 'flash', dur: 0.25, min: 'gekiga' }],
  sfx: [{ at: 'out', kind: 'whoosh', gain: 0.5 }, { at: 'met', kind: 'tick' }, { at: 'ala', kind: 'tick' }, { at: 'val', kind: 'tick' }, { at: 'uag', kind: 'impact' }, { at: 'done', kind: 'shimmer' }],
  shots: [{ id: 'a', from: 'start', mode: 'background', desc: '細胞質の暗い世界。粒がゆっくり流れる。', subject: 'the dark crowded cytoplasm of a cell, out-of-focus particles drifting, warm rim light, slow tracking shot', accuracy: 'background only, no text, no letters, no labels' }],
});

const mrnaBoard = () => board({
  title: '板書：AUG・GCU・GUU・UAG → Met・Ala・Val・終止', note: '第4講の黒板 mrna（赤丸）、c04-0044〜0046',
  picture: '黒板の真ん中下にmRNA：5\'—AUG GCU GUU UAG—3\'、下にMet・Ala・Val・終止。全体を赤い丸で囲む。',
  beats: [
    beat('w', S(T3, 'verbatim', ['0044'], { board: ['mrna'] }), [seg('黒板にも、今のmRNAを書いておきます。', D('黒板にも、今のmRNAを書いておきます。'), 'w', { post: 0.1 }), seg('AUG、GCU、GUU、UAG。', 'エーユージー、ジーシーユー、ジーユーユー、ユーエージー。', 'codons', { post: 0.2 })]),
    beat('aa', S(T3, 'verbatim', ['0045']), [same('下にアミノ酸。', 'aa', { post: 0.1 }), same('メット、アラ、バル。', 'mav', { post: 0.1 }), same('そして終止。', 'stop', { post: 0.25 })]),
    beat('rule', S(T3, 'verbatim', ['0046']), [seg('開始はAUG、終わりは終止コドン。', '開始はエーユージー、終わりは終止コドン。', 'rule', { post: 0.1 }), same('コドンは3つずつ。', 'three', { post: 0.1 }), same('これが翻訳のルールです。', 'ok', { post: 0.4 })]),
  ],
  items: [{ id: 'f1', at: 'start-1' }, { id: 'f2', at: 'start-1' }, { id: 'f3', at: 'start-1' }, { id: 'f4', at: 'start-1' }, { id: 'mrna', at: 'codons', dur: 4 }],
  marks: [{ id: 'mrna', at: 'rule', color: 'r' }],
  map: { bx: 1120, by: 560, sx: 140, sy: 50, k: 0.85 },
  cams: [{ at: 'start', move: 'set', x: 560, y: 300, z: 1.0, note: '板書' }, { at: 'codons', move: 'push', x: 520, y: 380, z: 1.35, dur: 0.6, note: 'mRNA' }, { at: 'rule', move: 'pull', x: 560, y: 320, z: 1.0, dur: 0.5, note: 'ルール' }],
  fx: [{ at: 'rule', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'codons', kind: 'chalk', gain: 0.7 }, { at: 'aa', kind: 'chalk', gain: 0.6 }, { at: 'rule', kind: 'impact', gain: 0.5 }],
});

const regulation = () => fig('regulation', {
  title: 'エンハンサー・サイレンサーと、プロモーター',
  picture: 'DNAの上、遺伝子の手前にプロモーター（と近い位置の要素）。そこから数百〜数千塩基対離れた場所にエンハンサー（促進）とサイレンサー（抑制）。細胞ごとに、転写のスイッチの強さが変わる。',
  note: 'スライド78、c04-0066〜0068',
  beats: [
    beat('q', S(T3, 'trimmed', ['0066'], { slide: 78 }), [same('転写がどこで、どれくらい起こるかは、プロモーター以外の配列でも調節されています。', 'q', { post: 0.25 })]),
    beat('far', S(T3, 'verbatim', ['0067'], { slide: 78 }), [same('遺伝子から数百から数千塩基対も離れた場所の、', 'far'), same('**エンハンサー**や**サイレンサー**が、', 'es'), seg('細胞ごとの調節的な発現に関わります。', '細胞ごとの調節てきな発現に関わります。', 'cell', { post: 0.25 })]),
    beat('near', S(T3, 'verbatim', ['0068'], { slide: 78 }), [seg('近い位置の要素とプロモーターは、基礎的な発現を担います。', '近い位置の要素とプロモーターは、基礎てきな発現を担います。', 'near', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: 'DNA' },
    { at: 'far', move: 'push', x: 300, y: 300, z: 1.35, dur: 0.8, note: '離れた場所' },
    { at: 'near', move: 'pan', x: 820, y: 300, z: 1.35, dur: 0.8, note: 'プロモーター' },
    { at: 'near+2.5', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.5, note: '全体' },
  ],
  fx: [{ at: 'es', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'near', kind: 'focus', dur: 0.9, min: 'gekiga' }],
  sfx: [{ at: 'far', kind: 'whoosh', gain: 0.5 }, { at: 'es', kind: 'impact', gain: 0.6 }, { at: 'near', kind: 'tick' }],
});

const composition = () => fig('genome-pie', {
  title: 'ゲノムの構成：アミノ酸を指定する配列は約1.3%', chapter: T4,
  picture: 'ゲノム（約31億塩基対）を1本の帯に。遺伝子に関わるDNA 25.3%、非遺伝子DNA 74.7%。遺伝子の中でアミノ酸を指定するのはわずか1.3%の細い赤い帯。非遺伝子では繰り返し配列が48%で一番多い。',
  note: 'スライド43、c04-0069〜0073',
  beats: [
    beat('q', S(T4, 'trimmed', ['0069'], { slide: 43 }), [same('では、ゲノム全体で見ると、遺伝子はどれくらいの割合なのか。', 'q', { post: 0.25 })]),
    beat('split', S(T4, 'verbatim', ['0070'], { slide: 43 }), [seg('遺伝子に関わるDNAは約25.3パーセント。', D('遺伝子に関わるDNAは約にじゅうごてんさんパーセント。'), 'gene', { post: 0.15 }), seg('残りの約74.7パーセントは、遺伝子ではないDNAです。', D('残りの約ななじゅうよんてんななパーセントは、遺伝子ではないDNAです。'), 'non', { post: 0.25 })]),
    beat('aa', S(T4, 'verbatim', ['0071', '0072'], { slide: 43 }), [seg('そして、アミノ酸を指定している配列は……', 'そして、アミノ酸を指定している配列は', 'aa', { post: 0.35 }), seg('わずか約**1.3パーセント**。', 'わずか約いってんさんパーセント。', 'p13', { pre: 0.1, post: 0.3 })]),
    beat('rep', S(T4, 'verbatim', ['0073'], { slide: 43 }), [seg('一番多いのは繰り返し配列で、約48パーセントです。', '一番多いのは繰り返し配列で、約よんじゅうはちパーセントです。', 'rep', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: 'ゲノムの帯' },
    { at: 'aa', move: 'push', x: 260, y: 300, z: 1.6, dur: 1.2, note: '細い帯へ' },
    { at: 'p13', move: 'crash', x: 200, y: 300, z: 2.0, dur: 0.2, hold: 0.3, note: '1.3%' },
    { at: 'rep', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.5, note: '繰り返し配列' },
  ],
  fx: [{ at: 'p13', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'p13', kind: 'focus', dur: 1.2, min: 'gekiga' }, { at: 'p13', kind: 'onoma', text: 'ドンッ', x: 1080, y: 150, dur: 1.0, min: 'gekiga' }],
  sfx: [{ at: 'gene', kind: 'tick' }, { at: 'non', kind: 'tick' }, { at: 'aa', kind: 'riser', gain: 0.5 }, { at: 'p13', kind: 'boom' }, { at: 'rep', kind: 'whoosh', gain: 0.5 }],
  shots: [DARK_BG()],
});

const G = { bx: 90, by: 660, sx: 150, sy: 70, k: 0.75 };
const compBoard = () => board({
  title: 'アミノ酸を指定する配列は1.3%', note: '第4講の黒板 g-h・g1・g2（g1に赤丸）、c04-0074',
  picture: '黒板の左下「ゲノムの構成」：遺伝子関連 25.3%（アミノ酸指定 1.3%）／非遺伝子 74.7%（繰り返し配列 48%）。1.3%の行を赤い丸で囲む。',
  beats: [beat('w', S(T4, 'verbatim', ['0074'], { board: ['g-h', 'g1', 'g2'] }), [same('黒板に書きます。', 'w', { post: 0.1 }), same('アミノ酸を指定する配列は、ゲノムのわずか**1.3パーセント**。', 'p13', { post: 0.15 }), same('ここ、非常に重要です。', 'imp', { post: 0.4 })])],
  items: [{ id: 'g-h', at: 'start' }, { id: 'g1', at: 'p13' }, { id: 'g2', at: 'p13+1.5' }],
  marks: [{ id: 'g1', at: 'imp', color: 'r' }],
  map: G,
  cams: [{ at: 'start', move: 'set', x: 560, y: 200, z: 1.0, note: '板書' }, { at: 'p13', move: 'push', x: 480, y: 160, z: 1.5, dur: 0.6, note: '1.3%' }],
  fx: [{ at: 'imp', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'p13', kind: 'chalk', gain: 0.7 }, { at: 'imp', kind: 'impact', gain: 0.5 }],
});

const ncrna = () => fig('ncrna', {
  title: 'ncRNA：RNAのまま働く遺伝子（miRNA・snoRNA）',
  picture: 'ncRNA遺伝子からできるRNAは、タンパク質にならずそのまま働く：tRNA・rRNA・snoRNA。約22塩基の短いmiRNAが標的mRNAに結合すると、リボソームが止まり翻訳が抑えられる。15番のsnoRNA遺伝子群の欠失→プラダー・ウィリー、13番のmiRNA遺伝子群の欠失→フェインゴールド（顔は描かない）。',
  note: 'スライド46、c04-0076〜0082',
  beats: [
    beat('nc', S(T4, 'trimmed', ['0076'], { slide: 46 }), [seg('タンパク質にならないRNAの遺伝子を、非コードRNA遺伝子、**ncRNA**と呼びます。', 'タンパク質にならないアールエヌエーの遺伝子を、非コードアールエヌエー遺伝子、ノンコーディングアールエヌエーと呼びます。', 'nc', { post: 0.25 })]),
    beat('num', S(T4, 'verbatim', ['0077'], { slide: 46 }), [seg('産物がRNAそのものである遺伝子で、タンパク質コード遺伝子とほぼ同じ、2万から2万5千くらいあると推定されています。', D('産物がRNAそのものである遺伝子で、タンパク質コード遺伝子とほぼ同じ、2万から2万5千くらいあると推定されています。'), 'num', { post: 0.25 })]),
    beat('kinds', S(T4, 'verbatim', ['0078'], { slide: 46 }), [seg('tRNAやrRNA、snoRNAなど、細胞の基本の仕組みを支えるものがあります。', 'ティーアールエヌエーやリボソームアールエヌエー、スノーアールエヌエーなど、細胞の基本の仕組みを支えるものがあります。', 'kinds', { post: 0.25 })]),
    beat('mi', S(T4, 'verbatim', ['0079', '0080'], { slide: 46 }), [seg('そして、**miRNA**。', 'そして、マイクロアールエヌエー。', 'mi', { post: 0.1 }), seg('約22塩基の短いRNAで、', '約にじゅうに塩基の短いアールエヌエーで、', 'short'), seg('標的のmRNAに結合して翻訳を抑えます。', 'ひょうてきのメッセンジャーアールエヌエーに結合して翻訳を抑えます。', 'block', { post: 0.3 })]),
    beat('dz', S(T4, 'verbatim', ['0081', '0082'], { slide: 46 }), [seg('15番染色体のsnoRNA遺伝子群が欠けると**プラダー・ウィリー症候群**、', '15番染色体のスノーアールエヌエー遺伝子群が欠けるとプラダー・ウィリー症候群、', 'pws'), seg('13番のmiRNA遺伝子群が欠けると**フェインゴールド症候群**です。', '13番のマイクロアールエヌエー遺伝子群が欠けるとフェインゴールド症候群です。', 'fgs', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: 'ncRNA' },
    { at: 'mi', move: 'push', x: 640, y: 380, z: 1.35, dur: 0.6, note: 'miRNA' },
    { at: 'block', move: 'crash', x: 700, y: 380, z: 1.5, dur: 0.2, hold: 0.25, note: '翻訳を抑える' },
    { at: 'pws', move: 'pull', x: 640, y: 340, z: 1.0, dur: 0.5, note: '症候群' },
  ],
  fx: [{ at: 'nc', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'block', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'block', kind: 'onoma', text: 'ガシッ', x: 1080, y: 150, dur: 0.9, min: 'ultra' }],
  sfx: [{ at: 'nc', kind: 'impact', gain: 0.6 }, { at: 'kinds', kind: 'tick' }, { at: 'mi', kind: 'whoosh', gain: 0.5 }, { at: 'block', kind: 'boom', gain: 0.6 }, { at: 'pws', kind: 'tick' }, { at: 'fgs', kind: 'tick' }],
});

const N = { bx: 90, by: 916, sx: 150, sy: 90, k: 0.8 };
const ncBoard = () => board({
  title: '板書：ncRNA', note: '第4講の黒板 n-h・n1〜n3、c04-0083',
  picture: '黒板の左下「ncRNA（非コードRNA）」：miRNA：約22塩基・翻訳を抑制／15番 snoRNA欠失→プラダー・ウィリー／13番 miRNA欠失→フェインゴールド。',
  beats: [beat('w', S(T4, 'verbatim', ['0083'], { board: ['n-h', 'n1', 'n2', 'n3'] }), [same('左に整理します。', 'w', { post: 0.1 }), seg('miRNAは短くて、翻訳を抑える。', 'マイクロアールエヌエーは短くて、翻訳を抑える。', 'mi', { post: 0.15 }), same('欠けて病気になる例が、プラダー・ウィリーとフェインゴールドです。', 'dz', { post: 0.45 })])],
  items: [{ id: 'n-h', at: 'start' }, { id: 'n1', at: 'mi' }, { id: 'n2', at: 'dz' }, { id: 'n3', at: 'dz+1.5' }],
  map: N,
  cams: [{ at: 'start', move: 'set', x: 560, y: 240, z: 1.0, note: '板書' }, { at: 'mi', move: 'push', x: 480, y: 180, z: 1.45, dur: 0.6, note: 'miRNA' }, { at: 'dz', move: 'pan', x: 520, y: 300, z: 1.4, dur: 0.6, note: '症候群' }],
  sfx: [{ at: 'mi', kind: 'chalk', gain: 0.6 }, { at: 'dz', kind: 'chalk', gain: 0.6 }],
});

const history = () => fig('genome-history', {
  title: 'ヒトゲノム：2003年に完了宣言、2022年に完全解読',
  picture: '年表。2003年：約10年・約4000億円をかけたヒトゲノムプロジェクトの完了宣言。ただし繰り返しの多い約8%は読めず空白のまま。2022年：その空白が埋まり完全解読。',
  note: 'スライド49・50、c04-0090・0091',
  beats: [
    beat('y03', S(T4, 'verbatim', ['0090'], { slide: 49 }), [seg('2003年、約10年と4000億円をかけて、ヒトゲノムプロジェクトの完了が宣言されました。', 'にせんさんねん、約じゅうねんとよんせんおくえんをかけて、ヒトゲノムプロジェクトの完了が宣言されました。', 'y03', { post: 0.3 })]),
    beat('y22', S(T4, 'verbatim', ['0091'], { slide: 50 }), [seg('ただ、繰り返しの多い約8パーセントは読めず、', 'ただ、繰り返しの多い約はちパーセントは読めず、', 'gap'), seg('2022年に、ようやく完全に解読されました。', 'にせんにじゅうにねんに、ようやく完全に解読されました。', 'y22', { post: 0.45 })]),
  ],
  cams: [
    { at: 'start', move: 'set', x: 380, y: 330, z: 1.2, note: '2003' },
    { at: 'gap', move: 'pan', x: 640, y: 330, z: 1.2, dur: 0.8, note: '8%の空白' },
    { at: 'y22', move: 'pan', x: 900, y: 330, z: 1.2, dur: 0.8, note: '2022' },
    { at: 'y22+2', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.5, note: '年表' },
  ],
  fx: [{ at: 'y03', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'y22', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'y22', kind: 'flash', dur: 0.3, min: 'gekiga' }],
  sfx: [{ at: 'y03', kind: 'impact', gain: 0.6 }, { at: 'gap', kind: 'tick' }, { at: 'y22', kind: 'boom', gain: 0.6 }],
  shots: [DARK_BG()],
});

const R = { bx: 2190, by: 230, sx: 140, sy: 60, k: 0.66 };
const examBoard = () => board({
  title: '試験ポイント：開始AUG・終止3つ・UTR・1.3%・年号・エンハンサー', note: '第4講の黒板 r-h・r1〜r8（r1・r1bに赤の二重丸）、c04-0093〜0095',
  picture: '黒板の右「試験ポイント」：開始コドンAUG（Met）／終止コドンUAA・UAG・UGA／DNAのATG→mRNAではAUG／転写の向き＝プロモーター／イントロンは除去／UTRは翻訳されない／アミノ酸指定1.3%／2003年・2022年／エンハンサー促進・サイレンサー抑制。',
  beats: [
    beat('codon', S(T4, 'verbatim', ['0093'], { board: ['r1', 'r1b'] }), [seg('開始コドンは**AUG**、メチオニン。', '開始コドンはエーユージー、メチオニン。', 'aug', { post: 0.1 }), seg('終止コドンは3つ。UAA、UAG、UGA。', '終止コドンは3つ。ユーエーエー、ユーエージー、ユージーエー。', 'stop', { post: 0.25 })]),
    beat('rules', S(T4, 'verbatim', ['0094'], { board: ['r3', 'r4', 'r5'] }), [same('転写の向きはプロモーター。', 'dir', { post: 0.1 }), same('イントロンは除かれる。', 'intron', { post: 0.1 }), seg('UTRは翻訳されない。', 'ユーティーアールは翻訳されない。', 'utr', { post: 0.25 })]),
    beat('nums', S(T4, 'verbatim', ['0095'], { board: ['r6', 'r7', 'r8'] }), [same('数字と年号。', 'num', { post: 0.1 }), same('そして、**エンハンサーは促進**、**サイレンサーは抑制**。', 'es', { post: 0.45 })]),
  ],
  items: [{ id: 'r-h', at: 'start' }, { id: 'r1', at: 'aug' }, { id: 'r1b', at: 'stop' }, { id: 'r2', at: 'stop+1.5' }, { id: 'r3', at: 'dir' }, { id: 'r4', at: 'intron' }, { id: 'r5', at: 'utr' }, { id: 'r6', at: 'num' }, { id: 'r7', at: 'num+0.6' }, { id: 'r8', at: 'es' }],
  marks: [{ id: 'r1', at: 'stop+0.6', color: 'r' }, { id: 'r1b', at: 'stop+0.9', color: 'r' }],
  map: R,
  cams: [{ at: 'start', move: 'set', x: 560, y: 260, z: 1.0, note: '試験ポイント' }, { at: 'aug', move: 'push', x: 400, y: 120, z: 1.5, dur: 0.5, note: 'AUG' }, { at: 'dir', move: 'pan', x: 460, y: 260, z: 1.4, dur: 0.5, note: '向き・イントロン・UTR' }, { at: 'num', move: 'pan', x: 460, y: 400, z: 1.4, dur: 0.5, note: '数字と年号' }, { at: 'es+2', move: 'pull', x: 560, y: 280, z: 1.0, dur: 0.5, note: '全体' }],
  fx: [{ at: 'stop+0.6', kind: 'impact', dur: 0.35, min: 'gekiga' }],
  sfx: [{ at: 'aug', kind: 'chalk', gain: 0.6 }, { at: 'stop', kind: 'chalk', gain: 0.6 }, { at: 'dir', kind: 'chalk', gain: 0.5 }, { at: 'num', kind: 'chalk', gain: 0.5 }, { at: 'es', kind: 'chalk', gain: 0.5 }],
});

const summary = () => summaryScene({
  note: '第4講の黒板 sum-h・s1〜s4、c04-0101〜0105',
  beats: [
    beat('four', S('まとめ', 'verbatim', ['0101'], { board: ['sum-h'] }), [same('今日覚えてほしいのは、この4つです。', 'four', { post: 0.3 })]),
    beat('p1', S('まとめ', 'verbatim', ['0102'], { board: ['s1'] }), [same('ひとつ目。', 'p1', { post: 0.1 }), same('遺伝子の構造。', 'p1b', { post: 0.1 }), seg('プロモーター、UTR、エクソンとイントロン、ポリアデニル化シグナル。', 'プロモーター、ユーティーアール、エクソンとイントロン、ポリアデニル化シグナル。', 'p1c', { post: 0.3 })]),
    beat('p2', S('まとめ', 'verbatim', ['0103'], { board: ['s2'] }), [same('ふたつ目。', 'p2', { post: 0.1 }), same('転写、スプライシング、翻訳。', 'p2b', { post: 0.1 }), same('スプライシングで除かれるのは**イントロン**。', 'p2c', { post: 0.3 })]),
    beat('p3', S('まとめ', 'verbatim', ['0104'], { board: ['s3'] }), [same('みっつ目。', 'p3', { post: 0.1 }), seg('翻訳はAUGから始まり、3塩基ずつ読まれ、終止コドンで終わる。', '翻訳はエーユージーから始まり、3塩基ずつ読まれ、終止コドンで終わる。', 'p3b', { post: 0.3 })]),
    beat('p4', S('まとめ', 'verbatim', ['0105'], { board: ['s4'] }), [seg('そして、アミノ酸を指定する配列は約1.3パーセント。', 'そして、アミノ酸を指定する配列は約いってんさんパーセント。', 'p4', { post: 0.1 }), seg('タンパク質にならないncRNAも、遺伝子です。', 'タンパク質にならないノンコーディングアールエヌエーも、遺伝子です。', 'p4b', { post: 0.45 })]),
  ],
  marks: [{ id: 's1', at: 'p1c+1.5', color: 'y' }, { id: 's2', at: 'p2c+1', color: 'y' }, { id: 's3', at: 'p3b+2.5', color: 'y' }, { id: 's4', at: 'p4b+1', color: 'r' }],
  endAt: 'p4b+1.8',
});

const end = () => endScene({
  no: '次回 第5講', picture: '「次回 第5講」の判。設計図の文字が変わる：二重らせんの影。黒にフェードアウト。', note: 'c04-0106',
  beats: [beat('next', S('まとめ', 'trimmed', ['0106']), [same('次の第5講では、', 'next'), same('この設計図の文字が変わったら何が起こるのか。', 'what', { post: 0.15 }), same('**変異**と**個人差**の話です。', 'var', { post: 1.0 })])],
  l1: '設計図の文字が変わったら？', l1At: 'what', l2: '変異と個人差', l2At: 'var', pic: 'helix',
});

/** the whole of 第4講, in lecture order */
export function lecture4Film(): SceneDef[] {
  return numbered([title(), overview(), definition(), defBoard(), genome(), numBoard(), shapeBoard(), blank(), flowBoard(), txSplice(), translate(), mrnaBoard(), regulation(), composition(), compBoard(), ncrna(), ncBoard(), history(), examBoard(), summary(), end()]);
}

export const FILM4_RATIONALE = [
  '第4講「遺伝子の構造と遺伝情報の発現」を、講義の順（導入 → テーマ1〜4 → まとめ）に1本の劇画授業映像にした完成版。確認問題の選択肢の解説は省いた。',
  '台詞はすべて第4講の講義台詞（narrations/lecture-04.json）の原文、またはその一部。板書は講義の黒板の文字をそのまま使う。',
  '医学図：遺伝子の構造（プロモーター・5\'UTR・開始コドン・エクソン/イントロン・終止コドン・3\'UTR・ポリアデニル化シグナル）、転写（イントロンも写す）、スプライシング（イントロンが投げ縄状に外れる）、翻訳（AUG Met・GCU Ala・GUU Val・UAG 終止）、遺伝子ごとの転写の向き、エンハンサー/サイレンサー、ゲノムの構成（スライド43の数値）、miRNAによる翻訳抑制、ゲノム解読の年表。患者の顔は描かない。',
];
