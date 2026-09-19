# Command contract

Use `bun <skill>/scripts/cli.ts <operation> <workspace> <run-id> [input.json]` or `node <skill>/scripts/run.ts ...`. Modern Node directly executes the erasable TypeScript. Paths are arguments, not interpolated shell commands. There are no npm runtime dependencies.

`doctor` takes no run; `list <workspace>` finds runs. `install` links this canonical skill into the default Claude/Codex skill directories and refuses conflicting targets. Windows uses directory junctions; Unix uses directory symlinks.

## Input examples and operations

`start`: `{ "host":{"kind":"codex","model":"actual model from session"},"intent":"requested outcome","criteria":["observable success"],"constraints":["accepted restriction"] }`.

`plan`: `{ "tasks":[{"id":"charge","title":"Correct charge","goal":"Apply the agreed amount rule","phase":"checkout","deps":[],"resources":["checkout"],"criteria":["expected totals hold"],"kind":"code","checks":[{"id":"test","command":"node","args":["--test","test/charge.test.js"]}]}],"integrationChecks":[{"id":"all","command":"node","args":["--test"]}] }`. Commands use executable plus argument arrays. Register actual project checks, not invented test commands. Research and plan tasks may have no executable checks but still need reviewed evidence. Plans may add tasks, not discard history or silently rewrite existing contracts.

`amend`: `{ "id":"charge","reason":"actual changed requirement or diagnosis","task":{...complete updated task contract...} }` deliberately changes an existing contract while retaining identity and escalation ancestry, invalidating affected descendants, and validating the updated graph. Do not create a replacement ID merely to reset repair history.

`next`, `status`, `resume`, `html`: no input. `status` includes durable references and phase status. `html` returns a local HTML progress artifact.

On a new host/model, pass `resume` an input with `host: {kind, model}` containing the actual current coordinator. The handoff retains the prior identity in history and allows escalation to the current host. Completed runs resume as `done` without mutation.

`effort-configure`, `effort-request`, `effort-start`, `effort-finish`, `effort-reconcile` implement the conditional same-model effort path; see [effort](effort.md) for validated input shapes and host execution requirements. `next` exposes requested/running passes and `status` preserves the baseline and execution receipt. A host/model switch must first reconcile any active effort pass.

`record-decision`: `{ "id":"intent-answer","question":"What outcome?","answer":"The user's actual answer","source":"user","reason":"Reference to the actual instruction" }` records settled intent without a Jev call. Use source `host` only for delegated technical decisions. Never invent a user answer. `block` accepts an optional task `id` to block only that task and its dependents while unrelated work proceeds.

`pools`: `{ "pools":[{"role":"frontend","models":["verified exact model IDs"],"requiredInputs":["text","image"],"requiresTools":true,"notes":"User preference and relevant evidence"}] }` persists purpose-specific routing preferences. Filter these against current catalog capability facts before dispatch; configuring a model does not prove eligibility.

`decide`: `{ "id":"unique-decision","question":"Which route is justified?","criteria":{"source":"Read relevant code","execute":"Evidence is sufficient"},"state":{"task":"...","facts":["..."]} }`. Use actual evidence, not empty routing ceremony. Response chooses an option or yields `host-decision`. OpenRouter Jev uses the decisions endpoint, not chat completions. `host-decision`: `{ "id":"unique-decision","choice":"source","reason":"evidence and reasoning" }`.

`catalog`: fetches dated candidate cards including capability, price, and source. Select stable eligible models and record exact IDs; the description is not local performance proof. Set `AMALE_JEV_MODEL` to a verified current OpenRouter Jev ID if the installed default becomes stale.

`claim`: `{ "id":"charge","workspace":"absolute task workspace","model":"actual model" }`. Direct host work must claim before editing and later record `result`. `worker` takes `{id, workspace, brief, routing?}` and selects a model automatically before it invokes pi, records real model/session output and checkpoints the result. Never concurrently run workers in the same checkout. `result`: `{ "id":"charge","output":{"changes":["..."],"remaining":[]} }`.

