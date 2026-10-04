/**
 * 遺伝医学｜遺伝子の基礎 第1講 テーマ1「設計図の正体はDNA」— hand-directed lecture film.
 *
 * Material (MEDSTUDY): lessons/lecture-01.md テーマ1, narrations/lecture-01.json cues c01-0025…0046,
 * slide 14「エイブリーの形質転換実験（1944年）」(keyPoint + selfCheck), questions g14a / g14b,
 * blackboard items av-h / av1 / av-dna / av-no / av-c, c-dna / c-q.
 *
 * Every spoken line is the lecture's own sentence (verbatim / trimmed) or a condensation that keeps the
 * material's terms; tests check this against the narration JSON. Pictures that need to be exact (bacteria,
 * tubes in the material's order, the result, the board) are drawn by MEDSTUDY; Wan 2.2 supplies the world
 * around them and one feature insert (capsule forming), never text.
 */
import type { Beat, Duration, LessonStyle, SceneDef, SourceRef } from '../types';

const COURSE = 'genetics-basics', LECTURE = 1, SECTION = 'テーマ1　設計図の正体はDNA';
const src = (mode: SourceRef['mode'], cues: string[], extra: Partial<SourceRef> = {}): SourceRef => ({ course: COURSE, lecture: LECTURE, section: SECTION, cues, mode, ...extra });

