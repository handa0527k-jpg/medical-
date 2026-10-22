# GENE QUEST — 遺伝情報を読み解け！ 原稿（シーン単位）

<!--
書式
  ## <シーンID> <シーン名>          シーンの開始
  - key: value                       シーンの設定（visual, bgm, bg, camera, chars, sfx, pages, purpose, terms）
  <話者>[感情,強さ]: <字幕テキスト> {key=value ...}
     話者: narr akari nuku pol sigma tfiid splice mina
     感情: Neutral Happy Sad Angry Fear Surprise Disgust（Style-Bert-VITS2 JVNV モデルのスタイル名）
     {after=秒} セリフ後の間（既定 0.35）  {before=秒} セリフ前の間
     {say=読み} 音声合成用の読み（既定は発音辞書で自動変換）
     {note=補足} 画面に「補足（資料外）」を表示する
     {why=問い} 必然性の問い。画面左上に「なぜ ○○？」の札を出す（？で終わる行は次の行＝答えの終わりまで）
     {cue=名前} 映像の同期点の名前
  # で始まる行は章見出し。HTMLコメントは無視される
  - card_title / card_try / card_wrong / card_gap / card_fix  ファインマン・チェックの板書（visual: feynman_check）
このファイルが台本の一次情報。scripts/build_script.py で dialogue.json / scene_manifest.json を生成する。
版：v3（v2 に「必然性」の問いと、各章の「ファインマン・チェック」を加えた。v1 は約44分、v2 は約30分）
方針：仕組みを見たら「なぜ、そうでなければならないのか」を問う（答えは講義資料から。資料外の理由は {note=補足}）。
      章の終わりに、アカリが自分の言葉で説明し、ヌクが詰まりどころ（よくある誤解）を指摘し、アカリが言い直す。
-->

# CHAPTER 1 細胞の中の冒険

## SC0101 プロローグ：闇に浮かぶらせん
- visual: prologue_helix
- bgm: mystery
- bg: 深い紺と紫の空間。遠くに光の粒
- camera: 暗闇からDNA二重らせんへ前進し、らせんに沿って横移動
- chars: narr
- sfx: shimmer@0, whoosh@SC0101-03
- pages: 3
- purpose: 作品世界への導入。DNAが遺伝情報の設計図であることを示す
- terms: DNA, 二重らせん
narr[Neutral]: 私たちの体をつくる、一つ一つの細胞。 {before=2.5 after=0.6}
narr[Neutral]: その奥深くに、生命の設計図がしまわれています。 {after=0.6}
narr[Neutral]: DNA。二本の鎖がねじれ合った、二重らせんです。 {after=0.8 cue=helix}
narr[Neutral]: けれど設計図は、読み取られ、写しとられて、はじめて働きます。 {after=1.2}

## SC0102 タイトル
- visual: title_card
- bgm: mystery
- bg: らせんの光がタイトルロゴに集まる
- camera: 固定。ロゴがゆっくり近づく
- chars: なし
- sfx: impact@0
- pages: -
- purpose: タイトル提示
- terms: -
narr[Neutral]: ジーン・クエスト。遺伝情報を、読み解け。 {say=ジーンクエスト。いでんじょうほうを、よみとけ。 before=1.2 after=2.6}

## SC0103 アカリ、細胞の世界へ
- visual: akari_dive
- bgm: wonder
- bg: 夜の研究室（顕微鏡）→ 細胞 → 核 → 核の中へズームイン
- camera: 顕微鏡の視野へ吸い込まれ、細胞から核へズームイン
- chars: akari, nuku
- sfx: whoosh@SC0103-03, sparkle@SC0103-05
- pages: 3
- purpose: 主人公の登場と、遺伝情報の流れへの疑問
- terms: 細胞, 核
akari[Neutral]: 明日は転写の講義かあ。DNAとかRNAとか、似た名前ばっかり。 {before=0.6}
akari[Neutral]: 細胞の中って、本当はどうなってるんだろう。 {after=0.5}
akari[Surprise]: え、なに？ 顕微鏡の光に、吸い込まれる！ {after=0.8 cue=dive}
akari[Fear]: うわあああっ！ {after=1.2}
nuku[Happy]: ようこそ、細胞の中へ。ここは核の中だよ。 {cue=nuku_in}
akari[Surprise]: しゃ、しゃべった！ あなた、だれ？
nuku[Happy]: ぼくはヌク。この世界の案内役さ。転写が分からないなら、実際に見に行こう。

## SC0104 セントラルドグマ
- visual: central_dogma
- bgm: wonder
- bg: 核の中。図がホログラムのように浮かぶ
- camera: 図の上から下へ、DNA→RNA→タンパク質の順にパン
- chars: akari, nuku
- sfx: chime@SC0104-02, chime@SC0104-03
- pages: 3, 4, 71
- purpose: DNA→RNA→タンパク質の流れ（セントラルドグマ）を示し、転写の位置づけと、RNAに写す必然性を示す
- terms: セントラルドグマ, 転写, 翻訳
nuku[Neutral]: 遺伝情報は、DNAからRNAへ、RNAからタンパク質へと流れる。 {cue=map}
nuku[Neutral]: DNAを鋳型にRNAを合成することを、転写という。 {cue=transcription}
nuku[Neutral]: RNAの情報をもとにタンパク質を合成することを、翻訳という。 {cue=translation}
akari[Neutral]: 写すのが転写で、別の言葉に置き換えるのが翻訳か。
nuku[Happy]: いいたとえだね。この流れを、分子生物学のセントラルドグマという。 {cue=dogma}
nuku[Neutral]: 細菌からヒトまで共通の、普遍的な原理だ。ただし、情報の流れ方には色々と違いがあるんだ。
akari[Neutral]: でも、なぜわざわざRNAに写すの？ DNAを直接読めばいいのに。 {why=DNAを直接使わず、RNAに写すのか}
nuku[Neutral]: 設計図のDNAは核の中にある。タンパク質を作るのは、核の外の細胞質だ。だから、核の外へ持ち出せる写しが要る。それがmRNAなんだ。 {after=0.5}

## SC0105 冒険の地図
- visual: quest_map
- bgm: wonder
- bg: 核から細胞質までを描いた冒険マップ
- camera: マップ全体からステージ1へズーム
- chars: akari, nuku
- sfx: stamp@SC0105-03
- pages: 4
- purpose: 転写から翻訳までの段階を俯瞰し、作品全体の目標と、学び方のルール（必然性・ファインマン法）を示す
- terms: 転写開始, キャップ形成, スプライシング, ポリアデニル化, 核外輸送
nuku[Neutral]: 核の中では、転写が始まると、キャップ形成、伸長、スプライシング、ポリA付加と転写終結が進む。 {cue=stages}
nuku[Neutral]: できたmRNAは核の外へ運ばれ、細胞質で翻訳される。今回の冒険は、この核の中の仕組みと、病気とのつながりを解き明かす旅だ。
nuku[Neutral]: 旅のルールは二つ。一つ目は、仕組みを見たら、なぜ、そうでなければならないのかを考えること。暗記より、必然性だ。 {cue=rule1}
nuku[Neutral]: 二つ目は、分かったと思ったら、難しい言葉を使わずに、自分の言葉で説明してみること。物理学者ファインマンの名前から、ファインマン・テクニックと呼ばれる学び方だ。 {cue=rule2}
nuku[Neutral]: 説明に詰まったところが、まだ分かっていないところ。そこを埋めれば、本当に分かる。
akari[Happy]: なぜかを考えて、自分の言葉で説明する。よし、ジーン・クエスト、出発！ {say=なぜかをかんがえて、じぶんのことばでせつめいする。よし、ジーンクエスト、しゅっぱつ！ cue=go after=1.0}

# CHAPTER 2 RNAを作る職人

## SC0201 RNAポリメラーゼとの出会い
- visual: meet_polymerase
- bgm: curious
- bg: 核の中。DNA二重らせんの上を巨大な青い酵素が進む
- camera: 酵素の正面から回り込み、内部の断面図へ
- chars: akari, nuku, pol
- sfx: rumble@SC0201-01, pop@SC0201-04
- pages: 5
- purpose: RNAポリメラーゼの構造と、転写の方向を示す
- terms: RNAポリメラーゼ, 活性部位, リボヌクレオシド三リン酸
narr[Neutral]: チャプター2。RNAを作る職人。 {before=0.6 after=0.4}
akari[Surprise]: うわ、大きい！ 青い機械がDNAの上を進んでる。 {cue=pol_appear}
pol[Neutral]: わたしはRNAポリメラーゼ。DNAを鋳型にRNAを合成する酵素だ。職人というのは、たとえだがね。 {cue=pol_talk}
pol[Neutral]: わたしの中でDNAの二重らせんを少しほどき、片方の鎖を読みながら、RNAをつないでいく。 {cue=cutaway}
nuku[Neutral]: 材料のリボヌクレオシド三リン酸が入り口から入り、活性部位でつながれて、新しいRNAが出口から伸びていくんだ。 {cue=labels after=0.5}

## SC0202 鋳型鎖と相補的塩基対
- visual: template_strand
- bgm: curious
- bg: 塩基配列を拡大したホログラム
- camera: 二本鎖を上下に開き、鋳型鎖を強調
- chars: akari, nuku
- sfx: click@SC0202-03, chime@SC0202-06
- pages: 7
- purpose: 鋳型鎖・非鋳型鎖・相補性（TがUに）を正確に示す
- terms: 鋳型鎖, 非鋳型鎖, 相補的, ウラシル
akari[Neutral]: 片方の鎖って、どっちを読むの？
nuku[Neutral]: 読まれる鎖を鋳型鎖、もう片方を非鋳型鎖という。 {cue=strands}
nuku[Neutral]: RNAは鋳型鎖に相補的に合成される。DNAのAにはU、TにはA、GにはC、CにはGが向かい合う。 {cue=pairing}
akari[Surprise]: Tの代わりに、Uを使うの？
nuku[Neutral]: そう。RNAではチミンの代わりにウラシルを使うんだ。では、できたRNAを、非鋳型鎖と比べてみて。 {cue=compare}
akari[Happy]: あ、同じだ！ TがUに変わっているだけ！ {cue=same}
nuku[Happy]: だからデータベースでは、一般に非鋳型鎖の配列が表示されるんだ。
nuku[Neutral]: なぜ相補的に写すのか。向かい合う相手が一つに決まっているから、鋳型さえあれば、同じRNAを何度でも正確に作れるんだ。 {why=RNAは鋳型鎖に相補的に作られるのか after=0.5}

