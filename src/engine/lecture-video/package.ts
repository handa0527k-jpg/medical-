/**
 * The production package MEDSTUDY hands to the Windows side (ComfyUI / Wan 2.2 / Kokoro / FFmpeg).
 *
 *   medstudy_video.json   everything below in one file (the master)
 *   script.md             台本（タイムコード・映像・カメラ・Wanプロンプト・効果音）
 *   kokoro/script.json    lines for Kokoro (reading, speed, pauses, cue markers)
 *   comfy/<profile>/*.api.json   one ComfyUI API workflow per Wan shot
 *   keyframes/*.png       MEDSTUDY's text-free start image for each Wan shot
 *   diagrams/*.svg        the exact figures (vector)
 *   subtitles.ass / .srt  subtitles (key terms highlighted)
 *   edit.json             FFmpeg edit list (scenes, shots, layers, SFX, invert windows)
 *   timing.json           the timing used (estimate or Kokoro-measured)
 */
import type { Plan, SceneDef, Timing } from './types';
import { INTENSITY_LABEL, STYLE_LABEL } from './types';
import { assFile, editList, kokoroScript, scriptMarkdown, srtFile, describeSrc, plainText } from './edit';
import { comfyWorkflow, seedOf, shotTimes, wanPrompt, WAN_PROFILES, type WanProfile } from './wan';
import { SvgPen } from './pen';
import { CHALK, INK, chalkOp, diplococcus, dish, tube, type ChalkMap } from './diagrams';
import type { BoardOp } from '../board/types';
import type { ZipInput } from './zip';

export function wanJobs(plan: Plan, timing: Timing, profile: WanProfile) {
  return shotTimes(plan, timing, profile).map((x) => {
    const sc = plan.scenes.find((s) => s.id === x.scene)!, sh = sc.shots.find((s) => s.id === x.shot)!;
    const p = wanPrompt(sc, sh, plan.intensity);
    const name = `${x.scene}_${x.shot}`;
    return {
      name, scene: x.scene, shot: x.shot, mode: sh.mode, desc: sh.desc, t0: +x.t0.toFixed(3), dur: +x.dur.toFixed(3), frames: x.frames,
      keyframe: `keyframes/${name}.png`, prompt: p.positive, negative: p.negative, camera: p.cameraJa,
      seed: seedOf(`${plan.key}:${name}`),
    };
  });
}

export function manifest(plan: Plan, timing: Timing, profile: WanProfile, voiceKey: string) {
  return {
    format: 'medstudy-lecture-video/1',
    created: new Date().toISOString(),
    roles: { MEDSTUDY: '教材理解・授業設計・医学図・管理', ComfyUI: '動画生成ワークフロー管理', 'Wan 2.2': '映像生成（文字・正確な構造は描かせない）', Kokoro: '日本語講師音声', FFmpeg: '映像・音声・字幕・効果音の最終統合' },
    theme: plan.theme, curated: plan.curated, rationale: plan.rationale,
    options: { duration: plan.duration, style: STYLE_LABEL[plan.style], intensity: INTENSITY_LABEL[plan.intensity] },
    wan: { profile, ...WAN_PROFILES[profile], jobs: wanJobs(plan, timing, profile) },
    kokoro: kokoroScript(plan, voiceKey),
    timing,
    edit: editList(plan, timing, profile, voiceKey),
    scenes: plan.scenes.map((s) => ({
      id: s.id, title: s.title, picture: s.picture, diagram: s.diagram, lecturer: !!s.lecturer,
      sources: s.beats.map((b) => ({ beat: b.id, source: describeSrc(b.src), ref: b.src, lines: b.segs.map((x) => plainText(x.text)) })),
      cams: s.cams, fx: s.fx, sfx: s.sfx,
    })),
  };
}

/** text files of the package; keyframes / layers are added by the caller (they need a canvas) */
export function packageFiles(plan: Plan, timing: Timing, profile: WanProfile, voiceKey: string): ZipInput {
  const files: ZipInput = {};
  const m = manifest(plan, timing, profile, voiceKey);
  files['medstudy_video.json'] = JSON.stringify(m, null, 1);
  files['script.md'] = scriptMarkdown(plan, timing, profile);
  files['kokoro/script.json'] = JSON.stringify(m.kokoro, null, 1);
  files['timing.json'] = JSON.stringify(timing, null, 1);
  files['edit.json'] = JSON.stringify(m.edit, null, 1);
  files['subtitles.ass'] = assFile(timing);
  files['subtitles.srt'] = srtFile(timing);
  for (const j of m.wan.jobs) {
    files[`comfy/${profile}/${j.name}.api.json`] = JSON.stringify(comfyWorkflow({ profile, positive: j.prompt, negative: j.negative, image: `${j.name}.png`, frames: j.frames, prefix: `medstudy/${voiceKey}/${j.name}`, seed: j.seed }), null, 1);
    if (profile === 'i2v-14b') files[`comfy/${profile}-4step/${j.name}.api.json`] = JSON.stringify(comfyWorkflow({ profile, positive: j.prompt, negative: j.negative, image: `${j.name}.png`, frames: j.frames, prefix: `medstudy/${voiceKey}/${j.name}`, seed: j.seed, fast: true }), null, 1);
  }
  for (const s of plan.scenes) { const svg = diagramSvg(s); if (svg) files[`diagrams/${s.id}_${s.diagram.id}.svg`] = svg; }
  return files;
}

