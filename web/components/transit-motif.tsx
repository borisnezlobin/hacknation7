import type { ReactNode } from "react";

const DIP_PATH = "M1 4 H16 V13 H32 V4 H47";

export function TransitMark({ className = "", animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 48 16" fill="none" className={className} aria-hidden>
      <path
        d={DIP_PATH}
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        className={animated ? "animate-draw-in" : undefined}
        style={{ ["--path-length" as string]: 66 }}
      />
    </svg>
  );
}

export function TransitScan({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 20" fill="none" className={className} aria-hidden>
      <path d="M2 5 H118" stroke="var(--line)" strokeWidth={2} strokeLinecap="round" />
      <g className="animate-transit-scan" style={{ transformBox: "view-box", transformOrigin: "center" }}>
        <rect x={50} y={3} width={20} height={4} fill="var(--surface)" />
        <path d="M49 5 H51 V15 H69 V5 H71" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function SectionDivider() {
  return (
    <div className="flex items-start" aria-hidden>
      <span className="mt-px h-px w-4 bg-line" />
      <svg viewBox="0 0 40 10" className="h-2.5 w-10 shrink-0 text-accent" fill="none">
        <path d="M0 1.5 H6 V8.5 H34 V1.5 H40" stroke="currentColor" strokeWidth={1.5} />
      </svg>
      <span className="mt-px h-px flex-1 bg-line" />
    </div>
  );
}

export function Section({ id, title, aside, children }: { id: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-6">
      <SectionDivider />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id={`${id}-heading`} className="text-section">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-surface-sunken px-6 py-12 text-center">
      <svg viewBox="0 0 200 40" className="h-10 w-48 text-ink-faint" fill="none" aria-hidden>
        <path d="M2 8 H80 M120 8 H198" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <path d="M80 8 V32 H120 V8" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" />
      </svg>
      <p className="text-body max-w-sm text-sm">{children}</p>
    </div>
  );
}
