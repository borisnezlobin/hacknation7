import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Annotation, Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { Paper } from "../../components/Paper";
import { InkBleed } from "../../components/tech/InkBleed";
import { lineBeat } from "../../components/tech/LabRing";
import { SignalCurve, transitEvents, transitRule, type HighlightRule } from "../../components/tech/SignalCurve";
import { LAB, LIGHT_CURVES } from "../../lib/data";
import { easeIn, easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const GLITCH = LIGHT_CURVES.systematic;
const PLANET = LIGHT_CURVES.hero;
const PANEL = { width: 760, height: 340, top: 110 };
const LEFT_X = 140;
const RIGHT_X = 1020;
const BAR = { top: 520, height: 330, width: 120 };
const GLITCH_EVENTS = 1;
const glitchRule: HighlightRule = (time, flux) => flux < 0.96 && time < GLITCH.time[0] + 1;

type Beats = { heat: number; grow: number; pips: number; rescore: number; figure: number };

function beatsFor(scene: TimelineScene): Beats {
  return { heat: lineBeat(scene, 0.12), grow: lineBeat(scene, 0.16), pips: lineBeat(scene, 0.47), rescore: lineBeat(scene, 0.68), figure: lineBeat(scene, 0.76) };
}

function scoreFor(pipeline: string): number {
  const run = LAB.runs.find((candidate) => candidate.pipeline.endsWith(pipeline) && !candidate.quick);
  return run?.metrics.score ?? 0;
}

function Bar({ x, height, color }: { x: number; height: number; color: string }) {
  return <rect x={x - BAR.width / 2} y={BAR.top + BAR.height - height} width={BAR.width} height={height} fill={color} />;
}

function Pips({ x, count, frame, start, color }: { x: number; count: number; frame: number; start: number; color: string }) {
  const pitch = 34;
  const left = x - ((count - 1) * pitch) / 2;
  return (
    <g>
      {Array.from({ length: count }, (_, index) => {
        const pop = ramp(frame, start + index * 4, start + index * 4 + 6, easeOutSoft);
        return <circle key={index} cx={left + index * pitch} cy={BAR.top + BAR.height + 46} r={12 * pop} fill={color} />;
      })}
    </g>
  );
}

function barHeights(frame: number, beats: Beats): { glitch: number; planet: number } {
  const grow = ramp(frame, beats.grow, beats.grow + 50, easeInOut);
  const crush = ramp(frame, beats.rescore, beats.rescore + 10, easeIn);
  const lift = ramp(frame, beats.rescore + 4, beats.rescore + 16, easeOutSoft);
  return { glitch: lerp(BAR.height * 0.9 * grow, BAR.height * 0.18, crush), planet: lerp(BAR.height * 0.62 * grow, BAR.height * 0.98, lift) };
}

function Comparison({ frame, beats }: { frame: number; beats: Beats }) {
  const planetEvents = transitEvents(PLANET).length;
  const heights = barHeights(frame, beats);
  const reveal = ramp(frame, 0, beats.heat + 10, easeInOut);
  const heat = ramp(frame, beats.heat, beats.heat + 16);
  return (
    <>
      <div style={{ position: "absolute", left: LEFT_X, top: PANEL.top }}>
        <SignalCurve curve={GLITCH} width={PANEL.width} height={PANEL.height} reveal={reveal} fluxRange={0.18} highlight={glitchRule} heat={heat} useRaw days={2.5} />
      </div>
      <div style={{ position: "absolute", left: RIGHT_X, top: PANEL.top }}>
        <SignalCurve curve={PLANET} width={PANEL.width} height={PANEL.height} reveal={reveal} fluxRange={0.04} highlight={transitRule(PLANET)} heat={heat} />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Bar x={520} height={heights.glitch} color="var(--class-m)" />
        <Bar x={1400} height={heights.planet} color="var(--violet)" />
        <Pips x={520} count={GLITCH_EVENTS} frame={frame} start={beats.pips} color="var(--class-m)" />
        <Pips x={1400} count={planetEvents} frame={frame} start={beats.pips + 6} color="var(--violet)" />
      </svg>
      <Annotation text="data-gap glitch" target={{ x: LEFT_X + 70, y: PANEL.top + 250 }} offset={{ x: 260, y: 70 }} frame={frame} at={beats.heat + 6} color="var(--class-m)" />
      <Annotation text="real planet" target={{ x: RIGHT_X + 560, y: PANEL.top + 210 }} offset={{ x: 0, y: 150 }} frame={frame} at={beats.heat + 10} />
      <Caption text="1 event" x={520} y={BAR.top + BAR.height + 80} frame={frame} at={beats.pips + 2} align="center" color="var(--class-m)" />
      <Caption text={`${planetEvents} transits`} x={1400} y={BAR.top + BAR.height + 80} frame={frame} at={beats.pips + 8} align="center" />
      <Caption text="What worked" x={960} y={BAR.top + 110} frame={frame} at={0} until={beats.pips - 4} align="center" size="title" />
    </>
  );
}

export function WorkedScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const stageOut = ramp(frame, beats.figure - 6, beats.figure + 14, easeInOut);
  const figureIn = ramp(frame, beats.figure, beats.figure + 14, easeOutSoft);
  const value = interpolate(frame, [beats.figure + 6, beats.figure + 50], [scoreFor("baseline.py"), LAB.champion.score], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const zoom = 1 + stageOut * 0.12;
  return (
    <Paper camera={{ x: 0, y: 0, scale: zoom }}>
      <Impact hits={[{ at: beats.rescore, strength: 0.5 }]}>
        <AbsoluteFill style={{ opacity: 1 - stageOut, transform: `scale(${1 - stageOut * 0.08})` }}>
          <Comparison frame={frame} beats={beats} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: figureIn, alignItems: "center", justifyContent: "center" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <InkBleed x={960} y={560} size={lerp(260, 520, ramp(frame, beats.figure + 6, beats.figure + 50))} color="var(--class-g)" seed={77} angle={-14} smear={1.5} opacity={0.6} core={false} />
          </svg>
          <div className="text-figure" style={{ fontSize: 380, color: "var(--violet-deep)", position: "relative" }}>
            {value.toFixed(2)}
          </div>
          <Caption text="dev score" x={960} y={790} frame={frame} at={beats.figure + 10} align="center" />
        </AbsoluteFill>
      </Impact>
    </Paper>
  );
}