/* ---------- exact figures as SVG (final state of each scene's figure) ---------- */
export function diagramSvg(sc: SceneDef): string | null {
  const p = new SvgPen(1280, 720, '#14181b');
  const lab = (s: string, x: number, y: number, size: number, fill = '#fff', align: CanvasTextAlign = 'left') => p.text(s, x, y, { size, font: 'gothic', weight: 900, fill, stroke: INK, strokeW: size * 0.2, align });
  const PARTS = ['DNA', 'RNA', '脂質', 'タンパク質', '炭水化物'], X = [200, 420, 640, 860, 1080];
  switch (sc.visual) {
    case 'strains': {
      for (const [x, y, cap] of [[330, 380, 1], [930, 380, 0]] as const) { p.save(); p.translate(x, y); p.scale(1.6); diplococcus(p, { capsule: cap }); p.restore(); }
      lab('S株', 120, 130, 80, CHALK.y); lab('被膜あり・表面が滑らか', 120, 205, 30); lab('病原性あり', 120, 250, 30, '#ff7a66');
      lab('R株', 1160, 130, 80, '#d9d9d9', 'right'); lab('被膜なし・表面が滑らかでない', 1160, 205, 30, '#fff', 'right'); lab('病原性なし', 1160, 250, 30, '#9fd0ff', 'right');
      p.line([[262, 300], [300, 338]], { stroke: '#fff', width: 3 }); lab('被膜', 200, 293, 26);
      lab('肺炎球菌（双球菌）— S株とR株の違いは被膜の有無', 640, 640, 26, '#e8e2d0', 'center');
      break;
    }
    case 'tubes': {
      lab('S株の成分', 640, 62, 40, CHALK.y, 'center');
      p.rect(110, 330, 1060, 22, { fill: '#2a2018', stroke: INK, width: 5 });
      X.forEach((x, i) => {
        tube(p, x, 110, 270, 0.8, 'rgba(214,196,150,0.75)');
        p.rect(x - 62, 219, 124, 52, { fill: '#faf6ea', stroke: INK, width: 4 }, 6);
        p.text(PARTS[i], x, 246, { size: PARTS[i].length > 3 ? 23 : 30, font: 'gothic', weight: 900, fill: i === 0 ? '#b3261e' : '#1b1b1b', align: 'center' });
        dish(p, x, 505, 62, 0, i + 1); lab('R株', x + 70, 470, 22);
      });
      lab('それぞれ別のR株に加える', 640, 620, 26, '#e8e2d0', 'center');
      break;
    }
    case 'plates': {
      lab('各成分を加えた R株', 640, 70, 34, '#fff', 'center');
      X.forEach((x, i) => {
        dish(p, x, 330, 92, i === 0 ? 1 : 0, i + 3);
        p.rect(x - 70, 400, 140, 44, { fill: '#faf6ea', stroke: INK, width: 4 }, 6);
        p.text(PARTS[i], x, 422, { size: PARTS[i].length > 3 ? 22 : 28, font: 'gothic', weight: 900, fill: i === 0 ? '#b3261e' : '#1b1b1b', align: 'center' });
        lab(i === 0 ? 'S株に変化' : 'R株のまま', x, 210, i === 0 ? 34 : 24, i === 0 ? CHALK.y : '#cfcfcf', 'center');
      });
      p.save(); p.translate(640, 560); p.scale(1.4); diplococcus(p, { capsule: 1 }); p.restore();
      lab('形質転換（R株 → S株：被膜をもつ）', 640, 650, 28, '#fff', 'center');
      break;
    }
    case 'board-question': case 'board-summary': {
      const ops = (sc.data?.board as BoardOp[]) ?? [];
      p.rect(70, 40, 1140, 560, { fill: '#1d2b27', stroke: '#2d1f14', width: 16 });
      const m: ChalkMap = sc.visual === 'board-question' ? { bx: 1620, by: 280, sx: 640, sy: 230, k: 1.15 } : { bx: 60, by: 840, sx: 150, sy: 120, k: 1.0 };
      ops.forEach((op) => chalkOp(p, op, m, 1));
      break;
    }
    default: return null;
  }
  return p.toString(`${sc.id} ${sc.diagram.title}`);
}
