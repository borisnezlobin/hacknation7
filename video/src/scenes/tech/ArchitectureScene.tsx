import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { Paper } from "../../components/Paper";
import { InkBleed } from "../../components/tech/InkBleed";
import { AgentLabels, HUB, LabRingIcons, LabRingInk, agentPosition, lineBeat } from "../../components/tech/LabRing";
import { AGENTS } from "../../lib/agents";
import { LAB, type RecordEntry } from "../../lib/data";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const RECORD_RING = 200;
const CITING_ENTRY = "D5";

type Beats = { hub: number; agents: number; record: number; cite: number; end: number };

function beatsFor(scene: TimelineScene): Beats {
  return { hub: lineBeat(scene, 0.02), agents: lineBeat(scene, 0.12), record: lineBeat(scene, 0.42), cite: lineBeat(scene, 0.72), end: scene.durationInFrames };
}

function slotPosition(index: number, total: number) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  return { x: HUB.x + Math.cos(angle) * RECORD_RING, y: HUB.y + Math.sin(angle) * RECORD_RING, angle: (angle * 180) / Math.PI + 90 };
}

function author(entry: RecordEntry) {
  const agent = AGENTS.find((candidate) => candidate.key === entry.agent);
  return { color: agent?.color ?? "var(--ink-faint)", position: agent ? agentPosition(agent.key) : HUB };
}

function RecordRing({ frame, start }: { frame: number; start: number }) {
  const entries = LAB.record;
  return (
    <>
      {entries.map((entry, index) => {
        const begin = start + index * 1.1;
        const travel = ramp(frame, begin, begin + 12, easeInOut);
        if (travel <= 0) return null;
        const slot = slotPosition(index, entries.length);
        const from = author(entry);
        if (travel < 1) return <circle key={entry.id} cx={lerp(from.position.x, slot.x, travel)} cy={lerp(from.position.y, slot.y, travel)} r={6} fill={from.color} />;
        return <rect key={entry.id} x={-7} y={-12} width={14} height={24} fill={from.color} transform={`translate(${slot.x} ${slot.y}) rotate(${slot.angle})`} />;
      })}
    </>
  );
}

function CitationThreads({ frame, start }: { frame: number; start: number }) {
  const entries = LAB.record;
  const citingIndex = entries.findIndex((entry) => entry.id === CITING_ENTRY);
  if (citingIndex < 0) return null;
  const citing = slotPosition(citingIndex, entries.length);
  const highlight = ramp(frame, start, start + 8);
  return (
    <g>
      <rect x={-12} y={-20} width={24} height={40} fill="none" stroke="var(--class-o)" strokeWidth={3} opacity={highlight} transform={`translate(${citing.x} ${citing.y}) rotate(${citing.angle})`} />
      {entries[citingIndex].refs.map((ref, refIndex) => {
        const targetIndex = entries.findIndex((entry) => entry.id === ref);
        if (targetIndex < 0) return null;
        const target = slotPosition(targetIndex, entries.length);
        const draw = ramp(frame, start + 6 + refIndex * 3, start + 22 + refIndex * 3, easeInOut);
        const bend = { x: HUB.x + (citing.x + target.x - 2 * HUB.x) * 0.15, y: HUB.y + (citing.y + target.y - 2 * HUB.y) * 0.15 };
        return <path key={ref} d={`M${citing.x},${citing.y} Q${bend.x},${bend.y} ${target.x},${target.y}`} fill="none" stroke="var(--class-o)" strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />;
      })}
    </g>
  );
}

function exitOffset(target: { x: number; y: number }, gapDegrees: number, radius: number) {
  const angle = (gapDegrees * Math.PI) / 180;
  return { x: HUB.x + Math.cos(angle) * radius - target.x, y: HUB.y + Math.sin(angle) * radius - target.y };
}

export function ArchitectureScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const hubIn = ramp(frame, beats.hub, beats.hub + 14, easeOutSoft);
  const push = lerp(1, 1.05, ramp(frame, 0, beats.end));
  const recordTarget = { x: HUB.x + Math.cos((40 * Math.PI) / 180) * RECORD_RING, y: HUB.y + Math.sin((40 * Math.PI) / 180) * RECORD_RING };
  const citedSlot = slotPosition(LAB.record.findIndex((entry) => entry.id === CITING_ENTRY), LAB.record.length);
  return (
    <Paper camera={{ x: (push - 1) * 400, y: 0, scale: push }}>
      <Impact hits={[{ at: beats.hub + 2, strength: 0.35 }]}>
        <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `${HUB.x}px ${HUB.y}px` }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <LabRingInk frame={frame} arriveAt={beats.agents} />
            <InkBleed x={HUB.x} y={HUB.y} size={190 * hubIn} color="var(--violet-deep)" seed={3} angle={-12} smear={1.1} />
            <RecordRing frame={frame} start={beats.record} />
            <CitationThreads frame={frame} start={beats.cite} />
          </svg>
          <LabRingIcons frame={frame} arriveAt={beats.agents} />
          <Caption text="Omnigent" x={HUB.x} y={HUB.y + 70} frame={frame} at={beats.hub + 4} align="center" />
          <AgentLabels frame={frame} at={beats.agents + 10} />
          <Annotation text="shared record" target={recordTarget} offset={exitOffset(recordTarget, 40, 480)} frame={frame} at={beats.record + 20} until={beats.cite} />
          <Annotation text="cites evidence" target={citedSlot} offset={exitOffset(citedSlot, -12, 500)} frame={frame} at={beats.cite + 10} />
        </AbsoluteFill>
      </Impact>
    </Paper>
  );
}
