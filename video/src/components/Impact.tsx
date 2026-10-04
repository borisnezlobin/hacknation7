import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { pulse } from "../lib/motion";

export type ImpactHit = { at: number; strength?: number; length?: number };

function hitAmount(frame: number, hits: ImpactHit[]): number {
  return hits.reduce((total, hit) => Math.max(total, pulse(frame, hit.at, 1, hit.length ?? 12) * (hit.strength ?? 1)), 0);
}

export function Impact({ hits, children }: { hits: ImpactHit[]; children: ReactNode }) {
  const frame = useCurrentFrame();
  const amount = hitAmount(frame, hits);
  const shakeX = Math.sin(frame * 2.7) * amount * 22;
  const shakeY = Math.cos(frame * 3.3) * amount * 14;
  const split = amount * 9;
  const filterId = `rgb-split-${frame}`;
  return (
    <AbsoluteFill>
      {amount > 0.01 && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            <feOffset in="red" dx={split} dy={0} result="redShift" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cyan" />
            <feOffset in="cyan" dx={-split} dy={0} result="cyanShift" />
            <feBlend in="redShift" in2="cyanShift" mode="screen" />
          </filter>
        </svg>
      )}
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${1 + amount * 0.03})`, filter: amount > 0.01 ? `url(#${filterId})` : undefined }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "white", opacity: amount * 0.35, mixBlendMode: "screen", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
}
