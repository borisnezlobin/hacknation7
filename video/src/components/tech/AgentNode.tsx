import type { Agent } from "../../lib/agents";
import { InkBleed } from "./InkBleed";

export function AgentNodeInk({ agent, x, y, size, seed, glow = 1 }: { agent: Agent; x: number; y: number; size: number; seed: number; glow?: number }) {
  return <InkBleed x={x} y={y} size={size * (0.9 + glow * 0.1)} color={agent.color} seed={seed} angle={-20 + (seed % 5) * 9} smear={1.2} wetness={0.8 + glow * 0.3} />;
}

export function AgentNodeIcon({ agent, x, y, size, opacity = 1 }: { agent: Agent; x: number; y: number; size: number; opacity?: number }) {
  const Icon = agent.icon;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity }}>
      <Icon size={size} weight="fill" color="var(--paper-light)" />
    </div>
  );
}
