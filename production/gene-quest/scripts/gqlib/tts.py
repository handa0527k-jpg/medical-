"""音声合成エンジンの共通インターフェース。

- SBV2Engine   : Style-Bert-VITS2（JP-Extra）。ローカルCPU/GPU。感情スタイルを持つ。
- KokoroEngine : Kokoro-82M（ONNX）。ローカルCPU。スタイル指定なし。
- EdgeEngine   : edge-tts（Microsoft Edge の読み上げサービス）。要ネット接続。比較用。

どのエンジンも synth(text, **params) -> (numpy float32 mono, sample_rate) を返す。
"""
from __future__ import annotations

import asyncio
import io
import time
from dataclasses import dataclass

import numpy as np

from .paths import MODELS


@dataclass
class Voice:
    engine: str            # sbv2 | kokoro | edge
    model: str             # sbv2: モデルフォルダ名 / kokoro: voice名 / edge: voice名
    style: str = "Neutral"
    style_weight: float = 1.0
    length: float = 1.0    # 話速（大きいほどゆっくり）
    pitch: float = 1.0     # 声の高さ（sbv2: pitch_scale）
    intonation: float = 1.0
    sdp_ratio: float = 0.2
    noise: float = 0.6
    noise_w: float = 0.8


class SBV2Engine:
    name = "sbv2"

    def __init__(self, device: str = "cpu"):
        from style_bert_vits2.constants import Languages
        from style_bert_vits2.nlp import bert_models

        bert = MODELS / "bert" / "deberta-v2-large-japanese-char-wwm"
        # 新しい transformers は safetensors の型（float16）のまま読み込むので、CPU 推論用に float32 にそろえる
        bert_models.load_model(Languages.JP, str(bert)).float()
        bert_models.load_tokenizer(Languages.JP, str(bert))
        self.device = device
        self._models: dict[str, object] = {}

    def _model(self, name: str):
        if name not in self._models:
            from style_bert_vits2.tts_model import TTSModel

            d = MODELS / "sbv2" / name
            weights = sorted(d.glob("*.safetensors"))[0]
            self._models[name] = TTSModel(
                model_path=weights,
                config_path=d / "config.json",
                style_vec_path=d / "style_vectors.npy",
                device=self.device,
            )
        return self._models[name]

    def styles(self, name: str) -> list[str]:
        import json

        cfg = json.loads((MODELS / "sbv2" / name / "config.json").read_text())
        return list(cfg["data"]["style2id"].keys())

    def synth(self, text: str, v: Voice) -> tuple[np.ndarray, int]:
        m = self._model(v.model)
        style = v.style if v.style in self.styles(v.model) else "Neutral"
        sr, audio = m.infer(
            text=text,
            style=style,
            style_weight=v.style_weight,
            length=v.length,
            pitch_scale=v.pitch,
            intonation_scale=v.intonation,
            sdp_ratio=v.sdp_ratio,
            noise=v.noise,
            noise_w=v.noise_w,
            line_split=False,
        )
        a = audio.astype(np.float32)
        if np.abs(a).max() > 1.5:  # int16 で返る
            a = a / 32768.0
        return a, sr


class KokoroEngine:
    name = "kokoro"

    def __init__(self):
        from kokoro_onnx import Kokoro

        d = MODELS / "kokoro"
        self.k = Kokoro(str(d / "kokoro-v1.0.onnx"), str(d / "voices-v1.0.bin"))
        self._g2p = None

    def _phonemes(self, text: str) -> str:
        if self._g2p is None:
            from misaki import ja

            self._g2p = ja.JAG2P()
        ps, _ = self._g2p(text)
        return ps

    def synth(self, text: str, v: Voice) -> tuple[np.ndarray, int]:
        ps = self._phonemes(text)
        a, sr = self.k.create(ps, voice=v.model, speed=1.0 / v.length, lang="ja", is_phonemes=True)
        return a.astype(np.float32), sr


class EdgeEngine:
    name = "edge"

    def synth(self, text: str, v: Voice) -> tuple[np.ndarray, int]:
        import edge_tts
        import soundfile as sf

        rate = f"{int(round((1.0 / v.length - 1.0) * 100)):+d}%"
        pitch = f"{int(round((v.pitch - 1.0) * 100)):+d}Hz"

        async def run() -> bytes:
            c = edge_tts.Communicate(text, v.model, rate=rate, pitch=pitch)
            buf = b""
            async for chunk in c.stream():
                if chunk["type"] == "audio":
                    buf += chunk["data"]
            return buf

        mp3 = asyncio.run(run())
        # mp3 → wav（ffmpeg）
        import subprocess

        wav = subprocess.run(
            ["ffmpeg", "-v", "error", "-i", "pipe:0", "-f", "wav", "-ac", "1", "pipe:1"],
            input=mp3, capture_output=True, check=True,
        ).stdout
        a, sr = sf.read(io.BytesIO(wav), dtype="float32")
        return a, sr


_ENGINES: dict[str, object] = {}


def engine(name: str):
    if name not in _ENGINES:
        _ENGINES[name] = {"sbv2": SBV2Engine, "kokoro": KokoroEngine, "edge": EdgeEngine}[name]()
    return _ENGINES[name]


def synth(text: str, v: Voice) -> tuple[np.ndarray, int, float]:
    """(音声, サンプルレート, 処理時間秒) を返す。"""
    t0 = time.time()
    a, sr = engine(v.engine).synth(text, v)
    return a, sr, time.time() - t0
