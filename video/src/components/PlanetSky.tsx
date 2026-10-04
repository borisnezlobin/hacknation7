import { useMemo } from "react";
import { ramp } from "../lib/motion";
import { seededRandom } from "../lib/random";
import { PLANET_OUTCOMES } from "./PlanetGrid";

export type SkyStar = { x: number; y: number; baseline: boolean; champion: boolean };

export function useSkyLayout(width: number, height: number, margin = 90): SkyStar[] {
  return useMemo(() => {
    const random = seededRandom(231);
    return PLANET_OUTCOMES.map((outcome) => ({
      x: margin + random() * (width - margin * 2),
      y: margin + random() * (height - margin * 2),
      baseline: outcome.baseline,
      champion: outcome.champion,
    }));
  }, [width, height, margin]);
}

type StarLook = { radius: number; color: string; opacity: number };

function starLook(star: SkyStar, switched: number, flare: number): StarLook {
  if (switched < 0.5) return star.baseline ? { radius: 11, color: "var(--violet)", opacity: 1 } : { radius: 4, color: "var(--ink-faint)", opacity: 0.6 };
  if (star.champion && !star.baseline) return { radius: 11 + flare * 22, color: "var(--class-g)", opacity: 1 };
  if (star.champion) return { radius: 11, color: "var(--violet)", opacity: 1 };
  return { radius: 4, color: star.baseline ? "var(--class-m)" : "var(--ink-faint)", opacity: 0.6 };
}

export function PlanetSky({ stars, frame, switchAt, width, sweepFrames = 30 }: { stars: SkyStar[]; frame: number; switchAt: number; width: number; sweepFrames?: number }) {
  return (
    <g>
      <defs>
        <filter id="sky-bleed" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={3} seed={9} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={14} xChannelSelector="R" yChannelSelector="G" result="bled" />
          <feGaussianBlur in="bled" stdDeviation="5 2" />
        </filter>
      </defs>
      {[true, false].map((wash) => (
        <g key={String(wash)} filter={wash ? "url(#sky-bleed)" : undefined} opacity={wash ? 0.8 : 1}>
          {stars.map((star, index) => {
            const at = switchAt + (star.x / width) * sweepFrames;
            const switched = ramp(frame, at, at + 6);
            const flare = 1 - ramp(frame, at, at + 22);
            const look = starLook(star, switched, flare * switched);
            return <circle key={index} cx={star.x} cy={star.y} r={wash ? look.radius * 1.8 : look.radius * 0.45} fill={wash ? look.color : "var(--violet-deep)"} opacity={look.opacity} />;
          })}
        </g>
      ))}
    </g>
  );
}
