import { AbsoluteFill } from "remotion";
import { lerp, ramp } from "../lib/motion";

type Rect = { x: number; y: number; width: number; height: number };

export function ZoomRects({ from, to, frame, start, frames = 8 }: { from: Rect; to: Rect; frame: number; start: number; frames?: number }) {
  const local = frame - start;
  if (local < 0 || local > frames + 4) return null;
  const outlines = [0, 1, 2, 3].map((index) => {
    const amount = ramp(local - index * 1.2, 0, frames);
    return {
      x: lerp(from.x, to.x, amount),
      y: lerp(from.y, to.y, amount),
      width: lerp(from.width, to.width, amount),
      height: lerp(from.height, to.height, amount),
      opacity: 1 - index * 0.22,
    };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        {outlines.map((rect, index) => (
          <rect key={index} x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="none" stroke="#1b1b1b" strokeWidth={2} strokeDasharray="6 4" opacity={rect.opacity} />
        ))}
      </svg>
    </AbsoluteFill>
  );
}
