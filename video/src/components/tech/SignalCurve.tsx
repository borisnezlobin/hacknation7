import { useLayoutEffect, useMemo, useRef } from "react";
import type { LightCurveData } from "../../lib/data";

export type HighlightRule = (time: number, flux: number) => boolean;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function transitRule(curve: LightCurveData): HighlightRule {
  const period = curve.period ?? 1;
  const t0 = curve.t0 ?? 0;
  const half = (curve.duration ?? 0.1) * 0.5;
  return (time) => Math.abs(((((time - t0) % period) + period * 1.5) % period) - period / 2) < half;
}

export function transitEvents(curve: LightCurveData): number[] {
  const period = curve.period ?? 1;
  const t0 = curve.t0 ?? 0;
  const inTransit = transitRule(curve);
  const cycles = new Set<number>();
  curve.time.forEach((time, index) => {
    if (inTransit(time, curve.flux[index])) cycles.add(Math.round((time - t0) / period));
  });
  return [...cycles].sort((a, b) => a - b).map((cycle) => t0 + cycle * period);
}

export function SignalCurve({ curve, width, height, reveal, fluxRange, highlight, heat, useRaw = false, days }: {
  curve: LightCurveData;
  width: number;
  height: number;
  reveal: number;
  fluxRange: number;
  highlight: HighlightRule;
  heat: number;
  useRaw?: boolean;
  days?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const base = useMemo(() => median(curve.flux), [curve]);

  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const start = curve.time[0];
    const span = days ?? curve.time[curve.time.length - 1] - start;
    curve.time.forEach((time, index) => {
      const x = ((time - start) / span) * width;
      if (x > reveal * width || x > width) return;
      const flux = useRaw ? curve.flux[index] / base : curve.flattened[index];
      const y = height / 2 - ((flux - 1) / fluxRange) * (height / 2);
      const hot = heat > 0 && highlight(time, flux);
      context.globalAlpha = hot ? 0.4 + heat * 0.6 : 0.45;
      context.fillStyle = hot ? "#e8501f" : "#26226a";
      const size = hot ? 3 + heat * 3 : 2.2;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    });
    context.globalAlpha = 1;
  }, [curve, width, height, reveal, fluxRange, highlight, heat, useRaw, base, days]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height, display: "block" }} />;
}
