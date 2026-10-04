"""H7 (from H1 champion): finer BLS duration grid 0.03-0.16 d, and the robust SNR is evaluated at every grid
duration at the BLS period/t0, keeping the maximum (that duration is reported). Otherwise identical to H1.

H1: baseline detection (running-median detrend + iterative BLS), with the global SDE score replaced by a
per-signal robust depth SNR times an event-consistency factor (fewer than 3 events, or one dominant event,
are penalised). Detection, grids and masking are unchanged from baseline.

A pipeline module must define search(time, flux) -> list of signals, where each
signal is a dict with period (days), t0 (BTJD), duration (days), depth
(fractional) and score (higher means more confident). The harness keeps the five
highest-scoring signals per star.
"""

import numpy as np
from astropy.timeseries import BoxLeastSquares

DETREND_WINDOW_DAYS = 1.0
DURATIONS_DAYS = [0.03, 0.045, 0.06, 0.08, 0.11, 0.16]
# Keep H1's trial-period grid (autopower spacing scales with the shortest duration; H1 used 0.04 d) so that
# only the duration grid changes and the per-star cost stays near +30%.
FREQUENCY_FACTOR = 0.04 / min(DURATIONS_DAYS)
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


def search(time, flux):
    flattened = detrend(time, flux)
    keep = np.ones(len(time), bool)
    signals = []
    for _ in range(SIGNALS_PER_STAR):
        model = BoxLeastSquares(time[keep], flattened[keep])
        result = model.autopower(
            DURATIONS_DAYS, minimum_period=MIN_PERIOD_DAYS, maximum_period=MAX_PERIOD_DAYS, frequency_factor=FREQUENCY_FACTOR
        )
        best = int(np.argmax(result.power))
        score, best_duration = -1.0, result.duration[best]
        for d in DURATIONS_DAYS:
            s = robust_snr_score(time[keep], flattened[keep], result.period[best], result.transit_time[best], d)
            if s > score:
                score, best_duration = s, d
        score = max(score, 0.0)
        signals.append({
            "period": result.period[best],
            "t0": result.transit_time[best],
            "duration": best_duration,
            "depth": result.depth[best],
            "score": score,
        })
        keep &= ~model.transit_mask(time, result.period[best], 1.5 * result.duration[best], result.transit_time[best])
    return signals
