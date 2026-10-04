import fcntl
import hashlib
import importlib.util
import json
import time
import uuid
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from planetlab import lightcurves
from planetlab.datasets import Target, read_split
from planetlab.injection import InjectedTransit, inject, plan_injection
from planetlab.matching import Truth, signal_matches
from planetlab.paths import HOLDOUT_DIR, REPO_ROOT, RUNS_DIR

LOCK_PATH = RUNS_DIR / ".experiment.lock"

FALSE_ALARM_BUDGET = 0.05
STRICT_FALSE_ALARM_BUDGET = 0.01
MAX_SIGNALS_PER_STAR = 5
QUICK_FRACTION = 3
DEPTH_BINS_PPM = (0, 1000, 3000, 10000, float("inf"))

SPLITS = {
    "dev": ("dev_planets", "dev_controls"),
    "holdout": ("holdout_planets", "holdout_controls"),
}


@dataclass
class StarJob:
    tic: int
    sector: int
    role: str
    truths: list[Truth] = field(default_factory=list)


_pipeline_search = None


def _load_pipeline(path: str):
    spec = importlib.util.spec_from_file_location("candidate_pipeline", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.search


def _init_worker(pipeline_path: str) -> None:
    global _pipeline_search
    _pipeline_search = _load_pipeline(pipeline_path)


def _flux_for(job: StarJob) -> tuple[np.ndarray, np.ndarray]:
    curve = lightcurves.load(job.tic, job.sector)
    if job.role != "injected":
        return curve.time, curve.flux
    transit = plan_injection(job.tic, curve.time)
    return curve.time, inject(curve.time, curve.flux, transit)


def _run_job(job: StarJob) -> dict:
    time_array, flux = _flux_for(job)
    started = time.perf_counter()
    try:
        signals = _pipeline_search(time_array, flux) or []
        error = None
    except Exception as exc:  # noqa: BLE001 - candidate pipelines are untrusted code
        signals, error = [], f"{type(exc).__name__}: {exc}"
    elapsed = time.perf_counter() - started
    ranked = sorted(signals, key=lambda s: s.get("score", -np.inf), reverse=True)[:MAX_SIGNALS_PER_STAR]
    clean = [{k: float(v) for k, v in s.items() if k in ("period", "t0", "duration", "depth", "score")} for s in ranked]
    return {"tic": job.tic, "sector": job.sector, "role": job.role, "signals": clean, "seconds": elapsed, "error": error}


def _truth_from_target(target: Target) -> Truth:
    return Truth(target.period, target.epoch_btjd, target.duration_days, target.depth_ppm)


def _planet_jobs(targets: list[Target]) -> list[StarJob]:
    grouped: dict[tuple[int, int], StarJob] = {}
    for target in targets:
        key = (target.tic, target.sector)
        grouped.setdefault(key, StarJob(target.tic, target.sector, "planet")).truths.append(_truth_from_target(target))
    return list(grouped.values())


def _control_jobs(targets: list[Target]) -> list[StarJob]:
    jobs = []
    for target in targets:
        jobs.append(StarJob(target.tic, target.sector, "control"))
        jobs.append(StarJob(target.tic, target.sector, "injected"))
    return jobs


def _injected_truth(job: StarJob) -> Truth:
    curve = lightcurves.load(job.tic, job.sector)
    transit: InjectedTransit = plan_injection(job.tic, curve.time)
    return Truth(transit.period, transit.epoch_btjd, transit.duration_days, transit.depth_ppm)


def build_jobs(split: str, quick: bool) -> list[StarJob]:
    planet_split, control_split = SPLITS[split]
    planets = _planet_jobs(read_split(planet_split))
    controls = _control_jobs(read_split(control_split))
    if quick:
        planets = [j for j in planets if j.tic % QUICK_FRACTION == 0]
        controls = [j for j in controls if j.tic % QUICK_FRACTION == 0]
    for job in controls:
        if job.role == "injected":
            job.truths = [_injected_truth(job)]
    return planets + controls


def _top_score(result: dict) -> float:
    return max((s["score"] for s in result["signals"]), default=-np.inf)


def _false_alarm_threshold(results: list[dict], budget: float = FALSE_ALARM_BUDGET) -> float:
    control_scores = [_top_score(r) for r in results if r["role"] == "control"]
    finite = [s for s in control_scores if np.isfinite(s)]
    return float(np.quantile(finite, 1.0 - budget)) if finite else float("inf")


def _recovered(result: dict, truth: Truth, threshold: float) -> bool:
    return any(s["score"] >= threshold and signal_matches(s, truth) for s in result["signals"])


def _depth_bin(depth_ppm: float) -> str:
    for low, high in zip(DEPTH_BINS_PPM, DEPTH_BINS_PPM[1:], strict=False):
        if low <= depth_ppm < high:
            return f"{int(low)}-{'inf' if high == float('inf') else int(high)}"
    return "unknown"


def _score_truths(results: list[dict], jobs: list[StarJob], threshold: float) -> tuple[list[dict], dict]:
    outcomes = []
    by_depth: dict[str, list[bool]] = defaultdict(list)
    for result, job in zip(results, jobs, strict=True):
        for truth in job.truths:
            found = _recovered(result, truth, threshold)
            outcomes.append({"tic": job.tic, "role": job.role, "period": truth.period, "depth_ppm": truth.depth_ppm, "recovered": found})
            by_depth[f"{job.role}:{_depth_bin(truth.depth_ppm)}"].append(found)
    depth_summary = {k: {"recovered": sum(v), "total": len(v)} for k, v in sorted(by_depth.items())}
    return outcomes, depth_summary


def _recall(outcomes: list[dict], role: str) -> float:
    relevant = [o["recovered"] for o in outcomes if o["role"] == role]
    return float(np.mean(relevant)) if relevant else 0.0


def summarize(results: list[dict], jobs: list[StarJob]) -> dict:
    threshold = _false_alarm_threshold(results)
    outcomes, depth_summary = _score_truths(results, jobs, threshold)
    planet_recall = _recall(outcomes, "planet")
    injection_recall = _recall(outcomes, "injected")
    controls = [r for r in results if r["role"] == "control"]
    return {
        "score": round(0.5 * planet_recall + 0.5 * injection_recall, 4),
        "planet_recall": round(planet_recall, 4),
        "injection_recall": round(injection_recall, 4),
        "false_alarm_budget": FALSE_ALARM_BUDGET,
        "threshold": threshold,
        "strict_threshold": _false_alarm_threshold(results, STRICT_FALSE_ALARM_BUDGET),
        "control_false_alarms": sum(_top_score(r) >= threshold for r in controls),
        "n_planets": sum(o["role"] == "planet" for o in outcomes),
        "n_injected": sum(o["role"] == "injected" for o in outcomes),
        "n_controls": len(controls),
        "errors": sum(r["error"] is not None for r in results),
        "median_seconds_per_star": round(float(np.median([r["seconds"] for r in results])), 3),
        "recall_by_depth": depth_summary,
    }, outcomes


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _run_jobs(pipeline_path: Path, jobs: list[StarJob], workers: int) -> list[dict]:
    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOCK_PATH.open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        with ProcessPoolExecutor(workers, initializer=_init_worker, initargs=(str(pipeline_path),)) as pool:
            return list(pool.map(_run_job, jobs, chunksize=4))


def search_split(pipeline_path: Path, split: str, workers: int = 10, max_stars: int | None = None) -> list[dict]:
    jobs = [StarJob(t.tic, t.sector, "search") for t in read_split(split)][:max_stars]
    return _run_jobs(pipeline_path, jobs, workers)


def evaluate(pipeline_path: Path, split: str = "dev", quick: bool = False, workers: int = 10,
             hypothesis: str | None = None, agent: str = "unrecorded") -> dict:
    jobs = build_jobs(split, quick)
    started = time.time()
    results = _run_jobs(pipeline_path, jobs, workers)
    metrics, outcomes = summarize(results, jobs)
    metrics["wall_seconds"] = round(time.time() - started, 1)
    run = {
        "run_id": f"{split}-{uuid.uuid4().hex[:8]}",
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "pipeline": str(pipeline_path.resolve().relative_to(REPO_ROOT)),
        "pipeline_sha256": file_sha256(pipeline_path),
        "split": split,
        "quick": quick,
        "metrics": metrics,
    }
    _save_run(run, outcomes)
    if split == "dev":
        run["record_id"] = _record_dev_result(run, hypothesis, agent)
    return run


def _record_dev_result(run: dict, hypothesis: str | None, agent: str) -> str:
    from planetlab import lab, record

    comparison = lab.compare_to_champion(run)
    run["vs_champion"] = comparison
    metrics = {k: v for k, v in run["metrics"].items() if k != "recall_by_depth"}
    entry = record.append(
        "result", agent, f"{'Quick' if run['quick'] else 'Full'} dev run of {run['pipeline']}",
        refs=[hypothesis] if hypothesis else [],
        data={"run_id": run["run_id"], "metrics": metrics, "vs_champion": comparison},
    )
    return entry["id"]


def _save_run(run: dict, outcomes: list[dict]) -> None:
    """Dev outcomes are visible to agents; holdout outcomes go to the sealed holdout directory."""
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    if run["split"] == "dev":
        (RUNS_DIR / f"{run['run_id']}.json").write_text(json.dumps(dict(run, outcomes=outcomes), indent=1))
        return
    (RUNS_DIR / f"{run['run_id']}.json").write_text(json.dumps(run, indent=1))
    sealed = HOLDOUT_DIR / "runs"
    sealed.mkdir(parents=True, exist_ok=True)
    (sealed / f"{run['run_id']}.json").write_text(json.dumps(dict(run, outcomes=outcomes), indent=1))
