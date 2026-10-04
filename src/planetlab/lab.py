"""Lab bookkeeping: the champion pipeline, paired comparisons, the holdout ledger and discovery runs."""

import json
from math import comb
from pathlib import Path

from planetlab import catalog, harness, record, vetting
from planetlab.paths import CANDIDATES_DIR, REPO_ROOT, RUNS_DIR

CHAMPION_PATH = REPO_ROOT / "lab" / "champion.json"
HOLDOUT_LEDGER_PATH = REPO_ROOT / "lab" / "holdout_ledger.json"
HOLDOUT_BUDGET = 4


def load_run(run_id: str) -> dict:
    return json.loads((RUNS_DIR / f"{run_id}.json").read_text())


def champion() -> dict | None:
    return json.loads(CHAMPION_PATH.read_text()) if CHAMPION_PATH.exists() else None


def _outcome_key(outcome: dict) -> tuple:
    return outcome["tic"], outcome["role"], round(outcome["period"], 4)


def sign_test_p_value(gained: int, lost: int) -> float:
    flips = gained + lost
    if flips == 0:
        return 1.0
    tail = sum(comb(flips, k) for k in range(max(gained, lost), flips + 1)) / 2**flips
    return min(1.0, 2 * tail)


def paired_comparison(candidate_run: dict, reference_run: dict) -> dict:
    reference = {_outcome_key(o): o["recovered"] for o in reference_run["outcomes"]}
    gained = lost = 0
    for outcome in candidate_run["outcomes"]:
        before = reference.get(_outcome_key(outcome))
        if before is None:
            continue
        gained += outcome["recovered"] and not before
        lost += before and not outcome["recovered"]
    return {
        "reference_run": reference_run["run_id"],
        "gained": gained,
        "lost": lost,
        "net": gained - lost,
        "sign_test_p": round(sign_test_p_value(gained, lost), 4),
        "score_delta": round(candidate_run["metrics"]["score"] - reference_run["metrics"]["score"], 4),
    }


def _champion_reference(current: dict, quick: bool) -> dict | None:
    if not quick:
        return load_run(current["run_id"])
    quick_runs = [json.loads(p.read_text()) for p in sorted(RUNS_DIR.glob("dev-*.json"), key=lambda p: p.stat().st_mtime)]
    matching = [r for r in quick_runs if r["quick"] and r["pipeline_sha256"] == current["sha256"]]
    return matching[-1] if matching else None


def compare_to_champion(run: dict) -> dict | None:
    current = champion()
    if current is None or current["run_id"] == run["run_id"]:
        return None
    reference = _champion_reference(current, run["quick"])
    if reference is None or reference["run_id"] == run["run_id"]:
        return None
    return paired_comparison(run, reference)


def promote(run_id: str, agent: str) -> dict:
    run = load_run(run_id)
    pipeline_path = REPO_ROOT / run["pipeline"]
    problems = _promotion_problems(run, pipeline_path)
    if problems:
        raise ValueError("; ".join(problems))
    comparison = compare_to_champion(run)
    if comparison is not None and comparison["net"] <= 0:
        raise ValueError(f"Not better than the champion on matched targets: {comparison}")
    entry = {"pipeline": run["pipeline"], "run_id": run_id, "score": run["metrics"]["score"], "sha256": run["pipeline_sha256"]}
    CHAMPION_PATH.parent.mkdir(parents=True, exist_ok=True)
    CHAMPION_PATH.write_text(json.dumps(entry, indent=1))
    record.append("decision", agent, f"Promote {run['pipeline']} to champion", data={"run_id": run_id, "comparison": comparison})
    return entry


