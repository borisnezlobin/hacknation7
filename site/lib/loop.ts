import { BookOpenText, Compass, Detective, Gavel, LockSimple, MagnifyingGlass, Question, Wrench } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export type LoopStep = { name: string; does: string; color: string; icon: Icon };

export const LOOP_STEPS: LoopStep[] = [
  { name: "Question", does: "From a scientist", color: "var(--ink)", icon: Question },
  { name: "Literature", does: "Cites papers", color: "var(--class-b)", icon: BookOpenText },
  { name: "Analyst", does: "Rival hypotheses", color: "var(--class-a)", icon: MagnifyingGlass },
  { name: "PI", does: "Plans within a budget", color: "var(--class-o)", icon: Compass },
  { name: "Engineers", does: "Parallel pipelines", color: "var(--class-f)", icon: Wrench },
  { name: "Frozen scorer", does: "Locked code", color: "var(--class-k)", icon: LockSimple },
  { name: "Skeptic", does: "Tests the gain", color: "var(--class-g)", icon: Detective },
  { name: "Decision", does: "Promote or reject", color: "var(--violet-deep)", icon: Gavel },
];

export const POLICIES = [
  "Agents can't read the blind holdout.",
  "Engineers can only write pipelines.",
  "Every experiment has a compute budget.",
  "Holdout scoring needs a human approval.",
];
