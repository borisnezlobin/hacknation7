"use client";

import { useState } from "react";
import type { Lab } from "@/lib/lab-types";
import { buildScoreSeries, niceTicks, scoreDomain, type ScorePoint, type ScoreSeries } from "@/lib/score-series";
import { formatPValue, formatScore, formatSigned, formatSignedScore, pipelineName } from "@/lib/format";
import { useElementWidth } from "@/lib/use-element-width";
import { AgentTag } from "./agent-tag";
import { EmptyState, Section } from "./transit-motif";

const MARGIN = { top: 24, right: 24, bottom: 36, left: 44 };

type Scales = {
  x: (index: number) => number;
  y: (score: number) => number;
  innerBottom: number;
  ticks: number[];
};

function buildScales(series: ScoreSeries, width: number, height: number): Scales {
  const slots = series.points.length + (series.holdoutScore === null ? 0 : 1);
  const step = (width - MARGIN.left - MARGIN.right) / Math.max(slots, 1);
  const [low, high] = scoreDomain(series);
  const innerBottom = height - MARGIN.bottom;
  return {
    x: (index) => MARGIN.left + (index + 0.5) * step,
    y: (score) => innerBottom - ((score - low) / (high - low)) * (innerBottom - MARGIN.top),
    innerBottom,
    ticks: niceTicks(low, high),
  };
}

function championPath(series: ScoreSeries, scales: Scales): string {
  const [first, ...rest] = series.championSteps;
  if (!first) return "";
  const lastIndex = series.points.length - 1 + (series.holdoutScore === null ? 0 : 0.5);
  const segments = rest.map((step) => `H${scales.x(step.index)} V${scales.y(step.score)}`);
  return `M${scales.x(first.index)} ${scales.y(first.score)} ${segments.join(" ")} H${scales.x(lastIndex)}`;
}

function Hero({ series }: { series: ScoreSeries }) {
  const kept = series.points.filter((point) => point.kind === "promoted").length;
  if (series.championScore === null) {
    return (
      <dl className="flex flex-col gap-1">
        <dt className="text-detail">Latest run, no champion yet</dt>
        <dd className="text-display text-ink-faint">{series.latestScore === null ? "–" : formatScore(series.latestScore)}</dd>
        <dd className="text-detail">The first promoted full run becomes the baseline the agents try to beat.</dd>
      </dl>
    );
  }
  const gain = series.baselineScore === null ? 0 : series.championScore - series.baselineScore;
  return (
    <dl className="flex flex-wrap items-end gap-x-10 gap-y-4">
      <div className="flex flex-col gap-1">
        <dt className="text-detail">Champion score</dt>
        <dd className="text-display">{formatScore(series.championScore)}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-detail">Since baseline</dt>
        <dd className="text-2xl font-semibold text-accent">{formatSignedScore(gain)}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-detail">Experiments kept</dt>
        <dd className="text-2xl font-semibold">
          {kept} <span className="text-ink-faint">of {series.points.length}</span>
        </dd>
      </div>
    </dl>
  );
}

type LegendKind = "champion" | "promoted" | "full" | "quick" | "holdout";

function LegendSwatch({ kind }: { kind: LegendKind }) {
  const shapes = {
    champion: <path d="M1 9 H7 V3 H15" stroke="var(--accent)" strokeWidth={2} fill="none" />,
    promoted: <circle cx={8} cy={6} r={4} fill="var(--accent)" />,
    full: <circle cx={8} cy={6} r={3.5} fill="var(--ink-faint)" />,
    quick: <circle cx={8} cy={6} r={3.25} fill="none" stroke="var(--ink-faint)" strokeWidth={1.5} />,
    holdout: <path d="M8 1.5 L12.5 6 L8 10.5 L3.5 6 Z" fill="var(--ink)" />,
  };
  return (
    <svg viewBox="0 0 16 12" className="h-3 w-4" aria-hidden>
      {shapes[kind]}
    </svg>
  );
}

