"""Rewrite every dist/models/*.glb as a self-contained glTF JSON (<name>.gltf.json).

Some static hosts (e.g. claude.ai artifacts) only serve a fixed list of file
types; .json is on it, .glb is not. Build with VITE_GLTF_JSON=1 so the app
asks for the .gltf.json files, then run this script over dist/.

    python3 scripts/glb-to-json.py dist/models
"""
import base64
import json
import os
import struct
import sys

folder = sys.argv[1] if len(sys.argv) > 1 else 'dist/models'
for name in sorted(os.listdir(folder)):
    if not name.endswith('.glb'):
        continue
    path = os.path.join(folder, name)
    data = open(path, 'rb').read()
    magic, _version, _length = struct.unpack_from('<4sII', data, 0)
    assert magic == b'glTF', name
    off = 12
    doc, binary = None, b''
    while off < len(data):
        clen, ctype = struct.unpack_from('<II', data, off)
        chunk = data[off + 8: off + 8 + clen]
        if ctype == 0x4E4F534A:
            doc = json.loads(chunk.decode('utf-8'))
        elif ctype == 0x004E4942:
            binary = chunk
        off += 8 + clen
    if doc.get('buffers'):
        doc['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binary).decode()
    out = path[:-4] + '.gltf.json'
    with open(out, 'w') as f:
        json.dump(doc, f, separators=(',', ':'))
    os.remove(path)
    print(f'{name} -> {os.path.basename(out)} ({os.path.getsize(out) // 1024} KB)')
