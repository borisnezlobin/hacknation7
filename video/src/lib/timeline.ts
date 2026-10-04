import demoTimeline from "../../public/timeline/demo.json";
import teamTimeline from "../../public/timeline/team.json";
import techTimeline from "../../public/timeline/tech.json";

export type TimelineLine = { id: string; text: string; audio: string | null; from: number; durationInFrames: number; words: [string, number, number][] };
export type TimelineScene = { id: string; from: number; durationInFrames: number; lines: TimelineLine[] };
export type TimelineCaption = { text: string; from: number; to: number };
export type Timeline = { id: string; fps: number; durationInFrames: number; scenes: TimelineScene[]; captions: TimelineCaption[] };

export const TIMELINES: Record<"demo" | "tech" | "team", Timeline> = {
  demo: demoTimeline as unknown as Timeline,
  tech: techTimeline as unknown as Timeline,
  team: teamTimeline as unknown as Timeline,
};

export function sceneOf(timeline: Timeline, id: string): TimelineScene {
  const scene = timeline.scenes.find((candidate) => candidate.id === id);
  if (!scene) throw new Error(`Scene ${id} missing from ${timeline.id} timeline`);
  return scene;
}

export function lineOf(scene: TimelineScene, id: string): TimelineLine {
  const line = scene.lines.find((candidate) => candidate.id === id);
  if (!line) throw new Error(`Line ${id} missing from scene ${scene.id}`);
  return line;
}