/* ---------- the spoken lines ---------- */
const B = {
  ask: (): Beat => ({ id: 'ask', src: src('verbatim', ['c01-0026'], { board: ['c-dna', 'c-q'] }), segs: [
    { text: 'そもそも、遺伝を担っている物質は、', say: 'そもそも、遺伝を担っている物質は、', cue: 'ask' },
    { text: '本当に**DNA**なのか。', say: '本当にディーエヌエーなのか。', cue: 'q-dna', pre: 0.1, post: 0.25 },
  ] }),
  avery: (): Beat => ({ id: 'avery', src: src('verbatim', ['c01-0028'], { slide: 14 }), segs: [
    { text: '1944年、', say: '1944年、', cue: 'year' },
    { text: 'エイブリーは、2種類の**肺炎球菌**を使いました。', say: 'エイブリーは、2種類の肺炎球菌を使いました。', cue: 'two', post: 0.2 },
  ] }),
  /** 30 s: the year is on screen (the 1944 stamp) instead of spoken */
  averyShort: (): Beat => ({ id: 'avery', src: src('trimmed', ['c01-0028'], { slide: 14 }), segs: [
    { text: 'エイブリーは、2種類の**肺炎球菌**を使いました。', say: 'エイブリーは、2種類の肺炎球菌を使いました。', cue: 'year', post: 0.12 },
  ] }),
  strainsShort: (): Beat => ({ id: 'strains', src: src('condensed', ['c01-0029', 'c01-0030'], { slide: 14 }), segs: [
    { text: '被膜のある**S株**と、', say: '被膜のあるエス株と、', cue: 'S' },
    { text: '被膜のない**R株**。', say: '被膜のないアール株。', cue: 'R', post: 0.15 },
  ] }),
  strainsLong: (): Beat[] => [
    { id: 'strainS', src: src('verbatim', ['c01-0029'], { slide: 14 }), segs: [
      { text: '被膜があって表面が滑らかな**S株**。', say: '被膜があって表面が滑らかなエス株。', cue: 'S' },
      { text: 'これは病原性があります。', say: 'これは病原性があります。', cue: 'S-path', post: 0.2 },
    ] },
    { id: 'strainR', src: src('verbatim', ['c01-0030'], { slide: 14 }), segs: [
      { text: '被膜がなく、表面が滑らかでない**R株**。', say: '被膜がなく、表面が滑らかでないアール株。', cue: 'R' },
      { text: 'こちらは病原性がありません。', say: 'こちらは病原性がありません。', cue: 'R-path', post: 0.25 },
    ] },
  ],
  tubes: (): Beat => ({ id: 'tubes', src: src('verbatim', ['c01-0031'], { slide: 14 }), segs: [
    { text: 'S株から成分を1つずつ取り出して、', say: 'エス株から成分を1つずつ取り出して、', cue: 'extract' },
    { text: 'R株に加えてみる。', say: 'アール株に加えてみる。', cue: 'add', post: 0.1 },
    { text: '**DNA**、', say: 'ディーエヌエー、', cue: 't-dna' },
    { text: 'RNA、', say: 'アールエヌエー、', cue: 't-rna' },
    { text: '脂質、', say: '脂質、', cue: 't-lip' },
    { text: 'タンパク質、', say: 'タンパク質、', cue: 't-pro' },
    { text: '炭水化物。', say: '炭水化物。', cue: 't-carb', post: 0.2 },
  ] }),
  result: (): Beat => ({ id: 'result', src: src('verbatim', ['c01-0032'], { slide: 14, board: ['av-dna', 'av-no'] }), segs: [
    { text: 'すると、R株がS株に変わったのは、', say: 'すると、アール株がエス株に変わったのは、', cue: 'result' },
    { text: '**DNA**を加えたときだけでした。', say: 'ディーエヌエーを加えたときだけでした。', cue: 'only-dna', pre: 0.15, post: 0.2 },
  ] }),
  termShort: (): Beat => ({ id: 'term', src: src('trimmed', ['c01-0033'], { slide: 14 }), segs: [
    { text: 'これを**形質転換**といいます。', say: 'これを形質転換といいます。', cue: 'term', at: 0.2, speed: 0.95, pre: 0.12, post: 0.25 },
  ] }),
  termLong: (): Beat => ({ id: 'term', src: src('verbatim', ['c01-0033'], { slide: 14 }), segs: [
    { text: '性質が変わる。', say: '性質が変わる。', cue: 'change', post: 0.2 },
    { text: 'これを**形質転換**といいます。', say: 'これを形質転換といいます。', cue: 'term', at: 0.2, speed: 0.94, pre: 0.15, post: 0.35 },
  ] }),
  conclusion: (): Beat => ({ id: 'conclusion', src: src('trimmed', ['c01-0036'], { board: ['av-c'] }), segs: [
    { text: '遺伝の本体は**DNA**だ', say: '遺伝の本体はディーエヌエーだ', cue: 'box', at: 0.45, pre: 0.1, post: 0.45 },
  ] }),
  conclusionLong: (): Beat[] => [
    { id: 'conclusion', src: src('verbatim', ['c01-0036'], { board: ['av-c'] }), segs: [
      { text: 'つまり、性質を次に伝える物質、', say: 'つまり、性質を次に伝える物質、', cue: 'sum' },
      { text: '遺伝の本体は**DNA**だ、ということです。', say: '遺伝の本体はディーエヌエーだ、ということです。', cue: 'box', at: 0.35, pre: 0.1, post: 0.3 },
    ] },
    { id: 'important', src: src('verbatim', ['c01-0037'], { board: ['av-c'] }), segs: [
      { text: 'ここ、非常に重要です。赤で囲んでおきます。', say: 'ここ、非常に重要です。赤で囲んでおきます。', cue: 'red', post: 0.4 },
    ] },
  ],
  examPoint: (): Beat => ({ id: 'exam', src: src('condensed', [], { question: 'g14b', slide: 14 }), segs: [
    { text: '**結果**と**結論**を区別する。', say: '結果と結論を区別する。', cue: 'exam' },
    { text: '遺伝の本体は**DNA**。', say: '遺伝の本体は、ディーエヌエー。', cue: 'box', pre: 0.1, post: 0.35 },
  ] }),
  quiz: (): Beat[] => [
    { id: 'quizq', src: src('verbatim', ['c01-0041'], { question: 'g14b' }), segs: [
      { text: 'この問題は、実験の「結果」と、そこから言える「結論」を区別できるかを聞いています。', say: 'この問題は、実験の結果と、そこから言える結論を区別できるかを聞いています。', cue: 'quiz', post: 0.3 },
    ] },
    { id: 'quiza', src: src('verbatim', ['c01-0042'], { question: 'g14b' }), segs: [
      { text: '正解はC。', say: '正解はシー。', cue: 'answer', post: 0.2 },
      { text: 'R株をS株に変えたのはDNAだけ。', say: 'アール株をエス株に変えたのはディーエヌエーだけ。', cue: 'why' },
      { text: 'だから、形質を伝える物質はDNAだ、と言えます。', say: 'だから、形質を伝える物質はディーエヌエーだ、と言えます。', cue: 'then', post: 0.4 },
    ] },
  ],
};

