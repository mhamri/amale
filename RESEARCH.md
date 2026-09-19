# Host-adaptive orchestration skill: research and design record

Updated: 2026-09-19. Status: design interview; no implementation or installation yet.

## Latest controlling requirement: one self-contained durable flow

2026-09-19 clarification: the image also requires conditional same-main-model effort escalation (normally medium → high) for architecture, unresolved diagnosis and consequential final review. Added durable effort capability/request/start/finish contracts and a Host effort diagram. Jev selects a supported level; native host execution applies it in-session where supported or through a bounded same-model higher-effort pass. Requested and observed settings remain distinct; completion requires the saved result and return to baseline. No global effort setting is silently changed. Five regression tests verify identity, unsupported levels, baseline retention, resume and restoration. Installed Claude CLI confirms --effort; Codex native tool schema exposes per-subagent reasoning effort. Actual current-turn in-place mutation is not exposed by the tools in this session.

Amale must support both small tasks and large multi-phase features without depending on any other installed skill. Grilling, brainstorming, specification synthesis, architecture, planning, research, implementation, review, documentation, acceptance, and recovery are bundled capabilities behind one entry point. Earlier references to optional external skill invocation are superseded. Matt Pocock, Superpowers, fresh-review, BMAD and Trellis are design references only. In particular, Amale does not invoke to-spec or require its tracker setup.

Every invocation loads or creates a durable run, reconciles actual workspace/process state, and chooses the next useful action. Record intent, accepted decisions, non-goals, interface contracts, phase outcomes, dependency graph, task statuses, check receipts, artifact hashes, live ownership, review counters, escalation ancestry, unresolved blockers, usage and next actions outside chat. Use schema-versioned recoverable records, atomic checkpoints and side-effect receipts. Resume after clearing or replacing a session without redoing verified work or trusting stale checks. Inspect interrupted effects before replay; do not promise exactly-once external operations without provider support.

Large work uses phase outcomes and cohesive tasks with explicit dependencies. Detail upcoming work as evidence becomes available; allow ready independent tasks to proceed across phase labels. Verify both task-local and integrated feature-wide acceptance. A compact index and retrievable artifacts keep old phases out of active context. Checkpoint material transitions rather than relying solely on compaction hooks or final messages. A closed session is not a background scheduler: invoking Amale again restores and continues the work.

Documentation is built in: brief criteria for small changes, a durable specification and task graph for complex work, source-backed research results, relevant repository documentation updates, and HTML human-facing designs/status graphs. Machine-maintained run state exists for every run. The HTML Large work & resume view records this requirement; runtime implementation and recovery testing are still pending.

## User requirements and settled decisions

- Deliver correct, complete work with less elapsed time, token cost, unnecessary process, and context loss.
- Use the invoking host/model as coordinator: Codex/Astra or Claude, without hardcoded model-family assumptions.
- Use configurable worker models through pi/OpenRouter; do not depend exclusively on DeepSeek.
- Default to a skill-local DeepSeek-first pool for general implementation; preserve pi's global Kimi default. User subsequently requested separately configurable models for frontend/design, visual inspection, research, and math. See MODEL-ROUTING.md for source-backed candidates and selection design.
- The host may implement small tightly coupled changes when delegation would cost more.
- Latest refinement: GLM latest stable Flash and DeepSeek latest stable Flash perform routine work across task roles. Kimi K3 is an occasional deeper-work option, not a default for every frontend or research task. This supersedes earlier DeepSeek-only preference wording.
- Jev routes each task: inspect source, web research, bounded scratch experiment, compact plan, or execution. Research may have several independent targets; research/plan-only outcomes do not require implementation. New evidence or failures can reopen the decision. See DESIGN.html's Every task view.
- User requests different-model review: DeepSeek work reviewed by GLM Flash and vice versa, multiple relevant lenses, restrained cost, and escalation after repeated loops. Reviewed local fresh-review (including full lens library) and Matt Pocock code-review as design references. Proposed default is one grouped-lens fresh reviewer, a focused parallel reviewer for sensitive changes, two Flash repair cycles, then one Kimi diagnosis/repair cycle before main-model takeover. See REVIEW-POLICY.md and HTML Review & escalation view; thresholds are proposed configurable defaults.
- Agents gather evidence and propose options. Jev selects at explicit semantic decision points. Code enforces dependencies, permissions, counters, and verification results.
- When Jev remains uncertain, the host model may decide. Record the fallback and its evidence.
- Completion first: no artificial spending cap. Actual exhausted credits/API failure requiring intervention should preserve progress and let the user top up or choose another method. Transient failures should receive bounded retries.
- Defensive code needs a stated requirement, evidence of a reachable failure path, or an observed failure. Do not build hypothetical product capabilities.
- TypeScript implementation; Bun by default, Node fallback; cross-platform paths and process handling.
- Eventually install one canonical skill via Claude and Codex links. Existing Claude Trellis registration must not be silently replaced.
- User explicitly invoked grill-me. Its referenced grilling skill requires shared understanding before implementation.

