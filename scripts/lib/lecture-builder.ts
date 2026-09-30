/**
 * Builds a lecture (shots + narrated cues) for one chapter from course content.
 *
 * The narration is written as a university lecturer would speak it:
 *  - textbook sentences are re-voiced from だ・である to です・ます
 *  - short transitional phrases connect ideas ("では、次に…", "ここが重要です。")
 *  - the viewer's gaze is guided to the slide / figure / animation on screen
 *  - key terms are repeated with emphasis
 *  - phrases rotate so the same expression is not repeated back-to-back
 *  - natural pauses (gap) separate sentences, ideas and scenes
 *
 * Only material from the lecture handout is narrated. Textbook "supplement"
 * blocks (knowledge outside the handout) are deliberately left out.
 */
import type { AnimScript } from '../../src/engine/animation/types';
import type { Lecture, LectureCue, LectureShot, LectureVisual, LecturePause } from '../../src/engine/lecture/types';
import type { AnimationMeta, ChapterText, CourseMeta, Figure, FigureDetail, SingleQuestion, Slide } from '../../src/content/types';
import { estimateDuration, plain, sentences, toSpeech } from '../../src/engine/speech/reading';

export const LECTURE_VERSION = 2;

export const SECTIONS = ['導入', '今日の学習目標', '基礎説明', '図解', 'アニメーションによる機序', '重要事項の整理', '試験で重要なポイント', 'まとめ'];

export interface BuildInput {
  course: CourseMeta;
  text: Record<string, ChapterText>;
  slides: Record<string, Slide>;
  questions: SingleQuestion[];
  figures: Record<string, Figure>;
  figureDetails: Record<string, Record<string, FigureDetail>>;
  animMeta: Record<string, AnimationMeta>;
  animScripts: Record<string, AnimScript>;
  polite: (html: string) => string;
}

/** Rotating phrase pools: deterministic, never the same phrase twice in a row. */
class Phrases {
  private idx = new Map<string, number>();
  pick(key: string, pool: string[]): string {
    const i = this.idx.get(key) ?? 0;
    this.idx.set(key, i + 1);
    return pool[i % pool.length];
  }
}

const GAP = { sentence: 0.32, comma: 0.18, idea: 0.55, scene: 0.8, question: 0.25 };
const ORD = ['まず', '次に', 'さらに', 'そして', '続いて', 'それから'];
const ordinal = (i: number, n: number) => (i === 0 ? 'まず' : i === n - 1 ? '最後に' : ORD[Math.min(i, ORD.length - 1)]);
const endDot = (s: string) => (/[。！？]$/.test(plain(s)) ? s : s + '。');
const joinTerms = (t: string[]) => (t.length <= 1 ? t.join('') : t.slice(0, -1).join('、') + '、そして' + t[t.length - 1]);
const stripLead = (h: string) => plain(h).replace(/^[\d\-]+\s*/, '');

