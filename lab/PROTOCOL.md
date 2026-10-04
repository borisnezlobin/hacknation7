# Planet lab protocol

Question: can a team of agents improve a blind transit search faster than a person tuning it by hand, and does
the improved search recover planets the TESS team announced after 2026-07-01 that no agent was allowed to see?

Everything runs from the repo root with `uv run planetlab <command>`. All output is JSON.

| Command | What it does |
| --- | --- |
| `champion` | Current best pipeline and its full dev run |
| `show [--kind K] [--last N]` | Recent research-record entries |
| `misses RUN_ID` | Recoveries a dev run missed, deepest first |
| `experiment pipelines/X.py [--quick] --hypothesis H# --agent NAME` | Score a pipeline on the dev split (quick = one third, about 3 minutes) |
| `promote RUN_ID --agent NAME` | Make a full dev run the champion; refused unless it beats the champion on matched targets |
| `literature "query" [--since YEAR]` | OpenAlex search with abstracts |
| `record KIND "title" --body ... --refs H1 E2 --data '{json}' --agent NAME` | Append to the research record |
| `holdout pipelines/X.py --agent evaluator` | Blind holdout score. Evaluator only, needs human approval, four uses total |
| `discover pipelines/X.py --agent vetter` | Champion search over 1,499 unlabelled stars, with automated vetting |
| `vet --tic --sector --period --t0 --duration` | Odd/even, secondary eclipse and centroid checks for one signal |

Score: the mean of known-planet recall and injected-transit recall, measured at the score threshold where 5% of
quiet control stars raise a false alarm. Runs record per-target outcomes, recall by depth and seconds per star.

A pipeline is a file in `pipelines/` that defines `search(time, flux)` and returns up to five signals as dicts with
`period`, `t0`, `duration` (days), `depth` and `score`. Light curves are QLP full-frame-image photometry at 200 s
cadence, one TESS sector per star, loadable with `planetlab.lightcurves.load(tic, sector)`. Dev targets are in
`data/splits/`. The holdout and the TESS catalogues are sealed by policy.

Record kinds: question, evidence (must carry a DOI or arXiv id), hypothesis (label it agent-generated), plan,
result, decision, approval, candidate, note. Cite record ids in refs so every decision can be traced.

Experiments are slow: a quick run takes 5-10 minutes and a full run 20-30 minutes, and runs queue behind a
shared lock. Always call the shell tool with `timeout: 3600` for `planetlab experiment` and `planetlab holdout`,
or the call is cut off before the result is recorded. A pipeline that raises errors on any star cannot be
promoted; smoke-test it on a few dev stars first. Seconds per star matter: slower pipelines slow every round.
