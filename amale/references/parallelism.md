# Parallel execution without a phase barrier

The host drives concurrency. A CLI call performs one operation; the skill does not run a background scheduler.

Read `next.parallel` alongside the focus action:

- `ready`: dependency-ready implementation candidates. Prepare separate workspaces and dispatch independent workers concurrently through the host's asynchronous tools.
- `actions`: per-task verification, repair, recovery and integration actions, including tasks beyond the focus. Keep healthy tasks progressing when one needs diagnosis.
- `independent`: a conservative batch of checks/reviews in distinct, nonconflicting task workspaces, within currently available capacity. The focus may be included: execute each listed operation once, not once for the focus and again for the batch.
- `running` and `available`: execution ownership and remaining shared slots. A suggested batch is not a reservation; runtime guards recheck at execution.

Dispatch the batch concurrently and await individual outcomes. Within a single task, run its registered checks sequentially: builds/tests may share generated files. Across independent isolated checkouts, the same lint/build command can overlap. Do not use a blanket shared resource name for unrelated work; resource claims should describe actual shared state and coupled changes.

Checks and pi reviews hold durable activity leases. Duplicate verification of one task, conflicting workspace/resource access and capacity overflow are rejected. Leases are released on completion/failure; interrupted ownership is reconciled through `resume`. Do not interpret a cleared conversation as proof a child process stopped.

After any task passes review and required checks, accept and integrate its actual changes, then refresh `next`. Newly unlocked dependents need not wait for unrelated slow tasks. Integration writes to the main checkout and remains a host-controlled serial boundary. Feature-wide integration checks also remain serialized; they are not part of the suggested independent verification batch.

No rule makes failed checks optional. Parallelism changes when eligible work starts, not the evidence required for acceptance. Model routing and review independence remain enforced for every pi launch.
