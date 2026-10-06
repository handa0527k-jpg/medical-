"""路地裏のゲノム — science overlays, drawn as neon line art over the key art and timed to the narration.
Facts follow the lecture (遺伝子工学 2026): BamHI G^GATCC, BglII A^GATCT (both leave 5'-GATC overhangs), SmaI CCC^GGG
(blunt), pUC-type plasmid (ori, Amp^r, MCS), PCR 95/55/72 ℃ and 2^n, ddNTP lacks 3'-OH, NGS clusters + 4-colour SBS,
Cas9: 20-nt guide + NGG PAM, cut 3 bp upstream of the PAM, NHEJ vs HDR, dCas9 epigenome editing.
"""
import math
import cv2, numpy as np

W, H = 1920, 1080
COMP = None
COMP_BASES = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G', 'N': 'N'}
BASECOL = {'A': (120, 255, 140), 'T': (255, 110, 110), 'G': (255, 220, 110), 'C': (120, 190, 255), 'N': (220, 220, 220), 'U': (255, 140, 200)}


def ez(u):
    u = min(1, max(0, u)); return u * u * (3 - 2 * u)


def prog(t, a, b):
    return ez((t - a) / max(1e-3, b - a))


class Neon:
    def __init__(self):
        self.L = np.zeros((H, W, 3), np.uint8)   # glowing line art (BGR)
        self.T = np.zeros((H, W, 3), np.float32)  # crisp text, added on top
        self.dim = np.zeros((H // 8, W // 8), np.float32)

    @staticmethod
    def c(col, a):
        return (int(col[2] * a), int(col[1] * a), int(col[0] * a))

    def line(self, p, q, col, a=1, w=3):
        if a > 0.01:
            cv2.line(self.L, (int(p[0]), int(p[1])), (int(q[0]), int(q[1])), self.c(col, a), w, cv2.LINE_AA)

    def poly(self, pts, col, a=1, w=3, closed=False):
        if a > 0.01 and len(pts) > 1:
            cv2.polylines(self.L, [np.array(pts, np.int32).reshape(-1, 1, 2)], closed, self.c(col, a), w, cv2.LINE_AA)

    def fillpoly(self, pts, col, a=1):
        if a > 0.01:
            cv2.fillPoly(self.L, [np.array(pts, np.int32).reshape(-1, 1, 2)], self.c(col, a), cv2.LINE_AA)

    def circle(self, p, r, col, a=1, w=3):
        if a > 0.01 and r >= 1:
            cv2.circle(self.L, (int(p[0]), int(p[1])), int(r), self.c(col, a), w, cv2.LINE_AA)

    def arc(self, p, r, a0, a1, col, a=1, w=3):
        if a > 0.01 and r >= 1:
            cv2.ellipse(self.L, (int(p[0]), int(p[1])), (int(r), int(r)), 0, a0, a1, self.c(col, a), w, cv2.LINE_AA)

    def ellipse(self, p, rx, ry, ang, col, a=1, w=3):
        if a > 0.01:
            cv2.ellipse(self.L, (int(p[0]), int(p[1])), (int(rx), int(ry)), ang, 0, 360, self.c(col, a), w, cv2.LINE_AA)

    def text(self, s, x, y, size=40, col=(255, 255, 255), a=1, kind='gothic', anchor='mm', bold=False, glow=True):
        if a <= 0.01:
            return
        spr = COMP.text_sprite(s, kind, int(size), tuple(int(v) for v in col), 0, bold)
        COMP.blit(self.T, spr, x, y, a, anchor, add=True)
        if glow:
            rgb, al = spr
            h, w = al.shape[:2]
            xx = x - (w // 2 if anchor[0] == 'm' else (w if anchor[0] == 'r' else 0))
            yy = y - (h // 2 if anchor[1] == 'm' else (h if anchor[1] == 'b' else 0))
            self.darken(xx + w / 2, yy + h / 2, w * 0.7 + 30, h + 30, 0.5 * a)

    def darken(self, cx, cy, rw, rh, k):
        cv2.ellipse(self.dim, (int(cx / 8), int(cy / 8)), (max(1, int(rw / 8)), max(1, int(rh / 8))), 0, 0, 360, float(k), -1)

    def panel(self, x0, y0, x1, y1, k=0.6):
        cv2.rectangle(self.dim, (int(x0 / 8), int(y0 / 8)), (int(x1 / 8), int(y1 / 8)), float(k), -1)

    def compose(self, out):
        Lf = self.L.astype(np.float32) / 255
        small = cv2.resize(Lf, (W // 4, H // 4), interpolation=cv2.INTER_AREA) + cv2.resize(self.T, (W // 4, H // 4), interpolation=cv2.INTER_AREA) * 0.5
        glow = cv2.GaussianBlur(small, (0, 0), 3) * 1.2 + cv2.GaussianBlur(small, (0, 0), 12) * 1.6
        dim = cv2.GaussianBlur(cv2.resize(self.dim, (W // 4, H // 4)), (0, 0), 10)
        dim = cv2.resize(np.clip(dim, 0, 0.85), (W, H))[:, :, None]
        return out * (1 - dim) + Lf * 1.1 + cv2.resize(glow, (W, H)) + self.T


# ----------------------------------------------------------------------------------------- DNA helpers
def letters(N, x, y, seq, size, a=1, cols=None, step=None, alpha_fn=None, anchor='mm'):
    step = step or size * 0.78
    for i, ch in enumerate(seq):
        if ch == ' ':
            continue
        aa = a * (alpha_fn(i) if alpha_fn else 1)
        col = cols[i] if cols else BASECOL.get(ch, (240, 240, 240))
        N.text(ch, x + i * step, y, size, col, aa, 'gothic', anchor, True, glow=False)
    return step


def duplex(N, x, y, top, size=46, a=1, gap=None, hi=None, hi_col=(255, 120, 200), bot=None, show_ends=True, dx_top=0, dx_bot=0, ticks=True, step=None):
    """Draw a 5'→3' top strand and its 3'←5' partner. Returns letter step. hi=(i0,i1) highlights a site."""
    step = step or size * 0.82
    gap = gap or size * 1.25
    bot = bot or ''.join(COMP_BASES.get(c, ' ') if c != ' ' else ' ' for c in top)
    if hi:
        x0 = x + dx_top + (hi[0] - 0.55) * step; x1 = x + dx_top + (hi[1] - 0.45) * step
        N.poly([(x0, y - size * 0.7), (x1, y - size * 0.7), (x1, y + gap + size * 0.7), (x0, y + gap + size * 0.7)], hi_col, a * 0.8, 2, True)
    for i, ch in enumerate(top):
        if ch != ' ':
            N.text(ch, x + dx_top + i * step, y, size, BASECOL.get(ch, (230, 230, 230)), a, 'gothic', 'mm', True, glow=False)
    for i, ch in enumerate(bot):
        if ch != ' ':
            N.text(ch, x + dx_bot + i * step, y + gap, size, BASECOL.get(ch, (230, 230, 230)), a, 'gothic', 'mm', True, glow=False)
            if ticks and i < len(top) and top[i] != ' ' and abs(dx_top - dx_bot) < 2:
                N.line((x + i * step + dx_top, y + size * 0.42), (x + i * step + dx_top, y + gap - size * 0.42), (150, 170, 220), a * 0.5, 1)
    if show_ends:
        N.text("5'", x + dx_top - step * 1.1, y, size * 0.55, (200, 210, 255), a * 0.8, 'gothic', 'rm', glow=False)
        N.text("3'", x + dx_top + (len(top) - 0.2) * step, y, size * 0.55, (200, 210, 255), a * 0.8, 'gothic', 'lm', glow=False)
        N.text("3'", x + dx_bot - step * 1.1, y + gap, size * 0.55, (200, 210, 255), a * 0.8, 'gothic', 'rm', glow=False)
        N.text("5'", x + dx_bot + (len(bot) - 0.2) * step, y + gap, size * 0.55, (200, 210, 255), a * 0.8, 'gothic', 'lm', glow=False)
    return step


def helix(N, x0, x1, yc, amp, t, a=1, col1=(90, 200, 255), col2=(255, 110, 200), turns=6, rungs=True, phase=0):
    n = 160
    p1, p2 = [], []
    for k in range(n + 1):
        u = k / n; x = x0 + (x1 - x0) * u
        th = u * turns * 2 * math.pi + t * 1.2 + phase
        p1.append((x, yc + math.sin(th) * amp)); p2.append((x, yc + math.sin(th + math.pi) * amp))
    if rungs:
        for k in range(0, n, 4):
            u = k / n; th = u * turns * 2 * math.pi + t * 1.2 + phase
            depth = abs(math.cos(th))
            N.line(p1[k], p2[k], (200, 220, 255), a * 0.35 * (0.4 + depth), 2)
    N.poly(p1, col1, a, 4); N.poly(p2, col2, a, 4)


def scissors(N, x, y, s, open_, col=(200, 235, 255), a=1, ang=0):
    """light-blade scissors (the restriction-enzyme spirit). open_ 0..1"""
    for sgn in (1, -1):
        th = ang + sgn * (0.08 + 0.32 * open_)
        tip = (x + math.cos(th) * s, y + math.sin(th) * s)
        back = (x - math.cos(th) * s * 0.35, y - math.sin(th) * s * 0.35)
        nx, ny = -math.sin(th), math.cos(th)
        blade = [back, (x + nx * s * 0.06 * sgn, y + ny * s * 0.06 * sgn), tip]
        N.poly(blade, col, a, 3)
        ring = (x - math.cos(th) * s * 0.55, y - math.sin(th) * s * 0.55)
        N.circle(ring, s * 0.18, col, a, 3)
    N.circle((x, y), 5, (255, 255, 255), a, -1)


def L(s, i):
    for l in s['lines']:
        if l['i'] == i:
            return l['t0'], l['t1']
    return s['t0'], s['t1']


# ----------------------------------------------------------------------------------------- overlays
def ov_title(N, t, s):
    last = s['lines'][-1]['t1']
    a = prog(t, last + 0.6, last + 2.6)
    if a <= 0:
        return
    cx, cy = W // 2, 430
    N.panel(300, 300, 1620, 620, 0.55 * a)
    N.text('路地裏のゲノム', cx, cy, 128, (240, 246, 255), a, 'mincho', 'mm', True)
    w = 520 * prog(t, last + 1.4, last + 3.4)
    N.line((cx - w, cy + 100), (cx + w, cy + 100), (140, 200, 255), a * 0.9, 2)
    N.text('― 遺伝子工学の夜 ―', cx, cy + 160, 46, (200, 220, 255), prog(t, last + 2.2, last + 3.8), 'mincho', 'mm')
    N.text('THE GENOME IN THE BACK ALLEY', cx, cy + 222, 22, (150, 180, 230), prog(t, last + 2.8, last + 4.2), 'gothic', 'mm')
    helix(N, cx - w, cx + w, cy + 100, 10 * a, t, a * 0.6, turns=5, rungs=False)


def ov_helixYears(N, t, s):
    a0, a1 = L(s, 10); b0, b1 = L(s, 11)
    a = prog(t, a0 - 0.2, a0 + 1.0)
    helix(N, 120, 1800, 330, 70, t, a, turns=7)
    marks = [(1953, '二重らせん', a0 + 0.6), (1973, 'クローニング', b0 + 0.3), (1985, 'PCR', b0 + 3.4), (2004, 'ヒトゲノム完成版', b0 + 6.4), (2012, 'CRISPR-Cas9', b1 + 0.2)]
    for k, (yr, lab, tt) in enumerate(marks):
        x = 260 + k * 350
        aa = prog(t, tt, tt + 0.7)
        N.line((x, 430), (x, 520), (180, 210, 255), aa, 2)
        N.circle((x, 430), 7, (255, 255, 255), aa, -1)
        N.text(str(yr), x, 560, 48, (235, 240, 255), aa, 'mincho', 'mm', True)
        N.text(lab, x, 616, 30, (170, 210, 255), aa, 'gothic', 'mm')


VERBS = [('切る', (160, 220, 255)), ('つなぐ', (255, 214, 120)), ('増やす', (150, 255, 200)), ('読む', (130, 232, 255)), ('書き換える', (255, 160, 80))]


def ov_verbs(N, t, s):
    a0, a1 = L(s, 12)
    span = a1 - a0
    for k, (v, col) in enumerate(VERBS):
        tt = a0 + span * (0.18 + 0.15 * k)
        aa = prog(t, tt - 0.2, tt + 0.5)
        x = 300 + k * 330
        N.text(v, x, 400 + 14 * math.sin(t * 1.3 + k), 64, col, aa, 'mincho', 'mm', True)
        if aa > 0:
            N.circle((x, 470), 4, col, aa, -1)


def ov_verbsEnd(N, t, s):
    a0, a1 = L(s, 1)
    vs = [('切る', (160, 220, 255)), ('つなぐ', (255, 214, 120)), ('運ぶ', (205, 185, 255)), ('増やす', (150, 255, 200)), ('読む', (130, 232, 255)), ('書き換える', (255, 160, 80))]
    span = a1 - a0
    for k, (v, col) in enumerate(vs):
        tt = a0 + span * (0.02 + 0.15 * k)
        aa = prog(t, tt - 0.1, tt + 0.4) * (1 - prog(t, a1 + 1.5, a1 + 3.5))
        x = 230 + k * 292
        N.text(v, x, 430, 58, col, aa, 'mincho', 'mm', True)


def ov_gatcWall(N, t, s):
    a0, a1 = L(s, 0)
    tt = a0 + (a1 - a0) * 0.42
    for k, ch in enumerate('GATC'):
        on = prog(t, tt + k * 0.32, tt + k * 0.32 + 0.25)
        fl = 0.8 + 0.2 * math.sin(t * 13 + k * 2) if on > 0.9 else on
        x = 600 + k * 220
        N.text(ch, x, 420, 210, BASECOL[ch], fl, 'mincho', 'mm', True)
    if t > tt + 1.6:
        N.text('４つの文字', 960, 610, 40, (220, 230, 255), prog(t, tt + 1.6, tt + 2.4), 'mincho')


def ov_bamhi(N, t, s):
    a0, a1 = L(s, 2); b0, b1 = L(s, 3)
    a = prog(t, s['t0'], s['t0'] + 0.8)
    seq = 'ATGGATCCTA'
    x = 960 - 4.5 * 46 * 0.82 * 1.6
    N.panel(260, 210, 1660, 680, 0.55 * a)
    N.text('制限酵素は 4〜8塩基の決まった配列を認識する', 960, 250, 34, (220, 230, 255), a, 'gothic')
    hi = prog(t, a0 + 2.0, a0 + 3.0)
    duplex(N, x, 400, seq, 74, a, gap=110, hi=(2, 8) if hi > 0 else None, hi_col=(255, 120, 200), step=74 * 0.82)
    N.text('BamHI の認識配列：GGATCC', 960, 600, 36, (255, 170, 220), hi * (1 - prog(t, b0 + 2.5, b0 + 3.2)), 'gothic', 'mm', True)
    # palindrome sweep
    if t > b0:
        u = ((t - b0) % 3.2) / 3.2
        st = 74 * 0.82
        k = 2 + u * 6
        N.circle((x + k * st, 340), 8, (255, 255, 255), 0.9, -1)
        N.circle((x + (10 - 1 - k) * st, 400 + 110 + 60), 8, (255, 255, 255), 0.9, -1)
        N.text("上の鎖 5'→3'：GGATCC　／　下の鎖 5'→3'：GGATCC", 960, 660, 30, (210, 225, 255), prog(t, b0 + 1, b0 + 2), 'gothic')
        N.text('回文配列（パリンドローム）', 960, 600, 40, (255, 170, 220), prog(t, b0 + 3.2, b0 + 4), 'mincho', 'mm', True)


def ov_bamhiCut(N, t, s):
    a0, a1 = L(s, 4); b0, b1 = L(s, 5)
    seq = 'ATGGATCCTA'
    size = 74; st = size * 0.82
    x = 960 - 4.5 * st
    sep = prog(t, a0 + 2.6, a1 + 0.8) * 120
    N.panel(220, 200, 1700, 700, 0.55)
    # scissors sweep down along the cut path
    cut_u = prog(t, a0 + 0.8, a0 + 2.6)
    top = 'ATG' + ' ' * 7; topR = '   GATCCTA'
    left_top, right_top = seq[:3], seq[3:]
    bot = ''.join(COMP_BASES[c] for c in seq)
    left_bot, right_bot = bot[:7], bot[7:]
    y = 380; gap = 110
    for i, ch in enumerate(left_top):
        N.text(ch, x + i * st - sep, y, size, BASECOL[ch], 1, 'gothic', 'mm', True, glow=False)
    for i, ch in enumerate(right_top):
        N.text(ch, x + (i + 3) * st + sep, y, size, BASECOL[ch], 1, 'gothic', 'mm', True, glow=False)
    for i, ch in enumerate(left_bot):
        N.text(ch, x + i * st - sep, y + gap, size, BASECOL[ch], 1, 'gothic', 'mm', True, glow=False)
    for i, ch in enumerate(right_bot):
        N.text(ch, x + (i + 7) * st + sep, y + gap, size, BASECOL[ch], 1, 'gothic', 'mm', True, glow=False)
    for i in range(10):  # base-pair ticks only where both strands remain paired
        lx = x + i * st + (-sep if i < 3 else (sep if i >= 7 else 0))
        if 3 <= i < 7:
            continue
        N.line((lx, y + 32), (lx, y + gap - 32), (150, 170, 220), 0.5, 1)
    for i in range(3, 7):  # single-stranded overhangs
        N.line((x + i * st + sep, y + 32), (x + i * st + sep, y + 56), (255, 150, 220), 0.6 * (1 - sep / 120), 1)
        N.line((x + i * st - sep, y + gap - 32), (x + i * st - sep, y + gap - 56), (255, 150, 220), 0.6 * (1 - sep / 120), 1)
    # cut path G^GATCC / CCTAG^G
    pa = (1 - prog(t, a1, a1 + 0.6))
    path = [(x + 2.5 * st, y - 60), (x + 2.5 * st, y + gap / 2), (x + 6.5 * st, y + gap / 2), (x + 6.5 * st, y + gap + 60)]
    n = int(cut_u * 30)
    pts = []
    for k in range(n + 1):
        u = k / 30 * 3
        i = min(2, int(u)); f = u - i
        p, q = path[i], path[i + 1]
        pts.append((p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f))
    if len(pts) > 1:
        N.poly(pts, (255, 255, 255), pa, 3)
        scissors(N, pts[-1][0], pts[-1][1], 90, 0.5 + 0.5 * math.sin(t * 14), a=pa, ang=math.pi / 2)
    if t > b0 - 0.3:
        N.text("5'突出末端（GATC）", 960, 640, 40, (255, 170, 220), prog(t, b0, b0 + 0.8), 'gothic', 'mm', True)


def ov_stickyMini(N, t, s):
    a = prog(t, s['t0'] + 0.5, s['t0'] + 1.3)
    x0, y0 = 1280, 230
    N.panel(1220, 160, 1860, 560, 0.6 * a)
    st = 40
    for i, ch in enumerate('G'):
        N.text(ch, x0 + i * st, y0 + 60, 44, BASECOL[ch], a, 'gothic', 'mm', True, glow=False)
    for i, ch in enumerate('CCTAG'):
        N.text(ch, x0 + i * st, y0 + 130, 44, BASECOL[ch], a, 'gothic', 'mm', True, glow=False)
    for i, ch in enumerate('GATCC'):
        N.text(ch, x0 + 300 + (i + 1) * st - 40, y0 + 60, 44, BASECOL[ch], a, 'gothic', 'mm', True, glow=False)
    for i, ch in enumerate('G'):
        N.text(ch, x0 + 300 + 5 * st, y0 + 130, 44, BASECOL[ch], a, 'gothic', 'mm', True, glow=False)
    pull = 30 * math.sin(t * 1.5)
    N.line((x0 + 220 + pull * 0.2, y0 + 95), (x0 + 270 - pull * 0.2, y0 + 95), (255, 150, 220), a * 0.6, 2)
    N.text('突出末端（粘着末端）', 1540, y0 + 230, 36, (255, 170, 220), a, 'gothic', 'mm', True)
    N.text('相補的な端どうしが対をつくる', 1540, y0 + 285, 26, (210, 220, 255), a, 'gothic')


def ov_smai(N, t, s):
    a0, a1 = L(s, 7)
    seq = 'TACCCGGGTA'
    size = 74; st = size * 0.82; x = 960 - 4.5 * st; y = 360; gap = 110
    N.panel(220, 200, 1700, 720, 0.55)
    cut = prog(t, a0 + 2.6, a0 + 3.4)
    sep = prog(t, a0 + 3.4, a0 + 4.4) * 90
    bot = ''.join(COMP_BASES[c] for c in seq)
    for i, ch in enumerate(seq):
        d = -sep if i < 5 else sep
        N.text(ch, x + i * st + d, y, size, BASECOL[ch], 1, 'gothic', 'mm', True, glow=False)
        N.text(bot[i], x + i * st + d, y + gap, size, BASECOL[bot[i]], 1, 'gothic', 'mm', True, glow=False)
        N.line((x + i * st + d, y + 32), (x + i * st + d, y + gap - 32), (150, 170, 220), 0.5, 1)
    hi = prog(t, a0 + 0.8, a0 + 1.6)
    N.poly([(x + 1.45 * st, y - 52), (x + 7.55 * st, y - 52), (x + 7.55 * st, y + gap + 52), (x + 1.45 * st, y + gap + 52)], (255, 120, 200), hi * (1 - cut * 0.6), 2, True)
    if cut > 0:
        N.line((x + 4.5 * st, y - 70), (x + 4.5 * st, y - 70 + (gap + 140) * cut), (255, 255, 255), 1 - prog(t, a0 + 4.4, a0 + 5), 3)
        scissors(N, x + 4.5 * st, y - 70 + (gap + 140) * cut, 80, 0.5 + 0.5 * math.sin(t * 14), a=1 - prog(t, a0 + 4.4, a0 + 5), ang=math.pi / 2)
    N.text('SmaI：CCC／GGG', 960, 250, 36, (255, 170, 220), hi, 'gothic', 'mm', True)
    N.text('平滑末端（まっすぐな切り口）', 960, 640, 40, (200, 230, 255), prog(t, a0 + 4.6, a0 + 5.4), 'gothic', 'mm', True)


def ov_phage(N, t, s):
    a0, a1 = L(s, 8); b0, b1 = L(s, 9)
    a = prog(t, s['t0'], s['t0'] + 1)
    # bacterium
    bx, by = 1080, 560
    N.ellipse((bx, by), 520, 210, 0, (120, 220, 255), a, 3)
    N.text('細菌', bx + 380, by + 150, 34, (150, 220, 255), a, 'gothic')
    # phage landing on top-left
    px, py = 700, 220 + 40 * (1 - prog(t, s['t0'], a0 + 2))
    hx = [(px + 40 * math.cos(k * math.pi / 3 + math.pi / 6), py - 70 + 40 * math.sin(k * math.pi / 3 + math.pi / 6)) for k in range(6)]
    N.poly(hx, (255, 200, 120), a, 3, True)
    N.line((px, py - 30), (px, py + 60), (255, 200, 120), a, 4)
    for sg in (-1, 1):
        N.poly([(px, py + 60), (px + sg * 40, py + 90), (px + sg * 60, py + 130)], (255, 200, 120), a, 2)
    N.text('ファージ', px - 120, py - 70, 30, (255, 210, 150), a, 'gothic')
    # injected DNA wiggle then cut into pieces
    inj = prog(t, a0 + 1.5, a1)
    cutk = prog(t, b0 + 0.4, b0 + 2.2)
    pts = []
    for k in range(int(60 * inj)):
        u = k / 60
        pts.append((px + 20 + u * 520, by - 40 + math.sin(u * 18 + t * 2) * 30))
    if pts:
        seg = max(2, len(pts) // 6)
        for j in range(0, len(pts), seg):
            part = pts[j:j + seg - (2 if cutk > 0 else 0)]
            off = cutk * (j / seg - 3) * 14
            N.poly([(p[0] + off, p[1] + cutk * 25 * math.sin(j)) for p in part], (255, 120, 120), a, 3)
    if cutk > 0:
        for k in range(5):
            scissors(N, px + 120 + k * 95, by - 120 - 20 * math.sin(t * 3 + k), 46, 0.5 + 0.5 * math.sin(t * 12 + k), a=cutk * (1 - prog(t, b1 + 0.3, b1 + 1)), ang=math.pi / 2)
    # host DNA with methyl marks (protected)
    hp = [(bx - 380 + u * 14, by + 70 + math.sin(u * 0.5 + t) * 18) for u in range(55)]
    N.poly(hp, (120, 255, 170), a, 3)
    for k in range(0, 55, 9):
        x, y = hp[k]
        N.line((x, y), (x, y - 26), (255, 255, 255), a * 0.8, 2); N.circle((x, y - 32), 6, (255, 255, 255), a * 0.8, -1)
    N.text('CH3（メチル化）で自分のDNAは守る', bx - 120, by + 165, 28, (190, 255, 210), prog(t, b1 - 1, b1), 'gothic')


def ov_wires(N, t, s):
    a = prog(t, s['t0'], s['t0'] + 1.2)
    for k, (x0, y0, x1, y1) in enumerate([(-50, 250, 860, 420), (1080, 380, 1980, 230)]):
        sway = math.sin(t * 0.8 + k) * 18
        pts1, pts2 = [], []
        for j in range(41):
            u = j / 40
            x = x0 + (x1 - x0) * u; y = y0 + (y1 - y0) * u + math.sin(u * math.pi) * 90 + sway * u
            th = u * 14 + t
            pts1.append((x, y + math.sin(th) * 14)); pts2.append((x, y - math.sin(th) * 14))
            if j % 2 == 0:
                N.line(pts1[-1], pts2[-1], (200, 220, 255), a * 0.3, 1)
        N.poly(pts1, (110, 200, 255), a, 3); N.poly(pts2, (255, 120, 200), a, 3)
        # frayed end
        e = pts1[-1] if k == 0 else pts1[0]
        N.circle(e, 6 + 2 * math.sin(t * 6), (255, 255, 255), a * (0.6 + 0.4 * math.sin(t * 9 + k)), -1)


def ov_bamBgl(N, t, s):
    a0, a1 = L(s, 2); b0, b1 = L(s, 3)
    N.panel(120, 150, 1800, 760, 0.6)
    size = 58; st = size * 0.82; gap = 84
    a = prog(t, a0, a0 + 0.8)
    cut = prog(t, a0 + 5.0, a0 + 6.5)
    join = prog(t, b0 - 0.2, b0 + 1.6)
    for side, (name, seq, col, x) in enumerate([('BamHI', 'GGATCC', (255, 120, 120), 330), ('BglII', 'AGATCT', (120, 180, 255), 1170)]):
        N.text(name, x + 2.5 * st, 200, 40, col, a, 'gothic', 'mm', True)
        bot = ''.join(COMP_BASES[c] for c in seq)
        sep = cut * 60 * (1 - join)
        y = 300
        for i, ch in enumerate(seq):
            d = -sep if i == 0 else sep
            N.text(ch, x + i * st + d, y, size, col if 1 <= i <= 4 else (235, 235, 235), a, 'gothic', 'mm', True, glow=False)
        for i, ch in enumerate(bot):
            d = -sep if i <= 4 else sep
            N.text(ch, x + i * st + d, y + gap, size, col if 1 <= i <= 4 else (235, 235, 235), a, 'gothic', 'mm', True, glow=False)
        N.text(f"{seq[0]}^{seq[1:]}", x + 2.5 * st, y + gap + 80, 30, col, a * 0.9, 'gothic')
    N.text("どちらも 5'-GATC の突出末端", 960, 545, 36, (255, 230, 160), cut * (1 - join * 0.3), 'gothic', 'mm', True)
    if join > 0:
        # hybrid: G GATC T / C CTAG A
        x = 960 - 2.5 * st; y = 620
        hyb_top = 'GGATCT'; hyb_bot = 'CCTAGA'
        cols_t = [(255, 120, 120)] + [(255, 214, 120)] * 4 + [(120, 180, 255)]
        for i in range(6):
            N.text(hyb_top[i], x + i * st, y, size, cols_t[i], join, 'gothic', 'mm', True, glow=False)
            N.text(hyb_bot[i], x + i * st, y + gap, size, cols_t[i], join, 'gothic', 'mm', True, glow=False)
        N.text('互いにつながる（新しい組み合わせ）', 960, y + gap + 70, 30, (255, 230, 160), join, 'gothic')


def ov_ligate(N, t, s):
    a0, a1 = L(s, 4); b0, b1 = L(s, 5)
    a = prog(t, s['t0'] + 0.3, s['t0'] + 1.2)
    y = 330
    N.panel(400, 220, 1520, 560, 0.45 * a)
    close = prog(t, a0 + 1.0, a1 + 0.5)
    gapx = 70 * (1 - close)
    for k in range(9):
        x = 560 + k * 90 + (gapx if k >= 5 else -gapx * 0)
        N.circle((x, y), 14, (255, 214, 120), a, 2); N.text('P', x, y, 18, (255, 230, 170), a, 'gothic', 'mm', True, glow=False)
        if k < 8 and not (k == 4 and close < 1):
            N.line((x + 14, y), (x + 76 + (gapx if k == 4 else 0), y), (255, 214, 120), a, 3)
        N.line((x, y + 14), (x, y + 90), (200, 220, 255), a * 0.6, 2)
    if close < 1:
        N.text('切れ目（ニック）', 560 + 4.5 * 90 + gapx / 2, y - 60, 28, (255, 200, 200), a * (1 - close), 'gothic')
    else:
        sp = 0.6 + 0.4 * math.sin(t * 8)
        N.circle((560 + 4.5 * 90, y), 26, (255, 240, 180), sp, 3)
    N.text('リン酸ジエステル結合', 960, 480, 40, (255, 222, 140), prog(t, b0 + 0.3, b0 + 1.2), 'gothic', 'mm', True)
    N.text('＝ 組換えDNA', 960, 532, 32, (255, 240, 200), prog(t, b0 + 4.2, b0 + 5), 'gothic', 'mm')


def plasmid_ring(N, c, r, t, a, gapdeg=0, insert=0, labels=False, la=1):
    col1, col2 = (255, 200, 90), (255, 160, 60)
    g = gapdeg
    N.arc(c, r, -90 + g / 2, 270 - g / 2, col1, a, 4)
    N.arc(c, r - 12, -90 + g / 2, 270 - g / 2, col2, a, 3)
    if insert > 0:
        N.arc(c, r, -90 - 20 * insert, -90 + 20 * insert, (255, 90, 90), a, 6)
        N.arc(c, r - 12, -90 - 20 * insert, -90 + 20 * insert, (255, 90, 90), a, 5)


def ov_planets(N, t, s):
    a = prog(t, s['t0'] + 0.5, s['t0'] + 2)
    for k, (x, y, r) in enumerate([(420, 260, 90), (1350, 200, 130), (1650, 470, 60), (860, 150, 50)]):
        yy = y + 10 * math.sin(t * 0.6 + k)
        plasmid_ring(N, (x, yy), r, t, a * 0.9)
        for j in range(5):
            th = t * (0.5 + 0.2 * k) + j * 1.256
            N.circle((x + math.cos(th) * r * 1.35, yy + math.sin(th) * r * 0.45), 4, (180, 255, 210), a, -1)


def ov_plasmidMap(N, t, s):
    a0, a1 = L(s, 2); b0, b1 = L(s, 3)
    c = (960, 420); r = 230
    a = prog(t, s['t0'], s['t0'] + 1)
    N.panel(500, 140, 1420, 720, 0.55 * a)
    plasmid_ring(N, c, r, t, a)
    N.text('プラスミド', c[0], c[1] - 20, 44, (255, 230, 170), a, 'mincho', 'mm', True)
    N.text('環状二本鎖DNA', c[0], c[1] + 36, 28, (230, 220, 200), a, 'gothic')
    parts = [('ori（複製起点）', 120, 180, (150, 255, 200), a0 + 2.2), ('AmpR（アンピシリン耐性）', 200, 280, (255, 130, 130), a0 + 4.3), ('MCS（マルチクローニングサイト）', -110, -70, (130, 200, 255), b0 + 0.6)]
    for lab, d0, d1, col, tt in parts:
        aa = prog(t, tt, tt + 0.7)
        N.arc(c, r + 26, d0, d0 + (d1 - d0) * aa, col, aa, 10)
        mid = math.radians((d0 + d1) / 2)
        lx, ly = c[0] + math.cos(mid) * (r + 90), c[1] + math.sin(mid) * (r + 90)
        N.text(lab, lx + (120 if math.cos(mid) > 0 else -120), ly, 30, col, aa, 'gothic', 'mm', True)
    mc = prog(t, b0 + 1.5, b0 + 2.4)
    for k, e in enumerate(['EcoRI', 'BamHI', 'PstI', 'HindIII']):
        th = math.radians(-105 + k * 10)
        N.line((c[0] + math.cos(th) * (r + 34), c[1] + math.sin(th) * (r + 34)), (c[0] + math.cos(th) * (r + 50), c[1] + math.sin(th) * (r + 50)), (130, 200, 255), mc, 2)
        N.text(e, 560 + k * 0, 190 + k * 34, 24, (160, 210, 255), mc, 'gothic', 'lm')


def ov_plasmidInsert(N, t, s):
    a0, a1 = L(s, 4)
    c = (960, 430); r = 230
    N.panel(500, 140, 1420, 740, 0.5)
    open_ = prog(t, a0 + 0.3, a0 + 1.5) * (1 - prog(t, a0 + 3.8, a0 + 4.8))
    ins = prog(t, a0 + 1.8, a0 + 3.6)
    plasmid_ring(N, c, r, t, 1, gapdeg=40 * open_ + 1e-3, insert=prog(t, a0 + 3.6, a0 + 4.6))
    if ins < 1 and ins > 0:
        y = c[1] - r - 220 * (1 - ins)
        N.line((c[0] - 40, y), (c[0] + 40, y), (255, 90, 90), 1, 8)
        N.line((c[0] - 40, y + 12), (c[0] + 40, y + 12), (255, 90, 90), 1, 6)
        N.text('目的の遺伝子', c[0] + 150, y, 28, (255, 160, 160), 1 - ins * 0.5, 'gothic')
    closing = prog(t, a0 + 3.8, a0 + 4.8)
    if 0 < closing < 1:
        for k in range(8):
            th = t * 5 + k
            N.circle((c[0] + math.cos(th) * 40 * closing, c[1] - r + math.sin(th) * 30), 4, (255, 220, 140), 1 - closing, -1)
    N.text('組換えプラスミド', c[0], c[1], 40, (255, 230, 170), prog(t, a0 + 4.6, a0 + 5.6), 'mincho', 'mm', True)


def ecoli(N, x, y, s, a, col=(150, 230, 255), plasmid=False, t=0):
    N.ellipse((x, y), s, s * 0.45, 0, col, a, 3)
    if plasmid:
        N.circle((x + s * 0.3, y), s * 0.18, (255, 200, 90), a, 2)


def ov_transform(N, t, s):
    a0, a1 = L(s, 5); b0, b1 = L(s, 6); c0, c1 = L(s, 7)
    N.panel(200, 120, 1720, 760, 0.5)
    # 1) plasmid enters a bacterium
    if t < b0:
        u = prog(t, a0 + 0.3, a0 + 2.6)
        ecoli(N, 960, 420, 230, 1)
        px = 960 + 80 + 0 * u; py = 160 + 260 * u
        N.circle((px, py), 40, (255, 200, 90), 1, 3); N.arc((px, py), 40, -110, -70, (255, 90, 90), 1, 6)
        N.text('形質転換', 960, 700, 44, (230, 240, 255), prog(t, a0 + 2.2, a0 + 3), 'mincho', 'mm', True)
    # 2) ampicillin selection
    elif t < c0:
        u = prog(t, b0 + 1.2, b1)
        for k in range(8):
            x = 420 + (k % 4) * 360; y = 300 + (k // 4) * 240
            has = k in (1, 2, 5, 7)
            aa = 1 if has else 1 - u * 0.85
            ecoli(N, x, y, 120, aa, (150, 230, 255) if has else (200, 200, 220), plasmid=has)
            if not has and u > 0.3:
                N.line((x - 60, y - 40), (x + 60, y + 40), (255, 100, 100), u, 3); N.line((x - 60, y + 40), (x + 60, y - 40), (255, 100, 100), u, 3)
        N.text('アンピシリン入りの培地 → プラスミドを持つ菌だけが育つ', 960, 680, 34, (230, 240, 255), prog(t, b0 + 0.3, b0 + 1.1), 'gothic', 'mm', True)
    # 3) overnight growth
    else:
        gen = int(prog(t, c0 + 0.2, c1 - 0.5) * 6)
        n = 2 ** gen
        for k in range(min(n, 64)):
            x = 330 + (k % 16) * 84; y = 240 + (k // 16) * 110
            ecoli(N, x, y, 34, 1, plasmid=True)
        N.text(f'×{n}　…　一晩で数億倍', 960, 700, 40, (230, 240, 255), 1, 'mincho', 'mm', True)


def ov_vectors(N, t, s):
    a0, a1 = L(s, 11)
    N.panel(1180, 110, 1880, 760, 0.62)
    rows = [('AAV（アデノ随伴ウイルス）', 'ssDNA・約5 kb・18–26 nm', (255, 120, 200)), ('アデノウイルス', 'dsDNA・約36 kb・70–90 nm', (190, 150, 255)), ('レトロウイルス', 'ssRNA・8–9 kb・80–130 nm', (255, 180, 90))]
    for k, (n, d, col) in enumerate(rows):
        tt = a0 + 3.2 + k * 1.3
        aa = prog(t, tt, tt + 0.6)
        y = 220 + k * 190
        cx = 1260
        hx = [(cx + 46 * math.cos(j * math.pi / 3 + t * 0.4), y + 46 * math.sin(j * math.pi / 3 + t * 0.4)) for j in range(6)]
        N.poly(hx, col, aa, 3, True)
        N.text(n, 1340, y - 26, 32, col, aa, 'gothic', 'lm', True)
        N.text(d, 1340, y + 24, 26, (220, 225, 245), aa, 'gothic', 'lm')
    N.text('ベクター＝遺伝子の運び屋', 1530, 700, 30, (220, 210, 255), prog(t, a0 + 1, a0 + 2), 'mincho')


def ov_cdna(N, t, s):
    a0, a1 = L(s, 1); b0, b1 = L(s, 2); c0, c1 = L(s, 3)
    N.panel(150, 150, 1770, 740, 0.55)
    x0, x1, y = 260, 1500, 380
    a = prog(t, s['t0'], s['t0'] + 1)
    pts = [(x0 + (x1 - x0) * u / 60, y + math.sin(u * 0.35 + t) * 8) for u in range(61)]
    N.poly(pts, (110, 180, 255), a, 4)
    N.text("5'", x0 - 30, y, 26, (200, 210, 255), a, 'gothic', 'rm'); N.text('mRNA', x0 + 60, y - 50, 32, (130, 190, 255), a, 'gothic', 'mm', True)
    N.text('AAAAAAA', x1 + 20, y, 34, (130, 190, 255), a, 'gothic', 'lm', True, glow=False)
    N.text("3'", x1 + 180, y, 26, (200, 210, 255), a, 'gothic', 'lm')
    pr = prog(t, a0 + 3.2, a0 + 4.6)
    if pr > 0:
        N.text('TTTTTTT', x1 + 20, y + 70 + (1 - pr) * 120, 34, (255, 120, 120), pr, 'gothic', 'lm', True, glow=False)
        N.text('オリゴdTプライマー', x1 + 90, y + 140 + (1 - pr) * 120, 24, (255, 170, 170), pr, 'gothic')
    syn = prog(t, b0 + 0.5, c1 - 0.5)
    if syn > 0:
        xe = x1 - (x1 - x0) * syn
        p2 = [(x, y + 70) for x in np.linspace(x1, xe, 40)]
        N.poly(p2, (255, 100, 100), 1, 4)
        N.circle((xe, y + 50), 36, (255, 230, 140), 0.9, 3)
        N.text('逆転写酵素', xe, y + 130, 28, (255, 230, 160), 0.9, 'gothic')
    N.text('cDNA（イントロンを含まない）', 960, 640, 40, (255, 150, 150), prog(t, c0 + 2.5, c0 + 3.5), 'mincho', 'mm', True)


def strands(N, x0, x1, y, sep, t, a, col1=(110, 200, 255), col2=(255, 120, 200), wave=1.0):
    p1 = [(x, y - sep / 2 + math.sin(x / 50 + t * 2) * 6 * wave) for x in np.linspace(x0, x1, 50)]
    p2 = [(x, y + sep / 2 + math.sin(x / 50 + t * 2 + 1) * 6 * wave) for x in np.linspace(x0, x1, 50)]
    N.poly(p1, col1, a, 5); N.poly(p2, col2, a, 5)
    if sep < 60:
        for x in np.linspace(x0 + 10, x1 - 10, 40):
            N.line((x, y - sep / 2 + 4), (x, y + sep / 2 - 4), (200, 220, 255), a * 0.4 * (1 - sep / 60), 2)
    return p1, p2


def thermo(N, x, y, temp, col, a):
    N.text(f'{temp}°C', x, y, 92, col, a, 'mincho', 'mm', True)


def ov_denature(N, t, s):
    a0, a1 = L(s, 1)
    sep = prog(t, a0 + 1.2, a0 + 3.4) * 240 + 30
    N.panel(200, 150, 1720, 720, 0.45)
    strands(N, 320, 1600, 430, sep, t, 1, wave=1 + sep / 100)
    thermo(N, 960, 230, 95, (255, 120, 90), 1)
    N.text('変性：二本鎖がほどける', 960, 680, 40, (255, 170, 150), prog(t, a0 + 3, a0 + 3.8), 'mincho', 'mm', True)


def ov_anneal(N, t, s):
    a0, a1 = L(s, 3)
    N.panel(200, 150, 1720, 720, 0.45)
    strands(N, 320, 1600, 430, 270, t, 1, wave=0.5)
    pr = prog(t, a0 + 1.8, a0 + 3.4)
    # forward primer on bottom strand (left end, pointing right); reverse on top strand (right end, pointing left)
    yb = 430 + 135 - 30 + (1 - pr) * 90; yt = 430 - 135 + 30 - (1 - pr) * 90
    N.line((330, yb), (470, yb), (255, 90, 90), pr, 7); N.fillpoly([(470, yb - 14), (500, yb), (470, yb + 14)], (255, 90, 90), pr)
    N.line((1590, yt), (1450, yt), (90, 140, 255), pr, 7); N.fillpoly([(1450, yt - 14), (1420, yt), (1450, yt + 14)], (90, 140, 255), pr)
    thermo(N, 960, 230, 55, (110, 170, 255), 1)
    N.text('アニーリング：プライマーが寄り添う', 960, 680, 40, (170, 200, 255), prog(t, a0 + 3.4, a0 + 4.2), 'mincho', 'mm', True)


def ov_extend(N, t, s):
    a0, a1 = L(s, 5)
    N.panel(200, 150, 1720, 720, 0.45)
    strands(N, 320, 1600, 430, 270, t, 1, wave=0.4)
    ex = prog(t, a0 + 2.6, a1)
    yb = 430 + 135 - 30; yt = 430 - 135 + 30
    xb = 470 + (1590 - 470) * ex; xt = 1450 - (1450 - 330) * ex
    N.line((330, yb), (xb, yb), (255, 90, 90), 1, 7); N.line((1590, yt), (xt, yt), (90, 140, 255), 1, 7)
    N.circle((xb, yb), 30, (150, 255, 180), 0.9, 3); N.circle((xt, yt), 30, (150, 255, 180), 0.9, 3)
    N.text("3'→ 伸びる", xb, yb + 60, 26, (180, 255, 200), 0.9 * (ex > 0.02), 'gothic')
    thermo(N, 960, 230, 72, (120, 255, 150), 1)
    N.text('伸長：DNAポリメラーゼが鎖をつくる', 960, 680, 40, (170, 255, 200), prog(t, a0 + 4, a0 + 5), 'mincho', 'mm', True)


def ov_doubling(N, t, s):
    a0, a1 = L(s, 6); b0, b1 = L(s, 7)
    u = prog(t, a0 + 0.5, b1)
    n = max(1, int(1 + u * 29.999))
    ph = (t * 0.6) % 3
    cols = [(255, 120, 90), (110, 170, 255), (120, 255, 150)]
    temps = [95, 55, 72]
    N.panel(380, 200, 1540, 700, 0.5)
    N.text(f'サイクル {n}', 960, 300, 54, (230, 240, 255), 1, 'mincho', 'mm', True)
    N.text(f'{2 ** n:,} 倍', 960, 430, 96, cols[int(ph)], 1, 'mincho', 'mm', True)
    N.text(f'{temps[int(ph)]}°C', 1380, 300, 44, cols[int(ph)], 1, 'mincho', 'mm')
    N.text('2のn乗：1回ごとに2倍', 960, 560, 36, (220, 230, 255), prog(t, b0, b0 + 1), 'gothic', 'mm', True)
    for k in range(min(n, 10)):
        N.line((560 + k * 82, 630), (620 + k * 82, 630), cols[k % 3], 0.8, 4)


def ov_qpcr(N, t, s):
    a0, a1 = L(s, 10); b0, b1 = L(s, 11)
    x0, y0, x1, y1 = 420, 200, 1500, 660
    N.panel(300, 120, 1640, 760, 0.62)
    N.line((x0, y1), (x1, y1), (200, 210, 240), 1, 2); N.line((x0, y1), (x0, y0), (200, 210, 240), 1, 2)
    N.text('サイクル数', (x0 + x1) / 2, y1 + 40, 28, (210, 220, 245), 1, 'gothic'); N.text('蛍光', x0 - 50, (y0 + y1) / 2, 28, (210, 220, 245), 1, 'gothic')
    draw = prog(t, a0 + 0.5, b0 + 1.5)
    thr_y = y1 - 0.15 * (y1 - y0)
    tha = prog(t, b0, b0 + 0.8)
    for xx in np.arange(x0, x1, 24):
        N.line((xx, thr_y), (xx + 12, thr_y), (255, 120, 120), tha, 2)
    N.text('閾値', x1 + 40, thr_y, 26, (255, 150, 150), tha, 'gothic', 'lm')
    for k, (ct, col, lab) in enumerate([(14, (255, 110, 110), '多い'), (19, (120, 255, 150), '中'), (24, (110, 170, 255), '少ない')]):
        pts = []
        for c in np.linspace(0, 40, 120):
            if c / 40 > draw:
                break
            f = 1 / (1 + math.exp(-(c - ct - 3.5) * 0.55))
            pts.append((x0 + (x1 - x0) * c / 40, y1 - f * (y1 - y0) * 0.92))
        N.poly(pts, col, 1, 4)
        cta = prog(t, b0 + 1.6 + k * 0.6, b0 + 2.2 + k * 0.6)
        xc = x0 + (x1 - x0) * (ct + 0.3) / 40
        N.line((xc, thr_y), (xc, y1), col, cta, 2)
        N.text(f'Ct {ct}', xc, y1 + 80 - 0, 24, col, cta, 'gothic')
        N.text(f'初期量 {lab}', x1 - 60, y0 + 30 + k * 40, 26, col, prog(t, b1 - 3, b1 - 2), 'gothic', 'rm')


def ov_gelGround(N, t, s):
    for k in range(5):
        y = 760 + k * 50 + 4 * math.sin(t * 1.5 + k)
        for j in range(6):
            x = 160 + j * 300 + 18 * math.sin(t + j)
            N.line((x, y), (x + 150 - k * 10, y), (200, 130, 255), 0.5 + 0.2 * math.sin(t * 2 + j + k), 6)


def ov_gel(N, t, s):
    a0, a1 = L(s, 2)
    gx0, gx1, gy0, gy1 = 560, 1360, 170, 760
    N.panel(380, 110, 1560, 800, 0.62)
    N.poly([(gx0, gy0), (gx1, gy0), (gx1, gy1), (gx0, gy1)], (180, 150, 255), 0.9, 2, True)
    N.text('−', gx0 - 60, gy0 + 10, 64, (130, 180, 255), 1, 'gothic', 'mm', True)
    N.text('＋', gx0 - 60, gy1 - 20, 54, (255, 130, 130), 1, 'gothic', 'mm', True)
    N.text('DNA は −（リン酸）→ ＋ 極へ', gx1 + 30, gy0 + 30, 26, (220, 220, 255), prog(t, s['t0'], s['t0'] + 1), 'gothic', 'lm')
    run = prog(t, s['t0'] + 0.3, a1)
    sizes = [100, 300, 500, 1000, 2000, 5000]
    for lane in range(4):
        lx = gx0 + 100 + lane * 190
        N.line((lx - 55, gy0 + 30), (lx + 55, gy0 + 30), (200, 200, 230), 0.8, 3)
        for k, bp in enumerate(sizes):
            if lane > 0 and (k + lane) % 2:
                continue
            dist = (1 - math.log10(bp) / 4.2) * (gy1 - gy0 - 80)
            y = gy0 + 40 + dist * run * 1.9
            y = min(y, gy1 - 20)
            N.line((lx - 50, y), (lx + 50, y), (230, 160, 255), 0.95, 7)
            if lane == 0:
                N.text(f'{bp}', gx0 + 30, y, 20, (220, 200, 255), run, 'gothic', 'rm')
    N.text('小さい断片ほど速く・遠くへ', 960, gy1 + 30, 34, (230, 200, 255), prog(t, a0 + 2.5, a0 + 3.5), 'gothic', 'mm', True)


def ov_vntr(N, t, s):
    a0, a1 = L(s, 5)
    gx0, gx1, gy0, gy1 = 600, 1320, 160, 740
    N.panel(380, 100, 1560, 800, 0.62)
    lanes = {'A': [4, 10, 13, 15, 25, 30], 'B': [4, 7, 10, 20, 25, 30], 'C': [4, 11, 13, 20, 21, 33], 'F': [4, 7, 10, 20, 25, 30]}
    cols = [(255, 100, 180), (90, 200, 255), (110, 230, 140)]
    for i, (name, bands) in enumerate(lanes.items()):
        x = gx0 + 90 + i * 180
        aa = prog(t, s['t0'] + 0.3 * i, s['t0'] + 0.3 * i + 0.8)
        N.text(name if name != 'F' else '試料F', x, gy0 - 20, 32, (230, 230, 255), aa, 'gothic', 'mm', True)
        for k, r in enumerate(bands):
            y = gy1 - (r / 36) * (gy1 - gy0)
            N.line((x - 55, y), (x + 55, y), cols[k % 3], aa, 6)
    m = prog(t, a0 + 4.5, a0 + 5.5)
    xb, xf = gx0 + 90 + 180, gx0 + 90 + 540
    N.poly([(xb - 75, gy0 + 10), (xb + 75, gy0 + 10), (xb + 75, gy1 + 10), (xb - 75, gy1 + 10)], (255, 230, 120), m, 2, True)
    N.poly([(xf - 75, gy0 + 10), (xf + 75, gy0 + 10), (xf + 75, gy1 + 10), (xf - 75, gy1 + 10)], (255, 230, 120), m, 2, True)
    N.text('一致', (xb + xf) / 2, gy1 + 40, 34, (255, 230, 140), m, 'gothic', 'mm', True)
    N.text('反復配列（VNTR）の長さ', 1460, 260, 28, (230, 230, 255), 1, 'gothic', 'lm')


def ov_sanger(N, t, s):
    a0, a1 = L(s, 1); b0, b1 = L(s, 2)
    N.panel(160, 130, 1760, 760, 0.6)
    # dNTP vs ddNTP sugar
    a = prog(t, a0, a0 + 0.8)
    for k, (lab, oh, x) in enumerate([('dNTP', True, 520), ('ddNTP', False, 1240)]):
        aa = a if k == 0 else prog(t, a0 + 1.2, a0 + 2)
        pent = [(x + 70 * math.cos(math.radians(-90 + j * 72)), 360 + 70 * math.sin(math.radians(-90 + j * 72))) for j in range(5)]
        N.poly(pent, (150, 200, 255), aa, 3, True)
        for j in range(3):
            N.circle((x - 230 + j * 44, 300), 18, (255, 220, 110), aa, 2)
            N.text('P', x - 230 + j * 44, 300, 18, (255, 230, 150), aa, 'gothic', 'mm', True, glow=False)
        N.text('塩基', x + 140, 290, 26, (200, 255, 200), aa, 'gothic')
        y3 = 460
        if oh:
            N.text("3'-OH", x - 40, y3, 34, (130, 220, 255), aa, 'gothic', 'mm', True)
            N.text('鎖が伸びる', x, y3 + 60, 28, (180, 230, 255), aa, 'gothic')
        else:
            N.text("3'-H", x - 40, y3, 34, (255, 120, 120), aa, 'gothic', 'mm', True)
            N.text('ここで止まる', x, y3 + 60, 28, (255, 160, 160), aa, 'gothic')
            sw = prog(t, b0 + 0.5, b0 + 1.5)
            N.line((x - 90, y3 - 20), (x + 10, y3 + 20), (255, 90, 90), sw, 4); N.line((x - 90, y3 + 20), (x + 10, y3 - 20), (255, 90, 90), sw, 4)
        N.text(lab, x, 200, 40, (240, 240, 255), aa, 'gothic', 'mm', True)
    # terminated fragments
    fr = prog(t, b0 + 2.4, b1)
    seq = 'ATGTCAGTCCAG'
    for k in range(int(fr * 6)):
        L_ = 3 + k * 2
        y = 600 + k * 22
        N.line((360, y), (360 + L_ * 40, y), (200, 210, 240), 0.8, 3)
        N.circle((360 + L_ * 40, y), 7, BASECOL[seq[(L_ - 1) % len(seq)]], 1, -1)


def ov_capillary(N, t, s):
    a0, a1 = L(s, 3)
    N.panel(140, 120, 1780, 770, 0.6)
    seq = 'ATGTCAGTCCAG'
    u = prog(t, a0 + 0.5, a1)
    # capillary
    N.line((200, 300), (1720, 300), (200, 220, 255), 0.8, 2); N.line((200, 340), (1720, 340), (200, 220, 255), 0.8, 2)
    N.circle((1500, 320), 34, (255, 255, 255), 0.7, 2); N.text('検出', 1500, 250, 26, (230, 230, 255), 1, 'gothic')
    for k, b in enumerate(seq):
        x = 200 + (u * 1900 - k * 120)
        if 200 < x < 1720:
            N.circle((x, 320), 10, BASECOL[b], 1, -1)
    # chromatogram
    passed = int(max(0, (u * 1900 - 1300) / 120)) + 1 if u * 1900 > 1300 else 0
    passed = min(passed, len(seq))
    for k in range(passed):
        x = 380 + k * 100
        b = seq[k]
        pts = [(x + dx, 600 - 140 * math.exp(-(dx / 18) ** 2)) for dx in range(-50, 51, 5)]
        N.poly(pts, BASECOL[b], 1, 3)
        N.text(b, x, 650, 40, BASECOL[b], 1, 'gothic', 'mm', True)
    N.text('短い順に並ぶ → 末端の色を読む', 960, 190, 34, (230, 240, 255), prog(t, a0 + 1, a0 + 2), 'gothic', 'mm', True)


def ov_flowcell(N, t, s):
    a0, a1 = L(s, 5); b0, b1 = L(s, 6)
    if t < a0 - 0.3:
        return
    a = prog(t, a0 - 0.3, a0 + 1.5)
    cyc = int(max(0, t - b0) / 0.9)
    seqs = 'ACGTTGCAAGTCCGATGACTTGCA'
    for gy in range(6):
        for gx in range(14):
            x = 230 + gx * 120 + 20 * math.sin(gy * 3 + gx); y = 150 + gy * 80 + 14 * math.sin(gx * 2 + gy)
            if t < b0:
                N.circle((x, y), 5, (230, 235, 255), a * (0.5 + 0.5 * math.sin(t * 3 + gx + gy)), -1)
            else:
                b = seqs[(gx * 7 + gy * 3 + cyc) % len(seqs)]
                flash = 0.5 + 0.5 * math.cos(((t - b0) % 0.9) / 0.9 * math.pi * 2)
                N.circle((x, y), 7, BASECOL[b], 0.4 + 0.6 * flash, -1)
    if t > b0:
        N.text(f'サイクル {cyc + 1}：4色の光で 1塩基ずつ', 960, 680, 34, (230, 240, 255), prog(t, b0, b0 + 0.8), 'gothic', 'mm', True)
        rd = ''.join(seqs[(3 * 7 + 2 * 3 + k) % len(seqs)] for k in range(min(cyc + 1, 16)))
        N.text(rd, 960, 610, 40, (200, 230, 255), 1, 'gothic', 'mm', True)
    else:
        N.text('クラスター（同じ断片の集まり）', 960, 680, 34, (230, 240, 255), prog(t, a0 + 3, a0 + 4), 'gothic', 'mm', True)


def ov_zfnTalen(N, t, s):
    a0, a1 = L(s, 2); b0, b1 = L(s, 3)
    N.panel(120, 120, 1800, 760, 0.6)
    y = 430
    N.line((180, y - 20), (1740, y - 20), (150, 200, 255), 0.8, 4); N.line((180, y + 20), (1740, y + 20), (255, 120, 200), 0.8, 4)
    if t < b0:
        a = prog(t, a0, a0 + 0.8)
        # ZFN: zinc-finger beads + FokI dimer
        for k in range(3):
            N.circle((420 + k * 56, y - 70), 26, [(90, 120, 255), (90, 230, 120), (255, 120, 60)][k], a, -1)
        N.ellipse((330, y - 70), 50, 36, 0, (255, 200, 120), a, 3); N.text('FokI', 330, y - 70, 22, (255, 220, 160), a, 'gothic', 'mm', True, glow=False)
        N.text('ZFN', 460, y - 150, 40, (150, 170, 255), a, 'gothic', 'mm', True)
        b = prog(t, a0 + 3, a0 + 4)
        cols = [(255, 120, 60), (120, 255, 120), (90, 120, 255), (255, 240, 90)]
        for k in range(12):
            N.ellipse((1060 + k * 42, y - 70), 16, 34, 0, cols[k % 4], b, -1)
        N.ellipse((970, y - 70), 50, 36, 0, (255, 200, 120), b, 3); N.text('FokI', 970, y - 70, 22, (255, 220, 160), b, 'gothic', 'mm', True, glow=False)
        N.text('TALEN', 1290, y - 150, 40, (140, 255, 160), b, 'gothic', 'mm', True)
        N.text('標的ごとにタンパク質を設計し直す', 960, 640, 36, (230, 230, 255), prog(t, a0 + 5, a0 + 6), 'gothic', 'mm', True)
    else:
        # Cas9: same protein, swap the guide
        pos = 520 if ((t - b0) % 3) < 1.5 else 1320
        N.ellipse((pos, y), 190, 120, 0, (255, 150, 60), 0.9, 3)
        N.text('Cas9', pos, y + 90, 32, (255, 180, 110), 1, 'gothic', 'mm', True)
        gcol = (255, 230, 100) if pos == 520 else (120, 255, 200)
        N.line((pos - 120, y - 40), (pos + 60, y - 40), gcol, 1, 6)
        N.text('ガイドRNAを差し替えるだけ', 960, 640, 36, gcol, prog(t, b0 + 0.5, b0 + 1.3), 'gothic', 'mm', True)


def ov_cas9(N, t, s):
    a0, a1 = L(s, 4); b0, b1 = L(s, 5)
    N.panel(80, 120, 1840, 780, 0.6)
    # 20-nt protospacer + PAM (TGG). Cut 3 bp upstream of the PAM.
    target = 'GAGAACGGCGAAAACTAACT'; pam = 'TGG'
    seq = 'CC' + target + pam + 'AT'
    size = 46; st = size * 0.8; x = 960 - (len(seq) - 1) / 2 * st; y = 340; gap = 300
    bot = ''.join(COMP_BASES[c] for c in seq)
    open_ = prog(t, b0 + 0.5, b0 + 2.5)
    cut = prog(t, b1 - 1.2, b1 - 0.2)
    sep = 0
    for i, ch in enumerate(seq):
        intarget = 2 <= i < 22; inpam = 22 <= i < 25
        dx = 0
        if cut > 0:
            dx = -40 * cut if i < 19 else 40 * cut
        col = (255, 200, 120) if inpam else (BASECOL[ch] if intarget else (210, 210, 220))
        yy = y - (40 * open_ if intarget else 0)
        N.text(ch, x + i * st + dx, yy, size, col, 1, 'gothic', 'mm', True, glow=False)
        N.text(bot[i], x + i * st + dx, y + gap, size, (210, 210, 220) if not inpam else (255, 200, 120), 1, 'gothic', 'mm', True, glow=False)
    # guide RNA pairs with the bottom (target) strand
    ga = prog(t, a0 + 0.3, a0 + 1.6)
    gy = y + gap - 70
    rna = ''.join({'A': 'A', 'T': 'U', 'G': 'G', 'C': 'C'}[c] for c in target)
    for i, ch in enumerate(rna):
        N.text(ch, x + (i + 2) * st, gy - (1 - ga) * 160, size * 0.8, (255, 140, 220), ga, 'gothic', 'mm', True, glow=False)
    N.text('ガイドRNA（20塩基）', x + 12 * st, gy - 70 - (1 - ga) * 160, 30, (255, 150, 220), ga, 'gothic', 'mm', True)
    pa = prog(t, b0 + 4.5, b0 + 5.5)
    N.poly([(x + 21.5 * st, y - 40), (x + 24.5 * st, y - 40), (x + 24.5 * st, y + gap + 36), (x + 21.5 * st, y + gap + 36)], (255, 200, 120), pa, 3, True)
    N.text('PAM（NGG）', x + 23 * st, y - 80, 30, (255, 210, 140), pa, 'gothic', 'mm', True)
    if cut > 0 or t > b1 - 1.6:
        xc = x + 18.5 * st
        N.line((xc, y - 60), (xc, y + gap + 50), (255, 255, 255), 1 - cut * 0.5, 3)
        N.text('PAMの3塩基手前で 二本鎖切断', xc, y + gap + 100, 30, (255, 240, 220), prog(t, b1 - 1.2, b1 - 0.4), 'gothic', 'mm', True)


def ov_nhejHdr(N, t, s):
    a0, a1 = L(s, 7); b0, b1 = L(s, 8); c0, c1 = L(s, 9)
    N.panel(100, 120, 1820, 780, 0.6)
    y = 240
    a = prog(t, a0, a0 + 0.8)
    N.line((560, y), (920, y), (200, 220, 255), a, 6); N.line((1000, y), (1360, y), (200, 220, 255), a, 6)
    N.text('二本鎖切断', 960, y - 60, 32, (255, 230, 200), a, 'gothic', 'mm', True)
    # NHEJ
    na = prog(t, a0 + 3.0, a0 + 4)
    N.line((900, y + 40), (520, y + 160), (255, 160, 80), na, 2)
    N.text('非相同末端結合（NHEJ）', 480, y + 200, 32, (255, 170, 100), na, 'gothic', 'mm', True)
    N.line((260, y + 290), (700, y + 290), (200, 220, 255), na, 6)
    N.line((470, y + 290), (510, y + 290), (255, 80, 80), na * (0.6 + 0.4 * math.sin(t * 6)), 8)
    N.text('塩基の欠失・挿入', 480, y + 345, 28, (255, 180, 180), na, 'gothic')
    N.text('→ ノックアウト', 480, y + 400, 34, (255, 200, 140), prog(t, b0, b0 + 0.8), 'gothic', 'mm', True)
    # HDR
    ha = prog(t, c0, c0 + 1)
    N.line((1020, y + 40), (1400, y + 160), (120, 220, 255), ha, 2)
    N.text('相同組換え修復（HDR）', 1440, y + 200, 32, (140, 220, 255), ha, 'gothic', 'mm', True)
    N.line((1220, y + 290), (1660, y + 290), (200, 220, 255), ha, 6)
    N.line((1400, y + 290), (1480, y + 290), (120, 255, 160), ha, 9)
    N.text('鋳型DNA（ドナー）どおりに', 1440, y + 345, 28, (180, 255, 200), ha, 'gothic')
    N.text('→ 狙いどおりの書き換え', 1440, y + 400, 34, (160, 255, 200), prog(t, c0 + 3, c0 + 4), 'gothic', 'mm', True)


def ov_epigenome(N, t, s):
    a0, a1 = L(s, 10)
    N.panel(100, 110, 1820, 780, 0.6)
    y = 430
    a = prog(t, a0, a0 + 0.8)
    for side, (x0, eff, col, res) in enumerate([(200, 'DNAメチル化酵素', (120, 255, 160), '遺伝子発現↓'), (1010, 'TET1（脱メチル化）', (150, 150, 255), '遺伝子発現↑')]):
        aa = prog(t, a0 + 2.5 + side * 1.5, a0 + 3.3 + side * 1.5)
        N.line((x0, y), (x0 + 700, y), (200, 220, 255), a, 4); N.line((x0, y + 26), (x0 + 700, y + 26), (200, 220, 255), a, 4)
        N.ellipse((x0 + 220, y + 13), 150, 90, 0, (255, 190, 120), a, 3)
        N.text('dCas9', x0 + 220, y + 130, 30, (255, 200, 140), a, 'gothic', 'mm', True)
        N.line((x0 + 170, y - 70), (x0 + 270, y - 30), (255, 90, 90), a, 4); N.line((x0 + 170, y - 30), (x0 + 270, y - 70), (255, 90, 90), a, 4)
        N.text('切らない', x0 + 330, y - 50, 24, (255, 150, 150), a, 'gothic', 'lm')
        N.ellipse((x0 + 450, y - 120), 80, 50, 0, col, aa, -1 if False else 3)
        N.text(eff, x0 + 450, y - 200, 28, col, aa, 'gothic', 'mm', True)
        for k in range(3):
            xx = x0 + 480 + k * 60
            on = (k < 3) if side == 0 else False
            m = prog(t, a0 + 4.5 + side * 1.5 + k * 0.3, a0 + 5 + side * 1.5 + k * 0.3)
            vis = m if side == 0 else (1 - m)
            N.line((xx, y), (xx, y - 40), (255, 255, 255), vis, 2); N.circle((xx, y - 48), 9, (255, 110, 110), vis, -1)
            N.text('CG', xx, y + 60, 22, (230, 230, 240), a, 'gothic', 'mm', glow=False)
        N.text(res, x0 + 350, y + 220, 40, col, prog(t, a0 + 7 + side, a0 + 8 + side), 'mincho', 'mm', True)
    N.text('エピゲノム編集：配列は変えずに、働き方を変える', 960, 170, 34, (230, 230, 255), prog(t, a1 - 3, a1 - 2), 'gothic', 'mm', True)


CREDITS = [('路地裏のゲノム', 64, 'mincho'), ('― 遺伝子工学の夜 ―', 34, 'mincho'), ('', 30, 'gothic'),
           ('原案・世界観　航一朗', 32, 'gothic'), ('脚本・演出・作画・音楽　Claude（Anthropic）', 32, 'gothic'), ('', 30, 'gothic'),
           ('声　Microsoft ニューラル音声（Keita／Nanami）', 26, 'gothic'),
           ('キービジュアル　Nova Anime XL（LCM）／OpenVINO', 26, 'gothic'),
           ('高解像度化　Real-ESRGAN animevideov3', 26, 'gothic'), ('奥行き　Depth Anything V2', 26, 'gothic'),
           ('音楽・効果音　NumPy／SciPy による自作合成', 26, 'gothic'),
           ('フォント　しっぽり明朝／Zen 角ゴシック New（SIL OFL）', 26, 'gothic'), ('', 30, 'gothic'),
           ('参考　講義資料「遺伝子工学」2026', 26, 'gothic'), ('本作は学習用の映像です', 26, 'gothic')]


def ov_credits(N, t, s):
    last = s['lines'][-1]['t1']
    start = last + 1.0
    if t < start:
        return
    dur = s['t1'] - start
    u = (t - start) / dur
    y = 1080 - u * (1080 + 60 * len(CREDITS) - 300)
    N.panel(500, 0, 1420, 1080, 0.45 * prog(t, start, start + 1.5))
    for k, (txt, size, kind) in enumerate(CREDITS):
        yy = y + k * 60 + (0 if k < 3 else 20)
        if -50 < yy < 1130 and txt:
            N.text(txt, 960, yy, size, (235, 240, 255), 1, kind, 'mm', k < 2)


def draw(name, out, t, shot, comp):
    global COMP
    COMP = comp
    N = Neon()
    fn = globals().get('ov_' + name)
    if fn is None:
        return out
    fn(N, t, shot)
    return N.compose(out)
