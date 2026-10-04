import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../../components/Annotation";
import { BrollPlate, SUN_DUOTONE } from "../../components/BrollPlate";
import { Impact } from "../../components/Impact";
import { Os9Window } from "../../components/Os9Window";
import { Paper } from "../../components/Paper";
import { SolarGrid, projectSolar } from "../../components/SolarGrid";
import { StarBloom } from "../../components/StarBloom";
import { ZoomRects } from "../../components/ZoomRects";
import { BORIS_CLIPS, BORIS_PHOTO } from "../../lib/footage";
import { easeInOut, easeOutSoft, lerp, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const SUN = { x: 960, y: 540, radius: 424 };

export function PersonStar({ x, y, size, frame }: { x: number; y: number; size: number; frame: number }) {
  const side = size * 0.78;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <StarBloom x={x} y={y} size={size * 1.1} color="var(--violet)" seed={7} time={frame / 30} specks={4} brightness={0.7} />
      </svg>
      <Img src={staticFile(BORIS_PHOTO)} style={{ position: "absolute", left: x - side / 2, top: y - side / 2, width: side, height: side, objectFit: "cover", boxShadow: "0 0 0 3px var(--paper-light), 6px 10px 24px rgb(29 20 104 / 0.3)" }} />
    </>
  );
}

const PORTRAIT = { x: 300, y: 120, width: 520, height: 820 };

function BorisClips({ frame, start }: { frame: number; start: number }) {
  let offset = start;
  for (const clip of BORIS_CLIPS) {
    if (frame < offset + clip.frames) {
      return (
        <Sequence from={offset} durationInFrames={clip.frames} layout="none">
          <OffthreadVideo src={staticFile(clip.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }} />
        </Sequence>
      );
    }
    offset += clip.frames;
  }
  return <Img src={staticFile(BORIS_PHOTO)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}

function Portrait({ frame }: { frame: number }) {
  const open = 9;
  return (
    <>
      <ZoomRects frame={frame} start={0} frames={open} from={{ x: 950, y: 530, width: 20, height: 20 }} to={PORTRAIT} />
      {frame >= open && (
        <Os9Window title="Boris" width={PORTRAIT.width} height={PORTRAIT.height} style={{ left: PORTRAIT.x, top: PORTRAIT.y }}>
          <BorisClips frame={frame} start={open} />
        </Os9Window>
      )}
      <Caption text="Boris Nezlobin" x={PORTRAIT.x + PORTRAIT.width + 90} y={360} frame={frame} at={14} size="title" />
      <Caption text="UC Berkeley freshman" x={PORTRAIT.x + PORTRAIT.width + 94} y={470} frame={frame} at={34} color="var(--ink-muted)" />
    </>
  );
}

function SunPrint({ frame, start }: { frame: number; start: number }) {
  const local = frame - start;
  const push = lerp(1, 1.12, ramp(local, 0, 110, easeInOut));
  const grid = ramp(local, 16, 50, easeOutSoft);
  const rotation = local * 0.35;
  const feature = projectSolar(SUN, SUN.radius, 14, -40 + rotation);
  const lock = ramp(local, 44, 56, easeOutSoft);
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <BrollPlate clip="sun_active" duotone={SUN_DUOTONE} invert brightness={1.15} contrast={1.35} />
      <AbsoluteFill style={{ background: "var(--paper)", clipPath: "polygon(0 82%, 22% 82%, 22% 100%, 0 100%)" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <SolarGrid center={SUN} radius={SUN.radius} rotationDegrees={rotation} reveal={grid} color="var(--violet-deep)" />
        {feature.visible && lock > 0 && (
          <g transform={`translate(${feature.x} ${feature.y})`} opacity={lock}>
            <rect x={-34} y={-34} width={68} height={68} fill="none" stroke="var(--violet-deep)" strokeWidth={4} transform={`scale(${2 - lock})`} />
            <line x1={-60} x2={-34} y1={0} y2={0} stroke="var(--violet-deep)" strokeWidth={4} />
            <line x1={34} x2={60} y1={0} y2={0} stroke="var(--violet-deep)" strokeWidth={4} />
          </g>
        )}
      </svg>
      {feature.visible && lock > 0 && (
        <div className="text-data" style={{ position: "absolute", left: feature.x + 70, top: feature.y - 20, fontSize: 30, color: "var(--violet-deep)", opacity: lock }}>
          N14° E{Math.round(Math.abs(-40 + rotation))}°
        </div>
      )}
    </AbsoluteFill>
  );
}

function LockheedCredit({ frame, start }: { frame: number; start: number }) {
  const appear = ramp(frame - start, 20, 34, easeOutSoft);
  return (
    <div style={{ position: "absolute", left: 90, bottom: 150, opacity: appear, transform: `translateY(${(1 - appear) * 12}px)`, display: "flex", flexDirection: "column", gap: 14, background: "rgb(232 231 226 / 0.92)", padding: "22px 28px" }}>
      <Img src={staticFile("logos/lockheed-martin.svg")} style={{ width: 460 }} />
      <div className="text-annotation" style={{ color: "var(--violet-deep)" }}>Solar lab</div>
    </div>
  );
}

export function HelloScene({ scene }: { scene: TimelineScene }) {
  const frame = useCurrentFrame();
  const line = scene.lines[0];
  const sunAt = line.from + Math.round(line.durationInFrames * 0.6);
  return (
    <Impact hits={[{ at: sunAt, strength: 0.7, length: 12 }]}>
      <Paper>
        {frame < sunAt ? <Portrait frame={frame} /> : <SunPrint frame={frame} start={sunAt} />}
        {frame >= sunAt && <LockheedCredit frame={frame} start={sunAt} />}
      </Paper>
    </Impact>
  );
}