/* ---------- shared prompt fragments ---------- */
const DIPLO = 'Streptococcus pneumoniae drawn as lancet-shaped diplococci (two slightly pointed oval cells joined end to end, always in pairs)';

/* ---------- scenes ---------- */
function s01(style: LessonStyle): SceneDef {
  const board = style !== 'documentary';
  return {
    id: 'S01', title: '問い：遺伝の本体は本当にDNAか',
    visual: board ? 'board-question' : 'title-question',
    lecturer: style === 'board',
    picture: board
      ? '夜の講義室。黒板の中央に大きく「DNA →？」（第1講の板書 c-dna / c-q）。講師が黒板を指す。「本当にDNAなのか」で「？」へカメラが急接近し、一瞬静止。'
      : '漆黒の画面に墨の筆致で「遺伝を担う物質は？」。「本当にDNAなのか」で「？」へカメラが急接近し、一瞬静止。',
    diagram: { id: 'board-dna-q', title: '板書：DNA →？', note: '第1講の黒板（c-dna「DNA」・a1・c-q「？」）をそのまま再現' },
    beats: [B.ask()],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 380, z: 0.92, note: '講義室の引きの画から' },
      { at: 'start', move: 'push', x: 640, y: 360, z: 1.12, dur: 3.4, note: 'ゆっくり前進（緊張を溜める）' },
      { at: 'q-dna', move: 'crash', x: 640, y: 470, z: 2.4, dur: 0.22, hold: 0.32, note: '「DNA」の語で「？」へ高速接近 → 一瞬静止' },
    ],
    fx: [
      { at: 'q-dna', kind: 'focus', dur: 1.4, min: 'gekiga' },
      { at: 'q-dna', kind: 'impact', dur: 0.5, min: 'gekiga' },
      { at: 'q-dna', kind: 'onoma', dur: 1.2, text: 'ドンッ', x: 1010, y: 175, min: 'gekiga' },
      { at: 'q-dna', kind: 'invert', dur: 0.12, min: 'ultra' },
      { at: 'q-dna', kind: 'shake', dur: 0.4, min: 'gekiga' },
      { at: 'start', kind: 'tone', dur: 99, min: 'gekiga' },
    ],
    sfx: [{ at: 'start', kind: 'chalk', gain: 0.5 }, { at: 'q-dna', kind: 'boom' }, { at: 'q-dna', kind: 'whoosh', gain: 0.6 }],
    shots: [{
      id: 'a', from: 'start', mode: 'background',
      desc: board ? '夜の講義室。黒板の前を舞うチョークの粉と、一筋の光。カメラはゆっくり前進。' : '漆黒の空間に墨が滲み、煙のように渦を巻く。',
      subject: board
        ? 'a dark empty lecture hall at night, a huge slate blackboard, a single hard shaft of light cutting through floating chalk dust, dust motes drifting slowly'
        : 'pitch black void, sumi ink blooming and swirling like smoke in water, slow turbulent motion',
      accuracy: 'no people, no writing on the board (the board text is added later)',
      avoid: 'writing, chalk text, equations',
    }],
  };
}

