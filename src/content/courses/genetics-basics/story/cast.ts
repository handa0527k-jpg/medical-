/** The two people of「設計図の図書館」. One look each, used in every shot (full figure and close-up). */
import type { Look } from '../../../../engine/story/rig';

/** ジン（僕）: apprentice librarian, about twenty, slim */
export const JIN: Look = {
  heads: 6.8, shoulders: 1.45,
  skin: '#f0cdb2', skinShade: '#d6a688', blush: 'rgba(225,120,105,.16)',
  hair: '#33251e', hairShade: '#1f1612', hairLight: '#9a7a62', hairStyle: 'messy',
  iris: '#4a3326', glasses: 'round', brows: '#2a1e18',
  shirt: '#ece7dd', top: '#41604c', topShade: '#2b4335', topTrim: '#22362a',
  pants: '#2b3346', pantsShade: '#1e2433', shoes: '#5a3a26',
  satchel: ['#b49c76', '#6b4a2e'],
};

/** デオ: keeper of the originals, elderly, tall */
export const DEO: Look = {
  heads: 7.2, shoulders: 1.5,
  skin: '#e7c1a4', skinShade: '#c4967c',
  hair: '#dcd8d1', hairShade: '#a39e96', hairLight: '#ffffff', hairStyle: 'swept',
  iris: '#5a5048', glasses: 'half', beard: '#cfcac2', brows: '#bab3a9',
  shirt: '#d8d2c6', top: '#3b3b42', topShade: '#27272d', topTrim: '#1b1b20', coat: true,
  pants: '#2a2a30', pantsShade: '#1d1d22', shoes: '#2a2018',
  scarf: ['#9e3636', '#3e6aa8'], loupe: true,
};

/** オクタ: the spool keeper deep in the stacks (histone octamer) — bob, violet apron, eight-bead necklace */
export const OCTA: Look = {
  heads: 7, shoulders: 1.3, fem: true,
  skin: '#f0cbb0', skinShade: '#d3a184', blush: 'rgba(230,120,120,.2)',
  hair: '#2a2030', hairShade: '#17111b', hairLight: '#6e5a80', hairStyle: 'bob',
  iris: '#3d2c4a', brows: '#241a28',
  shirt: '#e8e0ee', top: '#7a6a8e', topShade: '#5a4c6c', topTrim: '#463a55',
  pants: '#3a3346', pantsShade: '#2a2434', shoes: '#3a2a2a',
  apron: '#5d3f7a', necklace: '#b48ad8', skirt: '#4a3e5c',
};
/** メイ: the distributor with the cart (meiosis) — ponytail, green work jacket */
export const MEI: Look = {
  heads: 6.9, shoulders: 1.32, fem: true,
  skin: '#f3d2b6', skinShade: '#d9a98a', blush: 'rgba(235,125,110,.24)',
  hair: '#7a4a2c', hairShade: '#4e2f1c', hairLight: '#c48c5c', hairStyle: 'pony',
  iris: '#5a3a22', brows: '#5a3820',
  shirt: '#f2efe6', top: '#4f7a52', topShade: '#375a3a', topTrim: '#2c472e',
  pants: '#3b4250', pantsShade: '#2a303c', shoes: '#4a3424',
};
/** スプラ: the editor in the scriptorium (splicing) — neat side part, mustard waistcoat, rolled sleeves */
export const SPRA: Look = {
  heads: 7.1, shoulders: 1.5,
  skin: '#e9c4a4', skinShade: '#c99878',
  hair: '#3a2c22', hairShade: '#241a14', hairLight: '#8a6a50', hairStyle: 'short',
  iris: '#3a2a1e', brows: '#2a1e16',
  shirt: '#f1ede4', top: '#b08a2e', topShade: '#8a6a20', topTrim: '#6a5018',
  pants: '#2e2e36', pantsShade: '#202027', shoes: '#2a1c12',
};
/** タイポ: the proofreader — green eyeshade, maroon cardigan, red pen */
export const TAIPO: Look = {
  heads: 7, shoulders: 1.5,
  skin: '#e6bf9f', skinShade: '#c49474',
  hair: '#8a8580', hairShade: '#5e5a56', hairLight: '#d0ccc6', hairStyle: 'short',
  iris: '#4a3a2e', glasses: 'round', brows: '#6a6560',
  shirt: '#ece6da', top: '#7a2e36', topShade: '#5a2028', topTrim: '#3f161c',
  pants: '#2e2e36', pantsShade: '#202027', shoes: '#2a1c12', visor: 'rgba(40,140,90,.75)',
};
/** ライン: the migrating girl (transposon) — feathered orange cape */
export const LINE1: Look = {
  heads: 6.4, shoulders: 1.25, fem: true,
  skin: '#f4d6bc', skinShade: '#dcaa8c', blush: 'rgba(240,130,100,.26)',
  hair: '#d9772f', hairShade: '#a4531c', hairLight: '#ffc27a', hairStyle: 'bob',
  iris: '#7a3d18', brows: '#9a4e1e',
  shirt: '#fff3e2', top: '#e07b39', topShade: '#b85e26', topTrim: '#8c4418',
  pants: '#5a3a28', pantsShade: '#40281c', shoes: '#3a2418', cape: ['#e88a3a', '#ffd08a'],
};
/** メチ: the sticky-note keeper (epigenetics) — grey bun, brown shawl */
export const MECHI: Look = {
  heads: 6.8, shoulders: 1.4, fem: true,
  skin: '#e8c3a6', skinShade: '#c79a7e', blush: 'rgba(220,120,110,.18)',
  hair: '#a9a29a', hairShade: '#77716a', hairLight: '#e6e0d8', hairStyle: 'bun',
  iris: '#4a3a30', glasses: 'half', brows: '#8a837c',
  shirt: '#efe7d8', top: '#7d6047', topShade: '#5c4532', topTrim: '#45331f',
  pants: '#3a3030', pantsShade: '#2a2222', shoes: '#2a1c12', skirt: '#4a3a30',
};
