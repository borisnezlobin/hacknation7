import type { Lightcurve } from "./lab-types";

export const PLOT_WIDTH = 200;
export const PLOT_HEIGHT = 100;
const PADDING = 8;

function fluxRange(flux: (number | null)[]): [number, number] | null {
  const values = flux.filter((value): value is number => value !== null && Number.isFinite(value));
  if (values.length === 0) return null;
  const low = Math.min(...values);
  const high = Math.max(...values);
  return high > low ? [low, high] : [low - 1e-4, high + 1e-4];
}

export function lightcurvePath({ hours, flux }: Lightcurve): string {
  const range = fluxRange(flux);
  if (!range || hours.length < 2) return "";
  const [low, high] = range;
  const first = hours[0];
  const span = hours[hours.length - 1] - first || 1;
  const x = (hour: number) => ((hour - first) / span) * PLOT_WIDTH;
  const y = (value: number) => PADDING + ((high - value) / (high - low)) * (PLOT_HEIGHT - 2 * PADDING);
  let path = "";
  let penDown = false;
  hours.forEach((hour, i) => {
    const value = flux[i];
    if (value === null || !Number.isFinite(value)) {
      penDown = false;
      return;
    }
    path += `${penDown ? "L" : "M"}${x(hour).toFixed(1)} ${y(value).toFixed(1)}`;
    penDown = true;
  });
  return path;
}
