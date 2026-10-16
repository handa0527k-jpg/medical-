"""
Episode 1 timeline (single source of truth for bgm.py --cue episode01, mix_episode.py and cues_episode01.json).

Times in seconds, every event snapped to the 30 fps frame grid.
Line placement is computed from the measured speech bounds of the selected voice engine
(audio_lib.voice_meta(): audio/voice_sbv2/voices.json = Style-Bert-VITS2 by default, BS_VOICE_ENGINE=edge -> edge-tts):
    next voice file start = previous speech end + gap - speech_on(next)
Beats inside a line are anchored on spoken keywords: K(line, "けっしょう", lead) = the time the keyword starts in the
take (whisper word timestamps, tools/word_times.py -> <voice dir>/words_episode01.json, aligned character by
character on the kana reading of `speech`), plus `lead` seconds (negative = just before the word).
So a new recording (other engine / speed) moves every label with the word it belongs to.

0-27 s is the intro mix unchanged (intro_timeline.py); N2 is replaced by the full sentence (N2_full).
The avant keeps its picture timing: the title starts at AVANT_END (35.7 s) as long as N2_full ends >= 0.6 s before it.
"""
from __future__ import annotations

import difflib, json, os, sys

import intro_timeline as INTRO
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import voice_meta, voice_dir  # noqa: E402

FPS = 30
_HERE = os.path.dirname(os.path.abspath(__file__))
_META = voice_meta()
_WORDS_PATH = os.path.join(voice_dir(), "words_episode01.json")
_WORDS = json.load(open(_WORDS_PATH, encoding="utf-8")) if os.path.exists(_WORDS_PATH) else {}

GAP_LINE = 0.35        # narration -> narration inside a chapter
GAP_REACT = 0.45       # before a character reacts / answers
GAP_CHAPTER = 1.25     # chapter change inside the same scene (same music)
TRANS = 0.6            # previous speech end -> scene boundary (music crossfade centre)


def snap(t: float) -> float:
    return round(round(t * FPS) / FPS, 4)


def snap_up(t: float) -> float:
    import math
    return round(math.ceil(t * FPS - 1e-6) / FPS, 4)


# ----------------------------------------------------------------------------- layout
LINES: list[tuple[str, float]] = []        # (id, file start)
_end: dict[str, float] = {}                # speech end
_start: dict[str, float] = {}


def _place(lid: str, speech_at: float) -> float:
    m = _META[lid]
    t = snap_up(speech_at - m["speech_on"])
    LINES.append((lid, t))
    _start[lid] = t
    _end[lid] = round(t + m["speech_off"], 4)
    return t


def after(lid: str, gap: float, new: str) -> float:
    return _place(new, _end[lid] + gap)


def L(lid: str, off: float = 0.0) -> float:
    """time of an offset inside line lid (offset from the voice file start)"""
    return snap(_start[lid] + off)


def E(lid: str) -> float:
    return _end[lid]


_CHAR_T: dict[str, tuple[str, list[float]]] = {}


def _kana(s: str) -> str:
    from verify_voices import to_kana
    return to_kana(s)


def _char_times(lid: str) -> tuple[str, list[float]]:
    """kana reading of the line + the time (s from the file start) each kana starts, from whisper word stamps"""
    if lid in _CHAR_T:
        return _CHAR_T[lid]
    ref = _kana(_META[lid]["speech"])
    words = _WORDS.get(lid)
    if not words:
        raise RuntimeError(f"no word timestamps for {lid}: run tools/word_times.py --ids {lid}")
    hyp, ht = "", []
    for w in words:                      # spread each word's span evenly over its kana
        k = w["kana"]
        for i in range(len(k)):
            ht.append(w["start"] + (w["end"] - w["start"]) * i / max(1, len(k)))
        hyp += k
    t = [None] * len(ref)
    for a, b, n in difflib.SequenceMatcher(None, ref, hyp, autojunk=False).get_matching_blocks():
        for i in range(n):
            t[a + i] = ht[b + i]
    known = [i for i, v in enumerate(t) if v is not None]
    for i in range(len(ref)):            # unmatched kana (homophones, digits): interpolate between neighbours
        if t[i] is None:
            lo = max([j for j in known if j < i], default=None)
            hi = min([j for j in known if j > i], default=None)
            if lo is None:
                t[i] = t[hi]
            elif hi is None:
                t[i] = t[lo] + 0.08 * (i - lo)
            else:
                t[i] = t[lo] + (t[hi] - t[lo]) * (i - lo) / (hi - lo)
    _CHAR_T[lid] = (ref, t)
    return ref, t


