"""Write the real lab data the videos animate: lab state, showcase light curves and a star field."""

import csv
import importlib.util
import json
import sys
from dataclasses import asdict
from pathlib import Path

import numpy as np

from planetlab import lightcurves
from planetlab.datasets import read_split
from planetlab.export import export, folded_curve
from planetlab.paths import HOLDOUT_DIR, REPO_ROOT, RUNS_DIR

OUT_DIR = REPO_ROOT / "video" / "public" / "data"
BASELINE_RUN = "dev-8f6a421c"
CHAMPION_RUN = "dev-7227ffda"
STAR_FIELD_SIZE = 24000
MAX_POINTS = 6000


def load_pipeline(name: str):
    spec = importlib.util.spec_from_file_location(name, REPO_ROOT / "pipelines" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def recovered_by_run(run_id: str) -> dict[tuple[int, str], bool]:
    run = json.loads((RUNS_DIR / f"{run_id}.json").read_text())
    return {(o["tic"], o["role"]): o["recovered"] for o in run["outcomes"]}


def thin(values: np.ndarray, keep: np.ndarray) -> list[float]:
    return [round(float(v), 6) for v in values[keep]]


def light_curve_payload(target: dict, label: str) -> dict:
    curve = lightcurves.load(target["tic"], target["sector"])
    flattened = load_pipeline("baseline").detrend(curve.time, curve.flux)
    keep = np.linspace(0, len(curve.time) - 1, min(MAX_POINTS, len(curve.time))).astype(int)
    return {
        "label": label,
        "tic": target["tic"],
        "sector": target["sector"],
        "toi": target.get("toi"),
        "tmag": target.get("tmag"),
        "period": target.get("period"),
        "t0": target.get("epoch_btjd"),
        "duration": target.get("duration_days"),
        "depth_ppm": target.get("depth_ppm"),
        "time": thin(curve.time, keep),
        "flux": thin(curve.flux, keep),
        "flattened": thin(flattened, keep),
    }


def transit_count(target: dict) -> int:
    curve = lightcurves.load(target["tic"], target["sector"])
    span = curve.time.max() - curve.time.min()
    return int(span // target["period"])


def pick_hero(planets: list[dict], baseline: dict, champion: dict) -> dict:
    gained = [
        p for p in planets
        if champion.get((p["tic"], "planet")) and not baseline.get((p["tic"], "planet"))
        and 6000 < p["depth_ppm"] < 25000 and 1.5 < p["period"] < 5 and (p["tmag"] or 99) < 11.5
    ]
    return max(gained, key=lambda p: (transit_count(p), -(p["tmag"] or 99)))


def pick_shallow(planets: list[dict], champion: dict) -> dict:
    shallow = [p for p in planets if champion.get((p["tic"], "planet")) and p["depth_ppm"] < 3000]
    return min(shallow, key=lambda p: p["depth_ppm"]) if shallow else min(planets, key=lambda p: p["depth_ppm"])


def pick_missed_deep(planets: list[dict], champion: dict) -> dict:
    missed = [p for p in planets if not champion.get((p["tic"], "planet")) and p["depth_ppm"] > 10000]
    return max(missed, key=lambda p: p["depth_ppm"])


def single_event_control(controls: list[dict]) -> dict:
    def deepest_single_drop(target: dict) -> float:
        curve = lightcurves.load(target["tic"], target["sector"])
        flattened = load_pipeline("baseline").detrend(curve.time, curve.flux)
        smoothed = np.convolve(flattened, np.ones(15) / 15, mode="same")[20:-20]
        noise = np.median(np.abs(np.diff(flattened))) + 1e-9
        return float((1 - smoothed.min()) / noise)

    sample = controls[:120]
    return max(sample, key=deepest_single_drop)


def star_field() -> dict:
    rng = np.random.default_rng(96)
    with open(REPO_ROOT / "data" / "catalogs" / "qlp_targets_s0096.csv") as handle:
        rows = [(float(r[1]), float(r[2])) for r in csv.reader(line for line in handle if not line.startswith("#"))]
    picks = rng.choice(len(rows), size=min(STAR_FIELD_SIZE, len(rows)), replace=False)
    ra = np.array([rows[i][0] for i in picks])
    dec = np.array([rows[i][1] for i in picks])
    return {
        "sector": 96,
        "total_stars": len(rows),
        "ra": [round(float(v), 4) for v in ra],
        "dec": [round(float(v), 4) for v in dec],
    }


def planet_outcomes() -> list[dict]:
    def by_planet(run_id: str) -> dict[tuple[int, float], dict]:
        run = json.loads((RUNS_DIR / f"{run_id}.json").read_text())
        return {(o["tic"], round(o["period"], 4)): o for o in run["outcomes"] if o["role"] == "planet"}

    baseline = by_planet(BASELINE_RUN)
    champion = by_planet(CHAMPION_RUN)
    ordered = sorted(champion.items(), key=lambda item: item[1]["depth_ppm"])
    return [
        {"tic": tic, "depth_ppm": round(o["depth_ppm"]), "baseline": bool(baseline[(tic, period)]["recovered"]), "champion": bool(o["recovered"])}
        for (tic, period), o in ordered
    ]


HOLDOUT_RUNS = {"champion": "holdout-c88b13b5", "baseline": "holdout-5328e37d"}


def holdout_outcomes() -> dict | None:
    def recovered(run_id: str) -> dict[tuple[int, float], bool] | None:
        path = HOLDOUT_DIR / "runs" / f"{run_id}.json"
        if not path.exists():
            return None
        run = json.loads(path.read_text())
        return {(o["tic"], round(o["period"], 4)): o["recovered"] for o in run["outcomes"] if o["role"] == "planet"}

    runs = {name: recovered(run_id) for name, run_id in HOLDOUT_RUNS.items()}
    if any(value is None for value in runs.values()):
        return None
    planets = []
    for target in read_split("holdout_planets"):
        key = (target.tic, round(target.period, 4))
        found = {name: runs[name][key] for name in runs}
        fold = folded_curve(target.tic, target.sector, target.period, target.epoch_btjd, target.duration_days) if any(found.values()) else None
        planets.append({"tic": target.tic, "depth_ppm": round(target.depth_ppm), "period": target.period, **found, "fold": fold})
    return {"runs": HOLDOUT_RUNS, "planets": planets}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    export(OUT_DIR / "lab.json")
    planets = [asdict(p) for p in read_split("dev_planets")]
    controls = [asdict(c) for c in read_split("dev_controls")]
    baseline = recovered_by_run(BASELINE_RUN)
    champion = recovered_by_run(CHAMPION_RUN)
    curves = {
        "hero": light_curve_payload(pick_hero(planets, baseline, champion), "Gained by the champion"),
        "shallow": light_curve_payload(pick_shallow(planets, champion), "Shallowest recovered planet"),
        "missedDeep": light_curve_payload(pick_missed_deep(planets, champion), "Deep planet still missed"),
        "systematic": light_curve_payload(single_event_control(controls), "Quiet control star"),
    }
    (OUT_DIR / "lightcurves.json").write_text(json.dumps(curves))
    (OUT_DIR / "starfield.json").write_text(json.dumps(star_field()))
    (OUT_DIR / "outcomes.json").write_text(json.dumps(planet_outcomes()))
    (OUT_DIR / "holdout.json").write_text(json.dumps(holdout_outcomes()))
    for key, curve in curves.items():
        print(key, curve["tic"], curve["toi"], curve["period"], curve["depth_ppm"], curve["tmag"], file=sys.stderr)


if __name__ == "__main__":
    main()
