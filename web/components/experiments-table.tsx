import { Crown } from "@phosphor-icons/react";
import type { Lab, Run } from "@/lib/lab-types";
import { formatPValue, formatPercent, formatScore, formatSigned, pipelineName } from "@/lib/format";
import { AgentTag } from "./agent-tag";
import { EmptyState, Section } from "./transit-motif";

const NUMERIC_CELL = "px-3 py-2.5 text-right font-mono text-sm whitespace-nowrap";
const EM_DASH = <span className="text-ink-faint">–</span>;

function PairedComparison({ run }: { run: Run }) {
  const comparison = run.vs_champion;
  if (!comparison) return <td className={NUMERIC_CELL}>{EM_DASH}</td>;
  return (
    <td className={NUMERIC_CELL} title={`${comparison.gained} gained, ${comparison.lost} lost`}>
      <span className={comparison.net > 0 ? "text-accent" : ""}>{formatSigned(comparison.net)}</span>
      <span className="ml-2 text-ink-faint">p {formatPValue(comparison.sign_test_p)}</span>
    </td>
  );
}

function PipelineCell({ run }: { run: Run }) {
  return (
    <td className="px-3 py-2.5 whitespace-nowrap">
      <span className="flex items-center gap-2">
        <span className="font-mono text-sm">{pipelineName(run.pipeline)}</span>
        {run.promoted && <Crown size={16} weight="fill" className="text-accent" aria-label="Promoted" />}
        {run.quick && <span className="rounded-full bg-surface-sunken px-2 text-xs text-ink-muted">Quick</span>}
      </span>
    </td>
  );
}

function ExperimentRow({ run, number }: { run: Run; number: number }) {
  return (
    <tr className={run.promoted ? "bg-accent-soft" : "even:bg-surface-sunken/60"}>
      <td className={`${NUMERIC_CELL} text-ink-faint`}>{number}</td>
      <PipelineCell run={run} />
      <td className="px-3 py-2.5 font-mono text-sm">{run.hypothesis ?? EM_DASH}</td>
      <td className="px-3 py-2.5">
        <AgentTag agent={run.agent} />
      </td>
      <td className={`${NUMERIC_CELL} font-medium`}>{formatScore(run.metrics.score)}</td>
      <td className={NUMERIC_CELL}>{formatPercent(run.metrics.planet_recall)}</td>
      <td className={NUMERIC_CELL}>{formatPercent(run.metrics.injection_recall)}</td>
      <PairedComparison run={run} />
      <td className={NUMERIC_CELL}>{run.metrics.median_seconds_per_star.toFixed(1)}</td>
    </tr>
  );
}

const HEADERS = [
  { label: "#", numeric: true },
  { label: "Pipeline", numeric: false },
  { label: "Tests", numeric: false },
  { label: "Agent", numeric: false },
  { label: "Score", numeric: true },
  { label: "Planet recall", numeric: true },
  { label: "Injection recall", numeric: true },
  { label: "Net vs champion", numeric: true },
  { label: "Seconds per star", numeric: true },
];

export function ExperimentsTable({ lab }: { lab: Lab }) {
  const runs = [...lab.runs].sort((a, b) => a.created.localeCompare(b.created));
  return (
    <Section id="experiments" title="Experiments">
      {runs.length === 0 ? (
        <EmptyState>Every scored pipeline gets a row, with its paired comparison against the champion it tried to beat.</EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-detail">
                {HEADERS.map((header) => (
                  <th key={header.label} scope="col" className={`px-3 pt-4 pb-2 font-medium whitespace-nowrap ${header.numeric ? "text-right" : ""}`}>
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => (
                <ExperimentRow key={run.run_id} run={run} number={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
