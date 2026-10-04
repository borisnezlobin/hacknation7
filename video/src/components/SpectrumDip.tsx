import { SPECTRUM } from "../lib/agents";

export type SpectrumDipProps = {
  width: number;
  height: number;
  bandHeight: number;
  dipDepth: number;
  dipCenter: number;
  dipWidth: number;
  sweep: number;
  slant?: number;
  colors?: string[];
};

function bandPath({ width, bandHeight, dipDepth, dipCenter, dipWidth, slant = 0.35 }: SpectrumDipProps, top: number, sweep: number): string {
  const left = dipCenter - dipWidth / 2;
  const right = dipCenter + dipWidth / 2;
  const ingress = dipDepth * slant;
  const end = width * sweep;
  const upper = [
    [0, top],
    [left - ingress, top],
    [left, top + dipDepth],
    [right, top + dipDepth],
    [right + ingress, top],
    [width, top],
  ];
  const clipped = upper.map(([x, y]) => [Math.min(x, end), x > end ? interpolateY(upper, end) : y]);
  const lower = [...clipped].reverse().map(([x, y]) => [x, y + bandHeight]);
  return `M${[...clipped, ...lower].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} Z`;
}

function interpolateY(points: number[][], x: number): number {
  for (let index = 1; index < points.length; index++) {
    const [x0, y0] = points[index - 1];
    const [x1, y1] = points[index];
    if (x >= x0 && x <= x1) return x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return points[points.length - 1][1];
}

export function SpectrumDip(props: SpectrumDipProps) {
  const colors = props.colors ?? SPECTRUM;
  return (
    <svg width={props.width} height={props.height} style={{ overflow: "visible" }}>
      {colors.map((color, index) => {
        const stagger = Math.max(0, Math.min(1, props.sweep * 1.4 - index * 0.06));
        return <path key={index} d={bandPath(props, index * props.bandHeight, stagger)} fill={color} />;
      })}
    </svg>
  );
}
