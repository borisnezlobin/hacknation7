import { useMemo } from "react";
import { seededRandom, smoothNoise } from "../lib/random";

type Stamp = { dx: number; dy: number; rx: number; ry: number; angle: number; opacity: number };
type Speck = { dx: number; dy: number; size: number; angle: number; sides: 3 | 4 };

export type StarBloomProps = {
  x: number;
  y: number;
  size: number;
  color: string;
  seed: number;
  time: number;
  brightness?: number;
  stem?: number;
  stemColor?: string;
  specks?: number;
  smear?: number;
  planet?: { progress: number; color?: string };
};

const STAMPS_PER_PETAL = 5;

function buildPetalStamps(seed: number): Stamp[] {
  const random = seededRandom(seed);
  const petals = 2 + Math.floor(random() * 2);
  const baseAngle = random() * Math.PI * 2;
  const stamps: Stamp[] = [];
  for (let petal = 0; petal < petals; petal++) {
    const angle = baseAngle + (petal / petals) * Math.PI * 2 + (random() - 0.5) * 0.9;
    const reach = 0.16 + random() * 0.14;
    const rx = 0.2 + random() * 0.1;
    const ry = 0.09 + random() * 0.05;
    for (let stamp = 0; stamp < STAMPS_PER_PETAL; stamp++) {
      const drag = stamp * (0.07 + random() * 0.05);
      stamps.push({
        dx: Math.cos(angle) * reach - drag,
        dy: Math.sin(angle) * reach * 0.75 + (random() - 0.5) * 0.02,
        rx: rx * (1 - stamp * 0.08),
        ry: ry * (1 - stamp * 0.05),
        angle: (angle * 180) / Math.PI,
        opacity: 0.9 * Math.pow(0.62, stamp),
      });
    }
  }
  return stamps;
}

function buildSpecks(seed: number, count: number): Speck[] {
  const random = seededRandom(seed * 7 + 3);
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const reach = 0.55 + random() * 1.1;
    return { dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach, size: 0.01 + random() * 0.025, angle: random() * 360, sides: random() > 0.5 ? 3 : 4 };
  });
}

function stemPath(size: number, seed: number, length: number): string {
  const random = seededRandom(seed * 13 + 1);
  const lean = (random() - 0.5) * 0.5;
  const steps = 40;
  const dipAt = 0.35 + random() * 0.3;
  const points: string[] = [];
  for (let i = 0; i <= steps * length; i++) {
    const t = i / steps;
    const dip = Math.abs(t - dipAt) < 0.05 ? size * 0.05 : 0;
    const wobble = (smoothNoise(t * 3, seed) - 0.5) * size * 0.012;
    points.push(`${(lean * t * size * 1.6 + wobble + dip).toFixed(1)},${(t * size * 1.6).toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

function speckPolygon(speck: Speck, size: number): string {
  const radius = speck.size * size;
  return Array.from({ length: speck.sides }, (_, index) => {
    const angle = (speck.angle * Math.PI) / 180 + (index / speck.sides) * Math.PI * 2;
    return `${(speck.dx * size * 0.5 + Math.cos(angle) * radius).toFixed(1)},${(speck.dy * size * 0.5 + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
}

function BleedFilter({ id, size, seed, displace, blurAlong, blurAcross, frequency }: { id: string; size: number; seed: number; displace: number; blurAlong: number; blurAcross: number; frequency: number }) {
  return (
    <filter id={id} x="-150%" y="-150%" width="400%" height="400%">
      <feTurbulence type="fractalNoise" baseFrequency={(frequency / size).toFixed(5)} numOctaves={4} seed={seed} result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={size * displace} xChannelSelector="R" yChannelSelector="G" result="bled" />
      <feGaussianBlur in="bled" stdDeviation={`${size * blurAlong} ${size * blurAcross}`} />
    </filter>
  );
}

function StampLayer({ stamps, size, spread, scale, color, opacity, filter }: { stamps: Stamp[]; size: number; spread: number; scale: number; color: string; opacity: number; filter: string }) {
  return (
    <g filter={`url(#${filter})`} opacity={opacity}>
      {stamps.map((stamp, index) => {
        const cx = stamp.dx * size * spread;
        const cy = stamp.dy * size * spread;
        return (
          <ellipse
            key={index}
            cx={cx}
            cy={cy}
            rx={stamp.rx * size * spread * scale}
            ry={stamp.ry * size * spread * scale}
            transform={`rotate(${stamp.angle} ${cx} ${cy})`}
            fill={color}
            opacity={stamp.opacity}
          />
        );
      })}
    </g>
  );
}

export function StarBloom({ x, y, size, color, seed, time, brightness = 1, stem = 0, stemColor = "var(--stem)", specks = 5, smear, planet }: StarBloomProps) {
  const stamps = useMemo(() => buildPetalStamps(seed), [seed]);
  const speckList = useMemo(() => buildSpecks(seed, specks), [seed, specks]);
  const smearAngle = smear ?? -20 + seededRandom(seed * 3)() * 40;
  const breathe = 1 + (smoothNoise(time * 0.6, seed) - 0.5) * 0.08;
  const spread = (0.85 + brightness * 0.15) * breathe;
  const id = `bloom-${seed}`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <BleedFilter id={`${id}-wash`} size={size} seed={seed} displace={0.7} blurAlong={0.1} blurAcross={0.035} frequency={1.6} />
        <BleedFilter id={`${id}-petal`} size={size} seed={seed + 1} displace={0.3} blurAlong={0.028} blurAcross={0.01} frequency={4.5} />
        <BleedFilter id={`${id}-core`} size={size} seed={seed + 2} displace={0.12} blurAlong={0.008} blurAcross={0.004} frequency={7} />
      </defs>
      {stem > 0 && <path d={stemPath(size, seed, stem)} stroke={stemColor} strokeWidth={Math.max(1.5, size * 0.012)} fill="none" opacity={0.65} />}
      <g transform={`rotate(${smearAngle})`}>
        <StampLayer stamps={stamps} size={size} spread={spread} scale={2.1} color={color} opacity={0.22 * brightness} filter={`${id}-wash`} />
        <StampLayer stamps={stamps} size={size} spread={spread} scale={1} color={color} opacity={0.35 + brightness * 0.6} filter={`${id}-petal`} />
        <StampLayer stamps={stamps.filter((_, index) => index % STAMPS_PER_PETAL < 2)} size={size} spread={spread * 0.85} scale={0.55} color="var(--violet-deep)" opacity={0.45 * brightness} filter={`${id}-core`} />
      </g>
      {speckList.map((speck, index) => (
        <polygon key={index} points={speckPolygon(speck, size)} fill="var(--violet-deep)" opacity={0.85} />
      ))}
      {planet && <TransitingPlanet size={size} progress={planet.progress} color={planet.color} />}
    </g>
  );
}

function TransitingPlanet({ size, progress, color = "var(--violet-deep)" }: { size: number; progress: number; color?: string }) {
  if (progress < -0.2 || progress > 1.2) return null;
  const cx = (progress - 0.5) * size * 1.1;
  const fade = Math.min(1, (progress + 0.2) / 0.2, (1.2 - progress) / 0.2);
  return <circle cx={cx} cy={-size * 0.02} r={size * 0.06} fill={color} opacity={fade} />;
}
