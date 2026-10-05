/**
 * Shared building blocks for the whole-lecture films (完成版): line helpers, Wan backgrounds, and the
 * scene shapes every lecture has — title, the lecture's own blackboard, the 4-point summary, the next-lecture card.
 * The figure scenes stay hand-directed in each lecture's file.
 */
import type { Beat, CamMove, Fx, SceneDef, Segment, Sfx, SourceRef, WanShot } from '../types';

export const TONE: Fx = { at: 'start', kind: 'tone', dur: 999, min: 'gekiga' };
export const HALL = 'a dark empty lecture hall at night, a huge slate blackboard, a single hard shaft of light cutting through floating chalk dust, dust motes drifting slowly';
export const MOLECULAR = 'a dark watery molecular world inside a cell nucleus, soft out-of-focus particles drifting, cold rim light, slow push-in';
export const NO_TEXT = 'no text, no letters, no labels';
export const BOARD_BG: WanShot = { id: 'a', from: 'start', mode: 'background', desc: '夜の講義室。', subject: HALL, accuracy: 'no people, no writing on the board' };
export const MOL_BG = (desc = '細胞核の中の暗い水の世界。', extra = ''): WanShot => ({ id: 'a', from: 'start', mode: 'background', desc, subject: MOLECULAR + extra, accuracy: 'background only, no molecules in focus, ' + NO_TEXT });
export const DARK_BG = (desc = '暗い背景に光の筋。'): WanShot => ({ id: 'a', from: 'start', mode: 'background', desc, subject: 'abstract dark background, slow streaks of warm light drifting, subtle film grain', accuracy: NO_TEXT });
export const WARM_BG = (desc = '体の中の暖かく暗い世界。'): WanShot => ({ id: 'a', from: 'start', mode: 'background', desc, subject: 'a dark warm organic interior, soft glowing particles flowing slowly, warm rim light', accuracy: 'background only, no organs in focus, no faces, ' + NO_TEXT });

export const seg = (text: string, say: string, cue?: string, o: Partial<Segment> = {}): Segment => ({ text, say, cue, ...o });
/** a line whose reading is its own text (no latin letters / tricky numbers) */
export const same = (text: string, cue?: string, o: Partial<Segment> = {}): Segment => seg(text, text.replace(/\*\*/g, '').replace(/[「」]/g, ''), cue, o);
export const beat = (id: string, src: SourceRef, segs: Segment[]): Beat => ({ id, src, segs });
export function lecture(course: string, lec: number) {
  return (section: string, mode: SourceRef['mode'], cues: string[], extra: Partial<SourceRef> = {}): SourceRef => ({ course, lecture: lec, section, cues: cues.map((c) => (c.includes('-') ? c : `c${String(lec).padStart(2, '0')}-${c}`)), mode, ...extra });
}

export interface Item { id: string; at: string; until?: string; x?: number; y?: number; k?: number; dur?: number }
export interface BoardOpts {
  title: string; picture: string; note: string; beats: Beat[]; items: Item[];
  map?: { bx: number; by: number; sx: number; sy: number; k: number };
  marks?: { id: string; at: string; color: 'y' | 'r' | 'w'; kind?: 'box' | 'under' }[];
  slams?: { text: string; at: string; x: number; y: number; size: number; color?: string; band?: boolean }[];
  arrows?: { at: string; from: [number, number]; to: [number, number]; color: 'y' | 'r' | 'w' }[];
  cams: CamMove[]; fx?: Fx[]; sfx?: Sfx[]; chapter?: string; lecturerX?: number; lecturerFace?: number;
}
/** a scene on the lecture's own blackboard (ops taken by id from the lecture's board) */
export function board(o: BoardOpts): SceneDef {
  return {
    id: 'X', title: o.title, visual: 'board', lecturer: true, chapter: o.chapter, picture: o.picture,
    diagram: { id: `board-${o.items[o.items.length - 1].id}`, title: `板書：${o.title}`, note: o.note },
    beats: o.beats, cams: o.cams,
    fx: [...(o.fx ?? []), TONE],
    sfx: o.sfx ?? [{ at: 'start', kind: 'chalk', gain: 0.5 }],
    shots: [BOARD_BG],
    data: { items: o.items, map: o.map, marks: o.marks, slams: o.slams, arrows: o.arrows, lecturerX: o.lecturerX ?? 1100, lecturerFace: o.lecturerFace },
  };
}

export function titleScene(o: { no: string; title: string[]; picture: string; beats: Beat[]; subs: { text: string; at: string; y: number; color?: 'y' | 'w' }[]; cams?: CamMove[] }): SceneDef {
  return {
    id: 'X', title: `タイトル：${o.no} ${o.title.join('')}`, visual: 'title-open', chapter: o.no, picture: o.picture,
    diagram: { id: 'helix', title: 'DNA二重らせん（影）', note: '右巻き・主溝/副溝の非対称を保った背景図。文字は MEDSTUDY が描く' },
    beats: o.beats,
    cams: o.cams ?? [
      { at: 'start', move: 'set', x: 640, y: 360, z: 1.3, note: '墨の中から' },
      { at: 'title', move: 'crash', x: 640, y: 330, z: 1.12, dur: 0.22, hold: 0.3, note: '題名で急接近 → 静止' },
      { at: 'title+1.5', move: 'pull', x: 640, y: 360, z: 1.0, dur: 3.0, note: 'ゆっくり引く' },
    ],
    fx: [{ at: 'title', kind: 'impact', dur: 0.5, min: 'gekiga' }, { at: 'title', kind: 'focus', dur: 1.4, min: 'gekiga' }, { at: 'title', kind: 'shake', dur: 0.3, min: 'gekiga' }, TONE],
    sfx: [{ at: 'start', kind: 'riser', gain: 0.5 }, { at: 'title', kind: 'boom' }],
    shots: [{ id: 'a', from: 'start', mode: 'feature', desc: '漆黒の空間で墨が爆ぜ、二重らせんの影がゆっくり回る。',
      subject: 'pitch black void, sumi ink exploding and swirling like smoke in water, the dark silhouette of a right-handed DNA double helix slowly rotating in the ink',
      accuracy: 'the helix is right-handed with a wide major groove and a narrow minor groove; ' + NO_TEXT }],
    data: { dy: -60, unit: '遺伝医学｜遺伝子の基礎', unitAt: 'start+0.2', title: o.title, no: o.no, subs: o.subs },
  };
}

