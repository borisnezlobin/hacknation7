import { useLayoutEffect, useRef } from "react";
import { LIGHT_CURVES } from "../lib/data";
import { seededRandom } from "../lib/random";

const SOURCES = [LIGHT_CURVES.shallow, LIGHT_CURVES.hero, LIGHT_CURVES.missedDeep, LIGHT_CURVES.systematic];
const POINTS_PER_CELL = 160;

function drawCell(context: CanvasRenderingContext2D, cell: { x: number; y: number; w: number; h: number }, sourceIndex: number, offset: number, alpha: number) {
  const source = SOURCES[sourceIndex];
  const step = Math.max(1, Math.floor(source.flattened.length / POINTS_PER_CELL / 3));
  context.globalAlpha = alpha;
  for (let i = 0; i < POINTS_PER_CELL; i++) {
    const index = (offset + i * step) % source.flattened.length;
    const value = Math.max(-1, Math.min(1, (source.flattened[index] - 1) / 0.02));
    context.fillRect(cell.x + (i / POINTS_PER_CELL) * cell.w, cell.y + cell.h / 2 - value * cell.h * 0.45, 1.6, 1.6);
  }
}

export function CurveWall({ width, height, columns, rows, alpha = 0.7, ink = "#2a2766" }: { width: number; height: number; columns: number; rows: number; alpha?: number; ink?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = ink;
    const random = seededRandom(5);
    const cellW = width / columns;
    const cellH = height / rows;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const cell = { x: column * cellW + cellW * 0.06, y: row * cellH, w: cellW * 0.88, h: cellH };
        drawCell(context, cell, Math.floor(random() * SOURCES.length), Math.floor(random() * 4000), alpha);
      }
    }
    context.globalAlpha = 1;
  }, [width, height, columns, rows, alpha, ink]);
  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height, display: "block" }} />;
}
