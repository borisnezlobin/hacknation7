import { Composition } from "remotion";
import "./theme.css";
import { TIMELINES } from "./lib/timeline";
import { BloomBench } from "./videos/BloomBench";
import { DemoVideo } from "./videos/DemoVideo";
import { TeamVideo } from "./videos/TeamVideo";
import { TechVideo } from "./videos/TechVideo";

const FORMAT = { fps: 30, width: 1920, height: 1080 } as const;

export function Root() {
  return (
    <>
      <Composition id="Demo" component={DemoVideo} durationInFrames={TIMELINES.demo.durationInFrames} {...FORMAT} />
      <Composition id="Tech" component={TechVideo} durationInFrames={TIMELINES.tech.durationInFrames} {...FORMAT} />
      <Composition id="Team" component={TeamVideo} durationInFrames={TIMELINES.team.durationInFrames} {...FORMAT} />
      <Composition id="BloomBench" component={BloomBench} durationInFrames={60} {...FORMAT} />
    </>
  );
}
