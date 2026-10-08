"""PDB entry -> coloured molecular-surface meshes + metadata for Blender and the web app.

    python3 pipeline/molecules.py            # all molecules
    python3 pipeline/molecules.py 1BHM 5F9R  # some of them

For every molecule this writes to .cache/mesh/<ID>/:
  <part>.ply   binary PLY, vertices with per-vertex colour (from the nearest atoms)
  meta.json    parts, the frame the coordinates were moved into, and landmarks
and to web/public/models/<ID>.json the metadata the labs use (DNA axis, groove
phase, landmarks, citation).

Coordinates are moved into a "DNA frame" when the molecule binds DNA: the
helix axis is +X (Blender), the centre of the site is the origin and the units
are nm. Surfaces are Gaussian density isosurfaces (like VMD QuickSurf /
ChimeraX molmap) extracted with marching cubes.
"""
import json
import os
import sys
import urllib.request

import gemmi
import numpy as np
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.cache')
WEB_MODELS = os.path.join(ROOT, 'web', 'public', 'models')

VDW = {'C': 1.7, 'N': 1.55, 'O': 1.52, 'S': 1.8, 'P': 1.8, 'SE': 1.9, 'MG': 1.73, 'ZN': 1.39, 'CA': 1.97}
NUC = {'DA', 'DT', 'DG', 'DC', 'A', 'U', 'G', 'C', 'GTP', 'DOC'}
BASE_LETTER = {'DA': 'A', 'DT': 'T', 'DG': 'G', 'DC': 'C', 'A': 'A', 'U': 'U', 'G': 'G', 'C': 'C', 'GTP': 'G',
               'DOC': 'C'}
BACKBONE = {"P", "OP1", "OP2", "O5'", "C5'", "C4'", "O4'", "C3'", "O3'", "C2'", "C1'", "O2'"}

# colours (sRGB hex) shared with the web app
BASE_HEX = {'A': '#f2c230', 'T': '#3fb56b', 'G': '#e04a5f', 'C': '#3a9ad9', 'U': '#9b6bd6'}


def hx(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)])


# ---------------------------------------------------------------- configuration
# parts: name -> selector(atom record) ; colour: function(atom record) -> hex
# A record is a dict with chain, resname, resseq, atom, element, kind ('protein'|'dna'|'rna'|'ligand').

def by_chain(table, default='#cccccc'):
    def f(a):
        return table.get(a['chain'], default)
    return f


def nucleic_colour(backbone_hex='#e9ecef', base=None):
    def f(a):
        if a['atom'] in BACKBONE:
            return backbone_hex
        return (base or BASE_HEX).get(BASE_LETTER.get(a['resname'], 'A'), '#aaaaaa')
    return f


