import { CodeSimple, Planet, Scales, User } from "@phosphor-icons/react";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { Comet, ClockHand, ClockTicks, RingTrack, ringPoint } from "../../components/LoopRing";
import { Paper } from "../../components/Paper";
import { StarBloom } from "../../components/StarBloom";
import { easeInOut, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const STATIONS = [
  { turn: 0, icon: CodeSimple, seed: 61 },
  { turn: 1 / 3, icon: Planet, seed: 62 },
  { turn: 2 / 3, icon: Scales, seed: 63 },
];

const DAY_CYCLE = ["#e8e7e2", "#d9cdbd", "#8f8aa8", "#3a3760", "#8f8aa8", "#e8e7e2"];

function daylight(frame: number, duration: number): string {
  const cycles = 2.2;
  const position = ((frame / duration) * cycles) % 1;
  return interpolateColors(position, DAY_CYCLE.map((_, index) => index / (DAY_CYCLE.length - 1)), DAY_CYCLE);
}

export function BottleneckScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const center = { x: width / 2, y: height / 2 };
  const radius = 360;
  const appear = ramp(frame, 0, 18);
  const crawl = ramp(frame, 8, scene.durationInFrames, easeInOut) * 0.92;
  const handTurns = (frame / scene.durationInFrames) * 2.2 * 12;
  const tone = daylight(frame, scene.durationInFrames);
  return (
    <Paper tone={tone}>
      <AbsoluteFill style={{ opacity: appear }}>
        <svg width={width} height={height}>
          <RingTrack center={center} radius={radius} />
          <ClockTicks center={center} radius={150} opacity={0.6} />
          <ClockHand center={center} length={130} turns={handTurns} />
          <ClockHand center={center} length={90} turns={handTurns / 12} width={9} />
          {STATIONS.map((station) => {
            const point = ringPoint(center, radius, station.turn);
            return <StarBloom key={station.seed} x={point.x} y={point.y} size={150} color="var(--ink-faint)" seed={station.seed} time={frame / 30} specks={2} />;
          })}
          <Comet center={center} radius={radius} phase={crawl} trail={0.05} size={16} glow="var(--ink-muted)" intensity={0.8} />
        </svg>
        {STATIONS.map((station) => {
          const point = ringPoint(center, radius, station.turn);
          const Icon = station.icon;
          return (
            <div key={station.seed} style={{ position: "absolute", left: point.x - 30, top: point.y - 30 }}>
              <Icon size={60} weight="bold" color="var(--paper-light)" />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: center.x - 30, top: center.y + 170 }}>
          <User size={60} weight="fill" color="var(--violet-deep)" />
        </div>
      </AbsoluteFill>
    </Paper>
  );
}
