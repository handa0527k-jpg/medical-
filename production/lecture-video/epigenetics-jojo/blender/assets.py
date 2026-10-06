"""
3D assets for the epigenetics film, rendered with Blender (Cycles on the CPU, toon shading, Freestyle outlines).

  BL=/opt/blender-dl/blender-4.5.9-linux-x64/blender
  $BL -b -P blender/assets.py -- <clip> [--frames A:B] [--still N]

Each clip is a transparent PNG sequence in out/blender/<clip>/f0000.png … which render.py composites over the 2D
picture. Toon look without real lights: every material is an emission whose colour comes from a 3-step ramp of
dot(normal, light direction) — shadow / base / highlight — and Freestyle draws thick black outlines.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector, Matrix

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "out" / "blender"
FONT = HERE.parent.parent.parent.parent / "tools" / "lecture-video" / "fonts" / "DelaGothicOne-Regular.ttf"
LIGHT = Vector((0.45, -0.65, 0.62)).normalized()


def hexc(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    # sRGB → linear (Blender works in linear; the view transform is Standard)
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)


def mixc(a, b, k):
    return tuple(a[i] + (b[i] - a[i]) * k for i in range(3)) + (1.0,)


# ── scene ───────────────────────────────────────────────────────────────────
def reset(w, h, ortho=None, cam=(0, -14, 0), look=(0, 0, 0), lens=50, line=3.2):
    bpy.ops.wm.read_factory_settings(use_empty=False)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    s.cycles.device = "CPU"
    s.cycles.samples = 12
    s.cycles.use_denoising = False
    s.cycles.max_bounces = 0
    s.cycles.use_adaptive_sampling = False
    s.render.film_transparent = True
    s.render.resolution_x, s.render.resolution_y = w, h
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = "PNG"
    s.render.image_settings.color_mode = "RGBA"
    s.view_settings.view_transform = "Standard"
    s.view_settings.look = "None"
    s.render.fps = 24
    s.world = bpy.data.worlds.new("w") if not s.world else s.world
    s.world.use_nodes = True
    bg = s.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[1].default_value = 0.0
    # Freestyle outlines
    s.render.use_freestyle = True
    s.render.line_thickness_mode = "ABSOLUTE"
    s.render.line_thickness = line
    fs = bpy.context.view_layer.freestyle_settings
    fs.crease_angle = math.radians(120)
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("lines")
    ls.select_by_visibility = True
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = False
    nol = bpy.data.collections.new("nolines")
    bpy.context.scene.collection.children.link(nol)
    ls.select_by_collection = True
    ls.collection = nol
    ls.collection_negation = "EXCLUSIVE"
    ls.select_external_contour = True
    ls.linestyle.color = (0.02, 0.01, 0.04)
    ls.linestyle.thickness = line
    bpy.ops.object.camera_add(location=cam)
    c = bpy.context.object
    d = Vector(look) - Vector(cam)
    c.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    c.data.lens = lens
    if ortho:
        c.data.type = "ORTHO"
        c.data.ortho_scale = ortho
    s.camera = c
    return s


_mats = {}


def toon(name, base, shadow=None, hi=None, emit=1.0):
    """3-step cel material driven by a fixed light direction"""
    key = (name, base, shadow, hi, emit)
    if key in _mats:
        return _mats[key]
    b = hexc(base) if isinstance(base, str) else base
    sh = hexc(shadow) if isinstance(shadow, str) else (shadow or mixc(b, (0.02, 0.0, 0.05), 0.55))
    hl = hexc(hi) if isinstance(hi, str) else (hi or mixc(b, (1, 1, 1), 0.6))
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    dot = nt.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = LIGHT
    rng = nt.nodes.new("ShaderNodeMapRange")
    rng.inputs[1].default_value = -1
    rng.inputs[2].default_value = 1
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, sh
    els[1].position, els[1].color = 0.48, b
    e3 = els.new(0.86)
    e3.color = hl
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[1].default_value = emit
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(geo.outputs["Normal"], dot.inputs[0])
    nt.links.new(dot.outputs["Value"], rng.inputs[0])
    nt.links.new(rng.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], em.inputs[0])
    nt.links.new(em.outputs[0], out.inputs[0])
    _mats[key] = m
    return m


def flat(name, col):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = hexc(col)
    nt.links.new(em.outputs[0], nt.nodes["Material Output"].inputs[0])
    return m


def link(obj, parent=None, mat=None, smooth=True):
    if mat:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    if smooth and obj.type == "MESH":
        for p in obj.data.polygons:
            p.use_smooth = True
    if parent:
        obj.parent = parent
    return obj


def sphere(loc, r, mat, parent=None, seg=32, scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2)
    o = bpy.context.object
    if scale:
        o.scale = scale
    return link(o, parent, mat)


def cyl(a, b, r, mat, parent=None, verts=20):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d.length, location=(a + b) / 2, vertices=verts)
    o = bpy.context.object
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return link(o, parent, mat)


def cone(a, b, r, mat, parent=None):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0, depth=d.length, location=(a + b) / 2, vertices=12)
    o = bpy.context.object
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return link(o, parent, mat, smooth=False)


def empty(loc=(0, 0, 0)):
    bpy.ops.object.empty_add(location=loc)
    return bpy.context.object


def tube(points, r, mat, parent=None, name="tube"):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 4
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, q in zip(sp.points, points):
        p.co = (q[0], q[1], q[2], 1)
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o


def set_tube(o, points):
    sp = o.data.splines[0]
    for p, q in zip(sp.points, points):
        p.co = (q[0], q[1], q[2], 1)


def text3d(s, size, mat, extrude=0.12, bevel=0.03, parent=None, loc=(0, 0, 0), lines=True):
    cu = bpy.data.curves.new("txt", "FONT")
    cu.body = s
    cu.font = bpy.data.fonts.load(str(FONT), check_existing=True)
    cu.size = size
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = 2
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    o = bpy.data.objects.new("txt", cu)
    (bpy.context.collection if lines else bpy.data.collections["nolines"]).objects.link(o)
    o.data.materials.append(mat)
    o.rotation_euler = (math.radians(90), 0, 0)  # face the camera (camera looks along +Y)
    o.location = loc
    if parent:
        o.parent = parent
    return o


def render_frames(name, n, update, frames=None, loop=None):
    d = OUT / name
    d.mkdir(parents=True, exist_ok=True)
    s = bpy.context.scene
    a, b = frames or (0, n)
    for f in range(a, min(b, n)):
        update(f)
        bpy.context.view_layer.update()
        s.render.filepath = str(d / f"f{f:04d}.png")
        bpy.ops.render.render(write_still=True)
    (d / "count.txt").write_text(f"{n} {loop if loop is not None else n - 1}")


def ease_out(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def back_out(x, s=2.0):
    x = max(0.0, min(1.0, x)) - 1
    return x * x * ((s + 1) * x + s) + 1


def bounce_in(x):
    """fall and settle"""
    x = max(0.0, min(1.0, x))
    return 1 - abs(math.cos(x * math.pi * 2.5)) * (1 - x) ** 2


# ── DNA double helix ────────────────────────────────────────────────────────
TOP = "ATGCTCGACGGTATGCTCGACGG"
PAIR = {"A": "T", "T": "A", "G": "C", "C": "G"}
BASE_COL = {"A": "#ff3b3b", "T": "#ff9f1c", "G": "#2fbf5f", "C": "#2b6cff"}


def build_dna(n=16, rise=0.42, r=1.15, meth=False):
    root = empty()
    bb1, bb2 = toon("bb1", "#ff4fa3"), toon("bb2", "#7a5cff")
    p1, p2 = [], []
    for i in range(n * 6 + 1):
        u = i / 6
        x = (u - (n - 1) / 2) * rise
        a = u * math.radians(36)
        p1.append((x, r * math.cos(a), r * math.sin(a)))
        p2.append((x, r * math.cos(a + math.radians(150)), r * math.sin(a + math.radians(150))))
    tube(p1, 0.2, bb1, root)
    tube(p2, 0.2, bb2, root)
    cpg = [i for i in range(n - 1) if TOP[i:i + 2] == "CG"]
    marks = []
    for i in range(n):
        x = (i - (n - 1) / 2) * rise
        a = i * math.radians(36)
        A = Vector((x, r * math.cos(a), r * math.sin(a)))
        B = Vector((x, r * math.cos(a + math.radians(150)), r * math.sin(a + math.radians(150))))
        M = (A + B) / 2
        t, b = TOP[i], PAIR[TOP[i]]
        hot = (i in cpg) or (i - 1 in cpg)
        cyl(A, M, 0.14, toon("b" + t + str(hot), "#ffd23f" if hot and t == "C" else BASE_COL[t]), root)
        cyl(M, B, 0.14, toon("b" + b + str(hot), "#ffd23f" if hot and b == "C" else BASE_COL[b]), root)
        # methyl group on the C of every CpG (both strands): carbon + three hydrogens, sticking out of the groove
        if meth and ((i in cpg and t == "C") or (i - 1 in cpg and b == "C")):
            base_pt = A if t == "C" and i in cpg else B
            out = (base_pt - Vector((x, 0, 0))).normalized()
            m = empty(base_pt + out * 0.55)
            m.parent = root
            sphere((0, 0, 0), 0.34, toon("me", "#38c6ff"), m)
            for k in range(3):
                ang = k * 2 * math.pi / 3
                v = Vector((math.cos(ang) * 0.38, math.sin(ang) * 0.38, 0.22))
                sphere(v, 0.17, toon("h", "#f4f6ff"), m)
            marks.append((m, m.location.copy(), out))
    return root, marks


def clip_dna(name, frames, meth):
    s = reset(590, 380, cam=(0, -12.5, 2.4), look=(0, 0, 0), lens=40, line=2.2)
    root, marks = build_dna(meth=meth)
    root.rotation_euler = (0, 0, math.radians(-8))
    n = 240

    def upd(f):
        root.rotation_euler[0] = 2 * math.pi * f / 120
        for j, (m, home, out) in enumerate(marks):
            k = bounce_in((f - 4 - j * 5) / 22) if name.endswith("drop") else 1.0
            m.location = home + out * 4.0 * (1 - k)
            sc = max(0.001, min(1.0, (f - 4 - j * 5) / 6)) if name.endswith("drop") else 1.0
            m.scale = (sc, sc, sc)

    render_frames(name, n, upd, frames, loop=120)


# ── nucleosome ──────────────────────────────────────────────────────────────
HIST = [("H2A", "#ff5fae"), ("H2B", "#ffb347"), ("H3", "#38c6ff"), ("H4", "#7ee05a")]


def build_octamer(parent, scale=1.0, label=False):
    """two layers of four histones forming a disc (axis = local Y)"""
    balls = []
    for layer, y in enumerate((-0.42, 0.42)):
        for k in range(4):
            a = k * math.pi / 2 + (math.pi / 4 if layer else 0)
            loc = Vector((math.cos(a) * 0.62, y, math.sin(a) * 0.62)) * scale
            nm, col = HIST[(k + layer * 2) % 4]
            b = sphere(loc, 0.6 * scale, toon("hist" + nm, col), parent, scale=(1, 0.8, 1))
            balls.append((b, loc, nm))
    return balls


def superhelix(turns=1.65, R=1.5, pitch=0.7, n=140, wrap=1.0, lead=1.6):
    pts = []
    total = turns * 2 * math.pi
    # straight lead-in, the wrap, straight lead-out
    a0 = -total / 2
    p0 = Vector((R * math.cos(a0), -pitch * turns / 2, R * math.sin(a0)))
    t0 = Vector((-math.sin(a0), 0, math.cos(a0)))
    for i in range(12):
        pts.append(p0 - t0 * lead * (1 - i / 12))
    for i in range(n + 1):
        a = a0 + total * i / n
        pts.append(Vector((R * math.cos(a), -pitch * turns / 2 + pitch * turns * i / n, R * math.sin(a))))
    a1 = a0 + total
    p1 = pts[-1]
    t1 = Vector((-math.sin(a1), 0, math.cos(a1)))
    for i in range(1, 13):
        pts.append(p1 + t1 * lead * i / 12)
    k = max(2, int(len(pts) * wrap))
    return pts[:k]


def clip_nucleosome(name, frames):
    s = reset(590, 400, cam=(0, -9.0, 3.0), look=(0, 0, 0.1), lens=40, line=2.4)
    root = empty()
    root.rotation_euler = (math.radians(55), 0, 0)
    spin = empty()
    spin.parent = root
    balls = build_octamer(spin)
    dna_mat = toon("dna", "#2b6cff")
    full = superhelix()
    dna = tube(full, 0.17, dna_mat, spin, "dna")
    # tails: wiggly tubes from four histones
    tails = []
    for j, (b, loc, nm) in enumerate(balls[::2]):
        d = loc.normalized()
        pts = [loc + d * (0.5 + 0.18 * i) + Vector((0, 0.1 * math.sin(i), 0)) for i in range(8)]
        tl = tube(pts, 0.07, toon("tail", "#ffe3f1"), spin, "tail")
        tails.append((tl, pts, d))
    tags = []
    for j, (tl, pts, d) in enumerate(tails):
        lab = [("#38c6ff"), ("#ffd23f"), ("#ff8a1f"), ("#2fbf5f")][j]
        t = sphere(pts[-1] + d * 0.12, 0.2, toon("tag" + lab, lab), spin)
        tags.append((t, j))
    n = 192

    def upd(f):
        spin.rotation_euler[1] = 2 * math.pi * f / 96
        if name == "nuc_build":
            for j, (b, loc, nm) in enumerate(balls):
                k = back_out((f - j * 4) / 14)
                b.location = loc * (1 + 3 * (1 - k))
                sc = max(0.001, min(1, (f - j * 4) / 6))
                b.scale = (sc, sc * 0.8, sc)
            dna.hide_render = True
            for tl, *_ in tails:
                tl.hide_render = True
            for t, j in tags:
                t.hide_render = True
        elif name == "nuc_wrap":
            w = ease_out(f / 60)
            dna.hide_render = False
            pts = superhelix(wrap=max(0.03, w))
            # rebuild the visible part: collapse the rest onto the last point
            set_tube(dna, pts + [pts[-1]] * (len(full) - len(pts)))
            for t, j in tags:
                t.hide_render = True
        else:  # nuc_tags: histone code marks pop onto the tails
            for t, j in tags:
                k = back_out((f - 6 - j * 8) / 10)
                sc = max(0.001, k)
                t.scale = (sc, sc, sc)

    render_frames(name, n, upd, frames, loop=96)


# ── chromatin fiber: open (euchromatin) ⇄ closed (heterochromatin) ─────────
def nuc_disc(parent, r=0.72):
    """a compact nucleosome for the fibre: histone disc + 1.65 turns of DNA"""
    e = empty()
    e.parent = parent
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=0.62, vertices=32)
    d = link(bpy.context.object, e, toon("disc", "#ff6fb5", "#b3246d", "#ffd0e8"))
    d.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.modifier_add(type="BEVEL")
    d.modifiers[-1].width = 0.12
    d.modifiers[-1].segments = 3
    tube(superhelix(R=r + 0.12, pitch=0.3, n=90, lead=0.0), 0.11, toon("dna", "#2b6cff"), e, "ring")
    return e


def clip_fiber(name, frames):
    s = reset(590, 360, cam=(0, -12, 2.0), look=(0, 0, 0), lens=38, line=2.2)
    root = empty()
    N = 7
    nucs = []
    for i in range(N):
        e = nuc_disc(root)
        ac = sphere((0, 0, 0), 0.24, toon("ac", "#ff8a1f"), e)
        me = sphere((0, 0, 0), 0.24, toon("me", "#38c6ff"), e)
        hp = sphere((0, 0, 0), 0.36, toon("hp1", "#b06bff"), e, scale=(1, 1, 0.8))
        nucs.append((e, ac, me, hp))
    linker = tube([(0, 0, 0)] * (N * 6), 0.1, toon("dna", "#2b6cff"), root, "linker")

    def layout(open_k):
        """open: beads on a string; closed: a tight zig-zag stack"""
        out = []
        for i in range(N):
            xo = (i - (N - 1) / 2) * 1.6
            zo = math.sin(i * 1.3) * 0.45
            xc = (i - (N - 1) / 2) * 0.72
            zc = 0.62 if i % 2 else -0.62
            out.append(Vector((xc + (xo - xc) * open_k, 0, zc + (zo - zc) * open_k)))
        return out

    n = 120
    opening = name == "fiber_open"

    def upd(f):
        k = ease_out((f - 10) / 50)
        open_k = k if opening else 1 - k
        P = layout(open_k)
        pts = []
        for i, (e, ac, me, hp) in enumerate(nucs):
            e.location = P[i]
            tilt = (1 - open_k) * 25 * (1 if i % 2 else -1)
            e.rotation_euler = (math.radians(-28), math.radians(tilt), math.radians(38 + 10 * math.sin(i * 1.7) + f * 0.6))
            ac.location = (0.15, -0.2, 0.95)
            me.location = (-0.15, 0.2, 0.95)
            hp.location = (0, 0, -1.0)
            tk = back_out((f - 20 - i * 5) / 10)
            sac = max(0.001, tk if opening else 1 - min(1, (f - 4) / 14))
            sme = 0.001 if opening else max(0.001, tk)
            shp = 0.001 if opening else max(0.001, back_out((f - 50 - i * 5) / 10))
            ac.scale = (sac,) * 3
            me.scale = (sme,) * 3
            hp.scale = (shp, shp, shp * 0.8)
            if i:
                a, b = P[i - 1], P[i]
                for j in range(6):
                    u = j / 5
                    pts.append(a + (b - a) * u + Vector((0, -0.3 * math.sin(u * math.pi), 0)))
        set_tube(linker, pts + [pts[-1]] * (N * 6 - len(pts)))
        root.rotation_euler = (0, 0, math.radians(6 * math.sin(f / n * 2 * math.pi)))

    render_frames(name, n, upd, frames, loop=n - 1)


# ── 誤解（ゴカイ）: toon sea-worm ─────────────────────────────────────────────
def clip_gokai(name, frames):
    s = reset(520, 640, cam=(0, -16, 1.0), look=(0, 0, 1.0), lens=48, line=3.4)
    root = empty()
    body = toon("gk", "#9b3fe0", "#4a0c78", "#e2a6ff")
    seg = []
    for i in range(12):
        o = sphere((0, 0, 0), 1, body, root)
        bristles = [cone((0, 0, 0), (1, 0, 0), 0.08, toon("br", "#2a0a40"), o) for _ in range(2)]
        seg.append((o, bristles))
    head = sphere((0, 0, 0), 1.9, body, root, scale=(1.15, 0.9, 1))
    eyes = []
    for sx in (-1, 1):
        e = sphere((sx * 0.75, -1.6, 0.35), 0.42, flat("eye", "#fff200"), head, scale=(1.3 / 1.15, 0.5, 0.75))
        p = sphere((sx * 0.75, -2.0, 0.3), 0.14, flat("pupil", "#ff0033"), head)
        eyes.append(e)
    mouth = sphere((0, -1.55, -0.65), 0.75, flat("mouth", "#2a0033"), head, scale=(1.1 / 1.15, 0.35, 0.45))
    for k in range(7):
        x = -0.6 + k * 0.2
        cone((x, -1.85, -0.5), (x, -1.9, -0.82), 0.09, flat("teeth", "#ffffff"), head)
    ants = []
    for sx in (-1, 1):
        a = tube([(sx * 0.5, 0, 1.4), (sx * 1.0, 0, 2.3), (sx * 1.8, 0, 2.7), (sx * 2.2, 0, 2.4)], 0.07,
                 toon("ant", "#2a0a40"), head, "ant")
        sphere((sx * 2.2, 0, 2.4), 0.22, flat("antball", "#ff2bd6"), head)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -1.62, 1.2))
    pl = link(bpy.context.object, head, toon("plate", "#ffffff", "#d9c6ff", "#ffffff"), smooth=False)
    pl.scale = (1.9 / 1.15, 0.12 / 0.9, 0.95)
    text3d("誤解", 0.82, flat("kanji", "#ff1fb4"), extrude=0.02, bevel=0.0, parent=head, loc=(0, -1.72 / 0.9, 1.2), lines=False)
    n = 48

    def upd(f):
        ph = 2 * math.pi * f / n
        pts = []
        for i in range(12):
            k = i / 11
            x = math.sin(ph + k * 4) * 0.9 * (1 - k * 0.4) + k * 1.0
            z = -7.5 + k * 7.0
            pts.append(Vector((x, 0.0, z)))
        for i, (o, br) in enumerate(seg):
            r = 1.05 - i * 0.03
            o.location = pts[i]
            o.scale = (r, r, r * 0.85)
            for j, b in enumerate(br):
                sx = -1 if j == 0 else 1
                b.location = (sx * 1.3, 0, 0)
                b.rotation_euler = (0, math.radians(90 * sx) + math.radians(12 * math.sin(ph * 2 + i)), 0)
                b.scale = (1, 1, 0.6)
        head.location = pts[-1] + Vector((0.3, 0, 2.1))
        head.rotation_euler = (0, math.radians(6 * math.sin(ph)), math.radians(8 * math.sin(ph + 1)))

    render_frames(name, n, upd, frames, loop=0)


# ── 3D logos ────────────────────────────────────────────────────────────────
def clip_logo(name, frames, s_text, cols, n=96, size=1.0):
    s = reset(1100, 420, cam=(0, -12, 0.6), look=(0, 0, 0), lens=55, line=2.8)
    root = empty()
    gold = toon("gold", *cols)
    t = text3d(s_text, size, gold, extrude=0.28, bevel=0.06, parent=root)
    # a darker back face so the extrusion reads
    t.data.materials.append(toon("side", cols[1], "#5a2000", cols[0]))

    def upd(f):
        k = back_out(f / 18, 1.6)
        sc = max(0.001, 3.0 - 2.0 * k)
        root.scale = (sc, sc, sc)
        root.rotation_euler = (math.radians(14 * (1 - ease_out(f / 18)) + 8 * math.sin(f / 48 * 2 * math.pi) * ease_out((f - 18) / 30)),
                               math.radians(-6),
                               math.radians(-70 * (1 - ease_out(f / 20)) + 10 * math.sin(f / 48 * 2 * math.pi + 1) * ease_out((f - 18) / 30)))

    render_frames(name, n, upd, frames, loop=48)


CLIPS = {
    "dna_spin": lambda fr: clip_dna("dna_spin", fr, meth=False),
    "dna_drop": lambda fr: clip_dna("dna_drop", fr, meth=True),
    "dna_meth": lambda fr: clip_dna("dna_meth", fr, meth=True),
    "nuc_build": lambda fr: clip_nucleosome("nuc_build", fr),
    "nuc_wrap": lambda fr: clip_nucleosome("nuc_wrap", fr),
    "nuc_tags": lambda fr: clip_nucleosome("nuc_tags", fr),
    "fiber_open": lambda fr: clip_fiber("fiber_open", fr),
    "fiber_close": lambda fr: clip_fiber("fiber_close", fr),
    "gokai": lambda fr: clip_gokai("gokai", fr),
    "logo_title": lambda fr: clip_logo("logo_title", fr, "エピジェネティクス", ("#ffc21f", "#d46a00", "#fff3a8"), size=1.15),
    "logo_rikai": lambda fr: clip_logo("logo_rikai", fr, "理解ッ！", ("#ffcf1f", "#ff4f00", "#fffbd0"), size=1.9),
}


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    name = argv[0]
    fr = None
    if "--frames" in argv:
        a, b = argv[argv.index("--frames") + 1].split(":")
        fr = (int(a), int(b))
    if "--still" in argv:
        k = int(argv[argv.index("--still") + 1])
        fr = (k, k + 1)
    CLIPS[name](fr)


main()
