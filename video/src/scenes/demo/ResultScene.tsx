import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { Paper } from "../../components/Paper";
import { PLANET_OUTCOMES } from "../../components/PlanetGrid";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const HOURS_BY_HAND = 7 * 8;
const HOURS_IN_LAB = 3.5;
const BAR = { left: 420, top: 360, height: 90, gap: 110, maxWidth: 1360 };
const BINS = [
  { label: "<0.1%", min: 0, max: 1000 },
  { label: "0.1–0.3%", min: 1000, max: 3000 },
  { label: "0.3–1%", min: 3000, max: 10000 },
  { label: ">1%", min: 10000, max: Infinity },
];
const CHART = { left: 700, bottom: 900, width: 1000, height: 560 };

function binCounts() {
  return BINS.map((bin) => {
    const inBin = PLANET_OUTCOMES.filter((outcome) => outcome.depth_ppm >= bin.min && outcome.depth_ppm < bin.max);
    return { ...bin, total: inBin.length, baseline: inBin.filter((o) => o.baseline).length, champion: inBin.filter((o) => o.champion).length };
  });
}

function TimeBars({ frame, start, end }: { frame: number; start: number; end: number }) {
  const grow = ramp(frame, start + 6, end - 16, easeInOut);
  const lab = ramp(frame, start + 2, start + 10, easeOutSoft);
  const leave = ramp(frame, end - 6, end + 8);
  const handWidth = BAR.maxWidth * grow;
  const labWidth = BAR.maxWidth * (HOURS_IN_LAB / HOURS_BY_HAND) * lab;
  return (
    <AbsoluteFill style={{ opacity: 1 - leave }}>
      <svg width={1920} height={1080}>
        <rect x={BAR.left} y={BAR.top} width={labWidth} height={BAR.height} fill="var(--violet)" />
        <rect x={BAR.left} y={BAR.top + BAR.height + BAR.gap} width={handWidth} height={BAR.height} fill="var(--ink-faint)" />
      </svg>
      <Caption text="Planet lab" x={BAR.left - 30} y={BAR.top + 18} frame={frame} at={start} align="right" />
      <Caption text="By hand" x={BAR.left - 30} y={BAR.top + BAR.height + BAR.gap + 18} frame={frame} at={start} align="right" color="var(--ink-muted)" />
      <Caption text="3.5 hours" x={BAR.left + labWidth + 24} y={BAR.top + 18} frame={frame} at={start + 8} color="var(--violet)" />
      <Caption text="~7 workdays" x={BAR.left + Math.max(handWidth, 200) - 20} y={BAR.top + BAR.height + BAR.gap - 50} frame={frame} at={end - 22} align="right" color="var(--ink-muted)" />
    </AbsoluteFill>
  );
}

function DepthChart({ frame, start, end }: { frame: number; start: number; end: number }) {
  const appear = ramp(frame, start, start + 12, easeOutSoft);
  const rise = ramp(frame, start + 14, start + 44, easeInOut);
  const bins = binCounts();
  const maxTotal = Math.max(...bins.map((bin) => bin.total));
  const column = CHART.width / bins.length;
  const baselineTotal = bins.reduce((sum, bin) => sum + bin.baseline, 0);
  const championTotal = bins.reduce((sum, bin) => sum + bin.champion, 0);
  const shown = Math.round(lerp(baselineTotal, championTotal, rise));
  if (appear <= 0) return null;
  const faint = bins[0];
  const faintTop = CHART.bottom - (lerp(faint.baseline, faint.champion, rise) / maxTotal) * CHART.height;
  return (
    <AbsoluteFill style={{ opacity: appear * (1 - ramp(frame, end - 4, end + 6)) }}>
      <svg width={1920} height={1080}>
        {bins.map((bin, index) => {
          const x = CHART.left + index * column + column * 0.18;
          const barWidth = column * 0.64;
          const totalHeight = (bin.total / maxTotal) * CHART.height;
          const foundHeight = (lerp(bin.baseline, bin.champion, rise) / maxTotal) * CHART.height;
          return (
            <g key={bin.label}>
              <rect x={x} y={CHART.bottom - totalHeight} width={barWidth} height={totalHeight} fill="none" stroke="var(--violet-deep)" strokeWidth={2} strokeDasharray="6 6" opacity={0.5} />
              <rect x={x} y={CHART.bottom - foundHeight} width={barWidth} height={foundHeight} fill="var(--violet)" />
            </g>
          );
        })}
        <line x1={CHART.left} x2={CHART.left + CHART.width} y1={CHART.bottom} y2={CHART.bottom} stroke="var(--violet-deep)" strokeWidth={3} />
      </svg>
      {bins.map((bin, index) => (
        <div key={bin.label} className="text-data" style={{ position: "absolute", left: CHART.left + index * column, width: column, top: CHART.bottom + 16, textAlign: "center", fontSize: 30, color: "var(--ink-muted)" }}>
          {bin.label}
        </div>
      ))}
      <div className="text-figure" style={{ position: "absolute", left: 110, top: 300, fontSize: 220, color: "var(--violet-deep)" }}>{shown}</div>
      <Caption text={`of ${PLANET_OUTCOMES.length} found`} x={120} y={520} frame={frame} at={start + 4} />
      <Annotation text="Smallest: still hard" target={{ x: CHART.left + column * 0.5, y: faintTop - 8 }} offset={{ x: 40, y: -230 }} frame={frame} at={start + 46} color="var(--class-k)" />
    </AbsoluteFill>
  );
}

export function ResultScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const line = scene.lines[0];
  const chartAt = line.from + Math.round(line.durationInFrames * 0.45);
  return (
    <Impact hits={[{ at: chartAt + 14, strength: 0.35, length: 10 }]}>
      <Paper camera={{ x: frame * 2.5, y: -frame * 0.5, scale: 1 }}>
        <TimeBars frame={frame} start={line.from} end={chartAt} />
        <DepthChart frame={frame} start={chartAt} end={scene.durationInFrames + 20} />
      </Paper>
    </Impact>
  );
}
