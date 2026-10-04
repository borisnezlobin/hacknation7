import { TIMELINES } from "../lib/timeline";
import { ArchitectureScene } from "../scenes/tech/ArchitectureScene";
import { FailedScene } from "../scenes/tech/FailedScene";
import { FoldScene } from "../scenes/tech/FoldScene";
import { NextScene } from "../scenes/tech/NextScene";
import { PoliciesScene } from "../scenes/tech/PoliciesScene";
import { ScorerScene } from "../scenes/tech/ScorerScene";
import { WorkedScene } from "../scenes/tech/WorkedScene";
import { SceneTrack, type SceneComponent } from "./SceneTrack";

const SCENES: Record<string, SceneComponent> = {
  architecture: ArchitectureScene,
  policies: PoliciesScene,
  fold: FoldScene,
  scorer: ScorerScene,
  worked: WorkedScene,
  failed: FailedScene,
  next: NextScene,
};

export function TechVideo() {
  return <SceneTrack timeline={TIMELINES.tech} scenes={SCENES} />;
}
