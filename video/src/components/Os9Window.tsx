import type { CSSProperties, ReactNode } from "react";

const PINSTRIPES = "repeating-linear-gradient(to bottom, #ffffff 0px, #ffffff 1px, #bdbdbd 1px, #bdbdbd 2px)";

export function Os9Window({ title, children, width, height, style, accent, bodyTone = "var(--paper-light)" }: {
  title: string;
  children?: ReactNode;
  width: number;
  height: number;
  style?: CSSProperties;
  accent?: string;
  bodyTone?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        width,
        height,
        background: "var(--platinum)",
        boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #888, 0 0 0 1px #3a3a3a, 6px 10px 30px rgb(30 28 70 / 0.22)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <TitleBar title={title} accent={accent} />
      <div style={{ flex: 1, margin: "0 6px 6px", background: bodyTone, boxShadow: "inset 1px 1px 0 #8a8a8a, inset -1px -1px 0 #fff", position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function TitleBar({ title, accent }: { title: string; accent?: string }) {
  return (
    <div style={{ height: 34, display: "flex", alignItems: "center", gap: 8, padding: "0 8px", position: "relative" }}>
      <WidgetBox />
      <div style={{ flex: 1, height: 14, background: PINSTRIPES, boxShadow: "inset 0 0 0 1px #c9c9c9" }} />
      <div className="text-window-title" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px" }}>
        {accent && <span style={{ width: 12, height: 12, background: accent, display: "inline-block" }} />}
        {title}
      </div>
      <div style={{ flex: 1, height: 14, background: PINSTRIPES, boxShadow: "inset 0 0 0 1px #c9c9c9" }} />
      <WidgetBox />
      <WidgetBox />
    </div>
  );
}

function WidgetBox() {
  return <div style={{ width: 16, height: 16, background: "linear-gradient(135deg, #f6f6f6, #b9b9b9)", boxShadow: "0 0 0 1px #3c3c3c, inset 1px 1px 0 #fff" }} />;
}
