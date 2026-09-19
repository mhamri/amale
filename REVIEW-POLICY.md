# Proposed review policy

Status: proposed Amale adaptation; not an execution of either source skill unchanged.

## Sources inspected

- Local fresh-review/SKILL.md and references/lenses.md, under ~/.claude/skills/fresh-review. Read in full on 2026-09-19.
- Local Matt Pocock code-review/SKILL.md under ~/.agents/skills/code-review, and current primary source: https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/code-review/SKILL.md

Matt Pocock separates Spec and Standards into two parallel agents. Fresh-review uses a larger conditional lens team plus synthesis and high-severity skepticism. Amale preserves the useful review questions and evidence discipline, while adapting dispatch and repeat behavior to the user's requirements for cost, speed, no hypothetical scope, and bounded escalation. Do not label an adapted single-reviewer pass as an unchanged invocation of either skill.

## Cross-model independence

- DeepSeek implements -> fresh GLM Flash reviewer.
- GLM implements -> fresh DeepSeek Flash reviewer.
- Host/Kimi implements -> eligible different-family reviewer chosen for the actual risk and required modalities.
- A different provider serving the same model does not count as a different model family.
- Reviewer starts with a clean, read-only context: intent, pinned base/current content, relevant repository standards, diff, current changed files, consumer-map starting points, and test receipts. Do not pass the implementer's reasoning transcript or proposed verdict.
- Reviewer can inspect unchanged consumers when the changed contract affects them. The diff is the entry point, not a restriction against tracing real dependencies.

## Lenses are questions, not automatically agents

Default: one fresh opposite-family Flash reviewer, with separate finding sections for requirements/scope, correctness, omission/consumer impact, and repository standards/simplicity. A code-smell preference is not a blocking defect. Skip checks already enforced by tooling.

Jev selects additional lenses from inspected change evidence: money/error handling, contracts, migrations, authorization, visual/accessibility behavior, resource lifetime, dependencies, test quality, or measured performance. Every added lens must name the relevant changed behavior. Concurrency needs an actual shared-state/retry/overlap path; future hypothetical features are not review requirements.

For materially sensitive changes, add one focused reviewer in parallel, with separately scoped questions. Multiple lenses can share a reviewer. Two concurrent reviewers is the proposed default dispatch ceiling, not a cap on real findings or required coverage: if necessary coverage cannot be delivered, the host adjusts the review plan explicitly rather than silently omitting it. Do not spawn a reviewer for each lens or each finding.

Example: a charge-calculation change gets general requirements/correctness review plus a money-path reviewer checking expected amounts and actual silent-error paths. Those checks happen before downstream work depends on the result. A copy-only change does not trigger payment concurrency review.

## Evidence and findings

Each finding records source revision, lens, file/location, concrete input/state, reachable path, observed or inferred wrong behavior, consequence, and a bounded correction. Preserve separate Spec and Standards results even if one worker produces both. Missing formal specs use the accepted user intent and task criteria; no issue-tracker setup is required solely to review an Amale task.

Deduplicate equivalent claims while retaining all supporting evidence and original reports. Distinguish introduced/worsened defects from inherited unrelated issues. Keep out-of-scope discoveries visible without automatically turning them into this task's implementation scope. Do not erase a valid defect for brevity or cost.

Jev classifies finding support, relevance, duplication, and suggested disposition. Code enforces exact checks and evidence freshness. Serious disputed findings go to a focused evidence check or host diagnosis; Jev confidence alone cannot dismiss a demonstrated failure. Batch related disputed claims into one check instead of a skeptic agent per issue. The host resolves conflicting fixes when needed; there is no mandatory synthesis agent.

## A finite repair loop

Proposed configurable default: `maxFlashRepairCycles = 2`.

1. Initial implementation and relevant checks.
2. Initial independent review, then a single consolidated actionable fix list.
3. Repair cycle 1: implementer repairs; affected checks rerun; reviewer checks the changes and affected callers against the finding ledger.
4. If unresolved, repair cycle 2 uses the same discipline. Do not repeat the full lens scan over unchanged content.
5. If real blockers remain after cycle 2, escalate BEFORE a third ordinary Flash repair to Kimi K3 for focused root-cause diagnosis. Earlier escalation is allowed for repeated no-progress, conflicting fixes, architectural failure, or evidence the Flash configuration cannot handle the task.
6. Allow one focused Kimi diagnosis/repair cycle, verified by an independent capable reviewer and actual tests. If still unresolved, the main Astra/Fable takes over diagnosis/replanning. Do not bounce automatically between Kimi and Flash indefinitely.

These are strategy bounds, not spending limits or permission to ship a broken result. Work continues through a changed strategy unless a real external blocker requires intervention. Review/repair counters persist across restart and superficial task renames or commit changes. Replanning records ancestry and the escalation history.

## Avoid repeated work

- Read shared factual context once, preserve source references, and let reviewers extend it independently.
- Review a coherent task once, not every file or edit. Batch genuinely tiny related edits.
- After repairs, inspect changed material plus affected behavior, not every previously clean lens.
- Review results are tied to exact content and dependencies. A change affecting prior conclusions invalidates that portion of review.
- At integration, inspect cross-task interactions and run required combined checks. Broaden a lens only when integration introduces a new risk or invalidates earlier evidence.
- No automatic extra full fresh-review after a completed Amale review of the same unchanged scope.

## Acceptance scenarios

Verify that DeepSeek/GLM author-reviewer pairing is enforced; reviewer context excludes author reasoning; repeated identical findings deduplicate without loss; resolved findings do not reopen without changed evidence; a third Flash repair is blocked by escalation; serious remaining defects cannot be marked complete; and unrelated ready tasks continue during a local review/repair loop.
