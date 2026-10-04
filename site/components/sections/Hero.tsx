import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { LabMark } from "../LabMark";
import { ScrollStage } from "../ScrollStage";
import { SpectrumDip } from "../SpectrumDip";
import { StarBloom } from "../StarBloom";

export function Hero() {
  return (
    <ScrollStage as="header" mode="pinned" className="relative h-[160svh]">
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        <StarBloom seed={7} color="var(--violet)" planet className="drifts hero-bloom absolute top-[6%] right-[-18%] w-[90vw] max-w-[760px] md:right-[4%] md:w-[52vw]" style={{ "--dy": "-160px", "--dx": "-60px" } as React.CSSProperties} />
        <StarBloom seed={21} color="var(--class-a)" specks={3} className="drifts absolute top-[58%] left-[-10%] w-[40vw] max-w-[360px] opacity-70" style={{ "--dy": "-260px", "--spin": "-30deg" } as React.CSSProperties} />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pt-16 md:px-10">
          <LabMark size={44} className="mb-6" />
          <h1 className="text-hero">Planet lab</h1>
          <p className="text-lede mt-8 max-w-xl">An AI research lab that runs its own experiments on real TESS data, then checks itself against planets it has never seen.</p>
          <a href="#demo" className="os9-button mt-10 inline-flex w-fit items-center gap-2 px-4 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet">
            <ArrowDown weight="bold" className="size-4 text-violet" aria-hidden="true" />
            Watch the one-minute demo
          </a>
        </div>
        <SpectrumDip className="hero-stripe relative h-[22svh] w-full" bandHeight={14} dipDepth={60} dipCenter={640} dipWidth={200} />
      </div>
    </ScrollStage>
  );
}
