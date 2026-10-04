"""Fill the narration templates from lab data, voice them, and lay out each video's timeline.

Usage: python video/scripts/build_timeline.py [--estimate]

With --estimate no audio is generated and line lengths are guessed from word counts.
"""

import json
import subprocess
import sys
from pathlib import Path

VIDEO_DIR = Path(__file__).resolve().parents[1]
SCRIPT_DIR = VIDEO_DIR / "script"
PUBLIC_DIR = VIDEO_DIR / "public"
NARRATION_DIR = PUBLIC_DIR / "audio" / "narration"
TIMELINE_DIR = PUBLIC_DIR / "timeline"
FPS = 30
WORDS_PER_SECOND = 2.7
TAIL_SECONDS = 0.5
VIDEOS = ("demo", "tech", "team")


def percent(value: float) -> str:
    return str(round(value * 100))


NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]


def spoken(count: int) -> str:
    return NUMBER_WORDS[count] if count < len(NUMBER_WORDS) else str(count)


def holdout_outcome(holdout: dict | None) -> str:
    if not holdout:
        return ""
    champion = sum(1 for planet in holdout["planets"] if planet["champion"])
    baseline = sum(1 for planet in holdout["planets"] if planet["baseline"])
    if champion > baseline:
        return f"The original search found {spoken(baseline)}. The champion found {spoken(champion)}."
    return f"The original search found {spoken(baseline)}; the champion, {spoken(champion)}. The loop caught its own overfit in one night."


def discovery_line(lab: dict) -> str:
    candidates = lab.get("candidates") or []
    if not candidates:
        return "Then they searched fifteen hundred unlabelled stars, looking for worlds no one has found."
    count = len(candidates)
    noun = "candidate" if count == 1 else "candidates"
    return f"Then they searched fifteen hundred unlabelled stars, and flagged {spoken(count)} new planet {noun}."


def faint_recovered(run: dict) -> int:
    path = VIDEO_DIR.parent / "runs" / f"{run['run_id']}.json"
    return json.loads(path.read_text())["metrics"]["recall_by_depth"]["planet:0-1000"]["recovered"]


def template_values(lab: dict, holdout: dict | None) -> dict[str, str]:
    runs = {run["run_id"]: run for run in lab["runs"]}
    baseline = next(run for run in lab["runs"] if run["pipeline"].endswith("baseline.py") and not run["quick"])
    champion = runs[lab["champion"]["run_id"]]
    planets = champion["metrics"]["n_planets"]
    holdout_planets = (holdout or {}).get("planets", [])
    return {
        "baselinePlanetPct": percent(baseline["metrics"]["planet_recall"]),
        "championPlanetPct": percent(champion["metrics"]["planet_recall"]),
        "baselinePlanets": str(round(baseline["metrics"]["planet_recall"] * planets)),
        "championPlanets": str(round(champion["metrics"]["planet_recall"] * planets)),
        "baselineScore": f"{baseline['metrics']['score']:.2f}",
        "championScore": f"{champion['metrics']['score']:.2f}",
        "devPlanets": str(planets),
        "baselineFaint": spoken(faint_recovered(baseline)),
        "faintTotal": "sixty-five",
        "devControls": str(champion["metrics"]["n_controls"]),
        "holdoutPlanets": "thirty-seven",
        "holdoutBaseline": spoken(sum(1 for planet in holdout_planets if planet["baseline"])),
        "holdoutChampion": spoken(sum(1 for planet in holdout_planets if planet["champion"])),
        "holdoutOutcome": holdout_outcome(holdout),
        "discoveryLine": discovery_line(lab),
    }


def fill(text: str, values: dict[str, str]) -> str:
    return " ".join(text.format(**values).split())


def collect_lines(scripts: dict[str, dict], values: dict[str, str]) -> list[dict]:
    lines = []
    for script in scripts.values():
        for scene in script["scenes"]:
            for line in scene["lines"]:
                voice = line.get("voice", script["voice"])
                lines.append({"id": line["id"], "text": fill(line["text"], values), "voice": voice, "speed": line.get("speed", script["speed"])})
    return lines


def voice_lines(lines: list[dict]) -> dict:
    NARRATION_DIR.mkdir(parents=True, exist_ok=True)
    request = NARRATION_DIR / "request.json"
    request.write_text(json.dumps(lines, indent=1))
    command = ["uv", "run", "--project", str(VIDEO_DIR / "tts"), "python", str(VIDEO_DIR / "tts" / "speak.py"), str(request), str(NARRATION_DIR)]
    subprocess.run(command, check=True)
    return json.loads((NARRATION_DIR / "manifest.json").read_text())


def estimate_lines(lines: list[dict]) -> dict:
    return {line["id"]: {"file": None, "duration_seconds": len(line["text"].split()) / WORDS_PER_SECOND, "text": line["text"]} for line in lines}


