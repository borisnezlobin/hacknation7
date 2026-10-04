import { ProhibitInset } from "@phosphor-icons/react/dist/ssr";
import { Os9Window } from "../../Os9Window";
import { ScrollStage } from "../../ScrollStage";
import { stepStyle } from "@/lib/stepStyle";

function Guardrail({ title, line, at }: { title: string; line: string; at: number }) {
  return (
    <div className="stage-step opens-window" style={stepStyle(at, 5)}>
      <Os9Window title={title} accent="var(--danger)" bodyClassName="flex items-start gap-3 p-4">
        <ProhibitInset weight="fill" className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
        <p className="text-body text-ink">{line}</p>
      </Os9Window>
    </div>
  );
}

export function FalseLead() {
  return (
    <ScrollStage className="mx-auto max-w-7xl px-4 py-28 md:px-10 md:py-40">
      <p className="text-lede max-w-xl">The lab catches its own false leads.</p>
      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-figure">0.433</span>
          <span className="text-small">on a quick test</span>
        </div>
        <div className="stage-step fades-in flex flex-col gap-2" style={stepStyle(0.3, 4)}>
          <span className="text-figure text-danger">0.310</span>
          <span className="text-small">on the full set</span>
        </div>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        <div className="stage-step opens-window" style={stepStyle(0.35, 5)}>
          <Os9Window title="Decision D4" accent="var(--violet)" bodyClassName="p-4">
            <p className="text-title text-lg">Quick runs can&rsquo;t rank pipelines</p>
          </Os9Window>
        </div>
        <Guardrail title="Policy" line="A policy blocked a holdout read." at={0.42} />
        <Guardrail title="PI" line="The PI refused to bypass a policy." at={0.49} />
      </div>
    </ScrollStage>
  );
}
