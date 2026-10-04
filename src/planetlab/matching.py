from dataclasses import dataclass

PERIOD_TOLERANCE = 0.01
HARMONICS = (1.0, 2.0, 0.5)


@dataclass(frozen=True)
class Truth:
    period: float
    epoch_btjd: float
    duration_days: float
    depth_ppm: float


def _period_matches(found: float, true: float) -> bool:
    return any(abs(found * h - true) / true < PERIOD_TOLERANCE for h in HARMONICS)


def _epoch_matches(signal: dict, truth: Truth) -> bool:
    offset = (signal["t0"] - truth.epoch_btjd) % truth.period
    distance = min(offset, truth.period - offset)
    tolerance = max(0.5 * (truth.duration_days + signal.get("duration", 0.0)), 0.1)
    half_period_distance = abs(distance - 0.5 * truth.period)
    return distance < tolerance or (signal["period"] < 0.75 * truth.period and half_period_distance < tolerance)


def signal_matches(signal: dict, truth: Truth) -> bool:
    return _period_matches(signal["period"], truth.period) and _epoch_matches(signal, truth)