MOLECULES = {
    '1BHM': dict(
        title='BamHI–DNA 複合体', enzyme='BamHI', site='GGATCC',
        cite='Newman M, et al. Science 269:656 (1995)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein', by_chain({'A': '#f4a259', 'B': '#f7c59f'})),
            'dna': (lambda a: a['kind'] == 'dna', nucleic_colour()),
        },
        frame='dna', grid=0.9),
    '1ERI': dict(
        title='EcoRI–DNA 複合体', enzyme='EcoRI', site='GAATTC',
        cite='Kim Y, et al. Science 249:1307 (1990)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein', by_chain({'A1': '#5fa8d3', 'A2': '#a9d6e5'}, '#a9d6e5')),
            'dna': (lambda a: a['kind'] == 'dna', nucleic_colour()),
        },
        frame='dna', grid=0.9),
    '2E52': dict(
        title='HindIII–DNA 複合体', enzyme='HindIII', site='AAGCTT',
        cite='Watanabe N, et al. Nucleic Acids Res 37:5197 (2009)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein', by_chain({'A': '#80b918', 'C': '#bfd200'}, '#bfd200')),
            'dna': (lambda a: a['kind'] == 'dna', nucleic_colour()),
        },
        frame='dna', grid=0.9),
    '1DFM': dict(
        title='BglII–DNA 複合体', enzyme='BglII', site='AGATCT',
        cite='Lukacs CM, et al. Nat Struct Biol 7:134 (2000)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein', by_chain({'A': '#b5179e', 'B': '#f15bb5'})),
            'dna': (lambda a: a['kind'] == 'dna', nucleic_colour()),
        },
        frame='dna', grid=0.9),
    '1X9N': dict(
        title='ヒトDNAリガーゼI–切れ目DNA 複合体',
        cite='Pascal JM, et al. Nature 432:473 (2004)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein', by_chain({'A': '#2a9d8f'})),
            'dna': (lambda a: a['kind'] == 'dna', nucleic_colour()),
            'amp': (lambda a: a['resname'] == 'AMP', lambda a: '#ffd166'),
        },
        frame='dna', grid=0.9),
    '3KTQ': dict(
        title='Taq DNAポリメラーゼ（Klentaq）–DNA–ddCTP 三元複合体',
        cite='Li Y, Korolev S, Waksman G. EMBO J 17:7514 (1998)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein' and a['resname'] != 'DCT', by_chain({'A': '#7b9acc'})),
            'dna': (lambda a: a['kind'] == 'dna', nucleic_colour()),
            'ddntp': (lambda a: a['resname'] == 'DCT', lambda a: '#ff4d6d'),
        },
        frame='dna', grid=0.9),
    '5F9R': dict(
        title='Cas9–sgRNA–標的DNA 複合体（R-loop）',
        cite='Jiang F, et al. Science 351:867 (2016)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein', lambda a: '#e9c48d'),
            'sgrna': (lambda a: a['kind'] == 'rna', lambda a: '#3d7dd8' if a['atom'] in BACKBONE else '#6fa8ff'),
            'dna': (lambda a: a['kind'] == 'dna', lambda a: (
                '#9aa5b1' if a['chain'] == 'C' else '#cfd6dd') if a['atom'] in BACKBONE else (
                '#c97b7b' if a['chain'] == 'D' and 9 <= a['index'] <= 11 else '#b8c2cc')),
        },
        frame='cas9', grid=1.0),
    '1EMA': dict(
        title='緑色蛍光タンパク質 GFP',
        cite='Ormö M, et al. Science 273:1392 (1996)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein' and a['resname'] != 'CRO', lambda a: '#9be564'),
            'chromophore': (lambda a: a['resname'] == 'CRO', lambda a: '#3dff6e'),
        },
        frame='inertia', grid=0.8),
    '1LP3': dict(
        title='アデノ随伴ウイルス2型（AAV2）カプシド',
        cite='Xie Q, et al. PNAS 99:10405 (2002)',
        parts={
            'protein': (lambda a: a['kind'] == 'protein', None),
        },
        frame='centre', grid=2.2, sigma_scale=1.9, ca_only=True),
}


# ---------------------------------------------------------------- loading

def fetch(pid):
    os.makedirs(os.path.join(CACHE, 'pdb'), exist_ok=True)
    path = os.path.join(CACHE, 'pdb', pid + '.cif')
    if not os.path.exists(path):
        urllib.request.urlretrieve(f'https://files.rcsb.org/download/{pid}.cif', path)
    return path


def load_atoms(pid, cfg):
    st = gemmi.read_structure(fetch(pid))
    st.setup_entities()
    st.remove_hydrogens()
    model = gemmi.make_assembly(st.assemblies[0], st[0], gemmi.HowToNameCopiedChain.AddNumber)
    recs = []
    names = [ch.name for ch in model]
    single = all(n.endswith('1') for n in names)  # one copy of each chain: drop the copy number
    for ch in model:
        cname = ch.name[:-1] if single else ch.name
        idx = -1
        last = None
        for res in ch:
            info = gemmi.find_tabulated_residue(res.name)
            if res.name in ('HOH', 'SO4', 'GOL', 'ACT', 'MG', 'CA', 'NA', 'CL', 'EDO'):
                continue
            if info and info.is_amino_acid() or res.name in ('MSE', 'CRO'):
                kind = 'protein'
            elif res.name in ('DA', 'DT', 'DG', 'DC', 'DOC'):
                kind = 'dna'
            elif res.name in ('A', 'U', 'G', 'C', 'GTP'):
                kind = 'rna'
            else:
                kind = 'ligand'
            if res.seqid != last:
                idx += 1
                last = res.seqid
            for at in res:
                if cfg.get('ca_only') and kind == 'protein' and at.name not in ('CA', 'C', 'N', 'O', 'CB'):
                    continue
                recs.append(dict(chain=cname, resname=res.name, resseq=res.seqid.num, index=idx, atom=at.name,
                                 element=at.element.name.upper(), kind=kind,
                                 pos=np.array(at.pos.tolist())))
    return recs


