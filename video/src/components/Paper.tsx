import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export type Camera = { x: number; y: number; scale: number };

const STILL: Camera = { x: 0, y: 0, scale: 1 };
const GRID_SPACING = 96;
const WASHES = [
  { x: 0.18, y: 0.22, rx: 520, ry: 260, color: "var(--class-b)", phase: 0 },
  { x: 0.82, y: 0.7, rx: 600, ry: 300, color: "var(--class-g)", phase: 2.1 },
  { x: 0.55, y: 0.95, rx: 700, ry: 220, color: "var(--class-o)", phase: 4.2 },
];

export function Paper({ children, tone = "var(--paper)", camera = STILL, backdrop = true }: { children?: ReactNode; tone?: string; camera?: Camera; backdrop?: boolean }) {
  return (
    <AbsoluteFill style={{ background: tone }}>
      {backdrop && <Backdrop camera={camera} />}
      {children}
      <Grain />
    </AbsoluteFill>
  );
}

function Backdrop({ camera }: { camera: Camera }) {
  const frame = useCurrentFrame();
  const drift = frame * 0.35;
  const offsetX = ((camera.x * 0.6 + drift) % GRID_SPACING) - GRID_SPACING;
  const offsetY = ((camera.y * 0.6) % GRID_SPACING) - GRID_SPACING;
  const spacing = GRID_SPACING * (1 + (camera.scale - 1) * 0.4);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <svg width="100%" height="100%">
        <defs>
          <filter id="wash-bleed" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves={3} seed={11} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={260} xChannelSelector="R" yChannelSelector="G" result="bled" />
            <feGaussianBlur in="bled" stdDeviation="90 40" />
          </filter>
          <pattern id="hairline-grid" width={spacing} height={spacing} patternUnits="userSpaceOnUse" x={offsetX} y={offsetY}>
            <path d={`M ${spacing} 0 L 0 0 0 ${spacing}`} fill="none" stroke="var(--violet-deep)" strokeWidth={1} opacity={0.07} />
          </pattern>
        </defs>
        <g filter="url(#wash-bleed)" opacity={0.1}>
          {WASHES.map((wash, index) => (
            <ellipse
              key={index}
              cx={wash.x * 1920 - camera.x * 0.3 + Math.sin(frame / 90 + wash.phase) * 60}
              cy={wash.y * 1080 - camera.y * 0.3 + Math.cos(frame / 110 + wash.phase) * 40}
              rx={wash.rx * camera.scale}
              ry={wash.ry * camera.scale}
              fill={wash.color}
            />
          ))}
        </g>
        <rect width="100%" height="100%" fill="url(#hairline-grid)" />
      </svg>
    </AbsoluteFill>
  );
}

export function Grain({ opacity = 0.16 }: { opacity?: number }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${frame % 6}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 6} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame % 6})`} />
      </svg>
    </AbsoluteFill>
  );
}
