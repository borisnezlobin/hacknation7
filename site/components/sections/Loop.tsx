import { ArrowsClockwise, LockSimple } from "@phosphor-icons/react/dist/ssr";
import type { CSSProperties } from "react";
import { LOOP_STEPS, POLICIES, type LoopStep } from "@/lib/loop";
import { LabMark } from "../LabMark";
import { Os9Window } from "../Os9Window";
import { ScrollStage } from "../ScrollStage";
import { stepStyle } from "@/lib/stepStyle";

const RING_START = 0.08;
const RING_SPAN = 0.72;

function stepAt(index: number): number {
  return RING_START + (index / LOOP_STEPS.length) * RING_SPAN;
}

function ringPosition(index: number): CSSProperties {
  const angle = (index / LOOP_STEPS.length) * Math.PI * 2 - Math.PI / 2;
  return { left: `${50 + Math.cos(angle) * 42}%`, top: `${50 + Math.sin(angle) * 42}%` };
}

function StepMark({ step }: { step: LoopStep }) {
  const Icon = step.icon;
  return (
    <span className="lights-up grid size-12 shrink-0 place-items-center shadow-[0_6px_18px_rgb(30_28_70/0.2)]" style={{ background: step.color }}>
      <Icon weight="bold" className="size-6 text-paper-light" aria-hidden="true" />
    </span>
  );
}

function RingNode({ step, index }: { step: LoopStep; index: number }) {
  return (
    <li className="stage-step absolute flex w-44 -translate-x-1/2 -translate-y-6 flex-col items-center text-center" style={{ ...ringPosition(index), ...stepStyle(stepAt(index), 10) }}>
      <StepMark step={step} />
      <span className="fades-in mt-2 flex flex-col">
        <span className="text-title text-lg">{step.name}</span>
        <span className="text-small">{step.does}</span>
      </span>
    </li>
  );
}

function ListNode({ step, index }: { step: LoopStep; index: number }) {
  return (
    <li className="stage-step flex items-center gap-4" style={stepStyle(stepAt(index), 10)}>
      <StepMark step={step} />
      <span className="fades-in flex flex-col">
        <span className="text-title text-lg">{step.name}</span>
        <span className="text-small">{step.does}</span>
      </span>
    </li>
  );
}

function Ring() {
  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-[min(72svh,640px)] lg:block">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--violet-deep)" strokeWidth="0.4" strokeDasharray="0.4 2.2" strokeLinecap="round" opacity="0.6" />
      </svg>
      <div className="loop-hand absolute inset-0" aria-hidden="true">
        <span className="absolute top-[8%] left-1/2 block size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gain shadow-[0_0_24px_8px_rgb(243_154_30/0.55)]" />
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <ArrowsClockwise weight="bold" className="loop-spin size-10 text-violet" aria-hidden="true" />
          <span className="text-small max-w-40 text-center">Then it runs again</span>
        </div>
      </div>
      <ol className="absolute inset-0">
        {LOOP_STEPS.map((step, index) => (
          <RingNode key={step.name} step={step} index={index} />
        ))}
      </ol>
    </div>
  );
}

function StepList() {
  return (
    <ol className="relative flex flex-col gap-5 lg:hidden">
      <span aria-hidden="true" className="absolute top-6 bottom-6 left-6 w-px border-l border-dashed border-violet-deep/40" />
      {LOOP_STEPS.map((step, index) => (
        <ListNode key={step.name} step={step} index={index} />
      ))}
    </ol>
  );
}

function PolicyWindows() {
  return (
    <ScrollStage className="mx-auto grid max-w-6xl gap-6 px-4 pb-32 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
      {POLICIES.map((policy, index) => (
        <div key={policy} className="stage-step opens-window" style={stepStyle(0.15 + index * 0.08, 5)}>
          <Os9Window title="Policy" accent="var(--danger)" className="h-full" bodyClassName="flex items-start gap-3 p-4">
            <LockSimple weight="fill" className="mt-0.5 size-5 shrink-0 text-violet-deep" aria-hidden="true" />
            <p className="text-body text-ink">{policy}</p>
          </Os9Window>
        </div>
      ))}
    </ScrollStage>
  );
}

export function Loop() {
  return (
    <section aria-labelledby="loop-heading">
      <ScrollStage mode="pinned" className="relative lg:h-[260svh]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-24 md:px-10 lg:sticky lg:top-0 lg:h-svh lg:flex-row lg:items-center lg:gap-16 lg:py-0">
          <div className="lg:w-80 lg:shrink-0">
            <h2 id="loop-heading" className="text-headline">The research loop</h2>
            <p className="text-body mt-6 flex items-center gap-3">
              <LabMark size={22} />
              Seven specialist agents run on Databricks Omnigent.
            </p>
          </div>
          <div className="flex-1">
            <Ring />
            <StepList />
          </div>
        </div>
      </ScrollStage>
      <PolicyWindows />
    </section>
  );
}
