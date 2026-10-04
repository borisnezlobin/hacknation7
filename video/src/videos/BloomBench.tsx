import { useCurrentFrame } from "remotion";
import { Paper } from "../components/Paper";
import { StarBloom } from "../components/StarBloom";

const SPECIMENS = [
  { x: 330, y: 300, size: 420, color: "var(--violet)", seed: 11 },
  { x: 900, y: 260, size: 220, color: "var(--cobalt)", seed: 4 },
  { x: 1300, y: 330, size: 140, color: "var(--violet)", seed: 9 },
  { x: 1650, y: 250, size: 90, color: "var(--class-g)", seed: 21 },
  { x: 700, y: 760, size: 160, color: "var(--class-m)", seed: 31 },
  { x: 1200, y: 760, size: 260, color: "var(--violet)", seed: 44 },
  { x: 1650, y: 780, size: 60, color: "var(--violet)", seed: 52 },
];

export function BloomBench() {
  const frame = useCurrentFrame();
  return (
    <Paper>
      <svg width={1920} height={1080}>
        {SPECIMENS.map((specimen) => (
          <StarBloom key={specimen.seed} {...specimen} time={frame / 30} stem={0.8} specks={4} />
        ))}
      </svg>
    </Paper>
  );
}