function s02(d: Duration): SceneDef {
  return {
    id: 'S02', title: 'S株とR株（肺炎球菌）',
    visual: 'strains',
    picture: '画面を斜めに割った2コマ。左＝S株（双球菌の周りに厚い被膜・表面が滑らか・病原性あり）、右＝R株（被膜なし・病原性なし）。「1944」のスタンプの後、S株→R株へ高速パン。',
    diagram: { id: 'strains', title: '肺炎球菌 S株／R株', note: 'スライド14・selfCheck「病原性があるのはS株（被膜あり・表面が滑らか）」。双球菌（2個対）で描き、被膜の有無だけを違いとして示す' },
    beats: d === 60 ? [B.avery(), ...B.strainsLong()] : [B.averyShort(), B.strainsShort()],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '2コマの全景' },
      { at: 'year', move: 'push', x: 640, y: 360, z: 1.08, dur: 1.2, note: '「1944」の判を押す（30秒版は画面のみで示す）' },
      { at: 'S', move: 'push', x: 360, y: 400, z: 1.45, dur: 0.45, note: 'S株のコマへ寄る（被膜を見せる）' },
      { at: 'R', move: 'whip', x: 920, y: 400, z: 1.45, dur: 0.24, note: 'R株へ高速パン（ホイップ）' },
    ],
    fx: [
      { at: 'year', kind: 'impact', dur: 0.35, min: 'gekiga' },
      { at: 'R', kind: 'speed', dur: 0.5, min: 'gekiga' },
      { at: 'S', kind: 'focus', dur: 0.8, min: 'ultra' },
      { at: 'R', kind: 'onoma', dur: 0.9, text: 'ザッ', x: 1110, y: 150, min: 'ultra' },
      { at: 'start', kind: 'tone', dur: 99, min: 'gekiga' },
    ],
    sfx: [{ at: 'year', kind: 'impact', gain: 0.7 }, { at: 'S', kind: 'shimmer', gain: 0.5 }, { at: 'R', kind: 'whoosh' }],
    shots: [
      { id: 'a', from: 'start', mode: 'background', desc: '暗い液体の微小世界。ピントの外れた双球菌の対がゆっくり漂い、粒子が光る。',
        subject: `a dark microscopic fluid world, out-of-focus ${DIPLO} drifting slowly, tiny particles sparkling, cold bioluminescent rim light, slow push-in`,
        accuracy: 'bacteria stay in pairs, no flagella, no cilia, no nucleus, no eyes or faces' },
      { id: 'b', from: 'S', mode: 'background', desc: '同じ微小世界でカメラが横へ流れる（S株→R株のパン）。',
        subject: `the same dark microscopic fluid world, ${DIPLO} out of focus, the camera sweeps sideways fast, motion blur streaks`,
        accuracy: 'bacteria stay in pairs, no flagella, no cilia, no nucleus, no eyes or faces' },
    ],
  };
}

