import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const source = fileURLToPath(new URL('./viewer.ts', import.meta.url));
const bundle = fileURLToPath(new URL('./viewer.generated.js', import.meta.url));
const result = spawnSync('bun', ['build', source, '--target=browser', '--outfile', bundle], { stdio: 'inherit', shell: false });
if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT') {
  const { stripTypeScriptTypes } = await import('node:module');
  await writeFile(bundle, stripTypeScriptTypes(await readFile(source, 'utf8')));
} else if (result.status !== 0) {
  throw new Error('The diagram compilation failed.');
}
const template = await readFile(new URL('./template.html', import.meta.url), 'utf8');
const script = (await readFile(bundle, 'utf8')).replaceAll('</script', '<\\/script');
await writeFile(new URL('../DESIGN.html', import.meta.url), template.replace('/* EMBED_VIEWER */', script));
console.log('Created standalone DESIGN.html');
