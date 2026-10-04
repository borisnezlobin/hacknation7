import {
  BookOpenText,
  ChartLineUp,
  Gavel,
  Lightbulb,
  ListChecks,
  NotePencil,
  Planet,
  Question,
  Stamp,
  type Icon,
} from "@phosphor-icons/react";
import type { RecordEntry, RecordKind } from "./lab-types";

export const KIND_DETAILS: Record<RecordKind, { label: string; icon: Icon }> = {
  question: { label: "Question", icon: Question },
  evidence: { label: "Evidence", icon: BookOpenText },
  hypothesis: { label: "Hypothesis", icon: Lightbulb },
  plan: { label: "Plan", icon: ListChecks },
  result: { label: "Result", icon: ChartLineUp },
  decision: { label: "Decision", icon: Gavel },
  approval: { label: "Approval", icon: Stamp },
  candidate: { label: "Candidate", icon: Planet },
  note: { label: "Note", icon: NotePencil },
};

export type PlanOption = { id: string; chosen: boolean };

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function planOptions(entry: RecordEntry): PlanOption[] {
  const considered = stringList(entry.data.considered ?? entry.data.options);
  const chosen = new Set(stringList(entry.data.chosen));
  const ids = considered.length > 0 ? considered : entry.refs.filter((ref) => ref.startsWith("H"));
  return ids.map((id) => ({ id, chosen: chosen.size === 0 || chosen.has(id) }));
}

export function citationLink(data: Record<string, unknown>): { label: string; href: string } | null {
  if (typeof data.doi === "string") return { label: `doi:${data.doi}`, href: `https://doi.org/${data.doi}` };
  if (typeof data.arxiv === "string") return { label: `arXiv:${data.arxiv}`, href: `https://arxiv.org/abs/${data.arxiv}` };
  return null;
}

export function numberField(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];
  return typeof value === "number" ? value : null;
}

export function resultMetrics(entry: RecordEntry): Record<string, unknown> | null {
  const metrics = entry.data.metrics;
  return metrics && typeof metrics === "object" ? (metrics as Record<string, unknown>) : null;
}
