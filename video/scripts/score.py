"""Synthesize each video's soundtrack: a pad and arpeggio score, sound effects at cue times, and the narration on top.

Usage: python video/scripts/score.py [demo tech team]
"""

import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy import signal

VIDEO_DIR = Path(__file__).resolve().parents[1]
PUBLIC_DIR = VIDEO_DIR / "public"
SCRIPT_DIR = VIDEO_DIR / "script"
MIX_DIR = VIDEO_DIR / "out" / "audio"
RATE = 48000
FPS = 30
BPM = 96
MUSIC_LEVEL = 0.55
SFX_LEVEL = 0.4
CHORDS = [
    [50, 57, 62, 64, 69],
    [46, 53, 58, 62, 65],
    [43, 50, 55, 58, 62],
    [45, 52, 57, 61, 64],
]


def midi_hz(note: float) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def envelope(length: int, attack: float, release: float) -> np.ndarray:
    env = np.ones(length)
    a = max(1, int(attack * RATE))
    r = max(1, int(release * RATE))
    env[:a] = np.linspace(0, 1, a)
    env[-r:] *= np.linspace(1, 0, r)
    return env


def lowpass(audio: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    sos = signal.butter(order, cutoff, "low", fs=RATE, output="sos")
    return signal.sosfilt(sos, audio)


def highpass(audio: np.ndarray, cutoff: float) -> np.ndarray:
    sos = signal.butter(2, cutoff, "high", fs=RATE, output="sos")
    return signal.sosfilt(sos, audio)


def reverb(audio: np.ndarray, seconds: float = 2.6, wet: float = 0.35, seed: int = 1) -> np.ndarray:
    rng = np.random.default_rng(seed)
    length = int(seconds * RATE)
    impulse = rng.standard_normal(length) * np.exp(-np.linspace(0, 7, length))
    impulse = lowpass(impulse, 5000)
    impulse /= np.sqrt(np.sum(impulse**2))
    tail = signal.fftconvolve(audio, impulse)[: len(audio)]
    return audio * (1 - wet) + tail * wet


def saw_voice(freq: float, length: int, detune: float = 0.12) -> np.ndarray:
    t = np.arange(length) / RATE
    voice = np.zeros(length)
    for cents in (-detune, 0.0, detune):
        f = freq * 2 ** (cents / 12)
        voice += 2 * ((t * f + np.random.random()) % 1.0) - 1
    return voice / 3


def pad(seconds: float) -> np.ndarray:
    total = int(seconds * RATE)
    out = np.zeros(total)
    bar = 4 * 60 / BPM * 2
    chord_len = int(bar * RATE)
    for index, start in enumerate(range(0, total, chord_len)):
        length = min(chord_len + int(RATE * 1.5), total - start)
        chord = CHORDS[index % len(CHORDS)]
        tone = sum(saw_voice(midi_hz(note), length) for note in chord)
        tone = lowpass(tone, 900) * envelope(length, 1.2, 1.5)
        out[start : start + length] += tone * 0.07
    return out


def pluck(freq: float, seconds: float = 0.6) -> np.ndarray:
    length = int(seconds * RATE)
    t = np.arange(length) / RATE
    tone = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) + 0.12 * np.sin(2 * np.pi * freq * 3 * t)
    return tone * np.exp(-t * 7)


def arpeggio(seconds: float) -> np.ndarray:
    total = int(seconds * RATE)
    out = np.zeros(total + RATE)
    step = 60 / BPM / 2
    bar = 4 * 60 / BPM * 2
    for index in range(int(seconds / step)):
        at = index * step
        chord = CHORDS[int(at // bar) % len(CHORDS)]
        note = chord[[0, 2, 4, 3, 1, 4, 2, 3][index % 8]] + 12
        start = int(at * RATE)
        hit = pluck(midi_hz(note)) * (0.55 if index % 2 else 0.8)
        out[start : start + len(hit)] += hit[: len(out) - start]
    return out[:total] * 0.09


def kick() -> np.ndarray:
    length = int(0.5 * RATE)
    t = np.arange(length) / RATE
    freq = 45 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / RATE) * np.exp(-t * 9)


def pulse_track(seconds: float) -> np.ndarray:
    total = int(seconds * RATE)
    out = np.zeros(total + RATE)
    beat = 60 / BPM
    sample = kick()
    for index in range(int(seconds / beat)):
        start = int(index * beat * RATE)
        out[start : start + len(sample)] += sample * 0.5
    return out[:total]


def sub_hit() -> np.ndarray:
    length = int(2.2 * RATE)
    t = np.arange(length) / RATE
    freq = 32 + 50 * np.exp(-t * 5)
    body = np.sin(2 * np.pi * np.cumsum(freq) / RATE) * np.exp(-t * 2.2)
    crack = lowpass(np.random.standard_normal(length), 2500) * np.exp(-t * 30) * 0.5
    return (body + crack) * 0.9


def riser(seconds: float = 1.8) -> np.ndarray:
    length = int(seconds * RATE)
    t = np.linspace(0, 1, length)
    noise = np.random.standard_normal(length)
    sweep = np.zeros(length)
    for chunk in range(0, length, 2048):
        cutoff = 300 + 7000 * t[chunk] ** 2
        sweep[chunk : chunk + 2048] = lowpass(noise[chunk : chunk + 2048], cutoff, 1)
    return sweep * t**2 * 0.35


def click() -> np.ndarray:
    length = int(0.05 * RATE)
    t = np.arange(length) / RATE
    return (np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 180) + np.random.standard_normal(length) * np.exp(-t * 600) * 0.4) * 0.35


