#!/usr/bin/env python3
"""build/script.json + build/voice.json → render/data/timeline.json と subtitles/*.srt

    python3 tools/timeline.py

時刻はすべて実際に録音した声の長さから決まる。絵（render/js/scenes/*.js）はセリフの label の時刻で動くので、
声を録り直しても絵と音がずれない。
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

HEAD = {'s01': 9.0}      # シーン冒頭（タイトルカード）の長さ
HEAD_DEFAULT = 3.4
TAIL = 2.2
GAP_SAME = 0.38          # 同じ話者が続くとき
GAP_TURN = 0.5           # 話者が替わるとき
GAP_NAR = 0.65           # ナレーションの後


def ts(x):
    ms = max(0, int(round(x * 1000)))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def main():
    script = json.load(open(os.path.join(ROOT, 'build', 'script.json')))
    voice = json.load(open(os.path.join(ROOT, 'build', 'voice.json')))
    quiz = json.load(open(os.path.join(ROOT, 'script', 'quiz.json')))
    out, g0 = [], 0.0
    srt, k = [], 0
    for sc in script['scenes']:
        t = HEAD.get(sc['id'], HEAD_DEFAULT)
        lines, thinks, sfx, labels = [], [], [{'name': 'whoosh', 't': 0.25}], {}
        bgm = [{'name': sc['bgm'], 't0': 0.0}]
        prev = None
        for it in sc['items']:
            if it['type'] == 'bgm':
                bgm.append({'name': it['bgm'], 't0': None})  # 次のセリフの頭で切り替える
                continue
            if it['type'] == 'think':
                thinks.append({'t0': round(t, 3), 't1': round(t + it['sec'], 3)})
                sfx.append({'name': 'tick', 't': round(t, 3), 'dur': it['sec']})
                t += it['sec'] + 0.3
                continue
            if it['type'] == 'pause':
                t += it['sec']
                continue
            v = voice[it['id']]
            if bgm[-1]['t0'] is None:
                bgm[-1]['t0'] = round(max(0.0, t - 0.4), 3)
            sents = []
            for s, vs in zip(it['sentences'], v['sentences']):
                s0 = t + vs['t0']
                s1 = s0 + vs['dur']
                tot = sum(len(c) for c in s['chunks'])
                c0, chunks = s0, []
                for c in s['chunks']:
                    c1 = c0 + vs['dur'] * len(c) / tot
                    chunks.append({'text': c.strip(), 't0': round(c0, 3), 't1': round(c1, 3)})
                    c0 = c1
                sents.append({'t0': round(s0, 3), 't1': round(s1, 3), 'mouth': vs['mouth'], 'chunks': chunks})
            ln = {'id': it['id'], 'who': it['who'], 'name': it['name'], 'emo': it['emo'], 'text': it['text'],
                  'label': it['label'], 'quiz': it['quiz'], 't0': round(t, 3), 't1': round(t + v['dur'], 3), 'sents': sents}
            lines.append(ln)
            if it['label']:
                labels[it['label']] = ln['t0']
            if it['sfx']:
                sfx.append({'name': it['sfx'], 't': round(max(0, t - 0.08), 3)})
            for s in sents:
                for c in s['chunks']:
                    k += 1
                    who = '' if it['who'] == 'nar' else it['name'] + '：'
                    if it['who'] == 'nar':
                        who = '先生：'
                    srt.append(f'{k}\n{ts(g0 + c["t0"])} --> {ts(g0 + c["t1"] + 0.15)}\n{who}{c["text"]}\n')
            t += v['dur']
            nxt_gap = it['pause'] if it['pause'] is not None else (GAP_NAR if it['who'] == 'nar' else (GAP_SAME if prev == it['who'] else GAP_TURN))
            t += nxt_gap
            prev = it['who']
        dur = round(t + TAIL, 3)
        for i, b in enumerate(bgm):
            b['t1'] = bgm[i + 1]['t0'] if i + 1 < len(bgm) else dur
        out.append({'id': sc['id'], 'title': sc['title'], 'start': round(g0, 3), 'dur': dur, 'lines': lines,
                    'thinks': thinks, 'bgm': bgm, 'sfx': sorted(sfx, key=lambda x: x['t']), 'labels': labels})
        g0 += dur
    tl = {'fps': 30, 'width': 1920, 'height': 1080, 'total': round(g0, 3), 'scenes': out, 'quiz': quiz}
    os.makedirs(os.path.join(ROOT, 'render', 'data'), exist_ok=True)
    json.dump(tl, open(os.path.join(ROOT, 'render', 'data', 'timeline.json'), 'w'), ensure_ascii=False)
    os.makedirs(os.path.join(ROOT, 'subtitles'), exist_ok=True)
    open(os.path.join(ROOT, 'subtitles', 'medical_support_tissue.srt'), 'w', encoding='utf-8').write('\n'.join(srt))
    for s in out:
        print(f"{s['id']} {s['title']:<24} {s['dur'] / 60:5.2f} min  {len(s['lines'])} lines")
    print(f'total {g0 / 60:.2f} min, {k} subtitles')


if __name__ == '__main__':
    main()
