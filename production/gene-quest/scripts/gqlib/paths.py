"""プロジェクト内のパス（どこから実行しても同じ場所を指す）。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "config"
SCRIPT = ROOT / "script"
AUDIO = ROOT / "audio"
VIDEO = ROOT / "video"
SUBS = ROOT / "subtitles"
ASSETS = ROOT / "assets"
MODELS = ROOT / "models"
REPORTS = ROOT / "reports"
LOGS = ROOT / "logs"
FONTS = ASSETS / "fonts"