def whoosh() -> np.ndarray:
    length = int(0.35 * RATE)
    t = np.linspace(0, 1, length)
    return highpass(np.random.standard_normal(length), 900) * np.sin(np.pi * t) ** 2 * 0.12


def chime() -> np.ndarray:
    length = int(3.0 * RATE)
    t = np.arange(length) / RATE
    out = np.zeros(length)
    for note, gain in ((74, 1.0), (81, 0.6), (86, 0.4)):
        freq = midi_hz(note)
        out += np.sin(2 * np.pi * freq * t + 1.4 * np.sin(2 * np.pi * freq * 3.5 * t) * np.exp(-t * 4)) * np.exp(-t * 1.6) * gain
    return out * 0.16


def glitch() -> np.ndarray:
    length = int(0.9 * RATE)
    t = np.arange(length) / RATE
    tone = signal.sawtooth(2 * np.pi * np.cumsum(220 * np.exp(-t * 3)) / RATE)
    crushed = np.round(tone * 4) / 4
    gate = (np.floor(t * 28) % 3 != 0).astype(float)
    return lowpass(crushed * gate, 3000) * np.exp(-t * 2.5) * 0.3


def ticks(seconds: float = 1.2, count: int = 21) -> np.ndarray:
    length = int(seconds * RATE)
    out = np.zeros(length + RATE)
    sample = click() * 0.5
    for index in range(count):
        start = int(index / count * seconds * RATE)
        out[start : start + len(sample)] += sample
    return out[:length]


def starlight_hum(seconds: float, dip_start: float, dip_end: float) -> np.ndarray:
    length = int(seconds * RATE)
    t = np.arange(length) / RATE
    tone = sum(np.sin(2 * np.pi * midi_hz(n) * t + np.sin(t * 0.7 + n)) for n in (38, 45, 50, 57, 62)) / 5
    shimmer = lowpass(np.random.standard_normal(length), 6000) * 0.05
    progress = (t / seconds - dip_start) / (dip_end - dip_start)
    ingress = 0.12
    transit = np.clip(np.minimum(progress / ingress, (1 - progress) / ingress), 0, 1) * ((progress > 0) & (progress < 1))
    level = (1 - transit * 0.85) * envelope(length, 1.2, 0.3)
    return (tone + shimmer) * level * 0.35


SOUNDS = {
    "sub": sub_hit,
    "riser": riser,
    "click": click,
    "whoosh": whoosh,
    "chime": chime,
    "glitch": glitch,
    "ticks": ticks,
}


def add(track: np.ndarray, sample: np.ndarray, at_seconds: float, gain: float = 1.0) -> None:
    start = int(at_seconds * RATE)
    if start < 0:
        sample = sample[-start:]
        start = 0
    end = min(len(track), start + len(sample))
    if end > start:
        track[start:end] += sample[: end - start] * gain


