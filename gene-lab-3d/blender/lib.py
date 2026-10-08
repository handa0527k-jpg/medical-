"""Procedural modelling helpers for GENE LAB 3D (Blender 4.5 LTS, headless).

Everything is built from code: no hand-made .blend files. The kit holds the
parts with no atomic structure: plasmid, E. coli and the tube are schematic;
adenovirus and retrovirus are drawn at true size in nm. The real molecules
come from the PDB (see pipeline/ and molecules.py), and DNA itself is built by
the web app from the sequence the learner is working on.

Conventions
- Blender is Z-up; the glTF exporter turns it into Y-up (x, y, z) -> (x, z, -y).
- Labels are empties named LBL_* with custom properties (exported as glTF
  extras) that the web viewer turns into HTML labels.
"""
import math
import bpy
from mathutils import Vector, Matrix


_mats = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    return bpy.context.scene


# ---------------------------------------------------------------- materials

def _lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexcol(h):
    h = h.lstrip('#')
    return tuple(_lin(int(h[i:i + 2], 16)) for i in (0, 2, 4))


def mat(name, color, rough=0.45, metal=0.0, emit=None, strength=1.0, alpha=1.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexcol(color), 1.0)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*hexcol(emit), 1.0)
        b.inputs['Emission Strength'].default_value = strength
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        m.surface_render_method = 'BLENDED'
        m.use_backface_culling = False
    m.diffuse_color = (*hexcol(color), alpha)
    _mats[name] = m
    return m


# ---------------------------------------------------------------- mesh builder

def _frame_for(d):
    d = d.normalized()
    up = Vector((0, 0, 1)) if abs(d.z) < 0.9 else Vector((1, 0, 0))
    u = d.cross(up).normalized()
    v = d.cross(u).normalized()
    return u, v


