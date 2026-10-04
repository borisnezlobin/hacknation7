import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { Source } from "@/lib/future";

export function SourceLinks({ sources, tone = "text-ink-faint hover:text-violet" }: { sources: Source[]; tone?: string }) {
  return (
    <ul className="flex gap-1">
      {sources.map((source) => (
        <li key={source.href}>
          <a href={source.href} target="_blank" rel="noreferrer" title={source.label} aria-label={`Source: ${source.label}`} className={`-m-1.5 grid size-8 place-items-center transition-colors focus-visible:outline-2 focus-visible:outline-violet ${tone}`}>
            <ArrowSquareOut weight="bold" className="size-4" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
