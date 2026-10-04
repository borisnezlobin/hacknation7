import { TIMELINES } from "../lib/timeline";
import { HelloScene } from "../scenes/team/HelloScene";
import { CloseScene, RosterScene, TeamScene } from "../scenes/team/RosterScenes";
import { WhyScene } from "../scenes/team/WhyScene";
import { SceneTrack, type SceneComponent } from "./SceneTrack";

const SCENES: Record<string, SceneComponent> = {
  hello: HelloScene,
  why: WhyScene,
  team: TeamScene,
  roster: RosterScene,
  close: CloseScene,
};

export function TeamVideo() {
  return <SceneTrack timeline={TIMELINES.team} scenes={SCENES} />;
}
