import type { CSSProperties } from "react";

export function stepStyle(at: number, rate = 6): CSSProperties {
  return { "--at": at, "--rate": rate } as CSSProperties;
}
