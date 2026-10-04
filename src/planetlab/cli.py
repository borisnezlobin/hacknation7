import argparse
import json
import sys
from pathlib import Path

from planetlab import datasets, export, harness, lab, literature, record, vetting
from planetlab.paths import REPO_ROOT


def _print(payload) -> None:
    print(json.dumps(payload, indent=1, default=str))


def _pipeline_path(raw: str) -> Path:
    path = (REPO_ROOT / raw).resolve() if not Path(raw).is_absolute() else Path(raw)
    if path.parent != (REPO_ROOT / "pipelines").resolve():
        raise SystemExit("Pipelines must live directly in pipelines/.")
    return path


def cmd_data_build(args) -> None:
    _print(datasets.build())


def cmd_experiment(args) -> None:
    run = harness.evaluate(_pipeline_path(args.pipeline), split="dev", quick=args.quick, hypothesis=args.hypothesis, agent=args.agent)
    _print({"record_id": run["record_id"], "run_id": run["run_id"], "metrics": run["metrics"], "vs_champion": run["vs_champion"]})


def cmd_misses(args) -> None:
    run = lab.load_run(args.run_id)
    missed = [o for o in run.get("outcomes", []) if not o["recovered"]]
    missed.sort(key=lambda o: -o["depth_ppm"])
    _print({"run_id": args.run_id, "missed": len(missed), "deepest_misses": missed[: args.limit]})


def cmd_promote(args) -> None:
    _print(lab.promote(args.run_id, args.agent))


def cmd_champion(args) -> None:
    _print(lab.champion())


def cmd_holdout(args) -> None:
    run = lab.score_holdout(_pipeline_path(args.pipeline), args.agent)
    _print({"run_id": run["run_id"], "metrics": run["metrics"], "budget_left": lab.HOLDOUT_BUDGET - len(lab.holdout_ledger())})


def cmd_discover(args) -> None:
    summary = lab.discover(_pipeline_path(args.pipeline), args.agent, max_stars=args.max_stars, threshold_mode=args.threshold)
    _print({k: v for k, v in summary.items() if k not in ("candidates", "rejected")} | {
        "candidates": [{"tic": c["tic"], "period": round(c["signal"]["period"], 4), "score": round(c["signal"]["score"], 1),
                        "flags": c["vetting"]["flags"]} for c in summary["candidates"]]
    })


def cmd_export(args) -> None:
    print(export.export())


def cmd_vet(args) -> None:
    _print(vetting.vet(args.tic, args.sector, args.period, args.t0, args.duration))


def cmd_literature(args) -> None:
    _print(literature.search_openalex(args.query, limit=args.limit, since_year=args.since))


def cmd_record_add(args) -> None:
    data = json.loads(args.data) if args.data else {}
    _print(record.append(args.kind, args.agent, args.title, args.body or "", args.refs or [], data))


def cmd_record_show(args) -> None:
    entries = record.read_all()
    if args.kind:
        entries = [e for e in entries if e["kind"] == args.kind]
    _print(entries[-args.last :])


def _add_agent(parser) -> None:
    parser.add_argument("--agent", default="human", help="Name of the agent writing to the research record.")


def _experiment_commands(sub) -> None:
    run = sub.add_parser("experiment", help="Score a pipeline on the dev split.")
    run.add_argument("pipeline")
    run.add_argument("--quick", action="store_true", help="Score on a third of the dev split for fast iteration.")
    run.add_argument("--hypothesis", help="Record id of the hypothesis this run tests, e.g. H3.")
    _add_agent(run)
    run.set_defaults(func=cmd_experiment)

    misses = sub.add_parser("misses", help="List the recoveries a dev run missed.")
    misses.add_argument("run_id")
    misses.add_argument("--limit", type=int, default=25)
    misses.set_defaults(func=cmd_misses)

    promote = sub.add_parser("promote", help="Make a full dev run's pipeline the champion.")
    promote.add_argument("run_id")
    _add_agent(promote)
    promote.set_defaults(func=cmd_promote)

    sub.add_parser("champion", help="Show the champion pipeline.").set_defaults(func=cmd_champion)


def _evaluator_commands(sub) -> None:
    holdout = sub.add_parser("holdout", help="Score a pipeline on the blind holdout (evaluator only).")
    holdout.add_argument("pipeline")
    _add_agent(holdout)
    holdout.set_defaults(func=cmd_holdout)

    discover = sub.add_parser("discover", help="Search unlabelled stars with the champion pipeline.")
    discover.add_argument("pipeline")
    discover.add_argument("--max-stars", type=int, help="Search only the first N discovery stars.")
    discover.add_argument("--threshold", choices=sorted(lab.THRESHOLD_KEYS), default="strict",
                          help="False-alarm threshold calibrated on the champion's dev controls: strict (1%%) or 5pct.")
    _add_agent(discover)
    discover.set_defaults(func=cmd_discover)

    vet = sub.add_parser("vet", help="Run automated false-positive checks on one signal.")
    for name, kind in (("--tic", int), ("--sector", int), ("--period", float), ("--t0", float), ("--duration", float)):
        vet.add_argument(name, type=kind, required=True)
    vet.set_defaults(func=cmd_vet)


def _knowledge_commands(sub) -> None:
    lit = sub.add_parser("literature", help="Search OpenAlex for papers.")
    lit.add_argument("query")
    lit.add_argument("--limit", type=int, default=5)
    lit.add_argument("--since", type=int)
    lit.set_defaults(func=cmd_literature)

    add = sub.add_parser("record", help="Append to the research record.")
    add.add_argument("kind", choices=sorted(record.ENTRY_KINDS))
    add.add_argument("title")
    add.add_argument("--body")
    add.add_argument("--refs", nargs="*")
    add.add_argument("--data", help="JSON object with structured fields.")
    _add_agent(add)
    add.set_defaults(func=cmd_record_add)

    show = sub.add_parser("show", help="Show recent research-record entries.")
    show.add_argument("--kind")
    show.add_argument("--last", type=int, default=20)
    show.set_defaults(func=cmd_record_show)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="planetlab", description="Blind transit-search lab.")
    sub = parser.add_subparsers(required=True)
    sub.add_parser("data", help="Download catalogs and light curves.").set_defaults(func=cmd_data_build)
    sub.add_parser("export", help="Write web/public/lab.json for the dashboard.").set_defaults(func=cmd_export)
    _experiment_commands(sub)
    _evaluator_commands(sub)
    _knowledge_commands(sub)
    args = parser.parse_args(argv)
    try:
        args.func(args)
    except (ValueError, PermissionError) as error:
        print(f"refused: {error}", file=sys.stderr)
        raise SystemExit(2) from error