## SC0203 5'から3'へ
- visual: synthesis_direction
- bgm: curious
- bg: 縦に伸びる鋳型DNAと、1個ずつ入ってくるヌクレオチド
- camera: 鋳型鎖に沿って上から下へ移動
- chars: akari, nuku, pol
- sfx: click@SC0203-02, pop@SC0203-04
- pages: 8, 9, 10
- purpose: 鋳型鎖を3'→5'に読み、RNAを5'→3'に合成すること、リン酸ジエステル結合の形成を示す
- terms: 5'→3', リン酸ジエステル結合, ピロリン酸
nuku[Neutral]: 次は向き。RNAポリメラーゼは、鋳型鎖を3'から5'の方向に読み、RNAを5'から3'の方向に合成する。 {cue=direction}
nuku[Neutral]: 鋳型鎖に相補的なヌクレオチドが、1個ずつつながっていく。ほら、UTPの次はCTPだ。 {cue=ntp}
pol[Neutral]: 伸びているRNAの3'のOHに、新しいヌクレオチドの5'の三リン酸をつなぐ。 {cue=bond}
pol[Neutral]: こうして3'と5'の炭素の間に、リン酸ジエステル結合ができる。外れたリン酸は、ピロリン酸として出ていく。 {cue=ppi}
akari[Neutral]: 材料はATP、UTP、CTP、GTPの4つで、RNAはいつも5'から3'へ伸びるんだね。
akari[Neutral]: でも、なぜ一方向にしか伸びないの？ {why=RNAは5'から3'へしか伸びないのか}
nuku[Neutral]: つなぐための三リン酸は、新しく来るヌクレオチドの5'側についている。受け取るのは、伸びている鎖の3'のOHだけ。だから鎖は、3'の側にしか伸ばせないんだ。 {after=0.5}

## SC0204 プロモーター：どこから書き写す？
- visual: promoter_map
- bgm: curious
- bg: 長いDNAの上に、プロモーターと遺伝子a〜eが並ぶ地図
- camera: 左から右へ地図をなめ、プロモーターに寄る
- chars: akari, nuku
- sfx: ping@SC0204-02
- pages: 6, 11, 71
- purpose: プロモーターが開始点と鋳型鎖（転写の向き）を決めること、ターミネーターで終わることを示す
- terms: プロモーター, 転写開始点, ターミネーター
akari[Neutral]: DNAはすごく長いのに、どこから写すかは決まってるの？
nuku[Neutral]: その目印が、遺伝子の最初の部分にあるプロモーター。RNAポリメラーゼを結合させ、転写の開始点と、鋳型にする鎖を決める。 {cue=promoter}
nuku[Neutral]: 地図を見て。遺伝子cとdは、ほかと逆向きに転写されている。 {say=ちずをみて。いでんしシーとディーは、ほかとぎゃくむきにてんしゃされている。 cue=reverse}
nuku[Neutral]: プロモーター配列の向きで、RNAポリメラーゼの動く向きが決まるからなんだ。 {cue=role}
nuku[Neutral]: 遺伝子の終わりにはターミネーター。転写は、開始、伸長、終結と進むよ。 {cue=terminator}
akari[Neutral]: もし、その目印がなかったら？ {why=プロモーターという目印が要るのか}
nuku[Neutral]: どこから、どちら向きに写すかが決まらない。だから、開始点と鋳型にする鎖を、DNAの配列そのものに書いておく必要がある。それがプロモーターだ。 {after=0.5}

## SC0205 ファインマン・チェック①：転写
- visual: feynman_check
- bgm: quiz
- bg: 板書（アカリの説明 → 詰まったところ → 言い直し）
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0205-02, buzz@SC0205-03, correct@SC0205-04
- pages: 7, 10
- purpose: アカリが自分の言葉で転写を説明し、「鋳型鎖と同じ配列」という誤解を正す
- terms: 鋳型鎖, 非鋳型鎖, 相補的, 5'→3'
- card_title: 転写のしくみを、自分の言葉で
- card_try: ポリメラーゼが片方の鎖を読んで、それと同じ並びのRNAを作る
- card_wrong: それと同じ並び
- card_gap: 読んだ鎖（鋳型鎖）とは「相補的」。同じ並びになるのは反対側の非鋳型鎖で、TがUになるだけ
- card_fix: 読む鎖の向かい側の塩基を、5'から3'へ並べる。だからRNAは、反対側の鎖とそっくりになる
nuku[Happy]: ファインマン・チェック。ここまでの転写を、難しい言葉を使わずに説明してみて。 {cue=start}
akari[Neutral]: えっと、ポリメラーゼが片方の鎖を読んで、それと同じ並びのRNAを作る。 {cue=try after=0.6}
nuku[Neutral]: 惜しい。読んだ鎖と同じにはならない。向かい合う相手を並べるから、鋳型鎖とは相補的。同じ並びになるのは反対側の非鋳型鎖で、TがUになるだけだ。 {cue=gap}
akari[Happy]: 言い直すね。読む鎖の向かい側の文字を、5'から3'へ並べる。だから、できたRNAは、反対側の鎖とそっくりになる！ {cue=fix}
nuku[Happy]: その通り。詰まったところが分かると、理解が一段深くなる。 {after=0.8}

# CHAPTER 3 細菌の転写作戦

## SC0301 細菌の世界とσ因子
- visual: bacteria_holoenzyme
- bgm: action
- bg: 大腸菌の細胞内。核膜はなく、DNAが細胞質に広がる
- camera: 大腸菌の外観から内部へ。σ因子がコア酵素に合体するところをクローズアップ
- chars: akari, nuku, pol, sigma
- sfx: whoosh@SC0301-01, clamp@SC0301-05
- pages: 13, 14, 28
- purpose: 原核生物のRNAポリメラーゼとσ因子、ホロ酵素を示す
- terms: 原核生物, σ因子, コア酵素, ホロ酵素
narr[Neutral]: チャプター3。細菌の転写作戦。 {before=0.6 after=0.4}
nuku[Neutral]: ここは大腸菌の中。細菌には核がなく、DNAは細胞質にある。 {note=補足 cue=ecoli}
sigma[Happy]: どうも！ わたしはσ因子。プロモーターを見つける係よ！ {cue=sigma}
nuku[Neutral]: RNAポリメラーゼの本体をコア酵素といい、σ因子が結合したものをホロ酵素という。 {cue=holo}
nuku[Neutral]: 細菌のRNAポリメラーゼが転写を始めるのに必要なタンパク質は、このσ因子だけなんだ。 {cue=dock after=0.4}

## SC0302 −35と−10：プロモーターの目印
- visual: prok_promoter
- bgm: action
- bg: 大腸菌のプロモーター領域の拡大図
- camera: −35ボックス、−10ボックス、+1の順に寄る
- chars: akari, nuku, sigma
- sfx: ping@SC0302-02, ping@SC0302-03, unzip@SC0302-04, pop@SC0302-06
- pages: 15, 16, 18
- purpose: −35/−10ボックスの配列と位置、二重らせんがほどけて転写が始まり、σ因子が離れる過程を示す
- terms: −35ボックス, −10ボックス, 転写開始点（+1）
nuku[Neutral]: 大腸菌のプロモーターの目印は二つ。転写開始点を+1として、上流の−35と−10の位置だ。 {cue=positions}
sigma[Happy]: −35ボックスは5'-TTGACA-3'！ {say=マイナスさんじゅうごボックスは、ゴダッシュ、ティーティージーエーシーエー、サンダッシュ！ cue=box35}
sigma[Happy]: −10ボックスは5'-TATAAT-3'！ これを目印に結合するの！ {say=マイナスじゅうボックスは、ゴダッシュ、ティーエーティーエーエーティー、サンダッシュ！ これをめじるしにけつごうするの！ cue=box10}
nuku[Neutral]: 結合すると、開始点のまわりの二重らせんがほどけ、+1と+2のリボヌクレオチドの間に、最初のリン酸ジエステル結合ができる。 {cue=open}
sigma[Happy]: RNAが10ヌクレオチドくらいになったら、わたしは離れるね。またね！ {cue=sigma_leave}
nuku[Neutral]: σ因子が離れ、RNAポリメラーゼはプロモーターを離れて伸長に入るんだ。 {after=0.4}

## SC0303 伸長と終結
- visual: prok_elong_term
- bgm: action
- bg: DNAに沿って進むコア酵素。後半はステムループとρタンパク質
- camera: 酵素と並走し、終結点で止まる
- chars: akari, nuku, pol
- sfx: click@SC0303-01, twist@SC0303-03, pop@SC0303-05
- pages: 17, 19, 20, 21
- purpose: 伸長の3ステップと、ターミネーターによる終結（ステムループ、ρ、A–U塩基対）を示す
- terms: 伸長, ターミネーター, ステムループ構造, パリンドローム配列, ρタンパク質
nuku[Neutral]: 伸長では、相補的なリボヌクレオチドが1個入り、リン酸ジエステル結合をつくり、RNAポリメラーゼが移動する。これのくり返しだ。 {cue=steps}
nuku[Neutral]: やがて遺伝子の下流の、ターミネーターにたどり着く。 {cue=terminator}
nuku[Neutral]: 写されたRNAのパリンドローム配列が折れ曲がって塩基対をつくり、ステムループ構造になる。するとRNAポリメラーゼが停止する。 {cue=stemloop}
nuku[Neutral]: さらに、ρタンパク質がRNAに結合して、DNAとRNAの間の塩基対を壊すこともある。結合力の弱いA–U塩基対が多いと、RNAは外れやすい。 {say=さらに、ローたんぱくしつがアールエヌエーにけつごうして、ディーエヌエーとアールエヌエーのあいだのえんきついを、こわすこともある。けつごうりょくのよわい、エーユーえんきついがおおいと、アールエヌエーははずれやすい。 cue=rho}
akari[Happy]: RNAが放出されて、σ因子とまた組んで、次の転写へ。一周するサイクルなんだ！ {cue=cycle after=0.5}

## SC0304 必要なRNAだけを作る
- visual: housekeeping
- bgm: thoughtful
- bg: 大腸菌と糖分子。環境が変わると遺伝子のスイッチが入れ替わる
- camera: 上段（グルコース）から下段（ラクトース）へ
- chars: akari, nuku
- sfx: switch@SC0304-03
- pages: 23, 26
- purpose: 転写調節で必要なRNAだけを作ること、ハウスキーピング遺伝子と調節的発現遺伝子の違いを示す
- terms: 転写調節, ハウスキーピング遺伝子, 構成的発現, 調節的発現
nuku[Neutral]: 細胞は、転写調節によって、必要なRNAだけを作る。 {cue=regulate}
nuku[Neutral]: 遺伝子1はいつも転写されている。常に必要な、ハウスキーピング遺伝子だ。 {cue=gene1}
nuku[Neutral]: 糖がグルコースからラクトースに変わると、遺伝子2が止まり、遺伝子3が活性化される。 {cue=switch}
nuku[Neutral]: 常に発現するものを構成的発現遺伝子、必要に応じて変化するものを調節的発現遺伝子という。 {cue=types}
akari[Neutral]: でも、なぜ全部の遺伝子を、いつも転写しないの？ {why=転写を調節しなければならないのか}
nuku[Neutral]: ラクトースがないのに、ラクトースを分解する酵素を作っても役に立たない。だから、必要なときに、必要なRNAだけを作る仕組みが要るんだ。 {after=0.4}