def K(lid: str, word: str, lead: float = 0.0, n: int = 0) -> float:
    """time the keyword `word` (kana, n-th occurrence) is spoken in line lid, + lead seconds (absolute, snapped)"""
    ref, t = _char_times(lid)
    key = _kana(word)
    i = -1
    for _ in range(n + 1):
        i = ref.find(key, i + 1)
        if i < 0:
            raise KeyError(f"{word!r} not in {lid}: {ref}")
    return snap(_start[lid] + t[i] + lead)


SCENES: list[dict] = []


def scene(sid: str, start: float, desc: str, **beats) -> dict:
    s = dict(id=sid, start=snap(start), end=None, desc=desc, beats={k: snap(v) for k, v in beats.items()})
    if SCENES:
        SCENES[-1]["end"] = s["start"]
    SCENES.append(s)
    return s


def beat(sid: str, **beats):
    for s in SCENES:
        if s["id"] == sid:
            s["beats"].update({k: snap(v) for k, v in beats.items()})


# --- avant (intro 0-27 unchanged, N2 full sentence at 27.0)
for lid, t in INTRO.LINES:
    if lid == "N2":
        continue
    t = snap(t)
    LINES.append((lid, t)); _start[lid] = t; _end[lid] = round(t + _META[lid]["speech_off"], 4)
LINES.append(("N2_full", 27.0)); _start["N2_full"] = 27.0; _end["N2_full"] = round(27.0 + _META["N2_full"]["speech_off"], 4)

scene("avant", 0.0, "intro S1-S5 (as mix_intro.wav); 29.5 hit is a transition, music rings on under N2",
      vessel_dive=0.0, akane_o2=6.0, akane_run=8.5, capillary=13.0, alarm=20.3, shirou_run=24.5,
      hit=29.5, n2_end=E("N2_full"))

# --- #1 title (5.5 s). The avant picture is cut to 35.7 s: keep that as long as N2 ends >= 0.6 s before it
AVANT_END = 35.7
T0 = max(AVANT_END, snap_up(E("N2_full") + 0.6))
if T0 > AVANT_END:
    print(f"WARNING: N2_full ends {E('N2_full'):.2f} -> title pushed to {T0:.2f} (avant timing changes)", file=sys.stderr)
TITLE_LEN = 5.5
scene("title", T0, "#1 title: light from the vessel depth, heartbeat, ECG blip, orchestral swell, logo",
      light_from_depth=T0, heartbeat_1=T0 + 0.30, heartbeat_2=T0 + 1.15, ecg_blip=T0 + 1.25,
      logo_reveal=T0 + 2.0, logo_full=T0 + 2.6, subtitle_ep=T0 + 3.0, fade_out=T0 + 4.8)

# --- comp: 血液の成分 #2-6
C0 = T0 + TITLE_LEN
_place("E01-02", C0 + 1.1)
after("E01-02", GAP_REACT, "E01-03")      # a little extra: layers settle
after("E01-03", GAP_LINE, "E01-04")
after("E01-04", GAP_LINE, "E01-05")
after("E01-05", GAP_REACT, "E01-06")
SPIN = K("E01-02", "えんしんぶんり", -0.05)   # 「遠心分離」
scene("comp", C0, "#2-6 test-tube hologram, centrifuge, 3 layers with labels, Akane points at herself",
      holo_on=C0 + 0.25, tube_appears=C0 + 0.5,
      centrifuge_spin_start=SPIN, centrifuge_full_speed=SPIN + 0.5, centrifuge_spin_down=SPIN + 1.5,
      centrifuge_stop=SPIN + 2.5, layers_visible=SPIN + 2.5,
      label_plasma=K("E01-03", "けっしょう", -0.03), pct_55=K("E01-03", "ごじゅうご", -0.05),
      label_buffy=K("E01-04", "はっけっきゅう", -0.05), pct_1=K("E01-04", "いちぱーせんと", -0.03),
      label_rbc=K("E01-05", "せっけっきゅう", -0.04), pct_45=K("E01-05", "よんじゅうご", -0.05),
      akane_points_self=K("E01-05", "しめて", -0.1), akane_line=L("E01-06"))

