#!/usr/bin/env python3
"""Prepare key art for compositing: anime upscale (Real-ESRGAN animevideov3, x4 then to 2688x1536),
depth (Depth Anything V2 small, ONNX) and a character matte (anime-seg isnet, ONNX).

    python3 production/alley-genome/tools/prep.py            # every key image that is not prepared yet
Writes .cache/up/<id>.jpg, .cache/depth/<id>.png (16-bit, near = bright), .cache/matte/<id>.png
"""
import glob, os, sys
import cv2, numpy as np, onnxruntime as ort, torch, torch.nn as nn

PROD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(PROD, '.cache')
UW, UH = 2688, 1536
torch.set_num_threads(4)


class SRVGG(nn.Module):  # SRVGGNetCompact (Real-ESRGAN), 16 convs, x4
    def __init__(self, nf=64, nc=16, s=4):
        super().__init__()
        L = [nn.Conv2d(3, nf, 3, 1, 1), nn.PReLU(nf)]
        for _ in range(nc):
            L += [nn.Conv2d(nf, nf, 3, 1, 1), nn.PReLU(nf)]
        L += [nn.Conv2d(nf, 3 * s * s, 3, 1, 1)]
        self.body = nn.ModuleList(L); self.up = nn.PixelShuffle(s); self.s = s

    def forward(self, x):
        o = x
        for m in self.body:
            o = m(o)
        return self.up(o) + nn.functional.interpolate(x, scale_factor=self.s, mode='nearest')


_sr = None
def upscale(img):
    global _sr
    if _sr is None:
        _sr = SRVGG(); _sr.load_state_dict(torch.load(os.path.join(C, 'models', 'realesr-animevideov3.pth'), map_location='cpu')['params']); _sr.eval()
    x = torch.from_numpy(img[:, :, ::-1].astype(np.float32) / 255).permute(2, 0, 1)[None]
    out = []
    with torch.inference_mode():  # tiles keep memory low
        h = x.shape[2]; step = 192
        for y in range(0, h, step):
            a, b = max(0, y - 8), min(h, y + step + 8)
            o = _sr(x[:, :, a:b])[:, :, (y - a) * 4:(y - a) * 4 + min(step, h - y) * 4]
            out.append(o)
    o = torch.cat(out, 2)[0].clamp(0, 1).permute(1, 2, 0).numpy()[:, :, ::-1]
    o = (o * 255).round().astype(np.uint8)
    return cv2.resize(o, (UW, UH), interpolation=cv2.INTER_AREA)


