/**
 * AnimationStage — the imperative SVG renderer behind every mechanism animation.
 *
 * It owns the scene DOM (main scene, macro "tissue" overlay, split-screen
 * panels, numbered markers, particle bursts, HUD) and redraws it for a given
 * scripted step and progress. It is framework-agnostic and runs inside a
 * requestAnimationFrame loop owned by the caller (AnimationPlayer or the
 * lecture player), so React never re-renders per frame.
 */
import { CL, E, EZ, FULL, L, VB, lerpC, seg } from '../svg';
import type { AnimDef, AnimScript, AnimState, AnimStep } from './types';

interface Cached { g: SVGGElement; S: AnimState }
interface MarkEl { g: SVGGElement; ring: SVGCircleElement; dot: SVGCircleElement; nb: SVGTextElement; tx: SVGTextElement; k: NonNullable<AnimStep['mk']>[number] }

export interface StageHud { value: string; label: string; visible: boolean }

export class AnimationStage {
  readonly root: HTMLElement;
  private readonly svg: SVGSVGElement;
  private readonly macro: SVGSVGElement;
  private readonly split: HTMLElement;
  private readonly panels: { svg: SVGSVGElement; kicker: HTMLElement; label: HTMLElement }[];
  private readonly overlay: SVGGElement;
  private readonly cache: Record<'main' | 'L' | 'R', Record<string, Cached>> = { main: {}, L: {}, R: {} };
  private readonly defMode: string | null;
  private current: AnimStep | null = null;
  private marks: MarkEl[] = [];
  private burst: { c: SVGCircleElement; a: number; v: number }[] = [];
  hud: StageHud = { value: '', label: '', visible: true };

  constructor(host: HTMLElement, private readonly def: AnimDef, private readonly script: AnimScript, macroSvg: string, modes: [string, string][] | null) {
    this.defMode = modes ? modes[0][0] : null;
    host.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'stage-rig';
    root.innerHTML =
      '<svg class="stage-main" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>' +
      '<svg class="stage-macro" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>' +
      '<div class="stage-split">' +
      [0, 1].map(() => '<div class="sp"><svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg><div class="spl"><em></em><b></b></div></div>').join('') +
      '</div>';
    host.appendChild(root);
    this.root = root;
    this.svg = root.querySelector('.stage-main')!;
    this.macro = root.querySelector('.stage-macro')!;
    this.macro.innerHTML = macroSvg + (script.mx ? `<g>${script.mx}</g>` : '');
    this.split = root.querySelector('.stage-split')!;
    this.panels = [...root.querySelectorAll<HTMLElement>('.sp')].map((sp) => ({
      svg: sp.querySelector('svg')!, kicker: sp.querySelector('em')!, label: sp.querySelector('b')!,
    }));
    this.overlay = E('g', {}, this.svg);
  }

  private scene(key: 'main' | 'L' | 'R', el: SVGSVGElement, mode: string | null, before?: Element): AnimState {
    const c = this.cache[key], k = mode || '_';
    if (!c[k]) {
      const g = E('g', {});
      if (before) el.insertBefore(g, before); else el.appendChild(g);
      c[k] = { g, S: this.def.build(g, mode) };
    }
    for (const kk in c) c[kk].g.style.display = kk === k ? '' : 'none';
    return c[k].S;
  }

