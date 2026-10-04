import { useMemo } from "react";
import { seededRandom } from "../../lib/random";

type Stamp = { dx: number; dy: number; rx: number; ry: number; opacity: number };

function buildStamps(seed: number): Stamp[] {
  const random = seededRandom(seed * 31 + 7);
  const count = 3 + Math.floor(random() * 2);
  return Array.from({ length: count }, (_, index) => ({
    dx: index === 0 ? 0 : (random() - 0.35) * 0.9,
    dy: index === 0 ? 0 : (random() - 0.5) * 0.35,
    rx: index === 0 ? 0.42 : 0.18 + random() * 0.25,
    ry: index === 0 ? 0.26 : 0.1 + random() * 0.12,
    opacity: index === 0 ? 1 : 0.45 + random() * 0.4,
  }));
}

export type InkBleedProps = {
  x: number;
  y: number;
  size: number;
  color: string;
  seed: number;
  angle?: number;
  smear?: number;
  wetness?: number;
  opacity?: number;
  core?: boolean;
};

export function InkBleed({ x, y, size, color, seed, angle = -18, smear = 1, wetness = 1, opacity = 1, core = true }: InkBleedProps) {
  const stamps = useMemo(() => buildStamps(seed), [seed]);
  const id = `ink-${seed}-${Math.round(size)}`;
  const ragged = size * 0.32 * wetness;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={opacity}>
      <defs>
        <filter id={`${id}-bleed`} x="-120%" y="-120%" width="340%" height="340%">
          <feTurbulence type="fractalNoise" baseFrequency={(2.4 / size).toFixed(4)} numOctaves={3} seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={ragged} xChannelSelector="R" yChannelSelector="G" result="ragged" />
          <feGaussianBlur in="ragged" stdDeviation={`${(size * 0.13 * smear * wetness).toFixed(1)} ${(size * 0.035 * wetness).toFixed(1)}`} result="smear" />
          <feGaussianBlur in="ragged" stdDeviation={(size * 0.012).toFixed(1)} result="edge" />
          <feComponentTransfer in="edge" result="faintEdge">
            <feFuncA type="linear" slope={0.35} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="smear" />
            <feMergeNode in="faintEdge" />
          </feMerge>
        </filter>
        <filter id={`${id}-core`} x="-120%" y="-120%" width="340%" height="340%">
          <feTurbulence type="fractalNoise" baseFrequency={(5 / size).toFixed(4)} numOctaves={2} seed={seed + 3} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={size * 0.08} xChannelSelector="R" yChannelSelector="G" result="ragged" />
          <feGaussianBlur in="ragged" stdDeviation={`${(size * 0.03).toFixed(1)} ${(size * 0.012).toFixed(1)}`} />
        </filter>
      </defs>
      <g filter={`url(#${id}-bleed)`}>
        {stamps.map((stamp, index) => (
          <ellipse key={index} cx={stamp.dx * size} cy={stamp.dy * size} rx={stamp.rx * size * (1 + (smear - 1) * 0.4)} ry={stamp.ry * size} fill={color} opacity={stamp.opacity} />
        ))}
      </g>
      {core && (
        <g filter={`url(#${id}-core)`}>
          <ellipse cx={size * 0.04} cy={0} rx={size * 0.16} ry={size * 0.085} fill={color} />
          <ellipse cx={size * 0.08} cy={0} rx={size * 0.07} ry={size * 0.04} fill="var(--violet-deep)" opacity={0.55} />
        </g>
      )}
    </g>
  );
}