# ---------------------------------------------------------------- frames

def pca_axis(pts):
    c = pts.mean(axis=0)
    _, _, vt = np.linalg.svd(pts - c)
    return c, vt[0]


def basis_from_x(x, up_hint):
    x = x / np.linalg.norm(x)
    z = up_hint - x * np.dot(up_hint, x)
    z /= np.linalg.norm(z)
    y = np.cross(z, x)
    return np.stack([x, y, z])  # rows: new axes


def groove_phase(recs, R, c, x0=0.0):
    """Angle about +X (radians, from +Y toward +Z) of the minor groove at x = x0 (Å):
    the direction from the axis to the C1' atoms of the two base pairs nearest x0."""
    c1 = [((a['pos'] - c) @ R.T) for a in recs if a['kind'] == 'dna' and a['atom'] == "C1'"]
    c1 = np.array(c1)
    near = c1[np.argsort(np.abs(c1[:, 0] - x0))[:4]]
    m = near.mean(axis=0)
    return float(np.arctan2(m[2], m[1]))


def make_frame(pid, cfg, recs):
    P = np.array([a['pos'] for a in recs])
    prot = np.array([a['pos'] for a in recs if a['kind'] == 'protein'])
    meta = {}
    if cfg['frame'] == 'dna':
        phos = np.array([a['pos'] for a in recs if a['kind'] == 'dna' and a['atom'] == 'P'])
        c, x = pca_axis(phos)
        # centre on the middle of the recognition site: the mean of the C1' atoms
        c1 = np.array([a['pos'] for a in recs if a['kind'] == 'dna' and a['atom'] == "C1'"])
        c = c + x * np.dot(c1.mean(axis=0) - c, x)
        R = basis_from_x(x, prot.mean(axis=0) - c)
        meta['groovePhase'] = groove_phase(recs, R, c)
    elif cfg['frame'] == 'cas9':
        # PAM-proximal duplex: non-target strand D with the target-strand atoms paired to it
        dD = np.array([a['pos'] for a in recs if a['chain'] == 'D' and a['atom'] == 'P'])
        tree = cKDTree(dD)
        dC = np.array([a['pos'] for a in recs if a['chain'] == 'C' and a['atom'] == 'P'
                       and tree.query(a['pos'])[0] < 22])
        c, x = pca_axis(np.vstack([dD, dC]))
        d5 = [a['pos'] for a in recs if a['chain'] == 'D' and a['atom'] == 'P']
        if np.dot(d5[-1] - d5[0], x) < 0:
            x = -x  # +X runs 5'->3' along the non-target strand, i.e. toward the PAM
        # origin at the cut in the non-target strand: between D[5] and D[6]
        cut = next(a['pos'] for a in recs if a['chain'] == 'D' and a['index'] == 6 and a['atom'] == 'P')
        c = c + x * np.dot(cut - c, x)
        R = basis_from_x(x, prot.mean(axis=0) - c)
        pam = [((a['pos'] - c) @ R.T) / 10 for a in recs if a['chain'] == 'D' and 9 <= a['index'] <= 11
               and a['atom'] == "C1'"]
        meta['pam'] = np.mean(pam, axis=0).round(3).tolist()
        # the protospacer is unwound, so measure the groove on the PAM duplex
        meta['groovePhase'] = groove_phase(recs, R, c, x0=meta['pam'][0] * 10)
        meta['grooveAt'] = meta['pam'][0]
    elif cfg['frame'] == 'inertia':
        c, x = pca_axis(prot)
        R = basis_from_x(x, np.cross(x, [0, 0, 1]) if abs(x[2]) < 0.9 else np.array([1.0, 0, 0]))
        R = np.stack([R[2], R[1], R[0]])  # long axis up (+Z)
    else:
        c = P.mean(axis=0)
        R = np.eye(3)
    for a in recs:
        a['p'] = ((a['pos'] - c) @ R.T) / 10.0  # Å -> nm
    meta['frame'] = cfg['frame']
    return meta


