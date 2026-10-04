import { CheckCircle, XCircle } from "@phosphor-icons/react";
import type { Lab, Rediscovery } from "@/lib/lab-types";
import { LightcurvePlot } from "./lightcurve-plot";
import { EmptyState, Section } from "./transit-motif";

function RediscoveryCard({ planet }: { planet: Rediscovery }) {
  const outcome = planet.recovered ? "recovered" : "missed";
  const StatusIcon = planet.recovered ? CheckCircle : XCircle;
  return (
    <li
      className={`flex flex-col gap-1.5 rounded-lg p-2 ${planet.recovered ? "bg-surface-raised shadow-card" : "bg-surface-sunken"}`}
      title={`TOI ${planet.toi}, period ${planet.period.toFixed(2)} d, depth ${Math.round(planet.depth_ppm)} ppm, Tmag ${planet.tmag}`}
    >
      <div className="aspect-[2/1]">
        <LightcurvePlot lightcurve={planet.lightcurve} highlighted={planet.recovered} label={`TOI ${planet.toi} folded light curve, ${outcome}`} />
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className={`text-data text-xs ${planet.recovered ? "" : "text-ink-faint"}`}>{planet.toi}</span>
        <StatusIcon
          size={16}
          weight={planet.recovered ? "fill" : "regular"}
          className={planet.recovered ? "text-accent" : "text-ink-faint"}
          aria-label={outcome}
        />
      </div>
    </li>
  );
}

function RecoveryTally({ recovered, total }: { recovered: number; total: number }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-baseline gap-3">
        <span className="text-display">{recovered}</span>
        <span className="text-2xl font-semibold text-ink-faint">of {total} recovered</span>
      </p>
      <div className="flex h-2 w-full max-w-md gap-0.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`flex-1 rounded-full ${i < recovered ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>
    </div>
  );
}

export function Rediscoveries({ lab }: { lab: Lab }) {
  const planets = lab.rediscoveries;
  const recovered = planets.filter((planet) => planet.recovered).length;
  return (
    <Section id="rediscoveries" title="Blind rediscoveries">
      {planets.length === 0 ? (
        <EmptyState>Once a human approves the holdout run, each of the 37 planets announced after 2026-07-01 shows up here, folded on its own period.</EmptyState>
      ) : (
        <>
          <RecoveryTally recovered={recovered} total={planets.length} />
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
            {planets.map((planet) => (
              <RediscoveryCard key={`${planet.toi}-${planet.tic}`} planet={planet} />
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
