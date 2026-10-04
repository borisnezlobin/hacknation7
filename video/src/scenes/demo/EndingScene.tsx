import { Atom, Dna, Flask, Leaf, Lightning, Pill, Planet, User } from "@phosphor-icons/react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { InkDisk } from "../../components/InkDisk";
import { LabMark } from "../../components/LabMark";
import { Comet, RingTrack, ringPoint } from "../../components/LoopRing";
import { Os9Window } from "../../components/Os9Window";
import { Paper } from "../../components/Paper";
import { SpectrumDip } from "../../components/SpectrumDip";
import { StarBloom } from "../../components/StarBloom";
import { AGENTS } from "../../lib/agents";
import { easeIn, easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import { seededRandom } from "../../lib/random";
import type { TimelineScene } from "../../lib/timeline";

const SYSTEMS = [
  { x: 330, y: 300, scale: 0.8 },
  { x: 900, y: 230, scale: 0.6 },
  { x: 1500, y: 330, scale: 0.9 },
  { x: 560, y: 760, scale: 0.7 },
  { x: 1180, y: 700, scale: 1 },
  { x: 1650, y: 820, scale: 0.55 },
];
const SCIENCES = [Planet, Pill, Atom, Dna, Leaf, Flask, Lightning];
const BUILDING = { columns: 10, rows: 5, left: 560, top: 230, cell: 80 };

type Beats = { worlds: number; building: number; dorm: number; science: number; card: number };

function beatsFor(scene: TimelineScene): Beats {
  const line = scene.lines[0];
  const at = (fraction: number) => line.from + Math.round(line.durationInFrames * fraction);
  return { worlds: line.from, building: at(0.33), dorm: at(0.47), science: at(0.64), card: scene.durationInFrames - 42 };
}

function Worlds({ frame, beats }: { frame: number; beats: Beats }) {
  const leave = ramp(frame, beats.building - 8, beats.building + 6);
  if (leave >= 1) return null;
  const habitable = SYSTEMS[4];
  const angle = frame * 0.02;
  return (
    <AbsoluteFill style={{ opacity: 1 - leave }}>
      <svg width={1920} height={1080}>
        {SYSTEMS.map((system, index) => {
          const appear = ramp(frame, beats.worlds + index * 6, beats.worlds + index * 6 + 14, easeOutSoft);
          const planetAngle = angle * (1 + index * 0.2) + index;
          return (
            <g key={index} opacity={appear} transform={`translate(${system.x} ${system.y}) scale(${system.scale * appear}) translate(${-system.x} ${-system.y})`}>
              <ellipse cx={system.x} cy={system.y} rx={150} ry={62} fill="none" stroke="var(--stem)" strokeWidth={36} opacity={0.35} />
              <InkDisk x={system.x} y={system.y} radius={48} color="var(--class-k)" seed={index + 2} />
              <circle cx={system.x + Math.cos(planetAngle) * 150} cy={system.y + Math.sin(planetAngle) * 62} r={14} fill={index === 4 ? "var(--class-b)" : "var(--violet-deep)"} />
            </g>
          );
        })}
      </svg>
      <Annotation text="Maybe habitable" target={{ x: habitable.x + Math.cos(angle * 1.8 + 4) * 150, y: habitable.y + Math.sin(angle * 1.8 + 4) * 62 - 14 }} offset={{ x: 60, y: -130 }} frame={frame} at={beats.worlds + 40} until={beats.building - 10} color="var(--class-b)" />
    </AbsoluteFill>
  );
}

function Building({ frame, beats }: { frame: number; beats: Beats }) {
  const random = seededRandom(8);
  const collapse = ramp(frame, beats.dorm - 4, beats.dorm + 16, easeIn);
  if (frame < beats.building - 6 || collapse >= 1) return null;
  const people = Array.from({ length: BUILDING.columns * BUILDING.rows }, (_, index) => ({ index, drift: (random() - 0.5) * 2, delay: random() * 10 }));
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - collapse }}>
        <path d={`M ${BUILDING.left - 40} ${BUILDING.top + BUILDING.rows * BUILDING.cell + 20} V ${BUILDING.top - 40} L ${BUILDING.left + (BUILDING.columns * BUILDING.cell) / 2} ${BUILDING.top - 150} L ${BUILDING.left + BUILDING.columns * BUILDING.cell + 40} ${BUILDING.top - 40} V ${BUILDING.top + BUILDING.rows * BUILDING.cell + 20}`} fill="none" stroke="var(--violet-deep)" strokeWidth={4} />
      </svg>
      {people.map((person) => {
        const appear = ramp(frame, beats.building + person.delay, beats.building + person.delay + 8, easeOutSoft);
        const x = BUILDING.left + (person.index % BUILDING.columns) * BUILDING.cell;
        const y = BUILDING.top + Math.floor(person.index / BUILDING.columns) * BUILDING.cell;
        return (
          <div key={person.index} style={{ position: "absolute", left: x + collapse * person.drift * 700, top: y - collapse * 800, opacity: appear * (1 - collapse), transform: `scale(${appear})` }}>
            <User size={60} weight="fill" color="var(--ink-muted)" />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Dorm({ frame, beats }: { frame: number; beats: Beats }) {
  const appear = ramp(frame, beats.dorm + 6, beats.dorm + 20, easeOutSoft);
  const settle = ramp(frame, beats.science - 6, beats.science + 10, easeInOut);
  const leave = ramp(frame, beats.card - 6, beats.card + 6);
  if (appear <= 0 || leave >= 1) return null;
  const center = { x: 960, y: 500 };
  return (
    <AbsoluteFill style={{ opacity: 1 - leave, transform: `scale(${lerp(1, 0.75, settle)})` }}>
      <svg width={1920} height={1080}>
        {AGENTS.map((agent, index) => {
          const point = ringPoint(center, lerp(150, 330, appear), index / AGENTS.length);
          return <StarBloom key={agent.key} x={point.x} y={point.y} size={110 * appear * (1 - settle)} color={agent.color} seed={40 + index} time={frame / 30} specks={1} />;
        })}
      </svg>
      <Os9Window title="Dorm room" width={300} height={340} style={{ left: center.x - 150, top: center.y - 170, transform: `scale(${appear})` }}>
        <Img src={staticFile("footage/boris-square.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Os9Window>
      <Caption text="One student, seven agents" x={center.x} y={center.y + 390} frame={frame} at={beats.dorm + 12} until={beats.science - 8} align="center" size="title" />
    </AbsoluteFill>
  );
}

function AnyScience({ frame, beats }: { frame: number; beats: Beats }) {
  const appear = ramp(frame, beats.science, beats.science + 20, easeOutSoft);
  const leave = ramp(frame, beats.card - 6, beats.card + 6);
  if (appear <= 0 || leave >= 1) return null;
  const center = { x: 960, y: 500 };
  const radius = 340;
  return (
    <AbsoluteFill style={{ opacity: appear * (1 - leave) }}>
      <svg width={1920} height={1080}>
        <RingTrack center={center} radius={radius} />
        <Comet center={center} radius={radius} phase={(frame - beats.science) / 40} trail={0.3} size={24} />
      </svg>
      {SCIENCES.map((Icon, index) => {
        const point = ringPoint(center, radius, index / SCIENCES.length + (frame - beats.science) / 500);
        const pop = ramp(frame, beats.science + index * 4, beats.science + index * 4 + 12, easeOutSoft);
        return (
          <div key={index} style={{ position: "absolute", left: point.x - 55, top: point.y - 55, transform: `scale(${pop})` }}>
            <Icon size={110} weight="duotone" color={AGENTS[index].color} />
          </div>
        );
      })}
      <Caption text="Any science you can score" x={center.x} y={center.y + 420} frame={frame} at={beats.science + 10} align="center" size="title" />
    </AbsoluteFill>
  );
}

export function EndingScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const card = ramp(frame, beats.card, beats.card + 16, easeOutSoft);
  return (
    <Impact hits={[{ at: beats.dorm + 8, strength: 0.4, length: 10 }, { at: beats.card, strength: 0.5, length: 12 }]}>
      <Paper camera={{ x: frame * 1.6, y: -frame * 0.4, scale: 1 }}>
        <Worlds frame={frame} beats={beats} />
        <Building frame={frame} beats={beats} />
        <Dorm frame={frame} beats={beats} />
        <AnyScience frame={frame} beats={beats} />
        <AbsoluteFill style={{ opacity: card, alignItems: "center", justifyContent: "center", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <LabMark size={120} />
            <div className="text-hero">Planet lab</div>
          </div>
          <SpectrumDip width={900} height={140} bandHeight={14} dipDepth={44} dipCenter={450} dipWidth={160} sweep={card} />
        </AbsoluteFill>
      </Paper>
    </Impact>
  );
}
