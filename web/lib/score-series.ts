import type { Lab, Run } from "./lab-types";

export type RunKind = "promoted" | "full" | "quick";

export type ScorePoint = {
  index: number;
  run: Run;
  kind: RunKind;
};

export type ScoreSeries = {
  points: ScorePoint[];
  championSteps: { index: number; score: number }[];
  holdoutScore: number | null;
  baselineScore: number | null;
  championScore: number | null;
  latestScore: number | null;
};

function runKind(run: Run): RunKind {
  if (run.promoted) return "promoted";
  return run.quick ? "quick" : "full";
}

export function buildScoreSeries(lab: Lab): ScoreSeries {
  const ordered = [...lab.runs].sort((a, b) => a.created.localeCompare(b.created));
  const points = ordered.map((run, index) => ({ index, run, kind: runKind(run) }));
  const championSteps = points
    .filter((point) => point.kind === "promoted")
    .map((point) => ({ index: point.index, score: point.run.metrics.score }));
  const lastHoldout = lab.holdout.at(-1);
  return {
    points,
    championSteps,
    holdoutScore: lastHoldout ? lastHoldout.metrics.score : null,
    baselineScore: championSteps[0]?.score ?? null,
    championScore: lab.champion?.score ?? championSteps.at(-1)?.score ?? null,
    latestScore: points.at(-1)?.run.metrics.score ?? null,
  };
}

export function niceTicks(min: number, max: number, count = 4): number[] {
  const rawStep = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep;
  const ticks: number[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max + 1e-9; value += step) ticks.push(Number(value.toFixed(6)));
  return ticks;
}

export function scoreDomain(series: ScoreSeries): [number, number] {
  const scores = series.points.map((point) => point.run.metrics.score);
  if (series.holdoutScore !== null) scores.push(series.holdoutScore);
  if (scores.length === 0) return [0, 0.5];
  const low = Math.max(0, Math.floor((Math.min(...scores) - 0.03) * 20) / 20);
  const high = Math.ceil((Math.max(...scores) + 0.02) * 20) / 20;
  return [low, high];
}
