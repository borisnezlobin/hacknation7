import json
import random
from dataclasses import asdict, dataclass

import httpx
import pandas as pd

from planetlab import catalog, lightcurves
from planetlab.paths import CATALOG_DIR, HOLDOUT_DIR, SPLITS_DIR

QLP_SECTORS = list(range(91, 99))
CONTROL_SECTORS = [96, 97, 98]
MAX_SEARCHABLE_PERIOD = 13.0
SEED = 20261003


@dataclass(frozen=True)
class Target:
    tic: int
    sector: int
    kind: str
    tmag: float | None = None
    period: float | None = None
    epoch_btjd: float | None = None
    duration_days: float | None = None
    depth_ppm: float | None = None
    toi: float | None = None


def _latest_qlp_sector(sectors: list[int]) -> int | None:
    in_window = [s for s in sectors if s in QLP_SECTORS]
    return max(in_window) if in_window else None


def _planet_target(row: pd.Series) -> Target | None:
    sector = _latest_qlp_sector(row["sector_list"])
    period = row["Period (days)"]
    if sector is None or not (0.3 < period <= MAX_SEARCHABLE_PERIOD):
        return None
    return Target(
        tic=int(row["TIC ID"]),
        sector=sector,
        kind="planet",
        tmag=float(row["TESS Mag"]),
        period=float(period),
        epoch_btjd=float(row["Epoch (BJD)"]) - 2457000.0,
        duration_days=float(row["Duration (hours)"]) / 24.0,
        depth_ppm=float(row["Depth (ppm)"]),
        toi=float(row["TOI"]),
    )


def planet_targets(tois: pd.DataFrame, holdout: bool) -> list[Target]:
    planet_like = tois[tois["TFOPWG Disposition"].isin(catalog.PLANET_DISPOSITIONS)]
    after_cutoff = planet_like["alerted"] >= catalog.HOLDOUT_CUTOFF
    selected = planet_like[after_cutoff] if holdout else planet_like[~after_cutoff]
    if holdout:
        selected = selected[selected["TFOPWG Disposition"] != "KP"]
    targets = [_planet_target(row) for _, row in selected.iterrows()]
    return [t for t in targets if t is not None]


def _target_list(sector: int) -> pd.DataFrame:
    path = CATALOG_DIR / f"qlp_targets_s{sector:04d}.csv"
    if not path.exists():
        url = f"{lightcurves.BUCKET}/mast/hlsp/qlp/target_lists/s{sector:04d}.csv"
        path.write_bytes(httpx.get(url, timeout=300).content)
    return pd.read_csv(path)


def control_targets(count: int, known_tics: set[int], rng: random.Random) -> list[Target]:
    pool: list[Target] = []
    for sector in CONTROL_SECTORS:
        listing = _target_list(sector)
        tic_column = next(c for c in listing.columns if "tic" in c.lower())
        mag_column = next((c for c in listing.columns if "mag" in c.lower()), None)
        for _, row in listing.iterrows():
            tic = int(row[tic_column])
            if tic not in known_tics:
                tmag = float(row[mag_column]) if mag_column else None
                pool.append(Target(tic=tic, sector=sector, kind="control", tmag=tmag))
    return rng.sample(pool, count)


def _write(targets: list[Target], path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps([asdict(t) for t in targets], indent=1))


def read_split(name: str) -> list[Target]:
    directory = HOLDOUT_DIR if name.startswith("holdout") else SPLITS_DIR
    return [Target(**entry) for entry in json.loads((directory / f"{name}.json").read_text())]


def _keep_downloaded(targets: list[Target]) -> list[Target]:
    available = lightcurves.download_many([(t.tic, t.sector) for t in targets])
    return [t for t in targets if available[(t.tic, t.sector)]]


def build(dev_controls: int = 400, holdout_controls: int = 400, discovery: int = 1500) -> dict[str, int]:
    rng = random.Random(SEED)
    tois = catalog.load_tois()
    controls = control_targets(dev_controls + holdout_controls + discovery, catalog.known_signal_tics(), rng)
    splits = {
        "dev_planets": planet_targets(tois, holdout=False),
        "dev_controls": controls[:dev_controls],
        "holdout_planets": planet_targets(tois, holdout=True),
        "holdout_controls": controls[dev_controls : dev_controls + holdout_controls],
        "discovery": controls[dev_controls + holdout_controls :],
    }
    sizes = {}
    for name, targets in splits.items():
        kept = _keep_downloaded(targets)
        directory = HOLDOUT_DIR if name.startswith("holdout") else SPLITS_DIR
        _write(kept, directory / f"{name}.json")
        sizes[name] = len(kept)
    return sizes