# --- plasma: 血清と血餅 #7-8, 血漿タンパク #9
P0 = E("E01-06") + TRANS
_place("E01-07", P0 + 0.95)
after("E01-07", GAP_LINE, "E01-08")
after("E01-08", GAP_CHAPTER, "E01-09")
scene("plasma", P0, "#7-8 second tube clots (fibrin net -> 血餅 / 血清), formula; #9 plasma proteins + electrophoresis peaks",
      holo_swap=P0 + 0.2, clot_start=K("E01-07", "かたまる", -0.02), fibrin_net=K("E01-07", "ふぃぶりん", -0.01),
      clot_formed=K("E01-07", "けっぺい", -0.04),
      label_serum=K("E01-07", "けっせいだ", -0.01), formula=K("E01-08", "けっせい"),
      formula_minus_fibrinogen=K("E01-08", "ふぃぶりのげん", -0.03),
      proteins_float=E("E01-08") + 0.5,
      peak_albumin=K("E01-09", "あるぶみん", -0.01), peak_globulin=K("E01-09", "ぐろぶりん", -0.02),
      peak_fibrinogen=K("E01-09", "ふぃぶりのげん"),
      peak_gamma_antibody=K("E01-09", "がんま", -0.01), holo_off=E("E01-09") + 0.25)

# --- shape: 赤血球の形 #10-12, 膜骨格 #13-14
S0 = E("E01-09") + TRANS
_place("E01-10", S0 + 1.05)
after("E01-10", GAP_LINE, "E01-11")
after("E01-11", GAP_REACT, "E01-12")
after("E01-12", GAP_CHAPTER, "E01-13")
after("E01-13", GAP_REACT, "E01-14")
beat("plasma")
scene("shape", S0, "#10-12 Akane spins the RBC model, cross-section + 7.5 um, no nucleus, Hb fills; #13 membrane skeleton stretches; #14 capillary squeeze (intro reuse)",
      model_appears=S0 + 0.3, model_rotate=K("E01-10", "がほんとう", -0.1), cross_section=K("E01-10", "まんなか", -0.03),
      dim_7_5um=K("E01-11", "ななてんご", -0.02), no_nucleus=K("E01-11", "かくがない", -0.05),
      hb_fill_start=K("E01-12", "へもぐろびん", -0.05), hb_fill_full=K("E01-12", "るんだ"),
      mesh_appears=E("E01-12") + 0.5, membrane_stretch=K("E01-13", "しなやか", -0.05), membrane_spring_back=K("E01-13", "しなやか", -0.05) + 0.9,
      capillary_cut=L("E01-14") - 0.3)

# --- hb: ヘモグロビン #15-16
H0 = E("E01-14") + TRANS
_place("E01-15", H0 + 1.0)
after("E01-15", GAP_LINE, "E01-16")
O2 = K("E01-16", "さんそがけつごう", 0.0)
scene("hb", H0, "#15-16 α2β2 tetramer, 4 hemes, O2 binds to each heme iron (4 clicks)",
      tetramer_appears=H0 + 0.3, alpha_chains=K("E01-15", "あるふぁ", -0.04), beta_chains=K("E01-15", "べーた", -0.03),
      hemes_glow=K("E01-16", "へむが", -0.03), heme_iron=K("E01-16", "てつに", -0.02),
      o2_bind_1=O2, o2_bind_2=O2 + 0.35, o2_bind_3=O2 + 0.7, o2_bind_4=O2 + 1.05,
      max_four=K("E01-16", "よっつ", -0.07))

# --- co2: 肺と組織 #17, 二酸化炭素 #18-20
K0 = E("E01-16") + TRANS
_place("E01-17", K0 + 1.0)
after("E01-17", GAP_CHAPTER, "E01-18")
after("E01-18", GAP_LINE, "E01-19")
after("E01-19", GAP_REACT, "E01-20")
scene("co2", K0, "#17 lungs <-> tissue loop; #18 CO2 + H2O -> H+ + HCO3- (carbonic anhydrase); #19 HCO3- out through band 3; #20 Akane",
      lung_breath=K0 + 0.1, o2_pickup_lung=K("E01-17", "さんそを"), o2_release_tissue=K("E01-17", "そしき"),
      co2_enters=K("E01-18", "にさんか"), enzyme=K("E01-18", "たんさんだっすい", -0.03),
      reaction=K("E01-18", "にさんかたんそと", -0.04), hco3_formed=K("E01-18", "たんさんすいそ", -0.02),
      band3_open=K("E01-19", "ばんど", -0.03), hco3_out=K("E01-19", "とおって", -0.14),
      hco3_in_plasma=K("E01-19", "けっしょうへ", -0.03))

