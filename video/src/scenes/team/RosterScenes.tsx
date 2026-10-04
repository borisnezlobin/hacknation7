import { User } from "@phosphor-icons/react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Impact } from "../../components/Impact";
import { LabMark } from "../../components/LabMark";
import { Paper } from "../../components/Paper";
import { SpectrumDip } from "../../components/SpectrumDip";
import { StarBloom } from "../../components/StarBloom";
import { AGENTS, type Agent } from "../../lib/agents";
import { easeIn, easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import { seededRandom } from "../../lib/random";
import type { TimelineScene } from "../../lib/timeline";
import { PersonStar } from "./HelloScene";

const ROOM = { columns: 9, rows: 4 };
const ROW_Y = 860;
const ROW_SPACING = 210;

function rowX(width: number, slot: number): number {
  return width / 2 + (slot - 3.5) * ROW_SPACING;
}

export function TeamScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const line = scene.lines[0];
  const collapseAt = line.from + Math.round(line.durationInFrames * 0.5);
  const random = seededRandom(12);
  const people = Array.from({ length: ROOM.columns * ROOM.rows }, (_, index) => ({
    x: width / 2 + ((index % ROOM.columns) - (ROOM.columns - 1) / 2) * 150,
    y: height / 2 - 120 + (Math.floor(index / ROOM.columns) - (ROOM.rows - 1) / 2) * 150,
    delay: random() * 24,
    drift: (random() - 0.5) * 2,
  }));
  const keeper = Math.floor(people.length / 2);
  const collapse = ramp(frame, collapseAt, collapseAt + 22, easeIn);
  const settle = ramp(frame, collapseAt + 18, collapseAt + 40, easeOutSoft);
  return (
    <Impact hits={[{ at: collapseAt + 20, strength: 0.6, length: 10 }]}>
      <Paper>
        {people.map((person, index) => {
          const appear = ramp(frame, person.delay, person.delay + 8, easeOutSoft);
          if (index === keeper) return null;
          return (
            <div key={index} style={{ position: "absolute", left: person.x - 45 + collapse * person.drift * 800, top: person.y - 45 - collapse * 900, opacity: appear * (1 - collapse), transform: `scale(${appear}) rotate(${collapse * person.drift * 90}deg)` }}>
              <User size={90} weight="fill" color="var(--ink-muted)" />
            </div>
          );
        })}
        {settle <= 0 && (
          <div style={{ position: "absolute", left: people[keeper].x - 45, top: people[keeper].y - 45 }}>
            <User size={90} weight="fill" color="var(--violet-deep)" />
          </div>
        )}
        {settle > 0 && <PersonStar x={lerp(people[keeper].x, rowX(width, 0), settle)} y={lerp(people[keeper].y, ROW_Y, settle)} size={lerp(90, 240, settle)} frame={frame} />}
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {AGENTS.map((agent, index) => {
            const pop = ramp(frame, collapseAt + 30 + index * 4, collapseAt + 42 + index * 4, easeOutSoft);
            return pop > 0 ? <StarBloom key={agent.key} x={rowX(width, index + 1)} y={ROW_Y} size={200 * pop} color={agent.color} seed={40 + index} time={frame / 30} specks={2} /> : null;
          })}
        </svg>
      </Paper>
    </Impact>
  );
}

function StageAgent({ agent, index, frame, enter, exit }: { agent: Agent; index: number; frame: number; enter: number; exit: number }) {
  const grow = ramp(frame, enter, enter + 12, easeOutSoft);
  const shrink = ramp(frame, exit - 6, exit + 4, easeIn);
  const nameIn = ramp(frame, enter + 6, enter + 14, easeOutSoft);
  const nameOut = ramp(frame, exit - 8, exit - 3);
  const size = 560 * grow * (1 - shrink);
  if (size <= 1) return null;
  const Icon = agent.icon;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <StarBloom x={760} y={430} size={size} color={agent.color} seed={40 + index} time={frame / 30} specks={7} />
      </svg>
      <div style={{ position: "absolute", left: 760 - size * 0.16, top: 430 - size * 0.16 }}>
        <Icon size={size * 0.32} weight="bold" color="var(--paper-light)" />
      </div>
      <div className="text-hero" style={{ position: "absolute", left: 1100, top: 360, opacity: nameIn * (1 - nameOut), transform: `translateX(${(1 - nameIn) * 40}px)` }}>
        {agent.name}
      </div>
    </>
  );
}

export function RosterScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const turns = AGENTS.map((agent) => scene.lines.find((line) => line.id === `team-${agent.key}`));
  return (
    <Paper>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {AGENTS.map((agent, index) => {
          const turn = turns[index];
          const speaking = turn ? ramp(frame, turn.from - 4, turn.from + 6) * (1 - ramp(frame, turn.from + turn.durationInFrames, turn.from + turn.durationInFrames + 8)) : 0;
          const spoken = turn ? frame >= turn.from : false;
          return (
            <g key={agent.key}>
              <StarBloom x={rowX(width, index + 1)} y={ROW_Y} size={lerp(110, 150, speaking)} color={agent.color} seed={40 + index} time={frame / 30} brightness={spoken ? 1 : 0.4} specks={1} />
              {speaking > 0.05 && <rect x={rowX(width, index + 1) - 60} y={ROW_Y + 90} width={120} height={8} fill="var(--violet-deep)" opacity={speaking} />}
            </g>
          );
        })}
      </svg>
      <PersonStar x={rowX(width, 0)} y={ROW_Y} size={130} frame={frame} />
      {AGENTS.map((agent, index) => {
        const turn = turns[index];
        const next = turns[index + 1];
        if (!turn) return null;
        return <StageAgent key={agent.key} agent={agent} index={index} frame={frame} enter={turn.from - 6} exit={next ? next.from - 4 : turn.from + turn.durationInFrames + 30} />;
      })}
    </Paper>
  );
}

export function CloseScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const gather = ramp(frame, 0, 40, easeInOut);
  const cardAt = scene.lines[0].from + scene.lines[0].durationInFrames;
  const card = ramp(frame, cardAt - 10, cardAt + 10, easeOutSoft);
  return (
    <Impact hits={[{ at: cardAt - 6, strength: 0.6, length: 12 }]}>
      <Paper>
        <AbsoluteFill style={{ opacity: 1 - card }}>
          <svg width={width} height={height}>
            {AGENTS.map((agent, index) => {
              const angle = ((index + 1) / 8) * Math.PI * 2 - Math.PI / 2;
              const x = lerp(rowX(width, index + 1), width / 2 + Math.cos(angle) * 300, gather);
              const y = lerp(ROW_Y, height / 2 + Math.sin(angle) * 280, gather);
              return <StarBloom key={agent.key} x={x} y={y} size={150} color={agent.color} seed={40 + index} time={frame / 30} specks={2} />;
            })}
          </svg>
          <PersonStar x={lerp(rowX(width, 0), width / 2, gather)} y={lerp(ROW_Y, height / 2 - 280, gather)} size={150} frame={frame} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: card, alignItems: "center", justifyContent: "center", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <LabMark size={120} />
            <div className="text-hero">Planet lab</div>
          </div>
          <SpectrumDip width={900} height={140} bandHeight={14} dipDepth={44} dipCenter={450} dipWidth={160} sweep={card} />
          <div className="text-annotation" style={{ color: "var(--violet-deep)", opacity: ramp(frame, cardAt + 10, cardAt + 24) }}>borisn.com</div>
        </AbsoluteFill>
      </Paper>
    </Impact>
  );
}
