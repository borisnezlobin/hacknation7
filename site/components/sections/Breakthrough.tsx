import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { stepStyle } from "@/lib/stepStyle";
import { ScrollStage } from "../ScrollStage";
import { SourceLinks } from "../SourceLinks";

const A_LAB_SOURCES = [
  { label: "Nature 2023", href: "https://www.nature.com/articles/s41586-023-06734-w" },
  { label: "Chemistry World", href: "https://www.chemistryworld.com/news/new-analysis-raises-doubts-over-autonomous-labs-materials-discoveries/4018791.article" },
];

function TheirClaim() {
  return (
    <div className="@container flex flex-col gap-3">
      <span className="text-figure-lead text-ink-faint">41 → 0</span>
      <span className="flex items-center gap-2">
        <span className="text-small">New compounds an autonomous lab claimed in Nature, and the number that held up</span>
        <SourceLinks sources={A_LAB_SOURCES} />
      </span>
    </div>
  );
}

function OurCatch() {
  return (
    <div className="@container stage-step flex flex-col gap-3" style={stepStyle(0.3, 4)}>
      <span className="relative w-fit">
        <span className="text-figure-lead text-violet">+57%</span>
        <span aria-hidden="true" className="grows-x absolute top-1/2 left-0 h-2 w-full -rotate-6 bg-danger" />
      </span>
      <span className="text-small flex items-center gap-2">
        <ShieldCheck weight="fill" className="size-5 shrink-0 text-violet" aria-hidden="true" />
        Our own dev gain, which our sealed holdout rejected
      </span>
    </div>
  );
}

export function Breakthrough() {
  return (
    <ScrollStage as="section" className="mx-auto max-w-7xl px-4 py-28 md:px-10 md:py-40">
      <h2 className="text-headline max-w-3xl">A lab that can&rsquo;t fool itself</h2>
      <p className="text-lede mt-6 max-w-2xl">
        Planet lab caught its own false discovery before claiming it. Autonomous science needs that check to run unattended.
      </p>
      <div className="mt-16 grid gap-14 md:grid-cols-2">
        <TheirClaim />
        <OurCatch />
      </div>
      <div className="mt-16 flex w-fit flex-col gap-2 bg-paper-light/70 p-6 md:p-8">
        <span className="text-figure-sm">19 min</span>
        <span className="text-small">is the median time from a hypothesis to its first scored result.</span>
      </div>
    </ScrollStage>
  );
}
