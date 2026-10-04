from planetlab import policies


def call(name, **arguments):
    return {"type": "tool_call", "data": {"name": name, "arguments": arguments}}


def test_firewall_blocks_holdout_reads_for_engineers():
    firewall = policies.holdout_firewall()
    assert firewall(call("sys_os_read", path="data/holdout/holdout_planets.json"))["result"] == "DENY"
    assert firewall(call("sys_os_shell", command="python -c \"open('data/catalogs/toi.csv')\""))["result"] == "DENY"
    assert firewall(call("sys_os_shell", command="uv run planetlab experiment pipelines/x.py"))["result"] == "ALLOW"


def test_firewall_lets_evaluator_score_but_not_read_labels():
    firewall = policies.holdout_firewall(allow_holdout_command=True)
    assert firewall(call("sys_os_shell", command="uv run planetlab holdout pipelines/x.py"))["result"] == "ALLOW"
    assert firewall(call("sys_os_shell", command="uv run planetlab holdout x; cat data/holdout/a.json"))["result"] == "DENY"
    assert firewall(call("sys_os_read", path="data/holdout/holdout_planets.json"))["result"] == "DENY"


def test_write_scope_and_connectors():
    scope = policies.write_scope()
    assert scope(call("sys_os_write", path="pipelines/h3.py", content=""))["result"] == "ALLOW"
    assert scope(call("sys_os_write", path="src/planetlab/harness.py", content=""))["result"] == "DENY"
    assert scope(call("sys_os_shell", command="sed -i '' s/a/b/ src/planetlab/harness.py"))["result"] == "DENY"
    tools = policies.lab_tools_only()
    assert tools(call("mcp__gmail__send_message"))["result"] == "DENY"
    assert tools(call("mcp__omnigent__sys_session_send"))["result"] == "ALLOW"


def test_experiment_budget_counts_full_runs_only():
    budget = policies.experiment_budget(limit=1)
    full = call("sys_os_shell", command="uv run planetlab experiment pipelines/x.py")
    first = budget(full)
    assert first["result"] == "ALLOW"
    state = {"_planetlab_full_experiments": first["state_updates"][0]["value"]}
    assert budget({**full, "session_state": state})["result"] == "DENY"
    quick = call("sys_os_shell", command="uv run planetlab experiment pipelines/x.py --quick")
    assert budget({**quick, "session_state": state})["result"] == "ALLOW"


def test_human_gate_asks_before_holdout():
    gate = policies.human_approval_gate()
    assert gate(call("sys_os_shell", command="uv run planetlab holdout pipelines/x.py"))["result"] == "ASK"


def test_firewall_allows_talking_about_the_holdout():
    firewall = policies.holdout_firewall()
    message = call("mcp__omnigent__sys_session_send", input="Score the champion on the holdout")
    assert firewall(message)["result"] == "ALLOW"


def test_experiment_budget_ignores_help_and_mentions():
    budget = policies.experiment_budget(limit=1)
    assert "state_updates" not in budget(call("sys_os_shell", command="uv run planetlab experiment --help"))
    assert "state_updates" not in budget(call("sys_os_shell", command="grep 'planetlab experiment' lab/PROTOCOL.md"))
