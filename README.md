# Amale

A self-contained workflow skill for Codex and Claude: discovery, planning, configurable model routing, parallel implementation, independent review and verified delivery. Disk checkpoints let another session resume the work.

The invoking model coordinates the workflow. Jev selects bounded options through OpenRouter; TypeScript code enforces dependencies, ownership, checks and review coverage. The host prepares workspaces and integrates results. This is not an unattended background service.

## Setup

Use Bun, or Node 24 or newer for the fallback launcher. Configure pi with OpenRouter, or provide `OPENROUTER_API_KEY` through your environment. Never put credentials in the repository.

From a stable checkout location:

```sh
node amale/scripts/run.ts doctor
node amale/scripts/run.ts install
```

Installation links `amale/` into the current user's Codex and Claude skill directories and refuses conflicting destinations. Keep the checkout in place after installation. Invoke `/amale` with your task; the skill handles the workflow and resume steps.

The host runs a synthetic startup preflight through its permitted execution channel before network work. Amale does not edit global permission settings. Network access and permission to send project context remain host-controlled.

## Documentation

- [Skill entry point](amale/SKILL.md)
- [CLI operations and inputs](amale/references/runtime.md)
- [Execution and network permissions](amale/references/execution.md)
- [Review and acceptance](amale/references/review.md)
- [Verification and limitations](amale/references/verification.md)
- [Interactive workflow graph](DESIGN.html): open the downloaded file in a browser.

## Development

```sh
cd amale
bun install --frozen-lockfile
bun run check
bun run test:bun
node --test tests/*.test.ts
```

Tests use local fixtures, not paid model calls. Build and preview the graph from the repository root:

```sh
bun design/build.ts
bun design/preview.ts
```

Preview binds loopback port 4179; `AMALE_PREVIEW_PORT` selects another port. Both scripts also run with modern Node. Edit `design/viewer.ts` and `design/template.html`, then rebuild `DESIGN.html`.

Local runs, credentials, screenshots, development reports and intermediate bundles are excluded. Windows execution has been tested; macOS/Linux use portable APIs but have not yet been exercised here.
