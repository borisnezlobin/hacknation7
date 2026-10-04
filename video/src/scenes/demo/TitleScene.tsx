import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { LabMark } from "../../components/LabMark";
import { Os9Window } from "../../components/Os9Window";
import { Paper } from "../../components/Paper";
import { SpectrumDip } from "../../components/SpectrumDip";
import { StarBloom } from "../../components/StarBloom";
import { ZoomRects } from "../../components/ZoomRects";
import { easeInOut, ramp } from "../../lib/motion";
import type { TimelineScene } from "../../lib/timeline";

const WINDOW = { x: 90, y: 60, width: 1740, height: 900 };

export function TitleScene({ windowTitle = "Planet lab" }: { scene: TimelineScene; windowTitle?: string }) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const open = frame >= 10;
  const sweep = ramp(frame, 12, 50, easeInOut);
  const titleIn = ramp(frame, 20, 40);
  return (
    <Paper>
      <ZoomRects frame={frame} start={0} frames={9} from={{ x: width / 2 - 20, y: 520, width: 40, height: 30 }} to={WINDOW} />
      {open && (
        <Os9Window title={windowTitle} width={WINDOW.width} height={WINDOW.height} style={{ left: WINDOW.x, top: WINDOW.y }} bodyTone="var(--paper)">
          <AbsoluteFill>
            <div style={{ position: "absolute", left: 0, top: 470 }}>
              <SpectrumDip width={WINDOW.width} height={420} bandHeight={46} dipDepth={150} dipCenter={1020} dipWidth={420} sweep={sweep} />
            </div>
            <svg width={WINDOW.width} height={WINDOW.height} style={{ position: "absolute", inset: 0 }}>
              <StarBloom x={1300} y={250} size={230} color="var(--violet)" seed={4} time={frame / 30} specks={6} stem={0.7} />
              <StarBloom x={1540} y={150} size={110} color="var(--cobalt)" seed={9} time={frame / 30} specks={3} stem={0.5} />
            </svg>
            <div style={{ position: "absolute", left: 110, top: 150, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20}px)` }}>
              <div className="text-hero">Planet lab</div>
            </div>
            <div style={{ position: "absolute", left: 116, top: 350, opacity: titleIn }}>
              <LabMark size={64} />
            </div>
          </AbsoluteFill>
        </Os9Window>
      )}
    </Paper>
  );
}
