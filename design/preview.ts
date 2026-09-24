import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.AMALEH_PREVIEW_PORT ?? 4179);
createServer(async (request, response) => {
  const documents: Record<string,string> = { '/':'DESIGN.html', '/DESIGN.html':'DESIGN.html' };
  // Serve shipped documentation only, never local runs or audit artifacts.
  for (const name of ['runtime','effort','verification','parallelism']) {
    const path = `amaleh/references/${name}.md`;
    documents['/' + path] = path;
  }
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
}).listen(port, '127.0.0.1', () => console.log(`Amaleh design: http://127.0.0.1:${port}`));
