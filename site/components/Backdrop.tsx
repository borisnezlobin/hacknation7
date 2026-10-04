export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="hairline-grid absolute inset-0" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