## SC0305 ラクトースオペロン
- visual: lac_operon
- bgm: thoughtful
- bg: lacオペロンの遺伝子地図
- camera: P → O → lacZ → lacY → lacA → T と移動
- chars: akari, nuku
- sfx: ping@SC0305-02, chime@SC0305-03
- pages: 24, 25
- purpose: lacオペロンの構造（1つのmRNAに複数の遺伝子）と、各遺伝子産物の役割を示す
- terms: ラクトースオペロン, オペロン, lacZ, lacY, lacA, lacI
nuku[Neutral]: 大腸菌はラクトースを、β-ガラクトシダーゼで加水分解して利用する。 {cue=lactose}
nuku[Neutral]: 必要な遺伝子は、lacZ、lacY、lacAの三つ。プロモーターからターミネーターまでが一つの転写単位で、1つのmRNAに複数のタンパク質の情報がのる。 {cue=genes}
nuku[Neutral]: 同じ転写因子の調節を受け、連携して働く酵素の遺伝子の集まり。これがオペロンだ。 {cue=operon}
nuku[Neutral]: 少し離れたlacI遺伝子の産物が、lacZYAの発現を調節している。 {say=すこしはなれた、ラックアイいでんしのさんぶつが、ラックゼットワイエーのはつげんを、ちょうせつしている。 cue=laci}
nuku[Neutral]: なぜ、まとめるのか。この三つは、ラクトースを使うときに一緒に必要になる。だから一つのスイッチで、まとめて転写できるようになっているんだ。 {why=遺伝子をオペロンにまとめるのか after=0.4}

## SC0306 二つのスイッチ：cAMP-CRPとリプレッサー
- visual: lac_switches
- bgm: thoughtful
- bg: 2つのパネル。左にCRP–cAMP（正の調節）、右にリプレッサー（負の調節）
- camera: 左パネル → 右パネル → 条件比較表
- chars: akari, nuku
- sfx: switch@SC0306-01, switch@SC0306-03, chime@SC0306-06
- pages: 22, 24
- purpose: cAMP-CRPによる正の調節と、リプレッサーによる負の調節を条件別に比較する
- terms: cAMP-CRP, 正の調節, 負の調節, オペレーター, リプレッサー
nuku[Neutral]: スイッチは二つ。一つ目のアクセルは、cAMP-CRP複合体。プロモーターに結合して、RNAポリメラーゼの結合を助ける。正の調節だ。 {cue=crp}
nuku[Neutral]: cAMPが低下すると複合体ができず、RNAポリメラーゼもプロモーターに結合できない。 {cue=lowcamp}
nuku[Neutral]: 二つ目のブレーキは、lacIからできるリプレッサー。プロモーターの中にあるオペレーターに結合して、転写を止める。 {cue=repressor}
nuku[Neutral]: ラクトースがあると、ラクトースから生じる物質がリプレッサーを外す。抑制のしくみを抑えて発現させるので、負の調節という。 {note=補足 cue=release}
akari[Neutral]: だから、グルコースがあるとβ-galは作られず、グルコースがなくてラクトースがあると作られるんだ。 {say=だから、グルコースがあるとベータガラクトシダーゼはつくられず、グルコースがなくてラクトースがあるとつくられるんだ。 cue=table}
nuku[Happy]: その通り！ スイッチが二つあるのは、条件が二つあるからだ。ラクトースがあること、そしてグルコースがないこと。 {why=スイッチが二つ要るのか after=0.6}

## SC0307 オペロンとレギュロン
- visual: operon_regulon
- bgm: thoughtful
- bg: 上段にオペロン（1つのプロモーター）、下段にレギュロン（散らばった遺伝子）
- camera: 上下の比較
- chars: akari, nuku
- sfx: ping@SC0307-02
- pages: 25
- purpose: オペロンとレギュロンの違いを図で比較する
- terms: オペロン, レギュロン, 熱ショックレギュロン, SOSレギュロン
akari[Neutral]: オペロンとレギュロンって、まぎらわしい。
nuku[Neutral]: オペロンは、1つのプロモーターのもとで、まとめて1本のmRNAとして転写される遺伝子群。 {cue=operon}
nuku[Neutral]: レギュロンは、DNAのあちこちに散らばった遺伝子群を、一斉に調節するシステム。熱ショックレギュロンやSOSレギュロンがある。 {cue=regulon}
akari[Happy]: まとまっているのがオペロン、散らばっていても一斉に動くのがレギュロン！ {after=0.8}

## SC0308 ファインマン・チェック②：ラクトースオペロン
- visual: feynman_check
- bgm: quiz
- bg: 板書（アカリの説明 → 詰まったところ → 言い直し）
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0308-02, buzz@SC0308-03, correct@SC0308-04
- pages: 24
- purpose: アカリが自分の言葉でlacオペロンの調節を説明し、「ラクトースだけで発現する」という誤解を正す
- terms: ラクトースオペロン, 正の調節, 負の調節
- card_title: ラクトースオペロンを、自分の言葉で
- card_try: ラクトースが来たら、ブレーキが外れて、β-galが作られる
- card_wrong: ラクトースが来たら
- card_gap: 条件が一つ足りない。グルコースがあると、ラクトースがあってもβ-galは作られない
- card_fix: ラクトースがあり、グルコースがない。二つの条件がそろって、はじめてβ-galが作られる
nuku[Happy]: ファインマン・チェック。ラクトースオペロンを、たとえを使って説明してみて。 {cue=start}
akari[Neutral]: ラクトースが来たら、ブレーキが外れて、β-galが作られる！ {say=ラクトースがきたら、ブレーキがはずれて、ベータガラクトシダーゼがつくられる！ cue=try after=0.6}
nuku[Neutral]: 半分正解。グルコースがあると、ラクトースがあっても作られない。アクセルのcAMP-CRPも働く必要があるんだ。 {cue=gap}
akari[Happy]: 言い直すね。ラクトースがあって、グルコースがない。二つの条件がそろって、はじめてβ-galが作られる！ {say=いいなおすね。ラクトースがあって、グルコースがない。ふたつのじょうけんがそろって、はじめてベータガラクトシダーゼがつくられる！ cue=fix}
nuku[Happy]: そう。必然性が分かれば、条件を丸暗記しなくていい。 {after=0.8}

# CHAPTER 4 真核生物の転写開始

## SC0401 核の中の三つのポリメラーゼ
- visual: three_polymerases
- bgm: tension
- bg: 真核細胞の核内。ヌクレオソームに巻きついたDNA
- camera: 核膜を抜けて核内へ。3体のポリメラーゼが並ぶ
- chars: akari, nuku
- sfx: whoosh@SC0401-01, ping@SC0401-04, ping@SC0401-05, ping@SC0401-06
- pages: 28, 29, 32, 59
- purpose: 真核生物の3種のRNAポリメラーゼと、その担当、多数の転写基本因子が必要な理由を示す
- terms: RNAポリメラーゼI, RNAポリメラーゼII, RNAポリメラーゼIII, 転写基本因子, ヌクレオソーム
narr[Neutral]: チャプター4。真核生物の転写開始。 {before=0.6 after=0.4}
akari[Surprise]: 今度は核膜がある！ DNAが糸巻きみたいなものに巻きついてる。
nuku[Neutral]: 真核生物のDNAは、ヌクレオソームや凝集したクロマチン構造をとる。転写はこのDNAを相手にするんだ。 {cue=chromatin}
nuku[Neutral]: RNAポリメラーゼIは、5.8S、18S、28SのrRNA遺伝子を転写する。 {say=アールエヌエーポリメラーゼワンは、ごてんはちエス、じゅうはちエス、にじゅうはちエスの、アールアールエヌエーいでんしをてんしゃする。 cue=pol1}
nuku[Neutral]: IIは、タンパク質を指令する遺伝子すべてと、snoRNA、miRNA、ほとんどのsnRNAの遺伝子。 {say=ツーは、タンパクしつをしれいするいでんしすべてと、スノーアールエヌエー、マイクロアールエヌエー、ほとんどのエスエヌアールエヌエーのいでんし。 cue=pol2}
nuku[Neutral]: IIIは、tRNA遺伝子や5S rRNA遺伝子など、小さなRNAの遺伝子だ。 {say=スリーは、ティーアールエヌエーいでんしや、ごエスアールアールエヌエーいでんしなど、ちいさなアールエヌエーのいでんしだ。 cue=pol3}
nuku[Neutral]: mRNAの前駆体を合成するのはIIだ。そして真核生物では、転写の開始に、転写基本因子とよばれる多数のタンパク質が必要になる。 {say=エムアールエヌエーのぜんくたいをごうせいするのはツーだ。そしてしんかくせいぶつでは、てんしゃのかいしに、てんしゃきほんいんしとよばれる、たすうのタンパクしつがひつようになる。 cue=gtfs}
akari[Neutral]: 細菌はσ因子だけだったのに、なぜ真核生物はそんなに必要なの？ {why=真核生物は多数の転写基本因子を必要とするのか}
nuku[Neutral]: 真核生物のDNAは、ヌクレオソームや凝集したクロマチンに包まれ、ゲノムも巨大だ。その中から正しい開始点を見つけて開くには、多くのタンパク質の助けがいるんだ。 {after=0.4}

## SC0402 転写開始前複合体の組み立て
- visual: pic_assembly
- bgm: tension
- bg: プロモーター領域の拡大。TATAボックスと転写開始点
- camera: TATAボックスに寄り、因子が1つずつ集まるたびに少し引く
- chars: akari, nuku, tfiid
- sfx: ping@SC0402-01, bend@SC0402-03, clamp@SC0402-05, clamp@SC0402-06, clamp@SC0402-07
- pages: 30, 31, 32
- purpose: TATAボックス→TFIID（TBP）→TFIIB→Pol II・TFIIF→TFIIE・TFIIHの順に転写開始前複合体ができることを示す
- terms: TATAボックス, TFIID, TBP, TAF, TFIIB, TFIIF, TFIIE, TFIIH, 転写開始前複合体
nuku[Neutral]: 転写開始部位から約25塩基上流に、TATAボックスがある。 {say=てんしゃかいしぶいから、やくにじゅうごえんきじょうりゅうに、タタボックスがある。 cue=tata}
tfiid[Neutral]: 最初に来るのはわたし、TFIID。わたしのTBPというサブユニットが、TATAボックスを見分けて結合します。 {cue=tfiid}
nuku[Neutral]: TFIIDは、TBPと約11個のTAFからなる複合体。結合でDNAが大きくゆがむ。巨大なゲノムの中で、ここが活性なプロモーターだと示す、物理的な目印になると考えられている。 {cue=bend why=DNAをゆがめるのか}
nuku[Neutral]: 隣にTFIIBが結合し、RNAポリメラーゼを転写開始部位へ正しく配置する。 {cue=tfiib}
nuku[Neutral]: RNAポリメラーゼIIがTFIIFとともに結合する。TFIIFは、ポリメラーゼとTBP、TFIIBの結合を安定化する。 {cue=pol2}
nuku[Neutral]: さらにTFIIEとTFIIHも加わる。TFIIEは、TFIIHを引き寄せて調節する。 {cue=tfiie}
akari[Surprise]: 因子が集まって、大きな複合体になった！
nuku[Neutral]: これが転写開始前複合体だ。 {cue=pic after=0.4}

