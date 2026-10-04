/** Story anime「写字室の朝」: the day after「設計図の図書館」— copy, edit and deliver a transcript by noon (7 scenes). */
import type { SceneDraw } from '../../../../engine/story/types';
import { morning } from './scenes/morning';
import { mirror } from './scenes/mirror';
import { annexScene } from './scenes/annex';
import { reception } from './scenes/reception';
import { edit } from './scenes/edit';
import { ncrna } from './scenes/ncrna';
import { noon } from './scenes/noon';

export const DRAW: Record<string, SceneDraw> = { morning, mirror, annex: annexScene, reception, edit, ncrna, noon };
