import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ScrollStage } from "../../ScrollStage";
import { stepStyle } from "@/lib/stepStyle";

const SCALE_MAX = 0.4;
const BASELINE = 0.2224;
const CHAMPION = 0.3489;

function percentOfScale(score: number): string {
  return `${(score / SCALE_MAX) * 100}%`;
}

function ScoreBar({ score, label, tone, at }: { score: number; label: string; tone: string; at: number }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-4">
      <span className="text-small">{label}</span>
      <div className="relative h-10 bg-paper-shade/70">
        <div className={`stage-step grows-x h-full ${tone}`} style={{ ...stepStyle(at, 4), width: percentOfScale(score) }} />
      </div>
    </div>
  );
}

export function ScoreJump() {
  return (
    <ScrollStage className="mx-auto grid max-w-7xl gap-12 px-4 py-28 md:grid-cols-[1.1fr_1fr] md:items-end md:px-10 md:py-40">
      <div>
        <h2 className="text-headline mb-12">Results</h2>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="text-figure-sm text-ink-faint">0.222</span>
          <ArrowRight weight="bold" className="size-10 self-center text-ink-faint" aria-label="to" />
          <span className="text-figure">0.349</span>
        </div>
        <p className="text-lede mt-6 max-w-md">
          One round of agent work raised the dev score by <span className="text-gain">57%</span>.
        </p>
      </div>
      <div className="flex flex-col gap-3 md:pb-6">
        <ScoreBar score={BASELINE} label="Hand-written" tone="bg-ink-faint" at={0.2} />
        <ScoreBar score={CHAMPION} label="Agents" tone="bg-violet" at={0.32} />
      </div>
    </ScrollStage>
  );
}
