import { ramp } from "../../lib/motion";
import { seededRandom } from "../../lib/random";

export const DOT_PITCH = 17;
export const DOTS_PER_ROW = 21;

export type DotColumnProps = {
  centerX: number;
  thresholdY: number;
  total: number;
  above: number;
  color: string;
  litColor: string;
  frame: number;
  rainStart: number;
  laserY: number;
  seed: number;
};

function slot(index: number, above: number, centerX: number, thresholdY: number): { x: number; y: number } {
  const isAbove = index < above;
  const local = isAbove ? index : index - above;
  const row = Math.floor(local / DOTS_PER_ROW);
  const column = local % DOTS_PER_ROW;
  const x = centerX + (column - (DOTS_PER_ROW - 1) / 2) * DOT_PITCH;
  const y = isAbove ? thresholdY - 14 - row * DOT_PITCH : thresholdY + 14 + row * DOT_PITCH;
  return { x, y };
}

export function DotColumn({ centerX, thresholdY, total, above, color, litColor, frame, rainStart, laserY, seed }: DotColumnProps) {
  const random = seededRandom(seed);
  return (
    <g>
      {Array.from({ length: total }, (_, index) => {
        const target = slot(index, above, centerX, thresholdY);
        const delay = random() * 36;
        const fall = ramp(frame, rainStart + delay, rainStart + delay + 14);
        if (fall <= 0) return null;
        const y = target.y - (1 - fall) * 700;
        const lit = index < above && laserY <= target.y;
        return <circle key={index} cx={target.x} cy={y} r={lit ? 7.5 : 4.4} fill={lit ? litColor : color} opacity={lit ? 1 : 0.28} />;
      })}
    </g>
  );
}

export function columnTop(above: number, thresholdY: number): number {
  return thresholdY - 14 - Math.ceil(above / DOTS_PER_ROW) * DOT_PITCH;
}
