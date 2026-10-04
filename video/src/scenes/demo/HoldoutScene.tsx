import { Atom, CursorClick, Dna, Flask, Leaf, Lightning, Planet, Virus } from "@phosphor-icons/react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Impact } from "../../components/Impact";
import { LabMark } from "../../components/LabMark";
import { Comet, RingTrack, ringPoint } from "../../components/LoopRing";
import { Os9Window } from "../../components/Os9Window";
import { Paper } from "../../components/Paper";
import { SpectrumDip } from "../../components/SpectrumDip";
import { StarBloom } from "../../components/StarBloom";
import { AGENTS } from "../../lib/agents";
import holdoutJson from "../../../public/data/holdout.json";
import { easeIn, easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import { seededRandom } from "../../lib/random";
import { lineOf, type TimelineScene } from "../../lib/timeline";

const HOLDOUT_PLANETS = 37;

type FoldedCurve = { hours: number[]; flux: (number | null)[] };
type HoldoutPlanet = { tic: number; depth_ppm: number; champion: boolean; baseline: boolean; fold: FoldedCurve | null };

const HOLDOUT = (holdoutJson as { planets: HoldoutPlanet[] } | null)?.planets ?? [];

function FoldedDip({ curve, x, y, reveal }: { curve: FoldedCurve; x: number; y: number; reveal: number }) {
  const values = curve.flux.filter((value): value is number => value !== null);
  const low = Math.min(...values);
  const points = curve.flux
    .map((value, index) => (value === null ? null : `${x - 70 + (index / curve.flux.length) * 140 * reveal},${y + ((1 - value) / (1 - low)) * 46}`))
    .filter(Boolean)
    .slice(0, Math.floor(curve.flux.length * reveal));
  return <polyline points={points.join(" ")} fill="none" stroke="var(--violet-deep)" strokeWidth={4} strokeLinejoin="round" />;
}
const CUTOFF_X = 860;
const SCIENCES = [Planet, Atom, Dna, Leaf, Flask, Lightning, Virus];

type Shard = { points: string; cx: number; cy: number; vx: number; vy: number; spin: number };

function buildShards(width: number, height: number): Shard[] {
  const random = seededRandom(37);
  const shards: Shard[] = [];
  const columns = 6;
  const rows = 6;
  const cellW = (width - CUTOFF_X) / columns;
  const cellH = height / rows;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = CUTOFF_X + column * cellW;
      const y = row * cellH;
      const jitter = () => (random() - 0.5) * cellW * 0.4;
      const points = `${x + jitter()},${y + jitter()} ${x + cellW + jitter()},${y + jitter()} ${x + cellW + jitter()},${y + cellH + jitter()} ${x + jitter()},${y + cellH + jitter()}`;
      shards.push({ points, cx: x + cellW / 2, cy: y + cellH / 2, vx: (random() - 0.2) * 900, vy: (random() - 0.6) * 900, spin: (random() - 0.5) * 300 });
    }
  }
  return shards;
}

function holdoutStars(width: number, height: number) {
  const random = seededRandom(370);
  const columns = 6;
  const rows = 7;
  const cellW = (width - CUTOFF_X - 120) / columns;
  const cellH = (height - 140) / rows;
  const cells = Array.from({ length: columns * rows }, (_, index) => ({ index, order: random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, HOLDOUT_PLANETS);
  return cells.map((cell, index) => ({
    x: CUTOFF_X + 60 + ((cell.index % columns) + 0.5 + (random() - 0.5) * 0.4) * cellW,
    y: 60 + (Math.floor(cell.index / columns) + 0.5 + (random() - 0.5) * 0.3) * cellH,
    champion: Boolean(HOLDOUT[index]?.champion),
    baseline: Boolean(HOLDOUT[index]?.baseline),
    fold: HOLDOUT[index]?.fold ?? undefined,
  }));
}

function ApprovalDialog({ frame, clickAt, x, y }: { frame: number; clickAt: number; x: number; y: number }) {
  const appear = ramp(frame, clickAt - 46, clickAt - 36, easeOutSoft);
  const gone = ramp(frame, clickAt + 4, clickAt + 10);
  const cursor = ramp(frame, clickAt - 30, clickAt - 2, easeInOut);
  const pressed = frame >= clickAt && frame < clickAt + 5;
  if (appear <= 0 || gone >= 1) return null;
  return (
    <>
      <Os9Window title="Evaluator" accent="var(--class-k)" width={420} height={190} style={{ left: x, top: y, opacity: appear * (1 - gone), transform: `scale(${0.9 + appear * 0.1})` }}>
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ padding: "16px 54px", fontSize: 34, fontWeight: 700, background: pressed ? "#7a7a7a" : "linear-gradient(#fbfbfb, #d2d2d2)", color: pressed ? "white" : "black", boxShadow: "0 0 0 2px #1d1d1d, 0 0 0 6px #e8e8e8, 0 0 0 8px #1d1d1d" }}>
            Approve
          </div>
        </div>
      </Os9Window>
      <div style={{ position: "absolute", left: lerp(x + 520, x + 250, cursor), top: lerp(y + 360, y + 125, cursor), opacity: 1 - gone }}>
        <CursorClick size={64} weight="fill" color="black" />
      </div>
    </>
  );
}

