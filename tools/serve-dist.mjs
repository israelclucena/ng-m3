// Minimal static server for the dashboard prod build (SPA fallback).
// Usage: node tools/serve-dist.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'dist/apps/dashboard/browser';
const PORT = Number(process.argv[2] ?? 4278);
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };

createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(ROOT, p);
    try { if ((await stat(file)).isDirectory()) file = join(ROOT, 'index.html'); }
    catch { file = join(ROOT, 'index.html'); }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('nf'); }
}).listen(PORT, () => console.log(`serving ${ROOT} on :${PORT}`));
