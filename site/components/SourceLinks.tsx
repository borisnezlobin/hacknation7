import type { Source } from "@/lib/future";

export function SourceLinks({ sources }: { sources: Source[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {sources.map((source) => (
        <li key={source.href}>
          <a href={source.href} target="_blank" rel="noreferrer" className="source-link">
            {source.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
