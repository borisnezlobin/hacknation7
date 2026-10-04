import outcomes from "@/data/outcomes.json";
import { stepStyle } from "@/lib/stepStyle";

const COLUMNS = 21;
type CellState = "missed" | "kept" | "gained" | "lost";

const CELL_CLASS: Record<CellState, string> = {
  missed: "size-[22%] bg-paper-shade",
  kept: "size-[62%] bg-violet",
  gained: "size-[62%] bg-gain lights-up",
  lost: "size-[30%] bg-ink-faint",
};

function cellState([baseline, champion]: number[]): CellState {
  if (baseline && champion) return "kept";
  if (champion) return "gained";
  if (baseline) return "lost";
  return "missed";
}

export const GAINED_COUNT = outcomes.filter((pair) => cellState(pair) === "gained").length;

export function PlanetGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`grid ${className}`} style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }} aria-hidden="true">
      {outcomes.map((pair, index) => {
        const state = cellState(pair);
        const column = index % COLUMNS;
        return (
          <div key={index} className="stage-step grid aspect-square place-items-center" style={stepStyle(0.25 + column * 0.018, 8)}>
            <span className={`block rounded-full ${CELL_CLASS[state]}`} />
          </div>
        );
      })}
    </div>
  );
}
