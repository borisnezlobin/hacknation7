import { TIMELINES } from "../lib/timeline";
import { DiscoveryScene } from "../scenes/demo/DiscoveryScene";
import { EndingScene } from "../scenes/demo/EndingScene";
import { GradingScene } from "../scenes/demo/GradingScene";
import { LoopScene } from "../scenes/demo/LoopScene";
import { ProblemScene } from "../scenes/demo/ProblemScene";
import { ResultScene } from "../scenes/demo/ResultScene";
import { SurveyScene } from "../scenes/demo/SurveyScene";
import { TitleScene } from "../scenes/demo/TitleScene";
import { TransitScene } from "../scenes/demo/TransitScene";
import { SceneTrack, type SceneComponent } from "./SceneTrack";

const SCENES: Record<string, SceneComponent> = {
  transit: TransitScene,
  survey: SurveyScene,
  problem: ProblemScene,
  title: TitleScene,
  loop: LoopScene,
  grading: GradingScene,
  result: ResultScene,
  discovery: DiscoveryScene,
  ending: EndingScene,
};

export function DemoVideo() {
  return <SceneTrack timeline={TIMELINES.demo} scenes={SCENES} />;
}