# --- life: 赤血球の一生 #21-24
F0 = E("E01-20") + TRANS
_place("E01-21", F0 + 1.1)
after("E01-21", GAP_LINE, "E01-22")
after("E01-22", GAP_LINE, "E01-23")
after("E01-23", GAP_REACT + 0.1, "E01-24")
scene("life", F0, "#21 bone marrow -> EPO -> erythroblasts -> enucleation -> reticulocyte; #22 120-day calendar, spleen macrophage; #23 iron recycled, heme -> bilirubin -> bile; #24 Akane looks forward",
      marrow=F0 + 0.2, epo_signal=K("E01-21", "えりすろ", -0.02), erythroblasts_multiply=K("E01-21", "せきがきゅう"),
      enucleation_pop=K("E01-21", "そとへ", -0.15), reticulocyte_exit=K("E01-21", "もうじょう", -0.02),
      into_blood=K("E01-21", "けつえきちゅう", -0.03),
      calendar_start=K("E01-22", "およそ", -0.36), calendar_120=K("E01-22", "ひゃくにじゅう", -0.01),
      macrophage=K("E01-22", "ひぞう", -0.04), macrophage_eats=K("E01-22", "たべ"),
      iron_recycle=K("E01-23", "かいしゅう", -0.03), bilirubin=K("E01-23", "びりるびん", -0.01),
      bile=K("E01-23", "たんじゅう", -0.03),
      akane_faces_forward=K("E01-24", "だったら", -0.04))

# --- battle: 防御戦線 #25, 白血球の種類 #26-27, 貪食 #28-30, 仲間たち #31
B0 = E("E01-24") + TRANS
ALARM_LEN = 1.5
_place("E01-25", B0 + ALARM_LEN)
after("E01-25", GAP_CHAPTER, "E01-26")
after("E01-26", GAP_LINE, "E01-27")
GRAB0 = E("E01-27") + 0.6                     # transition, then ~1.2 s grab action
_place("E01-28", GRAB0 + 1.2)
ENGULF = E("E01-28") + 0.15
after("E01-28", 1.0, "E01-29")                # ~1.0 s engulf
after("E01-29", GAP_REACT, "E01-30")
after("E01-30", GAP_CHAPTER, "E01-31")
scene("battle", B0, "#25 alarm again, Shirou's squad charges the bacteria; #26-27 five WBC types + ratio bar, neutrophil detail; #28 grab, engulf; #29 phagosome -> phagolysosome; #30; #31 allies pose one by one",
      alarm=B0, squad_run=B0 + 0.4, bacteria_reveal=B0 + 0.9, shirou_shout=L("E01-25"),
      wbc_types=E("E01-25") + 0.6,
      type_neutrophil=K("E01-26", "こうちゅうきゅう"), type_eosinophil=K("E01-26", "こうさんきゅう", -0.04),
      type_basophil=K("E01-26", "こうえんき", -0.01),
      type_lymphocyte=K("E01-26", "りんぱ", -0.04), type_monocyte=K("E01-26", "たんきゅう", -0.02),
      ratio_bar=K("E01-26", "ごしゅるい"),
      neutrophil_focus=K("E01-27", "こうちゅうきゅう", -0.03), pct_60_70=K("E01-27", "ろくわり", -0.03),
      lobed_nucleus=K("E01-27", "かくは", -0.02), granules=K("E01-27", "こまか", -0.01),
      bacteria_growl=E("E01-27") + 0.2, grab_start=GRAB0, grab_lunge=GRAB0 + 0.7, grab_catch=GRAB0 + 1.1,
      engulf=ENGULF, engulf_closed=ENGULF + 0.8,
      phagosome=K("E01-29", "ふぁごそーむ", -0.02), lysosome_fusion=K("E01-29", "りそそーむ", -0.02),
      phagolysosome=K("E01-29", "ごうさせ", -0.03), digest=K("E01-29", "かっせい", -0.02),
      allies_enter=E("E01-30") + 0.5,
      # pose hits land in the pause just BEFORE each name is spoken (stinger must not mask the word)
      pose_eosinophil=L("E01-31", -0.4), pose_basophil=K("E01-31", "こうえんき", -0.36),
      pose_monocyte=K("E01-31", "たんきゅうは", -0.4),
      pose_b_cell=K("E01-31", "びーさいぼう", -0.38), plasma_cell=K("E01-31", "けいしつ", -0.04))

