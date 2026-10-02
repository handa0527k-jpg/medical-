import type { StoryDef, StoryModule } from '../../../../engine/story/types';
import def from './story.json';
import { DRAW } from './draw';

const story: StoryModule = { def: def as unknown as StoryDef, draw: DRAW };
export default story;
