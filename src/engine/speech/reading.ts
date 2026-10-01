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
];

/** Kana readings for terms Japanese TTS engines frequently misread. */
export const READINGS: [RegExp, string][] = [
  [/膜間腔/g, 'まくかんくう'], [/内腔/g, 'ないくう'], [/被覆陥凹/g, 'ひふくかんおう'], [/陥凹/g, 'かんおう'],
  [/上清/g, 'じょうせい'], [/出芽/g, 'しゅつが'], [/鍍銀/g, 'とぎん'], [/微絨毛/g, 'びじゅうもう'], [/線毛/g, 'せんもう'],
  [/嚢/g, 'のう'], [/側の葉/g, '側のよう'], [/中心子/g, 'ちゅうしんし'], [/脂肪滴/g, 'しぼうてき'], [/自食/g, 'じしょく'],
  [/残余小体/g, 'ざんよしょうたい'], [/細網線維/g, 'さいもうせんい'], [/画分/g, 'かくぶん'], [/軸糸/g, 'じくし'],
  [/(?<![水浴])槽/g, 'そう'], [/終末扇/g, 'しゅうまつせん'], [/動原体/g, 'どうげんたい'], [/天疱瘡/g, 'てんぽうそう'],
  [/類天疱瘡/g, 'るいてんぽうそう'], [/糸状仮足/g, 'しじょうかそく'], [/仮足/g, 'かそく'], [/星状体/g, 'せいじょうたい'],
  [/核周囲腔/g, 'かくしゅういくう'], [/異染色質/g, 'いせんしょくしつ'], [/正染色質/g, 'せいせんしょくしつ'], [/染色分体/g, 'せんしょくぶんたい'],
  [/紡錘糸/g, 'ぼうすいし'], [/陰窩/g, 'いんか'], [/絨毛/g, 'じゅうもう'], [/長腕/g, 'ちょうわん'], [/短腕/g, 'たんわん'],
  [/顆粒部/g, 'かりゅうぶ'], [/線維部/g, 'せんいぶ'], [/終細胞/g, 'しゅうさいぼう'], [/前駆細胞/g, 'ぜんくさいぼう'],
  [/赤道板/g, 'せきどうばん'], [/低張/g, 'ていちょう'], [/相同染色体/g, 'そうどうせんしょくたい'], [/核膜孔/g, 'かくまくこう'],
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