def _promotion_problems(run: dict, pipeline_path: Path) -> list[str]:
    checks = [
        (run["split"] != "dev", "only dev runs can be promoted"),
        (run["quick"], "quick runs cannot be promoted; run the full dev split"),
        (not pipeline_path.exists(), f"{run['pipeline']} no longer exists"),
        (pipeline_path.exists() and harness.file_sha256(pipeline_path) != run["pipeline_sha256"], "pipeline file changed after the run"),
        (run["metrics"]["errors"] > 0, "pipeline raised errors during the run"),
    ]
    return [message for failed, message in checks if failed]


def holdout_ledger() -> list[dict]:
    return json.loads(HOLDOUT_LEDGER_PATH.read_text()) if HOLDOUT_LEDGER_PATH.exists() else []


def score_holdout(pipeline: Path, agent: str) -> dict:
    ledger = holdout_ledger()
    if len(ledger) >= HOLDOUT_BUDGET:
        raise PermissionError(f"Holdout budget of {HOLDOUT_BUDGET} evaluations is spent.")
    run = harness.evaluate(pipeline, split="holdout")
    ledger.append({"run_id": run["run_id"], "pipeline": run["pipeline"], "agent": agent, "metrics": run["metrics"]})
    HOLDOUT_LEDGER_PATH.write_text(json.dumps(ledger, indent=1))
    record.append("result", agent, f"Holdout score for {run['pipeline']}", data={"run_id": run["run_id"], "metrics": run["metrics"]})
    return run


THRESHOLD_KEYS = {"strict": "strict_threshold", "5pct": "threshold"}


def _strongest_signal_per_star(results: list[dict], threshold: float) -> list[tuple[dict, dict]]:
    pairs = []
    for result in results:
        above = [s for s in result["signals"] if s["score"] >= threshold]
        if above:
            pairs.append((result, max(above, key=lambda s: s["score"])))
    return sorted(pairs, key=lambda pair: pair[1]["score"], reverse=True)


def discover(pipeline: Path, agent: str, max_candidates: int = 20, max_stars: int | None = None, threshold_mode: str = "strict") -> dict:
    current = champion()
    if current is None or current["pipeline"] != str(pipeline.relative_to(REPO_ROOT)):
        raise ValueError("Discovery runs only with the current champion pipeline.")
    threshold = load_run(current["run_id"])["metrics"][THRESHOLD_KEYS[threshold_mode]]
    results = harness.search_split(pipeline, "discovery", max_stars=max_stars)
    over_threshold = _strongest_signal_per_star(results, threshold)
    known = catalog.known_signal_tics()
    unknown = [(r, s) for r, s in over_threshold if r["tic"] not in known]
    vetted = [_vetted_candidate(r, s) for r, s in unknown]
    survivors = [c for c in vetted if c["vetting"]["passes"]]
    summary = {
        "pipeline": current["pipeline"], "threshold_mode": threshold_mode, "threshold": threshold,
        "stars_searched": len(results), "signals_over_threshold": len(over_threshold),
        "after_catalog_crossmatch": len(unknown), "survivors_after_vetting": len(survivors),
        "candidates": survivors[:max_candidates],
        "rejected": [_rejection(c) for c in vetted if not c["vetting"]["passes"]],
    }
    CANDIDATES_DIR.mkdir(parents=True, exist_ok=True)
    (CANDIDATES_DIR / "discovery.json").write_text(json.dumps(summary, indent=1))
    record.append("result", agent, f"Discovery ({threshold_mode} threshold): {len(over_threshold)} stars over threshold, "
                  f"{len(unknown)} not in TOI/CTOI, {len(survivors)} pass vetting",
                  data={k: v for k, v in summary.items() if k not in ("candidates", "rejected")})
    return summary


def _rejection(candidate: dict) -> dict:
    return {"tic": candidate["tic"], "period": candidate["signal"]["period"], "flags": candidate["vetting"]["flags"]}


def _vetted_candidate(result: dict, signal: dict) -> dict:
    report = vetting.vet(result["tic"], result["sector"], signal["period"], signal["t0"], signal["duration"])
    return {"tic": result["tic"], "sector": result["sector"], "signal": signal, "vetting": report}
