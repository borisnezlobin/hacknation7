import type { CSSProperties, ReactNode } from "react";

export function Os9Window({ title, accent, children, className = "", bodyClassName = "", style }: {
  title: string;
  accent?: string;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`os9-window flex flex-col ${className}`} style={style}>
      <TitleBar title={title} accent={accent} />
      <div className={`os9-body relative mx-1.5 mb-1.5 flex-1 overflow-hidden ${bodyClassName}`}>{children}</div>
    </div>
  );
}

function TitleBar({ title, accent }: { title: string; accent?: string }) {
  return (
    <div className="flex h-7 items-center gap-1.5 px-1.5">
      <span aria-hidden="true" className="os9-widget size-3 shrink-0" />
      <span aria-hidden="true" className="os9-stripes h-2.5 flex-1" />
      <span className="text-window-title flex items-center gap-1.5 px-2 whitespace-nowrap">
        {accent && <span className="inline-block size-2.5" style={{ background: accent }} />}
        {title}
      </span>
      <span aria-hidden="true" className="os9-stripes h-2.5 flex-1" />
      <span aria-hidden="true" className="os9-widget size-3 shrink-0" />
      <span aria-hidden="true" className="os9-widget size-3 shrink-0" />
    </div>
  );
}
