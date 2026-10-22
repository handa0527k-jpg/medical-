"""シーンのタイムライン（timeline.json の1シーン分）を、描画コードから使いやすくする。"""
from __future__ import annotations

from .chars import EMO_TO_EXPR, EXPRESSIONS, Expr, blend_expr

FPS = 30


class Scene:
    def __init__(self, d: dict):
        self.d = d
        self.id = d["scene_id"]
        self.duration = d["duration"]
        self.lines = d["lines"]
        self.cues = d["cues"]
        self.pages = d.get("pages", [])
        self.chapter = d.get("chapter")
        self.chapter_title = d.get("chapter_title", "")

    # ---- 時刻
    def cue(self, name: str, default: float | None = None) -> float:
        if name in self.cues:
            return self.cues[name]
        if default is not None:
            return default
        raise KeyError(f"{self.id}: cue '{name}' がない（{list(self.cues)[:12]}…）")

    def L(self, i: int) -> float:
        """i 行目（1始まり）の開始時刻。"""
        return self.lines[min(len(self.lines), max(1, i)) - 1]["rel_start"]

    def Lend(self, i: int) -> float:
        return self.lines[min(len(self.lines), max(1, i)) - 1]["rel_end"]

    def line_at(self, t: float) -> dict | None:
        for ln in self.lines:
            if ln["rel_start"] - 0.05 <= t <= ln["rel_end"] + 0.1:
                return ln
        return None

    def last_line(self, t: float) -> dict | None:
        cur = None
        for ln in self.lines:
            if ln["rel_start"] <= t:
                cur = ln
        return cur

    # ---- 口パクと表情
    def mouth(self, char: str, t: float) -> float:
        for ln in self.lines:
            if ln["character_id"] == char and ln["rel_start"] <= t < ln["rel_end"]:
                i = int((t - ln["rel_start"]) * FPS)
                env = ln["env"]
                return env[min(i, len(env) - 1)] if env else 0.0
        return 0.0

    def speaking(self, char: str, t: float) -> bool:
        return any(ln["character_id"] == char and ln["rel_start"] <= t < ln["rel_end"] for ln in self.lines)

    def expr(self, char: str, t: float, base: str = "neutral", hold: float = 2.5) -> Expr:
        """直近のその話者のセリフの感情を表情にし、話し終わって hold 秒で base に戻す。"""
        cur = None
        for ln in self.lines:
            if ln["character_id"] == char and ln["rel_start"] - 0.25 <= t:
                cur = ln
        e = EXPRESSIONS[base]
        if cur is not None:
            target = EXPRESSIONS[EMO_TO_EXPR.get(cur["emotion"], "neutral")]
            if cur["emotion"] != "Neutral":
                k = 1.0
                if t > cur["rel_end"] + hold:
                    k = max(0.0, 1 - (t - cur["rel_end"] - hold) / 0.6)
                k *= min(1.0, (t - cur["rel_start"] + 0.25) / 0.25)
                e = blend_expr(e, target, k)
        e = Expr(**{f: getattr(e, f) for f in e.__dataclass_fields__})
        e.mouth_open = self.mouth(char, t)
        return e

    def note_active(self, t: float) -> str:
        ln = self.line_at(t)
        return ln["note"] if ln else ""
