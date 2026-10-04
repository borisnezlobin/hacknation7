"use client";

import { useEffect, useState } from "react";
import type { Lab } from "./lab-types";

export type LabState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; lab: Lab; isFixture: boolean };

function wantsFixture(): boolean {
  return new URLSearchParams(window.location.search).get("fixture") === "1";
}

async function loadFixture(): Promise<Lab> {
  const fixture = await import("@/fixtures/sample-lab.json");
  return fixture.default as unknown as Lab;
}

async function loadExport(): Promise<Lab> {
  const response = await fetch("/lab.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`lab.json returned ${response.status}`);
  return (await response.json()) as Lab;
}

export function useLab(): LabState {
  const [state, setState] = useState<LabState>({ status: "loading" });

  useEffect(() => {
    const isFixture = wantsFixture();
    const load = isFixture ? loadFixture : loadExport;
    load()
      .then((lab) => setState({ status: "ready", lab, isFixture }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  return state;
}