## SC0403 TFIIHとCTDのリン酸化
- visual: tfiih_ctd
- bgm: tension
- bg: 転写開始前複合体のクローズアップ。ポリメラーゼから伸びる長い尾（CTD）
- camera: TFIIHに寄り、CTDのリン酸化で光る。ポリメラーゼが右へ発進
- chars: akari, nuku, pol
- sfx: charge@SC0403-01, spark@SC0403-02, whoosh@SC0403-04
- pages: 30, 31, 32
- purpose: TFIIHがATPを使ってDNAをほどき、CTDのSer5をリン酸化して伸長期へ移ることを示す
- terms: TFIIH, ATP, CTD, C末端領域, リン酸化, 転写伸長期
nuku[Neutral]: TFIIHは、ATPを使って転写開始部位のDNA二本鎖をほどき、鋳型鎖をむき出しにする。 {cue=unwind}
pol[Neutral]: そしてTFIIHは、わたしのC末端領域、CTDのSer5をリン酸化する。 {say=そしてティーエフツーエイチは、わたしの、シーまったんりょういき、シーティーディーの、セリンファイブを、リンさんかする。 cue=ctd}
nuku[Neutral]: 開始の足場につかまったままでは、前へ進めない。リン酸化で立体構造が変わり、ポリメラーゼは転写基本因子から離れて、伸長期に入る。 {cue=escape why=CTDをリン酸化するのか}
pol[Happy]: では、行ってくる！ {cue=go}
nuku[Neutral]: ほとんどの転写基本因子はDNAを離れ、次の転写開始に再利用される。図のように、TFIIDはTATAボックスに残ることもある。 {cue=recycle after=0.4}

## SC0404 上流プロモーター要素と、原核との比較
- visual: upstream_compare
- bgm: tension
- bg: 上段に真核のプロモーター（CAAT・GC・TATA）、下段に原核のプロモーター（−35・−10）
- camera: 上段から下段へ
- chars: akari, nuku
- sfx: ping@SC0404-01, chime@SC0404-03
- pages: 18, 28, 33
- purpose: CAAT/GCボックスの配列と働き、原核と真核のプロモーターと開始因子の違いを比較する
- terms: 上流プロモーター要素, CAATボックス, GCボックス
nuku[Neutral]: TATAボックスの上流には、上流プロモーター要素がある。CAATボックスは5'-CCAAT-3'、GCボックスは5'-GGGCGG-3'。結合したタンパク質が、転写効率を高める。 {say=タタボックスのじょうりゅうには、じょうりゅうプロモーターようそがある。キャットボックスは、ゴダッシュ、シーシーエーエーティー、サンダッシュ。ジーシーボックスは、ゴダッシュ、ジージージーシージージー、サンダッシュ。けつごうしたタンパクしつが、てんしゃこうりつをたかめる。 cue=boxes}
nuku[Neutral]: 比べてみよう。細菌は−35と−10ボックスに、σ因子だけで結合する。真核生物のIIは、TATAボックスなどに、多数の転写基本因子と集まる。 {say=くらべてみよう。さいきんは、マイナスさんじゅうごと、マイナスじゅうボックスに、シグマいんしだけでけつごうする。しんかくせいぶつのツーは、タタボックスなどに、たすうのてんしゃきほんいんしとあつまる。 cue=compare}
akari[Happy]: TATAボックスは真核、−10と−35は原核。ここ、試験に出そう！ {after=0.5}

## SC0405 ファインマン・チェック③：真核生物の転写開始
- visual: feynman_check
- bgm: quiz
- bg: 板書（アカリの説明 → 詰まったところ → 言い直し）
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0405-02, buzz@SC0405-03, correct@SC0405-04
- pages: 30, 32
- purpose: アカリが自分の言葉で真核生物の転写開始を説明し、「ポリメラーゼがTATAボックスに直接結合する」という誤解を正す。TBPとTFIIHの役割の確認
- terms: TBP, TFIIB, TFIIH, CTD
- card_title: 真核生物の転写開始を、自分の言葉で
- card_try: RNAポリメラーゼIIが、TATAボックスに直接くっついて、転写を始める
- card_wrong: 直接くっついて
- card_gap: 直接ではない。先にTFIIDのTBPがTATAボックスに結合し、TFIIBがポリメラーゼを正しい位置に置く
- card_fix: TBPが目印を見つけ、因子が集まる。TFIIHがDNAをほどき、CTDをリン酸化すると、ポリメラーゼが出発する
nuku[Happy]: ファインマン・チェック。真核生物の転写開始を、説明してみて。 {cue=start}
akari[Neutral]: えっと、ポリメラーゼIIが、TATAボックスに直接くっついて、転写を始める。 {say=えっと、ポリメラーゼツーが、タタボックスにちょくせつくっついて、てんしゃをはじめる。 cue=try after=0.6}
nuku[Neutral]: そこが落とし穴。先にTFIIDの中のTBPがTATAボックスに結合し、TFIIBがポリメラーゼを正しい位置に置く。ポリメラーゼは後から来るんだ。 {cue=gap}
akari[Happy]: 言い直すね。目印を見つけるのはTBP。因子が集まり、TFIIHがDNAをほどいてCTDをリン酸化すると、ポリメラーゼが出発する！ {cue=fix}
nuku[Happy]: 完璧だ。TATAボックスにつくのはTBP、CTDをリン酸化するのはTFIIH。 {after=0.8}

# CHAPTER 5 遺伝子発現のスイッチ

## SC0501 遠くからのスイッチ：エンハンサー
- visual: enhancer_loop
- bgm: hopeful
- bg: 長いDNA。遠く離れたエンハンサーに活性化因子が結合し、DNAがループする
- camera: エンハンサーからプロモーターへ長くパン、ループ形成で全体を見せる
- chars: akari, nuku
- sfx: ping@SC0501-02, bend@SC0501-04, glow@SC0501-05
- pages: 34, 35
- purpose: 転写活性化因子、エンハンサー/サイレンサー、メディエーター、クロマチン修飾酵素の役割を示す
- terms: 転写活性化因子, エンハンサー, サイレンサー, メディエーター（介在因子）, クロマチン再構成複合体, ヒストン修飾酵素
narr[Neutral]: チャプター5。遺伝子発現のスイッチ。 {before=0.6 after=0.4}
nuku[Neutral]: 転写活性化因子が、DNAの特異的な配列に結合して、RNAポリメラーゼを開始部位へ引きつける。 {cue=activator}
akari[Surprise]: でも、結合した場所、プロモーターからすごく遠いよ？ {why=DNAがループをつくるのか}
nuku[Neutral]: エンハンサーは、遺伝子から数百から数千塩基対も離れた上流、または下流にある。離れたところから働きかけるには、DNAがループをつくって近づくしかないんだ。 {cue=loop}
nuku[Neutral]: エンハンサーは転写効率を増強し、逆に抑えるのがサイレンサーだ。 {cue=silencer}
nuku[Neutral]: 活性化因子とポリメラーゼII、転写基本因子をとりもつのが、介在因子、メディエーター。 {cue=mediator}
nuku[Neutral]: さらに、クロマチン再構成複合体やヒストン修飾酵素も集まってくる。クロマチンの中のDNAはそのままでは反応しにくいので、反応しやすい状態にする必要があるんだ。 {cue=remodel why=クロマチン修飾酵素が必要なのか after=0.4}

## SC0502 調節配列の地図
- visual: regulatory_map
- bgm: hopeful
- bg: 調節配列の地図（遠位調節要素、近位調節要素、プロモーター）
- camera: 右（遺伝子）から左（遠位）へパン
- chars: akari, nuku
- sfx: ping@SC0502-01
- pages: 35
- purpose: 遠位・近位調節要素とプロモーター、基礎的発現と調節的発現の関係を整理する
- terms: 遠位調節要素, 近位調節要素, 基礎的発現, 調節的発現, 応答配列
nuku[Neutral]: 地図にすると、遺伝子のすぐ上流にプロモーター。その上流にGCやCAATの近位調節要素。ここまでが基礎的な発現を担う。 {say=ちずにすると、いでんしのすぐじょうりゅうにプロモーター。そのじょうりゅうに、ジーシーやキャットの、きんいちょうせつようそ。ここまでが、きそてきなはつげんをになう。 cue=proximal}
nuku[Neutral]: さらに遠くの、エンハンサーやサイレンサー、その他の応答配列が、細胞ごとの調節的な発現に関わるんだ。 {cue=distal after=0.4}

## SC0503 ほどけたクロマチン、凝集したクロマチン
- visual: chromatin_states
- bgm: hopeful
- bg: 左にほどけたクロマチン（暖色の光）、右に凝集したクロマチン（寒色）
- camera: 左右の比較から、クロマチンがほどける瞬間に寄る
- chars: akari, nuku
- sfx: unzip@SC0503-04, glow@SC0503-05
- pages: 2, 34, 70
- purpose: ユークロマチンとヘテロクロマチン、クロマチンリモデリングと発現の関係を示す
- terms: ヒストン, ヌクレオソーム, クロマチン, ユークロマチン, ヘテロクロマチン, クロマチンリモデリング
nuku[Neutral]: DNAは、塩基性タンパク質のヒストンとヌクレオソームをつくり、さらにクロマチンになっている。 {cue=nucleosome}
nuku[Neutral]: 発現しうる遺伝子は、ほぐれたユークロマチンにあり、発現しない遺伝子は、凝集したヘテロクロマチンにある。 {cue=eu}
akari[Neutral]: ぎゅっと詰まっていると、ポリメラーゼが近づけないんだね。
nuku[Neutral]: そんなイメージだ。エンハンサーやサイレンサーによる調節には、クロマチンリモデリングを伴う場合がある。 {cue=remodel}
nuku[Neutral]: 資料の重要語句にあるエピジェネティック制御は、塩基配列を変えずに、こうした仕組みで発現を調節することを指す言葉だよ。 {note=補足 cue=epi after=0.4}

## SC0504 同じゲノム、違う細胞
- visual: same_genome
- bgm: hopeful
- bg: 形の違う2つの細胞。同じ遺伝子の列に、異なるオン/オフのパターン
- camera: 2つの細胞から遺伝子の列へズーム
- chars: akari, nuku
- sfx: switch@SC0504-02, switch@SC0504-03
- pages: 26, 36, 37
- purpose: ホルモン、発生段階、分化による遺伝子発現の違いと、細胞のコミットメントを示す
- terms: 分化, ホルモン応答性遺伝子, β-グロビン遺伝子, コミットメント
akari[Neutral]: 体の細胞はみんな同じDNAなのに、どうして形も働きも違うの？ {why=同じDNAから違う細胞ができるのか}
nuku[Neutral]: DNAが同じなら、違いはDNAの中身ではなく、どの遺伝子を使うかにあるはずだ。分化した細胞は、異なる遺伝子を発現する。 {cue=diff}
nuku[Neutral]: ホルモンや調節分子も発現を変えるし、β-グロビン遺伝子のように、胚、胎児、成体と、発生段階で制御される遺伝子もある。 {say=ホルモンやちょうせつぶんしもはつげんをかえるし、ベータグロビンいでんしのように、はい、たいじ、せいたいと、はっせいだんかいでせいぎょされるいでんしもある。 cue=hormone}
nuku[Neutral]: どの系統へ分化するかの決定、コミットメントにも転写因子が関わる。図の下のように、分化が止まったり、別の系統へ向かったりする変化も示されている。 {cue=commit after=0.4}

