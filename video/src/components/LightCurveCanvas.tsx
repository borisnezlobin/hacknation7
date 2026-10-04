import { useLayoutEffect, useMemo, useRef } from "react";
import type { LightCurveData } from "../lib/data";

export type LightCurveView = {
  reveal: number;
  fold: number;
  flatten: number;
  depthRange: number;
  highlightTransits: number;
};

type PreparedPoint = { timeX: number; phaseX: number; raw: number; flat: number; inTransit: boolean };

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function prepare(curve: LightCurveData): PreparedPoint[] {
  const start = curve.time[0];
  const span = curve.time[curve.time.length - 1] - start;
  const rawMedian = median(curve.flux);
  return curve.time.map((time, index) => {
    const period = curve.period ?? 0;
    const duration = curve.duration ?? 0.1;
    const phaseDays = period ? ((time - (curve.t0 ?? 0) + 0.5 * period) % period + period) % period - 0.5 * period : 0;
    return {
      timeX: (time - start) / span,
      phaseX: period ? 0.5 + phaseDays / Math.min(period, duration * 8) : (time - start) / span,
      raw: curve.flux[index] / rawMedian - 1,
      flat: curve.flattened[index] - 1,
      inTransit: period > 0 && Math.abs(phaseDays) < duration * 0.5,
    };
  });
}

export function LightCurveCanvas({ curve, view, width, height, ink = "#2a2766", glow = "#f39a1e", pointSize = 2.2 }: {
  curve: LightCurveData;
  view: LightCurveView;
  width: number;
  height: number;
  ink?: string;
  glow?: string;
  pointSize?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useMemo(() => prepare(curve), [curve]);

  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const visibleUntil = view.reveal;
    for (const point of points) {
      if (point.timeX > visibleUntil) continue;
      const x = (point.timeX + (point.phaseX - point.timeX) * view.fold) * width;
      if (x < -10 || x > width + 10) continue;
      const value = point.raw + (point.flat - point.raw) * view.flatten;
      const y = height / 2 - (value / view.depthRange) * (height / 2);
      const hot = point.inTransit && view.highlightTransits > 0;
      context.globalAlpha = hot ? 0.55 + 0.45 * view.highlightTransits : 0.5;
      context.fillStyle = hot ? glow : ink;
      const size = hot ? pointSize * (1 + view.highlightTransits * 0.6) : pointSize;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
    context.globalAlpha = 1;
  }, [points, view, width, height, ink, glow, pointSize]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height, display: "block" }} />;
}
