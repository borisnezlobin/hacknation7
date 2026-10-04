# Planet lab

An Omnigent-orchestrated lab that improves a TESS transit search against a frozen, blind scorer, then checks
whether the improved search recovers planets announced after its knowledge cutoff.

**Bottleneck attacked.** Turning a transit-search idea into a measured result normally takes a person an
afternoon: write the change, run it over enough stars, separate real gains from noise. Here each idea becomes
a scored, paired comparison against the current best pipeline within one experiment cycle, and several ideas
run per round.

## Results (2026-10-03 run)

| Pipeline | Origin | Dev score | Planet recall | Injection recall | Seconds per star |
| --- | --- | --- | --- | --- | --- |
| `baseline.py` | Hand-written BLS + SDE | 0.222 | 0.152 | 0.293 | 11.7 |
| `h1_robust_snr.py` | Round 1, analyst H1 | **0.349** | 0.390 | 0.308 | 13.7 |
| `h5_h3_guarded.py` | Round 2, H5 | 0.310 | 0.355 | 0.266 | 16.6 |
| `h6_binned_noise.py` | Round 3, H6 | 0.342 | | | 10.7 |
| `h7_fine_duration.py` | Round 3, H7 | 0.329 | | | 13.2 |

- **Measured improvement on dev:** +0.127 (+57%) from one agent round; paired against the baseline on the same
  targets, H1 gained 94 recoveries and lost 33 (sign test p < 0.001).
- **Blind holdout reverses the dev result.** On the 37 TOIs announced after 2026-07-01 and 399 fresh control
  stars:

  | Pipeline | Holdout score | Planets found | Injection recall | 5% threshold (dev → holdout) |
  | --- | --- | --- | --- | --- |
  | `baseline.py` | **0.263** | 7 of 37 | 0.336 | 17.1 → 16.9 |
  | `h1_robust_snr.py` | 0.209 | 5 of 37 | 0.283 | 16.7 → 23.5 |

  Paired on identical holdout targets, H1 against the baseline: planets +1/−3 (p = 0.63), injected transits
  +14/−35 (p = 0.004). The baseline's score is normalised by each star's own periodogram, so its threshold is
  stable. H1's per-signal SNR has a heavy tail on rare systematics that appear among holdout controls but not
  dev controls, so its threshold jumped and pushed real transits under it. The dev gain was real on dev and did
  not generalise; the sealed holdout is what caught it.
- **What the lab learned:** quick runs on a third of the dev split set too noisy a threshold to rank pipelines
  (round 2); raising faint-planet scores also raises noisy control scores in proportion, so the deepest misses
  sit just under threshold at the right period (round 3).
- **Next experiment:** normalise H1's per-signal SNR by the star's own periodogram (SDE-style calibration),
  grow the dev control set so rare systematics show up before promotion, and score once on a fresh holdout.

The full trail is in `lab/record.jsonl` (cited evidence E1–E12, hypotheses H1–H7, plans, results, decisions).

## How the science is kept honest

- **Frozen scorer** (`src/planetlab/harness.py`). Score = mean of known-planet recall and injected-transit
  recall at the threshold where 5% of quiet control stars raise a false alarm. Agents cannot edit it.
- **Blind holdout.** TOIs alerted on or after 2026-07-01 (37 searchable planets, after the agents' model
  knowledge cutoff) plus 399 control stars. Sealed by policy; only the evaluator's scoring command can use
  them, four times in total, each with human approval.
- **Paired comparisons.** Promotions require a net gain over the champion on the same targets; every
  result carries a sign-test p-value. Quick runs (a third of the dev split) cannot be promoted.
- **Research record** (`lab/record.jsonl`). Questions, cited evidence, labelled agent-generated hypotheses,
  plans with the options not chosen, results, decisions and approvals, each with an id other entries cite.

## Data

| Split | Stars | Source |
| --- | --- | --- |
| Dev planets | 231 targets | TOIs alerted before 2026-07-01, period ≤ 13 d, observed in sectors 91–98 |
| Dev controls | 399 | Random QLP stars from sectors 96–98 with no TOI or CTOI; each is also searched with an injected transit |
| Holdout planets | 37 | TOIs alerted on or after 2026-07-01 |
| Holdout controls | 399 | As dev controls, disjoint |
| Discovery | 1,499 | Further unlabelled QLP stars, for new-candidate search |

Light curves are MIT Quick-Look Pipeline (QLP) full-frame-image photometry from the public TESS archive on AWS.

## Agents (`lab/`)

| Agent | Decision it owns | Tools | Policies |
| --- | --- | --- | --- |
| PI (`lab/config.yaml`) | Which hypotheses to test with the round's budget; promote or not; when to stop | Dispatch, CLI read commands | holdout firewall, lab tools only, dispatch cap |
| Literature | Which published evidence bears on a hypothesis | OpenAlex search | web limited to literature hosts |
| Analyst | Why the champion fails; competing hypotheses with expected gain and cost | Run outcomes, dev light curves | holdout firewall, no writes |
| Engineer (parallel) | How to implement one hypothesis | Writes `pipelines/` only, dev experiments | write scope, two full runs |
| Skeptic | Whether a gain is real and safe to promote | Run records, pipeline diffs | no writes |
| Evaluator | Whether dev gains generalise | Holdout scoring | human approval per run |
| Vetter | Which discovery signals survive vetting | Discovery search, vetting checks | human approval per candidate |

Policies live in `src/planetlab/policies.py` and are tested in `tests/test_policies.py`.

## Running it

```bash
uv sync
uv run planetlab data                      # catalogs + ~540 MB of light curves
uv run planetlab experiment pipelines/baseline.py --agent setup
uv run planetlab promote <run_id> --agent setup
ENABLE_CLAUDEAI_MCP_SERVERS=false PYTHONPATH=$PWD/src omnigent run lab -p "Start the lab."
```
