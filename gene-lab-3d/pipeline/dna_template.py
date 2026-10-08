"""Base-pair atom templates for building atomic B-DNA of any sequence in the browser.

    python3 pipeline/dna_template.py   ->  web/public/models/bdna.json

Source: PDB 1BNA (Drew & Dickerson 1981, the B-DNA dodecamer CGCGAATTCGCG),
which contains all four base-pair types. For each pair type (strand-1 base +
its partner) the atoms of the most central example are expressed in a local
base-pair frame (the standard reference frame of Olson et al. 2001, re-labelled):

  x  helix axis, pointing 5'->3' along strand 1
  y  toward the minor groove (the side the two C1' atoms are on)
  z  x cross y

so the browser places base pair k by rotating the template k*twist about x and
shifting it k*rise. Twist and rise are measured from the same structure.
Units are nm; coordinates follow three.js (any right-handed frame works since
the template only gets rotated about x).
"""
import json
import os

import gemmi
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '.cache', 'pdb', '1BNA.cif')
OUT = os.path.join(ROOT, 'web', 'public', 'models', 'bdna.json')
BACKBONE = {"P", "OP1", "OP2", "O5'", "C5'", "C4'", "O4'", "C3'", "O3'", "C2'", "C1'"}


def main():
    st = gemmi.read_structure(SRC)
    st.remove_hydrogens()
    a = [r for r in st[0]['A'] if r.name.startswith('D')]
    b = [r for r in st[0]['B'] if r.name.startswith('D')]
    n = len(a)
    pairs = [(a[i], b[n - 1 - i]) for i in range(n)]

    def pos(res, name):
        return np.array(res[name][0].pos.tolist())

    # standard base-pair reference frames (Olson et al. 2001): y along C1'(2)->C1'(1),
    # z normal to the base-pair plane (5'->3' along strand 1), x = y*z toward the
    # major groove, origin 0.248 nm from the C1' midpoint toward the major groove.
    frames = []
    for i, (r1, r2) in enumerate(pairs):
        c1, c2 = pos(r1, "C1'"), pos(r2, "C1'")
        y = (c1 - c2) / np.linalg.norm(c1 - c2)
        base = np.array([at.pos.tolist() for r in (r1, r2) for at in r if at.name not in BACKBONE])
        _, _, vt = np.linalg.svd(base - base.mean(axis=0))
        z = vt[2] - y * np.dot(vt[2], y)
        z /= np.linalg.norm(z)
        along = pos(pairs[min(i + 1, n - 1)][0], "C1'") - pos(pairs[max(i - 1, 0)][0], "C1'")
        if np.dot(z, along) < 0:
            z = -z
        x = np.cross(y, z)
        o = (c1 + c2) / 2 + 2.48 * x
        frames.append((o, np.stack([x, y, z])))

    rises, twists = [], []
    for i in range(2, n - 3):
        (o1, R1), (o2, R2) = frames[i], frames[i + 1]
        mz = R1[2] + R2[2]
        mz /= np.linalg.norm(mz)
        rises.append(np.dot(o2 - o1, mz))
        twists.append(np.arctan2(np.dot(np.cross(R1[1], R2[1]), mz), np.dot(R1[1], R2[1])))
    rise = float(np.mean(rises)) / 10
    twist = float(np.mean(twists))

    templates = {}
    for i in sorted(range(n), key=lambda i: abs(i - (n - 1) / 2)):
        r1, r2 = pairs[i]
        key = r1.name[1] + r2.name[1]
        if key in templates:
            continue
        o, R = frames[i]
        # output axes: X = helix axis (z), Y = minor groove (-x), Z = X*Y (-y)
        R = np.stack([R[2], -R[0], -R[1]])

        def atoms(res):
            out = []
            for at in res:
                p = (np.array(at.pos.tolist()) - o) @ R.T / 10
                out.append([at.element.name.upper(), *np.round(p, 4).tolist(), 1 if at.name in BACKBONE else 0,
                            at.name])
            return out
        templates[key] = {'s1': atoms(r1), 's2': atoms(r2)}

    data = {
        'source': 'PDB 1BNA (Drew HR, et al. PNAS 78:2179, 1981)',
        'rise': round(rise, 4), 'twist': round(twist, 5),
        'frame': 'x = helix axis (strand 1 5->3), y = minor groove, z = x*y; nm',
        'pairs': templates,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as f:
        json.dump(data, f, separators=(',', ':'))
    print('rise %.3f nm, twist %.1f deg/bp (%.1f bp/turn), pairs %s' % (
        rise, np.degrees(twist), 360 / abs(np.degrees(twist)), sorted(templates)))


main()
