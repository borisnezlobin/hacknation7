import { useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { LightCurveCanvas } from "../../components/LightCurveCanvas";
import { Comet, RingTrack, ringPoint, type Point } from "../../components/LoopRing";
import { Paper } from "../../components/Paper";
import { StarBloom } from "../../components/StarBloom";
import { AGENTS } from "../../lib/agents";
import { LIGHT_CURVES } from "../../lib/data";
import { easeInOut, easeOutSoft, lerp, pulse, ramp } from "../../lib/motion";
import { seededRandom } from "../../lib/random";
import { lineOf, type TimelineScene } from "../../lib/timeline";

const RADIUS = 380;
const ACTIVE = ["pi", "literature", "analyst", "engineer", "skeptic"];

type Beats = { pi: number; literature: number; analyst: number; engineer: number; skeptic: number; end: number };

function beatsFor(scene: TimelineScene): Beats {
  const line = lineOf(scene, "demo-loop");
  const at = (fraction: number) => line.from + Math.round(line.durationInFrames * fraction);
  return { pi: line.from - 4, literature: at(0.02), analyst: at(0.24), engineer: at(0.48), skeptic: at(0.78), end: scene.durationInFrames };
}

function cometPhase(frame: number, beats: Beats): number {
  const toEngineer = ramp(frame, beats.pi, beats.engineer, easeInOut) * (3 / 7);
  const toSkeptic = ramp(frame, beats.engineer + 10, beats.skeptic, easeInOut) * (1 / 7);
  const onward = ramp(frame, beats.skeptic + 10, beats.end, easeInOut) * (3 / 7);
  return toEngineer + toSkeptic + onward;
}

function SkepticCheck({ at, frame, skeptic, targets }: { at: number; frame: number; skeptic: Point; targets: Point[] }) {
  const sweep = ramp(frame, at, at + 20, easeInOut);
  const approve = ramp(frame, at + 18, at + 28, easeOutSoft);
  if (sweep <= 0) return null;
  return (
    <g>
      {targets.map((target, index) => {
        const reach = ramp(sweep, index / targets.length, (index + 1) / targets.length);
        return <line key={index} x1={skeptic.x} y1={skeptic.y} x2={lerp(skeptic.x, target.x, reach)} y2={lerp(skeptic.y, target.y, reach)} stroke="var(--class-g)" strokeWidth={5} strokeDasharray="10 8" opacity={0.85 * (1 - approve * 0.6)} />;
      })}
      <circle cx={skeptic.x} cy={skeptic.y} r={90 + approve * 30} fill="none" stroke="var(--class-g)" strokeWidth={6} opacity={approve * (1 - ramp(frame, at + 40, at + 60))} />
    </g>
  );
}

function labelPosition(point: Point, center: Point): { x: number; y: number; align: "left" | "right" | "center" } {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const length = Math.hypot(dx, dy) || 1;
  const x = point.x + (dx / length) * 120;
  const y = point.y + (dy / length) * 95 - 22;
  if (Math.abs(dx) < 60) return { x, y, align: "center" };
  return { x, y, align: dx > 0 ? "left" : "right" };
}

function PulseRings({ at, frame, point }: { at: number; frame: number; point: Point }) {
  return (
    <g>
      {[0, 8, 16].map((delay) => {
        const amount = ramp(frame, at + delay, at + delay + 30, easeOutSoft);
        if (amount <= 0 || amount >= 1) return null;
        return <circle key={delay} cx={point.x} cy={point.y} r={40 + amount * 220} fill="none" stroke="var(--class-o)" strokeWidth={6 * (1 - amount)} opacity={1 - amount} />;
      })}
    </g>
  );
}

function PaperSwarm({ at, frame, target, width, height }: { at: number; frame: number; target: Point; width: number; height: number }) {
  const random = seededRandom(17);
  const sheets = Array.from({ length: 16 }, () => ({ angle: random() * Math.PI * 2, delay: random() * 14, spin: (random() - 0.5) * 540 }));
  return (
    <>
      {sheets.map((sheet, index) => {
        const travel = ramp(frame, at + sheet.delay, at + sheet.delay + 22, easeInOut);
        if (travel <= 0 || travel >= 1) return null;
        const startX = width / 2 + Math.cos(sheet.angle) * width * 0.7;
        const startY = height / 2 + Math.sin(sheet.angle) * height * 0.7;
        const x = lerp(startX, target.x, travel);
        const y = lerp(startY, target.y, travel);
        return (
          <div key={index} style={{ position: "absolute", left: x - 26, top: y - 34, width: 52, height: 68, background: "var(--paper-light)", boxShadow: "0 0 0 1px #9a98b0, 3px 4px 0 var(--class-b)", transform: `rotate(${sheet.spin * (1 - travel)}deg) scale(${1 - travel * 0.6})`, padding: 7, display: "flex", flexDirection: "column", gap: 5 }}>
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} style={{ height: 3, width: `${90 - row * 12}%`, background: "#b6b4c8" }} />
            ))}
          </div>
        );
      })}
    </>
  );
}

