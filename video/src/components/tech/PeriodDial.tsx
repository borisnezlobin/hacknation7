const SWEEP_DEGREES = 240;

export function PeriodDial({ value, min, max, size, locked }: { value: number; min: number; max: number; size: number; locked: number }) {
  const amount = (value - min) / (max - min);
  const angle = -SWEEP_DEGREES / 2 + amount * SWEEP_DEGREES;
  const radius = size / 2 - 10;
  const ticks = Array.from({ length: 25 }, (_, index) => -SWEEP_DEGREES / 2 + (index / 24) * SWEEP_DEGREES);
  return (
    <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
      <circle r={radius} fill="var(--platinum-light)" stroke="#2b2b2b" strokeWidth={2} />
      <circle r={radius - 8} fill="none" stroke="var(--platinum-dark)" strokeWidth={1} />
      {ticks.map((tick, index) => {
        const major = index % 6 === 0;
        const rad = ((tick - 90) * Math.PI) / 180;
        const inner = radius - (major ? 26 : 16);
        return (
          <line
            key={index}
            x1={Math.cos(rad) * inner}
            y1={Math.sin(rad) * inner}
            x2={Math.cos(rad) * (radius - 10)}
            y2={Math.sin(rad) * (radius - 10)}
            stroke="#2b2b2b"
            strokeWidth={major ? 3 : 1.5}
          />
        );
      })}
      <g transform={`rotate(${angle})`}>
        <path d={`M -6 0 L 0 ${-(radius - 20)} L 6 0 Z`} fill={locked > 0.5 ? "var(--class-g)" : "var(--violet-deep)"} />
      </g>
      <circle r={12} fill="var(--violet-deep)" />
      <circle r={radius + 10} fill="none" stroke="var(--class-g)" strokeWidth={6} opacity={locked} />
    </svg>
  );
}
