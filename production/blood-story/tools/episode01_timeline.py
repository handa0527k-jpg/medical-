"""
Episode 1 timeline (single source of truth for bgm.py --cue episode01, mix_episode.py and cues_episode01.json).

Times in seconds, every event snapped to the 30 fps frame grid.
Line placement is computed from the measured speech bounds in audio/voice/voices.json:
    next voice file start = previous speech end + gap - speech_on(next)
Beats inside a line are given as offsets from that line's file start; the offsets come from the
whisper word timestamps (audio/voice/words_episode01.json), so labels land on the spoken keyword.

0-27 s is the intro mix unchanged (intro_timeline.py); N2 is replaced by the full sentence (N2_full).
"""
from __future__ import annotations

import json, os

import intro_timeline as INTRO

FPS = 30
_HERE = os.path.dirname(os.path.abspath(__file__))
_META = json.load(open(os.path.join(os.path.dirname(_HERE), "audio", "voice", "voices.json"), encoding="utf-8"))

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

# --- #1 title (5.5 s, starts 1.0 s after N2 ends)
T0 = snap_up(E("N2_full") + 1.0)
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
SPIN = L("E01-02", 2.10)                   # 「遠心分離」
scene("comp", C0, "#2-6 test-tube hologram, centrifuge, 3 layers with labels, Akane points at herself",
      holo_on=C0 + 0.25, tube_appears=C0 + 0.5,
      centrifuge_spin_start=SPIN, centrifuge_full_speed=SPIN + 0.5, centrifuge_spin_down=SPIN + 1.5,
      centrifuge_stop=SPIN + 2.5, layers_visible=SPIN + 2.5,
      label_plasma=L("E01-03", 1.75), pct_55=L("E01-03", 4.25),
      label_buffy=L("E01-04", 2.15), pct_1=L("E01-04", 4.05),
      label_rbc=L("E01-05", 2.0), pct_45=L("E01-05", 3.95),
      akane_points_self=L("E01-05", 5.3), akane_line=L("E01-06"))

# --- plasma: 血清と血餅 #7-8, 血漿タンパク #9
P0 = E("E01-06") + TRANS
_place("E01-07", P0 + 0.95)
after("E01-07", GAP_LINE, "E01-08")
after("E01-08", GAP_CHAPTER, "E01-09")
scene("plasma", P0, "#7-8 second tube clots (fibrin net -> 血餅 / 血清), formula; #9 plasma proteins + electrophoresis peaks",
      holo_swap=P0 + 0.2, clot_start=L("E01-07", 0.7), fibrin_net=L("E01-07", 1.65), clot_formed=L("E01-07", 3.7),
      label_serum=L("E01-07", 6.45), formula=L("E01-08", 0.7), formula_minus_fibrinogen=L("E01-08", 2.75),
      proteins_float=E("E01-08") + 0.5,
      peak_albumin=L("E01-09", 0.95), peak_globulin=L("E01-09", 2.1), peak_fibrinogen=L("E01-09", 2.9),
      peak_gamma_antibody=L("E01-09", 6.95), holo_off=E("E01-09") + 0.25)

# --- shape: 赤血球の形 #10-12, 膜骨格 #13-14
S0 = E("E01-09") + TRANS
_place("E01-10", S0 + 1.05)
after("E01-10", GAP_LINE, "E01-11")
after("E01-11", GAP_REACT, "E01-12")
after("E01-12", GAP_CHAPTER, "E01-13")
after("E01-13", GAP_REACT, "E01-14")
beat("plasma")
scene("shape", S0, "#10-12 Akane spins the RBC model, cross-section + 7.5 um, no nucleus, Hb fills; #13 membrane skeleton stretches; #14 capillary squeeze (intro reuse)",
      model_appears=S0 + 0.3, model_rotate=L("E01-10", 0.9), cross_section=L("E01-10", 3.45),
      dim_7_5um=L("E01-11", 1.7), no_nucleus=L("E01-11", 5.55), hb_fill_start=L("E01-12", 1.05), hb_fill_full=L("E01-12", 3.0),
      mesh_appears=E("E01-12") + 0.5, membrane_stretch=L("E01-13", 5.75), membrane_spring_back=L("E01-13", 5.75) + 0.9,
      capillary_cut=L("E01-14") - 0.3)

# --- hb: ヘモグロビン #15-16
H0 = E("E01-14") + TRANS
_place("E01-15", H0 + 1.0)
after("E01-15", GAP_LINE, "E01-16")
O2 = L("E01-16", 3.45)
scene("hb", H0, "#15-16 α2β2 tetramer, 4 hemes, O2 binds to each heme iron (4 clicks)",
      tetramer_appears=H0 + 0.3, alpha_chains=L("E01-15", 1.3), beta_chains=L("E01-15", 2.65),
      hemes_glow=L("E01-16", 0.75), heme_iron=L("E01-16", 2.8),
      o2_bind_1=O2, o2_bind_2=O2 + 0.35, o2_bind_3=O2 + 0.7, o2_bind_4=O2 + 1.05,
      max_four=L("E01-16", 6.85))

