/** Story anime「午前二時の本社ビル」: the nucleus as a head office at night (motion-captured acting, 7 scenes). */
import type { SceneDraw } from '../../../../engine/story/types';
import { hq } from './scenes/hq';
import { gate } from './scenes/gate';
import { archiveScene } from './scenes/archive';
import { nucleolusScene } from './scenes/nucleolus';
import { splitScene } from './scenes/split';
import { branchScene } from './scenes/branch';
import { dawnScene } from './scenes/dawn';

export const DRAW: Record<string, SceneDraw> = { hq, gate, archive: archiveScene, nucleolus: nucleolusScene, split: splitScene, branch: branchScene, dawn: dawnScene };
