import numpy as np

from planetlab import lightcurves


def _phase(time: np.ndarray, period: float, t0: float) -> np.ndarray:
    return (time - t0 + 0.5 * period) % period - 0.5 * period


def _depth_and_error(flux: np.ndarray, mask: np.ndarray, baseline: float) -> tuple[float, float]:
    if mask.sum() < 3:
        return float("nan"), float("inf")
    in_transit = flux[mask]
    return float(baseline - in_transit.mean()), float(in_transit.std() / np.sqrt(mask.sum()))


def odd_even_test(time, flux, period, t0, duration, baseline) -> dict:
    epoch_number = np.round((time - t0) / period).astype(int)
    in_transit = np.abs(_phase(time, period, t0)) < 0.4 * duration
    odd_depth, odd_err = _depth_and_error(flux, in_transit & (epoch_number % 2 == 1), baseline)
    even_depth, even_err = _depth_and_error(flux, in_transit & (epoch_number % 2 == 0), baseline)
    sigma = abs(odd_depth - even_depth) / np.hypot(odd_err, even_err)
    return {"odd_depth": odd_depth, "even_depth": even_depth, "difference_sigma": float(sigma)}


def secondary_eclipse_test(time, flux, period, t0, duration, baseline) -> dict:
    secondary = np.abs(_phase(time, period, t0 + 0.5 * period)) < 0.4 * duration
    depth, error = _depth_and_error(flux, secondary, baseline)
    return {"secondary_depth": depth, "secondary_sigma": float(depth / error) if error > 0 else 0.0}


def centroid_shift_test(curve: lightcurves.LightCurve, period, t0, duration) -> dict:
    in_transit = np.abs(_phase(curve.time, period, t0)) < 0.4 * duration
    out_of_transit = np.abs(_phase(curve.time, period, t0)) > 1.5 * duration
    shifts = {}
    for axis, values in (("x", curve.centroid_x), ("y", curve.centroid_y)):
        finite = np.isfinite(values)
        inside, outside = values[in_transit & finite], values[out_of_transit & finite]
        if len(inside) < 3 or len(outside) < 10:
            shifts[f"{axis}_sigma"] = 0.0
            continue
        error = np.hypot(inside.std() / np.sqrt(len(inside)), outside.std() / np.sqrt(len(outside)))
        shifts[f"{axis}_sigma"] = float(abs(inside.mean() - outside.mean()) / error) if error > 0 else 0.0
    shifts["max_sigma"] = max(shifts["x_sigma"], shifts["y_sigma"])
    return shifts


def dip_width_fraction(time, flux, period, t0) -> float:
    """Width of the folded dip at half depth, as a fraction of the orbit. Planet transits occupy a few percent."""
    bin_width = period / 50
    phase = (time - t0 + 0.5 * period) % period - 0.5 * period
    index = np.clip(((phase + 0.5 * period) / bin_width).astype(int), 0, 49)
    baseline = np.median(flux[np.abs(phase) > 0.3 * period])
    profile = np.array([np.median(flux[index == i]) - baseline if np.any(index == i) else 0.0 for i in range(50)])
    below_half = np.where(profile <= profile.min() / 2)[0]
    return float((below_half.max() - below_half.min() + 1) / 50) if len(below_half) else 0.0


def transit_count(time, period, t0, duration) -> int:
    in_transit = np.abs(_phase(time, period, t0)) < 0.5 * duration
    return len(np.unique(np.round((time[in_transit] - t0) / period)))


def vet(tic: int, sector: int, period: float, t0: float, duration: float) -> dict:
    curve = lightcurves.load(tic, sector)
    out_of_transit = np.abs(_phase(curve.time, period, t0)) > 1.5 * duration
    baseline = float(np.median(curve.flux[out_of_transit]))
    report = {
        "tic": tic,
        "sector": sector,
        "transits_observed": transit_count(curve.time, period, t0, duration),
        "odd_even": odd_even_test(curve.time, curve.flux, period, t0, duration, baseline),
        "secondary": secondary_eclipse_test(curve.time, curve.flux, period, t0, duration, baseline),
        "centroid": centroid_shift_test(curve, period, t0, duration),
        "dip_width_fraction": dip_width_fraction(curve.time, curve.flux, period, t0),
    }
    report["flags"] = vetting_flags(report)
    report["passes"] = not report["flags"]
    return report


def vetting_flags(report: dict) -> list[str]:
    checks = [
        (report["transits_observed"] < 2, "fewer than two transits observed"),
        (report["odd_even"]["difference_sigma"] > 3, "odd and even depths differ (likely eclipsing binary at twice the period)"),
        (report["secondary"]["secondary_sigma"] > 3, "secondary eclipse detected (likely eclipsing binary)"),
        (report["centroid"]["max_sigma"] > 3, "centroid shifts in transit (signal may come from a neighbouring star)"),
        (report["dip_width_fraction"] > 0.15, "dip lasts too much of the orbit for a transit (likely a contact binary or variable star)"),
        (report["secondary"]["secondary_sigma"] < -3, "star brightens at phase 0.5 (variability, not a transit)"),
    ]
    return [message for failed, message in checks if failed]
