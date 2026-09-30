import { beforeAll, describe, expect, it } from 'vitest';
import kuromoji from 'kuromoji';
import { resolve } from 'node:path';
import { makePolite } from '../scripts/lib/polite';

let polite: (s: string) => string;
beforeAll(async () => {
  const t = await new Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>>((ok, ng) =>
    kuromoji.builder({ dicPath: resolve(__dirname, '../node_modules/kuromoji/dict') }).build((e, x) => (e ? ng(e) : ok(x))));
  polite = makePolite(t);
});

describe('plain → lecture style (です・ます)', () => {
  const cases: [string, string][] = [
    ['細胞膜の骨格は<b>脂質二重層</b>だ。', '細胞膜の骨格は<b>脂質二重層</b>です。'],
    ['粒が多いのは<b>P面</b>である。', '粒が多いのは<b>P面</b>です。'],
    ['荷物の迎え入れ方を見ていこう。', '荷物の迎え入れ方を見ていきましょう。'],
    ['どの通用口にも入らない。', 'どの通用口にも入りません。'],
    ['ノーベル賞を受けた。', 'ノーベル賞を受けました。'],
    ['粒が大きいので<b>光学顕微鏡でも見える</b>。', '粒が大きいので<b>光学顕微鏡でも見えます</b>。'],
    ['二列の脂質のすき間でパキッと割る。', '二列の脂質のすき間でパキッと割ります。'],
    ['これを<b>封入体</b>という。', 'これを<b>封入体</b>といいます。'],
    ['どうやって確かめたのか。', 'どうやって確かめたのでしょうか。'],
    ['読み進めてほしい。', '読み進めてください。'],
    ['核そのものは小器官とは呼ばない。', '核そのものは小器官とは呼びません。'],
  ];
  for (const [a, b] of cases) it(a, () => expect(polite(a)).toBe(b));
  it('leaves noun-ending phrases and questions alone', () => {
    expect(polite('厚さはわずか数ナノメートル。')).toBe('厚さはわずか数ナノメートル。');
    expect(polite('同じ職人が、なぜ違う場所で働くのか？')).toBe('同じ職人が、なぜ違う場所で働くのか？');
  });
});
