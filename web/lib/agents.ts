import {
  BookOpenText,
  Compass,
  Detective,
  Funnel,
  Gear,
  MagnifyingGlass,
  ShieldCheck,
  User,
  Wrench,
  type Icon,
} from "@phosphor-icons/react";

export type AgentIdentity = {
  label: string;
  color: string;
  icon: Icon;
};

const AGENTS: Record<string, AgentIdentity> = {
  pi: { label: "PI", color: "var(--agent-pi)", icon: Compass },
  literature: { label: "Literature", color: "var(--agent-literature)", icon: BookOpenText },
  analyst: { label: "Analyst", color: "var(--agent-analyst)", icon: MagnifyingGlass },
  engineer: { label: "Engineer", color: "var(--agent-engineer)", icon: Wrench },
  skeptic: { label: "Skeptic", color: "var(--agent-skeptic)", icon: Detective },
  evaluator: { label: "Evaluator", color: "var(--agent-evaluator)", icon: ShieldCheck },
  vetter: { label: "Vetter", color: "var(--agent-vetter)", icon: Funnel },
  setup: { label: "Setup", color: "var(--agent-neutral)", icon: Gear },
};

const HUMAN: AgentIdentity = { label: "Human", color: "var(--agent-neutral)", icon: User };

export const LAB_AGENT_KEYS = ["pi", "literature", "analyst", "engineer", "skeptic", "evaluator", "vetter"];

function baseAgentKey(agent: string): string {
  return agent.toLowerCase().replace(/[-_ ]?\d+$/, "");
}

export function agentIdentity(agent: string | null | undefined): AgentIdentity {
  if (!agent) return HUMAN;
  const known = AGENTS[baseAgentKey(agent)];
  if (known) return known;
  return { ...HUMAN, label: agent };
}

export function isAgentAuthored(agent: string): boolean {
  return LAB_AGENT_KEYS.includes(baseAgentKey(agent));
}
