import { rm } from 'node:fs/promises';

await rm(new URL('../.output/public/.vite/', import.meta.url), { recursive: true, force: true });

// nitro.json records the wall-clock time of the build. Nothing in the published
// site reads it, and keeping it makes every build produce a different tree,
// which breaks any verification that compares a build against the tree it ran on.
await rm(new URL('../.output/nitro.json', import.meta.url), { force: true });
