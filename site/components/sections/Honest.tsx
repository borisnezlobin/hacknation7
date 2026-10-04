import { ScrollStage } from "../ScrollStage";
import { stepStyle } from "@/lib/stepStyle";

const SCALE_MAX = 0.3;

function HoldoutBar({ label, score, tone, at }: { label: string; score: number; tone: string; at: number }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-4">
      <span className="text-small">{label}</span>
      <div className="h-6 bg-paper-shade/70">
        <div className={`stage-step grows-x h-full ${tone}`} style={{ ...stepStyle(at, 4), width: `${(score / SCALE_MAX) * 100}%` }} />
      </div>
      <span className="text-data text-right">{score.toFixed(3)}</span>
    </div>
  );
}

export function Honest() {
  return (
    <ScrollStage as="section" className="mx-auto grid max-w-7xl gap-10 px-4 py-24 md:grid-cols-2 md:items-center md:px-10 md:py-32" >
      <h2 className="sr-only">The honest part</h2>
      <p className="text-lede max-w-xl">
        On the sealed holdout the hand-written baseline still won, and it caught that before any claim went out.
      </p>
      <div className="flex flex-col gap-3">
        <HoldoutBar label="Hand-written" score={0.263} tone="bg-ink" at={0.2} />
        <HoldoutBar label="Agents" score={0.209} tone="bg-violet/60" at={0.3} />
      </div>
    </ScrollStage>
  );
}
