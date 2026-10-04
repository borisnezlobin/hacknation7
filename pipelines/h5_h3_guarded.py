"""H5 = H3 made crash-proof (H3 = H1 + H2). Detection and scoring are unchanged from H3; every stage is guarded
(finite inputs, minimum point counts, finite BLS power) and any remaining exception falls back to the H1 champion
search (pipelines/h1_robust_snr.py), itself guarded so the pipeline never raises.

Original H3 docstring follows.

H1 (unchanged from pipelines/h1_robust_snr.py): the global SDE score is replaced by a per-signal robust depth
SNR times an event-consistency factor (fewer than 3 events, or one dominant event, are penalised).

H2 (detection changes): a Tukey-biweight sliding-window detrend (0.5 d window, about 3x the longest transit)
in place of the 1-day running median; upward sigma-clipping of the flattened flux; 0.3 d masked at every gap
edge and at the sector start/end; a wider, denser duration grid (0.03-0.22 d, 6 log-spaced steps).

A pipeline module must define search(time, flux) -> list of signals, where each
signal is a dict with period (days), t0 (BTJD), duration (days), depth
(fractional) and score (higher means more confident). The harness keeps the five
highest-scoring signals per star.
"""

import numpy as np
from astropy.timeseries import BoxLeastSquares

# --- H2 detection settings (values taken from the hypothesis text, not tuned) ---
DETREND_WINDOW_DAYS = 0.5
KNOT_STEP_CADENCES = 10  # trend evaluated every 10 cadences (~33 min), then interpolated
BIWEIGHT_C = 5.0
BIWEIGHT_ITERS = 5
UPPER_CLIP_SIGMA = 3.0
GAP_DAYS = 0.25  # a jump in time longer than this counts as a gap
EDGE_MASK_DAYS = 0.3
DURATIONS_DAYS = list(np.geomspace(0.03, 0.22, 6))
MIN_PERIOD_DAYS = 0.5
MAX_PERIOD_DAYS = 14.0
SIGNALS_PER_STAR = 3
# Robustness guard (not a tuned constant): stop the iterative search when masking earlier signals has left too
# few points for BLS. With 0.22 d durations at P~0.5 d, a 1.5x transit mask removes ~60% of points per pass, so a
# star dominated by short-period variability can be emptied before the third search (BLS then raises on max()).
MIN_POINTS_FOR_SEARCH = 100


def _biweight_location(x):
    if len(x) == 0:
        return np.nan
    loc = np.median(x)
    for _ in range(BIWEIGHT_ITERS):
        mad = np.median(np.abs(x - loc))
        if mad <= 0:
            break
        u = (x - loc) / (BIWEIGHT_C * mad)
        w = (1 - u * u) ** 2
        w[np.abs(u) >= 1] = 0.0
        if w.sum() <= 0:
            break
        loc = np.sum(w * x) / np.sum(w)
    return loc


def detrend(time, flux, window=DETREND_WINDOW_DAYS):
    """Sliding Tukey-biweight location at knots, linearly interpolated. Windows do not cross gaps."""
    segment = np.concatenate([[0], np.cumsum(np.diff(time) > GAP_DAYS)])
    trend = np.empty_like(flux)
    for s in np.unique(segment):
        idx = np.flatnonzero(segment == s)
        t, f = time[idx], flux[idx]
        knots = t[::KNOT_STEP_CADENCES]
        if knots[-1] != t[-1]:
            knots = np.append(knots, t[-1])
        lo = np.searchsorted(t, knots - window / 2)
        hi = np.searchsorted(t, knots + window / 2)
        values = np.array([_biweight_location(f[a:b]) for a, b in zip(lo, hi)])
        ok = np.isfinite(values) & (values != 0)
        if not ok.any():
            trend[idx] = np.nan
            continue
        trend[idx] = np.interp(t, knots[ok], values[ok])
    return flux / trend


def edge_mask(time):
    """True for points to keep: drop EDGE_MASK_DAYS after every segment start and before every segment end."""
    breaks = np.flatnonzero(np.diff(time) > GAP_DAYS)
    starts = np.concatenate([[time[0]], time[breaks + 1]])
    ends = np.concatenate([time[breaks], [time[-1]]])
    keep = np.ones(len(time), bool)
    for a, b in zip(starts, ends):
        keep &= ~((time >= a) & (time < a + EDGE_MASK_DAYS))
        keep &= ~((time > b - EDGE_MASK_DAYS) & (time <= b))
    return keep


def upper_clip(flux):
    if len(flux) == 0:
        return np.zeros(0, bool)
    med = np.median(flux)
    sigma = 1.4826 * np.median(np.abs(flux - med))
    if not np.isfinite(sigma) or sigma <= 0:
        return np.ones(len(flux), bool)
    return flux < med + UPPER_CLIP_SIGMA * sigma


# --- H1 scoring (unchanged) ---
MIN_EVENTS = 3  # signals with fewer transit events with data are penalised


