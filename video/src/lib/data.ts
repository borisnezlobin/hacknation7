import labJson from "../../public/data/lab.json";
import lightCurvesJson from "../../public/data/lightcurves.json";
import starFieldJson from "../../public/data/starfield.json";

export type LightCurveData = {
  label: string;
  tic: number;
  sector: number;
  toi: number | null;
  tmag: number | null;
  period: number | null;
  t0: number | null;
  duration: number | null;
  depth_ppm: number | null;
  time: number[];
  flux: number[];
  flattened: number[];
};

export type LightCurves = Record<"hero" | "shallow" | "missedDeep" | "systematic", LightCurveData>;

export type StarFieldData = { sector: number; total_stars: number; ra: number[]; dec: number[] };

export type RunSummary = {
  run_id: string;
  created: string;
  pipeline: string;
  quick: boolean;
  promoted: boolean;
  metrics: { score: number; planet_recall: number; injection_recall: number; median_seconds_per_star: number };
};

export type RecordEntry = { id: string; kind: string; agent: string; title: string; body: string; refs: string[]; data: Record<string, unknown> };

export type HoldoutEntry = Record<string, unknown>;

export type LabData = {
  question: string;
  champion: { pipeline: string; run_id: string; score: number };
  runs: RunSummary[];
  record: RecordEntry[];
  holdout: HoldoutEntry[];
  rediscoveries: Record<string, unknown>[];
  candidates: Record<string, unknown>[];
};

export const LIGHT_CURVES = lightCurvesJson as unknown as LightCurves;
export const STAR_FIELD = starFieldJson as unknown as StarFieldData;
export const LAB = labJson as unknown as LabData;

export function runById(runId: string): RunSummary | undefined {
  return LAB.runs.find((run) => run.run_id === runId);
}

export function recordById(id: string): RecordEntry | undefined {
  return LAB.record.find((entry) => entry.id === id);
}
