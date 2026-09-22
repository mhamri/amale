import { rm } from 'node:fs/promises';

await rm(new URL('../.output/public/.vite/', import.meta.url), { recursive: true, force: true });
