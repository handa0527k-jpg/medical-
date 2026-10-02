#!/usr/bin/env python3
"""Print each story line's start time within its scene (to time the drawings): python3 scripts/story-cues.py <course>"""
import json, sys, os
GAP, LEAD, TAIL = 0.55, 1.2, 1.4
s = json.load(open(os.path.join('src/content/courses', sys.argv[1], 'story/story.json')))
T = 0; start = None; cur = None
for i, l in enumerate(s['lines']):
    if l['scene'] != cur:
        if cur is not None: print(f'  [{cur} ends at {T + TAIL - start:.1f}]'); T += TAIL
        cur = l['scene']; start = T; T += LEAD
    T += l.get('wait', 0)
    print(f"{cur:8} {T - start:6.1f}-{T - start + l['dur']:6.1f}  {l['who']:4} {l['text'][:46]}")
    T += l['dur'] + GAP
print(f'  [{cur} ends at {T + TAIL - start:.1f}]  total {T + TAIL:.0f}s')
