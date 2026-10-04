import { AbsoluteFill, useCurrentFrame } from "remotion";
import holdoutJson from "../../../public/data/holdout.json";
import { Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { Paper } from "../../components/Paper";
import { StarBloom } from "../../components/StarBloom";
import { lineBeat } from "../../components/tech/LabRing";
import { LAB } from "../../lib/data";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import { seededRandom } from "../../lib/random";
import type { TimelineScene } from "../../lib/timeline";

type FoldedCurve = { hours: number[]; flux: (number | null)[] };
type HoldoutPlanet = { champion: boolean; baseline: boolean; fold: FoldedCurve | null };

const HOLDOUT = (holdoutJson as { planets: HoldoutPlanet[] } | null)?.planets ?? [];
const FIELD = { x: 860, y: 110, width: 960, height: 860 };
const CUTOFF_X = 800;
const CHART = { left: 170, right: 640, top: 250, bottom: 780 };

type Beats = { stars: number; baseline: number; champion: number; chart: number };

function beatsFor(scene: TimelineScene): Beats {
  return { stars: lineBeat(scene, 0.1), baseline: lineBeat(scene, 0.5), champion: lineBeat(scene, 0.64), chart: lineBeat(scene, 0.8) };
}

function layoutStars() {
  const random = seededRandom(370);
  const columns = 6;
  const rows = 7;
  const cellW = FIELD.width / columns;
  const cellH = FIELD.height / rows;
  const cells = Array.from({ length: columns * rows }, (_, index) => ({ index, order: random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, HOLDOUT.length);
  return cells.map((cell, index) => ({
    x: FIELD.x + ((cell.index % columns) + 0.5 + (random() - 0.5) * 0.4) * cellW,
    y: FIELD.y + (Math.floor(cell.index / columns) + 0.5 + (random() - 0.5) * 0.3) * cellH,
    planet: HOLDOUT[index],
  }));
}

function FoldedDip({ curve, x, y, reveal }: { curve: FoldedCurve; x: number; y: number; reveal: number }) {
  const values = curve.flux.filter((value): value is number => value !== null);
  const low = Math.min(...values);
  const points = curve.flux
    .map((value, index) => (value === null ? null : `${x - 60 + (index / curve.flux.length) * 120},${y + ((1 - value) / (1 - low)) * 40}`))
    .filter(Boolean)
    .slice(0, Math.floor(curve.flux.length * reveal));
  return <polyline points={points.join(" ")} fill="none" stroke="var(--violet-deep)" strokeWidth={4} strokeLinejoin="round" />;
}

function devRecall(pipeline: string, fallback: number): number {
  const run = LAB.runs.find((candidate) => candidate.pipeline.endsWith(pipeline) && !candidate.quick);
  return run?.metrics.planet_recall ?? fallback;
}

function SlopeChart({ frame, start }: { frame: number; start: number }) {
  const blindBaseline = HOLDOUT.filter((planet) => planet.baseline).length / Math.max(1, HOLDOUT.length);
  const blindChampion = HOLDOUT.filter((planet) => planet.champion).length / Math.max(1, HOLDOUT.length);
  const series = [
    { label: "dev", from: devRecall("baseline.py", 0.15), to: LAB.runs.find((run) => run.run_id === LAB.champion.run_id)?.metrics.planet_recall ?? 0.39, color: "var(--violet)" },
    { label: "blind", from: blindBaseline, to: blindChampion, color: "var(--class-m)" },
  ];
  const y = (recall: number) => CHART.bottom - (recall / 0.45) * (CHART.bottom - CHART.top);
  const draw = ramp(frame, start + 6, start + 30, easeInOut);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <line x1={CHART.left} x2={CHART.left} y1={CHART.top - 20} y2={CHART.bottom} stroke="var(--ink-faint)" strokeWidth={2} />
      <line x1={CHART.right} x2={CHART.right} y1={CHART.top - 20} y2={CHART.bottom} stroke="var(--ink-faint)" strokeWidth={2} />
      {series.map((entry) => (
        <g key={entry.label}>
          <line x1={CHART.left} y1={y(entry.from)} x2={lerp(CHART.left, CHART.right, draw)} y2={lerp(y(entry.from), y(entry.to), draw)} stroke={entry.color} strokeWidth={10} strokeLinecap="round" />
          <circle cx={CHART.left} cy={y(entry.from)} r={14} fill={entry.color} />
          {draw > 0.98 && <circle cx={CHART.right} cy={y(entry.to)} r={14} fill={entry.color} />}
        </g>
      ))}
    </svg>
  );
}

function slopeLabelY(recall: number): number {
  return CHART.bottom - (recall / 0.45) * (CHART.bottom - CHART.top) - 24;
}

export function FailedScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const stars = layoutStars();
  const starsIn = ramp(frame, beats.stars, beats.stars + 20, easeOutSoft);
  const baselineIn = ramp(frame, beats.baseline, beats.baseline + 12, easeOutSoft);
  const championIn = ramp(frame, beats.champion, beats.champion + 14, easeOutSoft);
  const figuresOut = ramp(frame, beats.chart - 4, beats.chart + 8);
  const chartIn = ramp(frame, beats.chart, beats.chart + 10);
  const championRecall = LAB.runs.find((run) => run.run_id === LAB.champion.run_id)?.metrics.planet_recall ?? 0.39;
  const blindChampion = HOLDOUT.filter((planet) => planet.champion).length / Math.max(1, HOLDOUT.length);
  const counts = { baseline: HOLDOUT.filter((planet) => planet.baseline).length, champion: HOLDOUT.filter((planet) => planet.champion).length };
  const drift = lerp(0, 50, ramp(frame, 0, scene.durationInFrames));
  return (
    <Paper camera={{ x: drift, y: 0, scale: 1 }}>
      <Impact hits={[{ at: beats.champion, strength: 0.3 }]}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <line x1={CUTOFF_X} y1={60} x2={CUTOFF_X} y2={1020} stroke="var(--violet-deep)" strokeWidth={3} opacity={starsIn * (1 - chartIn * 0.8)} />
          {stars.map((star, index) => (
            <g key={index} opacity={starsIn * (1 - chartIn * 0.65)}>
              <StarBloom x={star.x} y={star.y} size={star.planet?.champion ? lerp(44, 120, championIn) : 44} color={star.planet?.champion && championIn > 0 ? "var(--class-g)" : "var(--violet)"} seed={200 + index} time={frame / 30} brightness={star.planet?.champion ? 0.5 + 0.5 * championIn : 0.45} specks={1} />
              {star.planet?.baseline && <circle cx={star.x} cy={star.y} r={lerp(90, 54, baselineIn)} fill="none" stroke="var(--violet-deep)" strokeWidth={5} opacity={baselineIn} />}
              {star.planet?.champion && star.planet.fold && <FoldedDip curve={star.planet.fold} x={star.x} y={star.y + 62} reveal={ramp(frame, beats.champion + 8, beats.champion + 30, easeOutSoft)} />}
            </g>
          ))}
        </svg>
        <Caption text="What didn't" x={420} y={480} frame={frame} at={0} until={beats.baseline - 6} align="center" size="title" />
        <Caption text="after 2026-07-01" x={CUTOFF_X + 18} y={36} frame={frame} at={beats.stars + 8} />
        <AbsoluteFill style={{ opacity: 1 - figuresOut }}>
          <div style={{ position: "absolute", left: 140, top: 420, display: "flex", gap: 90 }}>
            <div style={{ opacity: baselineIn, textAlign: "center" }}>
              <div className="text-figure" style={{ color: "var(--violet-deep)" }}>{counts.baseline}</div>
              <div className="text-annotation" style={{ color: "var(--violet-deep)", marginTop: 16 }}>original</div>
            </div>
            <div style={{ opacity: championIn, textAlign: "center" }}>
              <div className="text-figure" style={{ color: "var(--class-k)" }}>{counts.champion}</div>
              <div className="text-annotation" style={{ color: "var(--class-k)", marginTop: 16 }}>champion</div>
            </div>
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: chartIn }}>
          <SlopeChart frame={frame} start={beats.chart} />
          <Caption text="original" x={CHART.left} y={CHART.bottom + 20} frame={frame} at={beats.chart + 4} align="center" color="var(--ink-muted)" />
          <Caption text="champion" x={CHART.right} y={CHART.bottom + 20} frame={frame} at={beats.chart + 4} align="center" color="var(--ink-muted)" />
          <Caption text="dev" x={CHART.right + 34} y={slopeLabelY(championRecall)} frame={frame} at={beats.chart + 26} color="var(--violet)" />
          <Caption text="blind: overfit" x={CHART.right + 34} y={slopeLabelY(blindChampion)} frame={frame} at={beats.chart + 30} color="var(--class-m)" />
        </AbsoluteFill>
      </Impact>
    </Paper>
  );
}
