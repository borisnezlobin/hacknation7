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
    <section aria-labelledby="candidates-heading" className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-28 pt-4 md:grid-cols-2 md:px-10 md:pb-40 md:pt-8">
      <div>
        <h2 id="candidates-heading" className="text-headline mb-6">Real Breakthrough Potential</h2>
        <p className="text-title max-w-xl">
          We searched 1,499 unlabelled stars and found a signal nobody had catalogued before. It could be a new planet, and it needs human review to find out.
        </p>
      </div>
      {CANDIDATES.length === 0 ? (
        <Os9Window title="Discovery search" accent="var(--stem)">
          <EmptyState />
        </Os9Window>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {CANDIDATES.map((candidate) => (
            <CandidateCard key={candidate.tic} candidate={candidate} />
          ))}
        </div>
      )}
    </section>
  );
}
