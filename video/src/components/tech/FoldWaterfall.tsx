import { useLayoutEffect, useMemo, useRef } from "react";
import type { LightCurveData } from "../../lib/data";

export type FoldState = {
  reveal: number;
  flatten: number;
  stack: number;
  trialPeriod: number;
  collapse: number;
  glow: number;
};

type Point = { time: number; raw: number; flat: number; inTransit: boolean; stagger: number };

type Layout = { width: number; height: number; rowHeight: number; fluxScale: number };

function preparePoints(curve: LightCurveData): Point[] {
  const period = curve.period ?? 1;
  const duration = curve.duration ?? 0.1;
  const t0 = curve.t0 ?? 0;
  const sorted = [...curve.flux].sort((a, b) => a - b);
  const rawMedian = sorted[Math.floor(sorted.length / 2)];
  return curve.time.map((time, index) => {
    const phase = ((((time - t0) % period) + period * 1.5) % period) - period / 2;
    return {
      time,
      raw: curve.flux[index] / rawMedian - 1,
      flat: curve.flattened[index] - 1,
      inTransit: Math.abs(phase) < duration * 0.55,
      stagger: (index % 97) / 97,
    };
  });
}

function referenceEpoch(curve: LightCurveData): number {
  const period = curve.period ?? 1;
  const t0 = curve.t0 ?? 0;
  const start = curve.time[0];
  const cycles = Math.ceil((start - t0) / period);
  return t0 + cycles * period - period / 2;
}

function placePoint(point: Point, state: FoldState, start: number, span: number, epoch: number, layout: Layout): [number, number] {
  const flux = point.raw + (point.flat - point.raw) * state.flatten;
  const seriesX = ((point.time - start) / span) * layout.width;
  const seriesY = layout.height / 2 - flux * layout.fluxScale * 2.2;
  const elapsed = point.time - epoch;
  const cycle = Math.floor(elapsed / state.trialPeriod);
  const phase = (elapsed - cycle * state.trialPeriod) / state.trialPeriod;
  const rows = Math.ceil(span / state.trialPeriod) + 1;
  const stackTop = layout.height / 2 - (rows * layout.rowHeight) / 2;
  const rowY = stackTop + cycle * layout.rowHeight + layout.rowHeight / 2;
  const stackedY = rowY + (layout.height / 2 - rowY) * state.collapse - flux * layout.fluxScale * (1 + state.collapse * 1.6);
  const stackedX = phase * layout.width;
  const amount = Math.min(1, Math.max(0, state.stack * 1.35 - point.stagger * 0.35));
  return [seriesX + (stackedX - seriesX) * amount, seriesY + (stackedY - seriesY) * amount];
}

export function FoldWaterfall({ curve, state, width, height, ink = "#26226a", glow = "#f39a1e" }: {
  curve: LightCurveData;
  state: FoldState;
  width: number;
  height: number;
  ink?: string;
  glow?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useMemo(() => preparePoints(curve), [curve]);
  const epoch = useMemo(() => referenceEpoch(curve), [curve]);

  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const start = curve.time[0];
    const span = curve.time[curve.time.length - 1] - start;
    const layout: Layout = { width, height, rowHeight: Math.min(64, (height * 0.86) / (Math.ceil(span / state.trialPeriod) + 1)), fluxScale: 2400 };
    for (const point of points) {
      if ((point.time - start) / span > state.reveal) continue;
      const [x, y] = placePoint(point, state, start, span, epoch, layout);
      const hot = point.inTransit && state.glow > 0;
      context.globalAlpha = hot ? 0.5 + state.glow * 0.5 : 0.42;
      context.fillStyle = hot ? glow : ink;
      const size = hot ? 3.2 + state.glow * 2 : 2.8;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
    context.globalAlpha = 1;
  }, [points, epoch, state, width, height, curve, ink, glow]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height, display: "block" }} />;
}
