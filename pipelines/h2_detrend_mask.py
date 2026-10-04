"""H2: robust biweight detrend + gap-edge masking + wider duration grid, then iterative BLS.

Copied from baseline.py. Changes (hypothesis H2 only; scoring is still the global SDE):
  * Detrend: Tukey biweight location in a 0.5 d sliding window (about 3x the longest transit),
    evaluated on knots and interpolated. Iterative clipping: points >3 sigma below or above the
    trend are excluded from the trend estimate. Upward outliers (>3 sigma) are then removed from
    the data. Downward points stay in, so transits are preserved.
  * Systematics mask: drop 0.3 d at every gap edge (gaps > 0.5 d) and at sector start/end.
  * Duration grid: 6 log-spaced steps from 0.03 to 0.22 d (was 0.04, 0.08, 0.16). The period grid
    keeps the baseline spacing (set by 0.04 d) so runtime stays near 12 s/star.
"""

import numpy as np
from astropy.timeseries import BoxLeastSquares

DETREND_WINDOW_DAYS = 0.5
KNOT_STEP = 10
BIWEIGHT_C = 5.0
CLIP_SIGMA = 3.0
CLIP_ITERATIONS = 2
GAP_DAYS = 0.5
EDGE_MASK_DAYS = 0.3
DURATIONS_DAYS = list(np.geomspace(0.03, 0.22, 6))
GRID_DURATION_DAYS = 0.04  # period-grid spacing kept as in baseline (runtime budget ~12 s/star)
MIN_PERIOD_DAYS = 0.5
MAX_PERIOD_DAYS = 14.0
SIGNALS_PER_STAR = 3


def _biweight_location(values, iterations=5):
    loc = np.median(values)
    for _ in range(iterations):
        mad = np.median(np.abs(values - loc))
        if mad == 0:
            break
        u = (values - loc) / (BIWEIGHT_C * mad)
        w = (1 - u**2) ** 2
        w[np.abs(u) >= 1] = 0
        total = w.sum()
        if total == 0:
            break
        loc = (w * values).sum() / total
    return loc


def _trend(time, flux, use, window):
    knots = time[::KNOT_STEP]
    t_use, f_use = time[use], flux[use]
    lo = np.searchsorted(t_use, knots - window / 2)
    hi = np.searchsorted(t_use, knots + window / 2)
    values = np.full(len(knots), np.nan)
    for i, (a, b) in enumerate(zip(lo, hi)):
        if b - a >= 5:
            values[i] = _biweight_location(f_use[a:b])
    ok = np.isfinite(values)
    if not ok.any():
        return np.full(len(time), np.median(flux))
    return np.interp(time, knots[ok], values[ok])


def detrend(time, flux, window=DETREND_WINDOW_DAYS):
    use = np.ones(len(time), bool)
    for _ in range(CLIP_ITERATIONS + 1):
        trend = _trend(time, flux, use, window)
        resid = flux / trend - 1
        sigma = 1.4826 * np.median(np.abs(resid - np.median(resid)))
        new_use = np.abs(resid) < CLIP_SIGMA * sigma
        if np.array_equal(new_use, use):
            break
        use = new_use
    flattened = flux / trend
    keep = resid < CLIP_SIGMA * sigma  # remove upward outliers only
    return flattened, keep


def edge_mask(time, gap=GAP_DAYS, edge=EDGE_MASK_DAYS):
    starts = [time[0]]
    ends = []
    jumps = np.where(np.diff(time) > gap)[0]
    for j in jumps:
        ends.append(time[j])
        starts.append(time[j + 1])
    ends.append(time[-1])
    bad = np.zeros(len(time), bool)
    for s in starts:
        bad |= (time >= s) & (time < s + edge)
    for e in ends:
        bad |= (time <= e) & (time > e - edge)
    return ~bad


def signal_detection_efficiency(power):
    return (power.max() - power.mean()) / power.std()


def search(time, flux):
    order = np.argsort(time)
    time, flux = time[order], flux[order]
    flattened, good = detrend(time, flux)
    good &= edge_mask(time)
    time, flattened = time[good], flattened[good]
    keep = np.ones(len(time), bool)
    signals = []
    for _ in range(SIGNALS_PER_STAR):
        model = BoxLeastSquares(time[keep], flattened[keep])
        periods = model.autoperiod(
            GRID_DURATION_DAYS, minimum_period=MIN_PERIOD_DAYS, maximum_period=MAX_PERIOD_DAYS, frequency_factor=1.0
        )
        result = model.power(periods, DURATIONS_DAYS)
        best = int(np.argmax(result.power))
        signals.append({
            "period": result.period[best],
            "t0": result.transit_time[best],
            "duration": result.duration[best],
            "depth": result.depth[best],
            "score": signal_detection_efficiency(result.power),
        })
        keep &= ~model.transit_mask(time, result.period[best], 1.5 * result.duration[best], result.transit_time[best])
    return signals
