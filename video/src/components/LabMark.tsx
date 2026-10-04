export function LabMark({ size, color = "var(--violet)", glyph = "var(--paper-light)" }: { size: number; color?: string; glyph?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" fill={color} />
      <path d="M5 12 H11 V21 H21 V12 H27" fill="none" stroke={glyph} strokeWidth={2.5} strokeLinecap="square" />
    </svg>
  );
}
