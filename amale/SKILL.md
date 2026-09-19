---
name: amale
description: Carry small coding tasks and large multi-phase features through discovery, specification, parallel implementation, independent review and verified delivery, with durable resume across Codex and Claude sessions. Use when the user wants end-to-end work or to resume an Amale run.
---

# Amale

Own the requested outcome until verified delivery or a genuine external blocker. You are the invoking coordinator; retain your actual model identity. All workflow capabilities are bundled here. Do not ask the user which skill comes next and do not invoke external workflow skills.

## Enter or resume

Resolve this skill's canonical directory. Run its TypeScript CLI with Bun, or modern Node if Bun is absent. `node <skill>/scripts/run.ts` is the portable Bun-first launcher. Arguments are `operation workspace run-id input.json`; input files carry structured values, never shell-built JSON. Read [the command contract](references/runtime.md) on first use.

1. `list` the workspace's runs. Select the run matching this request; disambiguate only genuinely ambiguous intent. For an existing run, `resume`, then read `status`. For new work, `start` with the actual host/model, intent, acceptance criteria and constraints.
2. Before the first OpenRouter operation in a session, run `preflight` through the execution channel that will launch Jev/pi. Read [network launch instructions](references/execution.md#network-launch-boundary). When the host explicitly reports restricted networking, request its supported network permission before making requests; do not waste retries in a known blocked sandbox. Never change global host configuration. A synthetic preflight verifies connectivity, credentials and Jev response shape, not authorization to export project context. Repeat after a changed execution boundary or connectivity failure, not before every task.
3. Loop on `next`. Execute the indicated built-in capability, record its result, then request `next` again. Also inspect `parallel.ready`, `parallel.actions`, `parallel.independent` and `parallel.available` (see [parallel execution](references/parallelism.md)): dispatch independent work while the focus task awaits review, repairs or a host decision, subject to its real prerequisites and resource locks. A returned host action is work for you in the current turn, not a reason to stop or ask the user to invoke another skill.
4. Use Jev through OpenRouter (`decide`) for semantic choices: discovery mode, task routes, models, review lenses, evidence relevance, finding disposition and completion-claim support. Supply bounded options and current evidence; independent questions need not wait on each other. Code, not Jev, enforces exact constraints. `host-decision` resolves uncertain/malformed judgments with a recorded reason. API failure is distinct from semantic uncertainty: retry transient failures, checkpoint genuine service/credit blockers.
5. Record host-side work with `host-action`: before a native delegation, direct edit, permission request or integration, persist a planned action with an actionId and host sessionId. Record the observed permission/execution outcome and next step under the same actionId; retries use a new actionId. This is host-reported evidence, not an automatic hook. After restart read `diagnose` and reconcile unfinished observations against actual processes/files before replaying. Do not interpret missing events as proof of skipped work. `diagnostic-export` creates a local structural summary with free text and source identifiers omitted; it does not upload anything.
6. After every material outcome, persist the decision, artifact, task transition or check. `html` generates the current human-facing progress view. Never rely on conversation memory or a final summary as the only checkpoint.

## Built-in capabilities

- **Discover, specify and plan:** read [discovery and planning](references/planning.md) when intent, architecture or task decomposition needs work. A clear small fix can use a compact brief. Large features retain overall phase outcomes, interfaces and a dependency graph. No mandatory document/approval ladder.
- **Route and execute:** read [execution](references/execution.md) before delegating. GLM/DeepSeek latest stable Flash models do routine footwork through pi/OpenRouter. Worker/reviewer commands enforce automatic Jev model routing; omit manual model overrides. Resolve returned host-decision or route-blocked actions before retrying. Configure task-specific pools from the live catalog. Kimi handles justified deeper work; the main model handles small coupled work or escalated diagnosis. Never invent model capabilities.
- **Review and verify:** read [review](references/review.md) before acceptance. DeepSeek authors get GLM review and vice versa, in fresh read-only contexts. Map reachable transitions and affected consumers before review; require structured coverage, not merely an empty findings list. Resolve `review-evidence-needed` with targeted inspection/probes without spending a repair cycle. Group relevant lenses. Two Flash repairs, then one Kimi repair, then main-model diagnosis by default; persistent counters forbid reset loopholes.
- **Escalate host effort:** read [effort](references/effort.md) for unresolved architecture, stalled diagnosis or consequential final-review uncertainty. Jev selects baseline versus a supported higher effort on the exact same host model. Default intent is medium → high only when needed. Use a verified session mechanism or a bounded same-model higher-effort pass; record actual execution and return to baseline. Never equate a requested setting with an applied setting.
- **Recover and compact:** `resume` reconciles active ownership and changed evidence. Read [recovery](references/recovery.md) for interruption, compaction and blocked work. Use `status`/artifact references to restore only relevant detail.

## Non-negotiable outcome rules

Preserve user decisions and existing authorization. Required unanswered intent questions block only dependent work; neither Jev confidence nor elapsed time grants consent. Discover facts with tools. Do not add hypothetical product requirements: cite a requirement, observed failure or reachable path for safeguards.

Group cohesive edits, not one agent per file. Parallelize independent work in isolated workspaces; serialize real resource conflicts and integration. No phase-wide wave barrier. Keep unrelated ready work progressing during a repair loop.

Worker prose is not a passing test. Run registered checks, inspect actual artifacts, require fresh independent review, and verify integrated outcomes. A failed required check or unresolved real blocker cannot be dismissed to save tokens. For visual tasks inspect actual rendered images; research needs sources; mathematical claims need checked calculations.

Maintain affected repository documentation. Keep human-facing designs/specifications in HTML and durable machine state for every run. No dependency on to-spec or tracker setup. A model/API/tool dependency is not an external skill dependency.

Continue to completion with no artificial total-spend cap. Checkpoint and explain genuine credit exhaustion, authorization or external blockers. A closed session is not a background scheduler: the next Amale invocation resumes from disk. Never claim unavailable host hooks are installed or native compaction has been replaced.

For installed adapter coverage, tested versions and current practical limits, see [verification](references/verification.md).
