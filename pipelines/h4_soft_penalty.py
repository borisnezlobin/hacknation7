"""H4: H1 pipeline (running-median detrend + iterative BLS, unchanged detection, grids and masking) with the hard
<3-event count penalty and dominance penalty removed. Score = red-noise-scaled robust depth SNR, multiplied by a
per-event consistency factor:
  * >=2 events: chi2 of per-event depths about their mean (inconsistent depths are downweighted);
  * >=4 events: odd/even depth difference > 3 sigma is downweighted;
  * every event of a 1-2 event signal must look like a transit locally: data on both sides (not a gap edge), local
    out-of-transit scatter not inflated vs the global scatter, and most in-transit points below baseline.
Consistent 1-2 event signals therefore keep their full SNR. Every stage is guarded so no star raises.

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

CHI2_DOF_OK = 3.0  # reduced chi2 of per-event depths tolerated before downweighting
ODD_EVEN_SIGMA = 3.0
LOCAL_NOISE_MAX = 2.0  # local out-of-transit scatter / global scatter tolerated around an event
SIDE_COVERAGE_MIN = 0.3  # fraction of expected cadences required on each side of an event
FRACTION_BELOW_MIN = 0.6  # fraction of in-transit points below baseline for a real dip
MIN_FACTOR = 0.2


def detrend(time, flux, window=DETREND_WINDOW_DAYS):
    knots = time[::30]
    trend = []
    for k in knots:
        sel = flux[np.abs(time - k) < window / 2]
        trend.append(np.median(sel) if len(sel) else np.nan)
    trend = np.array(trend)
    good = np.isfinite(trend) & (trend != 0)
    if good.sum() < 2:
        return flux / np.nanmedian(flux)
    return flux / np.interp(time, knots[good], trend[good])


def red_noise_beta(time, resid, sigma, duration):
    """Ratio of binned scatter at the transit timescale to the white-noise expectation (>=1)."""
    try:
        bins = np.floor((time - time[0]) / duration).astype(int)
        counts = np.bincount(bins)
        sums = np.bincount(bins, weights=resid)
        ok = counts >= 3
        if ok.sum() < 10:
            return 1.0
        means = sums[ok] / counts[ok]
        n_typ = np.median(counts[ok])
        binned = 1.4826 * np.median(np.abs(means - np.median(means)))
        beta = binned / (sigma / np.sqrt(n_typ))
        return float(np.clip(beta, 1.0, 5.0)) if np.isfinite(beta) else 1.0
    except Exception:
        return 1.0


def event_looks_real(time, flux, baseline_level, sigma, t_mid, duration, dt):
    """Local shape/coverage check for one event; returns a factor in [MIN_FACTOR, 1]."""
    factor = 1.0
    half = 0.5 * duration
    expected_side = 1.5 * duration / dt
    left = (time >= t_mid - 2.0 * duration) & (time < t_mid - half)
    right = (time > t_mid + half) & (time <= t_mid + 2.0 * duration)
    for side in (left, right):
        if side.sum() < SIDE_COVERAGE_MIN * expected_side:
            factor *= 0.5  # event sits on a gap edge
    local = (np.abs(time - t_mid) < 3.0 * duration) & (np.abs(time - t_mid) >= half)
    if local.sum() >= 5:
        loc = flux[local]
        local_sigma = 1.4826 * np.median(np.abs(loc - np.median(loc)))
        ratio = local_sigma / sigma
        if np.isfinite(ratio) and ratio > LOCAL_NOISE_MAX:
            factor *= LOCAL_NOISE_MAX / ratio
    inside = np.abs(time - t_mid) < half
    if inside.sum() >= 3:
        frac_below = np.mean(flux[inside] < baseline_level)
        if frac_below < FRACTION_BELOW_MIN:
            factor *= max(frac_below / FRACTION_BELOW_MIN, MIN_FACTOR)
    return max(factor, MIN_FACTOR)


def consistency_snr_score(time, flux, period, t0, duration):
    """Red-noise-scaled depth SNR times a per-event consistency factor (no event-count penalty)."""
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
    beta = red_noise_beta(time[~in_transit], out - baseline_level, sigma, duration)
    sigma_eff = sigma * beta
    total_snr = dip.mean() / sigma_eff * np.sqrt(n_in)
    if not np.isfinite(total_snr) or total_snr <= 0:
        return 0.0

    epochs = np.round((time[in_transit] - t0) / period).astype(int)
    uniq = np.unique(epochs)
    depths, errs = [], []
    for e in uniq:
        d = dip[epochs == e]
        depths.append(d.mean())
        errs.append(sigma_eff / np.sqrt(len(d)))
    depths, errs = np.array(depths), np.array(errs)
    n_events = len(uniq)
    factor = 1.0

    if n_events >= 2:
        w = 1.0 / errs**2
        mean_depth = np.sum(w * depths) / np.sum(w)
        chi2_dof = np.sum(((depths - mean_depth) / errs) ** 2) / (n_events - 1)
        if chi2_dof > CHI2_DOF_OK:
            factor *= np.sqrt(CHI2_DOF_OK / chi2_dof)

    if n_events >= 4:
        odd = (uniq % 2) == 1
        if odd.any() and (~odd).any():
            d_odd = np.sum(depths[odd] / errs[odd] ** 2) / np.sum(1 / errs[odd] ** 2)
            d_even = np.sum(depths[~odd] / errs[~odd] ** 2) / np.sum(1 / errs[~odd] ** 2)
            e_diff = np.sqrt(1 / np.sum(1 / errs[odd] ** 2) + 1 / np.sum(1 / errs[~odd] ** 2))
            if abs(d_odd - d_even) / e_diff > ODD_EVEN_SIGMA:
                factor *= 0.5

    if n_events <= 2:
        dt = np.median(np.diff(time)) if len(time) > 1 else duration / 10
        for e in uniq:
            t_mid = t0 + e * period
            factor *= event_looks_real(time, flux, baseline_level, sigma, t_mid, duration, dt)

    return float(total_snr * max(factor, MIN_FACTOR**2))


def _safe_score(time, flux, period, t0, duration):
    try:
        s = consistency_snr_score(time, flux, period, t0, duration)
        return s if np.isfinite(s) else 0.0
    except Exception:
        return 0.0


def search(time, flux):
    time = np.asarray(time, float)
    flux = np.asarray(flux, float)
    good = np.isfinite(time) & np.isfinite(flux)
    time, flux = time[good], flux[good]
    if len(time) < 50:
        return []
    order = np.argsort(time)
    time, flux = time[order], flux[order]
    try:
        flattened = detrend(time, flux)
    except Exception:
        flattened = flux / np.median(flux)
    ok = np.isfinite(flattened)
    time, flattened = time[ok], flattened[ok]
    keep = np.ones(len(time), bool)
    signals = []
    for _ in range(SIGNALS_PER_STAR):
        if keep.sum() < 50:
            break
        try:
            model = BoxLeastSquares(time[keep], flattened[keep])
            result = model.autopower(
                DURATIONS_DAYS, minimum_period=MIN_PERIOD_DAYS, maximum_period=MAX_PERIOD_DAYS, frequency_factor=1.0
            )
            power = np.where(np.isfinite(result.power), result.power, -np.inf)
            if not np.isfinite(power).any():
                break
            best = int(np.argmax(power))
            period, t0, duration = float(result.period[best]), float(result.transit_time[best]), float(result.duration[best])
            depth = float(result.depth[best])
        except Exception:
            break
        score = _safe_score(time[keep], flattened[keep], period, t0, duration)
        signals.append({"period": period, "t0": t0, "duration": duration, "depth": depth, "score": score})
        try:
            keep &= ~model.transit_mask(time, period, 1.5 * duration, t0)
        except Exception:
            break
    return signals
