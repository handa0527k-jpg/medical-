"""The schematic parts kit for GENE LAB 3D (things without an atomic structure).

Each build_* function makes one root empty named after the asset (the web
app looks parts up by that name) with its meshes and LBL_* label anchors as
children, centred on the origin. Sizes are in nm unless noted.
"""
import math
import random
from mathutils import Vector
from lib import MB, mat, empty, label


def _root(name):
    return empty(name)


# ------------------------------------------------------------ plasmid pUC18 (schematic)

PLASMID_R = 3.2


def _ring_pt(a, r=PLASMID_R):
    return Vector((r * math.cos(a), 0, r * math.sin(a)))


def _arc_arrow(mb, a0, a1, m, r=0.34, head_deg=12):
    """Gene arrow along the ring from angle a0 to a1 (degrees, direction of transcription)."""
    sgn = 1 if a1 > a0 else -1
    a_head = a1 - sgn * head_deg
    n = max(6, int(abs(a_head - a0) / 3))
    mb.tube([_ring_pt(math.radians(a0 + (a_head - a0) * i / n)) for i in range(n + 1)], r, m, seg=12)
    hn = 8
    pts = [_ring_pt(math.radians(a_head + (a1 - a_head) * i / hn)) for i in range(hn + 1)]
    mb.tube(pts, r, m, seg=12, radii=[r * 1.8 * (1 - i / hn) + 0.02 for i in range(hn + 1)])


def build_plasmid():
    root = _root('plasmid')
    dna = MB()
    m1 = mat('pl_strand1', '#f6b93b', rough=0.35)
    m2 = mat('pl_strand2', '#e58e26', rough=0.35)
    turns = 46
    for s, mm in ((0, m1), (math.pi, m2)):
        pts = []
        for i in range(720):
            a = 2 * math.pi * i / 720
            tw = turns * a + s
            c = _ring_pt(a)
            radial = Vector((math.cos(a), 0, math.sin(a)))
            pts.append(c + radial * 0.13 * math.cos(tw) + Vector((0, 0.13 * math.sin(tw), 0)))
        dna.tube(pts, 0.07, mm, seg=6, closed=True)
    dna.build('plasmid_dna', parent=root)

    genes = MB()
    _arc_arrow(genes, 150, 228, mat('ampr', '#ff6b81', rough=0.4, alpha=0.82))
    _arc_arrow(genes, 255, 310, mat('ori', '#70a1ff', rough=0.4, alpha=0.82))
    _arc_arrow(genes, 18, 112, mat('lacz', '#7bed9f', rough=0.4, alpha=0.82))
    # promoter / operator blocks at the start of lacZ
    genes.tube([_ring_pt(math.radians(a)) for a in range(4, 17)], 0.36, mat('lacop', '#2ed573', rough=0.4))
    genes.build('plasmid_genes', parent=root)

    mcs = MB()
    mcs.tube([_ring_pt(math.radians(a)) for a in range(84, 93)], 0.42,
             mat('mcs', '#ffffff', emit='#ffffff', strength=0.6))
    mcs.build('plasmid_mcs', parent=root)

    def lab(n, a, text, sub, r=PLASMID_R + 1.0):
        label(n, _ring_pt(math.radians(a), r), text, parent=root, sub=sub)
    lab('ampr', 190, 'Amp^r', 'アンピシリン耐性遺伝子：導入された大腸菌だけが生き残る')
    lab('ori', 282, 'ori', '複製起点：大腸菌の中で何コピーにも増える')
    lab('lacz', 50, 'lacZ', 'β-ガラクトシダーゼ遺伝子（青白選択）')
    lab('mcs', 88, 'マルチクローニングサイト', '制限酵素サイトが並ぶ挿入口', r=PLASMID_R + 1.5)
    label('center', (0, 0, 0), 'pUC18', parent=root, sub='2,686 bp')
    return root


# ------------------------------------------------------------ E. coli (schematic, ~2 µm drawn as 4 units)

