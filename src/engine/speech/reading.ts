/**
 * Converts on-screen text into what a Japanese TTS voice should say:
 * strips markup, spells out symbols/abbreviations, gives kana readings for
 * medical terms that synthesizers commonly misread, and turns brackets and
 * arrows into natural pauses. Subtitles keep the original text.
 */
export const plain = (h: string) => String(h).replace(/<[^>]+>/g, '');

type Rule = [RegExp, string | ((...m: string[]) => string)];

const LETTER = 'エー ビー シー ディー イー エフ ジー エイチ アイ ジェー ケー エル エム エヌ オー ピー キュー アール エス ティー ユー ブイ ダブリュー エックス ワイ ゼット'.split(' ');

/** symbols, units and abbreviations — order matters */
const RULES: Rule[] = [
  [/マンノース-6-リン酸[（(]M-6-P[）)]/g, 'マンノース6リン酸'],
  [/\s*\b(Endocytosis|Organelles|Endomembrane System|Ribosome|Endoplasmic reticulum|apparatus|Lysosome|Mitochondria|Peroxysome|microtubules|Axonema of cilia|Globular|Filament|caveola|freeze fracture|integral membrane proteins|peripheral membrane proteins|inner leaflet|outer leaflet|coated pit|depression left by P-face protein)\b/gi, ''],
  // genetics
  [/miRNA/g, 'マイクロアールエヌエー'], [/lncRNA|lincRNA|lncNA/g, 'ロングノンコーディングアールエヌエー'], [/snoRNA/g, 'スノーアールエヌエー'], [/ncRNA/g, 'ノンコーディングアールエヌエー'],
  [/dNTP/g, 'ディーエヌティーピー'], [/NTP/g, 'エヌティーピー'], [/NMP/g, 'エヌエムピー'], [/NDP/g, 'エヌディーピー'], [/cAMP/g, 'サイクリックエーエムピー'],
  [/ALDH2?/g, (m: string) => 'エーエルディーエイチ' + (m.endsWith('2') ? 'ツー' : '')], [/ADH([123])?/g, (_m: string, d?: string) => 'エーディーエイチ' + (d ? ['', 'ワン', 'ツー', 'スリー'][Number(d)] : '')],
  [/HDAC/g, 'エイチダック'], [/\bHAT\b/g, 'ハット'], [/PGC-1α/g, 'ピージーシーワンアルファ'], [/PGC-1/g, 'ピージーシーワン'], [/\bUTR\b/g, 'ユーティーアール'], [/non-LTR/g, 'ノンエルティーアール'], [/\bOH\b/g, 'オーエイチ'], [/(?<![A-Za-z])XY(?![A-Za-z])/g, 'エックスワイ'], [/(?<![A-Za-z])XX(?![A-Za-z])/g, 'エックスエックス'],
  [/(?<=[ぁ-んァ-ヶ一-龥0-9])p(?![A-Za-z])/g, 'ピー'], [/(?<=[ぁ-んァ-ヶ一-龥0-9])q(?![A-Za-z])/g, 'キュー'], [/TFAM/g, 'ティーファム'], [/PPAR-δ/g, 'ピーパーデルタ'],
  [/LINE-1/g, 'ラインワン'], [/\bAlu\b/g, 'アルー'], [/\bSVA\b/g, 'エスブイエー'], [/HERV/g, 'ハーブ'], [/\bLTR\b/g, 'エルティーアール'],
  [/TCOF1/g, 'ティーコフワン'], [/Lamin A\/C/g, 'ラミンエーシー'], [/\bSNP\b/g, 'スニップ'], [/\bHP1\b/g, 'エイチピーワン'], [/CpG/g, 'シーピージー'],
  [/H2A/g, 'エイチツーエー'], [/H2B/g, 'エイチツービー'], [/\bH([1-4])\b/g, (_m: string, d: string) => 'エイチ' + ['', 'ワン', 'ツー', 'スリー', 'フォー'][Number(d)]],
  [/(\d+),XY/g, '$1エックスワイ'], [/(\d+),XX/g, '$1エックスエックス'], [/XXY/g, 'エックスエックスワイ'], [/5p-/g, 'ごピーマイナス'], [/5q-/g, 'ごキューマイナス'],
  [/(\d)'/g, '$1ダッシュ'],
  [/tRNA/g, 'ティーアールエヌエー'],
  [/mRNA/g, 'メッセンジャーアールエヌエー'],
  [/rRNA/g, 'リボソームアールエヌエー'],
  [/3D/g, 'スリーディー'],
  [/([GF])-(?=アクチン)/g, (_m, a) => (a === 'G' ? 'ジー' : 'エフ')],
  [/シトクロムc/g, 'シトクロムシー'],
  [/COP-II/g, 'コップツー'], [/COP-I/g, 'コップワン'],
  [/\bTEM\b/g, '透過電顕'], [/\bTCA\b/g, 'ティーシーエー'],
  [/(\d)\s*kD/g, '$1キロダルトン'],
  [/Porter/g, 'ポーター'], [/Camillo Golgi|Golgi/g, 'ゴルジ'], [/Palade/g, 'パラーデ'], [/De Duve/g, 'ド・デューブ'],
  [/Zellweger/g, 'ツェルウェーガー'], [/Kartagener/g, 'カルタゲナー'],
  [/H₂O₂/g, '過酸化水素'], [/H⁺/g, '水素イオン'], [/Ca²⁺/g, 'カルシウムイオン'], [/Mg²⁺/g, 'マグネシウムイオン'], [/K⁺/g, 'カリウムイオン'],
  [/Ca(?![a-z²])/g, 'カルシウム'],
[/³H-?ウリジン|3H-?Uridine|³H-?Uridine/g, 'トリチウム標識ウリジン'], [/³H-?チミジン|3H-?チミジン/g, 'トリチウム標識チミジン'],
  [/HE染色/g, 'エイチイー染色'], [/MP染色/g, 'エムピー染色'], [/\bMG\b/g, 'エムジー'], [/\bPY\b/g, 'ピーワイ'],
  [/³H-leucine|3H-leucine/g, 'トリチウム標識ロイシン'], [/³H/g, 'トリチウム'], [/3H(?=-?ロイシン)/g, 'トリチウム標識'], [/Ⅰ型/g, 'いちがた'], [/Ⅱ型/g, 'にがた'], [/leucine/gi, 'ロイシン'],
  [/M-6-P/g, 'マンノース6リン酸'],
  [/H1ヒストン/g, 'エイチワンヒストン'], [/BrdU/g, 'ビーアールディーユー'], [/EdU|EDU/g, 'イーディーユー'],
  [/ポリメラーゼ\s*Ⅰ/g, 'ポリメラーゼワン'], [/Ⅰ(?!型)/g, 'ワン'], [/Ⅱ(?!型)/g, 'ツー'], [/G[₀0]期/g, 'ジーゼロ期'], [/Tjio\s*(?:&|と)\s*Levan/g, 'チオとレヴァン'], [/Tjio/g, 'チオ'], [/Levan/g, 'レヴァン'],
  [/Leblond/g, 'ルブロン'], [/Barr/g, 'バー'],
  [/rER/g, '粗面小胞体'], [/sER/g, '滑面小胞体'], [/\bER\b/g, '小胞体'],
  [/TGN/g, 'ティージーエヌ'], [/MTOC/g, 'エムトック'], [/MAPs?/g, 'マップ'],
  [/ATPase/g, 'エーティーピーアーゼ'], [/ATP/g, 'エーティーピー'], [/DNA/g, 'ディーエヌエー'], [/RNA/g, 'アールエヌエー'],
  [/NANA/g, 'ナナ'], [/LDL/g, 'エルディーエル'], [/pH\s*/g, 'ペーハー'],
  [/(\d)\s*nm/g, '$1ナノメートル'],
  [/(\d)\s*μm/g, '$1マイクロメートル'], [/μm/g, 'マイクロメートル'],
  [/\s*×\s*g\b/g, 'ジー'], [/(\d万?)\s*g(?![a-zA-Z])/g, '$1ジー'],
  [/100,000/g, '10万'], [/10,000/g, '1万'], [/1,000/g, '千'],
  [/9＋2/g, 'きゅう たす に'], [/9×3/g, 'きゅう かける さん'], [/×9/g, 'かける9'], [/×2/g, 'かける2'],
  [/(^|[^\d])[〜~](\d)/g, '$1約$2'],
  [/(\d)\s*[〜~]\s*(\d)/g, '$1から$2'],
  [/α/g, 'アルファ'], [/β/g, 'ベータ'], [/γ/g, 'ガンマ'],
  [/E面/g, 'イー面'], [/P面/g, 'ピー面'], [/A環/g, 'エー環'], [/B環/g, 'ビー環'],
  [/Protoplasmic/g, 'プロトプラズミック'], [/Extracellular/g, 'エクストラセルラー'],
  [/<\s*(\d+(?:\.\d+)?)/g, '$1未満'], [/＜\s*(\d+(?:\.\d+)?)/g, '$1未満'], [/[＜<]/g, '未満'],
  [/([^、。\s]+)\s*≠\s*([^、。\s]+)/g, '$1と$2は別物'],
  [/ミト・リソ/g, 'ミトコンドリアとリソソーム'],
  [/＋端/g, 'プラス端'], [/[−-]端/g, 'マイナス端'],
  [/\bOK\b/g, 'オーケー'], [/\bNG\b/g, 'エヌジー'], [/BEFORE/g, 'ビフォー'], [/AFTER/g, 'アフター'],
  [/STEP\s*/g, 'ステップ'],
  // codons / base sequences (AUG, GCU, AT…) are spelled out letter by letter
  [/(?<![A-Za-z])[AUGCT]{2,4}(?![A-Za-z])/g, (m: string) => [...m].map((c) => ({ A: 'エー', U: 'ユー', G: 'ジー', C: 'シー', T: 'ティー' })[c as 'A']).join('')],
];

/** Kana readings for terms Japanese TTS engines frequently misread. */
export const READINGS: [RegExp, string][] = [
  // 的 after kanji is read まと by the voice when it ends a phrase (特異的 → とくいまと)
  [/目的/g, 'もくてき'], [/標的/g, 'ひょうてき'], [/(?<=[一-龥])的/g, 'てき'],
  [/槽内/g, 'そうない'],
  [/膜間腔/g, 'まくかんくう'], [/内腔/g, 'ないくう'], [/被覆陥凹/g, 'ひふくかんおう'], [/陥凹/g, 'かんおう'],
  [/上清/g, 'じょうせい'], [/出芽/g, 'しゅつが'], [/鍍銀/g, 'とぎん'], [/微絨毛/g, 'びじゅうもう'], [/線毛/g, 'せんもう'],
  [/嚢/g, 'のう'], [/側の葉/g, '側のよう'], [/中心子/g, 'ちゅうしんし'], [/脂肪滴/g, 'しぼうてき'], [/自食/g, 'じしょく'],
  [/残余小体/g, 'ざんよしょうたい'], [/細網線維/g, 'さいもうせんい'], [/画分/g, 'かくぶん'], [/軸糸/g, 'じくし'],
  [/(?<![水浴])槽/g, 'そう'], [/終末扇/g, 'しゅうまつせん'], [/動原体/g, 'どうげんたい'], [/天疱瘡/g, 'てんぽうそう'],
  [/類天疱瘡/g, 'るいてんぽうそう'], [/糸状仮足/g, 'しじょうかそく'], [/仮足/g, 'かそく'], [/星状体/g, 'せいじょうたい'],
  // genetics
  [/対合/g, 'ついごう'], [/鋳型/g, 'いがた'], [/猫鳴き/g, 'ねこなき'], [/一塩基多型/g, 'いちえんきたけい'],
  [/五炭糖/g, 'ごたんとう'], [/六炭糖/g, 'ろくたんとう'], [/八量体/g, 'はちりょうたい'], [/異数体/g, 'いすうたい'], [/姉妹染色分体/g, 'しまいせんしょくぶんたい'],
  [/(?<=[のに])斑/g, 'まだら'], [/遺伝型/g, 'いでんがた'], [/表現型/g, 'ひょうげんがた'], [/核型/g, 'かくがた'],
  // 核・細胞周期
  [/核周囲腔/g, 'かくしゅういくう'], [/異染色質/g, 'いせんしょくしつ'], [/正染色質/g, 'せいせんしょくしつ'], [/染色分体/g, 'せんしょくぶんたい'],
  [/紡錘糸/g, 'ぼうすいし'], [/陰窩/g, 'いんか'], [/絨毛/g, 'じゅうもう'], [/長腕/g, 'ちょうわん'], [/短腕/g, 'たんわん'],
  [/顆粒部/g, 'かりゅうぶ'], [/線維部/g, 'せんいぶ'], [/終細胞/g, 'しゅうさいぼう'], [/前駆細胞/g, 'ぜんくさいぼう'],
  [/膜貫通/g, 'まくかんつう'], [/蛋白/g, 'たんぱく'],
  [/赤道板/g, 'せきどうばん'], [/低張/g, 'ていちょう'], [/核膜孔/g, 'かくまくこう'],
  [/染色質/g, 'せんしょくしつ'],
];

export function toSpeech(html: string): string {
  let t = plain(html);
  for (const [re, rep] of RULES) t = t.replace(re, rep as string);
  for (const [re, rep] of READINGS) t = t.replace(re, rep);
  return t
    .replace(/³H/g, 'スリーエイチ').replace(/×g/g, 'ジー').replace(/＆/g, 'と').replace(/…+/g, '')
    .replace(/\s*[＋+]\s*/g, '、プラス')
    .replace(/(?<![A-Za-z])[A-Z](?![A-Za-z])/g, (m) => LETTER[m.charCodeAt(0) - 65])
    .replace(/[“”「」【】『』]/g, '')
    // a paraphrase in brackets followed by a particle reads as "X、Y は…"; otherwise it becomes an aside "、Y、"
    .replace(/[（(]([^（）()]{1,40})[）)](?=[ぁ-ゖ])(?!です)/g, '、$1')
    .replace(/[（(]([^（）()]*)[）)]/g, '、$1、')
    .replace(/[（）()]/g, '、')
    .replace(/\s*[→⇒]\s*/g, '、').replace(/\s*⇄\s*/g, 'と').replace(/\s*[＝／｜：:]\s*/g, '、')
    .replace(/―+|—+/g, '、')
    .replace(/\s*、\s*/g, '、')
    .replace(/(?<=[^\x00-\x7F])\s+(?=[ぁ-ゖ])/g, '')
    .replace(/(?<=[^\x00-\x7F])\s+|\s+(?=[^\x00-\x7F])/g, '、')
    .replace(/・?、・?/g, '、')
    .replace(/、{2,}/g, '、')
    .replace(/^、|、(?=[。！？]|$)/g, '')
    .replace(/([。！？])、/g, '$1')
    .trim();
}

/** Split rich text into sentences (keeps inline markup). */
export const sentences = (h: string) => String(h).split(/(?<=[。！？](?![」』）)”]))|(?<=[。！？][」』）)”]+)/).map((x) => x.trim()).filter(Boolean);

/** Estimated speaking time (s) at 1× for a Japanese reading (~7.4 mora/s lecture pace). */
export const estimateDuration = (speech: string) => Math.max(1.6, speech.length / 7.4 + 0.35);
