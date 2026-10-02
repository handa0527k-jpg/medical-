/** One spoken line of a story anime (narration or a character). */
export interface StoryLine {
  scene: string;
  /** speaker; 'N' is the narrator (no name shown in the subtitle) */
  who: string;
  text: string;
  /** audio length in seconds (measured when the audio was generated) */
  dur: number;
  /** byte range [start, length] of this line in <assetBase>story/story.mp3 */
  bytes: [number, number];
}

export interface StoryScene {
  id: string;
  title: string;
  /** what happens */
  plot: string;
  /** which structure / concept the scene explains */
  struct: string;
  /** corner label shown while the scene opens ("structure ＝ analogy") */
  label?: string;
  /** colour of the corner label dot */
  color?: string;
}

export interface StoryCast {
  name: string;
  color: string;
  /** the structure the character stands for, and its analogy */
  map: string;
  desc: string;
}

export interface StoryDef {
  title: string;
  /** small line above the title */
  kicker: string;
  lead: string;
  cast: StoryCast[];
  scenes: StoryScene[];
  /** 学習ポイントまとめ: header row + rows (cells may contain <b>) */
  points: { head: string[]; rows: string[][] };
  note: string;
  /** speaker → [voice, pitch, rate] used by scripts/generate-story-audio.py */
  voices: Record<string, [string, string, string]>;
  lines: StoryLine[];
  /** version of story.mp3 (changes whenever the voices are re-recorded) */
  audio: string;
  /** scene time (s) of the poster frame shown before playback */
  poster?: [string, number];
}

/** Draws one frame of a scene at scene time t (seconds from the scene start); d = scene length. */
export type SceneDraw = (t: number, d: number) => void;

export interface StoryModule {
  def: StoryDef;
  draw: Record<string, SceneDraw>;
}
