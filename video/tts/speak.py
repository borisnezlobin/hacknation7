"""Render narration lines to WAV with Kokoro-82M.

Usage:
    uv run --project video/tts python video/tts/speak.py LINES.json OUT_DIR [--force]

Each line: {"id": "demo-01", "text": "...", "voice": "am_michael", "speed": 1.0,
            "phonemes": "<optional raw Kokoro phoneme string, bypasses G2P>"}

Inline pronunciation fixes also work inside "text" with Misaki's markdown syntax:
    "The [biweight](/bˈIwˌAt/) filter"
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import re
import sys
import warnings
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile

SAMPLE_RATE = 24_000
KOKORO_REPO = "hexgrad/Kokoro-82M"
DEFAULT_VOICE = "am_michael"
MANIFEST_NAME = "manifest.json"
KEPT_SILENCE_SECONDS = 0.06
SILENCE_THRESHOLD_DB = -45.0
ANALYSIS_FRAME_SECONDS = 0.005

PRONUNCIATION_FIXES: list[tuple[str, str]] = [
    (r"\bTESS\b", "Tess"),
    (r"\b[Bb]iweight\b", "[biweight](/bˈIwˌAt/)"),
]


@dataclass(frozen=True)
class NarrationLine:
    id: str
    text: str
    voice: str
    speed: float
    phonemes: str | None

    @classmethod
    def from_json(cls, raw: dict, default_voice: str) -> NarrationLine:
        if "id" not in raw or not (raw.get("text") or raw.get("phonemes")):
            raise ValueError(f"Each line needs an id and text (or phonemes): {raw}")
        return cls(
            id=str(raw["id"]),
            text=raw.get("text", ""),
            voice=raw.get("voice", default_voice),
            speed=float(raw.get("speed", 1.0)),
            phonemes=raw.get("phonemes"),
        )

    @property
    def prepared_text(self) -> str:
        text = self.text
        for pattern, replacement in PRONUNCIATION_FIXES:
            text = re.sub(pattern, replacement, text)
        return text

    @property
    def fingerprint(self) -> str:
        payload = {
            "text": self.prepared_text,
            "phonemes": self.phonemes,
            "voice": self.voice,
            "speed": self.speed,
            "sample_rate": SAMPLE_RATE,
            "trim": [KEPT_SILENCE_SECONDS, SILENCE_THRESHOLD_DB],
        }
        encoded = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
        return hashlib.sha256(encoded).hexdigest()[:16]


class KokoroSynthesizer:
    def __init__(self) -> None:
        warnings.filterwarnings("ignore")
        logging.getLogger().setLevel(logging.ERROR)
        from kokoro import KModel

        self._model = KModel(repo_id=KOKORO_REPO).to("cpu").eval()
        self._pipelines: dict = {}

    def _pipeline_for(self, voice: str):
        from kokoro import KPipeline

        lang_code = voice[0]
        if lang_code not in self._pipelines:
            self._pipelines[lang_code] = KPipeline(
                lang_code=lang_code, repo_id=KOKORO_REPO, model=self._model
            )
        return self._pipelines[lang_code]

    def synthesize(self, line: NarrationLine) -> tuple[np.ndarray, str]:
        pipeline = self._pipeline_for(line.voice)
        if line.phonemes:
            results = pipeline.generate_from_tokens(line.phonemes, voice=line.voice, speed=line.speed)
        else:
            results = pipeline(line.prepared_text, voice=line.voice, speed=line.speed)
        chunks, phonemes = [], []
        for result in results:
            if result.audio is not None:
                chunks.append(result.audio.detach().cpu().numpy())
                phonemes.append(result.phonemes)
        if not chunks:
            raise RuntimeError(f"Kokoro produced no audio for line {line.id!r}")
        return np.concatenate(chunks).astype(np.float32), " ".join(phonemes)


def trim_silence(audio: np.ndarray) -> np.ndarray:
    frame = max(1, int(SAMPLE_RATE * ANALYSIS_FRAME_SECONDS))
    frame_count = len(audio) // frame
    if frame_count == 0:
        return audio
    frames = audio[: frame_count * frame].reshape(frame_count, frame)
    rms = np.sqrt(np.mean(frames**2, axis=1)) + 1e-12
    loudness_db = 20 * np.log10(rms / rms.max())
    voiced = np.flatnonzero(loudness_db > SILENCE_THRESHOLD_DB)
    if voiced.size == 0:
        return audio
    padding = int(SAMPLE_RATE * KEPT_SILENCE_SECONDS)
    start = max(0, voiced[0] * frame - padding)
    end = min(len(audio), (voiced[-1] + 1) * frame + padding)
    return audio[start:end]


def load_manifest(output_dir: Path) -> dict:
    manifest_path = output_dir / MANIFEST_NAME
    if not manifest_path.exists():
        return {}
    return json.loads(manifest_path.read_text())


def is_cached(line: NarrationLine, previous_entry: dict | None, output_dir: Path) -> bool:
    if not previous_entry or previous_entry.get("hash") != line.fingerprint:
        return False
    return (output_dir / previous_entry["file"]).exists()


def render_line(line: NarrationLine, synthesizer: KokoroSynthesizer, output_dir: Path) -> dict:
    audio, phonemes = synthesizer.synthesize(line)
    audio = trim_silence(audio)
    file_name = f"{line.id}.wav"
    soundfile.write(output_dir / file_name, audio, SAMPLE_RATE, subtype="PCM_16")
    return {
        "file": file_name,
        "duration_seconds": round(len(audio) / SAMPLE_RATE, 3),
        "text": line.text,
        "voice": line.voice,
        "speed": line.speed,
        "phonemes": phonemes,
        "hash": line.fingerprint,
    }


def render_all(lines: list[NarrationLine], output_dir: Path, force: bool) -> dict:
    previous = {} if force else load_manifest(output_dir)
    manifest: dict = {}
    synthesizer: KokoroSynthesizer | None = None
    for line in lines:
        if is_cached(line, previous.get(line.id), output_dir):
            manifest[line.id] = previous[line.id]
            print(f"cached   {line.id}")
            continue
        synthesizer = synthesizer or KokoroSynthesizer()
        manifest[line.id] = render_line(line, synthesizer, output_dir)
        print(f"rendered {line.id}  {manifest[line.id]['duration_seconds']:.2f}s")
    return manifest


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render narration lines with Kokoro-82M.")
    parser.add_argument("lines", type=Path, help="JSON file with a list of narration lines")
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--voice", default=DEFAULT_VOICE, help="Voice for lines that omit one")
    parser.add_argument("--force", action="store_true", help="Ignore the cache and re-render everything")
    return parser.parse_args()


def main() -> None:
    arguments = parse_arguments()
    raw_lines = json.loads(arguments.lines.read_text())
    lines = [NarrationLine.from_json(raw, arguments.voice) for raw in raw_lines]
    duplicate_ids = {line.id for line in lines if [l.id for l in lines].count(line.id) > 1}
    if duplicate_ids:
        sys.exit(f"Duplicate ids: {sorted(duplicate_ids)}")
    arguments.output_dir.mkdir(parents=True, exist_ok=True)
    manifest = render_all(lines, arguments.output_dir, arguments.force)
    manifest_path = arguments.output_dir / MANIFEST_NAME
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {manifest_path}")


if __name__ == "__main__":
    main()
