export type RunMetrics = {
  score: number;
  planet_recall: number;
  injection_recall: number;
  median_seconds_per_star: number;
  wall_seconds: number;
  n_planets: number;
  n_injected: number;
  n_controls: number;
};

export type ChampionComparison = {
  gained: number;
  lost: number;
  net: number;
  sign_test_p: number;
  score_delta: number;
};

export type Run = {
  run_id: string;
  created: string;
  pipeline: string;
  quick: boolean;
  hypothesis: string | null;
  agent: string | null;
  metrics: RunMetrics;
  vs_champion: ChampionComparison | null;
  promoted: boolean;
};

export type RecordKind =
  | "question"
  | "evidence"
  | "hypothesis"
  | "plan"
  | "result"
  | "decision"
  | "approval"
  | "candidate"
  | "note";

export type RecordEntry = {
  id: string;
  created: string;
  kind: RecordKind;
  agent: string;
  title: string;
  body: string;
  refs: string[];
  data: Record<string, unknown>;
};

export type Lightcurve = {
  hours: number[];
  flux: (number | null)[];
};

export type Rediscovery = {
  toi: string;
  tic: number;
  sector: number;
  period: number;
  depth_ppm: number;
  tmag: number;
  recovered: boolean;
  lightcurve: Lightcurve;
};

export type Candidate = {
  tic: number;
  sector: number;
  period: number;
  depth_ppm: number;
  score: number;
  flags: string[];
  passes: boolean;
  lightcurve: Lightcurve;
};

export type HoldoutRun = {
  run_id: string;
  pipeline: string;
  agent: string;
  metrics: RunMetrics;
};

export type Champion = {
  pipeline: string;
  run_id: string;
  score: number;
  sha256: string;
};

export type Lab = {
  question: string;
  champion: Champion | null;
  runs: Run[];
  record: RecordEntry[];
  holdout: HoldoutRun[];
  rediscoveries: Rediscovery[];
  candidates: Candidate[];
};
