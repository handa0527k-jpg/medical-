import './style.css';
import { Stage } from './core/stage';
import { Hud } from './core/hud';
import { Manipulator, manipToolbar, type ManipMode } from './core/manipulate';
import { h, Mission, progressOf, quiz } from './core/ui';
import { loadDnaTemplate } from './core/dna';
import { LABS, labInfo, type LabInfo } from './content/labs';

export interface LabEnv {
  stage: Stage;
  manip: Manipulator;
  hud: Hud;
  panel: HTMLElement;
  mission: Mission;
  info: LabInfo;
}
export type LabModule = { mount(env: LabEnv): Promise<void> | void };

const BASE = import.meta.env.BASE_URL;

const FILMS = [
  { id: 'restriction', img: '1BHM', len: '約4分', title: '制限酵素とDNAリガーゼ', text: '本物のBamHI（PDB 1BHM）が回文配列を見つけて切り、付着末端ができ、DNAリガーゼ（1X9N）がニックをふさぐまで。BamHI＋BglII のつなぎ替えも。' },
  { id: 'cloning', img: 'plasmid', len: '約4分', title: 'プラスミドでクローニング', text: 'pUC18に遺伝子を入れ、大腸菌に形質転換し、アンピシリンと青白選択で選び、増やして取り出す。発現ベクターでGFPを作らせるまで。' },
  { id: 'pcr', img: '3KTQ', len: '約4分', title: 'PCR：DNAを何十億倍にも増やす', text: '1サイクル目を原子レベルで（95℃・55℃・72℃、Taqポリメラーゼ）。3サイクル目に目的の長さが現れ、2ⁿ−2n で増えるしくみと、リアルタイムPCRのCt値。' },
  { id: 'sanger', img: '3KTQ', len: '約7分', title: 'サンガー法：DNAの文字を一文字ずつ読む', text: '本物のddCTP（PDB 3KTQ）と原子レベルのDNAで、3′-OH がなぜ大事か、ddNTP でなぜ止まるのか、止まった長さからどう配列が読めるのか。' },
  { id: 'crispr', img: '5F9R', len: '約5分', title: 'CRISPR-Cas9：狙った場所で切る', text: 'Cas9（PDB 5F9R）がPAMを探してDNAをほどき、R-loopをつくって切る。NHEJのフレームシフト、HDRのノックイン、dCas9のエピゲノム編集まで。' },
];
const loaders: Record<string, () => Promise<LabModule>> = {
  restriction: () => import('./labs/restriction'),
  cloning: () => import('./labs/cloning'),
  pcr: () => import('./labs/pcr'),
  sanger: () => import('./labs/sanger'),
  crispr: () => import('./labs/crispr'),
  gallery: () => import('./labs/gallery'),
};

const app = document.getElementById('app')!;
let stage: Stage | null = null;
let manip: Manipulator | null = null;

