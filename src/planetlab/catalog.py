import io
from datetime import date

import httpx
import pandas as pd

from planetlab.paths import CATALOG_DIR

TOI_URL = "https://exofop.ipac.caltech.edu/tess/download_toi.php?sort=toi&output=csv"
CTOI_URL = "https://exofop.ipac.caltech.edu/tess/download_ctoi.php?sort=ctoi&output=csv"

HOLDOUT_CUTOFF = pd.Timestamp("2026-07-01")
"""TOIs alerted on or after this date are hidden from proposer agents and used only for blind scoring."""

PLANET_DISPOSITIONS = {"PC", "CP", "KP"}


def _download_csv(url: str, name: str) -> pd.DataFrame:
    path = CATALOG_DIR / f"{name}.csv"
    if not path.exists():
        CATALOG_DIR.mkdir(parents=True, exist_ok=True)
        response = httpx.get(url, timeout=120, follow_redirects=True)
        response.raise_for_status()
        path.write_text(response.text)
        (CATALOG_DIR / f"{name}.fetched").write_text(date.today().isoformat())
    return pd.read_csv(io.StringIO(path.read_text()))


def load_tois() -> pd.DataFrame:
    tois = _download_csv(TOI_URL, "toi")
    tois["alerted"] = pd.to_datetime(tois["Date TOI Alerted (UTC)"], errors="coerce")
    tois["sector_list"] = tois["Sectors"].astype(str).map(parse_sectors)
    return tois


def load_ctois() -> pd.DataFrame:
    return _download_csv(CTOI_URL, "ctoi")


def parse_sectors(raw: str) -> list[int]:
    return [int(part) for part in raw.split(",") if part.strip().isdigit()]


def known_signal_tics() -> set[int]:
    """Every TIC with a catalogued TOI or community TOI, regardless of disposition."""
    return set(load_tois()["TIC ID"].astype(int)) | set(load_ctois()["TIC ID"].astype(int))
