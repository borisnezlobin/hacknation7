import type { CSSProperties } from "react";
import { SPECTRUM } from "@/lib/spectrum";

const VIEW_WIDTH = 1000;

function bandPath(top: number, bandHeight: number, dipDepth: number, dipCenter: number, dipWidth: number): string {
  const left = dipCenter - dipWidth / 2;
  const right = dipCenter + dipWidth / 2;
  const ingress = dipDepth * 0.4;
  const upper = [
    [0, top],
    [left - ingress, top],
    [left, top + dipDepth],
    [right, top + dipDepth],
    [right + ingress, top],
    [VIEW_WIDTH, top],
  ];
  const lower = [...upper].reverse().map(([x, y]) => [x, y + bandHeight]);
  return `M${[...upper, ...lower].map(([x, y]) => `${x},${y}`).join(" L")} Z`;
}

export function SpectrumDip({ bandHeight = 14, dipDepth = 56, dipCenter = 620, dipWidth = 220, className, style }: {
  bandHeight?: number;
  dipDepth?: number;
  dipCenter?: number;
  dipWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const height = bandHeight * SPECTRUM.length + dipDepth;
  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} preserveAspectRatio="none" className={className} style={style} aria-hidden="true">
      {SPECTRUM.map((color, index) => (
        <path key={color} d={bandPath(index * bandHeight, bandHeight + 0.5, dipDepth, dipCenter, dipWidth)} fill={color} />
      ))}
    </svg>
  );
}
