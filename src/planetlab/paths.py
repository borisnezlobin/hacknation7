from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
CATALOG_DIR = DATA_DIR / "catalogs"
LIGHTCURVE_DIR = DATA_DIR / "lightcurves"
SPLITS_DIR = DATA_DIR / "splits"
HOLDOUT_DIR = DATA_DIR / "holdout"
RUNS_DIR = REPO_ROOT / "runs"
PIPELINES_DIR = REPO_ROOT / "pipelines"
RECORD_PATH = REPO_ROOT / "lab" / "record.jsonl"
CANDIDATES_DIR = REPO_ROOT / "candidates"


def ensure_dirs() -> None:
    for directory in (CATALOG_DIR, LIGHTCURVE_DIR, SPLITS_DIR, HOLDOUT_DIR, RUNS_DIR, CANDIDATES_DIR, RECORD_PATH.parent):
        directory.mkdir(parents=True, exist_ok=True)
