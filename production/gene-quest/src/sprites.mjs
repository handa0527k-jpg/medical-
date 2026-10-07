// GENE QUEST — the cast and props, drawn as pixel art (one character = one pixel).
// Letters are colours from C in engine.mjs ('.' = transparent). `true` mirrors a half sprite.
import { defSprite } from './engine.mjs';

// ── 勇者ルミナ (hero): teal ponytail, brass goggles, white field-coat over a blue tunic, red scarf
const heroTop = [
  '....kkkkkkkk....',
  '...khhhhhhhhk...',
  '..khyyhhhhyyhk..',
  '..kyCcyhhyCcyk..',
  '.khhyyhhhhyyhhk.',
  '.khhhHhhhhhhhhkk',
  '.khhhhhhhhhhhhkh',
  '.khhsshhhhsshhkh',
  '.khsssssssssshkh',
  '.khskwssssskwshk',
  '.khskkssssskkshk',
  '..ksqsssssssqsk.',
  '..kSssssmmsssSk.',
  '...kkssssssskk..',
  '..krrrkkkkkrrrk.',
  '.kwrrrrrrrrrrrwk',
  '.kwwrRrrrrrRrwwk',
  'kswwwwbbyybbwwwsk'.slice(0, 16),
  'kswwwbbyyybbwwsk',
  '.kwwwbbbbbbbwwk.',
  '.kwwwbbbbbbbwwk.',
];
defSprite('hero', [...heroTop, '..kkkBBkkkBBkk..', '...kNNk..kNNk...', '...kkkk..kkkk...']);
defSprite('hero2', [...heroTop, '..kkkBBkkBBkkk..', '..kNNk....kNNk..', '..kkkk....kkkk..']);
defSprite('heroV', [ // victory: arms up
  'ks..kkkkkkkk..sk',
  'ks.khhhhhhhhk.sk',
  'kskhyyhhhhyyhksk',
  'kskyCcyhhyCcyksk',
  '.kkhhyyhhhhyyhkk',
  '.kwhhhHhhhhhhhwk',
  '.kwhhhhhhhhhhhwk',
  '.kwhsshhhhsshhkh',
  '.kwsssssssssshkh',
  '.khsksssssskshkh',
  '.khskksssskkshk.',
  '..ksqssssssqsk..',
  '..kSssskksssSk..',
  '...kkssmmsskk...',
  '..krrrkkkkkrrrk.',
  '.kwrrrrrrrrrrrwk',
  '.kwwrRrrrrrRrwwk',
  '.kwwwwbbyybbwwwk',
  '.kwwwbbyyybbwwk.',
  '.kwwwbbbbbbbwwk.',
  '.kwwwbbbbbbbwwk.',
  '..kkkBBkkkBBkk..',
  '...kNNk..kNNk...',
  '...kkkk..kkkk...',
]);
const heroSide = [
  '.....kkkkkkk....',
  '....khhhhhhhk...',
  '...khhhhhyyhhk..',
  '..khhhhhyCcyhk..',
  '..khhhhhhyyhhk..',
  '.khhhhhhhhhhhk..',
  'khhkhhhhhhhhhk..',
  'khhkhhhhhsshsk..',
  'khk.khhhsssssk..',
  '.k..khhssskwsk..',
  '....khsssskksk..',
  '.....ksqsssssk..',
  '.....kSssssmk...',
  '......kksssk....',
  '.....krrrrrrk...',
  '....kwwrrrrwk...',
  '....kwwwrRwwk...',
  '....kwwwbbwsk...',
  '....kwwbbybsk...',
  '....kwwbbbbwk...',
  '....kwwbbbbwk...',
];
defSprite('heroR', [...heroSide, '.....kBBkBBk....', '....kNNk.kNNk...', '....kkkk.kkkk...']);
defSprite('heroR2', [...heroSide, '.....kBBBBk.....', '.....kNNNNk.....', '.....kkkkkk.....']);

