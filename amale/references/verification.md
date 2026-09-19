# Implementation verification — 2026-09-19

The canonical skill and TypeScript runtime are installed through directory links in Claude and Codex. There are no external skill dependencies and no npm runtime dependencies. The invoking agent drives the next-action loop and performs native host interactions, workspace preparation and integration. This is not an unattended daemon or an automatic merge service.

## Evidence

- A real OpenRouter Jev decisions request succeeded using pi's existing OpenRouter credential. No separate TypeSafe key is required. Response model: typesafe/jev-1.13-20260917. OpenRouter uses its alpha decisions endpoint; the adapter does not send Jev requests to chat completions.
- A live isolated billing fixture traversed Jev routing → deepseek/deepseek-v4.1-flash implementation → z-ai/glm-5.3-flash independent read-only review → exact amount tests → acceptance/integration/completion. The task corrected multiplication of unit price by quantity; tests covered expected totals 20 and 5.
- Behavioral tests cover valid completion, graph validation, stale/failed checks, independent review, repair escalation, concurrent checkpointing, dependency-ready progress, conflicting workspaces, live/dead ownership, decision uncertainty, artifact retention, HTML escaping, installation reruns, completed-run resume, upstream invalidation, cross-host takeover and contract amendment.
- Static checking uses TypeScript strict mode. The skill-creator validator passes.
- Bun-first launching and Node fallback were exercised, including an empty PATH that makes Bun unavailable.

## Verified dependency/runtime sources

All checks dated 2026-09-19. Exact development dependencies and transitive resolution are recorded in the Bun lockfile; runtime source executes without installing them.

| Component | Verified version | Authority |
|---|---|---|
| Bun | 1.4.2 | https://api.github.com/repos/oven-sh/bun/releases/latest |
| Node latest stable | 26.9.0 | https://nodejs.org/dist/index.json |
| Node additional compatibility | installed 24.19.0 | Local executable; not claimed latest |
| pi | 0.85.1 | https://registry.npmjs.org/@earendil-works%2Fpi-coding-agent/latest |
| TypeScript, development only | 7.0.2 | https://registry.npmjs.org/typescript/latest |
| Node types, development only | 26.6.2 | https://registry.npmjs.org/%40types%2Fnode/latest |
| Jev OpenRouter model | typesafe/jev-1.13 | https://openrouter.ai/typesafe/jev-1.13; verified by live typed response |

## Practical limits

Host effort now has a durable, Jev-selected escalation path (baseline → supported higher effort → baseline) with seven behavioral tests. Native execution is performed by the invoking host using verified session or same-model delegation capabilities, then recorded with execution evidence. The runtime does not silently alter global settings or claim an in-place effort change when it actually launched a separate pass. pi worker thinking configuration remains separate and is not implied by this host-effort feature.

Windows was exercised. macOS/Linux paths use portable APIs but those platforms have not been run here. No Claude/Codex lifecycle hooks are installed; resume relies on explicit material-transition checkpoints and loading the skill's durable state. Native host compaction is not replaced. pi retains complete worker sessions. The host must provide applicable project instructions because worker discovery of external skills and context files is disabled.

Workspace fingerprints are conservative whole-tree content hashes excluding runtime state, Git metadata and node_modules. Unrelated source changes may invalidate more evidence than a future precise dependency model would. Acceptance descriptions and host integration receipts are trusted agent attestations; code verifies registered checks and freshness, while the host/Jev must inspect semantic claim support. A live model smoke test is not a general quality/cost benchmark.

Secrets are read from existing credential configuration or environment and are not intentionally placed into logs or command-line arguments. Original tool artifacts are retained; their contents still depend on the commands the user authorizes.

## Fresh worktree self-review

A fresh agent used Amale in an isolated Git worktree at baseline `c0a2be0`, executed CLI paths and live Jev/GLM requests, and retained reproductions under the repository's `.amale/self-review/.amale/audit`. It reproduced missing-executable check deadlock, hidden independent work, malformed pi success, unlaunchable effort deadlock and missing API diagnostics. Replay of its three original failing regressions passes against the fixes. A second review reproduced invalid assistant-content crashes and late spawn-exit telemetry misclassification; both now have regression coverage.

