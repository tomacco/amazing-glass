// Static server for the built site and the repo: bun tools/serve.ts [port]
const port = Number(process.argv[2] || 5180);
const root = new URL('..', import.meta.url).pathname;
Bun.serve({
  port,
  async fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path === '/') path = '/site/';
    if (path.endsWith('/')) path += 'index.html';
    const file = Bun.file(root + path.slice(1));
    return (await file.exists()) ? new Response(file) : new Response('not found', { status: 404 });
  },
});
console.log(`http://localhost:${port}/site/`);
