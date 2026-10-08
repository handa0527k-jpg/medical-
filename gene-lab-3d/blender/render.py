"""Render a Cycles portrait of every part (used as the lab cards' artwork).

    blender -b --factory-startup --python blender/render.py -- web/public/renders [name ...]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402
import lib  # noqa: E402
import assets  # noqa: E402

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
outdir = args[0] if args else 'renders'
only = set(args[1:])
os.makedirs(outdir, exist_ok=True)

# camera direction per part (azimuth, elevation in degrees)
VIEW = {'plasmid': (0, 8), 'gfp': (20, 18), 'retro': (-10, 12), 'tube': (25, 12)}


def bounds(root):
    lo = Vector((1e9,) * 3)
    hi = Vector((-1e9,) * 3)
    for o in root.children_recursive:
        if o.type != 'MESH':
            continue
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    return lo, hi


for fn in assets.ALL:
    name = fn.__name__.replace('build_', '')
    if only and name not in only:
        continue
    sc = lib.reset()
    root = fn()
    bpy.context.view_layer.update()
    lo, hi = bounds(root)
    c = (lo + hi) / 2
    size = (hi - lo).length
    az, el = VIEW.get(name, (-30, 18))
    d = Vector((math.sin(math.radians(az)) * math.cos(math.radians(el)),
                -math.cos(math.radians(az)) * math.cos(math.radians(el)),
                math.sin(math.radians(el))))
    cam_data = bpy.data.cameras.new('cam')
    cam_data.lens = 70
    cam = bpy.data.objects.new('cam', cam_data)
    sc.collection.objects.link(cam)
    cam.location = c + d * size * 2.3
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    # key / rim lights scaled to the part
    for loc, power, col in (((-1, -1.2, 1.4), 1.0, (1, .96, .9)), ((1.4, 1, .6), .7, (.6, .75, 1)),
                            ((0, 1.5, -1), .5, (1, .7, .8))):
        ld = bpy.data.lights.new('l', 'AREA')
        ld.energy = power * 900 * (size / 10) ** 2
        ld.size = size * 0.6
        ld.color = col
        lo_ = bpy.data.objects.new('l', ld)
        sc.collection.objects.link(lo_)
        lo_.location = c + Vector(loc) * size
        lo_.rotation_euler = (c - lo_.location).to_track_quat('-Z', 'Y').to_euler()
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.016, 0.03, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    sc.world = w
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = int(os.environ.get("SAMPLES", 48))
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 800, 600
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 86
    sc.render.filepath = os.path.join(os.path.abspath(outdir), name + '.jpg')
    bpy.ops.render.render(write_still=True)
    print('rendered', sc.render.filepath)
