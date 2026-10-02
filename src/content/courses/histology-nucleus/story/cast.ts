/** The people of「午前二時の本社ビル」 (one look each, used in every shot). */
import type { BodyLook } from '../../../../engine/story/body';

/** タグ（僕）: the night courier who carries ribosomal proteins to the head office — orange cap and jacket */
export const TAG: BodyLook = {
  heads: 6.8, shoulders: 1.4, slim: 0.92,
  skin: '#f1cfb4', skinShade: '#d6a688', blush: 'rgba(225,120,105,.16)',
  hair: '#3a2a20', hairShade: '#21170f', hairLight: '#8a6a52', hairStyle: 'messy',
  iris: '#4a3326', brows: '#2a1e18',
  shirt: '#efe9dc', top: '#c8743c', topShade: '#9a5428', topTrim: '#7a4220',
  pants: '#3a3f4c', pantsShade: '#2a2e38', shoes: '#4a3424', cap: '#d57f45',
};
/** ポア: the gatekeeper of the eight-pillar gate (nuclear pore complex) — blue uniform, octagon badge */
export const POA: BodyLook = {
  heads: 7.1, shoulders: 1.55,
  skin: '#e2b897', skinShade: '#bf8f72',
  hair: '#9a948c', hairShade: '#6e6962', hairLight: '#d6d1c8', hairStyle: 'short',
  iris: '#3a2e26', brows: '#7a746c',
  shirt: '#c9d6e6', tie: '#1b2a44', top: '#2f4f7a', topShade: '#223a5c', topTrim: '#1a2c48',
  pants: '#26324a', pantsShade: '#1b2436', shoes: '#141414', cap: '#3f6fa8', patch: '#ffd36b',
};
/** ヒスト: the archivist who winds DNA onto histone spools — grey-violet cardigan, bun, half glasses */
export const HISTO: BodyLook = {
  heads: 6.9, shoulders: 1.3, fem: true, slim: 0.86,
  skin: '#f0cbb0', skinShade: '#d3a184', blush: 'rgba(230,120,120,.2)',
  hair: '#3a2c3e', hairShade: '#21182a', hairLight: '#7a6488', hairStyle: 'bun',
  iris: '#3d2c4a', brows: '#2a1e2e', glasses: 'half',
  shirt: '#f2ecf4', top: '#7d6a96', topShade: '#5c4c72', topTrim: '#4a3c5e',
  pants: '#3a3346', pantsShade: '#2a2434', shoes: '#3a2a2a',
};
/** ノル: the chief of the assembly rooms (nucleolus) — broad, rose work apron, round glasses */
export const NOR: BodyLook = {
  heads: 7.2, shoulders: 1.65,
  skin: '#e6bf9f', skinShade: '#c49474',
  hair: '#4a3a30', hairShade: '#2a2018', hairLight: '#8a7260', hairStyle: 'short',
  iris: '#3a2a1e', brows: '#3a2a20', glasses: 'round',
  shirt: '#ece4da', top: '#b04a62', topShade: '#86364a', topTrim: '#6a2a3a',
  pants: '#3a3434', pantsShade: '#2a2424', shoes: '#2a1c12',
};
/** スピン: the mover on moving day (spindle) — ponytail, green work jacket */
export const SPIN: BodyLook = {
  heads: 6.8, shoulders: 1.32, fem: true, slim: 0.88,
  skin: '#f3d2b6', skinShade: '#d9a98a', blush: 'rgba(235,125,110,.24)',
  hair: '#6a3e22', hairShade: '#45281a', hairLight: '#b07a4c', hairStyle: 'pony',
  iris: '#5a3a22', brows: '#5a3820',
  shirt: '#f2efe6', top: '#3a9b69', topShade: '#2a7550', topTrim: '#1f5a3c',
  pants: '#3b4250', pantsShade: '#2a303c', shoes: '#4a3424',
};
/** ステム: the founder at the bottom of the crypt (stem cell) — silver bun, cream shawl */
export const STEM: BodyLook = {
  heads: 6.8, shoulders: 1.35, fem: true, slim: 0.88,
  skin: '#ecc8ab', skinShade: '#cc9e82', blush: 'rgba(220,120,110,.18)',
  hair: '#c9c3ba', hairShade: '#9a948c', hairLight: '#f0ebe4', hairStyle: 'bun',
  iris: '#4a3a30', brows: '#a8a198',
  shirt: '#f4ede0', top: '#d8c7a4', topShade: '#b4a27e', topTrim: '#9a8866',
  pants: '#5a4e40', pantsShade: '#463c30', shoes: '#3a2a1e', skirt: '#6a5a46',
};
/** standing heights (m) */
export const HEIGHT = { TAG: 1.66, POA: 1.72, HISTO: 1.6, NOR: 1.78, SPIN: 1.62, STEM: 1.56 };