def read_wav(path: Path) -> np.ndarray:
    with wave.open(str(path)) as handle:
        audio = np.frombuffer(handle.readframes(handle.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        source_rate = handle.getframerate()
    return signal.resample_poly(audio, RATE, source_rate)


def cue_seconds(cue: dict, timeline: dict) -> float:
    scene = next(s for s in timeline["scenes"] if s["id"] == cue["scene"])
    base = scene["from"] / FPS
    if "line" in cue:
        line = next(item for item in scene["lines"] if item["id"] == cue["line"])
        return base + (line["from"] + line["durationInFrames"] * cue.get("fraction", 0.0)) / FPS + cue.get("offset", 0.0)
    if cue.get("fromEnd") is not None:
        return base + scene["durationInFrames"] / FPS - cue["fromEnd"]
    return base + cue.get("at", 0.0)


def narration_track(timeline: dict, seconds: float) -> tuple[np.ndarray, np.ndarray]:
    voice = np.zeros(int(seconds * RATE))
    speaking = np.zeros(len(voice))
    for scene in timeline["scenes"]:
        for line in scene["lines"]:
            if not line.get("audio"):
                continue
            at = (scene["from"] + line["from"]) / FPS
            audio = read_wav(PUBLIC_DIR / line["audio"])
            add(voice, audio, at)
            add(speaking, np.ones(len(audio)), at)
    duck = np.convolve(speaking.clip(0, 1), np.ones(int(0.25 * RATE)) / int(0.25 * RATE), mode="same")
    return voice, duck


def music_track(timeline: dict, seconds: float, plan: dict) -> np.ndarray:
    length = int(seconds * RATE)
    music = pad(seconds)
    if plan.get("musicFrom"):
        start = int(cue_seconds(plan["musicFrom"], timeline) * RATE)
        music[:start] = 0
        fade = min(int(1.5 * RATE), length - start)
        music[start : start + fade] *= np.linspace(0, 1, fade)
    if plan.get("arpeggioFrom"):
        start = cue_seconds(plan["arpeggioFrom"], timeline)
        add(music, arpeggio(seconds - start) * envelope(int((seconds - start) * RATE), 1.5, 2.0), start)
    if plan.get("pulseFrom"):
        start = cue_seconds(plan["pulseFrom"], timeline)
        add(music, pulse_track(seconds - start) * envelope(int((seconds - start) * RATE), 0.5, 2.0), start)
    for silence in plan.get("silences", []):
        begin = int(cue_seconds(silence["from"], timeline) * RATE)
        end = int(cue_seconds(silence["to"], timeline) * RATE)
        gate = np.ones(length)
        gate[begin:end] = 0.0
        music *= np.convolve(gate, np.ones(2400) / 2400, mode="same")
    return music * envelope(length, 0.8, 2.5)


def effects_track(timeline: dict, seconds: float, plan: dict) -> np.ndarray:
    track = np.zeros(int(seconds * RATE))
    for cue in plan.get("sfx", []):
        if cue["sound"] == "hum":
            scene = next(s for s in timeline["scenes"] if s["id"] == cue["scene"])
            hum = starlight_hum(scene["durationInFrames"] / FPS, cue["dipStart"], cue["dipEnd"])
            add(track, hum, scene["from"] / FPS, cue.get("gain", 1.0))
            continue
        sample = SOUNDS[cue["sound"]]()
        at = cue_seconds(cue, timeline)
        if cue["sound"] == "riser":
            at -= len(sample) / RATE
        add(track, sample, at, cue.get("gain", 1.0))
    return track


def stereo(mono: np.ndarray, width: float = 0.0, seed: int = 0) -> np.ndarray:
    if width <= 0:
        return np.stack([mono, mono], axis=1)
    delayed = np.concatenate([np.zeros(int(0.011 * RATE)), mono])[: len(mono)]
    return np.stack([mono * (1 - width) + delayed * width, mono], axis=1)


def write_wav(path: Path, audio: np.ndarray) -> None:
    peak = np.max(np.abs(audio)) or 1.0
    audio = audio / max(peak, 1.0) * 0.98
    with wave.open(str(path), "w") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes((audio * 32767).astype(np.int16).tobytes())


def mix(name: str) -> Path:
    np.random.seed(7)
    timeline = json.loads((PUBLIC_DIR / "timeline" / f"{name}.json").read_text())
    plan = json.loads((SCRIPT_DIR / f"{name}.json").read_text()).get("sound", {})
    seconds = timeline["durationInFrames"] / FPS
    voice, duck = narration_track(timeline, seconds)
    music = reverb(music_track(timeline, seconds, plan), 3.2, 0.4) * (1 - duck * 0.8) * plan.get("musicGain", 1.0) * MUSIC_LEVEL
    effects = reverb(effects_track(timeline, seconds, plan), 1.8, 0.25, seed=3) * (1 - duck * 0.55) * plan.get("sfxGain", 1.0) * SFX_LEVEL
    bed = stereo(music, 0.6) + stereo(effects, 0.3)
    full = bed + stereo(voice * 1.0)
    MIX_DIR.mkdir(parents=True, exist_ok=True)
    raw = MIX_DIR / f"{name}-raw.wav"
    write_wav(raw, full)
    final = MIX_DIR / f"{name}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", "loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", str(RATE), str(final)], check=True)
    return final


def main() -> None:
    names = sys.argv[1:] or ["demo", "tech", "team"]
    for name in names:
        print(mix(name), file=sys.stderr)


if __name__ == "__main__":
    main()
