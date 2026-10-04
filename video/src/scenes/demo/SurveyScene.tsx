import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { BrollPlate } from "../../components/BrollPlate";
import { Impact } from "../../components/Impact";
import { InkDisk } from "../../components/InkDisk";
import { Paper } from "../../components/Paper";
import { StarField } from "../../components/StarField";
import { STAR_FIELD } from "../../lib/data";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

type Beats = { fieldAt: number; zoneAt: number; end: number };

function beatsFor(scene: TimelineScene): Beats {
  const line = scene.lines[0];
  return { fieldAt: line.from + Math.round(line.durationInFrames * 0.14), zoneAt: line.from + Math.round(line.durationInFrames * 0.48), end: scene.durationInFrames };
}

const SYSTEM = { x: 760, y: 520 };
const ORBITS = [150, 250, 360, 470];
const ZONE = { inner: 300, outer: 420 };

function HabitableZone({ frame, beats }: { frame: number; beats: Beats }) {
  const appear = ramp(frame, beats.zoneAt - 6, beats.zoneAt + 14, easeOutSoft);
  const zone = ramp(frame, beats.zoneAt + 10, beats.zoneAt + 30, easeOutSoft);
  const angle = -0.6 + (frame - beats.zoneAt) * 0.012;
  const radius = (ZONE.inner + ZONE.outer) / 2;
  const planet = { x: SYSTEM.x + Math.cos(angle) * radius, y: SYSTEM.y + Math.sin(angle) * radius * 0.42 };
  if (appear <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: appear, transform: `scale(${0.85 + appear * 0.15})` }}>
      <svg width={1920} height={1080}>
        <defs>
          <filter id="zone-bleed" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves={3} seed={4} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={40} xChannelSelector="R" yChannelSelector="G" result="bled" />
            <feGaussianBlur in="bled" stdDeviation="14 6" />
          </filter>
        </defs>
        <ellipse cx={SYSTEM.x} cy={SYSTEM.y} rx={radius} ry={radius * 0.42} fill="none" stroke="var(--stem)" strokeWidth={(ZONE.outer - ZONE.inner) * zone} opacity={0.5} filter="url(#zone-bleed)" />
        {ORBITS.map((orbit) => (
          <ellipse key={orbit} cx={SYSTEM.x} cy={SYSTEM.y} rx={orbit} ry={orbit * 0.42} fill="none" stroke="var(--violet-deep)" strokeWidth={1.5} opacity={0.35} />
        ))}
        <InkDisk x={SYSTEM.x} y={SYSTEM.y} radius={70} color="var(--class-k)" />
        <circle cx={planet.x} cy={planet.y} r={18} fill="var(--class-b)" />
      </svg>
      <Annotation text="Habitable zone" target={{ x: SYSTEM.x + ZONE.outer - 20, y: SYSTEM.y + 40 }} offset={{ x: 160, y: 110 }} frame={frame} at={beats.zoneAt + 18} color="#5d7a12" />
      <Annotation text="Earth-size planet" target={{ x: planet.x, y: planet.y - 18 }} offset={{ x: 60, y: -120 }} frame={frame} at={beats.zoneAt + 30} />
    </AbsoluteFill>
  );
}

export function SurveyScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const push = lerp(1.05, 1.35, ramp(frame, 0, beats.fieldAt + 8, easeInOut));
  const toField = ramp(frame, beats.fieldAt, beats.fieldAt + 14, easeOutSoft);
  const fieldOut = ramp(frame, beats.zoneAt - 10, beats.zoneAt + 4);
  const fieldZoom = lerp(6, 1.05, ramp(frame, beats.fieldAt, beats.zoneAt - 6, easeOutSoft));
  const counter = Math.round(STAR_FIELD.total_stars * ramp(frame, beats.fieldAt + 4, beats.fieldAt + 40, easeOutSoft));
  return (
    <Impact hits={[{ at: beats.fieldAt, strength: 0.4, length: 10 }]}>
      <Paper camera={{ x: frame * 2, y: 0, scale: fieldZoom / 3 + 0.7 }}>
        {frame < beats.fieldAt + 14 && (
          <AbsoluteFill style={{ opacity: 1 - toField }}>
            <BrollPlate clip="tess_hero" startFrom={40} scale={push} brightness={1.4} />
            <Caption text="NASA's TESS satellite" x={130} y={880} frame={frame} at={6} color="var(--paper-light)" size="title" />
          </AbsoluteFill>
        )}
        <AbsoluteFill style={{ opacity: toField * (1 - fieldOut) }}>
          <StarField camera={{ zoom: fieldZoom, focusX: 0, focusY: 0, rotation: 0.15 }} twinkleTime={frame / 30} />
          <Caption text={`${counter.toLocaleString("en-US")} stars`} x={130} y={860} frame={frame} at={beats.fieldAt + 4} size="title" />
        </AbsoluteFill>
        <HabitableZone frame={frame} beats={beats} />
      </Paper>
    </Impact>
  );
}
