// Contact sheet of every sprite (for checking the pixel art): node src/preview-sprites.mjs out.png
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { sprite, FONT } from './engine.mjs';
import './sprites.mjs';
const names = process.argv.slice(3).length ? process.argv.slice(3) : ['hero','hero2','heroV','heroR','heroR2','owl','crab','spider','fox','camel','golem','jelly','gull','worm','dragon','tanuki','eel','fly','flyBig','robot','mole','fairy','ghost','raccoon','turtle','mouse','mouseG','boss','chest','chestOpen','tree','house','castle','tower','mtn','stone','ship','flask','bacterium'];
const S = 5, cell = 44 * S, cols = 8;
const cv = createCanvas(cols * cell, Math.ceil(names.length / cols) * (cell + 20));
const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
g.fillStyle = '#4a4f6a'; g.fillRect(0, 0, cv.width, cv.height);
names.forEach((n, i) => { const s = sprite(n); const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 20);
  g.drawImage(s, x + 10, y + 10, s.width * S, s.height * S); g.fillStyle = '#fff'; g.font = `16px ${FONT}`; g.fillText(n, x + 10, y + cell + 10); });
writeFileSync(process.argv[2], cv.toBuffer('image/png'));