function s03(): SceneDef {
  return {
    id: 'S03', title: 'S株の成分を1つずつR株へ',
    visual: 'tubes',
    picture: '教材の順（DNA・RNA・脂質・タンパク質・炭水化物）に並んだ5本の試験管。「R株に加えてみる」で5枚のR株の皿へ一斉に滴下。成分名を言うたびにカメラが試験管から試験管へ跳び、名前が叩きつけられる。',
    diagram: { id: 'tubes', title: 'S株の5成分 → R株', note: 'lecture-01 c01-0031 の列挙順。各成分は別々のR株に加える' },
    beats: [B.tubes()],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 380, z: 1.0, note: '試験管の列とR株の皿の全景' },
      { at: 'extract', move: 'push', x: 640, y: 300, z: 1.12, dur: 1.4, note: 'S株から取り出す（試験管へ寄る）' },
      { at: 'add', move: 'pull', x: 640, y: 380, z: 1.0, dur: 0.5, note: '5枚の皿へ滴下を見せる' },
      { at: 't-dna', move: 'crash', x: 200, y: 280, z: 1.9, dur: 0.2, hold: 0.12, note: 'DNA の試験管へ急接近' },
      { at: 't-rna', move: 'whip', x: 420, y: 280, z: 1.9, dur: 0.16, note: 'RNA へ跳ぶ' },
      { at: 't-lip', move: 'whip', x: 640, y: 280, z: 1.9, dur: 0.16, note: '脂質へ跳ぶ' },
      { at: 't-pro', move: 'whip', x: 860, y: 280, z: 1.9, dur: 0.16, note: 'タンパク質へ跳ぶ' },
      { at: 't-carb', move: 'whip', x: 1080, y: 280, z: 1.9, dur: 0.16, note: '炭水化物へ跳ぶ' },
      { at: 't-carb+0.7', move: 'pull', x: 640, y: 380, z: 1.0, dur: 0.35, note: '急激に引いて5本を並べる' },
    ],
    fx: [
      { at: 't-dna', kind: 'impact', dur: 0.3, min: 'gekiga' },
      { at: 't-rna', kind: 'speed', dur: 0.25, min: 'gekiga' },
      { at: 't-lip', kind: 'speed', dur: 0.25, min: 'gekiga' },
      { at: 't-pro', kind: 'speed', dur: 0.25, min: 'gekiga' },
      { at: 't-carb', kind: 'speed', dur: 0.25, min: 'gekiga' },
      { at: 'add', kind: 'onoma', dur: 0.9, text: 'ポタッ', x: 1110, y: 470, min: 'gekiga' },
      { at: 't-carb+0.7', kind: 'focus', dur: 0.6, min: 'ultra' },
      { at: 'start', kind: 'tone', dur: 99, min: 'gekiga' },
    ],
    sfx: [{ at: 'extract', kind: 'shimmer', gain: 0.4 }, { at: 'add', kind: 'tick' }, { at: 't-dna', kind: 'impact', gain: 0.8 }, { at: 't-rna', kind: 'tick' }, { at: 't-lip', kind: 'tick' }, { at: 't-pro', kind: 'tick' }, { at: 't-carb', kind: 'tick' }, { at: 't-carb+0.7', kind: 'whoosh', gain: 0.6 }],
    shots: [
      { id: 'a', from: 'start', mode: 'background', desc: '暗い実験台。ガラス器具がハードライトで光り、滴がスローモーションで落ちる。',
        subject: 'a dark laboratory bench, glass test tubes in a rack glinting under a single hard spotlight, a drop of clear liquid falling in slow motion into a glass dish, faint vapour',
        accuracy: 'glassware only, no labels, no colored liquids, no hands' },
      { id: 'b', from: 't-dna', mode: 'background', desc: '同じ実験台。カメラが試験管の列に沿って高速で横移動。',
        subject: 'the same dark laboratory bench, the camera tracks fast along a row of glass test tubes, glints streaking, motion blur',
        accuracy: 'glassware only, no labels, no colored liquids, no hands' },
    ],
  };
}

