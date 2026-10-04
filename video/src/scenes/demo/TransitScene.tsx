import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Annotation } from "../../components/Annotation";
import { InkDisk, diskOverlapFraction } from "../../components/InkDisk";
import { Paper } from "../../components/Paper";
import { easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const STAR = { x: 960, y: 420, r: 240 };
const PLANET_RADIUS = 46;
const GRAPH = { left: 300, right: 1620, baseline: 850, depth: 120 };

function planetX(progress: number): number {
  return lerp(STAR.x - STAR.r - 180, STAR.x + STAR.r + 180, progress);
}

function BrightnessTrace({ progress }: { progress: number }) {
  const steps = 220;
  const points: string[] = [];
  for (let i = 0; i <= Math.floor(steps * progress); i++) {
    const t = i / steps;
    const overlap = diskOverlapFraction(STAR, { x: planetX(t), y: STAR.y, r: PLANET_RADIUS });
    points.push(`${lerp(GRAPH.left, GRAPH.right, t).toFixed(1)},${(GRAPH.baseline + overlap * GRAPH.depth).toFixed(1)}`);
  }
  const head = points[points.length - 1]?.split(",").map(Number);
  return (
    <g>
      <line x1={GRAPH.left} x2={GRAPH.right} y1={GRAPH.baseline + GRAPH.depth + 50} y2={GRAPH.baseline + GRAPH.depth + 50} stroke="var(--violet-deep)" strokeWidth={2} opacity={0.35} />
      <polyline points={points.join(" ")} fill="none" stroke="var(--violet-deep)" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
      {head && <circle cx={head[0]} cy={head[1]} r={11} fill="var(--class-k)" />}
    </g>
  );
}

export function TransitScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const line = scene.lines[0];
  const crossStart = line.from;
  const crossEnd = line.from + line.durationInFrames;
  const progress = ramp(frame, crossStart - 14, crossEnd + 4, (t) => t);
  const planet = { x: planetX(progress), y: STAR.y, r: PLANET_RADIUS };
  const overlap = diskOverlapFraction(STAR, planet);
  const appear = ramp(frame, 0, 18, easeOutSoft);
  const push = lerp(1, 1.04, ramp(frame, 0, scene.durationInFrames));
  const graphStart = { x: GRAPH.left, y: GRAPH.baseline };
  return (
    <Paper camera={{ x: progress * 120, y: 0, scale: push }}>
      <AbsoluteFill style={{ opacity: appear, transform: `scale(${push})` }}>
        <svg width={1920} height={1080}>
          <InkDisk x={STAR.x} y={STAR.y} radius={STAR.r} color="var(--class-g)" brightness={1 - overlap * 0.35} />
          <circle cx={planet.x} cy={planet.y} r={planet.r} fill="var(--violet-deep)" />
          <BrightnessTrace progress={progress} />
        </svg>
        <Annotation text="Star" target={{ x: STAR.x + STAR.r * 0.72, y: STAR.y - STAR.r * 0.7 }} offset={{ x: 170, y: -60 }} frame={frame} at={crossStart} />
        <Annotation text="Planet" target={{ x: planet.x, y: planet.y - planet.r }} offset={{ x: -40, y: -150 }} frame={frame} at={crossStart + 14} until={crossEnd - 10} />
        <Annotation text="Starlight" target={graphStart} offset={{ x: -40, y: -80 }} frame={frame} at={crossStart + 24} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#14123a", opacity: overlap * 0.12, mixBlendMode: "multiply" }} />
    </Paper>
  );
}