  private enter(s: AnimStep) {
    this.current = s;
    const ov = this.overlay;
    while (ov.firstChild) ov.removeChild(ov.firstChild);
    this.marks = (s.mk || []).map((k, j) => {
      const g = E('g', { opacity: 0 }, ov), col = k[3] || '#fff';
      const ring = E('circle', { fill: 'none', stroke: col }, g);
      const dot = E('circle', { fill: col }, g);
      const nb = E('text', { fill: '#030407', 'font-weight': 900, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g);
      nb.textContent = String(j + 1);
      const tx = E('text', { fill: '#fff', 'font-weight': 700, 'paint-order': 'stroke', stroke: '#030407', 'stroke-linejoin': 'round', 'text-anchor': k[4] === 'l' ? 'end' : 'start', 'dominant-baseline': 'central' }, g);
      tx.textContent = k[2];
      return { g, ring, dot, nb, tx, k };
    });
    this.burst = [];
    if (s.burst) for (let i = 0; i < 28; i++) this.burst.push({ c: E('circle', { fill: s.burst[2], filter: 'url(#gl)' }, ov), a: (i / 28) * 6.283 + (i % 3) * 0.2, v: 0.6 + ((i * 37) % 10) / 10 });
  }

  /** Draw step `s` at local progress p ∈ [0,1]; T = wall-clock seconds for pulsing. */
  draw(s: AnimStep, p: number, T: number) {
    if (s !== this.current) this.enter(s);
    const mode = s.m || this.defMode;

    if (s.split) {
      this.split.style.display = 'grid';
      (['L', 'R'] as const).forEach((k, j) => {
        const c = s.split![k], pn = this.panels[j], mm = c[0] || this.defMode;
        this.def.frame(this.scene(k, pn.svg, mm), L(c[1], c[2], p), mm);
        pn.svg.setAttribute('viewBox', VB(c[5] || FULL).map((v) => v.toFixed(1)).join(' '));
        pn.kicker.textContent = c[3];
        pn.label.textContent = c[4];
      });
    } else this.split.style.display = 'none';

    const ot = s.r ? L(s.r[0], s.r[1], p) : 1;
    this.def.frame(this.scene('main', this.svg, mode, this.overlay), ot, mode);
    const vb = s.cam ? VB(lerpC(s.cam[0], s.cam[1] || s.cam[0], EZ(p))) : this.script.cam ? VB(this.script.cam) : VB(this.def.cam(ot));
    this.svg.setAttribute('viewBox', vb.map((v) => v.toFixed(1)).join(' '));

    const mo = s.mo ? L(s.mo[0], s.mo[1], seg(p, s.mo[2] || 0, s.mo[3] ?? 1)) : 0;
    this.macro.style.opacity = String(mo);
    this.macro.style.visibility = mo > 0.001 ? 'visible' : 'hidden';
    if (mo > 0.001 && s.mc) this.macro.setAttribute('viewBox', VB(lerpC(s.mc[0], s.mc[1] || s.mc[0], EZ(p))).map((v) => v.toFixed(1)).join(' '));

    const h = this.def.hud(ot, mode);
    this.hud = { value: h[0], label: h[1], visible: !(mo > 0.5 || s.split) };

    // markers are sized in screen pixels regardless of camera zoom
    const W = this.root.clientWidth || 800, H = this.root.clientHeight || 450;
    const u = 1 / Math.min(W / vb[2], H / vb[3]);
    this.marks.forEach((o, j) => {
      const a = CL((p * s.d - 0.4 - j * 0.7) / 0.5), [x, y] = o.k, pu = Math.sin(T * 4 + j) * 0.5 + 0.5;
      o.g.setAttribute('opacity', String(a));
      o.ring.setAttribute('cx', String(x)); o.ring.setAttribute('cy', String(y));
      o.ring.setAttribute('r', String(u * (15 + pu * 7))); o.ring.setAttribute('stroke-width', String(u * 2.5)); o.ring.setAttribute('opacity', String(1 - pu * 0.6));
      o.dot.setAttribute('cx', String(x)); o.dot.setAttribute('cy', String(y)); o.dot.setAttribute('r', String(u * 9));
      o.nb.setAttribute('x', String(x)); o.nb.setAttribute('y', String(y + u * 0.5)); o.nb.setAttribute('font-size', String(u * 11));
      const dir = o.k[4] === 'l' ? -1 : 1;
      o.tx.setAttribute('x', String(x + dir * u * 24)); o.tx.setAttribute('y', String(y));
      o.tx.setAttribute('font-size', String(u * 15)); o.tx.setAttribute('stroke-width', String(u * 4));
    });
    if (this.burst.length && s.burst) {
      const b = seg(p, 0, 0.45), [bx, by] = s.burst;
      this.burst.forEach((o) => {
        const r = EZ(b) * 170 * o.v;
        o.c.setAttribute('cx', String(bx + Math.cos(o.a) * r)); o.c.setAttribute('cy', String(by + Math.sin(o.a) * r * 0.8));
        o.c.setAttribute('r', String(u * (4 - b * 2))); o.c.setAttribute('opacity', String(b > 0 && b < 1 ? 1 - b : 0));
      });
    }
  }
}

/** Precomputed timing of an animation script. */
export interface TimedStep extends AnimStep { i: number; s0: number; s1: number; gn: number }
export interface StepGroup { name: string; first: number; n: number }

export function timeScript(script: AnimScript): { steps: TimedStep[]; groups: StepGroup[]; total: number } {
  let acc = 0;
  const groups: StepGroup[] = [];
  const steps = script.steps.map((s, i) => {
    let g = groups[groups.length - 1];
    if (!g || g.name !== s.g) { g = { name: s.g, first: i, n: groups.length + 1 }; groups.push(g); }
    const t: TimedStep = { ...s, i, s0: acc, s1: acc + s.d, gn: g.n };
    acc += s.d;
    return t;
  });
  return { steps, groups, total: acc };
}

export function stepAt(steps: TimedStep[], t: number): TimedStep {
  for (const s of steps) if (t < s.s1) return s;
  return steps[steps.length - 1];
}
