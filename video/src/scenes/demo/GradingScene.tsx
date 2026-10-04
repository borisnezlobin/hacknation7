import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../../components/Annotation";
import { Paper } from "../../components/Paper";
import { PLANET_OUTCOMES } from "../../components/PlanetGrid";
import { useSkyLayout } from "../../components/PlanetSky";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

export function GradingScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const line = scene.lines[0];
  const stars = useSkyLayout(width, height, 140);
  const appearAt = line.from;
  const sweepAt = line.from + Math.round(line.durationInFrames * 0.55);
  const sweep = ramp(frame, sweepAt, sweepAt + 34, easeInOut);
  const scanX = lerp(80, width - 80, sweep);
  const found = stars.filter((star) => star.baseline && star.x <= scanX).length;
  const zoom = lerp(1.12, 1, ramp(frame, 0, scene.durationInFrames, easeOutSoft));
  return (
    <Paper camera={{ x: frame * 2, y: 0, scale: zoom }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <svg width={width} height={height}>
          <defs>
            <filter id="grade-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={3} seed={9} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={12} xChannelSelector="R" yChannelSelector="G" result="bled" />
              <feGaussianBlur in="bled" stdDeviation="4 2" />
            </filter>
          </defs>
          <g filter="url(#grade-bleed)">
            {stars.map((star, index) => {
              const appear = ramp(frame, appearAt + (index % 40) * 0.6, appearAt + (index % 40) * 0.6 + 10);
              const lit = star.baseline && star.x <= scanX;
              return <circle key={index} cx={star.x} cy={star.y} r={lit ? 20 : 9} fill={lit ? "var(--violet)" : "var(--ink-faint)"} opacity={appear * (lit ? 1 : 0.55)} />;
            })}
          </g>
          {sweep > 0 && sweep < 1 && <line x1={scanX} x2={scanX} y1={60} y2={height - 60} stroke="var(--class-k)" strokeWidth={4} />}
        </svg>
      </AbsoluteFill>
      <Caption text={`${PLANET_OUTCOMES.length} known planets`} x={width / 2} y={50} frame={frame} at={appearAt + 4} align="center" size="title" />
      <Caption text={`${found} found`} x={width / 2} y={height - 140} frame={frame} at={sweepAt} align="center" size="title" color="var(--violet)" />
    </Paper>
  );
}
