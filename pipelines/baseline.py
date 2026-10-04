"""Baseline transit search: running-median detrend, then iterative box least squares.

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
        signals.append({
            "period": result.period[best],
            "t0": result.transit_time[best],
            "duration": result.duration[best],
            "depth": result.depth[best],
            "score": signal_detection_efficiency(result.power),
        })
        keep &= ~model.transit_mask(time, result.period[best], 1.5 * result.duration[best], result.transit_time[best])
    return signals
