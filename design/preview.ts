import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.AMALE_PREVIEW_PORT ?? 4179);
createServer(async (request, response) => {
  const documents: Record<string, string> = { '/': 'DESIGN.html', '/DESIGN.html': 'DESIGN.html', '/SPEC.html': 'SPEC.html', '/REVIEW.html': 'REVIEW.html', '/FLOW-REVIEW.html': 'FLOW-REVIEW.html', '/PARALLEL-REVIEW.html': 'PARALLEL-REVIEW.html', '/REVIEW-METHOD.html': 'REVIEW-METHOD.html' };
  // Only explicitly published review evidence; never serve arbitrary run/session files.
  for (const path of [
    '.amale/review-method/acceptance-audit-result.json', '.amale/review-method/acceptance-audit-fixed-replay.json',
    '.amale/parallel-critic-20260919/evidence.json', '.amale/parallel-critic-20260919/frontier-ab/evidence.json', 'amale/references/parallelism.md',
    '.amale/flow-critique/context-ab.json', '.amale/flow-critique/results.json', '.amale/flow-critique/patched-results.json',
    '.amale/flow-critique/route-results.json', '.amale/flow-critique/patched-route-results.json',
    '.amale/self-review/.amale/audit/report.html', '.amale/self-review/.amale/audit/report.json',
    '.amale/self-review/.amale/audit/canonical-regression-replay.json',
    '.amale/self-review/amale/tests/self-review-regressions.test.ts',
    '.amale/live-self-review-fixes/diagnostic-report.json',
    'amale/references/runtime.md', 'amale/references/effort.md', 'amale/references/verification.md',
  ]) documents['/' + path] = path;
  const document = documents[request.url ?? ''];
  if (!document) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    response.writeHead(200, { 'Content-Type': document.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(await readFile(new URL(`../${document}`, import.meta.url)));
  } catch {
    response.writeHead(500).end('Build DESIGN.html first.');
  }
}).listen(port, '127.0.0.1', () => console.log(`Amale design: http://127.0.0.1:${port}`));