// ── 賢者オウルベルト (master): a white owl in a violet hat, with a monocle (drawn in code)
defSprite('owl', [
  '.........k',
  '........kp',
  '.......kpp',
  '......kppp',
  '.....kpppp',
  '....kpppPy',
  '..kkkkkkkk',
  '.kPPPPPPPP',
  '..kwwwwwww',
  '.kwwlwwwww',
  'kwwkkkkwww',
  'kwkyyyykww',
  'kwkyzkkykw',
  'kwkykkkykw',
  'kwwkyyykww',
  'kwwwkkkwwo',
  '.kwlwwwwoo',
  'kpkwlwlwwo',
  'kppkwwlwww',
  'kpppkwlwlw',
  'kppppkwwww',
  'kpppppkwww',
  '.kppppkllw',
  '..kkoo.koo',
  '...kkk..kk',
], {}, true);

// ── 刃匠クラブロ (restriction enzyme smith): a red crab with scissor claws and a leather apron
defSprite('crab', [
  '.kkk........',
  'krrrk.......',
  'krwrrk......',
  '.kkrrk......',
  'kwwkrrk.....',
  'krrkrrk.....',
  '.krrrrk...kk',
  '..kkrrk..kwk',
  '....krk.kkkk',
  '....krrkkrrr',
  '.....krrrrrr',
  '....krrrrrrr',
  '...krrrnnnnn',
  '...krrnnNnnn',
  '..krk.knnnnn',
  '.krk.krrkrrr',
  'krk.krk.krrk',
  'kk..kk...kk.',
], {}, true);

// ── 縫い蜘蛛ツムギ (DNA ligase): a green spider with a silver needle
defSprite('spider', [
  '.k.........',
  '..k........',
  '...k...kkkk',
  'k...k.kgggg',
  '.k...kgggvv',
  '..kkkgggvgg',
  '.....kgggwk',
  'kkkk.kgggkk',
  '....kkggggg',
  '...k.kggggg',
  '..k.kkGGggg',
  '.k.k.kkGGgg',
  'k.k..k.kkkk',
  '..k..k.....',
], {}, true);

// ── 吟遊狐ヴェルス (reverse transcriptase): a fox bard with a lyre
defSprite('fox', [
  '.k.......k.....',
  'kok.....kok....',
  'koOk...kOok....',
  'kooOkkkOook....',
  'kooooooooook...',
  'kowkooooowk.k..',
  'kowkkoookwk.k..',
  '.kwwooowwwk.k..',
  '..kwwkkwwk..k..',
  '...kkwwkk..kyk.',
  '...kgggggk.kyk.',
  '..kgggGgggkyyk.',
  '..kgwgGgggyk...',
  '..kgggGgwgkk...',
  '...kgggggk...kk',
  '...kooooook.koo',
  '...koooooookoow',
  '....kok.kokkwwk',
  '....kkk.kkk.kk.',
]);

// ── 商人キャラバ (vector market): a camel merchant in a turban
defSprite('camel', [
  '....kkkk.......',
  '...kyyyyk......',
  '..kyyyyyyk.....',
  '..kyrRyyyk.....',
  '..kkkkkkkk.....',
  '..knnnnnnk.....',
  '.kntknnnnk.....',
  '.knnknnntk.....',
  'knnnnnnnttk....',
  'kNnnnnnnnnk....',
  '.kkknnnnnk.....',
  '...knnnnnkkkkk.',
  '...knnnnnnnnnnk',
  '..kbbbbbbbbbnnk',
  '..kbyybbbyybnnk',
  '..kbbbbbbbbbnnk',
  '...knnnnnnnnnk.',
  '...knk.knk.knk.',
  '...knk.knk.knk.',
  '...kkk.kkk.kkk.',
]);

// ── ゴーレム工場長ギアボルト (expression factory): an iron golem foreman
defSprite('golem', [
  '....kkkkk',
  '...keeeee',
  '..keEEeee',
  '..keykEey',
  '..keEEeee',
  '..keeeeee',
  '...kkoooo',
  '.kkeeeeee',
  'keeeleeee',
  'keeeleeoo',
  'keeeleeoo',
  'keekkeeee',
  'kekeeeeee',
  'keekeeeee',
  'kkk.keeee',
  '....keeek',
  '....keeek',
  '...kkkkkk',
], {}, true);

// ── クラゲの精ルーチェ (GFP): a glowing jellyfish spirit
defSprite('jelly', [
  '.....kkkk',
  '...kkCCCC',
  '..kCCCccc',
  '.kCCccccc',
  '.kCcccccc',
  'kCcckkccc',
  'kCcckzccc',
  'kccccccvv',
  'kccccccvg',
  '.kkkkkkkk',
  '..c.v.c.v',
  '..c.v.c.v',
  '...c.v.c.',
  '...c.v.c.',
  '..c.v.c.v',
  '..c...c..',
], {}, true);

