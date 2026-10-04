"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type StageMode = "through" | "pinned";

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function stageProgress(element: HTMLElement, mode: StageMode): number {
  const rect = element.getBoundingClientRect();
  const viewport = window.innerHeight;
  const pinnable = mode === "pinned" && rect.height > viewport * 1.1;
  if (pinnable) return clampUnit(-rect.top / Math.max(1, rect.height - viewport));
  return clampUnit((viewport - rect.top) / (viewport + rect.height * 0.5));
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ScrollStage({ children, className, mode = "through", style, as: Tag = "div", id }: {
  children: ReactNode;
  className?: string;
  mode?: StageMode;
  style?: CSSProperties;
  as?: "div" | "section" | "header" | "footer";
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion()) {
      element.style.setProperty("--p", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      element.style.setProperty("--p", stageProgress(element, mode).toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [mode]);

  return (
    <Tag ref={ref as never} id={id} className={className} style={{ "--p": 0, ...style } as CSSProperties}>
      {children}
    </Tag>
  );
}