/** 今日のまとめ: the board's sum-h and s1..s4, one line per point, underlined when said */
export function summaryScene(o: { note: string; beats: Beat[]; marks: { id: string; at: string; color: 'y' | 'r' }[]; endAt: string }): SceneDef {
  return board({
    title: '今日のまとめ：4つ', chapter: 'まとめ', note: o.note,
    picture: '黒板の下段に「今日のまとめ」①〜④（板書 sum-h・s1〜s4）。読み上げに合わせて1行ずつ書かれ、言い終わるごとに下線。',
    beats: o.beats,
    items: [
      { id: 'sum-h', at: 'four', x: 130, y: 70, k: 0.85 },
      { id: 's1', at: 'p1', x: 130, y: 165, k: 0.58 }, { id: 's2', at: 'p2', x: 130, y: 260, k: 0.58 },
      { id: 's3', at: 'p3', x: 130, y: 355, k: 0.58 }, { id: 's4', at: 'p4', x: 130, y: 450, k: 0.58 },
    ],
    marks: o.marks.map((m) => ({ ...m, kind: 'under' as const })),
    cams: [
      { at: 'start', move: 'set', x: 640, y: 330, z: 1.0, note: 'まとめの板書' },
      { at: 'p1', move: 'push', x: 560, y: 190, z: 1.25, dur: 0.6, note: '①へ' },
      { at: 'p2', move: 'pan', x: 560, y: 285, z: 1.25, dur: 0.5, note: '②へ' },
      { at: 'p3', move: 'pan', x: 560, y: 380, z: 1.25, dur: 0.5, note: '③へ' },
      { at: 'p4', move: 'pan', x: 560, y: 475, z: 1.25, dur: 0.5, note: '④へ' },
      { at: o.endAt, move: 'pull', x: 640, y: 330, z: 1.0, dur: 0.5, note: '4つを並べて引く' },
    ],
    fx: [{ at: o.endAt, kind: 'focus', dur: 0.9, min: 'gekiga' }],
    sfx: [{ at: 'four', kind: 'chalk', gain: 0.5 }, { at: 'p1', kind: 'chalk', gain: 0.5 }, { at: 'p2', kind: 'chalk', gain: 0.5 }, { at: 'p3', kind: 'chalk', gain: 0.5 }, { at: 'p4', kind: 'chalk', gain: 0.5 }, { at: o.endAt, kind: 'impact', gain: 0.6 }],
    lecturerX: 1150, lecturerFace: -1,
  });
}

export function endScene(o: { no: string; picture: string; note: string; beats: Beat[]; l1: string; l1At: string; l2: string; l2At: string; pic: 'nucleotide' | 'chromosome' | 'gene' | 'helix' | 'mito' }): SceneDef {
  return {
    id: 'X', title: `次回：${o.no.replace('次回 ', '')}`, visual: 'end-card', picture: o.picture,
    diagram: { id: 'end', title: '次回予告', note: o.note },
    beats: o.beats,
    cams: [{ at: 'start', move: 'set', x: 640, y: 360, z: 1.15, note: '予告' }, { at: 'start', move: 'pull', x: 640, y: 360, z: 1.0, dur: 6, note: 'ゆっくり引いて終わる' }],
    fx: [{ at: 'next', kind: 'impact', dur: 0.4, min: 'gekiga' }, TONE],
    sfx: [{ at: 'next', kind: 'impact', gain: 0.6 }, { at: o.l2At, kind: 'shimmer', gain: 0.5 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: '漆黒に墨がゆっくり広がる。', subject: 'pitch black void, sumi ink spreading slowly, gentle', accuracy: NO_TEXT }],
    data: { no: o.no, l1: o.l1, l1At: o.l1At, l2: o.l2, l2At: o.l2At, pic: o.pic },
  };
}

/** number the scenes S01.. in order */
export const numbered = (scenes: SceneDef[]) => { scenes.forEach((s, i) => { s.id = `S${String(i + 1).padStart(2, '0')}`; }); return scenes; };

/** a figure scene drawn by MEDSTUDY (render-film*.ts) over a Wan background */
export function fig(visual: SceneDef['visual'], o: { title: string; picture: string; note: string; beats: Beat[]; cams: CamMove[]; fx?: Fx[]; sfx?: Sfx[]; shots?: WanShot[]; chapter?: string; data?: Record<string, unknown> }): SceneDef {
  return {
    id: 'X', title: o.title, visual, chapter: o.chapter, picture: o.picture,
    diagram: { id: visual, title: o.title, note: o.note },
    beats: o.beats, cams: o.cams, fx: [...(o.fx ?? []), TONE], sfx: o.sfx ?? [], shots: o.shots ?? [MOL_BG()], data: o.data,
  };
}