// keyboard: V = 視点, G = 移動, R = 回転 (one handler for whichever lab is open)
addEventListener('keydown', (e) => {
  if (!manip || (e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
  const m: Record<string, ManipMode> = { v: 'view', g: 'move', r: 'rotate' };
  if (m[e.key]) manip.setMode(m[e.key]);
});

function topbar(lab?: LabInfo) {
  const quality = h('button', {
    class: 'ghost small', title: '影と陰影（アンビエントオクルージョン）の切り替え',
    onclick: () => {
      if (!stage) return;
      stage.setQuality(stage.quality === 'high' ? 'low' : 'high');
      quality.textContent = stage.quality === 'high' ? '画質：高' : '画質：軽量';
    },
  }, '画質');
  return h('header', { class: 'topbar' },
    h('a', { class: 'brand', href: '#/' }, h('span', { class: 'logo' }, 'GENE LAB'), h('span', { class: 'logo3d' }, '3D')),
    lab ? h('div', { class: 'crumb' }, h('span', { class: 'no' }, lab.no), h('b', {}, lab.title)) : h('div', { class: 'crumb' }, '組換えDNA技術を、手で動かして学ぶ'),
    lab ? quality : null,
    lab ? h('a', { class: 'ghost small', href: '#/models' }, '3D図鑑') : h('a', { class: 'ghost small', href: '#/models' }, '3Dモデル図鑑'),
    lab ? h('a', { class: 'ghost small', href: '#/' }, 'ラボ一覧') : null);
}

function home() {
  stage?.dispose();
  stage = null;
  manip = null;
  document.title = 'GENE LAB 3D — 組換えDNA技術を手で動かして学ぶ';
  const cards = LABS.map((l) => {
    const p = progressOf(l.id, l.tasks.length);
    return h('a', { class: 'lab-card', href: `#/lab/${l.id}` },
      h('div', { class: 'art' }, h('img', { src: `${BASE}renders/${l.art}.jpg`, alt: '', loading: 'lazy' })),
      h('div', { class: 'meta' },
        h('span', { class: 'no' }, l.no + ' ' + l.en),
        h('h2', {}, l.title),
        h('p', {}, l.lead),
        h('div', { class: 'foot' },
          h('span', { class: 'pdb' }, l.pdb.length ? 'PDB ' + l.pdb.join(' · ') : ''),
          h('span', { class: 'prog' }, h('i', { style: `width:${Math.round(p * 100)}%` }), `${Math.round(p * 100)}%`))));
  });
  app.replaceChildren(
    topbar(),
    h('main', { class: 'home' },
      h('section', { class: 'hero' },
        h('div', { class: 'hero-text' },
          h('p', { class: 'kicker' }, '遺伝医学｜組換えDNA技術・遺伝子導入技術'),
          h('h1', {}, '本物の分子を、', h('br'), '自分の手で動かす。'),
          h('p', {}, 'ここに出てくる酵素やウイルスは、すべてX線結晶構造解析で決められた原子座標（Protein Data Bank）から作った実物の形です。制限酵素を運んで切り、温度を変えてPCRを回し、Cas9でゲノムを編集してみましょう。'),
          h('div', { class: 'row' },
            h('a', { class: 'primary big', href: '#/lab/restriction' }, 'ラボ01からはじめる'),
            h('a', { class: 'ghost big', href: '#/models' }, '3Dモデル図鑑'))),
        h('div', { class: 'hero-art' }, h('img', { src: `${BASE}renders/5F9R.jpg`, alt: 'Cas9–sgRNA–DNA複合体（PDB 5F9R）' }),
          h('span', {}, 'Cas9–sgRNA–DNA（PDB 5F9R）'))),
      h('section', { class: 'films' },
        h('h3', {}, '授業動画（ナレーションつき3Dアニメ）'),
        h('div', { class: 'film-grid' }, ...FILMS.map((f) =>
          h('a', { class: 'film-card', href: `${BASE}film.html?id=${f.id}` },
            h('div', { class: 'art' }, h('img', { src: `${BASE}renders/${f.img}.jpg`, alt: '' }), h('span', { class: 'play' }, '▶')),
            h('div', { class: 'meta' },
              h('span', { class: 'no' }, `授業動画 ・ ${f.len}`),
              h('h2', {}, f.title),
              h('p', {}, f.text)))))),
      h('section', { class: 'grid' }, ...cards),
      h('section', { class: 'timeline' },
        h('h3', {}, '講義の年表から'),
        h('ol', {},
          ...[['1953', 'Watson・Crick：DNA二重らせんモデル', 'すべてのラボのDNAは、この構造（B型DNA, PDB 1BNA）から組み立てています'],
            ['1975〜77', 'Sanger ほか：迅速なDNA塩基配列決定法', 'ラボ04'],
            ['1985', 'Mullis ほか：PCRの発明', 'ラボ03'],
            ['2004', 'ヒトゲノム配列「完成版」の公表', ''],
            ['2012〜', 'CRISPR-Cas9によるゲノム編集', 'ラボ05']]
            .map(([y, t, s]) => h('li', {}, h('b', {}, y), h('span', {}, t), s ? h('small', {}, s) : null)))),
      h('footer', { class: 'credits' },
        h('p', {}, '分子構造：RCSB Protein Data Bank（各ラボに出典を表示）。表面は原子座標からガウス表面を計算し、Blenderで陰影を焼き込んでいます。'),
        h('p', {}, '描画：three.js ／ モデリング：Blender ／ 構造処理：gemmi・scikit-image（いずれもオープンソース）'))));
}

async function openLab(id: string) {
  const info = labInfo(id);
  const load = loaders[id];
  if (!info || !load) return home();
  stage?.dispose();
  document.title = `${info.title} — GENE LAB 3D`;
  const panel = h('aside', { class: 'panel' });
  const view = h('div', { class: 'viewport' });
  const loading = h('div', { class: 'loading' }, h('span', { class: 'spinner' }), '分子を読み込み中…');
  view.append(loading);
  app.replaceChildren(topbar(info), h('main', { class: 'lab' }, panel, view));
  stage = new Stage(view);
  (window as unknown as { __stage: Stage }).__stage = stage;
  const hud = new Hud(view);
  manip = new Manipulator(stage);
  view.append(manipToolbar(manip));
  const mission = new Mission(id, info.tasks, (m, k) => hud.toast(m, k));
  mission.onComplete = () => hud.toast('<b>すべてのミッションを達成！</b> 確認問題に挑戦しましょう', 'ok');
  const tools = h('div', { class: 'tools' });
  panel.append(
    h('div', { class: 'panel-head' },
      h('p', { class: 'en' }, info.en),
      h('h1', {}, info.title),
      h('p', { class: 'lead' }, info.lead),
      h('p', { class: 'src' }, '講義資料：' + info.slides)),
    tools,
    mission.el,
    h('button', { class: 'quiz-btn', onclick: () => quiz(info.title + '｜確認問題', info.quiz) }, '確認問題（5択）'));
  const mine = stage;
  try {
    const [mod] = await Promise.all([load(), loadDnaTemplate(BASE)]);
    if (stage !== mine) return;
    await mod.mount({ stage: mine, manip: manip!, hud, panel: tools, mission, info });
  } catch (e) {
    console.error(e);
    hud.status('読み込みに失敗しました。再読み込みしてください。', 'bad');
  }
  loading.remove();
}

async function openViewer(id?: string) {
  stage?.dispose();
  document.title = '3Dモデル図鑑 — GENE LAB 3D';
  const panel = h('aside', { class: 'panel' });
  const view = h('div', { class: 'viewport' });
  app.replaceChildren(
    h('header', { class: 'topbar' },
      h('a', { class: 'brand', href: '#/' }, h('span', { class: 'logo' }, 'GENE LAB'), h('span', { class: 'logo3d' }, '3D')),
      h('div', { class: 'crumb' }, h('b', {}, '3Dモデル図鑑'), '　すべてのモデルを自由に回して観察'),
      h('a', { class: 'ghost small', href: '#/' }, 'ラボ一覧')),
    h('main', { class: 'lab' }, panel, view));
  stage = new Stage(view);
  (window as unknown as { __stage: Stage }).__stage = stage;
  const hud = new Hud(view);
  manip = new Manipulator(stage);
  view.append(manipToolbar(manip));
  const { mountViewer } = await import('./viewer');
  await loadDnaTemplate(BASE);
  await mountViewer({ stage, hud, panel, manip, id });
}

function route() {
  const m = location.hash.match(/^#\/lab\/([\w-]+)/);
  const v = location.hash.match(/^#\/models(?:\/([\w-]+))?/);
  if (m) openLab(m[1]);
  else if (v) openViewer(v[1]);
  else home();
}

addEventListener('hashchange', route);
route();