## SC0505 ファインマン・チェック④：エンハンサー
- visual: feynman_check
- bgm: quiz
- bg: 板書（アカリの説明 → 詰まったところ → 言い直し）
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0505-02, buzz@SC0505-03, correct@SC0505-04
- pages: 34, 35
- purpose: アカリが自分の言葉でエンハンサーを説明し、「遺伝子のすぐ前にある」という誤解を正す
- terms: エンハンサー, 転写活性化因子, メディエーター（介在因子）
- card_title: エンハンサーを、自分の言葉で
- card_try: エンハンサーは、遺伝子のすぐ前にある、オンのスイッチ
- card_wrong: 遺伝子のすぐ前にある
- card_gap: すぐ前とは限らない。数百〜数千塩基対も離れた上流にも下流にもある。だからDNAのループが要る
- card_fix: 遠くのエンハンサーに活性化因子がつき、DNAがループして、介在因子を通じてポリメラーゼを助ける
nuku[Happy]: ファインマン・チェック。エンハンサーを説明してみて。 {cue=start}
akari[Neutral]: エンハンサーは、遺伝子のすぐ前にある、オンのスイッチ！ {cue=try after=0.6}
nuku[Neutral]: すぐ前とは限らない。数百から数千塩基対も離れた、上流にも下流にもある。だからループが必要だったんだ。 {cue=gap}
akari[Happy]: 言い直すね。遠くのエンハンサーに活性化因子がつき、DNAがループして、介在因子を通じてポリメラーゼを助ける。だから遠くても効く！ {cue=fix}
nuku[Happy]: いいね。「すぐ前」と思い込むと、ループの必然性が見えなくなる。 {after=0.8}

## SC0506 原核と真核、調節の違い
- visual: regulation_compare
- bgm: hopeful
- bg: 左に原核（転写の有無だけ）、右に真核（転写＋転写後）
- camera: 左右の比較
- chars: akari, nuku
- sfx: chime@SC0506-02
- pages: 4, 70
- purpose: 原核は転写調節、真核は転写調節に加えて転写後調節もあることを示す
- terms: 転写調節, 転写後調節
nuku[Neutral]: 原核生物の遺伝子発現は、mRNAを合成するかどうか、つまり転写調節で制御される。 {cue=prok}
nuku[Neutral]: 真核生物では、転写は核、翻訳は細胞質と、場所が分かれている。その間の、mRNAの修飾や、核から細胞質への輸送などの転写後調節でも制御される。 {cue=euk}
akari[Neutral]: mRNAの修飾って？
nuku[Happy]: それが次のステージ、RNA編集工房だ！ {after=0.8}

# CHAPTER 6 RNA編集工房

## SC0601 プレmRNAの加工
- visual: processing_overview
- bgm: workshop
- bg: 核の中の工房。ベルトコンベアの上をRNAが流れる
- camera: 転写中のポリメラーゼから、伸びるRNAを追う
- chars: akari, nuku
- sfx: whoosh@SC0601-01, ping@SC0601-03
- pages: 4, 46
- purpose: mRNA前駆体が4段階の過程を経て成熟mRNAになることを示す
- terms: mRNA前駆体, pre-mRNA, hnRNA, キャッピング酵素, ポリ(A)ポリメラーゼ
narr[Neutral]: チャプター6。RNA編集工房。 {before=0.6 after=0.4}
nuku[Neutral]: 真核生物のmRNAは、まずmRNA前駆体、プレmRNAとして合成される。 {cue=premrna}
nuku[Neutral]: そこに、5'キャップの付加、ポリAの付加、そしてスプライシングによるイントロンの除去とエクソンの結合が行われる。 {cue=steps}
nuku[Neutral]: 完成したmRNAは、核から細胞質に出てから、リボソームで翻訳に使われる。 {after=0.4}

## SC0602 5'キャップ
- visual: cap_formation
- bgm: workshop
- bg: RNAの5'末端の拡大
- camera: 5'末端に寄り、メチル基が付く瞬間をクローズアップ
- chars: akari, nuku
- sfx: pop@SC0602-01, sparkle@SC0602-02
- pages: 47
- purpose: 5'末端へのGの付加と7位の窒素のメチル化（m7G）を示す
- terms: 5'キャップ, m7G, メチル化
nuku[Neutral]: まず5'キャップ。三リン酸のついた5'末端に、Gが付加される。 {cue=addG}
nuku[Neutral]: そのGの7位の窒素がメチル化されて、m7G、7-メチルグアノシンのキャップになる。 {say=そのジーの、ななのちっそがメチルかされて、エムセブンジー、ななメチルグアノシンのキャップになる。 cue=methyl}
akari[Happy]: RNAの頭に、帽子をかぶせるんだね。 {after=0.4}

