# Conditional same-model effort escalation

The intended default in the reference architecture is medium for coordination/integration and high only when a bounded architecture, difficult diagnosis or final-review question needs it. Preserve an explicit user-selected baseline. Never pretend the active session changed effort merely because a prompt says “think harder.” This is separate from Flash → Kimi model escalation: the main model stays exactly the same.

## When to consider escalation

Before a consequential unresolved architecture decision, after diagnosis/repair stops progressing, or before final review when real cross-task uncertainty remains, ask Jev whether the host should retain baseline or use a supported higher effort. Supply concrete failure evidence, conflicting contracts or unresolved acceptance claims. Routine coordination and successful integration do not automatically escalate. An initial hard architecture question can escalate directly; a failed cheap attempt is not required.

Discover the actual baseline and supported ordered levels from the active host/tool schema and current model information. Record them with `effort-configure`. Suggested baseline is medium, but an unknown baseline stays unknown until observed/configured. Never lower the user's explicitly chosen higher effort. Model families do not necessarily expose identical levels.

Use `decide` with a unique ID, effort names as options, and state containing `hostModel`, `baseEffort`, the concrete question and evidence. Resolve uncertainty with `host-decision`. Then `effort-request` consumes that decision. A baseline selection continues normal work; a higher selection makes `next` return `execute-host-effort`.

## Apply the selected effort

- If a supported host mechanism can change this session for subsequent reasoning, apply the selected setting and verify it. Register mode `session`. Restore the baseline through that mechanism after the bounded pass.
- Otherwise, when native delegation supports model and effort, dispatch one bounded pass using the **exact same model** and the selected effort. Register mode `same-model-pass`. Supply a focused evidence packet; do not fork the entire growing transcript. The baseline coordinator remains unchanged and receives the result. In Codex, use the native subagent tool's explicit model and reasoning-effort fields when exposed; do not create a separate user-owned task or recursively prompt the current task.
- Claude's installed CLI exposes `--effort`; supported subagent definitions can specify effort. Use the actual host tool schema/registered agent capabilities, not invented per-call fields. A standalone CLI pass is a separate execution and needs its own existing authorization/environment; it is not proof that the running Claude session changed. If no supported execution mechanism is available, report that limitation and preserve the request rather than silently running at baseline.

`effort-start` records the actual launch/configuration receipt (execution identity, exact model, level, mechanism and evidence). A requested change is not an executed change. Run/await the bounded work and inspect the result. Archive it with `save`. `effort-finish` records the result artifact and verified return to baseline. For a separate same-model pass, baseline never changed; record that fact rather than claiming a reset. An unfinished effort pass prevents run completion.

Requests, execution identity and results survive resume. Reconcile an interrupted pass using its actual native session/subagent before retrying; never silently spawn duplicates. Switching host/model while a pass is active requires reconciling it first; after a completed switch rediscover supported levels. Do not increase past a model's highest supported effort or reuse an old escalation decision for a new problem.

If the selected mechanism cannot launch, use `effort-reconcile` with outcome `not-started`, observed baseline and concrete failure evidence. For an already-running pass, first verify that exact execution has stopped and the baseline is restored, then record outcome `failed` with its execution ID. This records failure rather than fabricating a high-effort result. Reassess the next strategy with Jev; the old decision remains consumed. Do not cancel a live pass or claim completion merely to bypass a required review.

## CLI shapes

- `effort-configure`: `{ "base":"medium", "current":"medium", "levels":["low","medium","high"], "modes":["same-model-pass"], "evidence":"actual model/tool capability and observed session setting" }`. Levels are ordered lowest to highest, derived from verified capabilities.
- `effort-request`: `{ "decisionId":"architecture-effort-1", "purpose":"Resolve the conflicting interface contract", "reason":"Concrete unresolved evidence" }`.
- `effort-start`: `{ "execution":"native execution ID", "model":"exact host model", "level":"high", "mode":"same-model-pass", "evidence":"actual dispatch arguments and accepted execution receipt" }`.
- `effort-finish`: `{ "execution":"same execution ID", "artifact":"saved result hash", "restoredEffort":"medium", "evidence":"result received; coordinator remained at medium" }`.
- `effort-reconcile`: `{ "outcome":"not-started", "restoredEffort":"medium", "evidence":"native adapter refused launch; no execution was created" }`; use `failed` plus `execution` for a verified stopped execution.

This mechanism governs host effort. It does not imply pi worker thinking levels have been configured or that a requested level was honored without host evidence.
