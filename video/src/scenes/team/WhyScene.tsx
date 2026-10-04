import { ChartBar, CheckFat, Lightbulb, LockSimple, X } from "@phosphor-icons/react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Impact } from "../../components/Impact";
import { Comet, RingTrack, ringPoint, type Point } from "../../components/LoopRing";
import { Os9Window } from "../../components/Os9Window";
import { Paper } from "../../components/Paper";
import { StarBloom } from "../../components/StarBloom";
import { ZoomRects } from "../../components/ZoomRects";
import { AGENTS } from "../../lib/agents";
import { easeIn, easeInOut, easeOutSoft, lerp, pulse, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const RADIUS = 360;
const DEMO_RECT = { x: 610, y: 270, width: 700, height: 480 };

type Beats = { closeDemo: number; lab: number; idea: number; scorer: number; argue: number; end: number };

function beatsFor(scene: TimelineScene): Beats {
  const line = scene.lines[0];
  const at = (fraction: number) => line.from + Math.round(line.durationInFrames * fraction);
  return { closeDemo: at(0.17), lab: at(0.24), idea: at(0.42), scorer: at(0.6), argue: at(0.78), end: scene.durationInFrames };
}

function DemoWindow({ frame, beats }: { frame: number; beats: Beats }) {
  const collapse = ramp(frame, beats.closeDemo, beats.closeDemo + 8, easeIn);
  if (collapse >= 1) return <ZoomRects frame={frame} start={beats.closeDemo + 8} frames={8} from={DEMO_RECT} to={{ x: 950, y: 530, width: 20, height: 20 }} />;
  const hover = pulse(frame, beats.closeDemo - 10, 6, 12);
  return (
    <Os9Window title="demo" width={DEMO_RECT.width} height={DEMO_RECT.height} style={{ left: DEMO_RECT.x, top: DEMO_RECT.y, opacity: 1 - collapse }}>
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChartBar size={220} weight="duotone" color="var(--ink-faint)" />
      </div>
      <div style={{ position: "absolute", right: 24, top: 18, opacity: hover }}>
        <X size={80} weight="bold" color="var(--class-m)" />
      </div>
    </Os9Window>
  );
}

function IdeaSpark({ frame, start, from, to }: { frame: number; start: number; from: Point; to: Point }) {
  const travel = ramp(frame, start, start + 24, easeInOut);
  const appear = ramp(frame, start - 6, start + 4, easeOutSoft);
  if (appear <= 0 || travel >= 1) return null;
  return (
    <div style={{ position: "absolute", left: lerp(from.x, to.x, travel) - 45, top: lerp(from.y, to.y, travel) - 45 - Math.sin(travel * Math.PI) * 120, transform: `scale(${appear})` }}>
      <Lightbulb size={90} weight="fill" color="var(--class-f)" />
    </div>
  );
}

function ScorerLock({ frame, start, center, engineer }: { frame: number; start: number; center: Point; engineer: Point }) {
  const beam = ramp(frame, start, start + 14, easeInOut);
  const bounce = ramp(frame, start + 14, start + 26, easeOutSoft);
  const appear = ramp(frame, start - 4, start + 6, easeOutSoft);
  if (appear <= 0) return null;
  const reach = beam - bounce * 0.45;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={center.x} cy={center.y} r={130 * appear} fill="#dfe8f6" opacity={0.9} />
        <line x1={engineer.x} y1={engineer.y} x2={lerp(engineer.x, center.x, reach * 0.72)} y2={lerp(engineer.y, center.y, reach * 0.72)} stroke="var(--class-f)" strokeWidth={10} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: center.x - 50, top: center.y - 54, transform: `scale(${appear})` }}>
        <LockSimple size={100} weight="fill" color="#2a3b6b" />
      </div>
    </>
  );
}

function Argument({ frame, start, left, right }: { frame: number; start: number; left: Point; right: Point }) {
  const volleys = 4;
  const local = frame - start;
  if (local < 0) return null;
  const volley = Math.min(volleys - 1, Math.floor(local / 12));
  const travel = ramp(local - volley * 12, 0, 10, easeInOut);
  const fromLeft = volley % 2 === 0;
  const a = fromLeft ? left : right;
  const b = fromLeft ? right : left;
  const settled = ramp(local, volleys * 12, volleys * 12 + 10, easeOutSoft);
  const mid = { x: (left.x + right.x) / 2, y: Math.min(left.y, right.y) - 160 };
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {settled < 1 && <circle cx={lerp(a.x, b.x, travel)} cy={lerp(a.y, b.y, travel) - Math.sin(travel * Math.PI) * 140} r={18} fill={fromLeft ? "var(--class-f)" : "var(--class-g)"} />}
      </svg>
      {settled > 0 && (
        <div style={{ position: "absolute", left: mid.x - 60, top: mid.y - 60, transform: `scale(${settled})` }}>
          <CheckFat size={120} weight="fill" color="var(--violet-deep)" />
        </div>
      )}
    </>
  );
}

export function WhyScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const beats = beatsFor(scene);
  const center = { x: width / 2, y: height / 2 };
  const ringIn = ramp(frame, beats.lab, beats.lab + 20, easeOutSoft);
  const point = (key: string) => ringPoint(center, RADIUS, AGENTS.findIndex((agent) => agent.key === key) / AGENTS.length);
  return (
    <Impact hits={[{ at: beats.lab, strength: 0.6, length: 10 }, { at: beats.scorer + 14, strength: 0.7, length: 10 }]}>
      <Paper>
        {frame < beats.lab + 16 && <DemoWindow frame={frame} beats={beats} />}
        {ringIn > 0 && (
          <AbsoluteFill style={{ opacity: ringIn, transform: `scale(${0.7 + ringIn * 0.3})` }}>
            <svg width={width} height={height}>
              <RingTrack center={center} radius={RADIUS} />
              {AGENTS.map((agent, index) => {
                const at = ringPoint(center, RADIUS, index / AGENTS.length);
                return <StarBloom key={agent.key} x={at.x} y={at.y} size={140} color={agent.color} seed={40 + index} time={frame / 30} specks={2} />;
              })}
              <Comet center={center} radius={RADIUS} phase={(frame - beats.lab) / 70} trail={0.2} size={24} />
            </svg>
            {AGENTS.map((agent, index) => {
              const at = ringPoint(center, RADIUS, index / AGENTS.length);
              const Icon = agent.icon;
              return (
                <div key={agent.key} style={{ position: "absolute", left: at.x - 28, top: at.y - 28 }}>
                  <Icon size={56} weight="bold" color="var(--paper-light)" />
                </div>
              );
            })}
            <IdeaSpark frame={frame} start={beats.idea} from={point("analyst")} to={point("pi")} />
            {frame >= beats.scorer - 4 && frame < beats.argue && <ScorerLock frame={frame} start={beats.scorer} center={center} engineer={point("engineer")} />}
            <Argument frame={frame} start={beats.argue} left={point("engineer")} right={point("skeptic")} />
          </AbsoluteFill>
        )}
      </Paper>
    </Impact>
  );
}
