import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Lecture } from '../src/engine/lecture/types';
import type { SingleQuestion, Slide } from '../src/content/types';
import { filmTheme, recommendTheme, themesOf } from '../src/engine/lecture-video/analyze';
import { FILMS } from '../src/engine/lecture-video/directions/films';
import { buildPlan, voiceKey, type Material } from '../src/engine/lecture-video/plan';
import { buildTiming, at, moraOf, lengthsFromKokoro } from '../src/engine/lecture-video/timing';
import { existsSync } from 'node:fs';
import { assFile, editList, srtFile, breakLines } from '../src/engine/lecture-video/edit';
import { comfyWorkflow, shotTimes, WAN_PROFILES } from '../src/engine/lecture-video/wan';
import { packageFiles, diagramSvg } from '../src/engine/lecture-video/package';
import { zip, crc32 } from '../src/engine/lecture-video/zip';
import type { Duration, Intensity, LessonStyle } from '../src/engine/lecture-video/types';
import single from '../src/content/courses/genetics-basics/questions/single.json';
import slides from '../src/content/courses/genetics-basics/slides.json';

const dir = resolve(__dirname, '../src/content/courses/genetics-basics/narrations');
const lectures: Lecture[] = readdirSync(dir).sort().map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
const L1 = lectures[0];
const questions = single as unknown as SingleQuestion[];
const material = (lec: Lecture, section: number): Material => {
  const theme = themesOf('genetics-basics', lec).find((t) => t.section === section)!;
  return { course: 'genetics-basics', courseTitle: '遺伝医学｜遺伝子の基礎（構造と機能）', lecture: lec, theme, slides: slides as unknown as Record<number, Slide>, questions };
};
const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\*\*/g, '');
const VARIANTS: [Duration, LessonStyle][] = [[30, 'board'], [30, 'documentary'], [30, 'exam'], [60, 'board'], [60, 'documentary'], [60, 'exam']];
const INT: Intensity[] = ['standard', 'gekiga', 'ultra'];

describe('教材解析', () => {
  it('reads every section of lecture 1 and recommends テーマ1 (Avery) as the first film', () => {
    const themes = lectures.flatMap((l) => themesOf('genetics-basics', l));
    expect(themes.length).toBeGreaterThan(20);
    const r = recommendTheme(themes)!;
    expect(r.theme.key).toBe('genetics-basics:1:2');
    expect(r.theme.name).toContain('設計図の正体はDNA');
    expect(r.theme.slides).toContain(14);
    expect(r.theme.quizzes).toContain('g14b');
    expect(r.why).toContain('導入');
  });
});

describe('授業動画 plan (Avery, hand-directed)', () => {
  for (const [d, style] of VARIANTS) {
    it(`${d}s ${style}: every line is the material's own; every event exists`, () => {
      const plan = buildPlan(material(L1, 2), { duration: d, style, intensity: 'gekiga' });
      expect(plan.curated).toBe(true);
      const timing = buildTiming(plan);
      for (const sc of plan.scenes) {
        for (const b of sc.beats) {
          const src = (b.src.cues ?? []).map((id) => L1.cues.find((c) => c.id === id)!);
          expect(src.every(Boolean), `${b.id} cues exist`).toBe(true);
          const srcText = src.map((c) => strip(c.text)).join('');
          for (const s of b.segs) {
            expect(s.say, `${b.id} reading has no latin letters`).not.toMatch(/[A-Za-z]/);
            if (b.src.mode === 'verbatim' || b.src.mode === 'trimmed') expect(srcText, `${b.id}: ${s.text}`).toContain(strip(s.text));
            if (b.src.mode === 'condensed') {
              const q = b.src.question ? questions.find((x) => x.id === b.src.question) : undefined;
              const pool = srcText + (q ? strip(q.point + q.explanation) : '') + (b.src.slide ? strip((slides as unknown as Record<string, Slide>)[String(b.src.slide)].keyPoint) : '');
              for (const term of [...s.text.matchAll(/\*\*(.+?)\*\*/g)].map((x) => x[1])) expect(pool, `${b.id}: key term ${term}`).toContain(term);
            }
          }
        }
        const ts = timing.scenes.find((x) => x.id === sc.id)!;
        for (const r of [...sc.cams.map((c) => c.at), ...sc.fx.map((f) => f.at), ...sc.sfx.map((s) => s.at), ...sc.shots.map((s) => s.from)])
          expect(Number.isFinite(at(ts, r)), `${sc.id} event ${r}`).toBe(true);
      }
      expect(plan.scenes.map((s) => s.id)).toEqual(d === 60 ? ['S01', 'S02', 'S03', 'S04', 'S05', 'S06'] : ['S01', 'S02', 'S03', 'S04', 'S05']);
      if (d === 30) expect(timing.total).toBeGreaterThan(26), expect(timing.total).toBeLessThan(35);
    });
  }

  it('every shipped Kokoro voice matches its current script (measured timing covers every segment)', () => {
    for (const [d, style] of VARIANTS) {
      const plan = buildPlan(material(L1, 2), { duration: d, style, intensity: 'gekiga' });
      const f = resolve(__dirname, `../public/lecture-video/${voiceKey('genetics-basics:1:2', { duration: d, style })}/kokoro_timing.json`);
      expect(existsSync(f), f).toBe(true);
      const t = buildTiming(plan, lengthsFromKokoro(JSON.parse(readFileSync(f, 'utf8'))));
      expect(t.source, `${d} ${style}`).toBe('kokoro');
      if (d === 30) expect(t.total).toBeLessThanOrEqual(34);
    }
  });

  it('uses the lecture\'s own blackboard and question', () => {
    const plan = buildPlan(material(L1, 2), { duration: 60, style: 'board', intensity: 'gekiga' });
    const ids = (plan.scenes[0].data!.board as { id: string }[]).map((o) => o.id);
    expect(ids).toEqual(['c-dna', 'a1', 'c-q']);
    expect((plan.scenes[4].data!.board as { id: string }[]).map((o) => o.id)).toContain('av-c');
    expect((plan.scenes[5].data!.question as SingleQuestion).id).toBe('g14b');
  });

  it('intensity changes the effects, never the figures or the words', () => {
    const plans = INT.map((k) => buildPlan(material(L1, 2), { duration: 30, style: 'board', intensity: k }));
    const words = plans.map((p) => p.scenes.flatMap((s) => s.beats.flatMap((b) => b.segs.map((x) => x.text))).join('|'));
    expect(new Set(words).size).toBe(1);
    expect(new Set(plans.map((p) => p.scenes.map((s) => s.diagram.id).join())).size).toBe(1);
  });
});