# --- platelet: 血小板と凝固 #32-33
W0 = E("E01-31") + TRANS
WOUND = W0 + 0.35
_place("E01-32", WOUND + 1.25)                 # wound / bleeding beat before the narration
after("E01-32", GAP_LINE, "E01-33")
scene("platelet", W0, "#32 vessel wall tears, bleeding, platelets adhere + aggregate (plug), megakaryocyte fragments; #33 fibrinogen -> fibrin mesh traps cells",
      wound=WOUND, bleeding=WOUND + 0.25, platelets_arrive=K("E01-32", "けっしょうばんが", -0.05), plug=K("E01-32", "あなを", -0.01),
      plug_sealed=K("E01-32", "ぐけっしょう"),
      megakaryocyte=K("E01-32", "きょかくきゅう", -0.04), fragments=K("E01-32", "ちぎれ", -0.02),
      fibrinogen_to_fibrin=K("E01-33", "ふぃぶりのげん", -0.04), mesh_weave=K("E01-33", "ふぃぶりんに", -0.02),
      mesh_traps_cells=K("E01-33", "あみと", -0.01), mesh_tight=K("E01-33", "ってけっきゅう", 0.04))

# --- epilogue #34-36
EP0 = E("E01-33") + TRANS
_place("E01-34", EP0 + 1.3)
after("E01-34", GAP_REACT + 0.1, "E01-35")
after("E01-35", 0.7, "E01-36")
scene("epilogue", EP0, "#34-35 battle over, Akane and Shirou pass each other; #36 they part into the flow, camera pulls back to the whole body",
      calm_after_battle=EP0, pass_each_other=L("E01-34") - 0.6, shirou_reply=L("E01-35"),
      part_ways=L("E01-36") - 0.3, carry=L("E01-36", 0.0), protect=K("E01-36", "まもる", -0.04),
      plug_word=K("E01-36", "ふさぐ", -0.01),
      camera_pull_back=K("E01-36", "ものけつえき", 0.08), whole_body=K("E01-36", "さいぼう", -0.01))

# --- next: 次回予告 telop + final impact (4.5 s) + 1.5 s music tail
N0 = snap(E("E01-36") + 0.2)
NEXT_LEN = 4.5
TAIL = 1.5
DURATION = snap(N0 + NEXT_LEN + TAIL)
scene("next", N0, "#37 「次回：白血球、防御戦線！」 telop + final impact, then the music tail (fade only in the last 1.0 s)",
      riser=N0 + 0.2, telop_in=N0 + 1.6, impact=N0 + 2.0, telop_hold=N0 + 2.0, end_card_out=N0 + NEXT_LEN,
      tail_start=N0 + NEXT_LEN, fade_start=DURATION - 1.0, end=DURATION)
SCENES[-1]["end"] = DURATION
SCENES[0]["end"] = SCENES[1]["start"]

LINE_ID = {"N2_full": "N2"}                    # cue id for the full closing narration
VOICE_PAN = INTRO.VOICE_PAN
VOICE_GAIN_DB = INTRO.VOICE_GAIN_DB


def sb(sid):
    return next(s for s in SCENES if s["id"] == sid)["beats"]


# ----------------------------------------------------------------------------- footsteps
def _steps(t0, t1, dt):
    out, k = [], 0
    while t0 + k * dt <= t1 + 1e-9:
        out.append(snap(t0 + k * dt) if False else round(t0 + k * dt, 3)); k += 1
    return out


_b = sb("battle")
_e = sb("epilogue")
STEPS = {
    **INTRO.STEPS,
    "squad": _steps(_b["squad_run"], E("E01-25") + 0.9, 0.18),     # Shirou + allies charging (runPhase period 0.36)
    "epilogue_walk": _steps(EP0 + 0.25, L("E01-34") + 2.0, 0.5),   # walking (period 1.0, contact at 0 and 0.5)
}