`check`: `{ "id":"charge","checkId":"test" }`; omit `id` for a feature integration check. Runs the registered executable, saves output and fingerprints. If a check changes files, rerun checks invalidated by those changes before acceptance.

`reviewer`: `{ "id":"charge","lenses":["Spec","Standards","money path"],"routing":{"evidence":"Relevant suitability evidence"} }` invokes a fresh read-only pi review. `review` records a review obtained through a supported native agent instead: `{ "id":"charge","model":"actual reviewer model","fingerprint":"from fingerprint operation","report":"coverage and findings evidence","findings":[] }`. Never fabricate a reviewer identity or report. Findings require id, lens, location, scenario, evidence, consequence and a boolean blocking field.

`repair`, `accept`: `{ "id":"charge" }`. Repair updates the persistent escalation counter. `integrated`: `{ "id":"charge","evidence":"actual integration and interaction inspection evidence" }` after the host integrates changes and checks compatibility. `finish`: `{ "claims":["evidence explanation corresponding to each run criterion"] }` after all tasks integrated, full required checks pass and Jev claim-support decisions resolved. These host attestations are trusted operator input, not cryptographic proof of correctness.

`save`: archives any JSON evidence; returns a content ID. `artifact`: `{ "id":"artifact hash" }` retrieves original evidence. `fingerprint`: optional `{ "workspace":"task checkout" }` returns exact current content fingerprint.

`block`: `{ "reason":"external failure and intervention needed" }`. `requeue`: `{ "id":"task","evidence":"interrupted effects inspected and reconciled" }` only for blocked tasks. `invalidate`: `{ "id":"task","reason":"which accepted assumption/evidence changed" }`; repair ancestry remains. `configure` accepts positive integers for maxWorkers, flashRepairCycles, deepRepairCycles. `unlock` verifies a dead same-host lock owner before removing a stale lock; never delete a live or unverifiable lock.

## Authentication and process settings

Use `OPENROUTER_API_KEY`, or pi's existing OpenRouter credential. The runtime never prints or writes it into artifacts. Expired pi credentials require refresh through pi. `AMALE_PI_ENTRY` can name the installed pi JavaScript entry; `AMALE_NODE` selects its Node executable. Platform discovery checks common executable-adjacent global package locations without running shell shims. Worker calls disable external skills/extensions/context discovery; provide applicable repository rules explicitly in briefs. They preserve pi's complete session messages and use the global configuration read-only in intent; pi may acquire its own configuration lock as part of startup.

## Diagnostic traces

`diagnose <workspace> <run-id>` returns current state, pending work, operation timelines, failures, unfinished operations and usage totals. It also works when initialization failed before a valid snapshot existed. Trace files live in `.amale/runs/<id>/diagnostics`, independently of state commits; pi session paths and immutable artifact references remain available. API attempts record HTTP status, request identity when supplied, duration and usage. pi records process identity, tool progress, exit status and protocol/provider failures. An unfinished operation means active or interrupted; inspect ownership before replaying.

Costs are separated into OpenRouter response-reported cost and pi local estimates. Neither is a reconciled billing ledger; local pi pricing can lag the gateway catalog. Missing usage is unknown, not proof of zero cost. Telemetry redacts known credentials and sensitive fields, excludes prompts and tool bodies, and limits error text. Original authorized tool artifacts and pi sessions are separate and may include project content.

`next.parallel.ready` exposes independent dependency-ready candidates even while the focus action awaits review or repair. `parallel.available` reflects worker capacity; `claim` still enforces resource and workspace conflicts. A pending decision may concern a candidate: satisfy its real prerequisites before dispatching.

