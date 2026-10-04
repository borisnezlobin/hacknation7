import { FileCode, LockSimple, LockSimpleOpen, User } from "@phosphor-icons/react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { Os9Window } from "../../components/Os9Window";
import { Paper } from "../../components/Paper";
import { InkBleed } from "../../components/tech/InkBleed";
import { HUB, LabRingIcons, LabRingInk, agentPosition, lineBeat } from "../../components/tech/LabRing";
import { easeIn, easeInOut, easeOutSoft, lerp, pulse, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const VAULT = { x: 1600, y: 660, radius: 120 };
const FENCE = { x: 430, y: 720, width: 340, height: 290 };
const SCORER = { x: 1300, y: 70, width: 400, height: 250 };

type Beats = { title: number; fence: number; hit: number; files: number; scorer: number; vault: number; human: number; unlock: number };

function beatsFor(scene: TimelineScene): Beats {
  return {
    title: lineBeat(scene, 0.0),
    fence: lineBeat(scene, 0.2),
    hit: lineBeat(scene, 0.36),
    files: lineBeat(scene, 0.4),
    scorer: lineBeat(scene, 0.47),
    vault: lineBeat(scene, 0.62),
    human: lineBeat(scene, 0.82),
    unlock: lineBeat(scene, 0.92),
  };
}

function HatchPatterns() {
  return (
    <defs>
      <pattern id="fence-hatch" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={4} height={12} fill="var(--ink)" />
      </pattern>
      <pattern id="vault-hatch" width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <rect width={3} height={10} fill="var(--violet-deep)" />
      </pattern>
    </defs>
  );
}

function Fence({ frame, beats }: { frame: number; beats: Beats }) {
  const show = ramp(frame, beats.fence, beats.fence + 14, easeOutSoft);
  const flash = pulse(frame, beats.hit, 1, 10);
  if (show <= 0) return null;
  return (
    <g opacity={show}>
      <rect x={FENCE.x} y={FENCE.y} width={FENCE.width} height={FENCE.height} fill="none" stroke="url(#fence-hatch)" strokeWidth={10} />
      <rect x={FENCE.x} y={FENCE.y} width={FENCE.width} height={FENCE.height} fill="none" stroke="var(--class-m)" strokeWidth={10} opacity={flash} />
    </g>
  );
}

function WriteAttempt({ frame, beats }: { frame: number; beats: Beats }) {
  const engineer = agentPosition("engineer");
  const launch = beats.hit - 16;
  if (frame < launch || frame > beats.hit + 16) return null;
  const outward = ramp(frame, launch, beats.hit, easeIn);
  const bounce = ramp(frame, beats.hit, beats.hit + 14, easeOutSoft);
  const wall = { x: FENCE.x + FENCE.width, y: engineer.y - 30 };
  const before = frame < beats.hit;
  const x = before ? lerp(engineer.x, wall.x, outward) : lerp(wall.x, engineer.x + 40, bounce);
  const y = before ? lerp(engineer.y, wall.y, outward) : lerp(wall.y, engineer.y + 20, bounce);
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill="var(--class-f)" />
      {!before &&
        [0, 1, 2, 3, 4, 5].map((spark) => {
          const angle = (spark / 6) * Math.PI * 2;
          return <line key={spark} x1={wall.x} y1={wall.y} x2={wall.x + Math.cos(angle) * bounce * 60} y2={wall.y + Math.sin(angle) * bounce * 60} stroke="var(--class-m)" strokeWidth={4} opacity={1 - bounce} />;
        })}
    </g>
  );
}

function Vault({ frame, beats }: { frame: number; beats: Beats }) {
  const show = ramp(frame, beats.vault, beats.vault + 14, easeOutSoft);
  const opened = ramp(frame, beats.unlock, beats.unlock + 16, easeOutSoft);
  const evaluator = agentPosition("evaluator");
  const reach = ramp(frame, beats.vault + 8, beats.vault + 24, easeInOut);
  const locked = frame < beats.unlock;
  const edgeX = VAULT.x - VAULT.radius - 14;
  const beamEnd = locked ? lerp(evaluator.x, edgeX, reach) : lerp(edgeX, VAULT.x, opened);
  const blocked = !locked || frame < beats.vault + 24 ? 1 : 0.55 + 0.45 * Math.sin(frame * 1.3);
  if (show <= 0) return null;
  return (
    <g>
      <line x1={evaluator.x} y1={evaluator.y} x2={beamEnd} y2={VAULT.y} stroke="var(--class-k)" strokeWidth={8} opacity={reach * blocked} strokeLinecap="round" />
      <circle cx={VAULT.x} cy={VAULT.y} r={VAULT.radius * show} fill="url(#vault-hatch)" opacity={1 - opened * 0.8} />
      <circle cx={VAULT.x} cy={VAULT.y} r={VAULT.radius * show} fill="none" stroke="var(--violet-deep)" strokeWidth={6} />
      {Array.from({ length: 37 }, (_, index) => {
        const angle = index * 2.4;
        const radius = Math.sqrt(index / 37) * VAULT.radius * 0.8;
        const lit = ramp(frame, beats.unlock + 4 + index * 0.5, beats.unlock + 12 + index * 0.5);
        return <circle key={index} cx={VAULT.x + Math.cos(angle) * radius} cy={VAULT.y + Math.sin(angle) * radius} r={5} fill="var(--class-k)" opacity={lit} />;
      })}
    </g>
  );
}

