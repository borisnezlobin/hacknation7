import type { Point } from "./LoopRing";

const LATITUDES = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
const MERIDIAN_STEP = 15;

function meridianPath(center: Point, radius: number, longitude: number): string | null {
  const steps = 48;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const latitude = -90 + (i / steps) * 180;
    const lat = (latitude * Math.PI) / 180;
    const lon = (longitude * Math.PI) / 180;
    if (Math.cos(lon) < 0) return null;
    points.push(`${(center.x + radius * Math.cos(lat) * Math.sin(lon)).toFixed(1)},${(center.y - radius * Math.sin(lat)).toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

export function projectSolar(center: Point, radius: number, latitude: number, longitude: number): Point & { visible: boolean } {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  return { x: center.x + radius * Math.cos(lat) * Math.sin(lon), y: center.y - radius * Math.sin(lat), visible: Math.cos(lon) > 0 };
}

export function SolarGrid({ center, radius, rotationDegrees, reveal, color = "var(--paper-light)" }: { center: Point; radius: number; rotationDegrees: number; reveal: number; color?: string }) {
  const meridians = Array.from({ length: 360 / MERIDIAN_STEP }, (_, index) => index * MERIDIAN_STEP + (rotationDegrees % MERIDIAN_STEP));
  return (
    <g stroke={color} strokeWidth={1.6} fill="none" opacity={reveal}>
      <circle cx={center.x} cy={center.y} r={radius} />
      {LATITUDES.map((latitude) => {
        const lat = (latitude * Math.PI) / 180;
        const half = radius * Math.cos(lat) * reveal;
        const y = center.y - radius * Math.sin(lat);
        return <line key={latitude} x1={center.x - half} x2={center.x + half} y1={y} y2={y} />;
      })}
      {meridians.map((longitude) => {
        const path = meridianPath(center, radius, longitude - 180);
        return path ? <path key={longitude} d={path} /> : null;
      })}
    </g>
  );
}
