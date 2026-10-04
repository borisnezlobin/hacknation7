import type { CSSProperties } from "react";
import { easeOutSoft, ramp } from "../lib/motion";

export type AnnotationProps = {
  text: string;
  target: { x: number; y: number };
  offset: { x: number; y: number };
  frame: number;
  at: number;
  until?: number;
  color?: string;
  size?: "label" | "title";
};

function textPosition(target: { x: number; y: number }, offset: { x: number; y: number }): CSSProperties {
  const left = target.x + offset.x;
  const top = target.y + offset.y;
  const alignRight = offset.x < 0;
  return {
    position: "absolute",
    top: top - 24,
    ...(alignRight ? { right: 1920 - left + 12 } : { left: left + 12 }),
    textAlign: alignRight ? "right" : "left",
    whiteSpace: "nowrap",
  };
}

export function Annotation({ text, target, offset, frame, at, until, color = "var(--violet-deep)", size = "label" }: AnnotationProps) {
  const appear = ramp(frame, at, at + 12, easeOutSoft);
  const leave = until === undefined ? 0 : ramp(frame, until, until + 8);
  const visible = appear * (1 - leave);
  if (visible <= 0) return null;
  const elbow = { x: target.x + offset.x, y: target.y + offset.y };
  const lineEnd = { x: target.x + (elbow.x - target.x) * appear, y: target.y + (elbow.y - target.y) * appear };
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: visible, pointerEvents: "none" }}>
        <circle cx={target.x} cy={target.y} r={6} fill={color} />
        <line x1={target.x} y1={target.y} x2={lineEnd.x} y2={lineEnd.y} stroke={color} strokeWidth={2} />
      </svg>
      <div className={size === "title" ? "text-annotation-title" : "text-annotation"} style={{ ...textPosition(target, offset), color, opacity: visible, transform: `translateY(${(1 - appear) * 10}px)` }}>
        {text}
      </div>
    </>
  );
}

export function Caption({ text, x, y, frame, at, until, align = "left", color = "var(--violet-deep)", size = "label" }: {
  text: string;
  x: number;
  y: number;
  frame: number;
  at: number;
  until?: number;
  align?: "left" | "center" | "right";
  color?: string;
  size?: "label" | "title";
}) {
  const appear = ramp(frame, at, at + 12, easeOutSoft);
  const leave = until === undefined ? 0 : ramp(frame, until, until + 8);
  const visible = appear * (1 - leave);
  if (visible <= 0) return null;
  const shift = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div
      className={size === "title" ? "text-annotation-title" : "text-annotation"}
      style={{ position: "absolute", left: x, top: y, transform: `translate(${shift}, ${(1 - appear) * 10}px)`, color, opacity: visible, whiteSpace: "nowrap", textAlign: align }}
    >
      {text}
    </div>
  );
}
