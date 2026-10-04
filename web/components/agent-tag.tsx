import { agentIdentity } from "@/lib/agents";

export function AgentTag({ agent, showLabel = true }: { agent: string | null; showLabel?: boolean }) {
  const identity = agentIdentity(agent);
  const AgentIcon = identity.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-detail" title={identity.label}>
      <AgentIcon size={16} weight="duotone" color={identity.color} aria-hidden />
      <span className={showLabel ? "" : "sr-only"}>{identity.label}</span>
    </span>
  );
}