function Legend({ hasHoldout }: { hasHoldout: boolean }) {
  const items: { kind: LegendKind; label: string }[] = [
    { kind: "champion", label: "Champion" },
    { kind: "promoted", label: "Promoted" },
    { kind: "full", label: "Full run, not kept" },
    { kind: "quick", label: "Quick run (a third of dev)" },
    ...(hasHoldout ? [{ kind: "holdout" as const, label: "Blind holdout" }] : []),
  ];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map((item) => (
        <li key={item.kind} className="flex items-center gap-2 text-detail">
          <LegendSwatch kind={item.kind} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function PointMark({ point, scales, active }: { point: ScorePoint; scales: Scales; active: boolean }) {
  const cx = scales.x(point.index);
  const cy = scales.y(point.run.metrics.score);
  const radius = active ? 6.5 : 5;
  const styles = {
    promoted: { fill: "var(--accent)", stroke: "var(--surface-raised)", strokeWidth: 2 },
    full: { fill: "var(--ink-faint)", stroke: "var(--surface-raised)", strokeWidth: 2 },
    quick: { fill: "var(--surface-raised)", stroke: "var(--ink-faint)", strokeWidth: 1.5 },
  };
  return (
    <>
      {active && <circle cx={cx} cy={cy} r={10} fill="none" stroke="var(--accent)" strokeWidth={1.5} opacity={0.6} />}
      <circle cx={cx} cy={cy} r={radius} {...styles[point.kind]} />
    </>
  );
}

function PointTooltip({ point, scales, width }: { point: ScorePoint; scales: Scales; width: number }) {
  const left = Math.min(Math.max(scales.x(point.index) - 120, 0), width - 240);
  const top = scales.y(point.run.metrics.score) + 14;
  const comparison = point.run.vs_champion;
  return (
    <div className="card pointer-events-none absolute z-10 flex w-60 flex-col gap-2 p-3 text-sm" style={{ left, top }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-data truncate">{pipelineName(point.run.pipeline)}</span>
        <AgentTag agent={point.run.agent} showLabel={false} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-detail">
        <dt>Score</dt>
        <dd className="font-medium text-ink">{formatScore(point.run.metrics.score)}</dd>
        {point.run.hypothesis && (
          <>
            <dt>Tests</dt>
            <dd className="text-data">{point.run.hypothesis}</dd>
          </>
        )}
        {comparison && (
          <>
            <dt>Net targets</dt>
            <dd>
              {formatSigned(comparison.net)} <span className="text-ink-faint">p {formatPValue(comparison.sign_test_p)}</span>
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}

function YAxis({ scales, width }: { scales: Scales; width: number }) {
  return (
    <g>
      {scales.ticks.map((tick) => (
        <g key={tick}>
          <line x1={MARGIN.left} x2={width - MARGIN.right} y1={scales.y(tick)} y2={scales.y(tick)} stroke="var(--line)" strokeDasharray={tick === scales.ticks[0] ? undefined : "2 4"} />
          <text x={MARGIN.left - 8} y={scales.y(tick)} dy="0.32em" textAnchor="end" className="fill-ink-faint text-xs">
            {tick.toFixed(2)}
          </text>
        </g>
      ))}
    </g>
  );
}

const MIN_TICK_SPACING = 32;

function visibleTickIndexes(series: ScoreSeries, scales: Scales): Set<number> {
  const step = scales.x(1) - scales.x(0);
  const every = Math.max(1, Math.ceil(MIN_TICK_SPACING / step));
  const holdoutClearance = series.holdoutScore === null ? 0 : Math.ceil(48 / step);
  const lastAllowed = series.points.length - holdoutClearance;
  return new Set(series.points.map((point) => point.index).filter((index) => index % every === 0 && index <= lastAllowed));
}

function XAxis({ series, scales }: { series: ScoreSeries; scales: Scales }) {
  const visible = visibleTickIndexes(series, scales);
  return (
    <g>
      {series.points
        .filter((point) => visible.has(point.index))
        .map((point) => (
          <text key={point.index} x={scales.x(point.index)} y={scales.innerBottom + 18} textAnchor="middle" className="fill-ink-faint text-xs">
            {point.index + 1}
          </text>
        ))}
    </g>
  );
}

function HoldoutMark({ series, scales }: { series: ScoreSeries; scales: Scales }) {
  if (series.holdoutScore === null) return null;
  const cx = scales.x(series.points.length);
  const cy = scales.y(series.holdoutScore);
  return (
    <g>
      <line x1={cx} x2={cx} y1={MARGIN.top} y2={scales.innerBottom} stroke="var(--line)" />
      <path d={`M${cx} ${cy - 7} L${cx + 7} ${cy} L${cx} ${cy + 7} L${cx - 7} ${cy} Z`} fill="var(--ink)" stroke="var(--surface-raised)" strokeWidth={2} />
      <text x={cx} y={cy + 20} textAnchor="middle" className="fill-ink text-xs font-semibold">
        {formatScore(series.holdoutScore)}
      </text>
      <text x={cx} y={scales.innerBottom + 18} textAnchor="middle" className="fill-ink-muted text-xs">
        Holdout
      </text>
    </g>
  );
}

function ScoreChart({ series }: { series: ScoreSeries }) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const height = width < 520 ? 240 : 300;
  const scales = buildScales(series, width, height);
  const activePoint = activeIndex === null ? null : series.points[activeIndex];
  const pathLength = 4000;

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setActiveIndex(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Score of every dev run in order, with the champion score as a step line">
          <YAxis scales={scales} width={width} />
          <XAxis series={series} scales={scales} />
          <path
            d={championPath(series, scales)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="animate-draw-in"
            style={{ ["--path-length" as string]: pathLength }}
          />
          <HoldoutMark series={series} scales={scales} />
          {series.points.map((point) => (
            <g
              key={point.run.run_id}
              tabIndex={0}
              role="button"
              aria-label={`Run ${point.index + 1}, ${pipelineName(point.run.pipeline)}, score ${formatScore(point.run.metrics.score)}`}
              onMouseEnter={() => setActiveIndex(point.index)}
              onFocus={() => setActiveIndex(point.index)}
              onBlur={() => setActiveIndex(null)}
              className="cursor-default outline-none"
            >
              <circle cx={scales.x(point.index)} cy={scales.y(point.run.metrics.score)} r={14} fill="transparent" />
              <PointMark point={point} scales={scales} active={activeIndex === point.index} />
            </g>
          ))}
        </svg>
      )}
      {activePoint && <PointTooltip point={activePoint} scales={scales} width={width} />}
    </div>
  );
}

export function ScoreClimb({ lab }: { lab: Lab }) {
  const series = buildScoreSeries(lab);
  return (
    <Section id="score" title="Score over the loop" aside={series.points.length > 0 && <Legend hasHoldout={series.holdoutScore !== null} />}>
      <Hero series={series} />
      {series.points.length === 0 ? (
        <EmptyState>Each dev run lands here as a dot. Promoted runs lift the champion line.</EmptyState>
      ) : (
        <div className="card p-4 sm:p-6">
          <ScoreChart series={series} />
        </div>
      )}
    </Section>
  );
}
