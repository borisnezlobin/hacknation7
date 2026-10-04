import { Planet, Star, Syringe } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { Paper } from "../../components/Paper";
import { DotColumn, columnTop } from "../../components/tech/DotColumn";
import { lineBeat } from "../../components/tech/LabRing";
import { LAB } from "../../lib/data";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const FALSE_ALARM_RATE = 0.05;
const THRESHOLD_Y = 520;

type Beats = { rain: number[]; laser: number; lock: number };

function beatsFor(scene: TimelineScene): Beats {
  return { rain: [lineBeat(scene, 0.03), lineBeat(scene, 0.28), lineBeat(scene, 0.5)], laser: lineBeat(scene, 0.62), lock: lineBeat(scene, 0.84) };
}

type ColumnSpec = { key: string; label: string; centerX: number; total: number; above: number; color: string; litColor: string; icon: Icon };

function championColumns(): ColumnSpec[] {
  const champion = LAB.runs.find((run) => run.run_id === LAB.champion.run_id);
  const metrics = champion?.metrics as unknown as Record<string, number> | undefined;
  const planets = metrics?.n_planets ?? 231;
  const injected = metrics?.n_injected ?? 399;
  const controls = metrics?.n_controls ?? 399;
  return [
    { key: "planets", label: "known planets", centerX: 440, total: planets, above: Math.round((metrics?.planet_recall ?? 0) * planets), color: "var(--violet)", litColor: "var(--violet)", icon: Planet },
    { key: "injected", label: "injected transits", centerX: 880, total: injected, above: Math.round((metrics?.injection_recall ?? 0) * injected), color: "var(--class-g)", litColor: "var(--class-g)", icon: Syringe },
    { key: "controls", label: "quiet stars", centerX: 1320, total: controls, above: Math.round(FALSE_ALARM_RATE * controls), color: "var(--ink-faint)", litColor: "var(--class-m)", icon: Star },
  ];
}

function laserY(frame: number, columns: ColumnSpec[], beats: Beats): number {
  const highest = Math.min(...columns.map((column) => columnTop(column.above, THRESHOLD_Y))) - 40;
  return interpolate(frame, [beats.laser, beats.lock], [highest, THRESHOLD_Y], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
}

function ColumnIcons({ frame, columns, beats }: { frame: number; columns: ColumnSpec[]; beats: Beats }) {
  return (
    <>
      {columns.map((column, index) => {
        const show = ramp(frame, beats.rain[index], beats.rain[index] + 16, easeOutSoft);
        const Icon = column.icon;
        const top = columnTop(column.above, THRESHOLD_Y) - 110;
        return (
          <div key={column.key} style={{ position: "absolute", left: column.centerX - 36, top, opacity: show, transform: `translateY(${(1 - show) * -30}px)` }}>
            <Icon size={72} weight="fill" color={column.litColor} />
          </div>
        );
      })}
    </>
  );
}

function columnBottom(column: ColumnSpec): number {
  return THRESHOLD_Y + 14 + Math.ceil((column.total - column.above) / 21) * 17;
}

export function ScorerScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const columns = championColumns();
  const laser = laserY(frame, columns, beats);
  const laserIn = ramp(frame, beats.laser - 8, beats.laser + 4);
  const locked = ramp(frame, beats.lock, beats.lock + 8, easeOutSoft);
  const controls = columns[2];
  const labelY = Math.max(...columns.map(columnBottom)) + 24;
  const sink = lerp(0, 40, ramp(frame, 0, scene.durationInFrames));
  return (
    <Paper camera={{ x: 0, y: sink, scale: 1 }}>
      <Impact hits={[{ at: beats.lock, strength: 0.4 }]}>
        <AbsoluteFill style={{ transform: `translateY(${-sink * 0.3}px)` }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {columns.map((column, index) => (
              <DotColumn key={column.key} centerX={column.centerX} total={column.total} above={column.above} color={column.color} litColor={column.litColor} thresholdY={THRESHOLD_Y} frame={frame} rainStart={beats.rain[index]} laserY={frame < beats.laser ? -1000 : laser} seed={index + 5} />
            ))}
            <line x1={240} x2={1680} y1={laser} y2={laser} stroke="var(--class-m)" strokeWidth={lerp(3, 6, locked)} opacity={laserIn} />
            <line x1={240} x2={1680} y1={laser} y2={laser} stroke="var(--class-m)" strokeWidth={22} opacity={laserIn * 0.18} />
          </svg>
          <ColumnIcons frame={frame} columns={columns} beats={beats} />
          {columns.map((column, index) => (
            <Caption key={column.key} text={column.label} x={column.centerX} y={labelY} frame={frame} at={beats.rain[index] + 8} align="center" color={column.key === "controls" ? "var(--ink-muted)" : "var(--violet-deep)"} />
          ))}
          <div className="text-figure" style={{ position: "absolute", left: controls.centerX + 190, top: THRESHOLD_Y - 210, fontSize: 200, color: "var(--class-m)", opacity: locked }}>
            5%
          </div>
          <Annotation text="false alarms" target={{ x: controls.centerX + 60, y: columnTop(controls.above, THRESHOLD_Y) + 8 }} offset={{ x: 170, y: 150 }} frame={frame} at={beats.lock + 6} color="var(--class-m)" />
        </AbsoluteFill>
      </Impact>
    </Paper>
  );
}