class MB:
    """Accumulates primitives (with per-face materials) into one mesh object."""

    def __init__(self):
        self.v, self.f, self.fm, self.mats = [], [], [], []

    def _mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def add(self, verts, faces, m):
        o = len(self.v)
        mi = self._mi(m)
        self.v.extend(tuple(p) for p in verts)
        for fc in faces:
            self.f.append(tuple(i + o for i in fc))
            self.fm.append(mi)

    def sphere(self, c, r, m, seg=12, rings=8, scale=(1, 1, 1)):
        c = Vector(c)
        verts = [c + Vector((0, 0, r * scale[2]))]
        for i in range(1, rings):
            th = math.pi * i / rings
            for j in range(seg):
                ph = 2 * math.pi * j / seg
                verts.append(c + Vector((r * scale[0] * math.sin(th) * math.cos(ph),
                                         r * scale[1] * math.sin(th) * math.sin(ph),
                                         r * scale[2] * math.cos(th))))
        verts.append(c - Vector((0, 0, r * scale[2])))
        faces = []
        for j in range(seg):
            faces.append((0, 1 + j, 1 + (j + 1) % seg))
        for i in range(rings - 2):
            a, b = 1 + i * seg, 1 + (i + 1) * seg
            for j in range(seg):
                faces.append((a + j, b + j, b + (j + 1) % seg, a + (j + 1) % seg))
        last = len(verts) - 1
        a = 1 + (rings - 2) * seg
        for j in range(seg):
            faces.append((a + (j + 1) % seg, a + j, last))
        self.add(verts, faces, m)

    def cyl(self, a, b, r, m, seg=10, caps=True, r2=None):
        a, b = Vector(a), Vector(b)
        r2 = r if r2 is None else r2
        d = b - a
        if d.length < 1e-6:
            return
        u, v = _frame_for(d)
        verts = []
        for p, rr in ((a, r), (b, r2)):
            for j in range(seg):
                ph = 2 * math.pi * j / seg
                verts.append(p + rr * (math.cos(ph) * u + math.sin(ph) * v))
        faces = [(j, (j + 1) % seg, seg + (j + 1) % seg, seg + j) for j in range(seg)]
        if caps:
            verts += [a, b]
            ia, ib = 2 * seg, 2 * seg + 1
            faces += [((j + 1) % seg, j, ia) for j in range(seg)]
            faces += [(seg + j, seg + (j + 1) % seg, ib) for j in range(seg)]
        self.add(verts, faces, m)

    def tube(self, pts, r, m, seg=10, closed=False, radii=None, caps=True):
        pts = [Vector(p) for p in pts]
        n = len(pts)
        if n < 2:
            return
        tans = []
        for i in range(n):
            if closed:
                t = pts[(i + 1) % n] - pts[i - 1]
            else:
                t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]
            tans.append(t.normalized())
        u, _ = _frame_for(tans[0])
        frames = []
        for i in range(n):
            t = tans[i]
            u = (u - t * u.dot(t)).normalized()
            frames.append((u, t.cross(u).normalized()))
        verts, faces = [], []
        for i, p in enumerate(pts):
            rr = radii[i] if radii else r
            uu, vv = frames[i]
            for j in range(seg):
                ph = 2 * math.pi * j / seg
                verts.append(p + rr * (math.cos(ph) * uu + math.sin(ph) * vv))
        rings = n if closed else n - 1
        for i in range(rings):
            a, b = i * seg, ((i + 1) % n) * seg
            for j in range(seg):
                faces.append((a + j, a + (j + 1) % seg, b + (j + 1) % seg, b + j))
        if caps and not closed:
            verts += [pts[0], pts[-1]]
            ia, ib = len(verts) - 2, len(verts) - 1
            faces += [((j + 1) % seg, j, ia) for j in range(seg)]
            o = (n - 1) * seg
            faces += [(o + j, o + (j + 1) % seg, ib) for j in range(seg)]
        self.add(verts, faces, m)

    def box(self, c, size, m):
        c = Vector(c)
        sx, sy, sz = (s / 2 for s in size)
        verts = [c + Vector((x * sx, y * sy, z * sz))
                 for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
        faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
        self.add(verts, faces, m)

    def ribbon(self, pts, normals, width, m, thick=0.05, arrow=0):
        """Flat strip (beta strand style). arrow>0 widens the last `arrow` points into an arrowhead."""
        n = len(pts)
        verts, faces = [], []
        for i, (p, nn) in enumerate(zip(pts, normals)):
            p = Vector(p)
            t = (Vector(pts[min(i + 1, n - 1)]) - Vector(pts[max(i - 1, 0)])).normalized()
            side = t.cross(Vector(nn)).normalized()
            w = width
            if arrow and i >= n - arrow:
                k = (n - 1 - i) / max(arrow - 1, 1)
                w = width * 1.9 * k + 0.02
            up = Vector(nn).normalized() * thick
            for s in (-1, 1):
                for h in (-1, 1):
                    verts.append(p + side * (w / 2) * s + up * h)
        for i in range(n - 1):
            a, b = i * 4, (i + 1) * 4
            # 0:(-,-) 1:(-,+) 2:(+,-) 3:(+,+)
            for q in ((1, 3), (2, 0), (3, 2), (0, 1)):
                faces.append((a + q[0], a + q[1], b + q[1], b + q[0]))
        faces.append((0, 1, 3, 2))
        o = (n - 1) * 4
        faces.append((o + 2, o + 3, o + 1, o + 0))
        self.add(verts, faces, m)

    def text(self, s, loc, size, m, rot=(math.pi / 2, 0, 0), align='CENTER', extrude=0.02):
        cu = bpy.data.curves.new('tmp_txt', 'FONT')
        cu.body = s
        cu.size = size
        cu.align_x = align
        cu.align_y = 'CENTER'
        cu.extrude = extrude
        ob = bpy.data.objects.new('tmp_txt', cu)
        bpy.context.scene.collection.objects.link(ob)
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        mw = Matrix.Translation(Vector(loc)) @ _euler(rot)
        verts = [mw @ v.co for v in me.vertices]
        faces = [tuple(p.vertices) for p in me.polygons]
        self.add(verts, faces, m)
        bpy.data.objects.remove(ob)
        bpy.data.curves.remove(cu)
        bpy.data.meshes.remove(me)

    def merge_from(self, me, mw, m):
        self.add([mw @ v.co for v in me.vertices], [tuple(p.vertices) for p in me.polygons], m)

    def build(self, name, parent=None, smooth=True, loc=(0, 0, 0)):
        me = bpy.data.meshes.new(name)
        lo = Vector(loc)
        me.from_pydata([Vector(v) - lo for v in self.v], [], self.f)
        for m in self.mats:
            me.materials.append(m)
        me.polygons.foreach_set('material_index', self.fm)
        me.polygons.foreach_set('use_smooth', [smooth] * len(self.f))
        me.validate()
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        ob.location = lo
        if parent:
            ob.parent = parent
        return ob


def _euler(rot):
    from mathutils import Euler
    return Euler(rot, 'XYZ').to_matrix().to_4x4()


# ---------------------------------------------------------------- scene graph

def empty(name, loc=(0, 0, 0), parent=None, **props):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_size = 0.2
    bpy.context.scene.collection.objects.link(ob)
    if parent:
        ob.parent = parent
    ob.location = Vector(loc)
    for k, v in props.items():
        ob[k] = v
    return ob


def label(name, loc, text, parent=None, sub=''):
    """An HTML label anchor for the viewer (glTF extras: label, sub)."""
    return empty('LBL_' + name, loc, parent, label=text, sub=sub)


# ---------------------------------------------------------------- export

def export(path):
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', export_extras=True, export_yup=True,
        export_animations=False, export_cameras=False, export_lights=False,
        export_apply=True, use_selection=False)
