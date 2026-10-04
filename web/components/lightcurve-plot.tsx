import type { Lightcurve } from "@/lib/lab-types";
import { PLOT_HEIGHT, PLOT_WIDTH, lightcurvePath } from "@/lib/lightcurve-path";

const TRANSIT_BAND_WIDTH = PLOT_WIDTH / 6;

export function LightcurvePlot({ lightcurve, highlighted, label }: { lightcurve: Lightcurve; highlighted: boolean; label: string }) {
  return (
    <svg viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={label}>
      <rect
        x={(PLOT_WIDTH - TRANSIT_BAND_WIDTH) / 2}
        width={TRANSIT_BAND_WIDTH}
        height={PLOT_HEIGHT}
        fill={highlighted ? "var(--accent-soft)" : "transparent"}
      />
      <path
        d={lightcurvePath(lightcurve)}
        fill="none"
        stroke={highlighted ? "var(--accent)" : "var(--ink-faint)"}
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
