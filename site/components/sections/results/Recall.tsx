import { Os9Window } from "../../Os9Window";
import { PlanetGrid } from "../../PlanetGrid";
import { ScrollStage } from "../../ScrollStage";

function GridKey() {
  return (
    <ul className="text-small mt-4 flex flex-wrap gap-x-6 gap-y-2">
      <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-violet" />Found by both</li>
      <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-gain" />Newly found</li>
      <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-ink-faint" />Lost</li>
    </ul>
  );
}

function SkepticWindow() {
  return (
    <Os9Window title="Skeptic review" accent="var(--class-g)" className="w-full max-w-xs" bodyClassName="flex flex-col gap-2 p-4">
      <span className="font-semibold text-gain">Caution, safe to promote</span>
      <span className="text-data">+94 / −33 targets</span>
      <span className="text-data">paired on the same 630</span>
      <span className="text-data">sign test p &lt; 0.001</span>
    </Os9Window>
  );
}

export function Recall() {
  return (
    <ScrollStage mode="pinned" className="relative md:h-[180svh]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 md:sticky md:top-0 md:min-h-svh md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-center md:px-10 md:py-0">
        <div className="flex flex-col gap-10">
          <div>
            <span className="text-figure">39%</span>
            <p className="text-lede mt-4 max-w-sm">of 231 known planets were found, <span className="text-gain">2.6×</span> as many as the baseline.</p>
          </div>
          <SkepticWindow />
        </div>
        <div>
          <PlanetGrid className="w-full" />
          <GridKey />
        </div>
      </div>
    </ScrollStage>
  );
}