## SC0603 ポリAテール
- visual: polya
- bgm: workshop
- bg: RNAの3'側。シグナル配列とハサミのような酵素
- camera: AAUAAAに寄る→切断→Aが連なっていく
- chars: akari, nuku
- sfx: ping@SC0603-01, snip@SC0603-02, pop@SC0603-03
- pages: 47
- purpose: ポリアデニル化シグナル、切断、ポリ(A)ポリメラーゼによるA付加と、キャップ・ポリAの役割を示す
- terms: ポリアデニル化シグナル, AAUAAA, エンドヌクレアーゼ, ポリ(A)ポリメラーゼ, エキソヌクレアーゼ
nuku[Neutral]: 3'側には、ポリアデニル化シグナルのAAUAAAと、GUに富む配列がある。 {say=サンダッシュがわには、ポリアデニルかシグナルの、エーエーユーエーエーエーと、ジーユーにとむはいれつがある。 cue=signal}
nuku[Neutral]: エンドヌクレアーゼが、この二つのシグナルの間を切断する。 {cue=cut}
nuku[Neutral]: そこにポリ(A)ポリメラーゼが、Aを250個まで付加する。資料では20から250個だ。 {say=そこに、ポリエーポリメラーゼが、エーをにひゃくごじゅっこまでふかする。しりょうでは、にじゅうからにひゃくごじゅっこだ。 cue=tail}
akari[Neutral]: でも、なぜ両端に、わざわざ飾りをつけるの？ {why=5'キャップとポリAが必要なのか cue=protect}
nuku[Neutral]: 端がむき出しだと、エキソヌクレアーゼに端から分解されてしまう。5'キャップとポリAは、その攻撃からmRNAを守る。長く必要なタンパク質のmRNAほど、安定性が高いんだ。 {after=0.4}

## SC0604 エクソンとイントロン：GT-AG則
- visual: exon_intron
- bgm: workshop
- bg: 遺伝子のDNAと前駆体RNA。エクソンは色つき、イントロンは灰色
- camera: エクソン→イントロンの境界に寄る
- chars: akari, nuku
- sfx: ping@SC0604-03, ping@SC0604-04
- pages: 48, 50, 71
- purpose: 不連続遺伝子、エクソン/イントロン、GT-AG則とブランチ部位、境目の目印が必要な理由を示す
- terms: 不連続遺伝子, エクソン, イントロン, GT-AG則, ブランチ部位
nuku[Neutral]: 真核生物の多くの遺伝子は、エクソンの間がイントロンで分断された、不連続遺伝子だ。 {cue=split}
nuku[Neutral]: 転写ではイントロンも写しとる。その転写産物からイントロンを除く過程が、スプライシング。 {cue=splicing}
nuku[Neutral]: イントロンは、DNAではGTで始まりAGで終わる。GT-AG則だ。RNAではGUで始まり、AGで終わる。 {cue=gtag}
nuku[Neutral]: イントロンの中ほどには、ブランチ部位のAがある。 {cue=branch}
nuku[Neutral]: ジストロフィン遺伝子では、2400キロ塩基対のうち99パーセントがイントロンなんだ。 {say=ジストロフィンいでんしでは、にせんよんひゃくキロえんきついのうち、きゅうじゅうきゅうパーセントがイントロンなんだ。 cue=table}
akari[Neutral]: なぜ、境目の目印がそんなに大事なの？ {why=GT-AGという境目の目印が必要なのか}
nuku[Neutral]: 3つの塩基で1つのアミノ酸。切る位置が1塩基でもずれると、読み枠がずれて、まったく別のアミノ酸が並んでしまう。だから境目には、決まった目印が要るんだ。 {note=補足 after=0.4}

## SC0605 スプライソソームの手順
- visual: spliceosome
- bgm: workshop
- bg: イントロンを中心にした模式図。snRNPが色つきの粒として集まる
- camera: 段階ごとに少しずつ寄り、投げ縄構造の形成をクローズアップ
- chars: akari, nuku, splice
- sfx: pop@SC0605-03, pop@SC0605-04, pop@SC0605-05, pop@SC0605-06, snip@SC0605-08, twist@SC0605-08, clamp@SC0605-09
- pages: 50, 51, 52
- purpose: U1→U2（U2AF）→U4・U5・U6→U1放出→U4放出→切断・投げ縄→エクソン連結の順序を正確に示す
- terms: snRNA, snRNP, スプライソソーム, U1, U2, U2AF, U4, U5, U6, 投げ縄構造（ラリアット）
splice[Happy]: いらっしゃい！ ぼくはスプライソソーム。イントロンを切り取って、エクソンをつなぐよ。 {cue=splice}
nuku[Neutral]: スプライソソームは、snRNAとタンパク質の複合体。snRNAはタンパク質と結合して、snRNPとして働く。 {cue=snrnp}
nuku[Neutral]: まず、U1 snRNPが、イントロンの5'末端のGU配列に結合する。U1 snRNAが、GUと塩基対をつくるんだ。 {cue=u1}
nuku[Neutral]: 続いて、U2AFがブランチ部位の下流に、U2 snRNPがブランチ部位に結合する。 {cue=u2}
nuku[Neutral]: 次に、U5、U4、U6 snRNPが集まり、すべての因子がそろう。 {cue=u456}
nuku[Neutral]: U1が放出されてGUが開放され、U5やU6が近づく。次にU4が放出され、U6はU2に結合する。 {cue=release}
akari[Neutral]: 部品が入れかわっていく。それで？
nuku[Neutral]: U6はGUとも塩基対をつくり、GUの5'側でRNAが切断される。そしてイントロン先頭のGが、ブランチ部位のAと結合して、投げ縄構造、ラリアットができる。 {cue=lariat}
nuku[Neutral]: U5は、AGの3'側で切断された後も、二つのエクソンが離れないように支える。 {cue=u5}
splice[Happy]: こうしてエクソンがつながり、イントロンは投げ縄の形で外れる。一丁あがり！ {cue=joined after=0.4}

## SC0606 選択的スプライシング
- visual: alt_splicing
- bgm: workshop
- bg: 1本のmRNA前駆体から、2種類の成熟mRNAが分岐する
- camera: 前駆体から2つの結果を並べて比較。後半はグルコキナーゼ遺伝子の地図
- chars: akari, nuku
- sfx: ping@SC0606-01, ping@SC0606-02, chime@SC0606-04
- pages: 49, 71
- purpose: 選択的スプライシングで1つの前駆体から複数のmRNAができること、選択的プロモーター利用の例を示す
- terms: 選択的スプライシング, グルコキナーゼ, 選択的プロモーター利用
nuku[Neutral]: E1からE4のエクソンをもつ前駆体。Aの場合は、E2を含む部分全体が1つのイントロンとなり、E1、E3、E4がつながる。 {say=イーワンからイーフォーのエクソンをもつぜんくたい。エーのばあいは、イーツーをふくむぶぶんぜんたいがひとつのイントロンとなり、イーワン、イースリー、イーフォーがつながる。 cue=caseA}
nuku[Neutral]: Bの場合は、E1、E2、E4がつながる。 {say=ビーのばあいは、イーワン、イーツー、イーフォーがつながる。 cue=caseB}
akari[Surprise]: 同じ前駆体から、違うmRNAができる！
nuku[Neutral]: これが選択的スプライシング。つなぎ方を変えれば、1つの遺伝子から何種類ものmRNAができる。だから遺伝子の数よりも多くのタンパク質が作られる。 {cue=more}
nuku[Neutral]: グルコキナーゼ遺伝子では、肝臓は1Lの、膵臓のB細胞や下垂体は約30キロ塩基対上流の1Bのプロモーターを使う。組織特異的な転写調節だ。 {say=グルコキナーゼいでんしでは、かんぞうは、いちエルの、すいぞうのビーさいぼうやかすいたいは、やくさんじゅっキロえんきついじょうりゅうの、いちビーのプロモーターをつかう。そしきとくいてきな、てんしゃちょうせつだ。 cue=gk after=0.4}

## SC0607 ファインマン・チェック⑤：スプライシング
- visual: feynman_check
- bgm: quiz
- bg: 板書（アカリの説明 → 詰まったところ → 言い直し）
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0607-02, buzz@SC0607-03, correct@SC0607-04
- pages: 48, 50, 51, 52
- purpose: アカリが自分の言葉でスプライシングを説明し、「エクソンを切り取って捨てる」という取り違えを正す
- terms: スプライシング, エクソン, イントロン, 投げ縄構造（ラリアット）
- card_title: スプライシングを、自分の言葉で
- card_try: エクソンを切り取って、捨てる作業
- card_wrong: エクソンを切り取って、捨てる
- card_gap: 逆。捨てられるのはイントロン。エクソンは残ってつながる。投げ縄になって外れるのもイントロン
- card_fix: GUとAGを目印に、イントロンを投げ縄の形で外し、エクソンどうしをつなぐ
nuku[Happy]: ファインマン・チェック。スプライシングを、ひとことで。 {cue=start}
akari[Neutral]: エクソンを切り取って、捨てる作業！ {cue=try after=0.6}
nuku[Neutral]: 逆だよ。捨てられるのはイントロン。エクソンは残って、つながる。投げ縄になって外れるのも、イントロンだ。 {cue=gap}
akari[Happy]: 言い直すね。GUとAGを目印に、イントロンを投げ縄の形で外して、エクソンどうしをつなぐ！ {cue=fix}
nuku[Happy]: そう。声に出して説明すると、取り違えに気づける。 {after=0.8}

## SC0608 完成したmRNA、核の外へ
- visual: gene_to_protein
- bgm: workshop
- bg: ヒト遺伝子の構造 → 転写 → スプライシング → 核膜孔をくぐるmRNA
- camera: 遺伝子の構造図から、核外へ出ていくmRNAを追う
- chars: akari, nuku
- sfx: whoosh@SC0608-03
- pages: 46, 53
- purpose: ヒト遺伝子の構造（UTR、開始・終止コドン、ポリAシグナル）と、成熟mRNAが核外へ運ばれる流れをまとめる
- terms: 5'非翻訳領域, 3'非翻訳領域, 開始コドン, 終止コドン, ポリアデニル化シグナル
nuku[Neutral]: ヒトの遺伝子をまとめよう。プロモーター、5'非翻訳領域、開始コドンATG、エクソンとイントロン、終止コドン、3'非翻訳領域、ポリアデニル化シグナル。 {say=ヒトのいでんしをまとめよう。プロモーター、ゴダッシュひほんやくりょういき、かいしコドン、エーティージー、エクソンとイントロン、しゅうしコドン、サンダッシュひほんやくりょういき、ポリアデニルかシグナル。 cue=structure}
nuku[Neutral]: 転写でTはUになり、スプライシングでエクソンだけがつながる。翻訳では、AUGから、3つの塩基が1つのアミノ酸に対応する。 {say=てんしゃでティーはユーになり、スプライシングでエクソンだけがつながる。ほんやくでは、エーユージーから、みっつのえんきが、ひとつのアミノさんにたいおうする。 cue=codon}
akari[Happy]: 帽子としっぽをつけて、イントロンを切ったmRNAが、核の外へ出発！ {cue=export after=0.8}

# CHAPTER 7 小さなRNAの大きな役割

## SC0701 ゲノムの中のRNA遺伝子
- visual: genome_pie
- bgm: discovery
- bg: ゲノムの構成を示す円グラフと、転写物の内訳
- camera: 円グラフから、アミノ酸指定配列 約1.3%の細い扇形へズーム
- chars: akari, nuku
- sfx: ping@SC0701-02, chime@SC0701-04
- pages: 54, 55, 56
- purpose: ゲノムの構成、転写物の内訳、非コードRNA遺伝子の定義を示す
- terms: ゲノム, アミノ酸指定配列, ノンコーディングRNA（ncRNA）
narr[Neutral]: チャプター7。小さなRNAの大きな役割。 {before=0.6 after=0.4}
nuku[Neutral]: 約30億塩基対のヒト核ゲノムのうち、アミノ酸を指定する配列は、約1.3パーセントしかない。 {say=やくさんじゅうおくえんきついの、ヒトかくゲノムのうち、アミノさんをしていするはいれつは、やくいってんさんパーセントしかない。 cue=pie}
akari[Surprise]: たったそれだけ？
nuku[Neutral]: 全転写物6万483種類のうち、メッセンジャーRNAは1万9814種類、ノンコーディングRNAは2万5794種類だ。 {say=ぜんてんしゃぶつ、ろくまんよんひゃくはちじゅうさんしゅるいのうち、メッセンジャーアールエヌエーは、いちまんきゅうせんはっぴゃくじゅうよんしゅるい、ノンコーディングアールエヌエーは、にまんごせんななひゃくきゅうじゅうよんしゅるいだ。 cue=counts}
nuku[Neutral]: 機能性産物がRNAそのものである遺伝子を、ncRNA遺伝子という。その多くは、まだ機能が解明されていない。 {cue=ncrna after=0.4}

## SC0702 rRNA：リボソームをつくるRNA
- visual: rrna_ribosome
- bgm: discovery
- bg: 真核生物のリボソーム（80S＝60S＋40S）と、45S前駆体のプロセシング
- camera: リボソームを分解して4種のrRNAを並べ、45S前駆体へ
- chars: akari, nuku
- sfx: pop@SC0702-01, snip@SC0702-03
- pages: 59, 60, 62, 63
- purpose: リボソームの構成、rRNAの多コピー性、45S前駆体のプロセシング、Pol Iのプロモーターを示す
- terms: rRNA, リボソーム, 80S, 60S, 40S, 45S rRNA前駆体
nuku[Neutral]: リボソームは、翻訳を担う、タンパク質とrRNAの複合体。真核生物の80Sリボソームは、60Sと40Sからなり、rRNAを4種類含む。 {say=リボソームは、ほんやくをになう、タンパクしつとアールアールエヌエーのふくごうたい。しんかくせいぶつの、はちじゅうエスリボソームは、ろくじゅうエスと、よんじゅうエスからなり、アールアールエヌエーをよんしゅるいふくむ。 cue=subunits}
nuku[Neutral]: rRNAは、翻訳のたびに使われるリボソームの材料で、常に大量に必要だ。だから遺伝子が多コピーある。 {cue=copies why=rRNAの遺伝子は多コピーなのか}
nuku[Neutral]: 18S、5.8S、28Sは、1つの45S前駆体としてRNAポリメラーゼIで合成され、プロセシングで3つに分かれるんだ。 {say=じゅうはちエス、ごてんはちエス、にじゅうはちエスは、ひとつの、よんじゅうごエスぜんくたいとして、アールエヌエーポリメラーゼワンでごうせいされ、プロセシングでみっつにわかれるんだ。 cue=45s after=0.4}

## SC0703 tRNA：アミノ酸の運び屋
- visual: trna
- bgm: discovery
- bg: tRNAのクローバー葉構造
- camera: クローバー葉構造からアンチコドンループへ寄る
- chars: akari, nuku
- sfx: ping@SC0703-01, pop@SC0703-03
- pages: 59, 60, 64
- purpose: tRNAの役割と構造、修飾、Pol IIIの遺伝子内部プロモーターを示す
- terms: tRNA, アンチコドン, コドン, 内部制御領域
nuku[Neutral]: tRNAは、リボソームにアミノ酸を運び、アンチコドンでコドンを読み取る。高度に修飾されていて、修飾はコドンの識別などに関係する。 {cue=trna}
akari[Neutral]: tRNAを転写するのは、RNAポリメラーゼIIIだったよね。
nuku[Happy]: そう。そのプロモーターは、遺伝子の内部にあるんだ。rRNAもtRNAも、翻訳されずにRNAのまま働く。 {say=そう。そのプロモーターは、いでんしのないぶにあるんだ。アールアールエヌエーも、ティーアールエヌエーも、ほんやくされずに、アールエヌエーのままはたらく。 cue=internal after=0.4}

## SC0704 miRNAの誕生
- visual: mirna_pathway
- bgm: discovery
- bg: 核と細胞質をまたぐmiRNAの生成経路
- camera: 核内のpri-miRNAから、核膜を越えて細胞質のRISCへ
- chars: akari, nuku, mina
- sfx: snip@SC0704-03, whoosh@SC0704-04, snip@SC0704-05, clamp@SC0704-06
- pages: 56, 67
- purpose: pri-miRNA→Drosha→pre-miRNA→Exportin 5→Dicer→成熟miRNA→RISCの流れを示す
- terms: miRNA, pri-miRNA, Drosha, pre-miRNA, Exportin 5, Dicer, RISC
mina[Happy]: はじめまして！ わたしはマイクロRNA。約22塩基しかない、短いRNAよ。 {say=はじめまして！ わたしは、マイクロアールエヌエー。やくにじゅうにえんきしかない、みじかいアールエヌエーよ。 cue=mina}
mina[Neutral]: 最初は、RNAポリメラーゼIIで、長いpri-miRNAとして転写されるの。 {cue=pri}
nuku[Neutral]: 核の中で、Droshaが60から70ヌクレオチドのpre-miRNAに切り出す。 {cue=drosha}
nuku[Neutral]: pre-miRNAは、Exportin 5で細胞質へ運ばれる。 {cue=exportin}
nuku[Neutral]: 細胞質では、Dicerが21から23ヌクレオチドの成熟型にする。 {cue=dicer}
nuku[Neutral]: 成熟したmiRNAは、RISCという複合体をつくって、遺伝子発現の抑制に働く。 {cue=risc}
akari[Neutral]: Drosha、Exportin 5、Dicer、RISC。核の中から外へ、だね。 {say=ドローシャ、エクスポーチンファイブ、ダイサー、リスク。かくのなかからそとへ、だね。 after=0.4}

## SC0705 miRNAのはたらき
- visual: mirna_action
- bgm: discovery
- bg: 細胞質。mRNAにmiRNAが結合し、タンパク質合成が抑えられる
- camera: 2本のmRNAを並べ、片方だけにmiRNAが結合する
- chars: akari, nuku, mina
- sfx: clamp@SC0705-01, crumble@SC0705-02
- pages: 56, 67
- purpose: miRNAが標的mRNAに結合して翻訳を抑制すること、その規模を示す
- terms: 標的mRNA, 翻訳抑制
mina[Neutral]: わたしの仕事は、標的のmRNAに結合して、その翻訳を抑えること。 {cue=bind}
nuku[Neutral]: 資料の図では、miRNAが結合したmRNAは分解され、タンパク質合成に使われない。 {cue=degrade}
akari[Neutral]: mRNAはタンパク質の情報を運ぶ。miRNAは、そのmRNAを止める側なんだね。
nuku[Neutral]: miRNAは1000以上が同定され、タンパク質コード遺伝子の30パーセント以上を抑えると推測されている。 {say=マイクロアールエヌエーは、せんいじょうがどうていされ、タンパクしつコードいでんしの、さんじゅっパーセントいじょうを、おさえるとすいそくされている。 after=0.4}

## SC0706 lncRNAとsnoRNA
- visual: lncrna
- bgm: discovery
- bg: mRNAとlncRNAの比較図（どちらもキャップとポリA。lncRNAは翻訳されない）
- camera: 上下の比較
- chars: akari, nuku
- sfx: ping@SC0706-01, buzz@SC0706-02
- pages: 56, 66, 68, 69
- purpose: lncRNAの定義と、mRNAとの共通点・相違点、snoRNAの役割を示す
- terms: lncRNA, ORF, snoRNA
nuku[Neutral]: lncRNAは、200塩基以上で、潜在的な読み枠が100アミノ酸残基以下の、長い非コードRNA。 {say=エルエヌシーアールエヌエーは、にひゃくえんきいじょうで、せんざいてきなよみわくが、ひゃくアミノさんざんきいかの、ながいひコードアールエヌエー。 cue=lnc}
nuku[Neutral]: mRNAと同じく、キャップ、ポリA、スプライシングまで受けるけれど、翻訳はされない。遺伝子発現の調節などに関わる。 {cue=notranslate}
nuku[Neutral]: snoRNAは核小体低分子RNA。rRNAの修飾に関わるRNAだ。 {cue=sno after=0.4}

## SC0707 ncRNAと疾患
- visual: ncrna_disease
- bgm: somber
- bg: 13番染色体と15番染色体の模式図。欠失部分が点滅
- camera: 13番 → 15番へパン
- chars: akari, nuku
- sfx: soft@SC0707-01, soft@SC0707-02
- pages: 56
- purpose: ncRNA遺伝子群の欠失と疾患（Feingold症候群、Prader-Willi症候群）を資料の記載どおりに示す
- terms: Feingold症候群, Prader-Willi症候群, 欠失
nuku[Neutral]: 13番染色体のmiRNA遺伝子群の欠失は、小頭症、低身長、手指の奇形を特徴とする骨格系の疾患、ファインゴールド症候群を引き起こす。 {say=じゅうさんばんせんしょくたいの、マイクロアールエヌエーいでんしぐんのけっしつは、しょうとうしょう、ていしんちょう、しゅしのきけいをとくちょうとする、こっかくけいのしっかん、ファインゴールドしょうこうぐんをひきおこす。 cue=feingold}
nuku[Neutral]: 15番染色体のsnoRNA遺伝子群の欠失は、肥満、性腺機能低下、認知障害を特徴とする、プラダー・ウィリー症候群を引き起こす。 {say=じゅうごばんせんしょくたいの、スノーアールエヌエーいでんしぐんのけっしつは、ひまん、せいせんきのうていか、にんちしょうがいをとくちょうとする、プラダーウィリーしょうこうぐんをひきおこす。 cue=pws}
akari[Sad]: タンパク質を作らないRNAでも、なくなると病気につながるんだね。 {after=0.8}

## SC0708 ファインマン・チェック⑥：非コードRNA
- visual: feynman_check
- bgm: quiz
- bg: 板書（アカリの説明 → 詰まったところ → 言い直し）
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0708-02, buzz@SC0708-03, correct@SC0708-04
- pages: 56, 59, 67, 71
- purpose: アカリが自分の言葉で非コードRNAを説明し、「タンパク質を作らないRNAはおまけ」という誤解を正す
- terms: 非コードRNA, rRNA, tRNA, miRNA
- card_title: 非コードRNAを、自分の言葉で
- card_try: タンパク質を作らないRNAは、おまけのようなもの
- card_wrong: おまけのようなもの
- card_gap: rRNAとtRNAは翻訳そのものを担い、miRNAは遺伝子発現を抑える。欠失で病気になるものもある（p.56）
- card_fix: タンパク質にならず、RNAのまま働く。翻訳や発現の調節を担い、失われると病気につながる
nuku[Happy]: ファインマン・チェック。非コードRNAを説明してみて。 {cue=start}
akari[Neutral]: タンパク質を作らないRNAだから、おまけみたいなもの？ {cue=try after=0.6}
nuku[Neutral]: そこが詰まりどころ。rRNAとtRNAは翻訳そのものを担い、miRNAは遺伝子発現を抑える。欠失で病気になるものもあったよね。 {cue=gap}
akari[Happy]: 言い直すね。非コードRNAは、タンパク質にならず、RNAのまま働く。翻訳や発現の調節を担い、失われると病気につながる！ {cue=fix}
nuku[Happy]: その通り。 {after=0.8}

# CHAPTER 8 遺伝子発現と疾患

## SC0801 カドミウムとメタロチオネイン
- visual: metallothionein
- bgm: somber
- bg: メタロチオネイン遺伝子の上流領域（GRE、エンハンサー、MRE、GC、TATA）と、細胞に入ってくるCd²⁺
- camera: 上流領域の地図から、MREに転写因子が結合する場面へ
- chars: akari, nuku
- sfx: ping@SC0801-02, glow@SC0801-03, soft@SC0801-05
- pages: 39
- purpose: 応答配列（MRE）による転写調節と負のフィードバック、カドミウムの毒性に関する資料の記載を示す
- terms: メタロチオネイン, MRE（金属応答配列）, カドミウム, 応答配列
narr[Neutral]: チャプター8。遺伝子発現と疾患。 {before=0.6 after=0.4}
nuku[Neutral]: 応答配列の例が、メタロチオネイン遺伝子。上流に、金属応答配列のMREが並んでいる。 {say=おうとうはいれつのれいが、メタロチオネインいでんし。じょうりゅうに、きんぞくおうとうはいれつの、エムアールイーがならんでいる。 cue=map}
nuku[Neutral]: カドミウムイオンが入ると、活性化された転写因子がMREに結合して、転写を活性化する。 {say=カドミウムイオンがはいると、かっせいかされたてんしゃいんしが、エムアールイーにけつごうして、てんしゃをかっせいかする。 cue=activate}
nuku[Neutral]: 増えたメタロチオネインがカドミウムに結合し、細胞内のカドミウムイオンが減ると、転写因子は活性化されず、さらなる発現は起こらない。 {cue=stop}
akari[Happy]: 必要なときだけ作って、終わったら止まる仕組みだね。でも、なぜ止める必要があるの？ {why=発現を止める仕組みが要るのか}
nuku[Neutral]: カドミウムが減っても作り続けたら、無駄になる。結果が原因を打ち消すと発現が止まる、負のフィードバックだ。
nuku[Neutral]: 資料によると、カドミウムは酵素のチオール基、カルボキシル基、アミノ基と相互作用して酵素活性を阻害し、肝臓障害、骨軟化症、高血圧などを引き起こす。 {cue=toxic}
nuku[Neutral]: ヒトは食物から75から100マイクログラムをとり、喫煙でも余分にとっている。タバコ1本に約2マイクログラムだ。 {say=ヒトはしょくもつから、ななじゅうごから、ひゃくマイクログラムをとり、きつえんでもよぶんにとっている。タバコいっぽんに、やくにマイクログラムだ。 cue=smoke after=0.4}

## SC0802 時計遺伝子のループ
- visual: clock_loop
- bgm: somber
- bg: 昼と夜が回る背景。BMAL1/CLOCK → E-box → Per, Cry → 抑制 のループ
- camera: ループを一周するようにカメラが回る
- chars: akari, nuku
- sfx: tick@SC0802-01, ping@SC0802-02, ping@SC0802-03
- pages: 40, 41, 42
- purpose: 時計遺伝子による転写のフィードバックループ（BMAL1/CLOCK、PER/CRY、Rev-erbα/RORα）と、時計が必要な理由を示す
- terms: 時計遺伝子, BMAL1, CLOCK, PER, CRY, E-box, Rev-erbα, RORα, RRE
nuku[Neutral]: 体には約24時間のリズムを刻む時計がある。脳の時計は睡眠や摂食に、末梢の時計は脂肪合成やインスリン分泌などに関わる。 {cue=clock}
akari[Neutral]: なぜ体に、時計が要るの？ {why=体に時計が要るのか}
nuku[Neutral]: 資料では、太陽のエネルギーを効率よく、安全に利用するためと説明されている。時計遺伝子は、ほとんどの生物に見られるんだ。
nuku[Neutral]: BMAL1とCLOCKが、E-boxに結合して、PerやCry、Rev-erbα、RORαの転写を活性化する。 {say=ビーマルワンとクロックが、イーボックスにけつごうして、パーや、クライ、レバーブアルファ、ロアアルファの、てんしゃをかっせいかする。 cue=activate}
nuku[Neutral]: できたPERとCRYは、BMAL1とCLOCKのはたらきを抑える。自分を作る転写を、自分で止めるんだ。 {say=できたパーとクライは、ビーマルワンとクロックのはたらきをおさえる。じぶんをつくるてんしゃを、じぶんでとめるんだ。 cue=inhibit}
nuku[Neutral]: Rev-erbαはRREを介してBMAL1の転写を抑え、RORαは活性化する。このフィードバックループがリズムを生む。 {say=レバーブアルファは、アールアールイーをかいして、ビーマルワンのてんしゃをおさえ、ロアアルファはかっせいかする。このフィードバックループがリズムをうむ。 cue=rre}
akari[Happy]: 転写のオンとオフが、時計の針になってるんだ！
nuku[Neutral]: 作られたものが、自分を作る転写を止める。止まれば減り、減ればまた作られる。だから、くり返しのリズムが生まれるんだ。 {why=フィードバックループからリズムが生まれるのか after=0.4}

## SC0803 ファインマン・チェック⑦：体内時計
- visual: feynman_check
- bgm: quiz
- bg: 板書（アカリの説明 → 詰まったところ → 言い直し）
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0803-02, buzz@SC0803-03, correct@SC0803-04
- pages: 40, 41
- purpose: アカリが自分の言葉で時計遺伝子のループを説明し、「作って終わり」という誤解（負のフィードバックの欠落）を正す
- terms: 時計遺伝子, BMAL1, CLOCK, PER, CRY
- card_title: 体内時計の仕組みを、自分の言葉で
- card_try: BMAL1とCLOCKが、PerとCryを作って、それで終わり
- card_wrong: それで終わり
- card_gap: できたPERとCRYが、BMAL1とCLOCKのはたらきを抑える。ここがループの要
- card_fix: 作られたPERとCRYが、自分を作る転写を止める。減るとまた作られる。このくり返しが約24時間のリズム
nuku[Happy]: ファインマン・チェック。体内時計の仕組みを説明してみて。 {cue=start}
akari[Neutral]: BMAL1とCLOCKが、PerとCryを作る。それで終わり！ {say=ビーマルワンとクロックが、パーとクライをつくる。それでおわり！ cue=try after=0.6}
nuku[Neutral]: 終わりじゃないんだ。できたPERとCRYが、BMAL1とCLOCKのはたらきを抑える。そこがループの要だよ。 {say=おわりじゃないんだ。できたパーとクライが、ビーマルワンとクロックのはたらきをおさえる。そこがループのかなめだよ。 cue=gap}
akari[Happy]: 言い直すね。作られたPERとCRYが、自分を作る転写を止める。減ると、また作られる。このくり返しが、約24時間のリズムになる！ {say=いいなおすね。つくられたパーとクライが、じぶんをつくるてんしゃをとめる。へると、また、つくられる。このくりかえしが、やくにじゅうよじかんのリズムになる！ cue=fix}
nuku[Happy]: よくできました。 {after=0.8}

## SC0804 時計の乱れと病気
- visual: clock_disease
- bgm: somber
- bg: ひびの入った時計と、疾患名の矢印。下段に遺伝子欠損マウスの表
- camera: 時計から各矢印へ
- chars: akari, nuku
- sfx: crack@SC0804-02
- pages: 42, 43
- purpose: 時計遺伝子の異常・欠損マウスの表現型と、概日時計の破綻に関連する疾患を資料の範囲で示す
- terms: 概日時計, 時計遺伝子欠損マウス
nuku[Neutral]: 時計遺伝子に異常のあるマウスでは、高脂血症、高血糖、耐糖能異常、肥満、食塩感受性高血圧などがみられる。 {cue=mice}
nuku[Neutral]: 資料の図では、遺伝的な要因、交代勤務や睡眠不足などの環境要因、加齢による概日時計の破綻が、睡眠障害、がん、気分障害、メタボリックシンドローム、炎症と結びつけて示されている。 {cue=human}
nuku[Neutral]: 図が示すのは関連で、詳しいしくみまでは書かれていない。関連として覚えておこう。 {after=0.4}

## SC0805 ミトコンドリアゲノムの転写
- visual: mito
- bgm: somber
- bg: 細胞質のミトコンドリア。中の環状ゲノム（16,569 bp）
- camera: ミトコンドリアに飛び込み、環状ゲノムの周りを一周
- chars: akari, nuku
- sfx: whoosh@SC0805-01, ping@SC0805-03
- pages: 72
- purpose: ミトコンドリアゲノムの転写の特徴を、核の転写と比較して示す
- terms: ミトコンドリアゲノム, ミトコンドリア特異的RNAポリメラーゼ, 環状ゲノム
akari[Surprise]: ここは核の外？ 袋の中に、輪っかのDNAがある！ {before=0.4}
nuku[Neutral]: ミトコンドリアの、約16kbの環状ゲノムだ。遺伝子は37個で、呼吸鎖やミトコンドリアの翻訳系などに使われる。 {say=ミトコンドリアの、やくじゅうろくキロベースの、かんじょうゲノムだ。いでんしはさんじゅうななこで、こきゅうさや、ミトコンドリアのほんやくけいなどにつかわれる。 cue=genome}
nuku[Neutral]: 核ゲノムとは異なる転写系をもち、核ゲノムにコードされたミトコンドリア特異的RNAポリメラーゼが転写する。 {cue=polymerase}
nuku[Neutral]: 各鎖は全体が転写され、それがプロセッシングされて、mRNA、tRNA、rRNAになる。 {cue=whole}
akari[Neutral]: 鎖まるごと写して、あとで切り分けるんだね。 {after=0.8}

# CHAPTER 9 最終試験

## SC0901 冒険のふりかえり：自分の言葉で
- visual: review
- bgm: hopeful
- bg: これまでのステージがカードとして並ぶ
- camera: カードを1枚ずつめくる
- chars: akari, nuku
- sfx: card@SC0901-02, card@SC0901-03, card@SC0901-04, card@SC0901-05
- pages: 71
- purpose: アカリが全体を自分の言葉で説明し（最後のファインマン・チェック）、講義のまとめを確認する
- terms: 遺伝子の発現, 鋳型鎖, プロモーター, 選択的スプライシング, 非翻訳RNA
narr[Neutral]: チャプター9。最終試験。 {before=0.6 after=0.4}
nuku[Neutral]: 最後のファインマン・チェック。今日の冒険を、難しい言葉なしで、ひと続きに説明してみて。 {cue=c1}
akari[Neutral]: 設計図のDNAは核の中。タンパク質を作るのは核の外。だから、必要な部分だけを、向かい合う文字を並べてRNAに写し、持ち出す。 {cue=c2}
akari[Neutral]: どこから写すかはプロモーターが決める。いつ、どれだけ写すかは、転写因子やエンハンサー、クロマチンが決める。 {cue=c3}
akari[Neutral]: 写したRNAは、帽子としっぽで守られ、イントロンを外してから、核の外へ。RNAのまま働くものもある。 {cue=c4}
nuku[Happy]: 見事だ。一つ一つに「なぜ」があったね。では、最終試験を始めよう！ {after=0.6}

## SC0902 第1問
- visual: quiz
- bgm: quiz
- bg: クイズ画面
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0902-02, correct@SC0902-03
- pages: 7, 8, 10
- purpose: RNA合成の方向と鋳型の確認
- terms: 鋳型鎖, 5'→3'
- quiz: Q1
narr[Neutral]: 第1問。RNAポリメラーゼについて、正しいものはどれ？ {cue=question after=1.5}
narr[Neutral]: 考える時間は5秒。 {after=5.0 cue=think}
narr[Neutral]: 正解はB。鋳型鎖を3'から5'に読み、RNAを5'から3'に合成する。 {cue=answer}
nuku[Neutral]: Aは向きが逆。鋳型になるのは鋳型鎖で、材料はdNTPではなく、ATP、UTP、CTP、GTPだよ。 {say=エーはむきがぎゃく。いがたになるのはいがたさで、ざいりょうは、ディーエヌティーピーではなく、エーティーピー、ユーティーピー、シーティーピー、ジーティーピーだよ。 cue=explain after=0.6}

## SC0903 第2問
- visual: quiz
- bgm: quiz
- bg: クイズ画面
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0903-02, correct@SC0903-03
- pages: 18, 30, 33, 34
- purpose: 原核と真核のプロモーターの区別
- terms: −10ボックス, −35ボックス, TATAボックス
- quiz: Q2
narr[Neutral]: 第2問。大腸菌のプロモーターで、RNAポリメラーゼが結合する目印は？ {cue=question after=1.5}
narr[Neutral]: 考える時間は5秒。 {after=5.0 cue=think}
narr[Neutral]: 正解はB。−10ボックスと−35ボックス。 {say=せいかいはビー。マイナスじゅうボックスと、マイナスさんじゅうごボックス。 cue=answer}
nuku[Neutral]: TATAボックスとGCボックスは真核生物のプロモーター、エンハンサーも真核生物の調節配列だ。 {cue=explain after=0.6}

## SC0904 第3問
- visual: quiz
- bgm: quiz
- bg: クイズ画面
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0904-02, correct@SC0904-03
- pages: 30, 32, 46
- purpose: 転写基本因子の役割の区別
- terms: TFIIH, TBP, TFIIB, CTD
- quiz: Q3
narr[Neutral]: 第3問。TFIIHのはたらきとして、正しいものはどれ？ {cue=question after=1.5}
narr[Neutral]: 考える時間は5秒。 {after=5.0 cue=think}
narr[Neutral]: 正解はC。DNAをほどき、CTDのSer5をリン酸化する。 {say=せいかいはシー。ディーエヌエーをほどき、シーティーディーの、セリンファイブを、リンさんかする。 cue=answer}
nuku[Neutral]: TATAボックスを識別するのはTBP、BRE配列はTFIIB。5'キャップはキャッピング酵素のしごとだ。 {cue=explain after=0.6}

## SC0905 第4問
- visual: quiz
- bgm: quiz
- bg: クイズ画面
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0905-02, correct@SC0905-03
- pages: 46, 50, 51, 52
- purpose: スプライシングの基本と順序の確認
- terms: GT-AG則, U1 snRNP, 投げ縄構造
- quiz: Q4
narr[Neutral]: 第4問。スプライシングについて、正しいものはどれ？ {cue=question after=1.5}
narr[Neutral]: 考える時間は5秒。 {after=5.0 cue=think}
narr[Neutral]: 正解はB。最初にU1 snRNPが、イントロンの5'末端のGUに結合する。 {cue=answer}
nuku[Neutral]: イントロンはGTで始まりAGで終わる。投げ縄になるのはイントロン。スプライシングは核の中で行われるよ。 {cue=explain after=0.6}

## SC0906 第5問
- visual: quiz
- bgm: quiz
- bg: クイズ画面
- camera: 固定
- chars: akari, nuku
- sfx: tick@SC0906-02, correct@SC0906-03
- pages: 67
- purpose: miRNAの成熟経路の順序の確認
- terms: Drosha, Exportin 5, Dicer, RISC
- quiz: Q5
narr[Neutral]: 第5問。miRNAが成熟して働くまでの順番として、正しいものは？ {say=だいごもん。マイクロアールエヌエーが、せいじゅくしてはたらくまでのじゅんばんとして、ただしいものは？ cue=question after=1.5}
narr[Neutral]: 考える時間は5秒。 {after=5.0 cue=think}
narr[Neutral]: 正解はB。Drosha、Exportin 5、Dicer、そしてRISC。 {say=せいかいはビー。ドローシャ、エクスポーチンファイブ、ダイサー、そしてリスク。 cue=answer}
nuku[Neutral]: 核の中で切るDrosha、運び出すExportin 5、細胞質で切るDicer。場所と一緒に覚えよう。 {say=かくのなかできるドローシャ、はこびだすエクスポーチンファイブ、さいぼうしつできるダイサー。ばしょといっしょにおぼえよう。 cue=explain after=0.6}

## SC0907 エンディング
- visual: ending
- bgm: ending
- bg: 夜明けの研究室。窓の外に光る二重らせん
- camera: アカリの横顔から窓の外へ、そしてクレジット
- chars: akari, nuku
- sfx: sparkle@SC0907-01
- pages: 71
- purpose: 4つの主要テーマ（転写・転写調節・RNAプロセシング・非コードRNA）をまとめて終える
- terms: 転写, 転写調節, RNAプロセシング, 非コードRNA
nuku[Happy]: 全問クリア、おめでとう。今日の冒険を四つにまとめよう。 {cue=summary}
nuku[Neutral]: 転写。RNAポリメラーゼが鋳型鎖を読み、RNAを5'から3'へ合成する。 {cue=t1}
nuku[Neutral]: 転写調節。プロモーター、転写因子、エンハンサー、クロマチンが、必要な遺伝子を働かせる。 {cue=t2}
nuku[Neutral]: RNAプロセシング。キャップ、ポリA、スプライシングで、成熟したmRNAになる。 {cue=t3}
nuku[Neutral]: 非コードRNA。rRNA、tRNA、miRNA、lncRNAのように、RNAのまま働くものがある。 {cue=t4}
akari[Happy]: 設計図は、写して、整えて、届けて、はじめて働くんだね。明日の講義、楽しみになってきた！ {cue=akari_end}
nuku[Happy]: また細胞の中で会おう。 {after=1.0 cue=bye}
narr[Neutral]: ジーン・クエスト。おしまい。 {say=ジーンクエスト。おしまい。 after=10.0 cue=credits}
