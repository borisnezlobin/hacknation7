import record from "@/data/record.json";
import { ScrollStage } from "../../ScrollStage";
import { stepStyle } from "@/lib/stepStyle";

type RecordKind = "evidence" | "hypothesis" | "plan" | "result" | "decision";

const KIND_STYLE: Record<RecordKind, { color: string; lane: number; label: string }> = {
  evidence: { color: "var(--class-b)", lane: 0, label: "cited evidence" },
  hypothesis: { color: "var(--class-a)", lane: 1, label: "hypotheses" },
  plan: { color: "var(--class-o)", lane: 2, label: "plans" },
  result: { color: "var(--class-f)", lane: 3, label: "scored experiments" },
  decision: { color: "var(--class-g)", lane: 4, label: "decisions" },
};

const KINDS = Object.keys(KIND_STYLE) as RecordKind[];
const TOTAL_MINUTES = Math.max(...record.map((entry) => entry.minute));
const LANE_HEIGHT = 18;

function countOf(kind: RecordKind): number {
  return record.filter((entry) => entry.kind === kind).length;
}

function Timeline() {
  return (
    <div className="relative w-full" style={{ height: KINDS.length * LANE_HEIGHT }} role="img" aria-label="Lab record entries over under four hours, by kind">
      {KINDS.map((kind) => (
        <span key={kind} className="absolute inset-x-0 border-t border-dashed border-ink-faint/40" style={{ top: KIND_STYLE[kind].lane * LANE_HEIGHT + LANE_HEIGHT / 2 }} />
      ))}
      {record.map((entry) => {
        const style = KIND_STYLE[entry.kind as RecordKind];
        const at = entry.minute / TOTAL_MINUTES;
        return (
          <span
            key={entry.id}
            className="stage-step lights-up absolute block size-3 -translate-x-1/2"
            style={{ left: `${at * 100}%`, top: style.lane * LANE_HEIGHT + LANE_HEIGHT / 2 - 6, background: style.color, ...stepStyle(0.2 + at * 0.4, 12) }}
          />
        );
      })}
    </div>
  );
}

function KindCount({ kind }: { kind: RecordKind }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-figure-sm" style={{ color: KIND_STYLE[kind].color }}>{countOf(kind)}</span>
      <span className="text-small">{KIND_STYLE[kind].label}</span>
    </div>
  );
}

export function RecordTimeline() {
  return (
    <ScrollStage className="mx-auto max-w-7xl px-4 py-28 md:px-10 md:py-40">
      <p className="text-lede max-w-xl">
        Every step is logged to <code className="text-data text-lg">lab/record.jsonl</code>.
      </p>
      <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
        {(["hypothesis", "evidence", "result", "decision"] as RecordKind[]).map((kind) => (
          <KindCount key={kind} kind={kind} />
        ))}
      </div>
      <div className="mt-14">
        <Timeline />
        <div className="text-data mt-3 flex justify-between text-ink-faint">
          <span>0 h</span>
          <span>{(TOTAL_MINUTES / 60).toFixed(1)} h</span>
        </div>
      </div>
    </ScrollStage>
  );
}