function s04(d: Duration): SceneDef {
  return {
    id: 'S04', title: 'DNAのときだけ R株→S株（形質転換）',
    visual: 'plates',
    picture: '5枚の培養皿。4枚はR株のまま（ざらついた平たいコロニー）。「DNAを加えたときだけ」でDNAの皿へ急接近、ざらついたコロニーが艶のある丸いS株型コロニーへ変わる。続いてR株の1個の双球菌に被膜がまとわりつく大写し（Wan）に「形質転換」の文字。',
    diagram: { id: 'plates', title: '結果：DNAを加えたときだけ S株に', note: 'c01-0032「R株がS株に変わったのは、DNAを加えたときだけ」・板書 av-dna / av-no。コロニーの見た目（S＝滑らか、R＝ざらざら）で示す' },
    beats: d === 60 ? [B.result(), B.termLong()] : [B.result(), B.termShort()],
    cams: [
      { at: 'start', move: 'set', x: 640, y: 380, z: 1.0, note: '5枚の皿の全景' },
      { at: 'result', move: 'push', x: 640, y: 380, z: 1.1, dur: 1.6, note: 'じわりと寄る' },
      { at: 'only-dna', move: 'crash', x: 205, y: 355, z: 2.0, dur: 0.22, hold: 0.4, note: 'DNA の皿へ急接近 → 静止' },
      { at: 'term', move: 'set', x: 640, y: 360, z: 1.0, note: '被膜が形成される双球菌の大写しへ切り替え' },
      { at: 'term', move: 'push', x: 640, y: 390, z: 1.22, dur: 2.0, note: '大写しへさらに寄る' },
    ],
    fx: [
      { at: 'only-dna', kind: 'focus', dur: 1.6, min: 'standard' },
      { at: 'only-dna', kind: 'impact', dur: 0.45, min: 'gekiga' },
      { at: 'only-dna', kind: 'onoma', dur: 1.3, text: 'ドクン', x: 1050, y: 190, min: 'gekiga' },
      { at: 'only-dna', kind: 'invert', dur: 0.1, min: 'ultra' },
      { at: 'only-dna', kind: 'shake', dur: 0.35, min: 'gekiga' },
      { at: 'term', kind: 'flash', dur: 0.25, min: 'gekiga' },
      { at: 'term', kind: 'onoma', dur: 1.1, text: 'ゴゴゴ', x: 160, y: 140, min: 'ultra' },
      { at: 'start', kind: 'tone', dur: 99, min: 'gekiga' },
    ],
    sfx: [{ at: 'result', kind: 'riser', gain: 0.5 }, { at: 'only-dna', kind: 'heartbeat' }, { at: 'only-dna', kind: 'boom', gain: 0.8 }, { at: 'term', kind: 'shimmer' }],
    shots: [
      { id: 'a', from: 'start', mode: 'background', desc: '硬いスポットライトの下、暗い実験台に並ぶ培養皿。光がゆっくり揺れる。',
        subject: 'a row of glass petri dishes on a dark bench under a hard spotlight, light slowly sweeping across, deep shadows',
        accuracy: 'dishes empty or with faint agar, no labels, no hands' },
      { id: 'b', from: 'term', mode: 'feature', desc: '1個の双球菌（R株）の大写し。厚く半透明で艶のある被膜が一気に包み込み、表面が滑らかになる。',
        subject: `extreme macro close-up of a single pair of ${DIPLO} floating in dark fluid; a thick translucent glossy capsule rapidly forms and envelops the pair, its surface turning smooth and shining`,
        accuracy: 'exactly one pair of cells, the capsule is a smooth translucent layer around the outside of the pair, cells keep their shape, no nucleus, no flagella, no faces',
        avoid: 'many bacteria, rod-shaped bacteria, spirals, viruses, DNA helix' },
    ],
  };
}

