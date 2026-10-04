import fcntl
import json
from datetime import datetime, timezone

from planetlab.paths import RECORD_PATH

ENTRY_KINDS = {
    "question",
    "evidence",
    "hypothesis",
    "plan",
    "result",
    "decision",
    "approval",
    "candidate",
    "note",
}

PREFIXES = {
    "question": "Q",
    "evidence": "E",
    "hypothesis": "H",
    "plan": "P",
    "result": "R",
    "decision": "D",
    "approval": "A",
    "candidate": "C",
    "note": "N",
}


def read_all() -> list[dict]:
    if not RECORD_PATH.exists():
        return []
    return [json.loads(line) for line in RECORD_PATH.read_text().splitlines() if line.strip()]


def _next_id(entries: list[dict], kind: str) -> str:
    prefix = PREFIXES[kind]
    count = sum(1 for e in entries if e["kind"] == kind)
    return f"{prefix}{count + 1}"


def append(kind: str, agent: str, title: str, body: str = "", refs: list[str] | None = None, data: dict | None = None) -> dict:
    if kind not in ENTRY_KINDS:
        raise ValueError(f"kind must be one of {sorted(ENTRY_KINDS)}")
    RECORD_PATH.parent.mkdir(parents=True, exist_ok=True)
    with RECORD_PATH.open("a+") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        handle.seek(0)
        entries = [json.loads(line) for line in handle.read().splitlines() if line.strip()]
        entry = {
            "id": _next_id(entries, kind),
            "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "kind": kind,
            "agent": agent,
            "title": title,
            "body": body,
            "refs": refs or [],
            "data": data or {},
        }
        handle.write(json.dumps(entry) + "\n")
        fcntl.flock(handle, fcntl.LOCK_UN)
    return entry


def find(entry_id: str) -> dict | None:
    return next((e for e in read_all() if e["id"] == entry_id), None)
