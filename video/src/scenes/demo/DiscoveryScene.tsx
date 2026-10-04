import { Funnel } from "@phosphor-icons/react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Caption } from "../../components/Annotation";
import { Impact } from "../../components/Impact";
import { Paper } from "../../components/Paper";
import { StarBloom } from "../../components/StarBloom";
import { agentByKey } from "../../lib/agents";
import { LAB } from "../../lib/data";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import { seededRandom } from "../../lib/random";
import type { TimelineScene } from "../../lib/timeline";

const UNLABELLED = 1499;
const FIELD = { left: 90, top: 150, width: 1100, height: 800, columns: 50 };
const MAX_SHOWN = 4;

type FoldedCurve = { hours: number[]; flux: (number | null)[] };
type Candidate = { tic: number; period: number; depth_ppm: number; lightcurve: FoldedCurve };

const CANDIDATES = (LAB.candidates as unknown as Candidate[]).slice(0, MAX_SHOWN);

function CandidateDip({ candidate, x, y, reveal }: { candidate: Candidate; x: number; y: number; reveal: number }) {
  const values = candidate.lightcurve.flux.filter((value): value is number => value !== null);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const points = candidate.lightcurve.flux
    .map((value, index) => (value === null ? null : `${x + (index / candidate.lightcurve.flux.length) * 420},${y + ((high - value) / (high - low || 1)) * 90}`))
    .filter(Boolean)
    .slice(0, Math.floor(candidate.lightcurve.flux.length * reveal));
  return <polyline points={points.join(" ")} fill="none" stroke="var(--violet-deep)" strokeWidth={4} strokeLinejoin="round" />;
}

function UnlabelledField({ frame, sweep }: { frame: number; sweep: number }) {
  const random = seededRandom(1499);
  const rows = Math.ceil(UNLABELLED / FIELD.columns);
  const cellW = FIELD.width / FIELD.columns;
  const cellH = FIELD.height / rows;
  const scanX = FIELD.left + sweep * FIELD.width;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: UNLABELLED }, (_, index) => {
        const x = FIELD.left + (index % FIELD.columns) * cellW + (random() - 0.5) * cellW * 0.6;
        const y = FIELD.top + Math.floor(index / FIELD.columns) * cellH + (random() - 0.5) * cellH * 0.6;
        const appear = ramp(frame, (index % FIELD.columns) * 0.3, (index % FIELD.columns) * 0.3 + 10);
        const searched = x <= scanX;
        return <circle key={index} cx={x} cy={y} r={3.4} fill={searched ? "var(--violet)" : "var(--ink-faint)"} opacity={appear * (searched ? 0.9 : 0.5)} />;
      })}
      {sweep > 0 && sweep < 1 && <line x1={scanX} x2={scanX} y1={FIELD.top - 20} y2={FIELD.top + FIELD.height + 20} stroke="var(--class-m)" strokeWidth={4} />}
    </svg>
  );
}

export function DiscoveryScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const line = scene.lines[0];
  const sweep = ramp(frame, line.from, line.from + line.durationInFrames * 0.75, easeInOut);
  const vetter = agentByKey("vetter");
  const funnel = { x: 1390, y: 540 };
  const shelfAt = line.from + Math.round(line.durationInFrames * 0.5);
  return (
    <Impact hits={CANDIDATES.length ? [{ at: shelfAt, strength: 0.4, length: 10 }] : []}>
      <Paper camera={{ x: sweep * 400, y: 0, scale: 1 }}>
        <UnlabelledField frame={frame} sweep={sweep} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <StarBloom x={funnel.x} y={funnel.y} size={170} color={vetter.color} seed={46} time={frame / 30} specks={2} />
        </svg>
        <div style={{ position: "absolute", left: funnel.x - 40, top: funnel.y - 40 }}>
          <Funnel size={80} weight="bold" color="var(--paper-light)" />
        </div>
        <Caption text={vetter.name} x={funnel.x} y={funnel.y + 110} frame={frame} at={6} align="center" color={vetter.color} />
        <Caption text={`${UNLABELLED.toLocaleString("en-US")} unlabelled stars`} x={FIELD.left} y={FIELD.top - 110} frame={frame} at={line.from} size="title" />
        {CANDIDATES.map((candidate, index) => {
          const reveal = ramp(frame, shelfAt + index * 8, shelfAt + index * 8 + 22, easeOutSoft);
          const y = 180 + index * 190;
          return reveal > 0 ? (
            <AbsoluteFill key={candidate.tic} style={{ opacity: reveal, transform: `translateX(${lerp(-200, 0, reveal)}px)` }}>
              <svg width={1920} height={1080}>
                <CandidateDip candidate={candidate} x={1460} y={y} reveal={reveal} />
              </svg>
            </AbsoluteFill>
          ) : null;
        })}
        {CANDIDATES.length > 0 && <Caption text={`${LAB.candidates.length} new candidates`} x={1670} y={90} frame={frame} at={shelfAt} align="center" size="title" color="var(--class-m)" />}
      </Paper>
    </Impact>
  );
}