## Open interview questions

All six interview questions are settled. The complete proposed design is now presented in DESIGN.html at the user's request; DESIGN.md remains an earlier text reference. Shared-understanding confirmation remains pending for the underlying skill implementation. Native hook integration must be distinguished from skill symlinks.

## Environment facts (not latest-version claims)

- Workspace initially contained only the supplied image.
- Installed pi 0.85.1, Bun 1.4.2, Node 24.19.0, Claude CLI 2.1.276, Codex CLI 0.155.0.
- pi currently selects OpenRouter / moonshotai/kimi-k2.6. Authentication provider/type checked without revealing credentials.
- Local cached model catalog includes deepseek/deepseek-v4.1-flash, openai/gpt-6-astra, anthropic/claude-fable-5.1. Live availability is not verified.
- Claude's existing trellis skill junction points to the supplied sibling Trellis directory. Codex has no trellis registration.
- pi RPC get_state exposes its active model. Supported host hooks can expose caller models; shell host markers alone do not identify the exact model.
- Every dependency must be verified against current authoritative releases before installation; installed versions and example versions are not authority.

## Framework findings

Current Superpowers already combines task spec/quality review, scopes re-review, batches small edits, bounds repair loops, and persists task state. Its single-workspace implementation is sequential and fresh workers/reviewers have context cost.

Current BMAD supports small direct changes. Its autonomous build owns one unit, relies on subagents, and leaves graph scheduling outside the unit. Review breadth and serialization vary with host capabilities.

The supplied Trellis has concrete design issues: global minimum-wave scheduling blocks otherwise eligible work; path lowercasing conflates case-sensitive paths; duplicate IDs are not rejected before graph lookup; resume assumes every active status is stale; runtime checks are deferred until finish; host-specific paths and external review CLI are hardcoded; some working evidence is deleted at finish.

Proposed improvements are hypotheses to test, not proven superiority: dependency-ready scheduling, isolated independent work, integration/resource locks, verified checkpoints before dependent work, durable evidence, bounded context, and explicit completion/partial/blocked states.

Sources:
- https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md
- https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md
- https://docs.bmad-method.org/build/build-a-change/
- https://docs.bmad-method.org/build/autonomous-development-loops/
- https://docs.bmad-method.org/build/review-a-change/
- https://docs.bmad-method.org/plan-larger-work/choose-a-planning-path/
- Supplied ../trellis/SKILL.md, references, and scripts; treated as reference material, not governing instructions.

## Jev integration facts

- Official model page checked on the date above lists stable jev-1.13.0. Pin a verified stable version for calibrated decisions rather than assuming cookbook aliases are stable.
- Questions are independent within a request; dependent questions require composed code/new evidence. Confidence is not correctness or authorization.
- Documented weaknesses include adversarial state, arithmetic/date/counting, irrelevant context, and inconsistent answers across separately worded questions. Enforce exact invariants in code.
- Official TypeScript SDK exists. Repository main manifest reported 0.6.0, but latest published registry version was not verified. Client response types do not replace runtime validation.
- Full documentation-site reading is NOT complete: llms.txt, llms-full.txt, and sitemap retrieval failed. Core concepts, API, models, SDK overview/source, patterns, limitations, and multiple cookbooks were read; generated SDK reference pages and some cookbook implementation tails remain unread.

