/**
 * Instructions for the Windows side: Kokoro script, subtitles, FFmpeg edit list, and the
 * human-readable timecoded script (台本) / camera sheet.
 */
import type { Intensity, Plan, SceneDef, Timing } from './types';
import { INTENSITY_LABEL, STYLE_LABEL } from './types';
import { at, tc } from './timing';
import { shotTimes, wanPrompt, WAN_PROFILES, type WanProfile } from './wan';

export const RANK: Record<Intensity, number> = { standard: 0, gekiga: 1, ultra: 2 };
export const shows = (min: Intensity, cur: Intensity) => RANK[cur] >= RANK[min];
export const plainText = (s: string) => s.replace(/\*\*/g, '');

/* ---------- Kokoro ---------- */
export function kokoroScript(plan: Plan, voiceKey: string) {
  return {
    plan: voiceKey,
    engine: 'kokoro (Kokoro-82M v1.0, ONNX) + misaki ja G2P (pyopenjtalk)',
    voice: plan.voice.kokoro,
    speed: plan.voice.speed,
    sampleRate: 24000,
    note: 'say = 読み（英字・誤読しやすい語はかな）。pre/post = 前後の間（秒）。speed = 区間ごとの話速（重要語はやや遅く）。',
    scenes: plan.scenes.map((sc) => ({
      id: sc.id,
      file: `audio/${sc.id}.wav`,
      segs: sc.beats.flatMap((b) => b.segs.map((s, i) => ({ beat: b.id, i, text: plainText(s.text), say: s.say, speed: s.speed ?? 1, pre: s.pre ?? 0, post: s.post ?? 0, cue: s.cue ?? null }))),
    })),
  };
}

