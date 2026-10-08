"""Turn the molecular surfaces from pipeline/molecules.py into web-ready glTF.

    blender -b --factory-startup --python blender/molecules.py -- [--render] [ID ...]

For every molecule: import the coloured PLY parts, decimate to a web budget,
bake ambient occlusion into the vertex colours (so crevices stay dark in the
browser without any post-processing), export web/public/models/<ID>.glb
(Draco-compressed) and, with --render, a Cycles portrait to
web/public/renders/<ID>.jpg.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MESH = os.path.join(ROOT, '.cache', 'mesh')
OUT = os.path.join(ROOT, 'web', 'public', 'models')
RENDERS = os.path.join(ROOT, 'web', 'public', 'renders')

# triangle budget per part in the browser
BUDGET = {'protein': 70000, 'dna': 12000, 'sgrna': 26000, 'chromophore': 1500, 'ddntp': 1500, 'amp': 1500}
BUDGET_OVERRIDE = {('5F9R', 'protein'): 110000, ('1LP3', 'protein'): 160000}
GLOW = {'chromophore': ('#3dff6e', 3.0), 'ddntp': ('#ff4d6d', 1.2), 'amp': ('#ffd166', 1.0)}
AO_DIST = {'1LP3': 3.0}
VIEW = {  # camera azimuth / elevation for the portrait
    '5F9R': (-25, 15), '1LP3': (0, 10), '1EMA': (-30, 10),
}


def hexlin(h):
    h = h.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def material(name, glow=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    ca = nt.nodes.new('ShaderNodeVertexColor')
    ca.layer_name = 'Col'
    nt.links.new(ca.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.55
    b.inputs['Specular IOR Level'].default_value = 0.35
    if glow:
        b.inputs['Emission Color'].default_value = (*hexlin(glow[0]), 1)
        b.inputs['Emission Strength'].default_value = glow[1]
    return m


def import_part(pid, part):
    path = os.path.join(MESH, pid, part + '.ply')
    bpy.ops.wm.ply_import(filepath=path)
    ob = bpy.context.selected_objects[0]
    ob.name = f'{pid}_{part}'
    ob.data.name = ob.name
    tris = len(ob.data.polygons)
    target = BUDGET_OVERRIDE.get((pid, part), BUDGET.get(part, 30000))
    if tris > target:
        mod = ob.modifiers.new('dec', 'DECIMATE')
        mod.ratio = target / tris
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier='dec')
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(material(ob.name, GLOW.get(part)))
    return ob


def bake_ao(objs, dist):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 24
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.light_settings.distance = dist
    for ob in objs:
        me = ob.data
        base = me.color_attributes.get('Col')
        if base is None:
            continue
        ao = me.color_attributes.new('AO', 'FLOAT_COLOR', 'POINT')
        me.color_attributes.active_color = ao
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
        n = len(me.vertices)
        import numpy as np
        a = np.empty(n * 4, dtype=np.float32)
        ao.data.foreach_get('color', a)
        c = np.empty(n * 4, dtype=np.float32)
        base.data.foreach_get('color', c)
        a = a.reshape(-1, 4)[:, :1]
        c = c.reshape(-1, 4)
        c[:, :3] *= 0.22 + 0.78 * a
        base.data.foreach_set('color', c.ravel())
        me.color_attributes.remove(me.color_attributes['AO'])
        me.color_attributes.active_color = me.color_attributes['Col']
        me.color_attributes.render_color_index = 0


def export(pid):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, pid + '.glb')
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', export_yup=True, export_apply=True,
        export_animations=False, export_cameras=False, export_lights=False,
        export_vertex_color='ACTIVE', export_all_vertex_colors=False,
        export_normals=True, export_texcoords=False,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=10,
        export_draco_color_quantization=8)
    return path


def render(pid, objs):
    sc = bpy.context.scene
    lo = Vector((1e9,) * 3)
    hi = Vector((-1e9,) * 3)
    for o in objs:
        for v in o.data.vertices:
            lo = Vector(map(min, lo, v.co))
            hi = Vector(map(max, hi, v.co))
    c = (lo + hi) / 2
    size = (hi - lo).length
    az, el = VIEW.get(pid, (-58, 18))
    d = Vector((math.sin(math.radians(az)) * math.cos(math.radians(el)),
                -math.cos(math.radians(az)) * math.cos(math.radians(el)),
                math.sin(math.radians(el))))
    cd = bpy.data.cameras.new('cam')
    cd.lens = 60
    cam = bpy.data.objects.new('cam', cd)
    sc.collection.objects.link(cam)
    cam.location = c + d * size * 1.45
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    for loc, power, col in (((-1, -1.2, 1.4), 1.0, (1, .95, .88)), ((1.4, 0.6, .5), .55, (.55, .7, 1)),
                            ((0.2, 1.5, -.6), .6, (1, .75, .85))):
        ld = bpy.data.lights.new('l', 'AREA')
        ld.energy = power * 600 * (size / 8) ** 2
        ld.size = size * 0.7
        ld.color = col
        lo_ = bpy.data.objects.new('l', ld)
        sc.collection.objects.link(lo_)
        lo_.location = c + Vector(loc) * size
        lo_.rotation_euler = (c - lo_.location).to_track_quat('-Z', 'Y').to_euler()
    w = sc.world
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.01, 0.013, 0.025, 1)
    sc.cycles.samples = int(os.environ.get('SAMPLES', 64))
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 960, 720
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 86
    os.makedirs(RENDERS, exist_ok=True)
    sc.render.filepath = os.path.join(RENDERS, pid + '.jpg')
    bpy.ops.render.render(write_still=True)


def main():
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    do_render = '--render' in args
    ids = [a for a in args if not a.startswith('--')] or sorted(os.listdir(MESH))
    for pid in ids:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        meta = json.load(open(os.path.join(MESH, pid, 'meta.json')))
        objs = [import_part(pid, p) for p in meta['parts']]
        bake_ao(objs, AO_DIST.get(pid, 1.2))
        path = export(pid)
        print('exported', path, os.path.getsize(path) // 1024, 'KB',
              {o.name: len(o.data.polygons) for o in objs})
        if do_render:
            render(pid, objs)


main()
