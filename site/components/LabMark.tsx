export function LabMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" fill="var(--violet)" />
      <path d="M5 12 H11 V21 H21 V12 H27" fill="none" stroke="var(--paper-light)" strokeWidth={2.5} strokeLinecap="square" />
    </svg>
  );
}