/* ---------- subtitles ---------- */
const ass2 = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h}:${String(m).padStart(2, '0')}:${x.toFixed(2).padStart(5, '0')}`; };
const srt2 = (s: number) => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), x = Math.floor((ms % 60000) / 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
/** break long Japanese lines after punctuation, at most `n` characters per line */
export function breakLines(s: string, n = 26): string[] {
  const out: string[] = []; let cur = '';
  for (const part of s.split(/(?<=[、。，！？])/)) {
    if (plainText(cur + part).length > n && cur) { out.push(cur); cur = part; } else cur += part;
  }
  if (cur) out.push(cur);
  return out;
}
export interface SubLine { t0: number; t1: number; text: string }
export function subtitleLines(timing: Timing): SubLine[] {
  return timing.segs.map((x, k) => {
    const next = timing.segs[k + 1];
    const t1 = Math.min(x.speech1 + Math.min(0.45, x.seg.post ?? 0) + 0.15, next ? next.speech0 - 0.02 : x.t1 + 0.3);
    return { t0: Math.max(0, x.speech0 - 0.05), t1, text: x.seg.text };
  });
}
/** ASS: bottom-centre, white on a semi-transparent dark band (readable over boards and figures); key terms (**…**) in chalk yellow, slightly larger */
export function assFile(timing: Timing, font = 'Zen Kaku Gothic New') {
  const head = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,${font},38,&H00FFFFFF,&H00FFFFFF,&H5A000000,&H5A000000,-1,0,0,0,100,100,1,0,3,7,0,2,80,80,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const body = subtitleLines(timing).map((l) => {
    const txt = breakLines(l.text).map((ln) => ln.replace(/\*\*(.+?)\*\*/g, '{\\c&H4AD8FF&\\fs44}$1{\\r}')).join('\\N');
    return `Dialogue: 0,${ass2(l.t0)},${ass2(l.t1)},Sub,,0,0,0,,${txt}`;
  });
  return head + body.join('\n') + '\n';
}
export function srtFile(timing: Timing) {
  return subtitleLines(timing).map((l, i) => `${i + 1}\n${srt2(l.t0)} --> ${srt2(l.t1)}\n${breakLines(plainText(l.text)).join('\n')}\n`).join('\n');
}

/* ---------- FFmpeg edit list ---------- */
/**
 * One global timeline at 24 fps (frame n = n / 24 s), so nothing drifts at scene joins:
 *   background  = per Wan shot: wan/<scene>_<shot>.webm if it exists, else the animatic plate frames
 *   overlay     = layers/overlay_%05d.png (MEDSTUDY figure layer, transparent)
 *   audio       = audio/<scene>.wav back to back (their lengths ARE the timing) + SFX at absolute times
 *   subtitles   = subtitles.ass burned in last; invert windows applied with negate
 */
export function editList(plan: Plan, timing: Timing, profile: WanProfile, voiceKey: string) {
  const st = shotTimes(plan, timing, profile), FPS = 24, fr = (s: number) => Math.round(s * FPS);
  return {
    plan: plan.key,
    voice: voiceKey,
    size: [1280, 720], fps: FPS,
    total: +timing.total.toFixed(3),
    frames: fr(timing.total),
    timing: timing.source,
    layers: { plate: 'layers/plate_%05d.jpg', overlay: 'layers/overlay_%05d.png' },
    note: '背景（Wan クリップ／無ければ MEDSTUDY アニマティック）→ 医学図レイヤーを重ねる → 白黒反転 → 字幕（ASS）→ 講師音声＋効果音（＋任意で BGM、声に合わせて自動で下げる）',
    scenes: plan.scenes.map((sc) => {
      const ts = timing.scenes.find((x) => x.id === sc.id)!;
      return {
        id: sc.id, t0: +ts.t0.toFixed(3), dur: +(ts.t1 - ts.t0).toFixed(3),
        audio: `audio/${sc.id}.wav`,
        shots: st.filter((x) => x.scene === sc.id).map((x) => {
          const sh = sc.shots.find((s) => s.id === x.shot)!;
          return { id: x.shot, wan: `wan/${sc.id}_${x.shot}.webm`, mode: sh.mode, t0: +x.t0.toFixed(3), dur: +x.dur.toFixed(3), f0: fr(x.t0), f1: fr(x.t1), wanFrames: x.frames, wanFps: WAN_PROFILES[profile].fps };
        }),
        sfx: sc.sfx.filter((s) => (!s.min || shows(s.min, plan.intensity)) && Number.isFinite(at(ts, s.at))).map((s) => ({ kind: s.kind, t: +at(ts, s.at).toFixed(3), gain: s.gain ?? 1 })),
        invert: sc.fx.filter((f) => f.kind === 'invert' && shows(f.min, plan.intensity) && Number.isFinite(at(ts, f.at))).map((f) => [+at(ts, f.at).toFixed(3), f.dur]),
      };
    }),
    subtitles: 'subtitles.ass',
    bgm: { file: null as string | null, gain: 0.18, duck: true },
  };
}

/* ---------- 台本（タイムコード付き）and camera sheet ---------- */
const MOVE: Record<string, string> = { set: '構図', push: '前進', crash: '急接近', pan: 'パン', pull: 'ズームアウト', whip: '高速パン' };
const FX: Record<string, string> = { focus: '集中線', speed: 'スピード線', impact: '衝撃', flash: '閃光', invert: '白黒反転', shake: '画面揺れ', onoma: '擬音', tone: 'スクリーントーン' };

export function sceneEvents(sc: SceneDef, timing: Timing, intensity: Intensity) {
  const ts = timing.scenes.find((x) => x.id === sc.id)!;
  const ev: { t: number; kind: 'cam' | 'fx' | 'sfx'; text: string }[] = [];
  for (const c of sc.cams) ev.push({ t: at(ts, c.at), kind: 'cam', text: `カメラ${MOVE[c.move]}：${c.note}${c.hold ? `（${c.hold}秒静止）` : ''}` });
  for (const f of sc.fx) if (shows(f.min, intensity) && f.kind !== 'tone') ev.push({ t: at(ts, f.at), kind: 'fx', text: `${FX[f.kind]}${f.text ? `「${f.text}」` : ''}` });
  return ev.filter((e) => Number.isFinite(e.t)).sort((a, b) => a.t - b.t);
}

export function scriptMarkdown(plan: Plan, timing: Timing, profile: WanProfile) {
  const st = shotTimes(plan, timing, profile);
  const L: string[] = [];
  L.push(`# 授業動画 台本：${plan.theme}`, '');
  L.push(`- 動画時間：${plan.duration}秒（実尺 ${timing.total.toFixed(1)} 秒・タイミング＝${timing.source === 'kokoro' ? 'Kokoro 実測' : '推定（Kokoro 生成後に確定）'}）`);
  L.push(`- 授業スタイル：${STYLE_LABEL[plan.style]}　アニメーション強度：${INTENSITY_LABEL[plan.intensity]}（医学図はすべての強度で同一）`);
  L.push(`- 講師音声：Kokoro ${plan.voice.kokoro}（話速 ${plan.voice.speed}）`);
  L.push(`- ${plan.curated ? '監修済み演出（台詞はすべて教材の講義台詞から）' : '自動下書き（要監修）'}`, '');
  for (const r of plan.rationale) L.push(`> ${r}`);
  L.push('');
  for (const sc of plan.scenes) {
    const ts = timing.scenes.find((x) => x.id === sc.id)!;
    L.push(`## ${sc.id}　${tc(ts.t0)}–${tc(ts.t1)}　${sc.title}`, '');
    L.push(`**教材との対応**：${[...new Set(sc.beats.map((b) => describeSrc(b.src)))].join(' ／ ')}`, '');
    L.push(`**映像**：${sc.picture}`, '');
    L.push(`**医学図**：${sc.diagram.title}（${sc.diagram.note}）`, '');
    L.push('**台本と同期**', '');
    const evs = sceneEvents(sc, timing, plan.intensity);
    const segs = timing.segs.filter((x) => x.scene === sc.id);
    const rows: { t: number; s: string }[] = [
      ...segs.map((x) => ({ t: x.speech0, s: `${tc(x.speech0)}–${tc(x.speech1)}　「${plainText(x.seg.text)}」` })),
      ...evs.map((e) => ({ t: e.t, s: `${tc(e.t)}　▶ ${e.text}` })),
    ].sort((a, b) => a.t - b.t);
    for (const r of rows) L.push(`- ${r.s}`);
    L.push('');
    for (const sh of sc.shots) {
      const x = st.find((y) => y.scene === sc.id && y.shot === sh.id)!;
      const p = wanPrompt(sc, sh, plan.intensity);
      L.push(`**Wan 2.2 ショット ${sc.id}_${sh.id}**（${tc(x.t0)}〜 ${x.dur.toFixed(2)}秒・${x.frames}フレーム・${sh.mode === 'background' ? '背景（医学図を上に重ねる）' : '主役（ラベルのみ重ねる）'}）：${sh.desc}`, '');
      L.push('```text', `PROMPT: ${p.positive}`, `NEGATIVE: ${p.negative}`, '```', '');
    }
    const sfx = sc.sfx.filter((s) => (!s.min || shows(s.min, plan.intensity)) && Number.isFinite(at(ts, s.at))).map((s) => `${tc(at(ts, s.at))} ${s.kind}`);
    L.push(`**効果音**：${sfx.join('、') || 'なし'}`, '');
  }
  return L.join('\n');
}

export function describeSrc(s: { lecture: number; cues?: string[]; slide?: number; board?: string[]; question?: string; mode: string }) {
  const m: Record<string, string> = { verbatim: '原文', trimmed: '原文の一部', condensed: '要約（用語は教材のまま）', material: '教材の表示文' };
  const parts = [`第${s.lecture}講`];
  if (s.cues?.length) parts.push(`台詞 ${s.cues.join('・')}`);
  if (s.slide) parts.push(`スライド${s.slide}`);
  if (s.board?.length) parts.push(`板書 ${s.board.join('・')}`);
  if (s.question) parts.push(`問題 ${s.question}`);
  return `${parts.join('／')}（${m[s.mode]}）`;
}