# ---------------------------------------------------------------- surfaces

def gaussian_surface(pos_nm, radii_nm, grid_nm, sigma_scale=0.72, iso=0.36):
    pad = 3 * radii_nm.max() * sigma_scale + 2 * grid_nm
    lo = pos_nm.min(axis=0) - pad
    hi = pos_nm.max(axis=0) + pad
    shape = np.ceil((hi - lo) / grid_nm).astype(int) + 1
    rho = np.zeros(shape, dtype=np.float32)
    sig = radii_nm * sigma_scale
    g = (pos_nm - lo) / grid_nm
    gi = np.round(g).astype(int)
    reach = int(np.ceil(3 * sig.max() / grid_nm))
    inv2s2 = 1.0 / (2 * sig ** 2)
    rng = range(-reach, reach + 1)
    for dx in rng:
        for dy in rng:
            for dz in rng:
                idx = gi + np.array([dx, dy, dz])
                d2 = (((idx - g) * grid_nm) ** 2).sum(axis=1)
                w = np.exp(-d2 * inv2s2)
                ok = w > 1e-3
                np.add.at(rho, (idx[ok, 0], idx[ok, 1], idx[ok, 2]), w[ok].astype(np.float32))
    verts, faces, _, _ = marching_cubes(rho, level=iso, spacing=(grid_nm,) * 3)
    verts += lo
    return verts, faces


def vertex_colours(verts, pos, cols, k=6, width=0.25):
    tree = cKDTree(pos)
    d, i = tree.query(verts, k=min(k, len(pos)))
    if d.ndim == 1:
        d, i = d[:, None], i[:, None]
    w = np.exp(-(d / width) ** 2) + 1e-9
    w /= w.sum(axis=1, keepdims=True)
    return (cols[i] * w[..., None]).sum(axis=1)


def write_ply(path, verts, faces, cols):
    """Normals are left to Blender (computed from the outward CCW winding)."""
    n, m = len(verts), len(faces)
    vdt = np.dtype([('x', '<f4'), ('y', '<f4'), ('z', '<f4'), ('red', 'u1'), ('green', 'u1'), ('blue', 'u1')])
    va = np.empty(n, dtype=vdt)
    va['x'], va['y'], va['z'] = verts.T
    c8 = np.clip(np.round(cols * 255), 0, 255).astype(np.uint8)
    va['red'], va['green'], va['blue'] = c8.T
    fdt = np.dtype([('n', 'u1'), ('a', '<i4'), ('b', '<i4'), ('c', '<i4')])
    fa = np.empty(m, dtype=fdt)
    fa['n'] = 3
    # marching_cubes winding is clockwise seen from outside here; reverse for CCW
    fa['a'], fa['b'], fa['c'] = faces[:, 0], faces[:, 2], faces[:, 1]
    with open(path, 'wb') as f:
        f.write((f'ply\nformat binary_little_endian 1.0\nelement vertex {n}\n'
                 'property float x\nproperty float y\nproperty float z\n'
                 'property uchar red\nproperty uchar green\nproperty uchar blue\n'
                 f'element face {m}\nproperty list uchar int vertex_indices\nend_header\n').encode())
        f.write(va.tobytes())
        f.write(fa.tobytes())


def aav_colour(recs):
    """Colour the 60-mer capsid by distance from the centre (radial depth cue, like EM maps)."""
    r = np.array([np.linalg.norm(a['p']) for a in recs])
    t = (r - np.percentile(r, 5)) / (np.percentile(r, 99.5) - np.percentile(r, 5))
    t = np.clip(t, 0, 1)
    inner, mid, outer = hx('#5a189a'), hx('#c9184a'), hx('#ffb3c1')
    out = np.where(t[:, None] < 0.6, inner + (mid - inner) * (t[:, None] / 0.6),
                   mid + (outer - mid) * ((t[:, None] - 0.6) / 0.4))
    return out


# ---------------------------------------------------------------- landmarks (labels in the web app)

