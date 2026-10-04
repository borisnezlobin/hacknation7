import { APPLICATIONS, STAKES, type Application, type Stake } from "@/lib/future";
import { ScrollStage } from "../ScrollStage";
import { stepStyle } from "@/lib/stepStyle";
import { SourceLinks } from "../SourceLinks";
import { SpectrumDip } from "../SpectrumDip";
import { StarBloom } from "../StarBloom";

function StakeCard({ stake, index }: { stake: Stake; index: number }) {
  const layout = stake.lead ? "md:col-span-2 md:row-span-2 bg-violet-deep text-paper-light" : "bg-paper-light/70";
  const figureTone = stake.lead ? "text-figure text-paper-light" : "text-figure-sm";
  const lineTone = stake.lead ? "text-lede text-paper-light max-w-lg" : "text-body text-ink";
  return (
    <article className={`stage-step fades-in flex flex-col justify-between gap-8 p-6 md:p-8 ${layout}`} style={stepStyle(0.08 + index * 0.05, 5)}>
      <div className="flex flex-col gap-4">
        <span className={`${figureTone} break-words`}>{stake.figure}</span>
        <p className={lineTone}>{stake.line}</p>
      </div>
      <SourceLinks sources={stake.sources} />
    </article>
  );
}

function ApplicationCell({ application }: { application: Application }) {
  const Icon = application.icon;
  return (
    <li className="flex flex-col gap-3 border-t border-ink/15 pt-5">
      <span className="text-small flex items-center gap-2 text-ink">
        <Icon weight="bold" className="size-5 text-violet" aria-hidden="true" />
        {application.domain}
      </span>
      <span className="text-figure-sm text-5xl">{application.figure}</span>
      <span className="text-small">{application.line}</span>
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
        <p className="text-lede relative mt-8 max-w-2xl">
          Billions now fund self-running labs, and their known failure is false discovery. Our loop catches that on its own, and it finds faint periodic signals in any noisy data.
        </p>
        <div className="mt-20 grid gap-4 md:grid-cols-4">
          {STAKES.map((stake, index) => (
            <StakeCard key={stake.figure} stake={stake} index={index} />
          ))}
        </div>
      </ScrollStage>
      <SpectrumDip className="my-16 h-16 w-full md:h-24" bandHeight={10} dipDepth={30} dipCenter={300} dipWidth={120} />
      <div className="mx-auto max-w-7xl px-4 pb-40 md:px-10">
        <h3 className="text-title mb-12">Where the same loop applies</h3>
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-5">
          {APPLICATIONS.map((application) => (
            <ApplicationCell key={application.domain} application={application} />
          ))}
        </ul>
      </div>
    </section>
  );
}