// ── 鴎船長ゲイル (viral vectors harbour): a seagull captain
defSprite('gull', [
  '...kkkkk...',
  '..kBBBBBk..',
  '.kBBBByBBk.',
  'kkkkkkkkkkk',
  '.kwwwwwwwk.',
  '.kwkwwwkwk.',
  '.kwwwyyywk.',
  '..kwwoyowk.',
  '.lkwwwwwkl.',
  'klwwBBBwwlk',
  'klwBwwwBwlk',
  '.kwBBBBBwk.',
  '..kwwwwwk..',
  '...kokok...',
  '..kkk.kkk..',
]);

// ── 本の虫シオリ (library): a bookworm librarian with round glasses
defSprite('worm', [
  '........kkkk...',
  '.......kmmmmk..',
  '......kmmmmmmk.',
  '......kkwkkwkk.',
  '......kkwkkwkk.',
  '......kmmmmmmk.',
  '.......kmmrmk..',
  '..kkk...kmmk...',
  '.kmmmk.kmmmk...',
  'kmmmmmkmmmmk...',
  'kmMmmmmmMmk....',
  '.kkmMmmmMkk....',
  '...kkkkkk......',
]);

// ── 熱竜サーモ (PCR): a small fire dragon
defSprite('dragon', [
  '.......kk......',
  '......krrk.....',
  '..kk.krrrrk....',
  '.kook.krrrrk...',
  '.koook.kkrrrk..',
  '..kook.krwkrk..',
  '...kk.krrkkrrk.',
  '.....krrrrrrrrk',
  '....krryyyrrkk.',
  '...krryyyyrrk..',
  '..krrryyyyrrk..',
  '.krrkryyyrrrk..',
  'krk.krrrrrrk...',
  'kk..krk.krk....',
  '....kk...kk....',
]);

// ── 探偵ダヌキのバンド (VNTR forensics): a tanuki detective in a deerstalker
defSprite('tanuki', [
  '...kkkkkkkk...',
  '..knNnNnNnNk..',
  '.kkkkkkkkkkkk.',
  '..knnnnnnnnk..',
  '.knEEnnnnEEnk.',
  '.knEwknnkwEnk.',
  '.knEEnttnEEnk.',
  '..kntkkkktnk..',
  '...knttttnk...',
  '..kyyyyyyyyk..',
  '.kyyyYyyYyyyk.',
  '.kykyyyyyykyk.',
  '.ktkyyyyyyktk.',
  '..kkyyYYyyk...',
  '...knnkknnk...',
  '...kkk..kkk...',
]);

// ── 電気ウナギのエレキ (electrophoresis): a blue eel with a spark
defSprite('eel', [
  '.....kkkk.............',
  '...kkccccKk...kkkk....',
  '..kccccccccKkkccccKk..',
  '.kcwkccccccccccccccck.',
  '.kckkccyccccccycccccck',
  'kcccccyyccccccyycccck.',
  '.kkccccccKkkkccccckk..',
  '...kkkkkk....kkkkk....',
], { K: '#2a6aa8' })

// ── 灯台守ホタルのルクス (qPCR / NGS): a firefly
defSprite('fly', [
  '.k...k.',
  '..k.k..',
  '.kkkkk.',
  'kwkkkwk',
  'kLkkkLk',
  '.kkkkk.',
  '.kzzzk.',
  '.kzzzk.',
  '..kkk..',
]);
defSprite('flyBig', [
  '...k.....k...',
  '....k...k....',
  '..kkkkkkkkk..',
  '.kLLkkkkkLLk.',
  'kLLLkwkwkLLLk',
  'kLLLkkkkkLLLk',
  '.kLkkkkkkkLk.',
  '..kyyyyyyyk..',
  '..kzzzzzzzk..',
  '..kzzzzzzzk..',
  '...kzzzzzk...',
  '....kkkkk....',
]);

// ── からくり読師リード (Sanger): a clockwork reader with a monocular eye
defSprite('robot', [
  '.....k.....',
  '.....y.....',
  '...kkkkk...',
  '..klllllk..',
  '.klkkkkklk.',
  '.klkrrrklk.',
  '.klkkkkklk.',
  '..klllllk..',
  '.kkkkkkkkk.',
  'klyllllllyk',
  'kllkkkkklk.',
  'klkbbbbbkl.',
  'klkbbybbkl.',
  'kk.kkkkk.kk',
  '...kl.lk...',
  '..kkk.kkk..',
]);