function s05(style: LessonStyle, d: Duration): SceneDef {
  if (style === 'exam') {
    return {
      id: 'S05', title: '試験のポイント：結果と結論',
      visual: 'exam-point',
      picture: '2段の判決カード。上段「結果：DNAだけで形質転換」、下段「結論：遺伝の本体＝DNA」（問題 g14b のポイント）。「DNA」で赤枠が叩き込まれ、急激にズームアウト。',
      diagram: { id: 'exam-point', title: '結果と結論', note: '問題 g14b「結果（DNAだけで形質転換）と結論（遺伝の本体＝DNA）を区別して読む」' },
      beats: [B.examPoint()],
      cams: [
        { at: 'start', move: 'set', x: 640, y: 300, z: 1.6, note: '「結果」に寄った画から' },
        { at: 'box', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.3, note: '「結論」で急激にズームアウト' },
      ],
      fx: [{ at: 'box', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'box', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'start', kind: 'tone', dur: 99, min: 'gekiga' }],
      sfx: [{ at: 'exam', kind: 'tick' }, { at: 'box', kind: 'impact' }],
      shots: [{ id: 'a', from: 'start', mode: 'background', desc: '暗い背景に光の筋がゆっくり流れる。',
        subject: 'abstract dark background, slow streaks of warm light drifting, subtle film grain', accuracy: 'no text, no symbols' }],
      data: { result: 'DNAだけで形質転換', conclusion: '遺伝の本体＝DNA' },
    };
  }
  const board = style === 'board';
  const beats = d === 60 ? B.conclusionLong() : [B.conclusion()];
  return {
    id: 'S05', title: 'まとめ：遺伝の本体＝DNA',
    visual: board ? 'board-summary' : 'result-card',
    lecturer: board,
    picture: board
      ? '黒板。「エイブリー（1944）」の板書（av-h・av1・av-dna・av-no）の下に「形質転換 → 遺伝の本体 ＝ DNA」が書かれ、赤チョークの枠が走る。「DNA」の寄りから急激にズームアウトして板書全体へ。'
      : '結果の表（成分ごとに R株のまま／S株に変化）の下に「遺伝の本体＝DNA」の判が押される。',
    diagram: { id: board ? 'board-avery' : 'result-table', title: board ? '板書：エイブリー（1944）' : '結果の表', note: board ? '第1講の黒板 av-h / av1 / av-dna / av-no / av-c（赤枠）' : 'c01-0035「DNAを加えたときだけ、R株がS株に変わった。ほかの成分では、R株のまま」' },
    beats,
    cams: [
      { at: 'start', move: 'set', x: 250, y: 370, z: 2.0, note: '板書「DNA → S株に変わる」の「DNA」に寄った画から' },
      { at: 'box', move: 'pull', x: 640, y: 380, z: 1.0, dur: 0.32, note: '赤枠と同時に急激なズームアウト' },
    ],
    fx: [{ at: 'box', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'box', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'box', kind: 'shake', dur: 0.25, min: 'ultra' }, { at: 'start', kind: 'tone', dur: 99, min: 'gekiga' }],
    sfx: [{ at: 'start', kind: 'chalk', gain: 0.6 }, { at: 'box', kind: 'impact' }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: board ? 'S01と同じ講義室。光の筋がゆっくり強くなる。' : '暗い背景に墨が広がる。',
      subject: board ? 'the same dark lecture hall, the shaft of light slowly growing brighter, chalk dust settling' : 'pitch black void, sumi ink spreading slowly', accuracy: 'no people, no writing' }],
  };
}

function s06quiz(): SceneDef {
  return {
    id: 'S06', title: '確認問題 g14b',
    visual: 'quiz',
    picture: '問題 g14b の5択（教材の文面そのまま）。「正解はC」で選択肢Cに赤丸が叩き込まれ、他の選択肢は退く。',
    diagram: { id: 'quiz-g14b', title: '問題 g14b', note: '確認問題 g14b の問題文と選択肢' },
    beats: B.quiz(),
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.0, note: '問題の全体' },
      { at: 'answer', move: 'crash', x: 640, y: 470, z: 1.5, dur: 0.22, hold: 0.25, note: '正解Cへ急接近' },
      { at: 'then', move: 'pull', x: 640, y: 360, z: 1.0, dur: 0.6, note: '引いて全体へ' },
    ],
    fx: [{ at: 'answer', kind: 'impact', dur: 0.4, min: 'gekiga' }, { at: 'answer', kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: 'start', kind: 'tone', dur: 99, min: 'gekiga' }],
    sfx: [{ at: 'answer', kind: 'impact' }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '暗い背景に光の筋。', subject: 'abstract dark background, slow streaks of light', accuracy: 'no text' }],
    data: { qid: 'g14b' },
  };
}

export const AVERY_KEY = 'genetics-basics:1:2';

export function averyScenes(duration: Duration, style: LessonStyle): SceneDef[] {
  const sc = [s01(style), s02(duration), s03(), s04(duration), s05(style, duration)];
  if (duration === 60) sc.push(s06quiz());
  return sc;
}

export const AVERY_RATIONALE = [
  '教材の順序どおりに選定：遺伝学の最初の教材「遺伝子の基礎」第1講は 導入 → 全体像 → テーマ1「設計図の正体はDNA」。テーマ1が、具体的な現象（実験）を伴う最初のテーマ。',
  'このテーマに紐づく素材：スライド14（キーポイント・セルフチェック5問）、確認問題 g14a / g14b、黒板 av-h〜av-c、まとめ（keyPoints 1）。',
  '映像化に向く理由：「何を加えたら、何が変わったか」という一本の因果（S株の成分 → R株 → DNAのときだけS株）で、30秒に収まり、正確な図（菌・試験管・皿・板書）で示せる。',
];
