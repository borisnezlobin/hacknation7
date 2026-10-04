"""H6: copy of H1 (h1_robust_snr) with one change: the SNR noise term is red-noise aware. Instead of
per-point MAD sigma * sqrt(n_in), the noise is the robust std (MAD) of the detrended out-of-transit flux binned
to the trial duration (sigma_dur), and total_snr = depth / sigma_dur * sqrt(n_events). Per-event SNR is
event depth / sigma_dur, so the event-consistency factors keep their H1 meaning. Detection, grids, detrending
and masking are unchanged from H1.

A pipeline module must define search(time, flux) -> list of signals, where each
signal is a dict with period (days), t0 (BTJD), duration (days), depth
(fractional) and score (higher means more confident). The harness keeps the five
highest-scoring signals per star.
"""

import numpy as np
from astropy.timeseries import BoxLeastSquares

DETREND_WINDOW_DAYS = 1.0
DURATIONS_DAYS = [0.04, 0.08, 0.16]
MIN_PERIOD_DAYS = 0.5
MAX_PERIOD_DAYS = 14.0
SIGNALS_PER_STAR = 3


def detrend(time, flux, window=DETREND_WINDOW_DAYS):
    knots = time[::30]
    trend = np.array([np.median(flux[np.abs(time - k) < window / 2]) for k in knots])
    return flux / np.interp(time, knots, trend)


def signal_detection_efficiency(power):
    return (power.max() - power.mean()) / power.std()


MIN_EVENTS = 3  # signals with fewer transit events with data are penalised
MIN_BINS = 10  # need at least this many filled duration-bins to estimate correlated noise


def binned_sigma(time, flux, duration, level):
    """Robust std (MAD) of flux averaged in consecutive bins of width `duration` (correlated-noise sigma).

    Bins with fewer than half the median bin occupancy (gap edges) are dropped. Returns nan if too few bins.
    """
    if len(time) < 2:
        return np.nan
    idx = np.floor((time - time[0]) / duration).astype(int)
    counts = np.bincount(idx)
    sums = np.bincount(idx, weights=flux - level)
    filled = counts > 0
    if not filled.any():
        return np.nan
    full = counts >= 0.5 * np.median(counts[filled])
    if full.sum() < MIN_BINS:
        return np.nan
    means = sums[full] / counts[full]
    return 1.4826 * np.median(np.abs(means - np.median(means)))


def robust_snr_score(time, flux, period, t0, duration):
    """Per-signal depth SNR against duration-binned (correlated) noise, times an event-consistency factor."""
    phase = (time - t0 + 0.5 * period) % period - 0.5 * period
    in_transit = np.abs(phase) < 0.5 * duration
    n_in = int(in_transit.sum())
    if n_in < 2 or n_in > len(time) - 10:
        return 0.0
    out = flux[~in_transit]
    baseline_level = np.median(out)
    sigma_dur = binned_sigma(time[~in_transit], out, duration, baseline_level)
    if not np.isfinite(sigma_dur) or sigma_dur <= 0:
        return 0.0
    dip = baseline_level - flux[in_transit]
    epochs = np.round((time[in_transit] - t0) / period).astype(int)
    event_snrs = []
    for e in np.unique(epochs):
        event_snrs.append(dip[epochs == e].mean() / sigma_dur)
    n_events = len(event_snrs)
    total_snr = dip.mean() / sigma_dur * np.sqrt(n_events)
    if total_snr <= 0:
        return 0.0
    count_factor = min(1.0, n_events / MIN_EVENTS)
    dominance = max(event_snrs) / total_snr  # 1/sqrt(N) for N equal events, ~1 when one event carries the signal
    dominance_factor = min(1.0, (1.0 / np.sqrt(MIN_EVENTS)) / max(dominance, 1e-9))
    return float(total_snr * count_factor * dominance_factor)


def search(time, flux):
    flattened = detrend(time, flux)
    keep = np.ones(len(time), bool)
    signals = []
    for _ in range(SIGNALS_PER_STAR):
        model = BoxLeastSquares(time[keep], flattened[keep])
        result = model.autopower(
            DURATIONS_DAYS, minimum_period=MIN_PERIOD_DAYS, maximum_period=MAX_PERIOD_DAYS, frequency_factor=1.0
        )
        best = int(np.argmax(result.power))
        score = robust_snr_score(
            time[keep], flattened[keep], result.period[best], result.transit_time[best], result.duration[best]
        )
        signals.append({
            "period": result.period[best],
            "t0": result.transit_time[best],
            "duration": result.duration[best],
            "depth": result.depth[best],
            "score": score,
        })
        keep &= ~model.transit_mask(time, result.period[best], 1.5 * result.duration[best], result.transit_time[best])
    return signals
