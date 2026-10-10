// Make dist/models/*.glb loadable on hosts with a strict content-security policy
// (e.g. claude.ai artifacts): no WebAssembly, no fetch of data: URIs, and only
// a fixed list of served file types (.json yes, .glb no).
//
// Each model is Draco-decoded here, re-encoded with KHR_mesh_quantization
// (which three.js reads natively, no decoder), and wrapped as {"glb": base64}
// in <name>.glb.json. Build with VITE_MODELS_JSON=1 so the app fetches those.
//
//   node scripts/hosted-models.mjs dist/models dist/film/models
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { quantize } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['dist/models'];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

for (const dir of dirs.filter((d) => fs.existsSync(d))) for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.glb')).sort()) {
  const file = path.join(dir, name);
  const doc = await io.read(file);
  for (const ext of doc.getRoot().listExtensionsUsed()) if (ext instanceof KHRDracoMeshCompression) ext.dispose();
  await doc.transform(quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeColor: 8 }));
  const glb = await io.writeBinary(doc);
  const out = file + '.json';
  fs.writeFileSync(out, JSON.stringify({ glb: Buffer.from(glb).toString('base64') }));
  fs.rmSync(file);
  console.log(`${name} -> ${path.basename(out)} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
}
