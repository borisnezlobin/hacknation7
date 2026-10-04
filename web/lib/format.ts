export const formatScore = (value: number) => value.toFixed(3);

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const formatSigned = (value: number) => `${value > 0 ? "+" : ""}${value}`;

export const formatSignedScore = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(3)}`;

export const formatPValue = (value: number) => (value < 0.001 ? "<0.001" : value.toFixed(3));

export const pipelineName = (path: string) => path.replace(/^pipelines\//, "").replace(/\.py$/, "");

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