# --- co2: 肺と組織 #17, 二酸化炭素 #18-20
K0 = E("E01-16") + TRANS
_place("E01-17", K0 + 1.0)
after("E01-17", GAP_CHAPTER, "E01-18")
after("E01-18", GAP_LINE, "E01-19")
after("E01-19", GAP_REACT, "E01-20")
scene("co2", K0, "#17 lungs <-> tissue loop; #18 CO2 + H2O -> H+ + HCO3- (carbonic anhydrase); #19 HCO3- out through band 3; #20 Akane",
      lung_breath=K0 + 0.1, o2_pickup_lung=L("E01-17", 0.45), o2_release_tissue=L("E01-17", 1.7),
      co2_enters=L("E01-18", 1.1), enzyme=L("E01-18", 4.75), reaction=L("E01-18", 6.5), hco3_formed=L("E01-18", 8.3),
      band3_open=L("E01-19", 2.25), hco3_out=L("E01-19", 3.0), hco3_in_plasma=L("E01-19", 3.75))

# --- life: 赤血球の一生 #21-24
F0 = E("E01-20") + TRANS
_place("E01-21", F0 + 1.1)
after("E01-21", GAP_LINE, "E01-22")
after("E01-22", GAP_LINE, "E01-23")
after("E01-23", GAP_REACT + 0.1, "E01-24")
scene("life", F0, "#21 bone marrow -> EPO -> erythroblasts -> enucleation -> reticulocyte; #22 120-day calendar, spleen macrophage; #23 iron recycled, heme -> bilirubin -> bile; #24 Akane looks forward",
      marrow=F0 + 0.2, epo_signal=L("E01-21", 3.8), erythroblasts_multiply=L("E01-21", 5.8),
      enucleation_pop=L("E01-21", 7.55), reticulocyte_exit=L("E01-21", 8.6), into_blood=L("E01-21", 10.65),
      calendar_start=L("E01-22", 0.6), calendar_120=L("E01-22", 1.65), macrophage=L("E01-22", 4.2), macrophage_eats=L("E01-22", 6.3),
      iron_recycle=L("E01-23", 0.45), bilirubin=L("E01-23", 4.95), bile=L("E01-23", 6.45),
      akane_faces_forward=L("E01-24", 1.7))

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
      type_neutrophil=L("E01-26", 1.2), type_eosinophil=L("E01-26", 2.5), type_basophil=L("E01-26", 3.65),
      type_lymphocyte=L("E01-26", 4.8), type_monocyte=L("E01-26", 5.7), ratio_bar=L("E01-26", 6.4),
      neutrophil_focus=L("E01-27", 1.35), pct_60_70=L("E01-27", 3.85), lobed_nucleus=L("E01-27", 6.2), granules=L("E01-27", 7.95),
      bacteria_growl=E("E01-27") + 0.2, grab_start=GRAB0, grab_lunge=GRAB0 + 0.7, grab_catch=GRAB0 + 1.1,
      engulf=ENGULF, engulf_closed=ENGULF + 0.8,
      phagosome=L("E01-29", 2.7), lysosome_fusion=L("E01-29", 4.3), phagolysosome=L("E01-29", 5.15), digest=L("E01-29", 5.9),
      allies_enter=E("E01-30") + 0.5,
      pose_eosinophil=L("E01-31", 0.0), pose_basophil=L("E01-31", 3.0), pose_monocyte=L("E01-31", 6.85),
      pose_b_cell=L("E01-31", 9.95), plasma_cell=L("E01-31", 11.1))

# --- platelet: 血小板と凝固 #32-33
W0 = E("E01-31") + TRANS
WOUND = W0 + 0.35
_place("E01-32", WOUND + 1.25)                 # wound / bleeding beat before the narration
after("E01-32", GAP_LINE, "E01-33")
scene("platelet", W0, "#32 vessel wall tears, bleeding, platelets adhere + aggregate (plug), megakaryocyte fragments; #33 fibrinogen -> fibrin mesh traps cells",
      wound=WOUND, bleeding=WOUND + 0.25, platelets_arrive=L("E01-32", 1.55), plug=L("E01-32", 3.25), plug_sealed=L("E01-32", 3.95),
      megakaryocyte=L("E01-32", 5.7), fragments=L("E01-32", 7.4),
      fibrinogen_to_fibrin=L("E01-33", 0.8), mesh_weave=L("E01-33", 1.7), mesh_traps_cells=L("E01-33", 3.15), mesh_tight=L("E01-33", 3.7))

# --- epilogue #34-36
EP0 = E("E01-33") + TRANS
_place("E01-34", EP0 + 1.3)
after("E01-34", GAP_REACT + 0.1, "E01-35")
after("E01-35", 0.7, "E01-36")
scene("epilogue", EP0, "#34-35 battle over, Akane and Shirou pass each other; #36 they part into the flow, camera pulls back to the whole body",
      calm_after_battle=EP0, pass_each_other=L("E01-34") - 0.6, shirou_reply=L("E01-35"),
      part_ways=L("E01-36") - 0.3, carry=L("E01-36", 0.0), protect=L("E01-36", 1.0), plug_word=L("E01-36", 2.35),
      camera_pull_back=L("E01-36", 3.0), whole_body=L("E01-36", 6.3))

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
    ("pose_eosinophil", _b["pose_eosinophil"] - 0.16, "ep_stinger_0.wav", -10.0, -0.35),
    ("pose_basophil", _b["pose_basophil"] - 0.16, "ep_stinger_1.wav", -10.0, -0.1),
    ("pose_monocyte", _b["pose_monocyte"] - 0.16, "ep_stinger_2.wav", -10.0, 0.15),
    ("pose_b_cell", _b["pose_b_cell"] - 0.16, "ep_stinger_3.wav", -10.0, 0.35),
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
