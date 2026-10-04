import zlib
from dataclasses import dataclass

import numpy as np

INJECTION_SEED = 7


@dataclass(frozen=True)
class InjectedTransit:
    period: float
    epoch_btjd: float
    duration_days: float
    depth_ppm: float


def trapezoid_model(time: np.ndarray, transit: InjectedTransit, ingress_fraction: float = 0.15) -> np.ndarray:
    phase = (time - transit.epoch_btjd + 0.5 * transit.period) % transit.period - 0.5 * transit.period
    half = 0.5 * transit.duration_days
    ingress = ingress_fraction * transit.duration_days
    distance_from_edge = half - np.abs(phase)
    shape = np.clip(distance_from_edge / ingress, 0.0, 1.0)
    return 1.0 - transit.depth_ppm * 1e-6 * shape


def plan_injection(tic: int, time: np.ndarray) -> InjectedTransit:
    rng = np.random.default_rng(zlib.crc32(f"{tic}:{INJECTION_SEED}".encode()))
    period = float(np.exp(rng.uniform(np.log(0.6), np.log(13.0))))
    sun_like_duration = 0.54 * (period / 365.25) ** (1 / 3)
    duration = float(sun_like_duration * rng.uniform(0.7, 1.3))
    depth = float(np.exp(rng.uniform(np.log(300.0), np.log(10000.0))))
    epoch = float(time.min() + rng.uniform(0.0, period))
    return InjectedTransit(period, epoch, duration, depth)


def inject(time: np.ndarray, flux: np.ndarray, transit: InjectedTransit) -> np.ndarray:
    return flux * trapezoid_model(time, transit)