def landmarks(pid, recs):
    def at(chain, resseq, atom='CA'):
        for a in recs:
            if a['chain'] == chain and a['resseq'] == resseq and a['atom'] == atom:
                return np.round(a['p'], 3).tolist()
        return None

    def centroid(sel):
        p = np.array([a['p'] for a in recs if sel(a)])
        return np.round(p.mean(axis=0), 3).tolist() if len(p) else None

    L = {}
    if pid == '1BHM':
        L['activeA'] = at('A', 111)  # E111 (catalytic, with D94/E113)
        L['activeB'] = at('B', 111)
    if pid == '1ERI':
        L['activeA'] = at('A1', 111)  # K113/E111/D91 catalytic triad region
    if pid == '3KTQ':
        L['ddntp'] = centroid(lambda a: a['resname'] == 'DCT')
        L['fingers'] = at('A', 660)  # O-helix region (fingers)
    if pid == '1X9N':
        L['amp'] = centroid(lambda a: a['resname'] == 'AMP')
    if pid == '5F9R':
        L['hnh'] = at('B', 840)      # H840: HNH active site (cuts the target strand)
        L['ruvc'] = at('B', 10)      # D10: RuvC active site (cuts the non-target strand)
        L['pam'] = centroid(lambda a: a['chain'] == 'D' and 9 <= a['index'] <= 11)
        L['sgrna5'] = centroid(lambda a: a['kind'] == 'rna' and a['index'] < 3)
        L['rec'] = centroid(lambda a: a['chain'] == 'B' and 94 <= a['resseq'] <= 718)
        L['nuc'] = centroid(lambda a: a['chain'] == 'B' and 1099 <= a['resseq'] <= 1368)
    if pid == '1EMA':
        L['chromophore'] = centroid(lambda a: a['resname'] == 'CRO')
    return {k: v for k, v in L.items() if v is not None}


# ---------------------------------------------------------------- main

def build(pid):
    cfg = MOLECULES[pid]
    recs = load_atoms(pid, cfg)
    meta = make_frame(pid, cfg, recs)
    out = os.path.join(CACHE, 'mesh', pid)
    os.makedirs(out, exist_ok=True)
    parts = {}
    for name, (sel, colour) in cfg['parts'].items():
        sub = [a for a in recs if sel(a)]
        if not sub:
            continue
        pos = np.array([a['p'] for a in sub])
        rad = np.array([VDW.get(a['element'], 1.7) for a in sub]) / 10.0
        if cfg.get('ca_only'):
            rad = rad * 1.25
        grid = cfg['grid'] / 10.0
        if name in ('chromophore', 'ddntp', 'amp'):
            grid = 0.05
        verts, faces = gaussian_surface(pos, rad, grid, sigma_scale=0.72 * cfg.get('sigma_scale', 1.0)
                                                 if name == 'protein' else 0.72)
        cols = aav_colour(sub) if colour is None else np.array([hx(colour(a)) for a in sub])
        vc = vertex_colours(verts, pos, cols, width=0.25 if not cfg.get('ca_only') else 0.6)
        write_ply(os.path.join(out, name + '.ply'), verts, faces, vc)
        parts[name] = dict(verts=int(len(verts)), faces=int(len(faces)), atoms=len(sub))
        print(f'{pid} {name}: {len(sub)} atoms -> {len(faces)} triangles')
    lm = landmarks(pid, recs)
    allp = np.array([a['p'] for a in recs])
    info = dict(id=pid, title=cfg['title'], cite=cfg['cite'], parts=parts, landmarks=lm,
                bounds=[np.round(allp.min(axis=0), 2).tolist(), np.round(allp.max(axis=0), 2).tolist()],
                enzyme=cfg.get('enzyme'), site=cfg.get('site'), **meta)
    with open(os.path.join(out, 'meta.json'), 'w') as f:
        json.dump(info, f, ensure_ascii=False, indent=1)
    os.makedirs(WEB_MODELS, exist_ok=True)
    web = dict(info)
    web.pop('parts')
    web['parts'] = list(parts)
    with open(os.path.join(WEB_MODELS, pid + '.json'), 'w') as f:
        json.dump(web, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    ids = sys.argv[1:] or list(MOLECULES)
    for pid in ids:
        build(pid)
