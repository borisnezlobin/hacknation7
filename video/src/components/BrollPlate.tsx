import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

export type Duotone = { shadow: string; highlight: string };

export const VIOLET_DUOTONE: Duotone = { shadow: "#1d1468", highlight: "#e8e7e2" };
export const SUN_DUOTONE: Duotone = { shadow: "#c4361c", highlight: "#e8e7e2" };

export function BrollPlate({ clip, duotone = VIOLET_DUOTONE, startFrom = 0, playbackRate = 1, contrast = 1.1, scale = 1, brightness = 1.6, invert = false }: {
  clip: string;
  duotone?: Duotone;
  startFrom?: number;
  playbackRate?: number;
  contrast?: number;
  scale?: number;
  brightness?: number;
  invert?: boolean;
}) {
  return (
    <AbsoluteFill style={{ background: duotone.highlight, overflow: "hidden" }}>
      <AbsoluteFill style={{ mixBlendMode: "multiply", transform: `scale(${scale})` }}>
        <OffthreadVideo
          src={staticFile(`broll/cuts/${clip}.mp4`)}
          startFrom={startFrom}
          playbackRate={playbackRate}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: `grayscale(1) contrast(${contrast}) brightness(${brightness})${invert ? " invert(1)" : ""}` }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: duotone.shadow, mixBlendMode: "lighten" }} />
    </AbsoluteFill>
  );
}
