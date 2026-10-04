export type FoldedCurve = { hours: number[]; flux: number[]; depthPpm: number };

const WIDTH = 240;
const HEIGHT = 120;
const PAD = 8;

function scaleFor(curve: FoldedCurve) {
  const hourSpan = Math.max(...curve.hours.map(Math.abs));
  const depth = curve.depthPpm / 1e6;
  const low = 1 - depth * 1.6;
  const high = 1 + depth * 0.7;
  return {
    x: (hour: number) => PAD + ((hour + hourSpan) / (2 * hourSpan)) * (WIDTH - PAD * 2),
    y: (flux: number) => PAD + ((high - Math.min(high, Math.max(low, flux))) / (high - low)) * (HEIGHT - PAD * 2),
    inTransit: (flux: number) => flux < 1 - depth * 0.45,
  };
}

export function LightCurvePlot({ curve, label, className = "" }: { curve: FoldedCurve; label: string; className?: string }) {
  const scale = scaleFor(curve);
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={className} role="img" aria-label={label}>
      <line x1={PAD} x2={WIDTH - PAD} y1={scale.y(1)} y2={scale.y(1)} stroke="var(--ink-faint)" strokeDasharray="2 4" strokeWidth={1} />
      {curve.hours.map((hour, index) => {
        const flux = curve.flux[index];
        const hot = scale.inTransit(flux);
        return <circle key={index} cx={scale.x(hour)} cy={scale.y(flux)} r={hot ? 2.6 : 1.9} fill={hot ? "var(--gain)" : "var(--ink)"} opacity={hot ? 0.95 : 0.55} />;
      })}
    </svg>
  );
}
