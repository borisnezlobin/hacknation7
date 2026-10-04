import outcomesJson from "../../public/data/outcomes.json";
import { ramp } from "../lib/motion";

type Outcome = { tic: number; depth_ppm: number; baseline: boolean; champion: boolean };

export const PLANET_OUTCOMES = outcomesJson as Outcome[];
const COLUMNS = 21;

type CellState = "dark" | "lit" | "gained" | "lost";

function cellState(outcome: Outcome, switched: number): CellState {
  if (switched <= 0) return outcome.baseline ? "lit" : "dark";
  if (outcome.champion && !outcome.baseline) return "gained";
  if (!outcome.champion && outcome.baseline) return "lost";
  return outcome.champion ? "lit" : "dark";
}

const CELL_COLORS: Record<CellState, string> = {
  dark: "var(--paper-shade)",
  lit: "var(--violet)",
  gained: "var(--class-g)",
  lost: "var(--ink-faint)",
};

export function PlanetGrid({ frame, switchAt, cell = 52 }: { frame: number; switchAt: number; cell?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLUMNS}, ${cell}px)`, gap: 0 }}>
      {PLANET_OUTCOMES.map((outcome, index) => {
        const column = index % COLUMNS;
        const switched = ramp(frame, switchAt + column * 1.2, switchAt + column * 1.2 + 10);
        const state = cellState(outcome, switched);
        const flare = state === "gained" ? 1 + (1 - switched) * 1.4 : 1;
        const size = state === "dark" || state === "lost" ? 0.22 : 0.42 * flare;
        return (
          <div key={`${outcome.tic}-${index}`} style={{ width: cell, height: cell, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                width: cell * size * 2,
                height: cell * size * 2,
                background: `radial-gradient(circle, ${CELL_COLORS[state]} 0%, ${CELL_COLORS[state]} 28%, transparent 70%)`,
                opacity: state === "lost" ? 0.6 : 1,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
