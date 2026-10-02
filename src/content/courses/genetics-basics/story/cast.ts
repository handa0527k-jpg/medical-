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