function VaultIcons({ frame, beats }: { frame: number; beats: Beats }) {
  const show = ramp(frame, beats.vault, beats.vault + 14, easeOutSoft);
  const human = ramp(frame, beats.human, beats.human + 12, easeOutSoft);
  const opened = frame >= beats.unlock;
  const lockFade = 1 - ramp(frame, beats.unlock + 8, beats.unlock + 20);
  const nod = 1 + pulse(frame, beats.unlock - 4, 3, 10) * 0.25;
  return (
    <>
      <div style={{ position: "absolute", left: VAULT.x - 44, top: VAULT.y - 44, opacity: show * lockFade }}>
        {opened ? <LockSimpleOpen size={88} weight="fill" color="var(--paper-light)" /> : <LockSimple size={88} weight="fill" color="var(--paper-light)" />}
      </div>
      <div style={{ position: "absolute", left: VAULT.x - 50, top: VAULT.y - VAULT.radius - 160, opacity: human, transform: `scale(${nod})` }}>
        <User size={100} weight="fill" color="var(--ink)" />
      </div>
    </>
  );
}

function FrozenScorer({ frame, beats }: { frame: number; beats: Beats }) {
  const enter = ramp(frame, beats.scorer, beats.scorer + 12, easeOutSoft);
  const frost = ramp(frame, beats.scorer + 8, beats.scorer + 22);
  if (enter <= 0) return null;
  return (
    <Os9Window title="harness.py" width={SCORER.width} height={SCORER.height} style={{ left: SCORER.x, top: SCORER.y, opacity: enter, transform: `scale(${0.9 + enter * 0.1})` }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `color-mix(in oklab, #dfe8f6 ${Math.round(frost * 100)}%, var(--paper-light))` }}>
        <LockSimple size={110} weight="fill" color="var(--violet-deep)" />
      </AbsoluteFill>
    </Os9Window>
  );
}

function PipelineFiles({ frame, beats }: { frame: number; beats: Beats }) {
  return (
    <>
      {[0, 1, 2].map((index) => {
        const pop = ramp(frame, beats.files + index * 5, beats.files + 10 + index * 5, easeOutSoft);
        return (
          <div key={index} style={{ position: "absolute", left: FENCE.x + 30 + index * 62, top: FENCE.y + FENCE.height - 92, opacity: pop, transform: `scale(${pop})` }}>
            <FileCode size={56} weight="fill" color="var(--class-f)" />
          </div>
        );
      })}
    </>
  );
}

export function PoliciesScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const drift = ramp(frame, 0, scene.durationInFrames);
  return (
    <Paper camera={{ x: drift * 60, y: 0, scale: 1 }}>
      <Impact hits={[{ at: beats.hit, strength: 0.45 }, { at: beats.unlock, strength: 0.5 }]}>
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <HatchPatterns />
            <LabRingInk frame={frame} dim={0.4} />
            <InkBleed x={HUB.x} y={HUB.y} size={190} color="var(--violet-deep)" seed={3} angle={-12} smear={1.1} />
            <Fence frame={frame} beats={beats} />
            <WriteAttempt frame={frame} beats={beats} />
            <Vault frame={frame} beats={beats} />
          </svg>
          <LabRingIcons frame={frame} dim={0.4} />
          <PipelineFiles frame={frame} beats={beats} />
          <VaultIcons frame={frame} beats={beats} />
          <FrozenScorer frame={frame} beats={beats} />
          <Caption text="Policies" x={HUB.x} y={HUB.y + 70} frame={frame} at={beats.title} until={beats.fence + 20} align="center" />
          <Caption text="pipelines/ only" x={FENCE.x + FENCE.width / 2} y={FENCE.y + FENCE.height + 14} frame={frame} at={beats.fence + 6} align="center" />
          <Caption text="frozen scorer" x={SCORER.x + SCORER.width / 2} y={SCORER.y + SCORER.height + 16} frame={frame} at={beats.scorer + 10} align="center" />
          <Caption text="sealed test set" x={VAULT.x} y={VAULT.y + VAULT.radius + 18} frame={frame} at={beats.vault + 8} align="center" />
          <Annotation text="human approval" target={{ x: VAULT.x - 40, y: VAULT.y - VAULT.radius - 110 }} offset={{ x: -150, y: 40 }} frame={frame} at={beats.human + 6} />
        </AbsoluteFill>
      </Impact>
    </Paper>
  );
}
