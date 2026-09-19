# Task-specialist model routing research

Verified: 2026-09-19. Design research only; no paid model trials were run.

## Recommendation

Use a small configurable pool by purpose. Jev receives supplied evidence, not only model names. Keep the invoking host as coordinator and a candidate for difficult work. The user's latest preference supersedes the earlier DeepSeek-first and Kimi-frontend defaults: latest stable GLM Flash and DeepSeek Flash do routine work across roles; Kimi K3 is reserved for justified deeper work. This is a routing preference, not an obligation to try an incapable model first.

| Purpose | Initial candidates | Evidence and remaining uncertainty |
|---|---|---|
| General implementation | Latest stable GLM Flash and DeepSeek Flash; host/Kimi for justified deeper work | Verify exact current IDs and provider capabilities at run initialization. Local success is not yet measured. |
| Frontend creation | Capable Flash configuration first; Kimi K3 for deeper needs | Kimi remains a sourced specialist candidate, not the automatic frontend default. Preference for generated pages is not proof of functionality or screenshot-review skill. |
| Visual QA | Image-capable GLM/DeepSeek Flash; Kimi for deeper cases; actual screenshots required | Benchmark evidence does not establish which best catches our responsive-layout or interaction defects. Qualify with rendered pages and known defects. |
| Visual asset inspection | DeepSeek V4.1 Flash; Kimi K3 for difficult cases | V4.1 Flash already has native image input. Do not choose the older experimental vision checkpoint merely because its name says vision. Image understanding does not provide raster generation. |
| Math and algorithms | DeepSeek V4.1 Flash and invoking host, with independent calculations/tests | The DeepSeek vendor card reports strong math results; low price alone is not evidence of poor math. Reasoning settings, tools, and task difficulty matter. |
| Research | Flash workers for source inspection, web search, and scratch experiments; Kimi for justified deeper synthesis | Jev selects bounded research targets per task. Require source retrieval, citation checks, and contradiction handling. |

Each task has an adaptive route. Jev chooses whether existing evidence is enough, whether a compact plan is useful, or whether source/web/experiment targets are needed. Independent targets can run concurrently. New findings or failures re-enter the task decision point; unchanged state does not require repeated Jev calls. Research-only and plan-only tasks can complete without implementation.

Resolve latest stable family members to exact model IDs and retain them for the task, rather than silently switching a floating alias mid-session. The current catalog research identifies GLM 5.3 Flash and DeepSeek V4.1 Flash; a separate GLM 5.3 FlashX serving variant is also listed and needs capability/price/performance verification before selection. Latest is rechecked at execution time, not assumed forever from this document.
- https://openrouter.ai/z-ai/glm-5.3-flash
- https://openrouter.ai/z-ai/glm-5.3-flashx
- https://openrouter.ai/deepseek/deepseek-v4.1-flash

Optional candidates are not automatic new paid dependencies or an obligation to benchmark every model. Prefer a small initial pool, explicit overrides, and observed outcomes. Adding another model should solve an observed gap.

## Primary-source findings

1. Kimi K3 is verified at `moonshotai/kimi-k3` on OpenRouter and has native multimodal/tool capabilities. The primary Arena WebDev snapshot dated September 11 puts Kimi K3 max fifth overall, Astra max first, and Fable 5.1 max second. These rankings are task- and setting-specific and can change. They do not measure visual-defect detection.
   - https://openrouter.ai/moonshotai/kimi-k3
   - https://github.com/MoonshotAI/Kimi-K3
   - https://arena.ai/leaderboard/code/webdev
2. DeepSeek V4.1 Flash is verified at `deepseek/deepseek-v4.1-flash`, accepts images, and returns text. The official card reports DeepSWE 66.2 in pi versus 74.2 in mini-SWE, illustrating why the harness must accompany scores. These are vendor measurements. Its math results justify evaluating it rather than categorically excluding it from reasoning tasks.
   - https://openrouter.ai/deepseek/deepseek-v4.1-flash
   - https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash
   - https://openrouter.ai/blog/insights/deepseek-v4-vision/
3. GLM 5.3 Flash has a primary image-capable model card and is an optional coding/vision challenger. Its local quality/cost advantage has not been demonstrated.
   - https://huggingface.co/zai-org/GLM-5.3-Flash
4. Whole-application tests complement frontend preference benchmarks. Math leaderboards also need methodology checks: MathArena's aggregate includes estimates for missing tasks.
   - https://www.vals.ai/benchmarks/vibe-code
   - https://matharena.ai/
5. Historical RouteLLM evaluations show that routing performance changes with task distribution. Its two-model savings are not evidence of savings for Jev routing current models.
   - https://arxiv.org/html/2406.18665v4

## Routing contract

1. Read the requested task, relevant artifacts, and required tools/modalities.
2. Code filters the configured pool for actual access, supported inputs, tools, context, and user restrictions.
3. Retrieve a few relevant evidence cards, not the entire model catalog. Include unknowns and source dates.
4. Ask Jev focused task-fit and evidence-sufficiency questions. It selects an eligible model/effort/role configuration under the user's completion-first policy. Uncertainty routes to the invoking host.
5. Code computes cost and speed estimates and applies verified provider preferences. Never confuse token throughput with total task duration or a published benchmark with a success probability.
6. Record resolved model/provider/effort, total tokens, wall time, repairs, and verified task outcome. Use simple descriptive statistics and preserve sample counts. Reconsider a choice when outcomes or evidence change.

Cards separate hard capabilities from task-quality evidence. Price, cache pricing, and observed endpoint latency change; fetch current catalog/endpoint data with a dated cache instead of embedding a permanent cheapest model. Unknown host subscription/quota cost must not be recorded as zero API cost.

OpenRouter can route among providers for one model and also offers separate model-routing products. Use Jev for the skill's model choice so its decision is observable; avoid stacking an opaque automatic model router underneath it. Request required parameter support and record any actual fallback. Provider latency/throughput preferences are soft, not guarantees.

Sources:
- https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties
- https://openrouter.ai/docs/guides/routing/provider-selection
- https://docs.typesafe.ai/patterns/intent-routing
- https://docs.typesafe.ai/model-jaggedness/jev-1.13

## Concrete verification before calling this successful

- Frontend: implement a reference at desktop/mobile widths; verify appearance and requested interactions.
- Visual QA: detect real/seeded clipping, missing assets, spacing, focus, and responsive defects; record false positives.
- Assets: inspect actual project images and distinguish visible facts from guesses.
- Coding: use representative TypeScript/Bun changes in the actual pi/OpenRouter harness.
- Math/research: independently check calculations and primary-source support.

Do not add these as a mandatory benchmark phase to every user task. Initial qualification and actual completed-task evidence are sufficient to start; broaden evaluation only when a routing failure or new candidate justifies it.

## Compatibility with context handling

Kimi K3 documents preserving complete assistant messages, including reasoning_content and tool_calls. Its settings must be mapped through the actual adapter, not assumed equivalent to other models' effort labels. Model-specific required fields must survive legal context transformations; arbitrary generic compaction can invalidate the conversation protocol.

pi must know a selected model and its modalities before dispatch. Overriding settings for an unknown model ID is not necessarily registration. Verify catalog freshness/registration and image-result propagation before enabling a model route. A capability advertisement is not a tested end-to-end adapter.
