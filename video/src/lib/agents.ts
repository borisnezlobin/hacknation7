import { BookOpenText, Compass, Detective, Funnel, MagnifyingGlass, ShieldCheck, Wrench, type Icon } from "@phosphor-icons/react";

export type AgentKey = "pi" | "literature" | "analyst" | "engineer" | "skeptic" | "evaluator" | "vetter";

export type Agent = {
  key: AgentKey;
  name: string;
  spectralClass: string;
  color: string;
  icon: Icon;
  owns: string;
};

export const AGENTS: Agent[] = [
  { key: "pi", name: "PI", spectralClass: "O", color: "var(--class-o)", icon: Compass, owns: "Which ideas get tested" },
  { key: "literature", name: "Literature", spectralClass: "B", color: "var(--class-b)", icon: BookOpenText, owns: "Which papers bear on an idea" },
  { key: "analyst", name: "Analyst", spectralClass: "A", color: "var(--class-a)", icon: MagnifyingGlass, owns: "Why the search missed" },
  { key: "engineer", name: "Engineer", spectralClass: "F", color: "var(--class-f)", icon: Wrench, owns: "How to build one idea" },
  { key: "skeptic", name: "Skeptic", spectralClass: "G", color: "var(--class-g)", icon: Detective, owns: "Whether a gain is real" },
  { key: "evaluator", name: "Evaluator", spectralClass: "K", color: "var(--class-k)", icon: ShieldCheck, owns: "Whether it holds on unseen planets" },
  { key: "vetter", name: "Vetter", spectralClass: "M", color: "var(--class-m)", icon: Funnel, owns: "Which new signals survive" },
];

export const SPECTRUM = AGENTS.map((agent) => agent.color);

export function agentByKey(key: AgentKey): Agent {
  return AGENTS.find((agent) => agent.key === key) ?? AGENTS[0];
}
