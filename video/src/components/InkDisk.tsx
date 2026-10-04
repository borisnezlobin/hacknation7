import { useId } from "react";

export function InkDisk({ x, y, radius, color, brightness = 1, seed = 3 }: { x: number; y: number; radius: number; color: string; brightness?: number; seed?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <filter id={`disk-edge-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency={(3 / radius).toFixed(4)} numOctaves={3} seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={radius * 0.08} xChannelSelector="R" yChannelSelector="G" result="bled" />
          <feGaussianBlur in="bled" stdDeviation={radius * 0.012} />
        </filter>
        <filter id={`disk-wash-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency={(1.5 / radius).toFixed(4)} numOctaves={3} seed={seed + 1} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={radius * 0.5} xChannelSelector="R" yChannelSelector="G" result="bled" />
          <feGaussianBlur in="bled" stdDeviation={`${radius * 0.14} ${radius * 0.07}`} />
        </filter>
      </defs>
      <circle cx={x} cy={y} r={radius * 1.3} fill={color} opacity={0.3 * brightness} filter={`url(#disk-wash-${id})`} />
      <circle cx={x} cy={y} r={radius} fill={color} opacity={0.55 + 0.45 * brightness} filter={`url(#disk-edge-${id})`} />
      <circle cx={x - radius * 0.12} cy={y - radius * 0.1} r={radius * 0.62} fill="var(--class-f)" opacity={0.45 * brightness} filter={`url(#disk-wash-${id})`} />
    </g>
  );
}

export function diskOverlapFraction(star: { x: number; y: number; r: number }, planet: { x: number; y: number; r: number }): number {
  const distance = Math.hypot(star.x - planet.x, star.y - planet.y);
  if (distance >= star.r + planet.r) return 0;
  if (distance <= star.r - planet.r) return 1;
  const r1 = star.r;
  const r2 = planet.r;
  const part1 = r2 * r2 * Math.acos((distance * distance + r2 * r2 - r1 * r1) / (2 * distance * r2));
  const part2 = r1 * r1 * Math.acos((distance * distance + r1 * r1 - r2 * r2) / (2 * distance * r1));
  const part3 = 0.5 * Math.sqrt((-distance + r1 + r2) * (distance + r1 - r2) * (distance - r1 + r2) * (distance + r1 + r2));
  return (part1 + part2 - part3) / (Math.PI * r2 * r2);
}