def word_frames(line_id: str, words: dict) -> list[list]:
    entry = words.get(line_id)
    if not entry:
        return []
    return [[word, round(start * FPS), round(end * FPS)] for word, start, end in entry["words"]]


def layout_scene(scene: dict, manifest: dict, texts: dict[str, str], start_frame: int, words: dict) -> dict:
    placed: dict[str, tuple[float, float]] = {}
    for line in scene["lines"]:
        anchor = placed[line["after"]][1] if "after" in line else 0.0
        begin = anchor + line["at"]
        placed[line["id"]] = (begin, begin + manifest[line["id"]]["duration_seconds"])
    spoken_end = max((end for _, end in placed.values()), default=0.0)
    seconds = max(scene["minSeconds"], spoken_end + TAIL_SECONDS)
    lines = [
        {
            "id": line_id,
            "text": texts[line_id],
            "audio": manifest[line_id].get("file") and f"audio/narration/{Path(manifest[line_id]['file']).name}",
            "from": round(begin * FPS),
            "durationInFrames": round((end - begin) * FPS),
            "words": word_frames(line_id, words) if words.get(line_id, {}).get("hash") == manifest[line_id].get("hash") else [],
        }
        for line_id, (begin, end) in placed.items()
    ]
    return {"id": scene["id"], "from": start_frame, "durationInFrames": round(seconds * FPS), "lines": lines}


MAX_CAPTION_WORDS = 7
CAPTION_HOLD_FRAMES = 8
CAPTION_DIR = VIDEO_DIR / "out" / "captions"


def caption_chunks(words: list[list]) -> list[list[list]]:
    chunks: list[list[list]] = []
    current: list[list] = []
    for word in words:
        current.append(word)
        ends_clause = word[0][-1] in ".,:;?!"
        if len(current) >= MAX_CAPTION_WORDS or (ends_clause and len(current) >= 3):
            chunks.append(current)
            current = []
    if current:
        chunks.append(current)
    return chunks


def captions_for(scenes: list[dict]) -> list[dict]:
    captions = []
    for scene in scenes:
        for line in scene["lines"]:
            base = scene["from"] + line["from"]
            for chunk in caption_chunks(line["words"]):
                captions.append({"text": " ".join(word[0] for word in chunk), "from": base + chunk[0][1], "to": base + chunk[-1][2]})
    for current, following in zip(captions, captions[1:]):
        current["to"] = min(following["from"], current["to"] + CAPTION_HOLD_FRAMES)
    if captions:
        captions[-1]["to"] += CAPTION_HOLD_FRAMES
    return captions


def srt_time(frame: int) -> str:
    milliseconds = round(frame / FPS * 1000)
    hours, rest = divmod(milliseconds, 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    seconds, milliseconds = divmod(rest, 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"


def write_srt(name: str, captions: list[dict]) -> None:
    CAPTION_DIR.mkdir(parents=True, exist_ok=True)
    blocks = [f"{index}\n{srt_time(c['from'])} --> {srt_time(c['to'])}\n{c['text']}\n" for index, c in enumerate(captions, start=1)]
    (CAPTION_DIR / f"{name}.srt").write_text("\n".join(blocks))


def build_timeline(script: dict, manifest: dict, texts: dict[str, str], words: dict) -> dict:
    scenes = []
    cursor = 0
    for scene in script["scenes"]:
        placed = layout_scene(scene, manifest, texts, cursor, words)
        scenes.append(placed)
        cursor += placed["durationInFrames"]
    return {"id": script["id"], "fps": FPS, "durationInFrames": cursor, "scenes": scenes, "captions": captions_for(scenes)}


def main() -> None:
    estimate = "--estimate" in sys.argv
    lab = json.loads((PUBLIC_DIR / "data" / "lab.json").read_text())
    holdout_path = PUBLIC_DIR / "data" / "holdout.json"
    holdout = json.loads(holdout_path.read_text()) if holdout_path.exists() else None
    values = template_values(lab, holdout)
    scripts = {name: json.loads((SCRIPT_DIR / f"{name}.json").read_text()) for name in VIDEOS}
    lines = collect_lines(scripts, values)
    texts = {line["id"]: line["text"] for line in lines}
    manifest = estimate_lines(lines) if estimate else voice_lines(lines)
    words_path = NARRATION_DIR / "words.json"
    words = json.loads(words_path.read_text()) if words_path.exists() else {}
    TIMELINE_DIR.mkdir(parents=True, exist_ok=True)
    for name, script in scripts.items():
        timeline = build_timeline(script, manifest, texts, words)
        (TIMELINE_DIR / f"{name}.json").write_text(json.dumps(timeline, indent=1))
        write_srt(name, timeline["captions"])
        print(f"{name}: {timeline['durationInFrames'] / FPS:.1f} s", file=sys.stderr)


if __name__ == "__main__":
    main()
