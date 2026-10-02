"""CMU mocap (ASF skeleton + AMC motion) → joint positions for the 2D renderer.

Forward kinematics follows the ASF/AMC convention: for each bone
  L = parent.L · C · M · C⁻¹,   end = parent.end + length · L · direction
with C from the bone's `axis` and M from the frame's dof values (Euler XYZ → Rz·Ry·Rx).
Output (JSON): fps, joint names, frames × joints × [x, y, z] in metres (y up), and a head
forward vector per frame. Resampled to 30 fps.

usage: python3 amc2json.py SUBJ.asf CLIP.amc SRC_FPS OUT.json [start_s end_s]
"""
import json, sys, math
import numpy as np

def rot(axis, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    if axis == 'x': return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    if axis == 'y': return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

def euler(x, y, z): return rot('z', z) @ rot('y', y) @ rot('x', x)

def parse_asf(path):
    lines = [l.strip() for l in open(path) if l.strip() and not l.startswith('#')]
    bones, hier, i, scale = {}, {}, 0, 1.0
    root_axis = [0, 0, 0]
    while i < len(lines):
        l = lines[i]
        if l.startswith(':units'):
            i += 1
            while not lines[i].startswith(':'):
                k, v = lines[i].split()[:2]
                if k == 'length': scale = float(v)
                i += 1
            continue
        if l.startswith(':root'):
            i += 1
            while not lines[i].startswith(':'):
                p = lines[i].split()
                if p[0] == 'orientation': root_axis = [float(v) for v in p[1:4]]
                i += 1
            continue
        if l.startswith(':bonedata'):
            i += 1
            while not lines[i].startswith(':'):
                if lines[i] == 'begin':
                    b = {'dof': []}; i += 1
                    while lines[i] != 'end':
                        p = lines[i].split()
                        if p[0] == 'name': b['name'] = p[1]
                        elif p[0] == 'direction': b['dir'] = np.array([float(v) for v in p[1:4]])
                        elif p[0] == 'length': b['len'] = float(p[1])
                        elif p[0] == 'axis': b['axis'] = [float(v) for v in p[1:4]]
                        elif p[0] == 'dof': b['dof'] = [d.lower() for d in p[1:]]
                        i += 1
                    bones[b['name']] = b
                i += 1
            continue
        if l.startswith(':hierarchy'):
            i += 1
            while i < len(lines) and lines[i] != 'end':
                if lines[i] != 'begin':
                    p = lines[i].split(); hier[p[0]] = p[1:]
                i += 1
            i += 1; continue
        i += 1
    # metres: ASF length units are inches / scale
    k = (1.0 / scale) * 0.0254
    for b in bones.values(): b['len'] *= k
    return bones, hier, root_axis, k

def parse_amc(path):
    frames, cur = [], None
    for l in open(path):
        l = l.strip()
        if not l or l.startswith('#') or l.startswith(':'): continue
        if l.isdigit():
            cur = {}; frames.append(cur); continue
        p = l.split(); cur[p[0]] = [float(v) for v in p[1:]]
    return frames

JOINTS = {  # output name → bone whose END is the joint ('root' = pelvis)
  'pelvis': 'root', 'hipL': 'lhipjoint', 'kneeL': 'lfemur', 'ankleL': 'ltibia', 'toeL': 'lfoot',
  'hipR': 'rhipjoint', 'kneeR': 'rfemur', 'ankleR': 'rtibia', 'toeR': 'rfoot',
  'waist': 'lowerback', 'chest': 'upperback', 'thorax': 'thorax', 'neck': 'lowerneck', 'neck2': 'upperneck', 'head': 'head',
  'shoulderL': 'lclavicle', 'elbowL': 'lhumerus', 'wristL': 'lradius', 'handL': 'lhand',
  'shoulderR': 'rclavicle', 'elbowR': 'rhumerus', 'wristR': 'rradius', 'handR': 'rhand',
}

def fk(bones, hier, root_axis, k, fr):
    out, mats = {}, {}
    Cr = euler(*root_axis)
    r = fr['root']
    pos = np.array(r[:3]) * k
    out['root'] = pos; mats['root'] = Cr @ euler(r[3], r[4], r[5]) @ Cr.T
    stack = ['root']
    while stack:
        p = stack.pop()
        for c in hier.get(p, []):
            b = bones[c]; C = euler(*b['axis'])
            v = fr.get(c, []); d = dict(zip(b['dof'], v))
            M = euler(d.get('rx', 0), d.get('ry', 0), d.get('rz', 0))
            L = mats[p] @ C @ M @ C.T
            mats[c] = L; out[c] = out[p] + b['len'] * (L @ b['dir'])
            stack.append(c)
    return out, mats

def main():
    asf, amc, src_fps, dst = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
    t0 = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
    t1 = float(sys.argv[6]) if len(sys.argv) > 6 else None
    bones, hier, root_axis, k = parse_asf(asf)
    frames = parse_amc(amc)
    n = len(frames); dur = n / src_fps
    t1 = min(t1 or dur, dur)
    names = list(JOINTS)
    data, heads = [], []
    for j in range(int((t1 - t0) * 30)):
        idx = min(n - 1, int(round((t0 + j / 30) * src_fps)))
        P, M = fk(bones, hier, root_axis, k, frames[idx])
        data.append([[round(float(x), 4) for x in P[JOINTS[nm]]] for nm in names])
        # head forward: the head bone's local +z in CMU's skeleton points out of the face
        Hm = M['head']; f = Hm @ np.array([0, 0, 1.0])
        heads.append([round(float(x), 3) for x in f])
    json.dump({'fps': 30, 'joints': names, 'frames': data, 'headFwd': heads, 'src': amc.split('/')[-1]}, open(dst, 'w'), separators=(',', ':'))
    print(dst, len(data), 'frames', f'{len(data)/30:.1f}s')

if __name__ == '__main__': main()
