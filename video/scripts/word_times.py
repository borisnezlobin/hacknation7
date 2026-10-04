"""Time every script word in each narration clip with Whisper, for word-accurate captions.

Usage: uv run --project video/tts python video/scripts/word_times.py
Writes video/public/audio/narration/words.json: {line_id: {"hash": ..., "words": [[word, start, end], ...]}}.
"""

import json
import re
from pathlib import Path

import mlx_whisper

NARRATION_DIR = Path(__file__).resolve().parents[1] / "public" / "audio" / "narration"
MODEL = "mlx-community/whisper-large-v3-turbo"
BRACKETED = re.compile(r"\[([^\]]+)\]\([^)]*\)")


def script_words(text: str) -> list[str]:
    return BRACKETED.sub(r"\1", text).split()


def whisper_word_spans(path: Path) -> list[tuple[float, float]]:
    result = mlx_whisper.transcribe(str(path), path_or_hf_repo=MODEL, word_timestamps=True)
    return [(word["start"], word["end"]) for segment in result["segments"] for word in segment.get("words", [])]


def align(words: list[str], spans: list[tuple[float, float]], duration: float) -> list[list]:
    if not spans:
        step = duration / max(1, len(words))
        return [[word, round(i * step, 3), round((i + 1) * step, 3)] for i, word in enumerate(words)]
    aligned = []
    for index, word in enumerate(words):
        source = min(len(spans) - 1, round(index * (len(spans) - 1) / max(1, len(words) - 1)))
        aligned.append([word, round(spans[source][0], 3), round(spans[source][1], 3)])
    return aligned


def main() -> None:
    manifest = json.loads((NARRATION_DIR / "manifest.json").read_text())
    cache_path = NARRATION_DIR / "words.json"
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    for line_id, entry in manifest.items():
        if cache.get(line_id, {}).get("hash") == entry["hash"]:
            continue
        words = script_words(entry["text"])
        spans = whisper_word_spans(NARRATION_DIR / Path(entry["file"]).name)
        cache[line_id] = {"hash": entry["hash"], "words": align(words, spans, entry["duration_seconds"])}
        print(line_id, len(words), len(spans))
    cache_path.write_text(json.dumps(cache, indent=1))


if __name__ == "__main__":
    main()
