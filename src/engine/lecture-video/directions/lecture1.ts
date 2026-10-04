/**
 * 遺伝医学｜遺伝子の基礎 第1講「遺伝子とは何か」— the whole lecture as one gekiga film (完成版, ~4 min).
 *
 *   導入      title → 受精卵1個が60兆個の細胞に → その設計図が遺伝子 → 「本当にDNAなのか」
 *   テーマ1   エイブリーの形質転換実験（30 s prototype scenes, long cut）
 *   テーマ2   板書 DNA→RNA→タンパク質・転写/翻訳 → 転写の分子の現場 → 翻訳の現場 → 覚え方 → セントラルドグマは普遍的
 *   テーマ3   生体の階層性（遺伝子→疾患へ急激にズームアウト）→ 染色体の数・遺伝子1つの変化 → 一番下から疾患まで届く
 *   まとめ    今日覚えてほしい4つ → 次回予告
 *
 * Every spoken line is a cue of narrations/lecture-01.json, verbatim or a contiguous part of it (tests check).
 * The figures are drawn exactly by MEDSTUDY (render.ts); Wan 2.2 supplies the world and motion around them.
 */
import type { Beat, Fx, SceneDef, Segment, SourceRef } from '../types';
import { s02, s03, s04, s05 } from './avery';

const COURSE = 'genetics-basics', LECTURE = 1;
const S = (section: string, mode: SourceRef['mode'], cues: string[], extra: Partial<SourceRef> = {}): SourceRef => ({ course: COURSE, lecture: LECTURE, section, cues, mode, ...extra });
const seg = (text: string, say: string, cue?: string, o: Partial<Segment> = {}): Segment => ({ text, say, cue, ...o });
const beat = (id: string, src: SourceRef, segs: Segment[]): Beat => ({ id, src, segs });
const TONE: Fx = { at: 'start', kind: 'tone', dur: 999, min: 'gekiga' };
const HALL = 'a dark empty lecture hall at night, a huge slate blackboard, a single hard shaft of light cutting through floating chalk dust, dust motes drifting slowly';
const MOLECULAR = 'a dark watery molecular world inside a cell nucleus, soft out-of-focus particles drifting, cold rim light, slow push-in';
const NO_TEXT = 'no text, no letters, no labels';

export const FILM_KEY = 'genetics-basics:1:film';

/* ---------- 導入 ---------- */
function titleOpen(): SceneDef {
  return {
    id: 'X', title: 'タイトル：第1講 遺伝子とは何か', visual: 'title-open', chapter: '第1講',
    picture: '漆黒に墨が爆ぜ、右巻きの二重らせん（B型DNA：主溝と副溝の幅が違う）の影がゆっくり回る。「遺伝子とは何か」の筆文字が叩きつけられる。',
    diagram: { id: 'helix', title: 'DNA二重らせん（影）', note: '右巻き・主溝/副溝の非対称を保った背景図。文字は MEDSTUDY が描く' },
    beats: [beat('open', S('導入', 'verbatim', ['c01-0001']), [
      seg('はい、始めましょう。', 'はい、始めましょう。', 'hello', { post: 0.15 }),
      seg('遺伝医学、最初の単元は「遺伝子の基礎」です。', '遺伝医学、最初の単元は遺伝子の基礎です。', 'unit', { post: 0.1 }),
      seg('今日は第1講、「遺伝子とは何か」。', '今日は第1講、遺伝子とは何か。', 'title', { post: 0.5 }),
    ])],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.25, note: '墨の中から' },
      { at: 'start', move: 'pull', x: 640, y: 360, z: 1.0, dur: 3.0, note: 'ゆっくり引く' },
      { at: 'title', move: 'crash', x: 640, y: 330, z: 1.18, dur: 0.22, hold: 0.3, note: '題名で急接近 → 静止' },
    ],
    fx: [{ at: 'title', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'title', kind: 'focus', dur: 1.4, min: 'gekiga' }, { at: 'title', kind: 'shake', dur: 0.3, min: 'gekiga' }, TONE],
    sfx: [{ at: 'start', kind: 'riser', gain: 0.5 }, { at: 'title', kind: 'boom' }],
    shots: [{ id: 'a', from: 'start', mode: 'feature', desc: '漆黒の空間で墨が爆ぜ、二重らせんの影がゆっくり回る。',
      subject: 'pitch black void, sumi ink exploding and swirling like smoke in water, the dark silhouette of a right-handed DNA double helix slowly rotating in the ink',
      accuracy: 'the helix is right-handed with a wide major groove and a narrow minor groove; ' + NO_TEXT }],
  };
}

