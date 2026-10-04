/** One spoken line of a story anime (narration or a character). */
export interface StoryLine {
  scene: string;
  /** speaker; 'N' is the narrator (no name shown in the subtitle) */
  who: string;
  text: string;
  /** how the voice should read the line, when the text alone is read wrongly (e.g. 十八番 as おはこ) */
  say?: string;
  /** voice tone for this line only: [pitch, rate] (overrides the speaker's) */
  tone?: [string, string];
  /** extra silence (s) before the line — a held beat in the picture */
  wait?: number;
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
  /** show long lines as short pieces (one sentence at a time) instead of the whole line */
  subChunks?: boolean;
  /** music, effects and ambience under the voices: one file in <assetBase>story/, played on the film clock */
  bed?: string;
  /** playback volume of the bed (0..1) relative to the voices */
  bedVolume?: number;
  /** background music as its own track (already ducked under the dialogue), so the learner can turn it off or change its volume */
  music?: string;
  /** default playback volume of the music track (0..1) */
  musicVolume?: number;
}

/** Draws one frame of a scene at scene time t (seconds from the scene start); d = scene length. */
export type SceneDraw = (t: number, d: number) => void;

export interface StoryModule {
  def: StoryDef;
  draw: Record<string, SceneDraw>;
}
