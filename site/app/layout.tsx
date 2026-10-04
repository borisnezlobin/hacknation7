import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planet lab",
  description: "An AI research lab that runs its own experiments on real TESS data and checks itself against planets it has never seen.",
};

export const viewport: Viewport = {
  themeColor: "#e8e7e2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