function zygote(): SceneDef {
  return {
    id: 'X', title: '受精卵1個 → 60兆個の細胞', visual: 'zygote',
    picture: '透明帯に包まれた受精卵が1個 → 2 → 4 → 8 と分裂（卵割：細胞は小さくなっていく）。「60兆個」で急激に引くと、細胞の群れがヒトの姿になる。「同じ設計図が配られているのか」で、すべての細胞核に同じ二重らせんが灯る。',
    diagram: { id: 'cleavage', title: '受精卵と卵割', note: '板書 egg「受精卵 1個」・cells「60兆個の細胞→ヒト」。卵割期は透明帯の中で細胞数が増え、1個あたりは小さくなる' },
    beats: [
      beat('egg', S('全体像', 'verbatim', ['c01-0017'], { board: ['egg'] }), [
        seg('私たちの体は、たった1個の細胞、', '私たちの体は、たった1個の細胞、', 'one'),
        seg('受精卵から始まります。', '受精卵から始まります。', 'egg', { post: 0.2 }),
      ]),
      beat('divide', S('全体像', 'verbatim', ['c01-0018'], { board: ['cells'] }), [
        seg('分裂を繰り返して', '分裂を繰り返して', 'split'),
        seg('60兆個の細胞になり、ヒトの形になっていく。', '60兆個の細胞になり、ヒトの形になっていく。', 'body', { post: 0.25 }),
      ]),
      beat('same', S('全体像', 'verbatim', ['c01-0019']), [
        seg('では、この60兆個の細胞に、', 'では、この60兆個の細胞に、', 'all'),
        seg('どうやって同じ設計図が配られているのか。', 'どうやって同じ設計図が配られているのか。', 'same', { post: 0.3 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 340, z: 1.6, note: '受精卵の大写し' },
      { at: 'split', move: 'push', x: 640, y: 340, z: 1.3, dur: 1.6, note: '分裂に合わせて少し引く' },
      { at: 'body', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.35, note: '「60兆個」で急激にズームアウト → ヒトの姿' },
      { at: 'same', move: 'push', x: 640, y: 300, z: 1.25, dur: 1.2, note: '細胞核の二重らせんへ寄る' },
    ],
    fx: [{ at: 'body', kind: 'speed', dur: 0.4, min: 'gekiga' }, { at: 'body', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'same', kind: 'focus', dur: 1.2, min: 'gekiga' }, { at: 'body', kind: 'onoma', text: 'ブワッ', x: 1080, y: 160, dur: 1.0, min: 'ultra' }, TONE],
    sfx: [{ at: 'egg', kind: 'shimmer', gain: 0.5 }, { at: 'split', kind: 'tick' }, { at: 'split+0.6', kind: 'tick' }, { at: 'split+1.2', kind: 'tick' }, { at: 'body', kind: 'whoosh' }, { at: 'same', kind: 'riser', gain: 0.4 }],
    shots: [
      { id: 'a', from: 'start', mode: 'background', desc: '暗い液体の中で、光の粒がゆっくり漂う。', subject: 'a dark warm fluid world, glowing particles drifting slowly, soft rim light, slow push-in', accuracy: 'background only, ' + NO_TEXT },
      { id: 'b', from: 'body', mode: 'background', desc: '無数の光の粒が渦を巻いて広がる。', subject: 'countless glowing particles swirling outward in a dark space, camera pulling back fast, motion streaks', accuracy: 'background only, no human figure, ' + NO_TEXT },
    ],
  };
}

function question(): SceneDef {
  return {
    id: 'X', title: '設計図＝遺伝子 → 本当にDNAか', visual: 'board-question', lecturer: true,
    picture: '黒板の中央に「DNA → ？」（板書 c-dna / a1 / c-q）。講師が黒板を指す。「本当にDNAなのか」で「？」へ急接近。',
    diagram: { id: 'board-dna-q', title: '板書：DNA →？', note: '第1講の黒板 c-dna・a1・c-q' },
    beats: [
      beat('theme', S('全体像', 'verbatim', ['c01-0020'], { board: ['c-dna'] }), [seg('その設計図が、今日のテーマ、遺伝子です。', 'その設計図が、今日のテーマ、遺伝子です。', 'gene', { post: 0.35 })]),
      beat('before', S('全体像', 'verbatim', ['c01-0025'], { board: ['a1', 'c-q'] }), [seg('ただ、その前に、ひとつ確かめておかなければいけないことがあります。', 'ただ、その前に、ひとつ確かめておかなければいけないことがあります。', 'before', { post: 0.25 })]),
      beat('ask', S('全体像', 'verbatim', ['c01-0026']), [
        seg('そもそも、遺伝を担っている物質は、', 'そもそも、遺伝を担っている物質は、', 'ask'),
        seg('本当に**DNA**なのか。', '本当にディーエヌエーなのか。', 'q-dna', { pre: 0.1, post: 0.35 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 380, z: 0.92, note: '講義室の引き' },
      { at: 'start', move: 'push', x: 640, y: 330, z: 1.1, dur: 6, note: 'ゆっくり前進' },
      { at: 'q-dna', move: 'crash', x: 640, y: 470, z: 2.4, dur: 0.22, hold: 0.32, note: '「DNA」の語で「？」へ急接近 → 静止' },
    ],
    fx: [{ at: 'q-dna', kind: 'focus', dur: 1.4, min: 'gekiga' }, { at: 'q-dna', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'q-dna', kind: 'onoma', text: 'ドンッ', x: 1010, y: 175, dur: 1.2, min: 'gekiga' }, { at: 'q-dna', kind: 'invert', dur: 0.12, min: 'ultra' }, { at: 'q-dna', kind: 'shake', dur: 0.4, min: 'gekiga' }, TONE],
    sfx: [{ at: 'start', kind: 'chalk', gain: 0.5 }, { at: 'q-dna', kind: 'boom' }, { at: 'q-dna', kind: 'whoosh', gain: 0.6 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '夜の講義室。黒板の前を舞うチョークの粉と、一筋の光。', subject: HALL, accuracy: 'no people, no writing on the board' },
      { id: 'b', from: 'ask', mode: 'background', desc: '同じ講義室、光の筋が強くなる。', subject: HALL + ', the light grows harsher', accuracy: 'no people, no writing on the board' }],
    data: { boardIds: ['c-dna', 'a1', 'c-q'], write: { 'c-dna': 'gene', a1: 'before', 'c-q': 'before+1.2' } },
  };
}

/* ---------- テーマ2 ---------- */
const DOGMA_MAP = { bx: 1720, by: 520, sx: 640, sy: 300, k: 0.8 };
function dogmaBoard(): SceneDef {
  return {
    id: 'X', title: 'DNA → RNA → タンパク質', visual: 'board', lecturer: true, chapter: 'テーマ2　セントラルドグマ',
    picture: '黒板中央。「？」を消して「RNA」、矢印、「タンパク質」と書き足し、「＝遺伝子の実体」「（生物らしさの発揮）」を添える（板書 c-rna・a2・c-pro・c-dna-n・c-pro-n）。',
    diagram: { id: 'board-dogma', title: '板書：DNA → RNA → タンパク質', note: '第1講の黒板・中央の列' },
    beats: [
      beat('back', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0047']), [
        seg('では、黒板の真ん中に戻ります。', 'では、黒板の真ん中に戻ります。', 'back', { post: 0.15 }),
        seg('DNAが設計図だとして、DNAは何を作るのか。', 'ディーエヌエーが設計図だとして、ディーエヌエーは何を作るのか。', 'what', { post: 0.3 }),
      ]),
      beat('rna', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0050'], { board: ['c-rna'] }), [seg('ここに入るのは、**RNA**です。', 'ここに入るのは、アールエヌエーです。', 'rna', { post: 0.2 })]),
      beat('pro', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0051'], { board: ['a2', 'c-pro'] }), [seg('そして、RNAから、**タンパク質**が作られます。', 'そして、アールエヌエーから、タンパク質が作られます。', 'pro', { post: 0.3 })]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 300, z: 1.0, note: '黒板中央の列' },
      { at: 'what', move: 'push', x: 640, y: 270, z: 1.25, dur: 2, note: '「？」へ寄る' },
      { at: 'rna', move: 'crash', x: 640, y: 300, z: 1.7, dur: 0.22, hold: 0.2, note: '「RNA」で急接近' },
      { at: 'pro', move: 'pull', x: 640, y: 320, z: 1.0, dur: 0.5, note: '「タンパク質」で引いて三段を見せる' },
    ],
    fx: [{ at: 'rna', kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'pro', kind: 'focus', dur: 0.9, min: 'gekiga' }, TONE],
    sfx: [{ at: 'back', kind: 'chalk', gain: 0.5 }, { at: 'rna', kind: 'impact', gain: 0.7 }, { at: 'pro', kind: 'chalk', gain: 0.6 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '夜の講義室。', subject: HALL, accuracy: 'no people, no writing on the board' }],
    data: { items: [
      { id: 'c-dna', at: 'start-1' }, { id: 'a1', at: 'start-1' }, { id: 'c-q', at: 'start-1', until: 'rna-0.4' },
      { id: 'c-rna', at: 'rna' }, { id: 'a2', at: 'pro' }, { id: 'c-pro', at: 'pro+0.5' }, { id: 'c-dna-n', at: 'pro+1.4' }, { id: 'c-pro-n', at: 'pro+1.8' },
    ], map: DOGMA_MAP, lecturerX: 200 },
  };
}
function dogmaNames(): SceneDef {
  return {
    id: 'X', title: '転写と翻訳', visual: 'board', lecturer: true,
    picture: '同じ黒板の2本の矢印に、黄色で「転写」「翻訳」と書き込み、丸で囲む（板書 t-trx・t-trl）。言った瞬間にその矢印へ急接近。',
    diagram: { id: 'board-dogma', title: '板書：転写・翻訳', note: '第1講の黒板 t-trx・t-trl' },
    beats: [
      beat('trx', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0055'], { board: ['t-trx'] }), [
        seg('DNAの情報をRNAに写し取ること。', 'ディーエヌエーの情報をアールエヌエーに写し取ること。', 'copy'),
        seg('これを**転写**といいます。', 'これを転写といいます。', 'trx', { at: 0.25, pre: 0.1, post: 0.3 }),
      ]),
      beat('trl', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0056'], { board: ['t-trl'] }), [
        seg('RNAの情報をもとに、アミノ酸をつないでタンパク質を作ること。', 'アールエヌエーの情報をもとに、アミノ酸をつないでタンパク質を作ること。', 'join'),
        seg('これを**翻訳**といいます。', 'これを翻訳といいます。', 'trl', { at: 0.25, pre: 0.1, post: 0.35 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 320, z: 1.0, note: '三段の全景' },
      { at: 'copy', move: 'push', x: 680, y: 210, z: 1.35, dur: 1.5, note: '上の矢印へ' },
      { at: 'trx', move: 'crash', x: 690, y: 210, z: 2.0, dur: 0.2, hold: 0.25, note: '「転写」で急接近' },
      { at: 'join', move: 'whip', x: 690, y: 385, z: 1.5, dur: 0.25, note: '下の矢印へ高速パン' },
      { at: 'trl', move: 'crash', x: 690, y: 385, z: 2.0, dur: 0.2, hold: 0.25, note: '「翻訳」で急接近' },
    ],
    fx: [{ at: 'trx', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'trl', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'join', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'trx', kind: 'onoma', text: 'ズバッ', x: 1080, y: 170, dur: 0.9, min: 'ultra' }, TONE],
    sfx: [{ at: 'trx', kind: 'impact' }, { at: 'join', kind: 'whoosh', gain: 0.6 }, { at: 'trl', kind: 'impact' }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '夜の講義室。', subject: HALL, accuracy: 'no people, no writing on the board' }],
    data: { items: [
      { id: 'c-dna', at: 'start-1' }, { id: 'a1', at: 'start-1' }, { id: 'c-rna', at: 'start-1' }, { id: 'a2', at: 'start-1' }, { id: 'c-pro', at: 'start-1' }, { id: 'c-dna-n', at: 'start-1' }, { id: 'c-pro-n', at: 'start-1' },
      { id: 't-trx', at: 'trx-0.3' }, { id: 't-trl', at: 'trl-0.3' },
    ], marks: [{ id: 't-trx', at: 'trx+0.3', color: 'y' }, { id: 't-trl', at: 'trl+0.3', color: 'y' }], map: DOGMA_MAP, lecturerX: 200 },
  };
}
function transcription(): SceneDef {
  return {
    id: 'X', title: '転写の現場：RNAポリメラーゼ', visual: 'transcription',
    picture: '黒板の「転写」の矢印へ突っ込むと分子の世界。DNAの二本鎖の一部がほどけ、RNAポリメラーゼが鋳型鎖の上を進みながら、相補的な塩基（TのかわりにU）でRNAを伸ばしていく。',
    diagram: { id: 'transcription', title: '転写：DNA → RNA', note: 'c01-0060。鋳型鎖に相補的なRNA（A–U, T–A, G–C, C–G）。コード鎖とRNAは同じ配列（TがU）' },
    beats: [
      beat('peek', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0059']), [
        seg('では、この二つの矢印の中で、実際に何が起きているのか。', 'では、この二つの矢印の中で、実際に何が起きているのか。', 'peek', { post: 0.1 }),
        seg('分子のレベルで、少しだけのぞいてみましょう。', '分子のレベルで、少しだけのぞいてみましょう。', 'dive', { post: 0.3 }),
      ]),
      beat('pol', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0060']), [
        seg('DNAの上を、**RNAポリメラーゼ**という酵素が進みながら、', 'ディーエヌエーの上を、アールエヌエーポリメラーゼという酵素が進みながら、', 'pol'),
        seg('RNAを写し取っていきます。', 'アールエヌエーを写し取っていきます。', 'copy'),
        seg('これが**転写**です。', 'これが転写です。', 'trx', { pre: 0.1, post: 0.35 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 0.75, note: '分子の世界の全景' },
      { at: 'dive', move: 'push', x: 640, y: 360, z: 1.0, dur: 1.8, note: 'のぞき込む' },
      { at: 'pol', move: 'push', x: 560, y: 380, z: 1.35, dur: 1.2, note: 'ポリメラーゼへ寄る' },
      { at: 'copy', move: 'pan', x: 760, y: 340, z: 1.35, dur: 2.2, note: '鎖に沿って移動（RNAが伸びる）' },
      { at: 'trx', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.35, note: '「転写」で急激に引く' },
    ],
    fx: [{ at: 'dive', kind: 'flash', dur: 0.3, min: 'gekiga' }, { at: 'pol', kind: 'focus', dur: 0.8, min: 'ultra' }, { at: 'trx', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'trx', kind: 'onoma', text: 'ゴゴゴ', x: 1110, y: 140, dur: 1.0, min: 'ultra' }, TONE],
    sfx: [{ at: 'dive', kind: 'whoosh' }, { at: 'pol', kind: 'riser', gain: 0.4 }, { at: 'trx', kind: 'impact' }],
    shots: [
      { id: 'a', from: 'start', mode: 'background', desc: '細胞核の中の暗い水の世界。', subject: MOLECULAR, accuracy: 'background only, no molecules in focus, ' + NO_TEXT },
      { id: 'b', from: 'copy', mode: 'background', desc: '同じ世界でカメラが横へ流れる。', subject: MOLECULAR + ', the camera tracks sideways', accuracy: 'background only, ' + NO_TEXT },
    ],
  };
}
function translation(): SceneDef {
  return {
    id: 'X', title: '翻訳の現場：3つの塩基 → アミノ酸1つ', visual: 'translation',
    picture: 'RNAが核膜孔から核の外へ。リボソームがRNAを3塩基（コドン）ずつ読み、アミノ酸がひとつずつつながっていく（AUG=Met, GCU=Ala, UUC=Phe, GGA=Gly, AAA=Lys, UGG=Trp）。',
    diagram: { id: 'translation', title: '翻訳：コドン3塩基 → アミノ酸', note: 'c01-0061。遺伝暗号表どおりのコドンとアミノ酸。tRNAは省略（第4講で扱う）' },
    beats: [beat('trl', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0061']), [
      seg('そのRNAが核の外に出ると、', 'そのアールエヌエーが核の外に出ると、', 'out'),
      seg('3つの塩基ずつ読まれて、', '3つの塩基ずつ読まれて、', 'three'),
      seg('アミノ酸が一つずつつながっていく。', 'アミノ酸が一つずつつながっていく。', 'chain'),
      seg('これが**翻訳**です。', 'これが翻訳です。', 'trl', { pre: 0.1, post: 0.4 }),
    ])],
    cams: [
      { at: 'start', move: 'set', x: 380, y: 360, z: 1.2, note: '核膜孔の出口' },
      { at: 'three', move: 'whip', x: 620, y: 380, z: 1.35, dur: 0.3, note: 'リボソームへ高速パン' },
      { at: 'chain', move: 'pan', x: 760, y: 340, z: 1.3, dur: 2.0, note: 'RNAに沿って移動（アミノ酸の鎖が伸びる）' },
      { at: 'trl', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.35, note: '「翻訳」で急激に引く' },
    ],
    fx: [{ at: 'three', kind: 'speed', dur: 0.35, min: 'gekiga' }, { at: 'trl', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'chain', kind: 'onoma', text: 'カチッ', x: 1080, y: 170, dur: 0.8, min: 'ultra' }, TONE],
    sfx: [{ at: 'out', kind: 'whoosh', gain: 0.5 }, { at: 'three', kind: 'tick' }, { at: 'chain', kind: 'tick' }, { at: 'chain+0.6', kind: 'tick' }, { at: 'chain+1.2', kind: 'tick' }, { at: 'trl', kind: 'impact' }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '細胞質の暗い世界。粒がゆっくり流れる。', subject: 'the dark crowded cytoplasm of a cell, out-of-focus particles drifting, warm rim light, slow tracking shot', accuracy: 'background only, ' + NO_TEXT }],
  };
}
function contrast(): SceneDef {
  return {
    id: 'X', title: '写すのが転写、置き換えるのが翻訳', visual: 'contrast',
    picture: '画面を左右に割る。左「転写＝写す」：DNAの文字をRNAの文字へ（同じ言葉：塩基→塩基）。右「翻訳＝別の言葉に置き換える」：塩基3文字→アミノ酸1つ。',
    diagram: { id: 'contrast', title: '転写と翻訳の区別', note: 'c01-0058' },
    beats: [beat('memo', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0058']), [
      seg('写すのが**転写**、', '写すのが転写、', 'copy'),
      seg('別の言葉、つまりアミノ酸の言葉に置き換えるのが**翻訳**。', '別の言葉、つまりアミノ酸の言葉に置き換えるのが翻訳。', 'trans'),
      seg('そう覚えてください。', 'そう覚えてください。', 'memo', { post: 0.35 }),
    ])],
    cams: [
      { at: 'start', move: 'set', x: 330, y: 360, z: 1.3, note: '左のコマ「転写」' },
      { at: 'trans', move: 'whip', x: 950, y: 360, z: 1.3, dur: 0.25, note: '右のコマ「翻訳」へ高速パン' },
      { at: 'memo', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.4, note: '2コマを並べる' },
    ],
    fx: [{ at: 'trans', kind: 'speed', dur: 0.3, min: 'gekiga' }, { at: 'memo', kind: 'impact', dur: 0.4, min: 'gekiga' }, TONE],
    sfx: [{ at: 'copy', kind: 'tick' }, { at: 'trans', kind: 'whoosh' }, { at: 'memo', kind: 'impact', gain: 0.7 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '暗い背景に光の筋。', subject: 'abstract dark background, slow streaks of warm light drifting, subtle film grain', accuracy: NO_TEXT }],
  };
}
function universal(): SceneDef {
  return {
    id: 'X', title: 'セントラルドグマ：細菌からヒトまで', visual: 'universal',
    picture: '「セントラルドグマ」の筆文字が叩きつけられる。続いて、細菌（核がなくDNAは細胞質の核様体）からヒトまで、どの細胞にも同じ向き「DNA→RNA→タンパク質」が流れている。',
    diagram: { id: 'universal', title: 'セントラルドグマは普遍的', note: 'c01-0074・c01-0077、スライド48。細菌は核をもたない（核様体）' },
    beats: [
      beat('name', S('テーマ2　セントラルドグマ', 'verbatim', ['c01-0074'], { slide: 48 }), [
        seg('分子生物学の、**セントラルドグマ**。', '分子生物学の、セントラルドグマ。', 'name', { at: 0.4, post: 0.15 }),
        seg('中心となる教義、という意味です。', '中心となる教義、という意味です。', 'mean', { post: 0.3 }),
      ]),
      beat('all', S('テーマ2　セントラルドグマ', 'trimmed', ['c01-0077'], { slide: 48, board: ['r2b'] }), [
        seg('細菌からヒトに至るまで、', '細菌からヒトに至るまで、', 'from'),
        seg('すべての細胞は、遺伝情報をこの向きで発現します。', 'すべての細胞は、遺伝情報をこの向きで発現します。', 'dir'),
        seg('**普遍的な原理**なんです。', '普遍てきな原理なんです。', 'univ', { pre: 0.1, post: 0.4 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 300, z: 1.3, note: '題字の寄り' },
      { at: 'name', move: 'crash', x: 640, y: 260, z: 1.45, dur: 0.2, hold: 0.25, note: '「セントラルドグマ」で急接近' },
      { at: 'from', move: 'pull', x: 640, y: 380, z: 1.0, dur: 0.45, note: '引いて細菌〜ヒトを並べる' },
      { at: 'dir', move: 'pan', x: 700, y: 380, z: 1.05, dur: 2.5, note: '横へ流す' },
    ],
    fx: [{ at: 'name', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'name', kind: 'focus', dur: 1.2, min: 'gekiga' }, { at: 'univ', kind: 'flash', dur: 0.3, min: 'gekiga' }, { at: 'name', kind: 'onoma', text: 'ドンッ', x: 1080, y: 150, dur: 1.0, min: 'ultra' }, TONE],
    sfx: [{ at: 'name', kind: 'boom' }, { at: 'from', kind: 'whoosh', gain: 0.6 }, { at: 'univ', kind: 'shimmer' }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '暗い空間に光の粒が流れる。', subject: 'abstract dark space with flowing glowing particles, slow sideways camera move', accuracy: NO_TEXT }],
  };
}

/* ---------- テーマ3 ---------- */
function hierarchy(): SceneDef {
  return {
    id: 'X', title: '生体の階層性：遺伝子 → 疾患', visual: 'hierarchy', chapter: 'テーマ3　遺伝子の変化と疾患',
    picture: '二重らせん（遺伝子）から急激にズームアウト：タンパク質（分子）→ 細胞 → 組織（細胞の層）→ 個体（ヒト）。「疾患」で画面が赤く脈打つ。続けて一気に一番下の遺伝子まで戻る。',
    diagram: { id: 'hierarchy', title: '生体の階層性', note: '板書 hier1「遺伝子→分子→細胞」・hier2「→組織→個体→疾患」、c01-0010・c01-0011' },
    beats: [
      beat('levels', S('全体像', 'verbatim', ['c01-0010'], { board: ['hier1', 'hier2'] }), [
        seg('遺伝子、', '遺伝子、', 'l0'), seg('分子、', '分子、', 'l1'), seg('細胞、', '細胞、', 'l2'), seg('組織、', '組織、', 'l3'), seg('個体。', '個体。', 'l4', { post: 0.2 }),
        seg('そして、うまくいかなかったときに現れるのが、', 'そして、うまくいかなかったときに現れるのが、', 'wrong'),
        seg('**疾患**です。', '疾患です。', 'l5', { pre: 0.15, post: 0.35 }),
      ]),
      beat('stack', S('全体像', 'verbatim', ['c01-0011']), [
        seg('生き物は、小さな部品が階層的に積み上がってできています。', '生き物は、小さな部品が階層てきに積み上がってできています。', 'stack'),
        seg('いちばん下の階層にあるのが、**遺伝子**です。', 'いちばん下の階層にあるのが、遺伝子です。', 'bottom', { at: 0.3, post: 0.35 }),
      ]),
    ],
    cams: [{ at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '階層のズームは図そのものが行う（遺伝子→個体へ6倍ずつ）' }],
    fx: [{ at: 'l1', kind: 'speed', dur: 0.25, min: 'ultra' }, { at: 'l4', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'l5', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'l5', kind: 'shake', dur: 0.4, min: 'gekiga' }, { at: 'l5', kind: 'onoma', text: 'ドクン', x: 1060, y: 170, dur: 1.1, min: 'gekiga' }, { at: 'bottom', kind: 'focus', dur: 1.0, min: 'gekiga' }, TONE],
    sfx: [{ at: 'l0', kind: 'whoosh', gain: 0.5 }, { at: 'l1', kind: 'whoosh', gain: 0.5 }, { at: 'l2', kind: 'whoosh', gain: 0.5 }, { at: 'l3', kind: 'whoosh', gain: 0.5 }, { at: 'l4', kind: 'impact', gain: 0.7 }, { at: 'l5', kind: 'heartbeat' }, { at: 'bottom', kind: 'whoosh' }],
    shots: [
      { id: 'a', from: 'start', mode: 'background', desc: '暗い空間を、光の粒が後ろへ流れていく（引いていく感覚）。', subject: 'abstract dark space, glowing particles rushing away from the camera as it pulls back very fast, depth layers', accuracy: 'background only, ' + NO_TEXT },
      { id: 'b', from: 'stack', mode: 'background', desc: '逆に、光の粒へ突っ込んでいく。', subject: 'abstract dark space, the camera dives forward fast through glowing particles toward a tiny bright point', accuracy: 'background only, ' + NO_TEXT },
    ],
  };
}
function disease(): SceneDef {
  return {
    id: 'X', title: '遺伝子の変化 → 疾患', visual: 'disease', lecturer: false,
    picture: '黒板右の「遺伝子の変化 → 疾患」（板書 dz-h・dz1〜dz3）。下に図：21番染色体が3本（トリソミー＝数の異常）、1つの遺伝子に1か所の変異（Lamin A/C・TCOF1）。患者の顔は描かない。',
    diagram: { id: 'disease', title: '数の異常と遺伝子1つの変異', note: 'c01-0084〜0088、スライド12・13、板書 dz-h〜dz3' },
    beats: [
      beat('q', S('テーマ3　遺伝子の変化と疾患', 'trimmed', ['c01-0084'], { slide: 12 }), [seg('最後に、設計図に変化が起きると何が起こるのか。', '最後に、設計図に変化が起きると何が起こるのか。', 'q', { post: 0.3 })]),
      beat('down', S('テーマ3　遺伝子の変化と疾患', 'verbatim', ['c01-0085'], { slide: 12, board: ['dz1'] }), [
        seg('ダウン症候群。', 'ダウン症候群。', 'down', { post: 0.1 }),
        seg('21番染色体が1本多い、染色体の数の異常です。', '21番染色体が1本多い、染色体の数の異常です。', 'tri', { post: 0.25 }),
      ]),
      beat('prog', S('テーマ3　遺伝子の変化と疾患', 'verbatim', ['c01-0086'], { slide: 12, board: ['dz2'] }), [
        seg('ハッチンソン・ギルフォード・プロジェリア症候群。', 'ハッチンソン・ギルフォード・プロジェリア症候群。', 'prog', { post: 0.1 }),
        seg('**Lamin A/C**という、たった一つの遺伝子の変異で、急速に老化が進みます。', 'ラミンエーシーという、たった一つの遺伝子の変異で、急速に老化が進みます。', 'lmna', { post: 0.25 }),
      ]),
      beat('tcs', S('テーマ3　遺伝子の変化と疾患', 'verbatim', ['c01-0087'], { slide: 13, board: ['dz3'] }), [
        seg('トリーチャー・コリンズ症候群。', 'トリーチャー・コリンズ症候群。', 'tcs', { post: 0.1 }),
        seg('こちらは**TCOF1**遺伝子の変異などで、顔の骨の形成に異常が起こります。', 'こちらはティーコフワン遺伝子の変異などで、顔の骨の形成に異常が起こります。', 'tcof', { post: 0.3 }),
      ]),
      beat('both', S('テーマ3　遺伝子の変化と疾患', 'trimmed', ['c01-0088']), [seg('どちらも、体の形や働きに大きく影響します。', 'どちらも、体の形や働きに大きく影響します。', 'both', { post: 0.35 })]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: '黒板と図' },
      { at: 'tri', move: 'crash', x: 300, y: 480, z: 1.7, dur: 0.22, hold: 0.2, note: '3本目の21番染色体へ急接近' },
      { at: 'prog', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.4, note: '引く' },
      { at: 'lmna', move: 'push', x: 860, y: 470, z: 1.6, dur: 0.8, note: '遺伝子の1か所の変異へ寄る' },
      { at: 'tcof', move: 'pan', x: 860, y: 470, z: 1.6, dur: 0.5, note: '同じ図で TCOF1' },
      { at: 'both', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.4, note: '全体へ' },
    ],
    fx: [{ at: 'tri', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'tri', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'lmna', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'both', kind: 'flash', dur: 0.25, min: 'gekiga' }, { at: 'tri', kind: 'invert', dur: 0.1, min: 'ultra' }, TONE],
    sfx: [{ at: 'q', kind: 'riser', gain: 0.4 }, { at: 'tri', kind: 'impact' }, { at: 'lmna', kind: 'tick' }, { at: 'tcof', kind: 'tick' }, { at: 'both', kind: 'boom', gain: 0.6 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '夜の講義室。', subject: HALL, accuracy: 'no people, no writing on the board, no patients, no faces' }],
    data: { items: [{ id: 'dz-h', at: 'q' }, { id: 'dz1', at: 'down' }, { id: 'dz2', at: 'prog' }, { id: 'dz3', at: 'tcs' }], map: { bx: 2190, by: 936, sx: 110, sy: 62, k: 0.9 } },
  };
}
function hierLine(): SceneDef {
  return {
    id: 'X', title: '一番下の変化が、疾患まで届く', visual: 'hier-line',
    picture: '縦に積んだ階層（遺伝子・分子・細胞・組織・個体・疾患）。一番下の遺伝子から一本の光の線が駆け上がり、疾患の段で炸裂する。',
    diagram: { id: 'hier-line', title: '遺伝子から疾患まで一本の線', note: 'c01-0089、板書 hier2 をなぞる（!p hier2）' },
    beats: [beat('line', S('テーマ3　遺伝子の変化と疾患', 'trimmed', ['c01-0089'], { board: ['hier2'] }), [
      seg('遺伝子という一番下の階層の変化が、', '遺伝子という一番下の階層の変化が、', 'up'),
      seg('個体の、そして**疾患**の階層まで届いているわけです。', '個体の、そして疾患の階層まで届いているわけです。', 'reach', { post: 0.45 }),
    ])],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 520, z: 1.5, note: '一番下（遺伝子）' },
      { at: 'up', move: 'pan', x: 640, y: 360, z: 1.2, dur: 2.2, note: '線と一緒に駆け上がる' },
      { at: 'reach', move: 'crash', x: 780, y: 160, z: 1.5, dur: 0.25, hold: 0.25, note: '「疾患」で急接近' },
    ],
    fx: [{ at: 'reach', kind: 'impact', dur: 0.45, min: 'gekiga' }, { at: 'reach', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'up', kind: 'speed', dur: 0.5, min: 'ultra' }, TONE],
    sfx: [{ at: 'up', kind: 'riser', gain: 0.6 }, { at: 'reach', kind: 'boom' }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '暗い空間を下から上へ光が昇る。', subject: 'abstract dark vertical space, a beam of light rising from the bottom to the top, sparks', accuracy: NO_TEXT }],
  };
}

/* ---------- まとめ ---------- */
function summary(): SceneDef {
  return {
    id: 'X', title: '今日のまとめ：4つ', visual: 'board', lecturer: true, chapter: 'まとめ',
    picture: '黒板の下段に「今日のまとめ」①〜④（板書 sum-h・s1〜s4）。読み上げに合わせて1行ずつ書かれ、言い終わるごとに黄色の下線。',
    diagram: { id: 'board-summary4', title: '板書：今日のまとめ', note: '第1講の黒板 sum-h・s1〜s4、c01-0097〜0101' },
    beats: [
      beat('four', S('まとめ', 'verbatim', ['c01-0097'], { board: ['sum-h'] }), [seg('今日覚えてほしいのは、この4つです。', '今日覚えてほしいのは、この4つです。', 'four', { post: 0.3 })]),
      beat('p1', S('まとめ', 'verbatim', ['c01-0098'], { board: ['s1'] }), [
        seg('ひとつ目。', 'ひとつ目。', 'p1', { post: 0.1 }),
        seg('遺伝の本体は**DNA**。エイブリーの形質転換実験が根拠です。', '遺伝の本体はディーエヌエー。エイブリーの形質転換実験が根拠です。', 'p1b', { post: 0.3 }),
      ]),
      beat('p2', S('まとめ', 'verbatim', ['c01-0099'], { board: ['s2'] }), [
        seg('ふたつ目。', 'ふたつ目。', 'p2', { post: 0.1 }),
        seg('DNAから**転写**でRNA、**翻訳**でタンパク質。セントラルドグマです。', 'ディーエヌエーから転写でアールエヌエー、翻訳でタンパク質。セントラルドグマです。', 'p2b', { post: 0.3 }),
      ]),
      beat('p3', S('まとめ', 'verbatim', ['c01-0100'], { board: ['s3'] }), [
        seg('みっつ目。', 'みっつ目。', 'p3', { post: 0.1 }),
        seg('この流れは、細菌からヒトまで共通の、普遍的な原理です。', 'この流れは、細菌からヒトまで共通の、普遍てきな原理です。', 'p3b', { post: 0.3 }),
      ]),
      beat('p4', S('まとめ', 'verbatim', ['c01-0101'], { board: ['s4'] }), [
        seg('そして、遺伝子の変化は、分子から個体まで伝わって、**疾患**になりうる。', 'そして、遺伝子の変化は、分子から個体まで伝わって、疾患になりうる。', 'p4', { post: 0.45 }),
      ]),
    ],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: 'まとめの板書' },
      { at: 'p1', move: 'push', x: 600, y: 190, z: 1.3, dur: 0.6, note: '①へ' },
      { at: 'p2', move: 'pan', x: 600, y: 285, z: 1.3, dur: 0.5, note: '②へ' },
      { at: 'p3', move: 'pan', x: 600, y: 380, z: 1.3, dur: 0.5, note: '③へ' },
      { at: 'p4', move: 'pan', x: 600, y: 475, z: 1.3, dur: 0.5, note: '④へ' },
      { at: 'p4+2.5', move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.5, note: '4つを並べて引く' },
    ],
    fx: [{ at: 'p1', kind: 'impact', dur: 0.3, min: 'ultra' }, { at: 'p4+2.5', kind: 'focus', dur: 0.9, min: 'gekiga' }, TONE],
    sfx: [{ at: 'four', kind: 'chalk', gain: 0.5 }, { at: 'p1', kind: 'chalk', gain: 0.5 }, { at: 'p2', kind: 'chalk', gain: 0.5 }, { at: 'p3', kind: 'chalk', gain: 0.5 }, { at: 'p4', kind: 'chalk', gain: 0.5 }, { at: 'p4+2.5', kind: 'impact', gain: 0.6 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '夜の講義室。光がゆっくり強くなる。', subject: HALL + ', the light slowly grows warmer', accuracy: 'no people, no writing on the board' }],
    data: { items: [
      { id: 'sum-h', at: 'four', x: 150, y: 70, k: 0.85 },
      { id: 's1', at: 'p1', x: 150, y: 165, k: 0.6 }, { id: 's2', at: 'p2', x: 150, y: 260, k: 0.6 },
      { id: 's3', at: 'p3', x: 150, y: 355, k: 0.6 }, { id: 's4', at: 'p4', x: 150, y: 450, k: 0.6 },
    ], marks: [{ id: 's1', at: 'p1b+2', color: 'y', kind: 'under' }, { id: 's2', at: 'p2b+2.5', color: 'y', kind: 'under' }, { id: 's3', at: 'p3b+2', color: 'y', kind: 'under' }, { id: 's4', at: 'p4+2.2', color: 'r', kind: 'under' }], lecturerX: 1150, lecturerFace: -1 },
  };
}
function endCard(): SceneDef {
  return {
    id: 'X', title: '次回：第2講', visual: 'end-card',
    picture: '「次回 第2講」の判。設計図の「文字」＝DNAが何でできているか（ヌクレオチドの影）。黒にフェードアウト。',
    diagram: { id: 'end', title: '次回予告', note: 'c01-0103' },
    beats: [beat('next', S('まとめ', 'verbatim', ['c01-0103']), [
      seg('次の第2講では、この設計図の「文字」、', '次の第2講では、この設計図の文字、', 'next'),
      seg('つまりDNAが何でできているのかを見ていきます。', 'つまりディーエヌエーが何でできているのかを見ていきます。', 'what', { post: 1.0 }),
    ])],
    cams: [{ at: 'start', move: 'set', x: 640, y: 360, z: 1.15, note: '予告' }, { at: 'start', move: 'pull', x: 640, y: 360, z: 1.0, dur: 5, note: 'ゆっくり引いて終わる' }],
    fx: [{ at: 'next', kind: 'impact', dur: 0.4, min: 'gekiga' }, TONE],
    sfx: [{ at: 'next', kind: 'impact', gain: 0.6 }, { at: 'what', kind: 'shimmer', gain: 0.5 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '漆黒に墨がゆっくり広がる。', subject: 'pitch black void, sumi ink spreading slowly, gentle', accuracy: NO_TEXT }],
  };
}

/** the whole of 第1講, in lecture order */
export function lecture1Film(): SceneDef[] {
  const t1 = [s02(60), s03(), s04(60), s05('board', 60)];
  t1[0].chapter = 'テーマ1　設計図の正体はDNA';
  const scenes = [titleOpen(), zygote(), question(), ...t1, dogmaBoard(), dogmaNames(), transcription(), translation(), contrast(), universal(), hierarchy(), disease(), hierLine(), summary(), endCard()];
  scenes.forEach((s, i) => { s.id = `S${String(i + 1).padStart(2, '0')}`; });
  return scenes;
}

export const FILM_RATIONALE = [
  '第1講「遺伝子とは何か」を、講義の順（導入 → テーマ1 → テーマ2 → テーマ3 → まとめ）に1本の劇画授業映像にした完成版。',
  '台詞はすべて第1講の講義台詞（narrations/lecture-01.json）の原文、またはその一部。板書は講義の黒板の文字をそのまま使う。',
  '医学図：卵割、二重らせん（右巻き・主溝/副溝）、転写（鋳型鎖に相補的、TのかわりにU）、翻訳（遺伝暗号表どおりのコドン→アミノ酸）、細菌の核様体、21番染色体トリソミー、遺伝子1つの変異。患者の顔は描かない。',
];
