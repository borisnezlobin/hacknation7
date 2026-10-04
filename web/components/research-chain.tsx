"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowSquareOut, CheckCircle, Circle, LinkSimple, Robot } from "@phosphor-icons/react";
import type { Lab, RecordEntry, RecordKind } from "@/lib/lab-types";
import { isAgentAuthored } from "@/lib/agents";
import { KIND_DETAILS, citationLink, numberField, planOptions, resultMetrics } from "@/lib/research";
import { formatPercent, formatScore, formatTime } from "@/lib/format";
import { AgentTag } from "./agent-tag";
import { EmptyState, Section } from "./transit-motif";

type EntryIndex = Map<string, RecordEntry>;

function defaultSelection(record: RecordEntry[]): string | null {
  const latestDecision = [...record].reverse().find((entry) => entry.kind === "decision");
  return (latestDecision ?? record.at(-1))?.id ?? null;
}

function AgentGeneratedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium text-ink-muted">
      <Robot size={14} weight="bold" aria-hidden />
      Agent-generated
    </span>
  );
}

function isAgentHypothesis(entry: RecordEntry) {
  return entry.kind === "hypothesis" && isAgentAuthored(entry.agent);
}

function KindIcon({ kind, emphasized }: { kind: RecordKind; emphasized: boolean }) {
  const KindGlyph = KIND_DETAILS[kind].icon;
  const tone = emphasized ? "bg-accent text-surface-raised" : "bg-surface-raised text-ink-muted shadow-card";
  return (
    <span className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
      <KindGlyph size={16} weight="bold" aria-label={KIND_DETAILS[kind].label} />
    </span>
  );
}

function rowTone(isSelected: boolean, isCited: boolean) {
  if (isSelected) return "bg-surface-raised shadow-card ring-2 ring-accent";
  if (isCited) return "bg-accent-soft";
  return "hover:bg-surface-sunken";
}

function EntryRow({ entry, isSelected, isCited, onSelect }: { entry: RecordEntry; isSelected: boolean; isCited: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={isSelected} className={`focus-ring flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors ${rowTone(isSelected, isCited)}`}>
      <KindIcon kind={entry.kind} emphasized={isSelected} />
      <span className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
        <span className="flex items-baseline gap-2">
          <span className="text-data shrink-0 text-ink-faint">{entry.id}</span>
          <span className="font-medium text-pretty">{entry.title}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <AgentTag agent={entry.agent} />
          {isAgentHypothesis(entry) && <AgentGeneratedBadge />}
        </span>
      </span>
      {isCited && <LinkSimple size={18} weight="bold" className="mt-1.5 shrink-0 text-accent" aria-label="Cited by the selected entry" />}
    </button>
  );
}

function RefChips({ ids, index, onSelect }: { ids: string[]; index: EntryIndex; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          disabled={!index.has(id)}
          title={index.get(id)?.title}
          className="focus-ring text-data rounded-full bg-surface-sunken px-3 py-1 hover:bg-accent-soft disabled:opacity-50"
        >
          {id}
        </button>
      ))}
    </div>
  );
}

