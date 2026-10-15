"""
Timeline of the 30-second intro (single source of truth for mix.py and cues.json).
Times in seconds. Voice `start` = time the voice file is placed (speech begins ~0.02 s later).
"""
DURATION = 30.0
FPS = 30

# id, start (snapped to the 30 fps frame grid by mix.py; order = playback order; no overlaps allowed)
LINES = [
    ("N1", 16 / 30),   # 0.533 - contract 0.9: started earlier so the full sentence ends before A1 (5.73 s of speech)
    ("A1", 193 / 30),  # 6.433
    ("A2", 13.20),
    ("A3", 21.00),
    ("S1", 22.60),
    ("S2", 24.00),   # contract 24.7: moved earlier (allowed down to 24.0) to make room for N2
    ("N2", 27.00),   # short closing narration, ends ~29.67 (< 29.8)
]

# stereo placement of the speakers (-1 L .. +1 R); dialogue stays near the centre
VOICE_PAN = {"N": 0.0, "アカネ": -0.08, "シロウ": 0.10}
VOICE_GAIN_DB = {"N": 0.0, "アカネ": 0.0, "シロウ": 0.5}


def _steps(t0, t1, dt):
    out, k = [], 0
    while t0 + k * dt <= t1 + 1e-9:
        out.append(round(t0 + k * dt, 3)); k += 1
    return out


STEPS = {
    "akane": _steps(8.6, 12.0, 0.2),     # run cycle 0.4 s: runPhase = ((t-8.6)/0.4) % 1, contact at 0 and 0.5
    "shirou": _steps(25.6, 29.6, 0.18),  # run cycle 0.36 s: runPhase = ((t-25.6)/0.36) % 1
}

# (name, start, file under audio/se, gain dB, pan)
SFX = [
    *[("heartbeat", t, "heartbeat.wav", -8.0 + g, 0.0) for t, g in
      [(0.05, -4), (0.92, -3), (1.74, -2), (2.52, -1.5), (3.24, -1), (3.90, 0), (4.50, 0)]],
    ("flow_bed", 1.0, "flow_bed.wav", -8.0, 0.0),          # 1.0 - 12.5 (fades in/out inside the file)
    ("whoosh", 1.5, "whoosh_1.wav", -7.0, -0.2),
    ("whoosh", 3.3, "whoosh_2.wav", -8.5, 0.2),
    ("o2_pickup", 6.0, "o2_pickup.wav", -10.0, 0.1),
    ("dash", 8.5, "dash.wav", -6.0, 0.0),
    *[("step_akane", t, f"step_akane_{i % 4}.wav", -8.0, (-0.15 if i % 2 == 0 else 0.15))
      for i, t in enumerate(STEPS["akane"])],
    ("squeeze", 13.0, "squeeze.wav", -10.0, 0.0),            # 13.0 - 16.2
    ("o2_deliver", 17.6, "o2_deliver.wav", -12.5, 0.15),
    ("relief", 20.0, "relief.wav", -12.0, 0.0),
    ("siren", 20.3, "siren.wav", -10.5, 0.0),                # 20.3 - 24.3
    ("turn", 20.6, "turn.wav", -4.5, -0.25),
    ("turn", 22.3, "turn.wav", -4.5, 0.25),
    *[("step_shirou", t, f"step_shirou_{i % 4}.wav", -13.0, (-0.12 if i % 2 == 0 else 0.12))
      for i, t in enumerate(STEPS["shirou"])],
    ("impact", 29.5, "impact.wav", -4.0, 0.0),
]

# BGM sections (also written to cues.json)
BGM_SECTIONS = [
    dict(name="expectant", start=0.0, end=5.0, desc="low strings pad + timpani roll + rising, crash on 5.0"),
    dict(name="bright_drive", start=5.0, end=20.0, desc="D major, 144 BPM, staccato strings, brass, percussion "
                                                       "(light 5.0-8.3, full 8.3-15.0, lighter 15.0-18.3, warm hold 18.3-20.3)"),
    dict(name="tense", start=20.3, end=24.5, desc="D minor ostinato 16ths, low hits 20.3/22.3/22.6, riser into 24.5"),
    dict(name="heroic_drive", start=24.5, end=29.5, desc="Bb-C-Dm-F-Gm-A, brass melody, toms/snare, roll into the hit"),
    dict(name="hit_ringout", start=29.5, end=30.0, desc="tutti hit on 29.5, D chord rings on with a soft low pulse "
                                                      "(continues into the next scene; only the last 0.3 s fades)"),
]
BPM = 144
