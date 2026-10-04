"use client";

import { Flask, WarningCircle } from "@phosphor-icons/react";
import type { Lab } from "@/lib/lab-types";
import { useLab } from "@/lib/use-lab";
import { Candidates } from "./candidates";
import { ExperimentsTable } from "./experiments-table";
import { Rediscoveries } from "./rediscoveries";
import { ResearchChain } from "./research-chain";
import { ScoreClimb } from "./score-climb";
import { TransitMark, TransitScan } from "./transit-motif";

function FixtureNotice() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface-sunken px-4 py-2.5 text-sm">
      <Flask size={18} weight="duotone" className="text-ink-muted" aria-hidden />
      <span className="font-medium">Sample fixture, not lab output</span>
      <a href="./" className="focus-ring rounded font-medium text-accent hover:underline">
        Show the real lab.json
      </a>
    </div>
  );
}

function Masthead({ lab }: { lab: Lab | null }) {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <TransitMark animated className="h-5 w-14 text-accent" />
        <span className="text-lg font-semibold">Planet lab</span>
      </div>
      {lab && <h1 className="max-w-4xl text-2xl font-medium text-balance text-ink sm:text-3xl">{lab.question}</h1>}
    </header>
  );
}

function LoadingView() {
  return (
    <div className="flex flex-col items-center gap-4 py-32" role="status">
      <TransitScan className="h-6 w-48" />
      <span className="text-detail">Reading lab.json</span>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-surface-sunken p-6" role="alert">
      <WarningCircle size={24} weight="duotone" className="text-ink-muted" aria-hidden />
      <p className="font-medium">The dashboard could not read lab.json ({message}).</p>
      <p className="text-body">
        Run <code className="text-data rounded bg-surface-raised px-1.5 py-0.5">uv run planetlab export</code> from the repo root, then reload. To preview the layout, open{" "}
        <a href="?fixture=1" className="focus-ring rounded font-medium text-accent hover:underline">
          the sample fixture
        </a>
        .
      </p>
    </div>
  );
}

function LabSections({ lab }: { lab: Lab }) {
  return (
    <>
      <ScoreClimb lab={lab} />
      <ResearchChain lab={lab} />
      <Rediscoveries lab={lab} />
      <Candidates lab={lab} />
      <ExperimentsTable lab={lab} />
    </>
  );
}

export function Dashboard() {
  const state = useLab();
  const lab = state.status === "ready" ? state.lab : null;
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-8 sm:py-14">
      {state.status === "ready" && state.isFixture && <FixtureNotice />}
      <Masthead lab={lab} />
      {state.status === "loading" && <LoadingView />}
      {state.status === "error" && <ErrorView message={state.message} />}
      {lab && <LabSections lab={lab} />}
    </main>
  );
}
