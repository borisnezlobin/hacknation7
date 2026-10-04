import type { ComponentType } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { CaptionTrack } from "../components/Captions";
import type { Timeline, TimelineScene } from "../lib/timeline";

export type SceneComponent = ComponentType<{ scene: TimelineScene }>;

export function SceneTrack({ timeline, scenes, overlap = 0 }: { timeline: Timeline; scenes: Record<string, SceneComponent>; overlap?: number }) {
  return (
    <AbsoluteFill style={{ background: "var(--paper)" }}>
      {timeline.scenes.map((scene) => {
        const Scene = scenes[scene.id];
        if (!Scene) return null;
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames + overlap}>
            <Scene scene={scene} />
          </Sequence>
        );
      })}
      <CaptionTrack captions={timeline.captions} />
    </AbsoluteFill>
  );
}
