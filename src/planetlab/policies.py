"""Omnigent guardrail policies for the planet lab.

Loaded by the Omnigent runner, so this module uses the standard library only.
Each factory returns a callable that maps a policy event to ALLOW, DENY or ASK.
"""

import json
import re

ALLOW = {"result": "ALLOW"}

HOLDOUT_MARKERS = ("holdout", "data/catalogs", "toi.csv", "ctoi.csv", "exofop", "exoplanetarchive", "download_toi")
PROTECTED_WRITE_MARKERS = ("src/planetlab", "lab/champion.json", "lab/holdout_ledger.json", "lab/record.jsonl", "data/", "runs/")
SHELL_TOOLS = {"sys_os_shell", "Bash", "bash"}
WRITE_TOOLS = {"sys_os_write", "sys_os_edit", "Write", "Edit", "MultiEdit"}
READ_TOOLS = {"sys_os_read", "Read", "Grep", "Glob", "WebFetch", "WebSearch"}
DATA_ACCESS_TOOLS = SHELL_TOOLS | WRITE_TOOLS | READ_TOOLS
FULL_EXPERIMENT = re.compile(r"planetlab experiment\s+\S*pipelines/\S+\.py")
LITERATURE_HOSTS = ("openalex.org", "arxiv.org", "adsabs.harvard.edu", "doi.org")


def _tool_call(event: dict) -> tuple[str, dict] | None:
    if event.get("type") != "tool_call":
        return None
    data = event.get("data") or {}
    arguments = data.get("arguments") or {}
    return data.get("name", ""), arguments if isinstance(arguments, dict) else {}


def _flatten(arguments: dict) -> str:
    return json.dumps(arguments, default=str).lower()


def _deny(reason: str) -> dict:
    return {"result": "DENY", "reason": reason}


def holdout_firewall(allow_holdout_command: bool = False):
    """Keep blind-test labels away from every agent except the evaluator's holdout command."""

    def evaluate(event: dict) -> dict:
        call = _tool_call(event)
        if call is None:
            return ALLOW
        name, arguments = call
        if name not in DATA_ACCESS_TOOLS:
            return ALLOW
        text = _flatten(arguments)
        touches_holdout = any(marker in text for marker in HOLDOUT_MARKERS)
        if not touches_holdout:
            return ALLOW
        is_scoring_command = name in SHELL_TOOLS and "planetlab holdout " in text and "&&" not in text and ";" not in text
        if allow_holdout_command and is_scoring_command:
            return ALLOW
        return _deny("The blind holdout and the TESS catalogues are sealed. Only the evaluator's `planetlab holdout` command may use them.")

    return evaluate


def lab_tools_only(allow_literature_web: bool = False):
    """Block personal connectors and unrelated web access so agents stay inside the lab."""

    def evaluate(event: dict) -> dict:
        call = _tool_call(event)
        if call is None:
            return ALLOW
        name, arguments = call
        if name.startswith("mcp__") and not name.startswith("mcp__omnigent__"):
            return _deny(f"{name} is outside the lab's toolset.")
        if name in {"WebFetch", "WebSearch"}:
            allowed = allow_literature_web and any(host in _flatten(arguments) for host in LITERATURE_HOSTS)
            return ALLOW if allowed else _deny("Web access is limited to the literature agent and literature hosts.")
        return ALLOW

    return evaluate


def write_scope(allowed_prefix: str = "pipelines/"):
    """Engineers may write candidate pipelines and nothing else: the harness and records are frozen."""

    def evaluate(event: dict) -> dict:
        call = _tool_call(event)
        if call is None:
            return ALLOW
        name, arguments = call
        if name in WRITE_TOOLS:
            path = str(arguments.get("path") or arguments.get("file_path") or "")
            return ALLOW if allowed_prefix in path else _deny(f"Writes are limited to {allowed_prefix}.")
        if name in SHELL_TOOLS and _shell_writes_protected(_flatten(arguments)):
            return _deny("Shell writes to the harness, records or data are not allowed. Use the planetlab CLI.")
        return ALLOW

    return evaluate


def _shell_writes_protected(command: str) -> bool:
    writes = any(op in command for op in (" > ", ">>", "sed -i", " tee ", " mv ", " rm ", " cp "))
    return writes and any(marker in command for marker in PROTECTED_WRITE_MARKERS)


def human_approval_gate():
    """Ask a scientist before spending the blind holdout or recording a planet-candidate claim."""

    def evaluate(event: dict) -> dict:
        call = _tool_call(event)
        if call is None:
            return ALLOW
        name, arguments = call
        text = _flatten(arguments)
        if name in SHELL_TOOLS and "planetlab holdout " in text:
            return {"result": "ASK", "reason": "Spend one of the four blind-holdout evaluations?"}
        if name in SHELL_TOOLS and "planetlab record candidate" in text:
            return {"result": "ASK", "reason": "Record a new planet-candidate claim in the research record?"}
        return ALLOW

    return evaluate


def experiment_budget(limit: int = 6):
    """Cap full dev-split experiments per session so the planner must choose between competing tests."""

    def evaluate(event: dict) -> dict:
        call = _tool_call(event)
        if call is None:
            return ALLOW
        name, arguments = call
        text = _flatten(arguments)
        if name not in SHELL_TOOLS or not FULL_EXPERIMENT.search(text) or "--quick" in text:
            return ALLOW
        state = event.get("session_state") or {}
        used = int(state.get("_planetlab_full_experiments", 0))
        if used >= limit:
            return _deny(f"Full-experiment budget of {limit} is spent. Report back to the planner.")
        return {"result": "ALLOW", "state_updates": [{"key": "_planetlab_full_experiments", "action": "set", "value": used + 1}]}

    return evaluate
