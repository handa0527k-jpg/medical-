import type { Cam } from '../svg';

/** Opaque per-animation scene state returned by build(). */
export type AnimState = unknown;

/** Drawing code for one mechanism animation. */
export interface AnimDef {
  build(svg: SVGGElement, mode?: string | null): AnimState;
  frame(state: AnimState, t: number, mode?: string | null): void;
  /** default camera for normalised time t */
  cam(t: number): Cam;
  /** heads-up display value for time t: [value, label] */
  hud(t: number, mode?: string | null): [string, string];
}

/** [x, y, label, color?, side?('l'|'r')] — numbered marker pinned to the scene */
export type Marker = [number, number, string, string?, string?];

/** Split-screen panel: [mode, t0, t1, kicker, label, camera?] */
export type SplitPanel = [string | null, number, number, string, string, Cam?];

/** One scripted step (camera move / highlight / explanation) of an animation. */
export interface AnimStep {
  /** group (chapter) name: INTRO, OVERVIEW, STRUCTURE, STEP 1…, RESULT, EXAM POINT, REPLAY */
  g: string;
  /** title / caption */
  t: string;
  /** medical explanation */
  tx: string;
  /** factory-metaphor explanation */
  fac?: string;
  /** duration (s) at 1× */
  d: number;
  /** scene time range [from, to] mapped over the step */
  r?: [number, number];
  /** camera [from, to?] */
  cam?: [Cam, Cam?];
  /** macro (tissue) overlay opacity [from, to, segStart?, segEnd?] and its camera */
  mo?: number[];
  mc?: [Cam, Cam?];
  /** effects fired on entering the step */
  fx?: ('flash' | 'shake' | 'zoom' | 'ttl')[];
  mk?: Marker[];
  /** check question [question, answer] — pauses playback */
  ask?: [string, string];
  split?: { L: SplitPanel; R: SplitPanel };
  dim?: number;
  /** bullet points (EXAM POINT) */
  xp?: string[];
  badge?: string;
  slow?: number;
  /** particle burst [x, y, color] */
  burst?: [number, number, string];
  /** scene mode (e.g. reg/con) */
  m?: string;
}

export interface AnimScript {
  hero: string;
  steps: AnimStep[];
  quiz: { q: string; o: string[]; a: number; x: string }[];
  cam?: Cam;
  /** extra SVG for the macro overlay */
  mx?: string;
}