def build_ecoli():
    root = _root('ecoli')
    rnd = random.Random(7)
    body = MB()
    body.sphere((0, 0, 0), 1.0, mat('ecoli_wall', '#9ad0c2', rough=0.3, alpha=0.35), seg=40, rings=24,
                scale=(2.2, 1.0, 1.0))
    body.build('ecoli_body', parent=root)
    # nucleoid: a long tangled chromosome
    nuc = MB()
    p = Vector((0, 0, 0))
    pts = []
    d = Vector((1, 0, 0))
    for i in range(420):
        d = (d + Vector((rnd.uniform(-.7, .7), rnd.uniform(-.7, .7), rnd.uniform(-.7, .7)))).normalized()
        p = p + d * 0.06
        p = Vector((max(-1.2, min(1.2, p.x)), max(-.45, min(.45, p.y)), max(-.45, min(.45, p.z))))
        pts.append(p.copy())
    nuc.tube(pts, 0.025, mat('nucleoid', '#8395a7', rough=0.6), seg=5)
    nuc.build('ecoli_nucleoid', parent=root)
    fl = MB()
    mf = mat('flagella', '#c8d6e5', rough=0.6)
    for k in range(5):
        a = 2 * math.pi * k / 5
        start = Vector((-1.6 + 0.8 * k, 0.9 * math.cos(a) * 0.4, 0.9 * math.sin(a)))
        pts = []
        for i in range(60):
            t = i / 59
            pts.append(start + Vector((-2.4 * t, 0.25 * math.sin(t * 14 + k), (0.5 + 1.5 * t) * math.copysign(1, math.sin(a) or 1) * 0.6
                                       + 0.2 * math.cos(t * 14 + k))))
        fl.tube(pts, 0.025, mf, seg=5)
    fl.build('ecoli_flagella', parent=root)
    label('ecoli', (0, 0, 1.4), '大腸菌', parent=root, sub='プラスミドを複製して増やす「コピー工場」')
    return root


# ------------------------------------------------------------ viral vectors (true relative scale, nm)

