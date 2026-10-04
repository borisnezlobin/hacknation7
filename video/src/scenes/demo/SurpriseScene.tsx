import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Impact } from "../../components/Impact";
import { Paper } from "../../components/Paper";
import { PlanetSky, useSkyLayout } from "../../components/PlanetSky";
import { StarBloom } from "../../components/StarBloom";
import { runById } from "../../lib/data";
import { easeIn, easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const QUICK_RUN = "dev-04596fef";
const FULL_RUN = "dev-999d74ff";
const LENS = { x: 760, y: 520, radius: 330 };

function Lens({ x, y, radius, rotation, cracked }: { x: number; y: number; radius: number; rotation: number; cracked: number }) {
  const handleEnd = { x: radius * 1.65, y: radius * 1.65 };
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <line x1={radius * 0.72} y1={radius * 0.72} x2={handleEnd.x} y2={handleEnd.y} stroke="var(--violet-deep)" strokeWidth={46} strokeLinecap="square" />
      <circle r={radius} fill="none" stroke="var(--violet-deep)" strokeWidth={26} />
      {cracked > 0 && (
        <g stroke="var(--paper-light)" strokeWidth={5} fill="none" opacity={cracked}>
          <polyline points={`${-radius * 0.9},${-radius * 0.2} ${-radius * 0.3},${-radius * 0.05} ${-radius * 0.1},${radius * 0.4} ${radius * 0.35},${radius * 0.6}`} />
          <polyline points={`${-radius * 0.3},${-radius * 0.05} ${radius * 0.2},${-radius * 0.5} ${radius * 0.6},${-radius * 0.65}`} />
          <polyline points={`${-radius * 0.1},${radius * 0.4} ${-radius * 0.55},${radius * 0.7}`} />
        </g>
      )}
    </g>
  );
}

export function SurpriseScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const line = scene.lines[0];
  const yankAt = line.from + Math.round(line.durationInFrames * 0.42);
  const fallAt = yankAt + 16;
  const stars = useSkyLayout(width, height);
  const lensIn = ramp(frame, 0, 14, easeOutSoft);
  const yank = ramp(frame, yankAt, yankAt + 8, easeIn);
  const fall = ramp(frame, fallAt, fallAt + 40, easeIn);
  const lensX = LENS.x + yank * 520 + fall * 160;
  const lensY = LENS.y - yank * 260 + fall * 1200;
  const quick = runById(QUICK_RUN)?.metrics.score ?? 0;
  const full = runById(FULL_RUN)?.metrics.score ?? 0;
  const collapse = ramp(frame, yankAt, yankAt + 12, easeInOut);
  const starSize = lerp(lerp(120, 360, lensIn), 120 * (full / quick), collapse);
  return (
    <Impact hits={[{ at: yankAt + 2, strength: 1.2, length: 16 }]}>
      <Paper>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <g opacity={0.45}>
            <PlanetSky stars={stars} frame={frame} switchAt={-100} width={width} />
          </g>
          <circle cx={LENS.x} cy={LENS.y} r={LENS.radius * (1 - collapse)} fill="var(--paper-light)" opacity={0.85 * lensIn * (1 - collapse)} />
          <StarBloom x={LENS.x} y={LENS.y} size={starSize} color={collapse > 0.5 ? "var(--class-m)" : "var(--class-f)"} seed={21} time={frame / 30} brightness={1 - collapse * 0.4} specks={6} />
          <g opacity={lensIn * (1 - fall * 0.2)}>
            <Lens x={lensX} y={lensY} radius={LENS.radius} rotation={yank * 35 + fall * 120} cracked={ramp(frame, yankAt + 4, yankAt + 8)} />
          </g>
        </svg>
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-end", padding: "80px 110px" }}>
          <div className="text-figure" style={{ color: collapse > 0.5 ? "var(--class-m)" : "var(--violet)", fontSize: 220 }}>
            {(collapse > 0.5 ? full : quick).toFixed(2)}
          </div>
        </AbsoluteFill>
      </Paper>
    </Impact>
  );
}
