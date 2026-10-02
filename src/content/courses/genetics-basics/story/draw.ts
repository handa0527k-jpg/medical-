/** Story anime「設計図の図書館」: the genome as a night library of blueprints (one causal story, 10 scenes). */
import type { SceneDraw } from '../../../../engine/story/types';
import { opening } from './opening';
import { library } from './scenes/library';
import { letters } from './scenes/letters';
import { pack } from './scenes/pack';
import { meiosis } from './scenes/meiosis';
import { read } from './scenes/read';
import { typo } from './scenes/typo';
import { jump } from './scenes/jump';
import { notes } from './scenes/notes';
import { close } from './scenes/close';

export const DRAW: Record<string, SceneDraw> = { opening, library, letters, pack, meiosis, read, typo, jump, notes, close };