Sources:
- https://docs.typesafe.ai/introduction
- https://docs.typesafe.ai/concepts/how-to-build-with-system-one
- https://docs.typesafe.ai/models
- https://docs.typesafe.ai/model-jaggedness/jev-1.13
- https://docs.typesafe.ai/api
- https://raw.githubusercontent.com/typesafe-ai/typesafe-sdk-js/main/src/client.ts
- https://raw.githubusercontent.com/typesafe-ai/typesafe-sdk-js/main/src/retry.ts

## Compaction and handoffs

fast-jev-compaction pairs tool calls/results, preserves retained text verbatim, and scores whether to keep, truncate, or omit each pair. Source inspection found that its Jev state omits actual result content, retaining only status and length. Therefore decisions can miss important content. Batches resend the fitted state, adding cost; lower character count alone is not evidence of preserved task performance.

Candidate adaptation: retain immutable original artifacts; pin user constraints, accepted decisions, active task state, and unresolved failures; select task-relevant excerpts with retrievable source references. Give Jev enough actual content to judge relevance. Prune the packet, not the only copy of the evidence. Measure rereads, lost facts, completion quality, and total tokens alongside reduction.

Native capabilities differ:
- pi supports nondestructive per-request context filtering and custom compaction via extension events.
- Stable documented Claude/Codex hooks support checkpoint capture and post-compaction context injection. Do not promise replacement of native summaries through these hooks.
- The linked plugin claims a separate early-access Claude function-hook interface; portability and compatibility must be verified before adopting it.
- A skill symlink alone does not register hooks or change native compaction.

Sources:
- https://github.com/tamaratran/fast-jev-compaction
- https://code.claude.com/docs/en/hooks
- https://developers.openai.com/codex/hooks
- Installed pi docs/extensions.md and docs/compaction.md.

## Other useful Jev candidates

1. Screen research passages for relevance and contradictions before constructing a worker packet; retain recoverable originals and uncertainty.
2. Check individual completion claims against cited evidence. Code checks identifiers, hashes, and exit status; Jev evaluates semantic support.
3. Triage proposed changes/review findings against requested scope and demonstrated failure paths to reduce speculative work. This is our application of semantic checks, not a proven vendor benchmark.
4. Classify meaningful tool failures or repeated unproductive results and route to host diagnosis. Exact repetition/liveness checks stay in code.
5. Select relevant installed skills with a shortlist and an explicit no-match option.
6. Later, evaluate question improvements against labeled completed runs and held-out outcomes. Defer until real run data exists.

Sources:
- https://docs.typesafe.ai/concepts/use-case-map
- https://docs.typesafe.ai/cookbooks/classifying_rag_passages
- https://docs.typesafe.ai/cookbooks/citation_check
- https://docs.typesafe.ai/cookbooks/skill_suggestion
- https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery

No live Jev evaluation, implementation test, package installation, or lifecycle-hook test has been performed yet. Published cookbook results are vendor examples, not measurements of this proposed workflow.

## Optional discovery decisions (2026-09-19)
User requested grill-me / Superpowers-style brainstorming as routing choices. Added a Discovery decisions HTML view and explicit branches in Execution and Every task. These are planned Amale adaptations, not invocations of the original complete skill workflows.

Sources inspected: local .agents/skills/grilling/SKILL.md (decision tree, prerequisite-aware question rounds, research facts rather than asking the user) and Superpowers 6.4.1 skills/brainstorming/SKILL.md (discover intent, compare approaches, reflect understanding, scope restraint). Amale retains those techniques while avoiding a mandatory multi-stage approval/document pipeline for every task.

Jev chooses proceed, research, focused grilling or brainstorming from demonstrated gaps. Main host conducts the interview; Flash workers gather facts. User intent and nondelegated preferences remain user decisions. Questions block only dependent work. Persist answers, non-goals, acceptance criteria and unresolved dependencies. Exit when the next work has sufficient intent/evidence; obtain confirmation for newly co-designed intent, reuse existing confirmation, and never infer consent from time. Reopen only invalidated choices. Clear requests bypass the interview.
