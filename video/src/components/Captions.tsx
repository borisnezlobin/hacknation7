import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeOutSoft, ramp } from "../lib/motion";
import type { TimelineCaption } from "../lib/timeline";

export function CaptionTrack({ captions }: { captions: TimelineCaption[] }) {
  const frame = useCurrentFrame();
  const caption = captions.find((candidate) => frame >= candidate.from && frame < candidate.to);
  if (!caption) return null;
  const enter = ramp(frame, caption.from, caption.from + 4, easeOutSoft);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 46, pointerEvents: "none" }}>
      <div
        className="text-caption"
        style={{ maxWidth: 1180, textAlign: "center", padding: "8px 22px", color: "var(--paper-light)", background: "rgb(29 20 104 / 0.82)", opacity: enter, transform: `translateY(${(1 - enter) * 6}px)` }}
      >
        {caption.text}
      </div>
    </AbsoluteFill>
  );
}