_dep = None
def depth(img):
    global _dep
    if _dep is None:
        _dep = ort.InferenceSession(os.path.join(C, 'models', 'depth_v2_small.onnx'), providers=['CPUExecutionProvider'])
    x = cv2.resize(img, (994, 560), interpolation=cv2.INTER_AREA)[:, :, ::-1].astype(np.float32) / 255
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    d = _dep.run(None, {_dep.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    d = cv2.resize(d, (UW // 4, UH // 4), interpolation=cv2.INTER_CUBIC)
    d = cv2.GaussianBlur(d, (0, 0), 1.2)
    return (np.clip(d, 0, 1) * 65535).astype(np.uint16)


_seg = None
def matte(img):
    global _seg
    if _seg is None:
        _seg = ort.InferenceSession(os.path.join(C, 'models', 'isnetis.onnx'), providers=['CPUExecutionProvider'])
    s = 1024; h, w = img.shape[:2]; k = s / max(h, w)
    nh, nw = int(h * k), int(w * k)
    x = np.zeros((s, s, 3), np.float32)
    x[(s - nh) // 2:(s - nh) // 2 + nh, (s - nw) // 2:(s - nw) // 2 + nw] = cv2.resize(img, (nw, nh))[:, :, ::-1] / 255.0
    m = _seg.run(None, {'img': x.transpose(2, 0, 1)[None]})[0][0][0]
    m = m[(s - nh) // 2:(s - nh) // 2 + nh, (s - nw) // 2:(s - nw) // 2 + nw]
    return (cv2.resize(m, (UW // 2, UH // 2)) * 255).clip(0, 255).astype(np.uint8)


def main():
    for d in ('up', 'depth', 'matte', 'vmask'):
        os.makedirs(os.path.join(C, d), exist_ok=True)
    srcs = sorted(p for p in glob.glob(os.path.join(C, 'keyart', '*.png')) if '_' not in os.path.basename(p))
    only = set(sys.argv[1:])
    for p in srcs:
        i = os.path.basename(p)[:-4]
        if only and i not in only:
            continue
        up = os.path.join(C, 'up', i + '.jpg')
        if os.path.exists(up) and os.path.getmtime(up) > os.path.getmtime(p):
            continue
        img = cv2.imread(p)
        u = upscale(img)
        cv2.imwrite(os.path.join(C, 'depth', i + '.png'), depth(img))
        cv2.imwrite(os.path.join(C, 'matte', i + '.png'), matte(img))
        cv2.imwrite(up + '.tmp.jpg', u, [cv2.IMWRITE_JPEG_QUALITY, 95]); os.replace(up + '.tmp.jpg', up)
        print('prepared', i, flush=True)
    variants(only)


_fp = {}
def face_parts(base):
    if base not in _fp:
        from PIL import Image
        from imgutils.detect import detect_faces, detect_eyes
        im = Image.open(os.path.join(C, 'keyart', base + '.png')).convert('RGB')
        f = [b for b, _, sc in detect_faces(im) if sc > 0.4]
        e = [b for b, _, sc in detect_eyes(im) if sc > 0.3]
        f.sort(key=lambda b: -(b[2] - b[0]) * (b[3] - b[1]))
        _fp[base] = (f, e)
    return _fp[base]


def variants(only=()):
    """<id>_blink / <id>_talk: upscale, and a mask of where they differ from the key image inside the head area."""
    for p in sorted(glob.glob(os.path.join(C, 'keyart', '*_*.png'))):
        v = os.path.basename(p)[:-4]; base = v.rsplit('_', 1)[0]
        if only and base not in only:
            continue
        up = os.path.join(C, 'up', v + '.jpg')
        if os.path.exists(up) and os.path.getmtime(up) > os.path.getmtime(p):
            continue
        a = cv2.imread(os.path.join(C, 'keyart', base + '.png')); b = cv2.imread(p)
        mt = cv2.imread(os.path.join(C, 'matte', base + '.png'), cv2.IMREAD_GRAYSCALE)
        if a is None or mt is None:
            continue
        # keep the variant's detail, take the key image's lighting (img2img drifts in colour/light)
        af, bf = a.astype(np.float32), b.astype(np.float32)
        b = np.clip(bf - cv2.GaussianBlur(bf, (0, 0), 10) + cv2.GaussianBlur(af, (0, 0), 10), 0, 255).astype(np.uint8)
        d = cv2.absdiff(cv2.GaussianBlur(a, (0, 0), 1.5), cv2.GaussianBlur(b, (0, 0), 1.5)).astype(np.float32).max(2) / 255
        # where to look: eyes (blink) or mouth (talk), from an anime face / eye detector (deepghs imgutils)
        region = np.zeros(a.shape[:2], np.float32)
        faces, eyes = face_parts(base)
        if faces:
            x0, y0, x1, y1 = faces[0]; fw, fh = x1 - x0, y1 - y0
            if v.endswith('blink'):
                ee = [e for e in eyes if x0 - fw * 0.1 <= (e[0] + e[2]) / 2 <= x1 + fw * 0.1 and y0 <= (e[1] + e[3]) / 2 <= y1] or \
                     [(x0 + fw * 0.15, y0 + fh * 0.38, x0 + fw * 0.45, y0 + fh * 0.6), (x0 + fw * 0.55, y0 + fh * 0.38, x0 + fw * 0.85, y0 + fh * 0.6)]
                for ex0, ey0, ex1, ey1 in ee:
                    cv2.ellipse(region, (int((ex0 + ex1) / 2), int((ey0 + ey1) / 2)), (int((ex1 - ex0) * 0.95), int((ey1 - ey0) * 1.3)), 0, 0, 360, 1.0, -1)
            else:
                cv2.ellipse(region, (int(x0 + fw * 0.5), int(y0 + fh * 0.8)), (int(fw * 0.22), int(fh * 0.13)), 0, 0, 360, 1.0, -1)
        region = cv2.GaussianBlur(region, (0, 0), 6)
        d = cv2.GaussianBlur(d, (0, 0), 2)
        mask = region * np.clip(0.35 + d * 8, 0, 1)
        mask = cv2.resize(mask, (672, 384), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(C, 'vmask', v + '.png'), (np.clip(mask, 0, 1) * 255).astype(np.uint8))
        cv2.imwrite(up + '.tmp.jpg', upscale(b), [cv2.IMWRITE_JPEG_QUALITY, 95]); os.replace(up + '.tmp.jpg', up)
        print('prepared variant', v, f'mask area {float((mask > 0.3).mean()) * 100:.2f}%', flush=True)


if __name__ == '__main__':
    main()
