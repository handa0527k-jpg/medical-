/** Small DOM helpers shared by the labs (no framework: each lab owns its panel). */

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | ((e: Event) => void)> = {},
  ...kids: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, '').toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (v === false) continue;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export interface Task {
  id: string;
  text: string;
  hint?: string;
}

/** The checklist of things the learner should do in a lab. Progress is kept per lab. */
export class Mission {
  private done = new Set<string>();
  readonly el: HTMLElement;
  private list: HTMLElement;
  private bar: HTMLElement;
  onComplete: (() => void) | null = null;

  constructor(private labId: string, private tasks: Task[], private toast: (html: string, kind?: string) => void) {
    try {
      const saved = JSON.parse(localStorage.getItem('genelab:done:' + labId) ?? '[]') as string[];
      for (const id of saved) if (tasks.some((t) => t.id === id)) this.done.add(id);
    } catch { /* ignore */ }
    this.list = h('ol', { class: 'tasks' });
    this.bar = h('div', { class: 'bar' });
    this.el = h('section', { class: 'mission' },
      h('div', { class: 'mission-head' }, h('b', {}, 'ミッション'), h('div', { class: 'meter' }, this.bar)),
      this.list);
    this.render();
  }

  private render() {
    this.list.replaceChildren(...this.tasks.map((t) =>
      h('li', { class: this.done.has(t.id) ? 'done' : '' },
        h('span', { class: 'check', 'aria-hidden': 'true' }, this.done.has(t.id) ? '✓' : ''),
        h('span', {}, t.text, t.hint ? h('small', {}, t.hint) : null))));
    this.bar.style.width = `${(100 * this.done.size) / this.tasks.length}%`;
  }

  has(id: string) {
    return this.done.has(id);
  }

  complete(id: string, msg?: string) {
    if (this.done.has(id) || !this.tasks.some((t) => t.id === id)) return;
    this.done.add(id);
    try { localStorage.setItem('genelab:done:' + this.labId, JSON.stringify([...this.done])); } catch { /* ignore */ }
    this.render();
    this.toast(`<b>ミッション達成</b> ${msg ?? this.tasks.find((t) => t.id === id)!.text}`, 'ok');
    if (this.done.size === this.tasks.length) this.onComplete?.();
  }

  get progress() {
    return this.done.size / this.tasks.length;
  }
}

export function progressOf(labId: string, total: number) {
  try {
    return (JSON.parse(localStorage.getItem('genelab:done:' + labId) ?? '[]') as string[]).length / total;
  } catch {
    return 0;
  }
}

export interface Question {
  q: string;
  choices: string[];
  answer: number;
  why: string;
}

/** a modal five-choice check, one question at a time */
export function quiz(title: string, qs: Question[]) {
  let i = 0;
  let score = 0;
  const body = h('div', { class: 'quiz-body' });
  const close = h('button', { class: 'ghost', onclick: () => modal.remove() }, '閉じる');
  const modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'modal-card' }, h('header', {}, h('b', {}, title), close), body));
  const show = () => {
    if (i >= qs.length) {
      body.replaceChildren(h('p', { class: 'score' }, `${qs.length}問中 ${score}問 正解`),
        h('p', {}, score === qs.length ? '完璧です。実験で見たことが言葉でも説明できています。' : '間違えたところは、もう一度3Dで動かして確かめましょう。'),
        h('button', { class: 'primary', onclick: () => modal.remove() }, 'ラボに戻る'));
      return;
    }
    const q = qs[i];
    const letters = 'ABCDE';
    const opts = q.choices.map((c, j) => h('button', {
      class: 'choice', onclick: () => {
        for (const b of opts) b.setAttribute('disabled', '');
        opts[q.answer].classList.add('right');
        if (j === q.answer) score++;
        else opts[j].classList.add('wrong');
        body.append(h('div', { class: 'why' }, h('b', {}, j === q.answer ? '正解！' : `正解は ${letters[q.answer]}`), ' ', q.why),
          h('button', { class: 'primary', onclick: () => { i++; show(); } }, i + 1 < qs.length ? '次の問題' : '結果を見る'));
      },
    }, h('span', { class: 'letter' }, letters[j]), c));
    body.replaceChildren(h('p', { class: 'qnum' }, `問${i + 1} / ${qs.length}`), h('p', { class: 'q' }, q.q), ...opts);
  };
  show();
  document.body.append(modal);
}
