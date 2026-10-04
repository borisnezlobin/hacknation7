import { useId } from "react";

export type Point = { x: number; y: number };

export function ringPoint(center: Point, radius: number, turn: number): Point {
  const angle = turn * Math.PI * 2 - Math.PI / 2;
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * 0.92 };
}

export function RingTrack({ center, radius, opacity = 1, color = "var(--violet-deep)" }: { center: Point; radius: number; opacity?: number; color?: string }) {
  return <ellipse cx={center.x} cy={center.y} rx={radius} ry={radius * 0.92} fill="none" stroke={color} strokeWidth={2} strokeDasharray="2 10" strokeLinecap="round" opacity={opacity * 0.5} />;
}

export function Comet({ center, radius, phase, trail = 0.18, size = 22, color = "var(--violet-deep)", glow = "var(--class-g)", intensity = 1 }: {
  center: Point;
  radius: number;
  phase: number;
  trail?: number;
  size?: number;
  color?: string;
  glow?: string;
  intensity?: number;
}) {
  const filterId = useId().replace(/:/g, "");
  const stamps = 26;
  return (
    <g>
      <defs>
        <filter id={`comet-${filterId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={3} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={size * 0.8} xChannelSelector="R" yChannelSelector="G" result="bled" />
          <feGaussianBlur in="bled" stdDeviation={size * 0.25} />
        </filter>
      </defs>
      <g filter={`url(#comet-${filterId})`}>
        {Array.from({ length: stamps }, (_, index) => {
          const t = index / stamps;
          const point = ringPoint(center, radius, phase - t * trail);
          return <circle key={index} cx={point.x} cy={point.y} r={size * (1 - t * 0.75)} fill={index < 3 ? glow : color} opacity={(1 - t) * 0.7 * intensity} />;
        })}
      </g>
      <circle cx={ringPoint(center, radius, phase).x} cy={ringPoint(center, radius, phase).y} r={size * 0.38} fill={glow} opacity={intensity} />
    </g>
  );
}

export function ClockHand({ center, length, turns, color = "var(--violet-deep)", width = 6 }: { center: Point; length: number; turns: number; color?: string; width?: number }) {
  const tip = ringPoint(center, length, turns);
  return <line x1={center.x} y1={center.y} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={width} strokeLinecap="round" />;
}

export function ClockTicks({ center, radius, count = 12, opacity = 1 }: { center: Point; radius: number; count?: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, index) => {
        const outer = ringPoint(center, radius, index / count);
        const inner = ringPoint(center, radius * 0.88, index / count);
        return <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--violet-deep)" strokeWidth={index % 3 === 0 ? 5 : 2.5} />;
      })}
    </g>
  );
}