function PlanOptions({ entry, index }: { entry: RecordEntry; index: EntryIndex }) {
  const options = planOptions(entry);
  if (options.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {options.map((option) => (
        <li key={option.id} className={`flex items-start gap-2 rounded-lg p-2 ${option.chosen ? "bg-accent-soft" : "bg-surface-sunken text-ink-faint"}`}>
          {option.chosen ? (
            <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" aria-label="Chosen" />
          ) : (
            <Circle size={18} className="mt-0.5 shrink-0" aria-label="Not chosen" />
          )}
          <span className="text-sm">
            <span className="text-data mr-2">{option.id}</span>
            <span className={option.chosen ? "text-ink" : "line-through decoration-ink-faint/60"}>{index.get(option.id)?.title ?? "Unrecorded option"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function KeyValues({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-ink-muted">{key}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HypothesisFacts({ entry }: { entry: RecordEntry }) {
  const gain = numberField(entry.data, "expected_gain");
  const cost = numberField(entry.data, "cost_minutes");
  const rows: [string, string][] = [];
  if (gain !== null) rows.push(["Expected gain", `+${gain}`]);
  if (cost !== null) rows.push(["Cost", `${cost} experiment-minutes`]);
  return <KeyValues rows={rows} />;
}

function ResultFacts({ entry }: { entry: RecordEntry }) {
  const metrics = resultMetrics(entry);
  if (!metrics) return null;
  const rows: [string, string][] = [];
  if (typeof metrics.score === "number") rows.push(["Score", formatScore(metrics.score)]);
  if (typeof metrics.planet_recall === "number") rows.push(["Planet recall", formatPercent(metrics.planet_recall)]);
  if (typeof metrics.injection_recall === "number") rows.push(["Injection recall", formatPercent(metrics.injection_recall)]);
  return <KeyValues rows={rows} />;
}

function Citation({ entry }: { entry: RecordEntry }) {
  const link = citationLink(entry.data);
  if (!link) return null;
  return (
    <a href={link.href} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1.5 self-start rounded text-sm font-medium text-accent hover:underline">
      {link.label}
      <ArrowSquareOut size={14} weight="bold" aria-hidden />
    </a>
  );
}

const KIND_FACTS: Partial<Record<RecordKind, (props: { entry: RecordEntry; index: EntryIndex }) => ReactNode>> = {
  plan: PlanOptions,
  hypothesis: HypothesisFacts,
  result: ResultFacts,
  evidence: Citation,
};

function EntryDetail({ entry, index, citedBy, onSelect }: { entry: RecordEntry; index: EntryIndex; citedBy: string[]; onSelect: (id: string) => void }) {
  const Facts = KIND_FACTS[entry.kind];
  return (
    <article className="card flex flex-col gap-4 p-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-data text-ink-faint">{entry.id}</span>
          <span className="text-detail">{KIND_DETAILS[entry.kind].label}</span>
          {isAgentHypothesis(entry) && <AgentGeneratedBadge />}
        </div>
        <h3 className="text-lg font-semibold text-balance">{entry.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3">
          <AgentTag agent={entry.agent} />
          <time dateTime={entry.created} className="text-detail text-ink-faint">
            {formatTime(entry.created)}
          </time>
        </div>
      </header>
      {entry.body && <p className="text-body">{entry.body}</p>}
      {Facts && <Facts entry={entry} index={index} />}
      {entry.refs.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-detail">Builds on</h4>
          <RefChips ids={entry.refs} index={index} onSelect={onSelect} />
        </div>
      )}
      {citedBy.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-detail">Cited by</h4>
          <RefChips ids={citedBy} index={index} onSelect={onSelect} />
        </div>
      )}
    </article>
  );
}

export function ResearchChain({ lab }: { lab: Lab }) {
  const index = useMemo(() => new Map(lab.record.map((entry) => [entry.id, entry])), [lab.record]);
  const [selectedId, setSelectedId] = useState<string | null>(() => defaultSelection(lab.record));
  const selected = selectedId ? index.get(selectedId) ?? null : null;
  const selectAndReveal = (id: string) => {
    setSelectedId(id);
    requestAnimationFrame(() => document.getElementById(`entry-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };
  const cited = new Set(selected?.refs ?? []);
  const citedBy = lab.record.filter((entry) => selectedId && entry.refs.includes(selectedId)).map((entry) => entry.id);

  if (lab.record.length === 0) {
    return (
      <Section id="record" title="Research record">
        <EmptyState>Questions, evidence, hypotheses and decisions appear here as the agents write them.</EmptyState>
      </Section>
    );
  }

  const detail = selected && <EntryDetail entry={selected} index={index} citedBy={citedBy} onSelect={selectAndReveal} />;

  return (
    <Section id="record" title="Research record">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <ol className="relative flex flex-col gap-1 self-start before:absolute before:top-4 before:bottom-4 before:left-6 before:w-px before:bg-line">
          {lab.record.map((entry) => (
            <li key={entry.id} id={`entry-${entry.id}`} className="flex scroll-m-6 flex-col gap-2">
              <EntryRow entry={entry} isSelected={entry.id === selectedId} isCited={cited.has(entry.id)} onSelect={() => setSelectedId(entry.id)} />
              {entry.id === selectedId && <div className="relative z-10 lg:hidden">{detail}</div>}
            </li>
          ))}
        </ol>
        <aside className="hidden lg:block">
          <div className="sticky top-6">{detail}</div>
        </aside>
      </div>
    </Section>
  );
}
