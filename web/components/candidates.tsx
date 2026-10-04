import { CheckCircle, Warning } from "@phosphor-icons/react";
import type { Candidate, Lab } from "@/lib/lab-types";
import { LightcurvePlot } from "./lightcurve-plot";
import { EmptyState, Section } from "./transit-motif";

const humanize = (flag: string) => flag.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());

function VettingFlags({ candidate }: { candidate: Candidate }) {
  if (candidate.passes) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
        <CheckCircle size={16} weight="fill" aria-hidden />
        Passes vetting
      </p>
    );
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {candidate.flags.map((flag) => (
        <li key={flag} className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-ink-muted">
          <Warning size={12} weight="bold" aria-hidden />
          {humanize(flag)}
        </li>
      ))}
    </ul>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <li className={`flex flex-col gap-3 rounded-xl p-4 ${candidate.passes ? "bg-surface-raised shadow-card" : "bg-surface-sunken"}`}>
      <div className="aspect-[5/2]">
        <LightcurvePlot lightcurve={candidate.lightcurve} highlighted={candidate.passes} label={`TIC ${candidate.tic} folded light curve`} />
      </div>
      <p className="text-data">TIC {candidate.tic}</p>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-ink-muted">Period</dt>
          <dd className="font-medium">{candidate.period.toFixed(2)} d</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Depth</dt>
          <dd className="font-medium">{Math.round(candidate.depth_ppm).toLocaleString()} ppm</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Signal</dt>
          <dd className="font-medium">{candidate.score.toFixed(1)}</dd>
        </div>
      </dl>
      <VettingFlags candidate={candidate} />
    </li>
  );
}

export function Candidates({ lab }: { lab: Lab }) {
  const candidates = [...lab.candidates].sort((a, b) => Number(b.passes) - Number(a.passes) || b.score - a.score);
  const passing = candidates.filter((candidate) => candidate.passes).length;
  return (
    <Section
      id="candidates"
      title="New candidates"
      aside={candidates.length > 0 && <p className="text-detail">{passing} of {candidates.length} pass every vetting check</p>}
    >
      {candidates.length === 0 ? (
        <EmptyState>The vetter searches 1,499 unlabelled stars after the holdout run. Signals that survive vetting land here.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <CandidateCard key={`${candidate.tic}-${candidate.sector}`} candidate={candidate} />
          ))}
        </ul>
      )}
    </Section>
  );
}