export function buildLecture(input: BuildInput, chapterId: number): Lecture {
  const { course, text, slides, questions, figures, figureDetails, animMeta, animScripts, polite } = input;
  const ch = course.chapters.find((c) => c.id === chapterId)!;
  const tb = text[String(chapterId)];
  const P = new Phrases();
  const shots: LectureShot[] = [];
  const cues: LectureCue[] = [];
  let section = 0;

  type CueIn = { h: string; focus?: number | 'terms'; pause?: LecturePause; gap?: number };
  const shot = (visual: LectureVisual, list: (string | CueIn)[], min?: number) => {
    const si = shots.length;
    shots.push({ section, visual, ...(min ? { min } : {}) });
    list.forEach((c, k) => {
      const q: CueIn = typeof c === 'string' ? { h: c } : c;
      const speech = toSpeech(q.h);
      const isLast = k === list.length - 1;
      const gap = q.gap ?? (isLast ? GAP.scene : /[、,]$/.test(plain(q.h)) ? GAP.comma : GAP.sentence);
      cues.push({
        id: `c${String(chapterId).padStart(2, '0')}-${String(cues.length + 1).padStart(4, '0')}`,
        shot: si,
        text: q.h,
        speech,
        dur: +estimateDuration(speech).toFixed(2),
        gap,
        ...(q.focus !== undefined ? { focus: q.focus } : {}),
        ...(q.pause ? { pause: q.pause } : {}),
      });
    });
  };
  const talk = (h: string) => polite(h);

  /* ① 導入 */
  shot({ kind: 'title', chapter: ch.id, name: ch.name, role: ch.role, slides: ch.slides }, [
    `では、第${ch.id}講、「${ch.name}」を始めます。`,
    `今日扱うのは、スライド${ch.slides[0]}から${ch.slides[ch.slides.length - 1]}までです。`,
    `この講義では、細胞を一つの工場にたとえて考えます。今日の舞台は「${ch.role}」です。`,
    { h: talk(ch.overview.one.replace(/章。$/, '章です。')), gap: GAP.scene },
  ]);
  const lead = tb.blocks.find((b) => b.type === 'lead');
  if (lead && lead.type === 'lead') {
    const ss = sentences(lead.html);
    shot({ kind: 'board', title: '導入', html: lead.html, style: 'lead', sentences: ss }, ss.map((s, i) => ({ h: talk(s), focus: i })));
  }

  /* ② 目標 + 全体像 */
  section = 1;
  const nums = ['1つ目', '2つ目', '3つ目', '4つ目', '5つ目'];
  shot({ kind: 'list', title: '今日の学習目標', items: ch.points, style: 'goal' }, [
    { h: `今日の学習目標は${ch.points.length}つです。`, focus: -1 },
    ...ch.points.map((p, i) => ({ h: talk(`${nums[i]}。${endDot(p)}`), focus: i })),
    { h: '講義が終わったとき、この3つを自分の言葉で説明できる状態を目指しましょう。'.replace('3つ', `${ch.points.length}つ`), focus: ch.points.length - 1 },
  ]);
  const flow = ch.overview.flow;
  shot({ kind: 'flow', title: '全体像', items: flow, move: true }, [
    { h: '細かい話に入る前に、まず全体の流れをつかんでおきます。', focus: -1 },
    ...flow.map((f, i) => ({ h: talk(`${ordinal(i, flow.length)}、${endDot(f)}`), focus: i })),
    { h: 'この流れを頭に置いたまま、続きを聞いてください。', focus: flow.length - 1 },
  ]);

  /* ③ 基礎説明 */
  section = 2;
  let heading = '', hn = 0, termTurn = 0;
  for (const b of tb.blocks) {
    if (b.type === 'heading') {
      heading = b.html;
      hn++;
      const nm = stripLead(b.html).replace(/――/g, '、');
      shot({ kind: 'head', no: hn, text: b.html }, [
        hn === 1
          ? P.pick('first', [`では、本題に入りましょう。最初のテーマは「${nm}」です。`])
          : P.pick('next', [`続いて、「${nm}」を見ていきます。`, `では、次のテーマです。「${nm}」。`, `ここからは「${nm}」の話です。`, `次に進みましょう。「${nm}」です。`]),
      ]);
    } else if (b.type === 'paragraph') {
      const ss = sentences(b.html);
      const list: CueIn[] = ss.map((s, i) => ({ h: talk(s), focus: i }));
      const terms = [...new Set((b.html.match(/<b>(.*?)<\/b>/g) || []).map(plain))].filter((t) => t.length <= 14 && !/[るたいだ]$/.test(t));
      if (terms.length >= 2 && termTurn++ % 2 === 0) {
        const pre = P.pick('terms', ['ここが重要です。', 'この用語は必ず押さえてください。', '試験でもよく問われるところです。', 'ここはしっかり覚えておきましょう。']);
        list.push({ h: `${pre}${joinTerms(terms.slice(0, 3).map((t) => `<b>${t}</b>`))}。`, focus: 'terms' });
      }
      shot({ kind: 'board', title: heading, html: b.html, sentences: ss }, list);
    } else if (b.type === 'steps') {
      const n = b.items.length;
      shot({ kind: 'flow', title: heading, items: b.items, move: true }, [
        { h: P.pick('steps', ['ここは順番が大切です。流れで覚えましょう。', '順番に見ていきます。矢印の動きを目で追ってください。', 'この手順は、順番ごと覚えてしまいましょう。']), focus: -1 },
        ...b.items.map((x, i) => ({ h: talk(`${ordinal(i, n)}、${endDot(x)}`), focus: i })),
      ]);
    } else if (b.type === 'misconception') {
      const ss = sentences(b.html);
      shot({ kind: 'board', title: '注意：混同しやすいポイント', html: b.html, style: 'ng', sentences: ss }, [
        { h: P.pick('ng', ['ここは混同しやすいので、注意してください。', 'よくある勘違いを一つ紹介します。', '試験のひっかけになりやすいところです。']), focus: -1 },
        ...ss.map((s, i, a) => ({ h: talk(s), focus: i, ...(i === a.length - 1 ? { pause: { tag: '混同注意', html: b.html } } : {}) })),
      ]);
    } else if (b.type === 'analogy') {
      const ss = sentences(b.html);
      shot({ kind: 'board', title: 'たとえるなら', html: b.html, style: 'ana', sentences: ss }, [
        { h: P.pick('ana', ['イメージしやすいように、たとえてみます。', '身近なものにたとえると、こうなります。', '少したとえ話をしましょう。']), focus: -1 },
        ...ss.map((s, i) => ({ h: talk(s), focus: i })),
      ]);
    } else if (b.type === 'column') {
      const ss = sentences(b.html);
      shot({ kind: 'board', title: b.title, html: b.html, style: 'col', sentences: ss }, [
        { h: P.pick('col', ['ここで少し、視点を変えてみましょう。', 'ちょっと寄り道をします。', '一つ、大事な考え方を紹介します。']), focus: -1 },
        ...ss.map((s, i) => ({ h: talk(s), focus: i })),
      ]);
    } else if (b.type === 'table') {
      const R = b.rows, H = R[0];
      shot({ kind: 'table', title: heading, rows: R }, [
        { h: '表で比べてみましょう。', focus: 0 },
        ...R.slice(1).map((r, i) => ({ h: `${plain(r[0])}では、${H.slice(1).map((hd, j) => `${plain(hd)}は<b>${plain(r[j + 1])}</b>`).join('、')}です。`, focus: i + 1 })),
        { h: 'この対応は、表の形のまま覚えてしまいましょう。', focus: -1 },
      ]);
    } else if (b.type === 'slide') {
      const s = slides[String(b.slide)];
      const nb = s.masks.length;
      shot({ kind: 'slide', slide: s.n }, [
        P.pick('slide', [
          `では、スライド${s.n}、「${s.title}」を見てください。`,
          `ここでスライド${s.n}を見てみましょう。テーマは「${s.title}」です。`,
          `スライド${s.n}に目を移してください。「${s.title}」です。`,
          `画面のスライド${s.n}、「${s.title}」を確認しましょう。`,
        ]),
        ...sentences(s.keyPoint).map((x) => talk(x)),
        ...(nb ? [P.pick('mask', ['赤い枠で囲んだところに注目してください。ここが覚えるべき部分です。', '画面が順番に寄っていくところ、そこがこのスライドのポイントです。', '光っている枠の語句は、隠しても言えるようにしておきましょう。'])] : []),
      ], 2.2 + nb * 2.2);
    }
    // 'supplement' (outside the lecture handout) and 'lead' are intentionally not narrated here
  }

  /* ④ 図解 */
  section = 3;
  for (const f of ch.figures) {
    const F = figures[f], D = figureDetails[F.set];
    const keys = [...new Set((F.svg.match(/data-k="(\w+)"/g) || []).map((x) => x.slice(8, -1)))].filter((k) => D[k]);
    shot({ kind: 'figure', figure: f, key: null }, [
      P.pick('figIntro', [`ここからは図で整理しましょう。「${F.title}」です。`, `次は図解です。「${F.title}」を使って確認します。`]),
      '構造を一つずつ光らせながら、場所と役割を確かめていきます。',
    ]);
    keys.forEach((k, i) => {
      const d = D[k];
      shot({ kind: 'figure', figure: f, key: k }, [
        { h: i === 0 ? `まず、ここを見てください。<b>${plain(d.name)}</b>です。` : P.pick('figKey', [`次は、<b>${plain(d.name)}</b>。光っているところです。`, `続いて<b>${plain(d.name)}</b>を見ましょう。`, `では、<b>${plain(d.name)}</b>に移ります。`]) },
        ...sentences(d.text).map((s) => ({ h: talk(s) })),
        { h: P.pick('figFac', [`工場でいえば、<b>${plain(d.role)}</b>にあたります。`, `たとえるなら、<b>${plain(d.role)}</b>の役割です。`, `工場の中では、<b>${plain(d.role)}</b>ですね。`]) },
      ], 4);
    });
  }
  shot({ kind: 'cast', items: ch.overview.cast }, [
    { h: 'この章に出てくる構造を、工場の役割で整理しておきましょう。', focus: -1 },
    ...ch.overview.cast.map((x, i) => ({ h: `<b>${plain(x[0])}</b>は、工場でいえば「${plain(x[1])}」。${talk(endDot(x[2]))}`, focus: i })),
  ]);

  /* ⑤ アニメーション */
  section = 4;
  for (const aid of ch.animations) {
    const A = animMeta[aid], S = animScripts[aid];
    let first = true;
    S.steps.forEach((s, si) => {
      if (s.g === 'EXAM POINT' || s.g === 'REPLAY') return;
      const cs: CueIn[] = [];
      if (first) {
        cs.push({ h: P.pick('animIntro', ['ここからは、アニメーションで仕組みを見ていきます。', 'では、実際に動かして確かめてみましょう。']) });
        cs.push({ h: `テーマは「${A.title}」。主人公は、${S.hero}です。` });
        first = false;
      }
      const lead = s.g === 'STRUCTURE' ? 'まず、登場する構造を確認します。' : s.g === 'RESULT' ? (s.split ? '左右を比べてみましょう。' : 'つまり、ここで起きていることはこうです。') : /^STEP/.test(s.g) ? `${s.g.replace('STEP ', 'ステップ')}。` : '';
      cs.push({ h: talk(lead + `<b>${s.t.replace(/[：｜]/g, '、')}</b>。`) });
      sentences(s.tx).forEach((x) => cs.push({ h: talk(x) }));
      if (s.mk && s.mk.length) cs.push({ h: P.pick('mk', ['番号の付いた印を、順番に目で追ってください。', '画面の番号の場所を確認しておきましょう。']) });
      shot({ kind: 'anim', anim: aid, step: si }, cs, s.d * 0.8);
      if (s.ask) {
        shot({ kind: 'anim', anim: aid, step: si, hold: true }, [
          { h: P.pick('ask', ['ここで一度止めます。何が起こったか、考えてみてください。', '少し止めましょう。今の場面で何が起きたか、説明できますか。']), pause: { tag: 'ここで何が起こった？', q: s.ask[0], a: s.ask[1] }, gap: GAP.question },
          { h: `答えです。${talk(endDot(s.ask[1]))}` },
        ]);
      }
    });
    const xp = S.steps.find((s) => s.g === 'EXAM POINT')?.xp || [];
    if (xp.length) {
      shot({ kind: 'list', title: '講師のまとめ：' + A.title, items: xp }, [
        { h: 'アニメーションで見た流れを、言葉でまとめておきます。', focus: -1 },
        ...xp.map((x, i) => ({ h: talk(endDot(x)), focus: i })),
        { h: 'この流れは、そのまま試験で問われます。', focus: xp.length - 1 },
      ]);
    }
  }
  if (!ch.animations.length) {
    shot({ kind: 'flow', title: '流れで確認', items: flow, move: true }, [
      { h: 'この章には長い機序アニメーションはありません。代わりに、流れを動きで確認しましょう。', focus: -1 },
      ...flow.map((f, i) => ({ h: talk(`${ordinal(i, flow.length)}、${endDot(f)}`), focus: i })),
    ]);
  }

  /* ⑥ 重要事項 */
  section = 5;
  if (tb.summary.length) {
    shot({ kind: 'list', title: '重要事項の整理', items: tb.summary, style: 'sum' }, [
      { h: 'では、ここまでの重要事項を整理します。', focus: -1 },
      ...tb.summary.map((x, i) => ({ h: talk(endDot(x)), focus: i })),
      { h: 'ここは必ず覚えてください。', focus: tb.summary.length - 1, pause: { tag: 'ここを覚える', list: tb.summary } },
    ]);
  }

  /* ⑦ 試験 */
  section = 6;
  const traps = [...new Set(questions.filter((q) => q.chapter === chapterId).map((q) => q.point))].filter((_t, i) => i % 2 === 0).slice(0, 4);
  shot({ kind: 'list', title: '試験で重要なポイント', items: traps, style: 'exam' }, [
    { h: '次に、試験で間違えやすいポイントです。', focus: -1 },
    ...traps.map((x, i) => ({ h: talk(endDot(x)), focus: i })),
    { h: 'ひっかけの選択肢は、まさにここを突いてきます。', focus: traps.length - 1, pause: { tag: '試験ポイント', list: traps } },
  ]);

  /* ⑧ まとめ */
  section = 7;
  shot({ kind: 'list', title: 'まとめ', items: ch.points, style: 'goal' }, [
    { h: '最後に、今日のまとめです。', focus: -1 },
    ...ch.points.map((p, i) => ({ h: talk(endDot(p)), focus: i })),
    { h: `この章の比喩は「${ch.role}」でした。`, focus: ch.points.length - 1 },
  ]);
  if (chapterId === course.chapters.length) {
    shot({ kind: 'list', title: `全${course.chapters.length}講の振り返り`, items: course.chapters.map((x) => `第${x.id}講 ${x.name}：${x.points[0]}`) }, [
      { h: `せっかくなので、全${course.chapters.length}講を振り返っておきましょう。`, focus: -1 },
      ...course.chapters.map((x, i) => ({ h: `第${x.id}講、${x.name}。${endDot(x.points[0])}`, focus: i })),
    ]);
  }
  shot({ kind: 'end', chapter: ch.id, name: ch.name }, ['お疲れさまでした。', '最後に、5択の確認問題で今日の理解を確かめましょう。']);

  return { chapter: chapterId, title: ch.name, sections: SECTIONS.map((name, index) => ({ index, name })), shots, cues, version: LECTURE_VERSION };
}
