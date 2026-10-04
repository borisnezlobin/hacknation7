import { APPLICATIONS, STAKES, type Application, type Stake } from "@/lib/future";
import { stepStyle } from "@/lib/stepStyle";
import { ScrollStage } from "../ScrollStage";
import { SourceLinks } from "../SourceLinks";
import { SpectrumDip } from "../SpectrumDip";
import { StarBloom } from "../StarBloom";

const LEAD_CARD = { layout: "md:col-span-2 bg-violet-deep", figure: "text-figure-lead text-paper-light", line: "text-lede text-paper-light max-w-md", link: "text-paper-light/70 hover:text-paper-light" };
const PLAIN_CARD = { layout: "bg-paper-light/70", figure: "text-figure-card", line: "text-body text-ink", link: undefined };

function StakeFigure({ stake, className }: { stake: Stake; className: string }) {
  return (
    <span className="flex flex-col gap-1">
      <span className={className}>{stake.figure}</span>
      {stake.figureNote && <span className="text-lede text-ink-muted whitespace-nowrap">{stake.figureNote}</span>}
    </span>
  );
}

function StakeCard({ stake, index }: { stake: Stake; index: number }) {
  const look = stake.lead ? LEAD_CARD : PLAIN_CARD;
  return (
    <article className={`@container stage-step fades-in flex flex-col justify-between gap-6 p-6 md:p-8 ${look.layout}`} style={stepStyle(0.08 + index * 0.05, 5)}>
      <div className="flex flex-col gap-3">
        <StakeFigure stake={stake} className={look.figure} />
        <p className={look.line}>{stake.line}</p>
      </div>
      <SourceLinks sources={stake.sources} tone={look.link} />
    </article>
  );
}

function ApplicationCell({ application }: { application: Application }) {
  return (
    <li className="@container flex flex-col gap-3 border-t border-ink/15 pt-5">
      <span className="text-figure-card">{application.figure}</span>
      <p className="text-body text-ink">{application.line}</p>
      <SourceLinks sources={application.sources} />
    </li>
  );
}

export function Future() {
  return (
    <section aria-labelledby="future-heading" className="relative overflow-hidden">
      <ScrollStage className="relative mx-auto max-w-7xl px-4 pt-32 pb-20 md:px-10 md:pt-48">
        <StarBloom seed={42} color="var(--class-g)" specks={4} className="drifts absolute -top-10 right-[-20%] w-[70vw] max-w-[620px] opacity-80 md:right-0" style={{ "--dy": "-200px" } as React.CSSProperties} />
        <h2 id="future-heading" className="text-headline relative max-w-3xl">Autonomous science needs a skeptic</h2>
        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {STAKES.map((stake, index) => (
            <StakeCard key={stake.figure} stake={stake} index={index} />
          ))}
        </div>
      </ScrollStage>
      <SpectrumDip className="my-16 h-16 w-full md:h-24" bandHeight={10} dipDepth={30} dipCenter={300} dipWidth={120} />
      <div className="mx-auto max-w-7xl px-4 pb-40 md:px-10">
        <p className="text-lede mb-14 max-w-2xl">The same loop finds faint periodic signals in any noisy data.</p>
        <ul className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {APPLICATIONS.map((application) => (
            <ApplicationCell key={application.figure} application={application} />
          ))}
        </ul>
      </div>
    </section>
  );
}
