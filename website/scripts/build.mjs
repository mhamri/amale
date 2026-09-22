import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const websiteDir = fileURLToPath(new URL('../', import.meta.url));

const steps = [
  ['scripts/prepare.mjs'],
  ['node_modules/vite/bin/vite.js', 'build'],
  ['scripts/postbuild.mjs'],
];

for (const args of steps) {
  const code = await new Promise((done, fail) => {
    const child = spawn(process.execPath, args, {
      cwd: websiteDir,
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
    });
    child.on('error', fail);
    child.on('close', done);
  });
  if (code !== 0) {
    console.error(`Build step failed with exit code ${code}: node ${args.join(' ')}`);
    process.exit(code ?? 1);
  }
}