// ── 地図モグラのマッパ (RNA-seq / spatial): a mole with a map
defSprite('mole', [
  '...kkkkkk...',
  '..kNNNNNNk..',
  '.kNNNNNNNNk.',
  '.kNkkNNkkNk.',
  '.kNNNmmNNNk.',
  'kNNNmmmmNNNk',
  'kNNNNNNNNNNk',
  'kmmkNNNNkmmk',
  '.kkkNNNNkkk.',
  '..kNNNNNNk..',
  '..kNNNNNNk..',
  '...kkkkkk...',
]);

// ── 妖精ナビ (guide RNA): a tiny fairy with a ribbon of RNA
defSprite('fairy', [
  '.cc.....cc.',
  'cCCc...cCCc',
  'cCCCc.cCCCc',
  '.cCCkkkCCc.',
  '..ckssskc..',
  '...kskskk..',
  '...ksssk...',
  '....kok....',
  '...koook...',
  '....kok....',
  '....k.k....',
]);

// ── オフターゲットの影 (enemy): a lookalike ghost of the target
defSprite('ghost', [
  '....kkkkk....',
  '..kkPPPPPkk..',
  '.kPPPPPPPPPk.',
  '.kPPkkPPkkPk.',
  'kPPPkrPPkrPPk',
  'kPPPPPPPPPPPk',
  'kPPPPkkkkPPPk',
  'kPPPPPPPPPPPk',
  'kPPPPPPPPPPPk',
  'kPkPPPkPPPkPk',
  'kk.kPk.kPk.kk',
  '....k...k....',
]);

// ── NHEJ: アライグマのラッシュ (hasty, with tape)  /  HDR: カメのトータス博士 (careful, with a blueprint)
defSprite('raccoon', [
  '.kk.....kk.',
  'kllk...kllk',
  'kllkkkkkllk',
  'kllllllllk.',
  'kEEEllEEElk',
  'kEwkllkwElk',
  'klEEnnEEllk',
  '.kllkkkllk.',
  '..kkllllk..',
  '.kllllllllk',
  'kllkEEEkllk',
  'kk.kEEEk.kk',
  '...klklk...',
  '..kkk.kkk..',
]);
defSprite('turtle', [
  '.....kkkkk......',
  '...kkGgGgGkk....',
  '..kGgGgGgGgGk...',
  '.kgGgGgGgGgGgk..',
  'kGgGgGgGgGgGgGkk',
  'kkkkkkkkkkkkkkvvk',
  '..kvvk....kvwkvk',
  '..kvvk....kvvkvk',
  '..kkkk....kkkkk.',
].map(r => r.slice(0, 16)));

// ── mice (finale): a GFP mouse and a knock-out mouse
defSprite('mouse', [
  '.kk...kk....',
  'kmmk.kmmk...',
  'kmlkkklmk...',
  '.klllllk....',
  'klkllklk....',
  'klllllllk...',
  '.kmlllllllk.',
  '..kllllllllk',
  '..kllllllllk',
  '...kkkkkkkkm',
  '.........mm.',
]);
defSprite('mouseG', [
  '.kk...kk....',
  'kvvk.kvvk...',
  'kvgkkkgvk...',
  '.kgggggk....',
  'kgkggkgk....',
  'kgggggggk...',
  '.kvgggggggk.',
  '..kggggvgggk',
  '..kggvgggggk',
  '...kkkkkkkkv',
  '.........vv.',
]);

// ── 病の影 (final boss): a shadow with a question mark — the unknown cause of a disease
defSprite('boss', [
  '.......kkkkkk.......',
  '.....kkAAAAAAkk.....',
  '....kAAAaaaaAAAk....',
  '...kAAaaaaaaaaAAk...',
  '..kAAaaaaaaaaaaAAk..',
  '..kAaarraaaaarraAk..',
  '.kAAarrraaaarrraAAk.',
  '.kAaaarraaaarraaaAk.',
  '.kAaaaaaaaaaaaaaaAk.',
  'kAAaaaakkkkkkaaaaAAk',
  'kAaaaakwkwkwkkaaaaAk',
  'kAaaaaakkkkkkaaaaaAk',
  'kAAaaaaaaaaaaaaaaAAk',
  '.kAAaaaaaaaaaaaaAAk.',
  '.kAAAaaaaaaaaaaAAAk.',
  '..kAAAaaaaaaaaAAAk..',
  '..kAkAAAaaaaAAAkAk..',
  '.kAk.kAAAAAAAAk.kAk.',
  '.kk...kkAkkAkk...kk.',
  '.......k..k.........',
]);

