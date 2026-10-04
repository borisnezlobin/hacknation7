import { Annotation } from "../Annotation";
import { AGENTS, type AgentKey } from "../../lib/agents";
import { easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";
import { AgentNodeIcon, AgentNodeInk } from "./AgentNode";

export type Point = { x: number; y: number };

export const HUB: Point = { x: 820, y: 540 };
export const RING = 370;
export const ANGLES: Record<AgentKey, number> = { pi: -90, vetter: -38, evaluator: 14, skeptic: 66, engineer: 122, analyst: 176, literature: -142 };

export function lineBeat(scene: TimelineScene, fraction: number, lineIndex = 0): number {
  const line = scene.lines[lineIndex];
  return line.from + Math.round(line.durationInFrames * fraction);
}

export function agentPosition(key: AgentKey, hub: Point = HUB, ring: number = RING): Point {
  const angle = (ANGLES[key] * Math.PI) / 180;
  return { x: hub.x + Math.cos(angle) * ring, y: hub.y + Math.sin(angle) * ring };
}

function arrivalFor(frame: number, index: number, arriveAt: number): number {
  return arriveAt < 0 ? 1 : ramp(frame, arriveAt + index * 5, arriveAt + 16 + index * 5, easeOutSoft);
}

export function LabRingInk({ frame, arriveAt = -1, spokes = true, dim = 0 }: { frame: number; arriveAt?: number; spokes?: boolean; dim?: number }) {
  return (
    <>
      {AGENTS.map((agent, index) => {
        const arrive = arrivalFor(frame, index, arriveAt);
        const target = agentPosition(agent.key);
        const x = lerp(HUB.x, target.x, arrive);
        const y = lerp(HUB.y, target.y, arrive);
        return (
          <g key={agent.key} opacity={1 - dim * 0.6}>
            {spokes && <line x1={HUB.x} y1={HUB.y} x2={x} y2={y} stroke="var(--ink)" strokeWidth={1.5} opacity={0.3} />}
            {arrive > 0 && <AgentNodeInk agent={agent} x={x} y={y} size={150 * arrive} seed={index + 11} />}
          </g>
        );
      })}
    </>
  );
}

export function LabRingIcons({ frame, arriveAt = -1, dim = 0 }: { frame: number; arriveAt?: number; dim?: number }) {
  return (
    <>
      {AGENTS.map((agent, index) => {
        const arrive = arrivalFor(frame, index, arriveAt);
        const target = agentPosition(agent.key);
        return <AgentNodeIcon key={agent.key} agent={agent} x={lerp(HUB.x, target.x, arrive)} y={lerp(HUB.y, target.y, arrive)} size={54} opacity={arrive * (1 - dim * 0.6)} />;
      })}
    </>
  );
}

export function AgentLabels({ frame, at, until }: { frame: number; at: number; until?: number }) {
  return (
    <>
      {AGENTS.map((agent, index) => {
        const position = agentPosition(agent.key);
        const angle = (ANGLES[agent.key] * Math.PI) / 180;
        const side = Math.cos(angle) >= -0.05 ? 1 : -1;
        const target = { x: position.x + Math.cos(angle) * 72, y: position.y + Math.sin(angle) * 60 };
        return <Annotation key={agent.key} text={agent.name} target={target} offset={{ x: side * 46, y: Math.sin(angle) * 20 }} frame={frame} at={at + index * 4} until={until} color={agent.color} />;
      })}
    </>
  );
}