describe('external tools', () => {
  const plan = buildPlan(material(L1, 2), { duration: 30, style: 'board', intensity: 'gekiga' });
  const timing = buildTiming(plan);
  it('Wan shots fit the model (4n+1 frames, ≤ 5 s) and cover the film', () => {
    for (const prof of ['ti2v-5b', 'i2v-14b'] as const) {
      const st = shotTimes(plan, timing, prof);
      for (const s of st) { expect((s.frames - 1) % 4).toBe(0); expect(s.frames).toBeLessThanOrEqual(WAN_PROFILES[prof].maxFrames); }
      expect(st.reduce((a, s) => a + s.dur, 0)).toBeCloseTo(timing.total, 1);
    }
  });
  it('ComfyUI workflows are closed graphs in API format', () => {
    for (const [profile, fast] of [['ti2v-5b', false], ['i2v-14b', false], ['i2v-14b', true]] as const) {
      const wf = comfyWorkflow({ profile, positive: 'p', negative: 'n', image: 'x.png', frames: 81, prefix: 'a/b', seed: 1, fast }) as Record<string, { class_type: string; inputs: Record<string, unknown> }>;
      for (const [id, n] of Object.entries(wf)) {
        expect(typeof n.class_type).toBe('string');
        for (const v of Object.values(n.inputs)) if (Array.isArray(v)) expect(wf[v[0] as string], `${id} → ${v[0]}`).toBeTruthy();
      }
      expect(Object.values(wf).some((n) => n.class_type === 'SaveWEBM')).toBe(true);
    }
  });
  it('subtitles and the edit list follow the timing', () => {
    const ass = assFile(timing), srt = srtFile(timing);
    expect(ass.match(/^Dialogue:/gm)!.length).toBe(timing.segs.length);
    expect(ass).toContain('{\\c&H4AD8FF&\\fs44}DNA{\\r}');
    expect(srt.split('-->').length - 1).toBe(timing.segs.length);
    expect(breakLines('すると、R株がS株に変わったのは、DNAを加えたときだけでした。', 20).length).toBeGreaterThan(1);
    const e = editList(plan, timing, 'ti2v-5b', voiceKey('genetics-basics:1:2', plan));
    expect(e.scenes.length).toBe(5);
    expect(e.scenes[3].sfx.some((s) => s.kind === 'heartbeat')).toBe(true);
  });
  it('the package has every file the Windows side needs', () => {
    const files = packageFiles(plan, timing, 'ti2v-5b', 'k');
    for (const f of ['medstudy_video.json', 'script.md', 'kokoro/script.json', 'edit.json', 'subtitles.ass', 'subtitles.srt', 'timing.json', 'comfy/ti2v-5b/S01_a.api.json']) expect(files[f], f).toBeTruthy();
    expect(Object.keys(files).filter((f) => f.endsWith('.svg')).length).toBeGreaterThanOrEqual(4);
    const md = files['script.md'] as string;
    expect(md).toMatch(/00:0\d\.\d–00:0\d\.\d　「そもそも、遺伝を担っている物質は、」/);
    expect(md).toContain('▶ カメラ急接近');
    const svg = diagramSvg(plan.scenes[1])!;
    expect(svg.startsWith('<svg')).toBe(true);
    expect((svg.match(/<g/g) ?? []).length).toBe((svg.match(/<\/g>/g) ?? []).length);
  });
  it('zip writer', async () => {
    const z = zip({ 'a.txt': 'hello', 'b/c.json': '{}' });
    const b = new Uint8Array(await z.arrayBuffer());
    expect(b[0]).toBe(0x50); expect(b[1]).toBe(0x4b);
    expect(crc32(new TextEncoder().encode('hello'))).toBe(0x3610a686);
  });
});

