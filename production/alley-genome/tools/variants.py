#!/usr/bin/env python3
"""Blink and talk variants for the character shots: the same key image re-rendered with img2img
("closed eyes" / "open mouth, talking") at low strength. comp.py blends them in only where they differ from
the key image inside the head area, so the figure blinks, and its mouth moves with the voice.

    python3 tools/variants.py [shot ids...]
Writes .cache/keyart/<id>_blink.png and <id>_talk.png.
"""
import json, os, sys, time
import torch
from PIL import Image
from optimum.intel import OVStableDiffusionXLImg2ImgPipeline

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_keyart import PROD, OUT, W, H, NEG, prompt_for  # noqa: E402

CHARS = ('{KIRI}', '{MUSUBI}', '{TSUMUGI}', '{YOMI}', '{HAKOBU}', '{KAGE}')
VARIANTS = {'blink': ', closed eyes', 'talk': ', open mouth, talking'}


def main():
    spec = json.load(open(os.path.join(PROD, 'shots.json'), encoding='utf-8'))
    only = set(sys.argv[1:])
    shots = [s for s in spec['shots'] if 'p' in s and any(c in s['p'] for c in CHARS) and 'from behind' not in s['p']
             and (not only or s['id'] in only) and os.path.exists(os.path.join(OUT, s['id'] + '.png'))]
    todo = [(s, v) for s in shots for v in VARIANTS if not os.path.exists(os.path.join(OUT, f"{s['id']}_{v}.png"))]
    print(f'{len(todo)} variants to make', flush=True)
    if not todo:
        return
    pipe = OVStableDiffusionXLImg2ImgPipeline.from_pretrained('HelloSun/nova_xl_lcm-OpenVINO-INT4', compile=False)
    pipe.reshape(batch_size=1, height=H, width=W, num_images_per_prompt=1)
    pipe.compile()
    for i, (s, v) in enumerate(todo):
        t = time.time()
        base = Image.open(os.path.join(OUT, s['id'] + '.png')).convert('RGB')
        p = prompt_for(s, spec['chars']).replace('looking at viewer', 'looking at viewer' + VARIANTS[v])
        if VARIANTS[v] not in p:
            p = p + VARIANTS[v]
        seed = s.get('seed', 1000 + sum(map(ord, s['id'])))
        im = pipe(prompt=p, negative_prompt=NEG, image=base, strength=0.5, num_inference_steps=8, guidance_scale=1.5,
                  generator=torch.Generator().manual_seed(seed)).images[0]
        dst = os.path.join(OUT, f"{s['id']}_{v}.png")
        im.save(dst + '.tmp.png'); os.replace(dst + '.tmp.png', dst)
        print(f"[{i + 1}/{len(todo)}] {s['id']}_{v} {time.time() - t:.0f}s", flush=True)


if __name__ == '__main__':
    main()
