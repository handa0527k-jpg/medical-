/**
 * Plain style (だ・である) → spoken lecture style (です・ます) for the final
 * predicate of a sentence, using kuromoji's morphological analysis.
 *
 *   脂質二重層だ。          → 脂質二重層です。
 *   粒が多いのはP面である。  → 粒が多いのはP面です。
 *   見ていこう。            → 見ていきましょう。
 *   どの通用口にも入らない。 → どの通用口にも入りません。
 *   ノーベル賞を受けた。     → ノーベル賞を受けました。
 *   光学顕微鏡でも見える。   → 光学顕微鏡でも見えます。
 *
 * Only the sentence-final predicate changes; inner clauses stay as they are,
 * which is how lecturers actually speak. Inline markup (<b> etc.) is preserved.
 */
import type { IpadicFeatures, Tokenizer } from 'kuromoji';

type Tok = IpadicFeatures;

const GODAN: Record<string, string> = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' };

/** masu-stem (連用形) of a verb or verb-like auxiliary from its dictionary form */
export function masuStem(t: Tok): string | null {
  const b = t.basic_form, ct = t.conjugated_type || '';
  if (!b || b === '*') return null;
  if (ct.startsWith('一段')) {
    // kuromoji sometimes tags kanji+る godan verbs (割る) as 一段; true 一段 verbs have
    // an i/e-row kana before る, except this closed set of one-kanji verbs.
    const pre = b.slice(-2, -1);
    if (/[\u4e00-\u9fff]/.test(pre) && b.length === 2 && !/[見居着似煮干寝得出経]/.test(pre)) return b.slice(0, -1) + 'り';
    return b.slice(0, -1);
  }
  if (ct.startsWith('サ変')) return b.replace(/[すず]る$/, (m) => (m === 'する' ? 'し' : 'じ'));
  if (ct.startsWith('カ変')) return b.replace(/(来|く)る$/, (_m, a) => (a === '来' ? '来' : 'き'));
  if (ct === '五段・ラ行特殊') return b.slice(0, -1) + 'い';
  if (ct.startsWith('五段')) {
    const last = b.slice(-1);
    return GODAN[last] ? b.slice(0, -1) + GODAN[last] : null;
  }
  // auxiliaries conjugating like 一段 (れる・られる・せる・させる)
  if (t.pos === '助動詞' && /^(れる|られる|せる|させる)$/.test(b)) return b.slice(0, -1);
  return null;
}

/** Returns [number of trailing tokens to replace, replacement] or null to keep. */
function politeTail(toks: Tok[]): [number, string] | null {
  const n = toks.length;
  if (!n) return null;
  const last = toks[n - 1], prev = toks[n - 2], prev2 = toks[n - 3];
  const is = (t: Tok | undefined, pos: string, basic?: string) => !!t && t.pos === pos && (basic === undefined || t.basic_form === basic);

  // …という → …といいます
  if (last.pos === '助詞' && last.surface_form === 'という') return [1, 'といいます'];
  // rhetorical …のか → …のでしょうか
  if (last.pos === '助詞' && last.surface_form === 'か' && prev && prev.surface_form === 'の') return [2, 'のでしょうか'];
  // …だから / …のだから (sentence-final reason)
  if (last.pos === '助詞' && last.surface_form === 'から' && is(prev, '助動詞', 'だ')) return [2, 'ですから'];
  // …だ / …のだ / …なのだ
  if (is(last, '助動詞', 'だ') && last.conjugated_form === '基本形') return [1, 'です'];
  // …である
  if (is(last, '助動詞', 'ある') && is(prev, '助動詞', 'だ')) return [2, 'です'];
  // …だろう / …でしょう-able
  if (is(last, '助動詞', 'う') && is(prev, '助動詞', 'だ')) return [2, 'でしょう'];
  // volitional: 見ていこう / 想像しよう → 〜ましょう
  if (is(last, '助動詞', 'う') && prev && (prev.pos === '動詞' || is(prev, '助動詞'))) {
    const st = masuStem(prev);
    if (st) return [2, st + 'ましょう'];
  }
  // negative verb: 入らない → 入りません
  if (is(last, '助動詞', 'ない') && prev && (prev.pos === '動詞' || is(prev, '助動詞'))) {
    const st = masuStem(prev);
    if (st) return [2, st + 'ません'];
  }
  // ではない / 膜はない (adjective ない) → ありません
  if (is(last, '形容詞', 'ない')) return [1, 'ありません'];
  // past
  if (is(last, '助動詞', 'た')) {
    if (is(prev, '助動詞', 'だ')) return [2, 'でした'];
    if (prev && prev.pos === '形容詞') return [0, 'です'];
    if (is(prev, '助動詞', 'ない') && prev2 && prev2.pos === '動詞') { const st = masuStem(prev2); if (st) return [3, st + 'ませんでした']; }
    if (prev && (prev.pos === '動詞' || is(prev, '助動詞'))) { const st = masuStem(prev); if (st) return [2, st + 'ました']; }
  }
  // 〜てほしい → 〜てください
  if (is(last, '形容詞', 'ほしい') && prev && prev.surface_form === 'て') return [1, 'ください'];
  // plain verb or verb-like auxiliary in dictionary form
  if ((last.pos === '動詞' || is(last, '助動詞')) && last.conjugated_form === '基本形') {
    const st = masuStem(last);
    if (st) return [1, st + 'ます'];
  }
  // adjective / たい
  if ((last.pos === '形容詞' || is(last, '助動詞', 'たい')) && last.conjugated_form === '基本形') return [0, 'です'];
  return null;
}

const TRAIL = /[。！？」』）)”]+$/;

/** Replace `oldTail` at the end of `html` (ignoring tags) with `newTail`. */
export function replaceTail(html: string, oldTail: string, newTail: string): string | null {
  let i = html.length, j = oldTail.length;
  while (j > 0 && i > 0) {
    if (html[i - 1] === '>') { const k = html.lastIndexOf('<', i - 1); if (k < 0) return null; i = k; continue; }
    if (html[i - 1] !== oldTail[j - 1]) return null;
    i--; j--;
  }
  if (j > 0) return null;
  // keep any markup that sat inside/after the replaced words (e.g. a closing </b>)
  const tags = (html.slice(i).match(/<[^>]+>/g) || []).join('');
  return html.slice(0, i) + newTail + tags;
}

export function makePolite(tokenizer: Tokenizer<Tok>) {
  return function polite(html: string): string {
    const m = TRAIL.exec(html.replace(/(<\/[a-z]+>)+$/i, ''));
    if (!m || !/^[。！]/.test(m[0])) return html; // only declarative sentences
    // body = html without the trailing punctuation (tags before it are kept)
    const cut = html.lastIndexOf(m[0][0]);
    const body = html.slice(0, cut), end = html.slice(cut);
    const text = body.replace(/<[^>]+>/g, '');
    const toks = tokenizer.tokenize(text).filter((t) => t.pos !== '記号' || !/^[」』）)”]$/.test(t.surface_form));
    const r = politeTail(toks);
    if (!r) return html;
    const [k, rep] = r;
    const oldTail = toks.slice(toks.length - k).map((t) => t.surface_form).join('');
    if (!k) return body + rep + end;
    const nb = replaceTail(body, oldTail, rep);
    return nb === null ? html : nb + end;
  };
}
