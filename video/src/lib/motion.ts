import { Easing, interpolate } from "remotion";

export const easeOutSoft = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

export function ramp(frame: number, start: number, end: number, easing = easeOutSoft): number {
  return interpolate(frame, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
}

export function pulse(frame: number, start: number, attack: number, release: number): number {
  return ramp(frame, start, start + attack) * (1 - ramp(frame, start + attack, start + attack + release, easeIn));
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}