The patched suite has 37 top-level tests (43 including Node subtests), strict TypeScript checking and skill validation. Node 24.19.0 and 26.9.0 and Bun 1.4.2 were exercised. A patched live Jev / DeepSeek Flash worker / GLM Flash reviewer / amount tests / completion probe passed. A separate live discount fixture demonstrated failing check, actual review findings, repair, fresh pass, uncertain Jev, host fallback and completion.

`diagnose` retains failed API attempts, process/protocol failures and operations interrupted before state commits. Costs distinguish gateway response values from pi estimates; this is not a billing ledger. See the repository's `REVIEW.html` for the tested-path matrix, preserved evidence and explicit limits. Line coverage is not proof of scenario completeness, especially in compact functions.

## Enforced automatic routing

Worker and reviewer launches now obtain a durable Jev model choice from current eligible catalog cards. Manual model assertions must match. Default Flash candidates are one newest eligible stable exact model per GLM/DeepSeek family; floating aliases and prerelease names are excluded. Named purpose pools may include other eligible models. Uncertainty becomes a recorded host decision, not an automatic launch. Review family independence and repair escalation remain enforced.

The suite now has 47 top-level tests (55 with Node subtests). Both GLM and DeepSeek author selections, specialized image pools, capability filters, uncertainty reuse, override rejection, stale scope, unrelated parallel progress, Kimi/host escalation and automatic author/reviewer execution passed controlled fixtures. A live synthetic run in `.amale/live-auto-routing-stable` completed with Jev selecting `deepseek/deepseek-v4.1-flash` for work and `z-ai/glm-5.3-flashx` for review. This demonstrates routing integration, not a benchmark proving those models are always best. The previous audit report's pending independent-acceptance gate is unchanged.

## Flow critique and controlled A/B

A fresh native subagent used Amale against baseline a928049 and prepared an isolated recovery/preflight patch. Controlled offline A/B fixtures reproduced missing-checkout failures in next/status/resume and routing before dispatch prerequisites were satisfied. Patched behavior preserves independent progress and avoids catalog/Jev calls for dependency/capacity/conflict blockers. Quarantine retains prior repair ancestry; it does not count a filesystem outage as a failed implementation attempt. Acceptance checks dependency validity even when a descendant was already live.

A separate identical-state context A/B reduced the worker packet from 67,633 to 2,155 JSON bytes at 100 unrelated task routes while retaining constraints, global decisions, relevant task/dependency routing and original evidence. This measures serialized context, not token cost or quality. Arbitrary last-five decision truncation was rejected. The graph now defaults to the actual command path, and conceptual tabs are labeled. See FLOW-REVIEW.html and local .amale/flow-critique artifacts. No external model calls or fabricated independent model receipts were used in this round.

## Parallelism review

A fresh Amale subagent reproduced serial visibility of independent verification and duplicate checks exceeding maxWorkers. The corrected next frontier exposes all task stages and a conservative independent check/review batch. Task checks and pi reviewers acquire durable leases, share worker capacity, reject duplicates/conflicts, retain coordinator/child identity, and release on success or failure. Native reviews recorded after external execution and feature-wide integration checks remain host-managed boundaries.

An actual local subprocess A/B selected checks through the new frontier: 3,675ms sequential baseline versus 1,392ms batched, with 899ms of three-process overlap. This is one synthetic local trial, not a model/network speed or cost benchmark. Tests cover slot occupancy, overlap, duplicate and conflict rejection, failed-process cleanup, live/dead verification recovery and reviewer ownership. See PARALLEL-REVIEW.html and .amale/parallel-critic-20260919 evidence.


## Review-method audit (2026-09-19)

The original explicit-incomplete-report/empty-findings replay is now rejected by the coverage gate. Six additional regression tests cover missing/malformed coverage, valid attestation, unresolved finding coverage, gap-to-probe recovery and factual reviewer context. Full suite: 65 Bun tests; Node also runs nested protocol cases. These are deterministic protocol/behavior tests, not measured model review recall. No paid model review was used for this round. Historical accepted runs are grandfathered; new acceptance transitions require coverage. See the repository REVIEW-METHOD.html and DESIGN.html#review.
