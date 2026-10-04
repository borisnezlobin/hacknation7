import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { BrollPlate } from "../../components/BrollPlate";
import { Impact } from "../../components/Impact";
import { Paper } from "../../components/Paper";
import { FoldWaterfall } from "../../components/tech/FoldWaterfall";
import { InkBleed } from "../../components/tech/InkBleed";
import { lineBeat } from "../../components/tech/LabRing";
import { PeriodDial } from "../../components/tech/PeriodDial";
import { LIGHT_CURVES } from "../../lib/data";
import { easeIn, easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const CURVE = LIGHT_CURVES.hero;
const TRUE_PERIOD = CURVE.period ?? 2.18;
const PLOT = { x: 140, y: 110, width: 1300, height: 860 };
const DIAL = { x: 1500, y: 300, size: 320 };

type Beats = { plateEnd: number; revealEnd: number; flatten: number; stack: number; sweep: number; snap: number; collapse: number };

function beatsFor(scene: TimelineScene): Beats {
  return {
    plateEnd: lineBeat(scene, 0.08),
    revealEnd: lineBeat(scene, 0.26),
    flatten: lineBeat(scene, 0.24),
    stack: lineBeat(scene, 0.42),
    sweep: lineBeat(scene, 0.56),
    snap: lineBeat(scene, 0.82),
    collapse: lineBeat(scene, 0.87),
  };
}

function trialPeriod(frame: number, beats: Beats): number {
  const middle = (beats.sweep + beats.snap) / 2;
  return interpolate(frame, [beats.sweep, middle, beats.snap], [TRUE_PERIOD - 0.26, TRUE_PERIOD + 0.1, TRUE_PERIOD], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
}

function OpeningPlate({ frame, end }: { frame: number; end: number }) {
  if (frame > end + 2) return null;
  const squeeze = ramp(frame, end - 12, end, easeIn);
  return (
    <AbsoluteFill style={{ clipPath: `inset(${squeeze * 46}% 0% ${squeeze * 46}% 0%)` }}>
      <BrollPlate clip="ffi_strips" playbackRate={1.4} scale={1 + frame * 0.002} />
    </AbsoluteFill>
  );
}

export function FoldScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const locked = ramp(frame, beats.snap, beats.snap + 6);
  const state = {
    reveal: ramp(frame, beats.plateEnd - 6, beats.revealEnd, easeInOut),
    flatten: ramp(frame, beats.flatten, beats.flatten + 22, easeInOut),
    stack: ramp(frame, beats.stack, beats.stack + 24, easeInOut),
    trialPeriod: trialPeriod(frame, beats),
    collapse: ramp(frame, beats.collapse, beats.collapse + 22, easeInOut),
    glow: ramp(frame, beats.stack - 4, beats.stack + 14),
  };
  const dialIn = ramp(frame, beats.stack + 6, beats.stack + 20, easeOutSoft);
  const figureIn = ramp(frame, beats.snap, beats.snap + 10, easeOutSoft);
  const pan = lerp(0, -80, ramp(frame, 0, scene.durationInFrames));
  const dipCenter = { x: PLOT.x + PLOT.width / 2, y: PLOT.y + PLOT.height / 2 + 70 };
  return (
    <Paper camera={{ x: -pan, y: 0, scale: 1 + state.collapse * 0.05 }}>
      <Impact hits={[{ at: beats.snap, strength: 0.5, length: 12 }]}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: ramp(frame, beats.collapse + 8, beats.collapse + 30) }}>
          <InkBleed x={dipCenter.x} y={dipCenter.y - 10} size={260} color="var(--class-g)" seed={42} angle={-90} smear={1.4} opacity={0.55} core={false} />
        </svg>
        <div style={{ position: "absolute", left: PLOT.x, top: PLOT.y }}>
          <FoldWaterfall curve={CURVE} state={state} width={PLOT.width} height={PLOT.height} />
        </div>
        <div style={{ position: "absolute", left: DIAL.x, top: DIAL.y, opacity: dialIn, transform: `scale(${0.8 + dialIn * 0.2})` }}>
          <PeriodDial value={state.trialPeriod} min={TRUE_PERIOD - 0.35} max={TRUE_PERIOD + 0.2} size={DIAL.size} locked={locked} />
        </div>
        <Caption text="trial period" x={DIAL.x + DIAL.size / 2} y={DIAL.y - 70} frame={frame} at={beats.stack + 10} align="center" />
        <div className="text-figure" style={{ position: "absolute", left: 1490, top: 660, fontSize: 150, opacity: figureIn, color: "var(--violet)" }}>
          {TRUE_PERIOD.toFixed(2)}
          <span style={{ fontSize: 64, marginLeft: 12 }}>d</span>
        </div>
        <Annotation text="one star's brightness" target={{ x: PLOT.x + 260, y: PLOT.y + PLOT.height / 2 - 40 }} offset={{ x: 60, y: -200 }} frame={frame} at={beats.plateEnd + 8} until={beats.stack} />
        <Annotation text="every dip lines up" target={dipCenter} offset={{ x: -260, y: 190 }} frame={frame} at={beats.collapse + 16} color="var(--class-k)" />
      </Impact>
      <OpeningPlate frame={frame} end={beats.plateEnd} />
    </Paper>
  );
}
