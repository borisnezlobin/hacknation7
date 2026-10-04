import { User } from "@phosphor-icons/react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { ClockHand, ClockTicks } from "../../components/LoopRing";
import { Paper } from "../../components/Paper";
import { PLANET_OUTCOMES } from "../../components/PlanetGrid";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import { seededRandom } from "../../lib/random";
import type { TimelineScene } from "../../lib/timeline";

const FAINT_LIMIT_PPM = 1000;
const FAINT = PLANET_OUTCOMES.filter((outcome) => outcome.depth_ppm < FAINT_LIMIT_PPM);
const GRID = { columns: 13, left: 250, top: 230, cellW: 110, cellH: 110 };
const DAY_CYCLE = ["#e8e7e2", "#d9cdbd", "#8f8aa8", "#3a3760", "#8f8aa8", "#e8e7e2"];

function dipPath(depthPpm: number, seed: number, x: number, y: number): string {
  const random = seededRandom(seed);
  const steps = 26;
  const depth = Math.min(30, 6 + depthPpm / 40);
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inDip = t > 0.4 && t < 0.6 ? depth : 0;
    points.push(`${(x + t * 84).toFixed(1)},${(y + inDip + (random() - 0.5) * 22).toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

function FaintGrid({ frame, start, end }: { frame: number; start: number; end: number }) {
  const scan = ramp(frame, start + 10, end - 20, easeInOut);
  const leave = ramp(frame, end - 8, end + 8, easeInOut);
  const scanX = GRID.left + scan * GRID.columns * GRID.cellW;
  const rows = Math.ceil(FAINT.length / GRID.columns);
  const foundIndex = FAINT.findIndex((outcome) => outcome.baseline);
  const found = FAINT[foundIndex];
  const foundCell = { x: GRID.left + (foundIndex % GRID.columns) * GRID.cellW + 55, y: GRID.top + Math.floor(foundIndex / GRID.columns) * GRID.cellH + 40 };
  const lit = found ? ramp(frame, start + 10 + ((foundIndex % GRID.columns) / GRID.columns) * (end - start - 30), start + 18 + ((foundIndex % GRID.columns) / GRID.columns) * (end - start - 30)) : 0;
  return (
    <AbsoluteFill style={{ opacity: 1 - leave, transform: `scale(${1 - leave * 0.3})` }}>
      <svg width={1920} height={1080}>
        {FAINT.map((outcome, index) => {
          const x = GRID.left + (index % GRID.columns) * GRID.cellW;
          const y = GRID.top + Math.floor(index / GRID.columns) * GRID.cellH + 40;
          const appear = ramp(frame, start + index * 0.4, start + index * 0.4 + 8);
          const isFound = index === foundIndex;
          return <path key={`${outcome.tic}-${index}`} d={dipPath(outcome.depth_ppm, outcome.tic % 997, x + 13, y)} fill="none" stroke={isFound && lit > 0 ? "var(--class-k)" : "var(--violet-deep)"} strokeWidth={isFound && lit > 0 ? 4 : 2} opacity={appear * (isFound ? 1 : 0.55)} />;
        })}
        {found && <circle cx={foundCell.x} cy={foundCell.y + 8} r={52 * lit} fill="none" stroke="var(--class-k)" strokeWidth={4} opacity={lit} />}
        <line x1={scanX} x2={scanX} y1={GRID.top - 20} y2={GRID.top + rows * GRID.cellH + 10} stroke="var(--class-k)" strokeWidth={4} opacity={scan > 0 && scan < 1 ? 1 : 0} />
      </svg>
      <Caption text={`${FAINT.length} smallest known planets`} x={GRID.left} y={GRID.top - 110} frame={frame} at={start + 4} size="title" />
      <Annotation text="Search program" target={{ x: scanX, y: GRID.top + rows * GRID.cellH + 10 }} offset={{ x: 30, y: 70 }} frame={frame} at={start + 14} until={end - 22} />
      {found && <Annotation text={`${FAINT.filter((outcome) => outcome.baseline).length} found`} target={{ x: foundCell.x + 52, y: foundCell.y }} offset={{ x: 120, y: -40 }} frame={frame} at={start + 30 + ((foundIndex % GRID.columns) / GRID.columns) * (end - start - 30)} color="var(--class-k)" />}
    </AbsoluteFill>
  );
}

function Clock({ frame, start }: { frame: number; start: number }) {
  const appear = ramp(frame, start, start + 14, easeOutSoft);
  const handTurns = Math.max(0, frame - start) * 0.35;
  const center = { x: 960, y: 470 };
  if (appear <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: appear, transform: `scale(${lerp(0.8, 1, appear)})` }}>
      <svg width={1920} height={1080}>
        <circle cx={center.x} cy={center.y} r={230} fill="var(--paper-light)" opacity={0.9} />
        <ClockTicks center={center} radius={225} />
        <ClockHand center={center} length={200} turns={handTurns} />
        <ClockHand center={center} length={130} turns={handTurns / 12} width={10} />
      </svg>
      <div style={{ position: "absolute", left: center.x - 40, top: center.y + 260 }}>
        <User size={80} weight="fill" color="var(--violet-deep)" />
      </div>
      <Caption text="~1 day per fix, by hand" x={center.x} y={center.y + 360} frame={frame} at={start + 8} align="center" size="title" />
    </AbsoluteFill>
  );
}

export function ProblemScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const line = scene.lines[0];
  const clockAt = line.from + Math.round(line.durationInFrames * 0.66);
  const night = ramp(frame, clockAt, scene.durationInFrames, easeInOut);
  const tone = interpolateColors((night * 2.2) % 1, DAY_CYCLE.map((_, index) => index / (DAY_CYCLE.length - 1)), DAY_CYCLE);
  return (
    <Paper tone={frame < clockAt ? "var(--paper)" : tone} camera={{ x: frame * 1.5, y: 0, scale: 1 }}>
      <FaintGrid frame={frame} start={0} end={clockAt} />
      <Clock frame={frame} start={clockAt} />
    </Paper>
  );
}
