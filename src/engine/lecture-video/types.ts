/**
 * 授業動画（劇画アニメーション）制作システム — data model.
 *
 * MEDSTUDY is the director: it reads the course material, cuts a theme into scenes, writes the
 * lecturer's script (every line traced back to a lecture cue / slide / question), draws the medically
 * exact figures, and writes the instructions for the external tools:
 *   ComfyUI + Wan 2.2  → moving pictures (atmosphere, camera, physical motion; never text or exact structure)
 *   Kokoro             → the lecturer's Japanese voice (one WAV per scene + exact segment timings)
 *   FFmpeg             → composite (Wan clip + MEDSTUDY figure layer + subtitles + voice + SFX [+ BGM])
 */

export type Intensity = 'standard' | 'gekiga' | 'ultra';
export type LessonStyle = 'board' | 'documentary' | 'exam';
/** 30 / 60 s shorts, or 'full' = the whole lecture as one film (完成版) */
export type Duration = 30 | 60 | 'full';

export const INTENSITY_LABEL: Record<Intensity, string> = { standard: '標準', gekiga: '劇画', ultra: '超劇画' };
export const STYLE_LABEL: Record<LessonStyle, string> = { board: '黒板講義型', documentary: '実験ドキュメント型', exam: '試験対策型' };

/** where a line / figure comes from in MEDSTUDY */
export interface SourceRef {
  course: string;
  lecture: number;
  /** lecture section (theme) name */
  section: string;
  /** lecture cue ids (narrations/lecture-NN.json) */
  cues?: string[];
  slide?: number;
  /** blackboard item ids of the lecture's board */
  board?: string[];
  question?: string;
  /**
   * verbatim  = the cue's sentence as is
   * trimmed   = a contiguous part of the cue's sentence
   * condensed = shortened wording; every technical term is the material's own (checked by tests)
   * material  = on-screen text taken from slide key points / self-check / question
   */
  mode: 'verbatim' | 'trimmed' | 'condensed' | 'material';
}

/** one stretch of speech that Kokoro renders as a unit; `cue` fires a visual event when it starts */
export interface Segment {
  /** subtitle text; **x** = key term (highlighted in subtitles) */
  text: string;
  /** what Kokoro reads (kana readings for letters / easily misread terms) */
  say: string;
  /** visual event fired at the start of this segment (or at `at` = fraction of it) */
  cue?: string;
  at?: number;
  /** Kokoro speed for this segment (1 = normal); key terms a little slower */
  speed?: number;
  /** silence before / after (s) — the pause before an important word */
  pre?: number;
  post?: number;
}

export interface Beat { id: string; src: SourceRef; segs: Segment[] }

/** camera directive (scene space is 1280×720; z = zoom factor) */
export interface CamMove {
  at: string; // event id, 'start' or 'start+0.4' / 'eventId+0.2'
  move: 'set' | 'push' | 'crash' | 'pan' | 'pull' | 'whip';
  x: number; y: number; z: number; rot?: number;
  dur?: number;
  /** freeze the picture (not the camera shake / FX) for this long after the move — the anime "hold" */
  hold?: number;
  /** what it does, in words (goes into the camera sheet and the Wan prompt) */
  note: string;
}

export type FxKind = 'focus' | 'speed' | 'impact' | 'flash' | 'invert' | 'shake' | 'onoma' | 'tone';
export interface Fx {
  at: string;
  kind: FxKind;
  dur: number;
  /** onomatopoeia text / impact label */
  text?: string;
  x?: number; y?: number;
  /** lowest intensity that shows this effect */
  min: Intensity;
}

export type SfxKind = 'whoosh' | 'impact' | 'boom' | 'tick' | 'heartbeat' | 'riser' | 'chalk' | 'shimmer';
export interface Sfx { at: string; kind: SfxKind; gain?: number; min?: Intensity }

/** one Wan 2.2 clip; a scene longer than ~5 s is cut into two shots */
export interface WanShot {
  id: string;
  /** shot starts at this event ('start' = scene start) */
  from: string;
  /**
   * background = Wan draws the world behind MEDSTUDY's exact figure (darkened in the composite)
   * feature    = Wan's picture is the subject; MEDSTUDY adds only labels / FX in safe zones
   */
  mode: 'background' | 'feature';
  /** what Wan should show (Japanese, for the director's sheet) */
  desc: string;
  /** subject + motion part of the prompt (English) — style / camera / intensity parts are added */
  subject: string;
  /** structural constraints that keep biology right */
  accuracy: string;
  /** extra negative terms for this shot */
  avoid?: string;
}

export type Visual =
  | 'board-question' | 'title-question'
  | 'strains' | 'tubes' | 'plates'
  | 'board-summary' | 'result-card' | 'exam-point' | 'quiz'
  | 'board-generic'
  /* 完成版（第1講まるごと） */
  | 'title-open' | 'zygote' | 'board' | 'transcription' | 'translation' | 'contrast' | 'universal'
  | 'hierarchy' | 'hier-line' | 'disease' | 'end-card';

export interface SceneDef {
  id: string;
  title: string;
  visual: Visual;
  /** 映像内容（日本語） */
  picture: string;
  /** the exact figure MEDSTUDY draws (SVG export id) */
  diagram: { id: string; title: string; note: string };
  beats: Beat[];
  cams: CamMove[];
  fx: Fx[];
  sfx: Sfx[];
  shots: WanShot[];
  /** show the lecturer (motion-captured silhouette) */
  lecturer?: boolean;
  /** data for generic / quiz / board visuals */
  data?: Record<string, unknown>;
  /** first scene of a chapter: a title card flashes in (e.g. 「テーマ2　セントラルドグマ」) */
  chapter?: string;
}

export interface Plan {
  key: string;
  course: string;
  lecture: number;
  section: string;
  theme: string;
  duration: Duration;
  style: LessonStyle;
  intensity: Intensity;
  /** true = hand-directed and checked against the material; false = automatic draft */
  curated: boolean;
  /** why this theme / what was taken from where */
  rationale: string[];
  scenes: SceneDef[];
  voice: { kokoro: string; speed: number };
}

/* ---------- timing ---------- */
export interface TimedSeg { scene: string; beat: string; i: number; seg: Segment; t0: number; t1: number; speech0: number; speech1: number }
export interface TimedScene { id: string; t0: number; t1: number; events: Record<string, number> }
export interface Timing {
  /** 'estimate' = from text length; 'kokoro' = measured from the rendered WAVs */
  source: 'estimate' | 'kokoro';
  total: number;
  scenes: TimedScene[];
  segs: TimedSeg[];
}
