import rediscoveries from "@/data/rediscoveries.json";
import { LightCurvePlot } from "../../LightCurvePlot";
import { Os9Window } from "../../Os9Window";
import { ScrollStage } from "../../ScrollStage";
import { stepStyle } from "@/lib/stepStyle";

const HOLDOUT_SIZE = 37;

function HoldoutDots() {
  return (
    <div className="flex flex-wrap gap-2" role="img" aria-label={`${rediscoveries.length} of ${HOLDOUT_SIZE} holdout planets found`}>
      {Array.from({ length: HOLDOUT_SIZE }, (_, index) => (
        <span key={index} className={`size-3 rounded-full ${index < rediscoveries.length ? "bg-gain" : "bg-paper-shade"}`} />
      ))}
    </div>
  );
}

function CurveWindow({ planet, index }: { planet: (typeof rediscoveries)[number]; index: number }) {
  const toi = `TOI ${planet.toi.toFixed(2)}`;
  return (
    <div className="stage-step opens-window" style={stepStyle(0.2 + index * 0.06, 6)}>
      <Os9Window title={toi} accent="var(--gain)" bodyClassName="p-3">
        <LightCurvePlot curve={planet} label={`Folded light curve of ${toi}`} className="w-full" />
        <dl className="text-data mt-2 grid grid-cols-2 gap-x-2 text-xs">
          <dt className="sr-only">Period</dt>
          <dd>{planet.period.toFixed(2)} d</dd>
          <dt className="sr-only">Depth</dt>
          <dd className="text-right">{planet.depthPpm.toLocaleString("en-US")} ppm</dd>
        </dl>
      </Os9Window>
    </div>
  );
}

export function Rediscoveries() {
  return (
    <ScrollStage className="mx-auto max-w-7xl px-4 py-28 md:px-10 md:py-40">
      <div className="grid gap-10 md:grid-cols-[auto_1fr] md:items-end">
        <span className="text-figure whitespace-nowrap">
          5 <span className="text-ink-faint">of 37</span>
        </span>
        <div className="flex flex-col gap-6 md:pb-4">
          <p className="text-lede max-w-lg">planets announced after the agents&rsquo; knowledge cutoff were found blind. The agents never saw them.</p>
          <HoldoutDots />
        </div>
      </div>
      <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {rediscoveries.map((planet, index) => (
          <CurveWindow key={planet.toi} planet={planet} index={index} />
        ))}
      </div>
    </ScrollStage>
  );
}