function AnalystInsight({ at, frame, anchor }: { at: number; frame: number; anchor: Point }) {
  const open = ramp(frame, at, at + 12, easeOutSoft);
  const close = ramp(frame, at + 52, at + 62);
  const flash = pulse(frame, at + 18, 3, 16);
  if (open <= 0 || close >= 1) return null;
  return (
    <div style={{ position: "absolute", left: anchor.x > 960 ? anchor.x - 610 : anchor.x + 90, top: anchor.y - 120, width: 520, height: 230, opacity: open * (1 - close), transform: `scale(${0.6 + open * 0.4})`, transformOrigin: anchor.x > 960 ? "right center" : "left center", background: "var(--paper-light)", boxShadow: "0 0 0 2px var(--class-a), 8px 10px 0 rgb(29 20 104 / 0.15)" }}>
      <LightCurveCanvas curve={LIGHT_CURVES.systematic} view={{ reveal: 1, fold: 0, flatten: 1, depthRange: 0.2, highlightTransits: 0 }} width={520} height={230} pointSize={2.4} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 46, height: 230, background: "var(--class-m)", opacity: 0.25 + flash * 0.6, mixBlendMode: "multiply" }} />
    </div>
  );
}

function Sparks({ at, frame, from, to }: { at: number; frame: number; from: Point; to: Point }) {
  return (
    <>
      {[0, 1, 2].map((index) => {
        const travel = ramp(frame, at + index * 4, at + index * 4 + 20, easeInOut);
        if (travel <= 0 || travel >= 1) return null;
        const bend = (index - 1) * 120 * Math.sin(travel * Math.PI);
        return <circle key={index} cx={lerp(from.x, to.x, travel) + bend} cy={lerp(from.y, to.y, travel) - Math.abs(bend) * 0.4} r={14} fill="var(--class-a)" />;
      })}
    </>
  );
}

function EngineerSplit({ at, frame, base, center, freeze }: { at: number; frame: number; base: Point; center: Point; freeze: number }) {
  const split = ramp(frame, at, at + 16, easeOutSoft);
  const beams = ramp(frame, at + 14, freeze, easeInOut);
  const bounce = ramp(frame, freeze, freeze + 14, easeOutSoft);
  if (split <= 0) return null;
  return (
    <g>
      {[-1, 0, 1].map((offset) => {
        const point = { x: base.x + offset * 120 * split, y: base.y - Math.abs(offset) * 110 * split };
        const towards = { x: lerp(point.x, center.x, 0.78), y: lerp(point.y, center.y, 0.78) };
        const tip = { x: lerp(point.x, towards.x, beams - bounce * 0.5), y: lerp(point.y, towards.y, beams - bounce * 0.5) };
        return (
          <g key={offset}>
            <line x1={point.x} y1={point.y} x2={tip.x} y2={tip.y} stroke="var(--class-f)" strokeWidth={9} strokeLinecap="round" opacity={beams > 0 ? 0.85 : 0} />
            {offset !== 0 && <StarBloom x={point.x} y={point.y} size={150} color="var(--class-f)" seed={70 + offset} time={frame / 30} specks={2} />}
          </g>
        );
      })}
    </g>
  );
}

const LABEL_TIMES: Record<string, keyof Beats> = { pi: "pi", literature: "literature", analyst: "analyst", engineer: "engineer", skeptic: "skeptic" };

export function LoopScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const center = { x: width / 2, y: height / 2 + 10 };
  const beats = beatsFor(scene);
  const positions = AGENTS.map((agent, index) => ({ agent, point: ringPoint(center, RADIUS, index / AGENTS.length) }));
  const at = (key: string) => positions.find((entry) => entry.agent.key === key)?.point ?? center;
  const phase = cometPhase(frame, beats);
  const engineerBase = at("engineer");
  const engineerCopies = [-1, 0, 1].map((offset) => ({ x: engineerBase.x + offset * 120, y: engineerBase.y - Math.abs(offset) * 110 }));
  return (
    <Impact hits={[{ at: beats.engineer + 14, strength: 0.4, length: 8 }]}>
      <Paper camera={{ x: phase * 300, y: 0, scale: 1 }}>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <RingTrack center={center} radius={RADIUS} />
          {positions.map(({ agent, point }, index) => {
            const appear = ramp(frame, index * 2, index * 2 + 12, easeOutSoft);
            const lit = ACTIVE.includes(agent.key) ? 1 : 0.45;
            return <StarBloom key={agent.key} x={point.x} y={point.y} size={150 * appear} color={agent.color} seed={40 + index} time={frame / 30} brightness={lit} specks={2} />;
          })}
          <PulseRings at={beats.pi} frame={frame} point={at("pi")} />
          <Sparks at={beats.analyst + 26} frame={frame} from={at("analyst")} to={at("pi")} />
          <EngineerSplit at={beats.engineer} frame={frame} base={engineerBase} center={center} freeze={beats.skeptic} />
          <SkepticCheck at={beats.skeptic} frame={frame} skeptic={at("skeptic")} targets={engineerCopies} />
          <Comet center={center} radius={RADIUS} phase={phase} trail={0.12} size={26} />
        </svg>
        {positions.map(({ agent, point }, index) => {
          const Icon = agent.icon;
          const appear = ramp(frame, index * 2 + 4, index * 2 + 16, easeOutSoft);
          const label = labelPosition(point, center);
          const timeKey = LABEL_TIMES[agent.key];
          return (
            <div key={agent.key}>
              <div style={{ position: "absolute", left: point.x - 30, top: point.y - 30, transform: `scale(${appear})`, opacity: ACTIVE.includes(agent.key) ? 1 : 0.55 }}>
                <Icon size={60} weight="bold" color="var(--paper-light)" />
              </div>
              <Caption text={agent.name} x={label.x} y={label.y} frame={frame} at={timeKey ? beats[timeKey] : 10} align={label.align} color={agent.color} />
            </div>
          );
        })}
        <PaperSwarm at={beats.literature} frame={frame} target={at("literature")} width={width} height={height} />
        <AnalystInsight at={beats.analyst} frame={frame} anchor={at("analyst")} />
      </Paper>
    </Impact>
  );
}