def _icosa():
    t = (1 + 5 ** 0.5) / 2
    v = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t),
         (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
    v = [Vector(p).normalized() for p in v]
    f = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2),
         (10, 7, 6), (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5),
         (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
    return v, f


def _capsid(mb, R, m_face, m_bump, grid, bump_r, bump_h):
    """Faceted icosahedral capsid with capsomere bumps laid on a triangular grid on every face."""
    v, f = _icosa()
    v = [p * R for p in v]
    mb.add(v, f, m_face)
    for a, b, c in f:
        A, B, C = v[a], v[b], v[c]
        nrm = ((B - A).cross(C - A)).normalized()
        if nrm.dot(A) < 0:
            nrm = -nrm
        for i in range(grid + 1):
            for j in range(grid + 1 - i):
                k = grid - i - j
                p = (A * i + B * j + C * k) / grid
                mb.sphere(p + nrm * bump_h * 0.3, bump_r, m_bump, seg=8, rings=5, scale=(1, 1, 1))


def build_adeno():
    root = _root('adeno')
    mb = MB()
    R = 40.0  # ~90 nm capsid without fibres
    _capsid(mb, R, mat('ad_face', '#9c6ade', rough=0.5), mat('ad_hexon', '#b197fc', rough=0.45), 6, 4.6, 2.0)
    v, _ = _icosa()
    mf = mat('ad_fiber', '#e5dbff', rough=0.5)
    mk = mat('ad_knob', '#ff8787', rough=0.4)
    for p in v:
        a = p * R
        b = p * (R + 26)
        mb.cyl(a, b, 0.9, mf, seg=8)
        mb.sphere(b, 3.2, mk, seg=12, rings=8)
        mb.sphere(a + p * 2.2, 3.6, mat('ad_penton', '#845ef7', rough=0.4), seg=10, rings=6)
    mb.build('adeno_capsid', parent=root)
    label('adeno', (0, 0, R + 34), 'アデノウイルス', parent=root, sub='70〜90 nm・dsDNA 約36 kb')
    return root


def build_retro():
    """Enveloped retrovirus, cut open toward the viewer to show the core and its two ssRNA copies."""
    root = _root('retro')
    R = 50.0
    env = MB()
    m_env = mat('rv_env', '#adb5bd', rough=0.55)
    m_in = mat('rv_env_in', '#ced4da', rough=0.7)
    seg, rings = 64, 40
    verts, faces = [], []
    for i in range(rings + 1):
        th = math.pi * i / rings
        for j in range(seg + 1):
            ph = 2 * math.pi * j / seg
            verts.append(Vector((R * math.sin(th) * math.cos(ph), R * math.sin(th) * math.sin(ph), R * math.cos(th))))
    for i in range(rings):
        for j in range(seg):
            ph = 2 * math.pi * (j + 0.5) / seg
            th = math.pi * (i + 0.5) / rings
            cut = (math.radians(225) < ph < math.radians(315)) and th > math.radians(35)
            if not cut:
                a = i * (seg + 1) + j
                faces.append((a, a + 1, a + seg + 2, a + seg + 1))
    env.add(verts, faces, m_env)
    # inner wall (shell thickness) so the cut reads as a membrane
    inner = [p * 0.95 for p in verts]
    env.add(inner, [tuple(reversed(fc)) for fc in faces], m_in)
    # Env spikes on a Fibonacci sphere, skipping the cut-away window
    m_sp = mat('rv_spike', '#868e96', rough=0.5)
    m_head = mat('rv_head', '#dee2e6', rough=0.5)
    n = 90
    for k in range(n):
        z = 1 - 2 * (k + 0.5) / n
        ph = math.pi * (3 - 5 ** 0.5) * k
        p = Vector((math.sqrt(1 - z * z) * math.cos(ph), math.sqrt(1 - z * z) * math.sin(ph), z))
        a = math.atan2(p.y, p.x) % (2 * math.pi)
        th = math.acos(p.z)
        if math.radians(220) < a < math.radians(320) and th > math.radians(30):
            continue
        env.cyl(p * R, p * (R + 7), 1.0, m_sp, seg=6)
        env.sphere(p * (R + 9), 3.0, m_head, seg=8, rings=5)
    env.build('retro_envelope', parent=root)
    core = MB()
    core.sphere((0, 0, 0), 26, mat('rv_core', '#f8f9fa', rough=0.6, alpha=0.45), seg=32, rings=20)
    m_rna = mat('rv_rna', '#ff922b', rough=0.4, emit='#ff922b', strength=0.3)
    for s in (0, 1):
        pts = []
        for i in range(400):
            t = i / 399
            z = -18 + 36 * t
            r = 11 * math.sin(math.pi * t) + 2
            a = t * 2 * math.pi * 6 + s * math.pi
            pts.append((r * math.cos(a) + (s - 0.5) * 6, r * math.sin(a), z))
        core.tube(pts, 0.9, m_rna, seg=8)
    core.build('retro_core', parent=root)
    label('retro', (0, 0, R + 16), 'レトロウイルス', parent=root, sub='80〜130 nm・ssRNA 8〜9 kb（宿主ゲノムに組み込まれる）')
    label('rna', (0, -30, -8), 'ssRNAゲノム（2コピー）', parent=root)
    return root


# ------------------------------------------------------------ lab ware (schematic, cm-ish units)

def build_tube():
    """1.5 mL microtube; the liquid is a separate child so the web can tint it per reagent."""
    root = _root('tube')
    glass = MB()
    mg = mat('tube_plastic', '#f1f3f5', rough=0.15, alpha=0.28)
    prof = [(0.05, -2.0), (0.22, -1.85), (0.45, -0.9), (0.5, -0.6), (0.5, 1.4), (0.56, 1.45), (0.56, 1.6)]
    _lathe(glass, prof, mg, seg=32)
    glass.build('tube_body', parent=root)
    cap = MB()
    mc = mat('tube_cap', '#e9ecef', rough=0.35, alpha=0.7)
    cap.cyl((0, 0, 1.6), (0, 0, 1.78), 0.6, mc, seg=32)
    cap.cyl((0.6, 0, 1.68), (0.95, 0, 1.68), 0.06, mc, seg=6)
    cap.build('tube_cap', parent=root)
    liq = MB()
    ml = mat('tube_liquid', '#74c0fc', rough=0.1, alpha=0.75)
    _lathe(liq, [(0.0, -1.95), (0.2, -1.83), (0.42, -1.0), (0.45, -0.8), (0.45, -0.35), (0.0, -0.35)], ml, seg=32,
           cap=True)
    liq.build('tube_liquid', parent=root)
    return root


def _lathe(mb, prof, m, seg=24, cap=False):
    verts, faces = [], []
    for (r, z) in prof:
        for j in range(seg):
            a = 2 * math.pi * j / seg
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for i in range(len(prof) - 1):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    mb.add(verts, faces, m)


# Real molecules (enzymes, Cas9, GFP, AAV) come from the PDB via pipeline/ + molecules.py;
# this kit holds what has no atomic structure: cell-scale schematics and lab ware.
ALL = [build_plasmid, build_ecoli, build_adeno, build_retro, build_tube]