def robust_snr_score(time, flux, period, t0, duration):
    """Per-signal robust depth SNR (depth / MAD-sigma * sqrt(n_in)) times an event-consistency factor."""
    phase = (time - t0 + 0.5 * period) % period - 0.5 * period
    in_transit = np.abs(phase) < 0.5 * duration
    n_in = int(in_transit.sum())
    if n_in < 2 or n_in > len(time) - 10:
        return 0.0
    out = flux[~in_transit]
    baseline_level = np.median(out)
    sigma = 1.4826 * np.median(np.abs(out - baseline_level))
    if not np.isfinite(sigma) or sigma <= 0:
        return 0.0
    dip = baseline_level - flux[in_transit]
    total_snr = dip.mean() / sigma * np.sqrt(n_in)
    if total_snr <= 0:
        return 0.0
    epochs = np.round((time[in_transit] - t0) / period).astype(int)
    event_snrs = []
    for e in np.unique(epochs):
        d = dip[epochs == e]
        event_snrs.append(d.mean() / sigma * np.sqrt(len(d)))
    n_events = len(event_snrs)
    count_factor = min(1.0, n_events / MIN_EVENTS)
    dominance = max(event_snrs) / total_snr  # 1/sqrt(N) for N equal events, ~1 when one event carries the signal
    dominance_factor = min(1.0, (1.0 / np.sqrt(MIN_EVENTS)) / max(dominance, 1e-9))
    return float(total_snr * count_factor * dominance_factor)


def _h3_search(time, flux):
    order = np.argsort(time)
    time, flux = np.asarray(time, float)[order], np.asarray(flux, float)[order]
    finite = np.isfinite(time) & np.isfinite(flux)
    time, flux = time[finite], flux[finite]
    if len(time) < MIN_POINTS_FOR_SEARCH:
        return []
    flattened = detrend(time, flux)
    finite = np.isfinite(flattened)
    if finite.sum() < MIN_POINTS_FOR_SEARCH:
        raise ValueError("detrend left too few finite points")
    # Guard: skip edge masking / clipping when they would leave too few points for BLS.
    good = finite.copy()
    masked = good & edge_mask(time)
    if masked.sum() >= MIN_POINTS_FOR_SEARCH:
        good = masked
    clipped = good.copy()
    clipped[good] = upper_clip(flattened[good])
    if clipped.sum() >= MIN_POINTS_FOR_SEARCH:
        good = clipped
    time, flattened = time[good], flattened[good]
    keep = np.ones(len(time), bool)
    signals = []
    for _ in range(SIGNALS_PER_STAR):
        if keep.sum() < MIN_POINTS_FOR_SEARCH:
            break
        model = BoxLeastSquares(time[keep], flattened[keep])
        try:
            result = model.autopower(
                DURATIONS_DAYS, minimum_period=MIN_PERIOD_DAYS, maximum_period=MAX_PERIOD_DAYS, frequency_factor=1.0
            )
        except ValueError:
            break
        power = np.asarray(result.power)
        if power.size == 0 or not np.any(np.isfinite(power)):
            break
        best = int(np.nanargmax(power))
        if not all(np.isfinite(v) for v in (result.period[best], result.transit_time[best], result.duration[best])):
            break
        score = robust_snr_score(
            time[keep], flattened[keep], result.period[best], result.transit_time[best], result.duration[best]
        )
        signals.append({
            "period": float(result.period[best]),
            "t0": float(result.transit_time[best]),
            "duration": float(result.duration[best]),
            "depth": float(result.depth[best]),
            "score": score,
        })
        keep &= ~model.transit_mask(time, result.period[best], 1.5 * result.duration[best], result.transit_time[best])
    return signals


# --- Fallback: H1 champion search (pipelines/h1_robust_snr.py), loaded from file so it stays identical ---
_H1_SEARCH = None


def _h1_search(time, flux):
    global _H1_SEARCH
    if _H1_SEARCH is None:
        import importlib.util
        from pathlib import Path

        path = Path(__file__).with_name("h1_robust_snr.py")
        spec = importlib.util.spec_from_file_location("h1_robust_snr_fallback", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _H1_SEARCH = module.search
    time, flux = np.asarray(time, float), np.asarray(flux, float)
    finite = np.isfinite(time) & np.isfinite(flux)
    return _H1_SEARCH(time[finite], flux[finite])


def _clean(signals):
    out = []
    for s in signals or []:
        vals = {k: float(s[k]) for k in ("period", "t0", "duration", "depth", "score")}
        if all(np.isfinite(v) for v in vals.values()):
            out.append(vals)
    return out


def search(time, flux):
    try:
        return _clean(_h3_search(time, flux))
    except Exception:  # noqa: BLE001 - guarded stage failed; fall back to the H1 champion search
        pass
    try:
        return _clean(_h1_search(time, flux))
    except Exception:  # noqa: BLE001
        return []
