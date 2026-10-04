import io
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path

import httpx
import numpy as np
from astropy.io import fits

from planetlab.paths import LIGHTCURVE_DIR

BUCKET = "https://stpubdata.s3.amazonaws.com"


@dataclass(frozen=True)
class LightCurve:
    tic: int
    sector: int
    time: np.ndarray
    flux: np.ndarray
    centroid_x: np.ndarray
    centroid_y: np.ndarray


def _tic_path(tic: int) -> tuple[str, str]:
    padded = f"{tic:016d}"
    return padded, "/".join(padded[i : i + 4] for i in range(0, 16, 4))


def qlp_url(tic: int, sector: int) -> str:
    padded, nested = _tic_path(tic)
    return f"{BUCKET}/mast/hlsp/qlp/s{sector:04d}/{nested}/hlsp_qlp_tess_ffi_s{sector:04d}-{padded}_tess_v01_llc.fits"


def cache_path(tic: int, sector: int) -> Path:
    return LIGHTCURVE_DIR / f"s{sector:04d}" / f"{tic}.npz"


def _parse_qlp(raw: bytes) -> dict[str, np.ndarray]:
    data = fits.open(io.BytesIO(raw))[1].data
    good = (data["QUALITY"] == 0) & np.isfinite(data["DET_FLUX"]) & np.isfinite(data["TIME"])
    flux = data["DET_FLUX"][good].astype(np.float64)
    return {
        "time": data["TIME"][good].astype(np.float64),
        "flux": flux / np.nanmedian(flux),
        "centroid_x": data["SAP_X"][good].astype(np.float32),
        "centroid_y": data["SAP_Y"][good].astype(np.float32),
    }


def download(tic: int, sector: int, client: httpx.Client) -> bool:
    destination = cache_path(tic, sector)
    if destination.exists():
        return True
    response = client.get(qlp_url(tic, sector))
    if response.status_code != 200:
        return False
    arrays = _parse_qlp(response.content)
    if len(arrays["time"]) < 500:
        return False
    destination.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(destination, **arrays)
    return True


def download_many(targets: list[tuple[int, int]], workers: int = 24) -> dict[tuple[int, int], bool]:
    with httpx.Client(timeout=60) as client, ThreadPoolExecutor(workers) as pool:
        results = pool.map(lambda target: _safe_download(*target, client), targets)
        return dict(zip(targets, results, strict=True))


def _safe_download(tic: int, sector: int, client: httpx.Client) -> bool:
    try:
        return download(tic, sector, client)
    except (httpx.HTTPError, OSError, ValueError, KeyError):
        return False


def load(tic: int, sector: int) -> LightCurve:
    arrays = np.load(cache_path(tic, sector))
    return LightCurve(tic, sector, arrays["time"], arrays["flux"], arrays["centroid_x"], arrays["centroid_y"])
