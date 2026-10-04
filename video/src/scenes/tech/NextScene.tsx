import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Impact } from "../../components/Impact";
import { LabMark } from "../../components/LabMark";
import { Paper } from "../../components/Paper";
import { SpectrumDip } from "../../components/SpectrumDip";
import { LIGHT_CURVES, type LightCurveData } from "../../lib/data";
import { easeIn, easeInOut, easeOutSoft, lerp, pulse, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";
import { Caption } from "../../components/Annotation";
import { lineBeat } from "../../components/tech/LabRing";

const BOX = { width: 900, height: 200 };
const BINS = 44;
const CENTER = { x: 960, y: 500 };

type Beats = { transitStart: number; transitArrives: number; glitchStart: number; glitchHits: number; endCard: number };

function beatsFor(scene: TimelineScene): Beats {
  return {
    transitStart: lineBeat(scene, 0.06),
    transitArrives: lineBeat(scene, 0.34),
    glitchStart: lineBeat(scene, 0.36),
    glitchHits: lineBeat(scene, 0.62),
    endCard: lineBeat(scene, 0.92),
  };
}

function normalisedPath(values: number[]): string {
  const finite = values.filter((value) => Number.isFinite(value));
  const top = Math.max(...finite);
  const bottom = Math.min(...finite);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1) - 0.5) * BOX.width;
    const y = ((top - value) / (top - bottom) - 0.5) * BOX.height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M${points.join(" L")}`;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : NaN;
}

function smooth(values: number[]): number[] {
  return values.map((value, index) => {
    const window = values.slice(Math.max(0, index - 1), index + 2).filter((item) => Number.isFinite(item));
    return window.length ? window.reduce((sum, item) => sum + item, 0) / window.length : value;
  });
}

function binned(times: number[], fluxes: number[], from: number, to: number): number[] {
  const buckets: number[][] = Array.from({ length: BINS }, () => []);
  times.forEach((time, index) => {
    const bin = Math.floor(((time - from) / (to - from)) * BINS);
    if (bin >= 0 && bin < BINS) buckets[bin].push(fluxes[index]);
  });
  const medians = buckets.map(median);
  const fallback = median(fluxes);
  return smooth(medians.map((value) => (Number.isFinite(value) ? value : fallback)));
}

function transitShape(curve: LightCurveData): string {
  const period = curve.period ?? 1;
  const t0 = curve.t0 ?? 0;
  const window = (curve.duration ?? 0.1) * 2.5;
  const phases = curve.time.map((time) => ((((time - t0) % period) + period * 1.5) % period) - period / 2);
  return normalisedPath(binned(phases, curve.flattened, -window, window));
}

function glitchShape(curve: LightCurveData): string {
  const start = curve.time[0];
  const base = median(curve.flux);
  return normalisedPath(binned(curve.time, curve.flux.map((flux) => flux / base), start, start + 0.7));
}

const TRANSIT_PATH = transitShape(LIGHT_CURVES.hero);
const GLITCH_PATH = glitchShape(LIGHT_CURVES.systematic);

function Plate({ flash }: { flash: number }) {
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <mask id="stencil-hole">
          <rect width={1920} height={1080} fill="white" />
          <path d={TRANSIT_PATH} transform={`translate(${CENTER.x} ${CENTER.y})`} fill="none" stroke="black" strokeWidth={64} strokeLinejoin="round" strokeLinecap="round" />
        </mask>
      </defs>
      <g mask="url(#stencil-hole)">
        <rect x={260} y={250} width={1400} height={500} fill="var(--platinum)" />
        <rect x={260} y={250} width={1400} height={500} fill="none" stroke="#9a9a9a" strokeWidth={16} />
        <rect x={260} y={250} width={1400} height={500} fill="var(--class-m)" opacity={flash * 0.5} />
        <rect x={260} y={250} width={1400} height={500} fill="none" stroke="#3a3a3a" strokeWidth={3} />
        <rect x={268} y={258} width={1384} height={484} fill="none" stroke="#ffffff" strokeWidth={3} />
      </g>
      <path d={TRANSIT_PATH} transform={`translate(${CENTER.x} ${CENTER.y + 3})`} fill="none" stroke="#ffffff" strokeWidth={66} strokeLinejoin="round" strokeLinecap="round" opacity={0.6} mask="url(#stencil-hole)" />
    </svg>
  );
}

function Shape({ path, color, scale, opacity, width = 36 }: { path: string; color: string; scale: number; opacity: number; width?: number }) {
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity }}>
      <path d={path} transform={`translate(${CENTER.x} ${CENTER.y}) scale(${scale})`} fill="none" stroke={color} strokeWidth={width / scale} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function EndCard({ frame, at }: { frame: number; at: number }) {
  const show = ramp(frame, at, at + 12, easeOutSoft);
  return (
    <AbsoluteFill style={{ opacity: show, alignItems: "center", justifyContent: "center", gap: 36, background: "var(--paper)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <LabMark size={110} />
        <div className="text-hero">Planet lab</div>
      </div>
      <SpectrumDip width={900} height={140} bandHeight={14} dipDepth={44} dipCenter={450} dipWidth={160} sweep={ramp(frame, at + 4, at + 30, easeInOut)} />
    </AbsoluteFill>
  );
}

export function NextScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const beats = beatsFor(scene);
  const transitApproach = ramp(frame, beats.transitStart, beats.transitArrives, easeIn);
  const transitPass = ramp(frame, beats.transitArrives, beats.transitArrives + 14, easeIn);
  const transitScale = frame < beats.transitArrives ? lerp(0.15, 1, transitApproach) : lerp(1, 3.5, transitPass);
  const glitchApproach = ramp(frame, beats.glitchStart, beats.glitchHits, easeIn);
  const glitchFall = ramp(frame, beats.glitchHits + 4, beats.glitchHits + 30, easeIn);
  const flash = pulse(frame, beats.glitchHits, 1, 12);
  const shake = Math.sin(frame * 3.4) * pulse(frame, beats.glitchHits, 1, 10) * 22;
  const passed = frame >= beats.transitArrives;
  const plateIn = ramp(frame, 0, 10, easeOutSoft);
  const push = lerp(1, 1.04, ramp(frame, 0, beats.endCard));
  const glitch = (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${shake}px, ${glitchFall * 700}px) rotate(${glitchFall * 18}deg)` }}>
      <Shape path={GLITCH_PATH} color="var(--class-m)" scale={lerp(0.15, 1, glitchApproach)} opacity={glitchApproach} />
    </div>
  );
  return (
    <Paper camera={{ x: 0, y: 0, scale: push }}>
      <Impact hits={[{ at: beats.glitchHits, strength: 0.5 }]}>
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          <div style={{ position: "absolute", left: 260, top: 250, width: 1400, height: 500, background: "var(--violet-deep)", opacity: plateIn, boxShadow: "0 30px 80px rgb(20 16 60 / 0.35)" }} />
          {!passed && <Shape path={TRANSIT_PATH} color="var(--class-g)" scale={transitScale} opacity={transitApproach} />}
          {frame >= beats.glitchStart && frame < beats.glitchHits && glitch}
          <div style={{ position: "absolute", inset: 0, opacity: plateIn }}>
            <Plate flash={flash} />
          </div>
          {frame >= beats.glitchHits && glitch}
          {passed && <Shape path={TRANSIT_PATH} color="var(--class-g)" scale={transitScale} opacity={1 - transitPass} width={42} />}
          <Caption text="Next: shape checks" x={960} y={140} frame={frame} at={4} until={beats.endCard - 6} align="center" size="title" />
          <Caption text="planet passes" x={960} y={790} frame={frame} at={beats.transitArrives - 4} until={beats.glitchStart + 4} align="center" color="var(--class-k)" />
          <Caption text="glitch rejected" x={960} y={790} frame={frame} at={beats.glitchHits + 2} until={beats.endCard - 6} align="center" color="var(--class-m)" />
        </AbsoluteFill>
      </Impact>
      <EndCard frame={frame} at={beats.endCard} />
    </Paper>
  );
}
