import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
const publicDir = new URL('../public/', import.meta.url);
await mkdir(new URL('sources/', publicDir), { recursive: true });
for (const name of ['planning', 'execution', 'review', 'runtime', 'parallelism', 'recovery', 'verification', 'effort']) {
  await copyFile(new URL(`../../amale/references/${name}.md`, import.meta.url), new URL(`sources/${name}.md`, publicDir));
}
const workflow = await readFile(new URL('../../DESIGN.html', import.meta.url), 'utf8');
await writeFile(new URL('workflow.html', publicDir), workflow);
await writeFile(new URL('.nojekyll', publicDir), '');
