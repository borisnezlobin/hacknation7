import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BrollPlate } from "../../components/BrollPlate";
import { CurveWall } from "../../components/CurveWall";
import { Impact } from "../../components/Impact";
import { LightCurveCanvas } from "../../components/LightCurveCanvas";
import { Paper } from "../../components/Paper";
import { StarBloom } from "../../components/StarBloom";
import { StarField } from "../../components/StarField";
import { LIGHT_CURVES, STAR_FIELD } from "../../lib/data";
import { easeIn, easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";

const BEAT = { lensDive: 44, bloomIn: 54, transitStart: 68, transitEnd: 124, noiseMorph: 132, wallStart: 162, fieldStart: 190 };
const WALL = { columns: 24, rows: 30 };

function transitShape(progress: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  return Math.min(1, progress / 0.14, (1 - progress) / 0.14);
}

function SpacecraftPrelude({ frame }: { frame: number }) {
  const push = lerp(1.05, 1.5, ramp(frame, 0, BEAT.lensDive + 10, easeIn));
  const fade = 1 - ramp(frame, BEAT.lensDive, BEAT.bloomIn);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <BrollPlate clip="tess_hero" startFrom={20} scale={push} />
    </AbsoluteFill>
  );
}

function CleanTrace({ frame, width, height }: { frame: number; width: number; height: number }) {
  const steps = 260;
  const reveal = ramp(frame, BEAT.bloomIn, BEAT.transitEnd + 10, easeInOut);
  const points: string[] = [];
  for (let i = 0; i <= steps * reveal; i++) {
    const t = i / steps;
    const transitT = (t - 0.3) / 0.4;
    points.push(`${(t * width).toFixed(1)},${(height / 2 + transitShape(transitT) * 90).toFixed(1)}`);
  }
  return (
    <svg width={width} height={height}>
      <polyline points={points.join(" ")} fill="none" stroke="var(--violet-deep)" strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
}

function StarAndDip({ frame, width, height }: { frame: number; width: number; height: number }) {
  const transit = transitShape((frame - BEAT.transitStart) / (BEAT.transitEnd - BEAT.transitStart));
  const appear = ramp(frame, BEAT.bloomIn, BEAT.bloomIn + 10);
  const morph = ramp(frame, BEAT.noiseMorph, BEAT.noiseMorph + 22, easeInOut);
  const gone = ramp(frame, BEAT.wallStart, BEAT.wallStart + 10);
  return (
    <>
      <AbsoluteFill style={{ opacity: appear * (1 - morph * 0.85) * (1 - gone) }}>
        <svg width={width} height={height}>
          <StarBloom
            x={width / 2}
            y={height * 0.38}
            size={560}
            color="var(--violet)"
            seed={11}
            time={frame / 30}
            brightness={1 - transit * 0.5}
            specks={9}
            planet={{ progress: (frame - BEAT.transitStart) / (BEAT.transitEnd - BEAT.transitStart) }}
          />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#14123a", opacity: transit * 0.2, mixBlendMode: "multiply" }} />
      <div style={{ position: "absolute", left: 120, top: height * 0.66, opacity: appear * (1 - morph) }}>
        <CleanTrace frame={frame} width={width - 240} height={240} />
      </div>
      <div style={{ position: "absolute", left: 0, top: height * 0.5, opacity: morph * (1 - gone) }}>
        <LightCurveCanvas
          curve={LIGHT_CURVES.shallow}
          view={{ reveal: 1, fold: 0, flatten: 1, depthRange: lerp(0.0015, 0.004, morph), highlightTransits: 0 }}
          width={width}
          height={420}
          pointSize={3}
        />
      </div>
    </>
  );
}

function WallToField({ frame, width, height }: { frame: number; width: number; height: number }) {
  const zoomOut = ramp(frame, BEAT.wallStart, BEAT.fieldStart + 6, easeInOut);
  const cellScale = Math.exp(lerp(Math.log(WALL.columns * 0.9), 0, zoomOut));
  const toField = ramp(frame, BEAT.fieldStart, BEAT.fieldStart + 22, easeOutSoft);
  const fieldZoom = lerp(4, 1.05, ramp(frame, BEAT.fieldStart, BEAT.fieldStart + 60, easeOutSoft));
  const counter = Math.round(STAR_FIELD.total_stars * ramp(frame, BEAT.wallStart + 6, BEAT.fieldStart + 30, easeOutSoft));
  if (frame < BEAT.wallStart) return null;
  return (
    <>
      <AbsoluteFill style={{ opacity: 1 - toField, transform: `scale(${cellScale})`, transformOrigin: `${width * (12.5 / WALL.columns)}px ${height * (15.5 / WALL.rows)}px` }}>
        <CurveWall width={width} height={height} columns={WALL.columns} rows={WALL.rows} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: toField }}>
        <StarField camera={{ zoom: fieldZoom, focusX: 0, focusY: 0, rotation: 0.15 }} twinkleTime={frame / 30} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "flex-end", padding: "0 0 80px 110px" }}>
        <div className="text-figure" style={{ color: "var(--violet-deep)" }}>{counter.toLocaleString("en-US")}</div>
      </AbsoluteFill>
    </>
  );
}

export function OpenScene() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <Impact hits={[{ at: BEAT.bloomIn - 2, strength: 0.9, length: 14 }, { at: BEAT.fieldStart, strength: 0.6, length: 12 }]}>
      <Paper>
        <StarAndDip frame={frame} width={width} height={height} />
        <WallToField frame={frame} width={width} height={height} />
        {frame < BEAT.bloomIn && <SpacecraftPrelude frame={frame} />}
      </Paper>
    </Impact>
  );
}