// ── props ───────────────────────────────────────────────────────────────
defSprite('chest', [
  '.kkkkkkkkkkkk.',
  'knnnnnnnnnnnnk',
  'knNNNNNNNNNNnk',
  'kyyyyyyyyyyyyk',
  'knnnnnykynnnnk',
  'knnnnnyyynnnnk',
  'knNNNNNNNNNNnk',
  'kkkkkkkkkkkkkk',
]);
defSprite('chestOpen', [
  '.kkkkkkkkkkkk.',
  'kNNNNNNNNNNNNk',
  'kkkkkkkkkkkkkk',
  'kzzzzzzzzzzzzk',
  'kyyyyyyyyyyyyk',
  'knnnnnyyynnnnk',
  'knNNNNNNNNNNnk',
  'kkkkkkkkkkkkkk',
]);
defSprite('tree', [
  '....kkkk....',
  '..kkggggkk..',
  '.kggvgggggk.',
  'kgvvgggGgggk',
  'kgggggGgggGk',
  'kGggGgggGggk',
  '.kGgggGgggk.',
  '..kkGGGGkk..',
  '....knnk....',
  '....knnk....',
  '...kkkkkk...',
]);
defSprite('house', [
  '......kkkk......',
  '....kkRRRRkk....',
  '..kkRRrrrrRRkk..',
  'kkRRrrrrrrrrRRkk',
  'kRRRRRRRRRRRRRRk',
  '.kttttttttttttk.',
  '.ktkkktttkkkttk.',
  '.ktkCktttkCkttk.',
  '.ktkkkkkkkkkttk.',
  '.kttttknnkttttk.',
  '.kttttknnkttttk.',
  '.kkkkkknnkkkkkk.',
]);
defSprite('castle', [
  'k.k.k......k.k.k',
  'kkkkk......kkkkk',
  'klllk.kkkk.klllk',
  'klllkkllllkklllk',
  'klklklllllklklk.',
  'klllkllkklklllk.',
  'klllklkCCklklllk',
  'klllklkCCklklllk',
  'kkkkkkkkkkkkkkkk',
].map(r => r.slice(0, 16)));
defSprite('tower', [
  '..kk..',
  '.kyyk.',
  'kllllk',
  'klkklk',
  'kllllk',
  'klkklk',
  'kllllk',
  'kkkkkk',
]);
defSprite('mtn', [
  '.....kk.....',
  '....kwwk....',
  '...kwlwek...',
  '..keleeeek..',
  '.keeeeEeeek.',
  'keeEeeeeEeek',
]);
defSprite('stone', [ // monument for a discovery
  '..kkkkkk..',
  '.kllllllk.',
  'klllllllek',
  'klkkkklllk',
  'klllllllek',
  'klkkkkllek',
  'klllllllek',
  'klkkkklllk',
  'klllllllek',
  'keeeeeeeek',
  'kkkkkkkkkk',
]);
defSprite('ship', [
  '.......k.......',
  '.......kw......',
  '.......kww.....',
  '.......kwww....',
  '.......kwwww...',
  '.......kwwwww..',
  '.......k.......',
  'kkkkkkkkkkkkkkk',
  'knnnnnnnnnnnnnk',
  '.knNnNnNnNnNnk.',
  '..kkkkkkkkkkk..',
]);
defSprite('flask', [
  '...kkkk...',
  '...kllk...',
  '...kllk...',
  '..kllllk..',
  '.kllllllk.',
  'kllccccllk',
  'kcccCcccck',
  'kcCccccCck',
  '.kkkkkkkk.',
]);
defSprite('bacterium', [
  '..kkkkkkkk..',
  '.keeeeeeeek.',
  'keLLLLLLLLek',
  'keLLLLLLLLek',
  'keLLLLLLLLek',
  '.keeeeeeeek.',
  '..kkkkkkkk..',
]);
