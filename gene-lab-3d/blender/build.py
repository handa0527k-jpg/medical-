"""Build the parts kit and export it for the web app.

    blender -b --factory-startup --python blender/build.py -- web/public/models/kit.glb
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector  # noqa: E402
import lib  # noqa: E402
import assets  # noqa: E402

out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'kit.glb'
lib.reset()
roots = []
for i, fn in enumerate(assets.ALL):
    r = fn()
    r.location = Vector((i * 200.0, 0, 0))  # spread out; the web app re-centres each part
    roots.append(r)
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
lib.export(out)
print('exported', out, os.path.getsize(out) // 1024, 'KB', [r.name for r in roots])
