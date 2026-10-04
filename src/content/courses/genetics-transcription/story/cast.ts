/**
 * People of「写字室の朝」. Jin, Deo, Spra, Octa and Mechi are the characters of「設計図の図書館」
 * (genetics-basics) and are used exactly as defined there; Pol, Core and Sigma are new.
 */
import type { Look } from '../../../../engine/story/rig';
export { JIN, DEO, SPRA, OCTA, MECHI } from '../../genetics-basics/story/cast';

/** ポル: copyist of the main hall (RNA polymerase II) — light-blue smock (the polymerase colour of the lecture figures), chestnut ponytail */
export const POL: Look = {
  heads: 7, shoulders: 1.36, fem: true,
  skin: '#f3d1b6', skinShade: '#d8a687', blush: 'rgba(235,120,110,.22)',
  hair: '#8a5530', hairShade: '#5e3720', hairLight: '#c9905e', hairStyle: 'pony',
  iris: '#4a3020', brows: '#6a4026',
  shirt: '#f6f3ec', top: '#7fb6dc', topShade: '#5b93bd', topTrim: '#3f77a3',
  pants: '#3a4560', pantsShade: '#2a3248', shoes: '#4a3424',
  apron: '#e9f2fa',
};
/** コア: copyist of the annex (bacterial core enzyme) — the same light-blue smock, short dark hair, smaller build */
export const CORE: Look = {
  heads: 6.6, shoulders: 1.42,
  skin: '#ecc6a6', skinShade: '#cd9b7c',
  hair: '#2e2824', hairShade: '#1a1512', hairLight: '#6a5a4e', hairStyle: 'short',
  iris: '#3a2a20', brows: '#2a201a',
  shirt: '#f4f1ea', top: '#8cc2e4', topShade: '#64a0c8', topTrim: '#477fa8',
  pants: '#384256', pantsShade: '#272e3e', shoes: '#3a2a1e',
};
/** シグマ: the annex guide (σ factor) — a boy with an orange sash */
export const SIGMA: Look = {
  heads: 5.4, shoulders: 1.22,
  skin: '#f5d6bc', skinShade: '#dcac8c', blush: 'rgba(240,120,100,.3)',
  hair: '#6a3e22', hairShade: '#452614', hairLight: '#b07a4e', hairStyle: 'messy',
  iris: '#4a2a16', brows: '#5a3418',
  shirt: '#fff6ea', top: '#f0a868', topShade: '#d8854a', topTrim: '#b9652e',
  pants: '#4a4238', pantsShade: '#342e26', shoes: '#4a3020',
  scarf: ['#e0703a', '#ffd0a0'],
};
