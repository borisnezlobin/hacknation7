import { seededRandom } from "@/lib/random";
import type { CSSProperties } from "react";

type Stamp = { dx: number; dy: number; rx: number; ry: number; angle: number; opacity: number };
type Speck = { dx: number; dy: number; size: number; angle: number; sides: number };

const STAMPS_PER_PETAL = 5;
const SIZE = 200;

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
        dy: Math.sin(angle) * reach * 0.75,
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
    const reach = 0.55 + random() * 0.8;
    return { dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach, size: 0.012 + random() * 0.022, angle: random() * 360, sides: random() > 0.5 ? 3 : 4 };
  });
}

function speckPolygon(speck: Speck): string {
  const radius = speck.size * SIZE;
  return Array.from({ length: speck.sides }, (_, index) => {
    const angle = (speck.angle * Math.PI) / 180 + (index / speck.sides) * Math.PI * 2;
    return `${(speck.dx * SIZE * 0.5 + Math.cos(angle) * radius).toFixed(1)},${(speck.dy * SIZE * 0.5 + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
}

function BleedFilter({ id, seed, displace, blurAlong, blurAcross, frequency }: { id: string; seed: number; displace: number; blurAlong: number; blurAcross: number; frequency: number }) {
  return (
    <filter id={id} x="-150%" y="-150%" width="400%" height="400%">
      <feTurbulence type="fractalNoise" baseFrequency={(frequency / SIZE).toFixed(5)} numOctaves={3} seed={seed} result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={SIZE * displace} xChannelSelector="R" yChannelSelector="G" result="bled" />
      <feGaussianBlur in="bled" stdDeviation={`${SIZE * blurAlong} ${SIZE * blurAcross}`} />
    </filter>
  );
}

function StampLayer({ stamps, scale, color, opacity, filter }: { stamps: Stamp[]; scale: number; color: string; opacity: number; filter: string }) {
  return (
    <g filter={`url(#${filter})`} opacity={opacity}>
      {stamps.map((stamp, index) => {
        const cx = stamp.dx * SIZE;
        const cy = stamp.dy * SIZE;
        return <ellipse key={index} cx={cx} cy={cy} rx={stamp.rx * SIZE * scale} ry={stamp.ry * SIZE * scale} transform={`rotate(${stamp.angle} ${cx} ${cy})`} fill={color} opacity={stamp.opacity} />;
      })}
    </g>
  );
}

export function StarBloom({ seed, color, className = "", style, specks = 5, planet = false }: {
  seed: number;
  color: string;
  className?: string;
  style?: CSSProperties;
  specks?: number;
  planet?: boolean;
}) {
  const stamps = buildPetalStamps(seed);
  const speckList = buildSpecks(seed, specks);
  const smear = -20 + seededRandom(seed * 3)() * 40;
  const id = `bloom-${seed}`;
  return (
    <svg viewBox={`${-SIZE} ${-SIZE} ${SIZE * 2} ${SIZE * 2}`} className={`pointer-events-none overflow-visible ${className}`} style={style} aria-hidden="true">
      <defs>
        <BleedFilter id={`${id}-wash`} seed={seed} displace={0.7} blurAlong={0.1} blurAcross={0.035} frequency={1.6} />
        <BleedFilter id={`${id}-petal`} seed={seed + 1} displace={0.3} blurAlong={0.028} blurAcross={0.01} frequency={4.5} />
      </defs>
      <g transform={`rotate(${smear})`}>
        <StampLayer stamps={stamps} scale={2.1} color={color} opacity={0.22} filter={`${id}-wash`} />
        <StampLayer stamps={stamps} scale={1} color={color} opacity={0.9} filter={`${id}-petal`} />
        <StampLayer stamps={stamps.filter((_, index) => index % STAMPS_PER_PETAL < 2)} scale={0.55} color="var(--violet-deep)" opacity={0.4} filter={`${id}-petal`} />
      </g>
      {speckList.map((speck, index) => (
        <polygon key={index} points={speckPolygon(speck)} fill="var(--violet-deep)" opacity={0.85} />
      ))}
      {planet && <circle className="bloom-planet" cx={SIZE * 0.42} cy={-SIZE * 0.02} r={SIZE * 0.07} fill="var(--violet-deep)" />}
    </svg>
  );
}