`route`: `{ "id":"charge", "purpose":"worker", "workspace":"absolute checkout", "routing":{"role":"configured optional role","requiredInputs":["text"],"contextTokens":8000,"evidence":"Observed requirements and model suitability evidence"} }`. Purpose is worker or reviewer. Role is optional; omit it for default Flash pools. This previews the same automatic route used by worker/reviewer. A successful selection returns launch plus model and decision ID, without spawning. Pending uncertainty returns host-decision; resolve its exact option key, then retry the original operation. Explicit model values on worker/reviewer must match the selected route and cannot bypass it.

`next.parallel.actions` lists each task's verification/repair/integration stage. `parallel.independent` suggests a conflict-free check/review batch bounded by available execution slots. Dispatch these through the host concurrently; they are not additional copies of the focus action. See [parallel execution](parallelism.md). Integration remains serial in the main workspace.


### Review coverage contract

`review-packet` input `{id,lenses?}` returns factual review context and exact required coverage IDs. Both `review` and the pi `reviewer` use coverage entries `{id,status,evidence}`, where status is covered/finding/unreviewed/not-applicable. Missing coverage in legacy receipts is retained as a gap. `review-evidence-needed` is host work, not a completed review or repair cycle. `review-check` input `{id,check:{id,command,args}}` registers an additional unique task check while review is idle, invalidates the old review, and retains repair counters. Execute it with `check`, then obtain updated independent coverage. See [review method](review.md).

Reviewer context includes only settled decisions explicitly marked `purpose: "requirement"`. Use that purpose for user/product requirement facts, never finding disposition, routing or completion judgments. Unclassified legacy decisions stay durable for the host but are withheld from the fresh reviewer; restate relevant requirements in task criteria/constraints or classify them explicitly. This prevents prior verdicts leaking through otherwise factual-looking answers. Previously accepted/completed historical records are not retroactively re-reviewed; the new gate applies to new acceptance transitions.


### Startup network preflight

`preflight`: `{ "network":"restricted|allowed|unknown", "channel":"actual host execution channel" }`. Returns ready or an actionable failure, elapsed time and an artifact reference. Known restricted networking performs zero requests. Otherwise it validates credentials and a fixed synthetic Jev choice with one request attempt and a ten-second timeout. Run before the first network operation using the same permitted execution boundary as later Jev/pi calls. No project content is included, no permission is granted, and no global setting is changed. `doctor` remains a local check; it does not prove network connectivity. An existing run is optional: the supplied run-id provides the diagnostic/artifact location.


### Host actions and diagnostic export

`host-action` records an immutable, local host observation even before run initialization or after an API failure:

```json
{"actionId":"review-attempt-1","sessionId":"host-session-1","kind":"review","phase":"planned","summary":"Request fresh review of the current task","taskId":"layout","next":"Request host network permission"}
```

Kinds: decision, worker, review, edit, check, integration, permission, other. Phases: planned, permission-granted, permission-denied, started, completed, failed, skipped. Use the same action/session identifiers for an attempt's observations, and a fresh actionId for a retry. Summary is required; taskId and next are optional. Summaries should contain concise reasons and local evidence references, never credentials. Logs use existing best-effort secret masking; arbitrary sensitive text is not guaranteed to be detected.

`diagnose` includes this ledger and unreadable-record names alongside runtime diagnostics. These are host attestations, not proof of tool execution or authorization. Missing outcomes need reconciliation; an absent event does not prove the agent skipped a step. Same-timestamp records have no guaranteed causal ordering.

`diagnostic-export` writes a local JSON file under the run's exports directory and returns its path and content. Its structural allowlist excludes free text, prompts, code, original action/session/task IDs, model names, paths, raw tool output and exception messages. It retains pseudonymous action/session relationships, phase/kind, task status counts and runtime outcome/timing/usage summaries. It works without valid run state and reports unreadable record counts. The result still discloses operational metadata; inspect it before explicitly sharing. Nothing is automatically uploaded. Full explanations remain available locally through `diagnose`.
