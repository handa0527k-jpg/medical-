import { h } from './ui';

/** Overlay on the 3D view: a status line, an info card and transient toasts. */
export class Hud {
  readonly el: HTMLElement;
  private statusEl: HTMLElement;
  private cardEl: HTMLElement;
  private toasts: HTMLElement;

  constructor(host: HTMLElement) {
    this.statusEl = h('div', { class: 'hud-status', role: 'status', 'aria-live': 'polite' });
    this.cardEl = h('div', { class: 'hud-card', hidden: true });
    this.toasts = h('div', { class: 'hud-toasts', 'aria-live': 'polite' });
    this.el = h('div', { class: 'hud' }, this.cardEl, this.statusEl, this.toasts);
    host.append(this.el);
  }

  status(html: string, kind = '') {
    this.statusEl.innerHTML = html;
    this.statusEl.className = 'hud-status ' + kind;
    this.statusEl.hidden = !html;
  }

  card(html: string | null) {
    if (!html) {
      this.cardEl.hidden = true;
      return;
    }
    this.cardEl.hidden = false;
    this.cardEl.innerHTML = html;
    const x = h('button', { class: 'card-x', 'aria-label': '閉じる', onclick: () => (this.cardEl.hidden = true) }, '×');
    this.cardEl.prepend(x);
  }

  toast(html: string, kind = '') {
    const t = h('div', { class: 'toast ' + kind, html });
    this.toasts.append(t);
    setTimeout(() => t.classList.add('out'), 3600);
    setTimeout(() => t.remove(), 4200);
  }

  clear() {
    this.status('');
    this.card(null);
    this.toasts.replaceChildren();
  }
}
