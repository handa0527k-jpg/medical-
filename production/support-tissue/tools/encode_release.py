#!/usr/bin/env python3
"""配布用 MP4 をつくる（GitHub の 1 ファイル 100 MB 制限に収める）。

    python3 tools/encode_release.py [--mb 94]

入力：output/medical_support_tissue_master.mp4（シーンを CRF 23 で書き出して結合した高画質版、git には入れない）
出力：output/medical_support_tissue.mp4（1920×1080・30fps・H.264 2パス・AAC 128k・日本語字幕トラック）
      画質の目安として、高画質版との SSIM を表示する。
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'output')
master = os.path.join(OUT, 'medical_support_tissue_master.mp4')
release = os.path.join(OUT, 'medical_support_tissue.mp4')
srt = os.path.join(ROOT, 'subtitles', 'medical_support_tissue.srt')
mb = float(sys.argv[sys.argv.index('--mb') + 1]) if '--mb' in sys.argv else 94.0


def probe(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', p], capture_output=True, text=True, check=True)
    f = json.loads(r.stdout)['format']
    return float(f['duration']), int(f['size'])


dur, size = probe(master)
print(f'master: {dur / 60:.2f} min, {size / 1e6:.1f} MB')
if size <= mb * 1024 * 1024:
    subprocess.run(['cp', master, release], check=True)
    print('master already fits; copied')
    sys.exit(0)
audio_k = 128
video_k = int((mb * 1024 * 1024 * 8 / dur) / 1000 - audio_k - 6)  # 6 kbps はコンテナの余裕
print(f'target video bitrate {video_k} kbps')
common = ['-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-b:v', f'{video_k}k', '-maxrate', f'{video_k * 3}k', '-bufsize', f'{video_k * 6}k',
          '-pix_fmt', 'yuv420p', '-g', '120', '-x264-params', 'aq-mode=3']
log = os.path.join(ROOT, 'build', 'x264pass')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', master, '-map', '0:v', *common, '-pass', '1', '-passlogfile', log, '-an', '-f', 'mp4', '/dev/null'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', master, '-i', srt, '-map', '0:v', '-map', '0:a', '-map', '1:s', *common, '-pass', '2', '-passlogfile', log,
                '-c:a', 'aac', '-b:a', f'{audio_k}k', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=jpn',
                '-metadata', 'title=人体は巨大な街だった！ 支持組織の秘密を探れ！', '-movflags', '+faststart', release], check=True)
d2, s2 = probe(release)
print(f'release: {d2 / 60:.2f} min, {s2 / 1e6:.1f} MB')
r = subprocess.run(['ffmpeg', '-i', release, '-i', master, '-lavfi', '[0:v]select=not(mod(n\\,300))[a];[1:v]select=not(mod(n\\,300))[b];[a][b]ssim', '-f', 'null', '-'],
                   capture_output=True, text=True)
print([l for l in r.stderr.splitlines() if 'SSIM' in l][-1:])
