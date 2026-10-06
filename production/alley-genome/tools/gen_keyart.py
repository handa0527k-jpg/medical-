#!/usr/bin/env python3
"""Key art for 路地裏のゲノム: one anime image per shot with Nova Anime XL (LCM) on CPU via OpenVINO.

    python3 production/alley-genome/tools/gen_keyart.py [shot ids...]
Images land in production/alley-genome/.cache/keyart/<id>.png; existing ones are skipped (delete to redo).
Model: HelloSun/nova_xl_lcm-OpenVINO-INT4 (SDXL anime, LCM 8 steps, CFG 1.5), 1344x768.
"""
import json, os, sys, time
import torch
from optimum.intel import OVDiffusionPipeline

PROD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(PROD, '.cache', 'keyart')
W, H = 1344, 768
STYLE = ', night, rain, neon lights, back alley, cinematic lighting, rim lighting, depth of field'
Q = ', masterpiece, best quality, amazing quality, very aesthetic, anime screencap'
NEG = 'realistic, photo, 3d, lowres, worst quality, low quality, bad anatomy, bad hands, extra digits, text, watermark, signature, logo, letters'


def prompt_for(shot, chars):
    p = shot['p']
    for k, v in chars.items():
        p = p.replace('{' + k + '}', v)
    return p + STYLE + Q


def main():
    spec = json.load(open(os.path.join(PROD, 'shots.json'), encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    todo = [s for s in spec['shots'] if 'p' in s and (not only or s['id'] in only)
            and not os.path.exists(os.path.join(OUT, s['id'] + '.png'))]
    print(f'{len(todo)} images to generate', flush=True)
    if not todo:
        return
    pipe = OVDiffusionPipeline.from_pretrained('HelloSun/nova_xl_lcm-OpenVINO-INT4', compile=False)
    pipe.reshape(batch_size=1, height=H, width=W, num_images_per_prompt=1)
    pipe.compile()
    for i, s in enumerate(todo):
        t = time.time()
        seed = s.get('seed', 1000 + sum(map(ord, s['id'])))
        im = pipe(prompt=prompt_for(s, spec['chars']), negative_prompt=NEG, height=H, width=W, num_inference_steps=8,
                  guidance_scale=1.5, generator=torch.Generator().manual_seed(seed)).images[0]
        im.save(os.path.join(OUT, s['id'] + '.png.tmp.png'))
        os.replace(os.path.join(OUT, s['id'] + '.png.tmp.png'), os.path.join(OUT, s['id'] + '.png'))
        print(f"[{i + 1}/{len(todo)}] {s['id']} {time.time() - t:.0f}s", flush=True)


if __name__ == '__main__':
    main()