function FrontierRing({ frame, start, width, height }: { frame: number; start: number; width: number; height: number }) {
  const appear = ramp(frame, start, start + 24, easeOutSoft);
  const climb = ramp(frame, start, start + 110, easeIn);
  const center = { x: width / 2, y: height / 2 + 40 - climb * 140 };
  const radius = 380 + climb * 60;
  if (appear <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: appear }}>
      <svg width={width} height={height}>
        <RingTrack center={center} radius={radius} />
        <Comet center={center} radius={radius} phase={(frame - start) / 45} trail={0.3} size={26} />
      </svg>
      {SCIENCES.map((Icon, index) => {
        const point = ringPoint(center, radius, index / SCIENCES.length + (frame - start) / 600);
        const pop = ramp(frame, start + index * 5, start + index * 5 + 12, easeOutSoft);
        return (
          <div key={index} style={{ position: "absolute", left: point.x - 60, top: point.y - 60, transform: `scale(${pop})` }}>
            <Icon size={120} weight="duotone" color={AGENTS[index].color} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

export function HoldoutScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const exam = lineOf(scene, "demo-holdout");
  const frontier = lineOf(scene, "demo-frontier");
  const clickAt = exam.from + Math.round(exam.durationInFrames * 0.1);
  const baselineAt = exam.from + Math.round(exam.durationInFrames * 0.4);
  const championAt = exam.from + Math.round(exam.durationInFrames * 0.6);
  const baselineReveal = ramp(frame, baselineAt, baselineAt + 14, easeOutSoft);
  const championReveal = ramp(frame, championAt, championAt + 16, easeOutSoft);
  const shatter = ramp(frame, clickAt + 2, clickAt + 40, easeOutSoft);
  const ignite = ramp(frame, clickAt + 10, clickAt + 40, easeInOut);
  const sceneOut = ramp(frame, frontier.from - 14, frontier.from, easeInOut);
  const endCardAt = scene.durationInFrames - 46;
  const endCard = ramp(frame, endCardAt, endCardAt + 16);
  const beamReach = ramp(frame, 6, 30, easeInOut);
  const stars = holdoutStars(width, height);
  const shards = buildShards(width, height);
  const agentCenter = { x: 420, y: height / 2 };
  return (
    <Impact hits={[{ at: clickAt + 2, strength: 1.1, length: 16 }, { at: baselineAt, strength: 0.35, length: 8 }, { at: championAt, strength: 0.5, length: 10 }]}>
      <Paper>
        <AbsoluteFill style={{ opacity: 1 - sceneOut }}>
          <svg width={width} height={height}>
            {AGENTS.map((agent, index) => {
              const point = ringPoint(agentCenter, 200, index / AGENTS.length);
              const tipX = lerp(point.x, CUTOFF_X - 12, beamReach);
              return (
                <g key={agent.key}>
                  <line x1={point.x} y1={point.y} x2={tipX} y2={point.y + (height / 2 - point.y) * 0.3 * beamReach} stroke={agent.color} strokeWidth={4} opacity={0.6 * (1 - shatter)} />
                  <StarBloom x={point.x} y={point.y} size={100} color={agent.color} seed={40 + index} time={frame / 30} specks={1} />
                </g>
              );
            })}
            <line x1={CUTOFF_X} y1={0} x2={CUTOFF_X} y2={height} stroke="var(--violet-deep)" strokeWidth={3} />
            {stars.map((star, index) => (
              <g key={index}>
                <StarBloom x={star.x} y={star.y} size={lerp(40, star.champion ? 130 : 44, championReveal * Number(star.champion))} color={star.champion && championReveal > 0 ? "var(--class-g)" : "var(--violet)"} seed={200 + index} time={frame / 30} brightness={lerp(0.35, 0.6, ignite) + 0.4 * championReveal * Number(star.champion)} specks={1} />
                {star.baseline && <circle cx={star.x} cy={star.y} r={lerp(90, 56, baselineReveal)} fill="none" stroke="var(--violet-deep)" strokeWidth={5} opacity={baselineReveal} />}
              </g>
            ))}
            {stars.map((star, index) =>
              star.champion && star.fold ? <FoldedDip key={`fold-${index}`} curve={star.fold} x={star.x} y={star.y + 64} reveal={ramp(frame, championAt + 8, championAt + 34, easeOutSoft)} /> : null,
            )}
            {shards.map((shard, index) => {
              const t = shatter;
              return (
                <polygon
                  key={index}
                  points={shard.points}
                  fill="#d6dbe8"
                  stroke="#f4f6fb"
                  strokeWidth={2}
                  opacity={0.78 * (1 - t)}
                  transform={`translate(${shard.vx * t} ${shard.vy * t + 500 * t * t}) rotate(${shard.spin * t} ${shard.cx} ${shard.cy})`}
                />
              );
            })}
          </svg>
          <div className="text-data" style={{ position: "absolute", left: CUTOFF_X + 14, top: 30, fontSize: 28, color: "var(--violet-deep)" }}>2026-07-01</div>
          <ApprovalDialog frame={frame} clickAt={clickAt} x={CUTOFF_X - 210} y={height / 2 - 95} />
          <div style={{ position: "absolute", left: 120, bottom: 70, display: "flex", gap: 70, alignItems: "baseline" }}>
            <div className="text-figure" style={{ color: "var(--violet-deep)", opacity: baselineReveal }}>{HOLDOUT.filter((planet) => planet.baseline).length}</div>
            <div className="text-figure" style={{ color: "var(--class-k)", opacity: championReveal }}>{HOLDOUT.filter((planet) => planet.champion).length}</div>
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: 1 - endCard }}>
          <FrontierRing frame={frame} start={frontier.from} width={width} height={height} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: endCard, alignItems: "center", justifyContent: "center", gap: 40, background: "var(--paper)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <LabMark size={120} />
            <div className="text-hero">Planet lab</div>
          </div>
          <SpectrumDip width={900} height={140} bandHeight={14} dipDepth={44} dipCenter={450} dipWidth={160} sweep={endCard} />
        </AbsoluteFill>
      </Paper>
    </Impact>
  );
}
