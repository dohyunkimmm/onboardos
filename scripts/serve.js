'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const config = JSON.parse(fs.readFileSync('vercel.json','utf8'));
const securityHeaders = Object.fromEntries((config.headers || []).flatMap(rule => rule.headers || []).map(h => [h.key, h.value]));
if(securityHeaders['Content-Security-Policy']){
  securityHeaders['Content-Security-Policy'] = securityHeaders['Content-Security-Policy']
    .replace(/;?\s*upgrade-insecure-requests\s*;?/g, ';')
    .replace(/;;+/g, ';')
    .replace(/^;|;$/g, '')
    .trim();
}
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8'};

http.createServer((req,res) => {
  let pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if(pathname === '/') pathname = '/index.html';
  if(pathname === '/_vercel/insights/script.js' || pathname === '/_vercel/speed-insights/script.js'){
    res.writeHead(200, {...securityHeaders, 'Content-Type':'application/javascript; charset=utf-8', 'Cache-Control':'no-store'}); res.end('/* local QA analytics noop */'); return;
  }
  if(pathname.startsWith('/_vercel/insights/') || pathname.startsWith('/_vercel/speed-insights/')){
    res.writeHead(204, {...securityHeaders, 'Cache-Control':'no-store'}); res.end(); return;
  }
  const file = path.resolve(root, '.' + pathname);
  if(!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
    res.writeHead(404, {...securityHeaders, 'Cache-Control':'no-store'}); res.end('Not found'); return;
  }
  res.writeHead(200, {...securityHeaders, 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`QA server listening on http://127.0.0.1:${port}`));