describe('automatic draft (any theme)', () => {
  it('cuts another theme from its own cues within the time', () => {
    const lec = lectures[1];
    const t = themesOf('genetics-basics', lec).find((x) => x.substantive)!;
    const plan = buildPlan(material(lec, t.section), { duration: 30, style: 'board', intensity: 'gekiga' });
    expect(plan.curated).toBe(false);
    expect(plan.scenes.length).toBeGreaterThan(0);
    const timing = buildTiming(plan);
    expect(timing.total).toBeLessThan(32);
    for (const s of plan.scenes) for (const b of s.beats) { const c = lec.cues.find((x) => x.id === b.id)!; for (const x of b.segs) expect(strip(c.text)).toContain(strip(x.text)); }
  });
  it('mora counter', () => { expect(moraOf('ディーエヌエー')).toBe(6); });
});

const FILM_SPEC: Record<number, { chapters: string[]; visuals: string[]; seconds: [number, number] }> = {
  1: { chapters: ['第1講', 'テーマ1　設計図の正体はDNA', 'テーマ2　セントラルドグマ', 'テーマ3　遺伝子の変化と疾患', 'まとめ'], visuals: ['title-open', 'zygote', 'strains', 'tubes', 'plates', 'transcription', 'translation', 'universal', 'hierarchy', 'disease', 'end-card'], seconds: [200, 300] },
  3: { chapters: ['第3講', 'テーマ1　収納の階層', 'テーマ2　染色体の数と形', 'テーマ3　減数分裂と不分離', 'テーマ4　数的異常と遺伝子数', 'まとめ'], visuals: ['title-open', 'pack-strip', 'packing', 'octamer', 'histmod', 'karyotype', 'centromere', 'ploidy', 'meiosis', 'nondisjunction', 'maternal-age', 'aneuploid', 'genecount', 'end-card'], seconds: [300, 480] },
  4: { chapters: ['第4講', 'テーマ1　遺伝子とは何か', 'テーマ2　遺伝子の構造', 'テーマ3　転写・スプライシング・翻訳', 'テーマ4　ゲノムの構成とncRNA', 'まとめ'], visuals: ['title-open', 'gene-flow', 'gene-def', 'genome-dir', 'gene-blank', 'tx-splice', 'translate4', 'regulation', 'genome-pie', 'ncrna', 'genome-history', 'end-card'], seconds: [300, 480] },
  6: { chapters: ['第6講', 'テーマ1　遺伝型から表現型へ', 'テーマ2　スイッチのしくみ', 'テーマ3　ミトコンドリアゲノム', 'まとめ'], visuals: ['title-open', 'twins', 'twin-study', 'omics', 'chromatin', 'methylation', 'cpg', 'epi-switch', 'charge', 'exercise', 'mtdna', 'end-card'], seconds: [300, 520] },
  5: { chapters: ['第5講', 'テーマ1　置換で何が起こるか', 'テーマ2　飲酒と遺伝子多型', 'テーマ3　動く遺伝子', 'まとめ'], visuals: ['title-open', 'mut-types', 'sub-outcomes', 'codon-change', 'frameshift', 'snp-count', 'alcohol', 'aldh2', 'transposon', 'cut-copy', 'pseudogene', 'retro', 'insertion', 'end-card'], seconds: [300, 480] },
  2: { chapters: ['第2講', 'テーマ1　ヌクレオチドの成り立ち', 'テーマ2　糖と塩基', 'テーマ3　二重らせん', 'テーマ4　核酸の代謝と臨床', 'まとめ'], visuals: ['title-open', 'monomers', 'nucleotide', 'sugar', 'bases', 'ntp', 'dna-helix', 'ladder', 'basepair', 'backbone', 'tug', 'digest', 'gout', 'end-card'], seconds: [260, 400] },
};
for (const F of FILMS) describe(`完成版：第${F.lecture}講まるごと`, () => {
  const LEC = lectures[F.lecture - 1], spec = FILM_SPEC[F.lecture];
  const m: Material = { course: 'genetics-basics', courseTitle: '遺伝医学｜遺伝子の基礎（構造と機能）', lecture: LEC, theme: filmTheme('genetics-basics', LEC, F.key), slides: slides as unknown as Record<number, Slide>, questions };
  const plan = buildPlan(m, { duration: 30, style: 'exam', intensity: 'gekiga' });
  it('is the whole lecture in order, hand-directed, read in the board style at natural pace', () => {
    expect(plan.curated).toBe(true);
    expect(plan.duration).toBe('full');
    expect(plan.style).toBe('board');
    expect(plan.voice.speed).toBe(1);
    expect(plan.scenes.length).toBeGreaterThanOrEqual(16);
    expect(plan.scenes.filter((s) => s.chapter).map((s) => s.chapter)).toEqual(spec.chapters);
    // the chapters follow the lecture's own sections
    for (const c of spec.chapters.slice(1, -1)) expect(LEC.sections.map((x) => x.name)).toContain(c);
    const visuals = plan.scenes.map((s) => s.visual);
    for (const v of spec.visuals) expect(visuals).toContain(v);
    // every cue cited exists in the lecture
    const idx = plan.scenes.flatMap((s) => s.beats.flatMap((b) => b.src.cues ?? [])).filter((id) => id.startsWith(`c0${F.lecture}-`)).map((id) => LEC.cues.findIndex((c) => c.id === id));
    expect(idx.every((x) => x >= 0)).toBe(true);
  });
  it('every line is the lecture\'s own (verbatim or a contiguous part), readings without latin letters', () => {
    for (const sc of plan.scenes) for (const b of sc.beats) {
      expect(['verbatim', 'trimmed', 'condensed']).toContain(b.src.mode);
      const cues = (b.src.cues ?? []).map((id) => lectures.flatMap((l) => l.cues).find((c) => c.id === id)!);
      const src = cues.map((c) => strip(c.text)).join('');
      for (const x of b.segs) {
        expect(x.say, x.text).not.toMatch(/[A-Za-z]/);
        expect(x.cue, `${sc.id}: a line may not be named after the scene's own start event`).not.toBe('start');
        if (b.src.mode !== 'condensed') expect(src, `${sc.id} ${b.id}`).toContain(strip(x.text));
      }
    }
  });
  it('the board text is the lecture\'s own blackboard, and every event exists', () => {
    const timing = buildTiming(plan);
    for (const sc of plan.scenes) {
      const want = ((sc.data?.items as { id: string }[] | undefined)?.map((i) => i.id)) ?? (sc.data?.boardIds as string[] | undefined) ?? [];
      const ops = (sc.data?.board as { id: string }[] | undefined) ?? [];
      if (want.length) expect(ops.map((o) => o.id), sc.id).toEqual(want); // every requested op exists on the lecture's board
      const ts = timing.scenes.find((x) => x.id === sc.id)!;
      const refs = [...sc.cams.map((c) => c.at), ...sc.fx.map((f) => f.at), ...sc.sfx.map((s) => s.at), ...sc.shots.map((s) => s.from)];
      const d = sc.data as { marks?: { at: string }[]; arrows?: { at: string }[]; slams?: { at: string }[]; items?: { at: string }[] } | undefined;
      refs.push(...(d?.marks ?? []).map((x) => x.at), ...(d?.arrows ?? []).map((x) => x.at), ...(d?.slams ?? []).map((x) => x.at), ...(d?.items ?? []).map((x) => x.at));
      for (const r of refs) expect(Number.isFinite(at(ts, r)), `${sc.id} ${r}`).toBe(true);
    }
  });
  it(`the Kokoro voice of the film matches its script`, () => {
    const f = resolve(__dirname, `../production/lecture-video/genetics-basics-${F.lecture}-film/audio/kokoro_timing.json`);
    const t = buildTiming(plan, lengthsFromKokoro(JSON.parse(readFileSync(f, 'utf8'))));
    expect(t.source).toBe('kokoro');
    expect(t.total).toBeGreaterThan(spec.seconds[0]);
    expect(t.total).toBeLessThan(spec.seconds[1]);
  });
});

describe('完成版：医学図の正しさ', () => {
  it('the genetic code shown is the standard one', () => {
    const src = readFileSync(resolve(__dirname, '../src/engine/lecture-video/render-film.ts'), 'utf8');
    const code: Record<string, string> = { AUG: 'Met', GCU: 'Ala', UUC: 'Phe', GGA: 'Gly', AAA: 'Lys', UGG: 'Trp' };
    const m2 = /CODONS: \[string, string\]\[\] = (\[.*?\]);/.exec(src)!;
    for (const [c, aa] of JSON.parse(m2[1].replace(/'/g, '"'))) expect(code[c], c).toBe(aa);
  });
});
