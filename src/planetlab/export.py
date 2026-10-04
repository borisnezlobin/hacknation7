"""Export the lab's state as one JSON file for the dashboard (human-facing; reads sealed holdout outcomes)."""

import json
from pathlib import Path

import numpy as np

from planetlab import lab, lightcurves, record
from planetlab.datasets import read_split
from planetlab.paths import CANDIDATES_DIR, HOLDOUT_DIR, REPO_ROOT, RUNS_DIR

DASHBOARD_PATH = REPO_ROOT / "web" / "public" / "lab.json"
FOLD_BINS = 120
FOLD_WINDOW_DURATIONS = 3.0
QUESTION = (
    "Can a team of agents improve a blind transit search faster than hand tuning, and does the improved search "
    "recover planets the TESS team announced after 2026-07-01?"
)
RUN_METRIC_KEYS = (
    "score", "planet_recall", "injection_recall", "median_seconds_per_star", "wall_seconds", "n_planets", "n_injected", "n_controls",
)


def folded_curve(tic: int, sector: int, period: float, t0: float, duration: float) -> dict:
    curve = lightcurves.load(tic, sector)
    phase_days = (curve.time - t0 + 0.5 * period) % period - 0.5 * period
    window = FOLD_WINDOW_DURATIONS * max(duration, 0.04)
    inside = np.abs(phase_days) < window
    edges = np.linspace(-window, window, FOLD_BINS + 1)
    index = np.digitize(phase_days[inside], edges) - 1
    flux = curve.flux[inside]
    binned = [float(np.median(flux[index == i])) if np.any(index == i) else None for i in range(FOLD_BINS)]
    centers = 0.5 * (edges[1:] + edges[:-1]) * 24.0
    return {"hours": [round(float(c), 3) for c in centers], "flux": [None if b is None else round(b, 6) for b in binned]}


def _result_entries_by_run() -> dict[str, dict]:
    return {e["data"]["run_id"]: e for e in record.read_all() if e["kind"] == "result" and "run_id" in e.get("data", {})}


def _promoted_runs() -> set[str]:
    return {e["data"].get("run_id") for e in record.read_all() if e["kind"] == "decision" and e["data"].get("run_id")}


def _run_summaries() -> list[dict]:
    results, promoted = _result_entries_by_run(), _promoted_runs()
    summaries = []
    for path in sorted(RUNS_DIR.glob("dev-*.json"), key=lambda p: p.stat().st_mtime):
        run = json.loads(path.read_text())
        entry = results.get(run["run_id"], {})
        summaries.append({
            "run_id": run["run_id"],
            "created": run["created"],
            "pipeline": run["pipeline"],
            "quick": run["quick"],
            "hypothesis": (entry.get("refs") or [None])[0],
            "agent": entry.get("agent"),
            "metrics": {k: run["metrics"].get(k) for k in RUN_METRIC_KEYS},
            "vs_champion": entry.get("data", {}).get("vs_champion"),
            "promoted": run["run_id"] in promoted,
        })
    return summaries


def _latest_sealed_holdout() -> dict | None:
    runs = sorted((HOLDOUT_DIR / "runs").glob("*.json"), key=lambda p: p.stat().st_mtime)
    return json.loads(runs[-1].read_text()) if runs else None


def _rediscoveries() -> list[dict]:
    sealed = _latest_sealed_holdout()
    if sealed is None:
        return []
    targets = {(t.tic, round(t.period, 4)): t for t in read_split("holdout_planets")}
    rows = []
    for outcome in (o for o in sealed["outcomes"] if o["role"] == "planet"):
        target = targets.get((outcome["tic"], round(outcome["period"], 4)))
        if target is None:
            continue
        rows.append({
            "toi": target.toi, "tic": target.tic, "sector": target.sector, "period": target.period,
            "depth_ppm": target.depth_ppm, "tmag": target.tmag, "recovered": outcome["recovered"],
            "lightcurve": folded_curve(target.tic, target.sector, target.period, target.epoch_btjd, target.duration_days),
        })
    return sorted(rows, key=lambda r: (not r["recovered"], r["toi"]))


def _candidates() -> list[dict]:
    path = CANDIDATES_DIR / "discovery.json"
    if not path.exists():
        return []
    rows = []
    for item in json.loads(path.read_text())["candidates"]:
        signal = item["signal"]
        rows.append({
            "tic": item["tic"], "sector": item["sector"], "period": signal["period"], "depth_ppm": signal["depth"] * 1e6,
            "score": signal["score"], "flags": item["vetting"]["flags"], "passes": item["vetting"]["passes"],
            "lightcurve": folded_curve(item["tic"], item["sector"], signal["period"], signal["t0"], signal["duration"]),
        })
    return rows


def export(path: Path = DASHBOARD_PATH) -> Path:
    payload = {
        "question": QUESTION,
        "champion": lab.champion(),
        "runs": _run_summaries(),
        "record": record.read_all(),
        "holdout": lab.holdout_ledger(),
        "rediscoveries": _rediscoveries(),
        "candidates": _candidates(),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, default=str))
    return path