# ----------------------------------------------------------------------------- SFX
# (name, start, file under audio/se, gain dB, pan)
SFX: list[tuple] = [s for s in INTRO.SFX]       # 0-30 identical to the intro (impact 29.5 included)
_t, _c, _p, _s, _h, _k, _f, _w = (sb(x) for x in ("title", "comp", "plasma", "shape", "hb", "co2", "life", "platelet"))
_x = sb("next")
SFX += [
    # title
    ("whoosh", T0 - 0.6, "whoosh_1.wav", -12.0, 0.0),
    ("heartbeat", _t["heartbeat_1"], "heartbeat.wav", -6.0, 0.0),
    ("heartbeat", _t["heartbeat_2"] - 0.27 + 0.0, "heartbeat.wav", -5.0, 0.0),
    ("ecg_blip", _t["ecg_blip"], "ep_ecg_blip.wav", -16.0, 0.0),
    ("ecg_blip", _t["ecg_blip"] + 0.85, "ep_ecg_blip.wav", -18.0, 0.0),
    ("logo_shimmer", _t["logo_reveal"] - 0.05, "o2_pickup.wav", -14.0, 0.0),
    # comp
    ("holo_on", _c["holo_on"], "ep_holo_on.wav", -12.0, 0.0),
    ("centrifuge", _c["centrifuge_spin_start"], "ep_centrifuge.wav", -9.0, 0.0),
    ("ding_plasma", _c["label_plasma"], "ep_ding_3.wav", -14.0, 0.25),
    ("ding_buffy", _c["label_buffy"], "ep_ding_2.wav", -14.0, 0.0),
    ("ding_rbc", _c["label_rbc"], "ep_ding_1.wav", -14.0, -0.25),
    # plasma
    ("holo_on", _p["holo_swap"], "ep_holo_on.wav", -15.0, 0.2),
    ("squelch", _p["clot_start"], "ep_squelch_long.wav", -13.0, 0.1),
    ("squelch", _p["clot_formed"] - 0.1, "ep_squelch.wav", -12.0, 0.1),
    ("ding_serum", _p["label_serum"], "ep_ding_2.wav", -16.0, 0.2),
    ("formula_minus", _p["formula_minus_fibrinogen"], "ep_plink_0.wav", -16.0, 0.0),
    ("pop_albumin", _p["peak_albumin"], "ep_pop_0.wav", -12.0, -0.3),
    ("pop_globulin", _p["peak_globulin"], "ep_pop_1.wav", -12.0, -0.1),
    ("pop_fibrinogen", _p["peak_fibrinogen"], "ep_pop_2.wav", -12.0, 0.1),
    ("pop_gamma", _p["peak_gamma_antibody"], "ep_pop_3.wav", -11.0, 0.3),
    ("holo_off", _p["holo_off"], "ep_holo_off.wav", -14.0, 0.0),
    # shape
    ("holo_on", _s["model_appears"], "ep_holo_on.wav", -14.0, -0.1),
    ("rotate", _s["model_rotate"], "ep_rotate.wav", -10.0, 0.0),
    ("ding_cross_section", _s["cross_section"], "ep_ding_1.wav", -17.0, 0.0),
    ("ding_dimension", _s["dim_7_5um"], "ep_plink_1.wav", -15.0, 0.2),
    ("hb_fill", _s["hb_fill_start"], "o2_pickup.wav", -16.0, 0.0),
    ("stretch", _s["membrane_stretch"], "ep_stretch.wav", -10.0, 0.0),
    ("squeeze", _s["capillary_cut"], "squeeze.wav", -12.0, 0.0),
    # hb
    ("holo_on", _h["tetramer_appears"], "ep_holo_on.wav", -14.0, 0.0),
    ("ding_alpha", _h["alpha_chains"], "ep_ding_1.wav", -18.0, -0.2),
    ("ding_beta", _h["beta_chains"], "ep_ding_2.wav", -18.0, 0.2),
    *[(f"o2_bind_{k + 1}", _h[f"o2_bind_{k + 1}"], f"ep_o2_click_{k}.wav", -11.0, [-0.4, 0.4, -0.2, 0.2][k]) for k in range(4)],
    # co2
    ("breath", _k["lung_breath"], "ep_breath.wav", -10.0, 0.0),
    ("o2_pickup", _k["o2_pickup_lung"], "o2_pickup.wav", -15.0, -0.2),
    ("o2_deliver", _k["o2_release_tissue"], "o2_deliver.wav", -17.0, 0.2),
    ("bubbles", _k["co2_enters"], "ep_bubbles.wav", -13.0, 0.0),
    ("bubbles", _k["reaction"], "ep_bubbles.wav", -15.0, 0.0),
    *[(f"plink_hco3_{k}", _k["hco3_formed"] + 0.18 * k, f"ep_plink_{k}.wav", -14.0, [-0.3, 0.3, -0.1, 0.1][k]) for k in range(4)],
    *[(f"plink_band3_{k}", _k["hco3_out"] + 0.22 * k, f"ep_plink_{3 - k}.wav", -15.0, 0.2 + 0.15 * k) for k in range(3)],
    # life
    ("marrow_pulse", _f["marrow"], "ep_marrow_pulse.wav", -10.0, 0.0),
    ("epo_signal", _f["epo_signal"], "ep_plink_2.wav", -16.0, -0.3),
    ("marrow_pulse", _f["erythroblasts_multiply"] - 0.3, "ep_marrow_pulse.wav", -14.0, 0.0),
    ("enucleation_pop", _f["enucleation_pop"] - 0.4, "ep_enucleate.wav", -9.0, 0.1),
    *[(f"clock_tick", _f["calendar_start"] + 0.25 * k, "ep_tick_hi.wav" if k % 2 == 0 else "ep_tick_lo.wav", -18.0, 0.15)
      for k in range(9)],
    *[(f"page_flip", _f["calendar_start"] + 0.12 + 0.25 * k, f"ep_page_{k % 3}.wav", -17.0, 0.0) for k in range(4)],
    ("calendar_120", _f["calendar_120"], "ep_ding_1.wav", -15.0, 0.0),
    ("macrophage_eats", _f["macrophage_eats"], "ep_engulf.wav", -16.0, 0.2),
    ("iron_recycle", _f["iron_recycle"], "ep_plink_3.wav", -15.0, -0.2),
    ("bilirubin", _f["bilirubin"], "ep_pop_1.wav", -16.0, 0.2),
    # battle
    ("siren", _b["alarm"], "siren.wav", -12.0, 0.0),
    ("turn", _b["squad_run"] - 0.1, "dash.wav", -9.0, 0.0),
    ("bacteria_growl", _b["bacteria_reveal"], "ep_growl_long.wav", -11.0, 0.3),
    ("squish", _b["bacteria_reveal"] + 0.9, "ep_squish.wav", -14.0, 0.35),
    ("bacteria_growl", _b["bacteria_growl"], "ep_growl.wav", -10.0, 0.25),
    ("grab_whoosh", _b["grab_lunge"] - 0.15, "dash.wav", -7.0, -0.1),
    ("turn", _b["grab_catch"] - 0.1, "turn.wav", -9.0, 0.1),
    ("squish", _b["grab_catch"], "ep_squish.wav", -11.0, 0.1),
    ("engulf", _b["engulf"], "ep_engulf.wav", -6.0, 0.0),
    ("phagosome", _b["phagosome"], "ep_squelch.wav", -16.0, 0.0),
    ("lysosome_fusion", _b["lysosome_fusion"], "ep_pop_2.wav", -14.0, 0.0),
    ("digest_fizz", _b["digest"], "ep_fizz.wav", -12.0, 0.0),
    ("pose_eosinophil", _b["pose_eosinophil"] - 0.16, "ep_stinger_0.wav", -12.0, -0.35),
    ("pose_basophil", _b["pose_basophil"] - 0.16, "ep_stinger_1.wav", -12.0, -0.1),
    ("pose_monocyte", _b["pose_monocyte"] - 0.16, "ep_stinger_2.wav", -12.0, 0.15),
    ("pose_b_cell", _b["pose_b_cell"] - 0.16, "ep_stinger_3.wav", -12.0, 0.35),
    # platelet
    ("wound_rip", _w["wound"], "ep_wound_rip.wav", -6.0, 0.0),
    ("bleeding", _w["bleeding"], "ep_squelch_long.wav", -14.0, 0.0),
    ("platelet_clicks", _w["platelets_arrive"], "ep_platelet_clicks.wav", -10.0, 0.0),
    ("platelet_clicks", _w["plug"] - 0.3, "ep_platelet_clicks.wav", -12.0, 0.15),
    ("plug_sealed", _w["plug_sealed"], "ep_ding_2.wav", -17.0, 0.0),
    ("fragments", _w["fragments"], "ep_pop_3.wav", -16.0, 0.0),
    ("mesh_tighten", _w["mesh_weave"], "ep_mesh_tighten.wav", -10.0, 0.0),
    # epilogue
    ("flow_bed", EP0 - 0.4, "flow_bed.wav", -12.0, 0.0),
    *[("step_walk", t, f"ep_step_walk_{i % 4}.wav", -16.0, -0.15 if i % 2 == 0 else 0.15) for i, t in enumerate(STEPS["epilogue_walk"])],
    ("whoosh", _e["camera_pull_back"] - 0.2, "whoosh_2.wav", -15.0, 0.0),
    # next
    ("whoosh", _x["telop_in"] - 0.55, "whoosh_1.wav", -10.0, 0.0),
    ("impact", _x["impact"], "impact.wav", -3.0, 0.0),
]
SFX += [("step_shirou", t, f"step_shirou_{i % 4}.wav", -14.0, (-0.12 if i % 2 == 0 else 0.12)) for i, t in enumerate(STEPS["squad"])]
SFX += [("step_squad", t + 0.07, f"step_shirou_{(i + 2) % 4}.wav", -18.0, (0.3 if i % 2 == 0 else -0.3)) for i, t in enumerate(STEPS["squad"])]
_n_intro = len(INTRO.SFX)
SFX = SFX[:_n_intro] + [(n, snap(t), f, g, p) for n, t, f, g, p in SFX[_n_intro:]]   # intro times kept exactly
SFX.sort(key=lambda s: s[1])
BED_SFX = {"flow_bed", "siren", "squeeze", "centrifuge", "bubbles", "breath", "marrow_pulse", "bacteria_growl", "mesh_tighten"}

