import { Binoculars } from "@phosphor-icons/react/dist/ssr";
import candidates from "@/data/candidates.json";
import { LightCurvePlot } from "../../LightCurvePlot";
import { Os9Window } from "../../Os9Window";

type Candidate = {
  tic: number;
  period: number;
  depth_ppm: number;
  score: number;
  flags: string[];
  passes: boolean;
  lightcurve: { hours: number[]; flux: number[] };
};

const CANDIDATES = candidates as Candidate[];

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <Binoculars weight="duotone" className="size-12 text-violet" aria-hidden="true" />
      <p className="text-title max-w-md">The discovery search is still running.</p>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const label = `TIC ${candidate.tic}`;
  return (
    <Os9Window title={label} accent={candidate.passes ? "var(--stem)" : "var(--ink-faint)"} bodyClassName="p-3">
      <LightCurvePlot curve={{ ...candidate.lightcurve, depthPpm: candidate.depth_ppm }} label={`Folded light curve of ${label}`} className="w-full" />
      <dl className="text-data mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <dt className="sr-only">Period</dt>
        <dd>{candidate.period.toFixed(2)} d</dd>
        <dt className="sr-only">Depth</dt>
        <dd className="text-right">{Math.round(candidate.depth_ppm).toLocaleString("en-US")} ppm</dd>
        <dt className="sr-only">Score</dt>
        <dd>score {candidate.score.toFixed(1)}</dd>
        <dt className="sr-only">Vetting</dt>
        <dd className="text-right">{candidate.passes ? "passes vetting" : candidate.flags.join(", ")}</dd>
      </dl>
    </Os9Window>
  );
}

export function Candidates() {
  return (
    <section aria-labelledby="candidates-heading" className="mx-auto max-w-7xl px-4 pb-28 md:px-10 md:pb-40">
      <h3 id="candidates-heading" className="text-title mb-2">New candidate</h3>
      <p className="text-body mb-8 max-w-2xl">
        The lab searched 1,499 unlabelled stars, and one transit-shaped signal survived vetting. It is unconfirmed and needs follow-up observations.
      </p>
      {CANDIDATES.length === 0 ? (
        <Os9Window title="Discovery search" accent="var(--stem)">
          <EmptyState />
        </Os9Window>
      ) : (
        <div className="grid max-w-md grid-cols-1 gap-4">
          {CANDIDATES.map((candidate) => (
            <CandidateCard key={candidate.tic} candidate={candidate} />
          ))}
        </div>
      )}
    </section>
  );
}