# ----------------------------------------------------------------------------- music
# each cue is rendered on its own; consecutive cues crossfade around the boundary (xfade seconds).
# lufs = loudness the cue is normalised to (before ducking) - explanatory beds sit lower.
BGM_SECTIONS = [
    dict(name="avant", cue="avant", start=0.0, end=T0, lufs=-21.0, xfade=0.0,
         desc="intro score unchanged to 29.5; the hit rings into a low pulse under N2, riser into the title"),
    dict(name="title_sting", cue="title", start=T0, end=C0, lufs=-19.0, xfade=0.25,
         desc="heartbeat-timed low pulse, timpani roll + string/brass swell to the logo at +2.0, D major chord, decays"),
    dict(name="lab", cue="lab", start=C0, end=S0, lufs=-25.0, xfade=1.4,
         desc="calm, curious hologram bed: soft pad, ticking pizzicato, bell arpeggios, light synth shimmer (A major / F#m)"),
    dict(name="warm_theme", cue="warm", start=S0, end=K0, lufs=-24.5, xfade=1.4,
         desc="light warm theme, D major 96 BPM: pizz bass, strings, horn melody, light shaker"),
    dict(name="journey", cue="journey", start=K0, end=F0, lufs=-24.5, xfade=1.4,
         desc="flowing journey variant of the warm theme: running 8th arpeggios, G-D-Em-C, gentle pulse"),
    dict(name="bittersweet", cue="life", start=F0, end=B0, lufs=-25.0, xfade=1.6,
         desc="gentle, slightly bittersweet: Bm-G-D-A at 72 BPM, piano-like keys, solo horn; lifts to D at #24"),
    dict(name="tense_battle", cue="battle", start=B0, end=W0, lufs=-22.0, xfade=0.5,
         desc="alarm tension (D minor ostinato) -> battle at #25 (152 BPM, drums, brass), lighter under the explanations, "
              "hit on the engulf, heroic lift for the allies"),
    dict(name="urgent_relief", cue="platelet", start=W0, end=EP0, lufs=-23.5, xfade=0.6,
         desc="urgent tremolo + pulse from the wound, resolves to a relieved major at #33 (mesh tight)"),
    dict(name="warm_heroic_ending", cue="ending", start=EP0, end=DURATION, lufs=-22.5, xfade=1.6,
         desc="warm heroic ending theme D major, swell under #36, riser into the 次回 telop, tutti hit on the impact, "
              "1.5 s ring-out tail (fade only in the last 1.0 s)"),
]
