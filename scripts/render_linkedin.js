// Render scripts/linkedin_slides.html to 1080x1350 PNG slides (at 2x for sharpness) in the folder given
// as first argument (default docs/linkedin, which is not committed). Serves the repo root on :8799.
// Usage: node scripts/render_linkedin.js [outDir] [screenshotA.png] [screenshotB.png]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'docs', 'linkedin'));
const shots = [process.argv[3], process.argv[4]].map(f => (f ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : ''));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(8799, async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8799/scripts/linkedin_slides.html');
  await p.waitForSelector('body[data-ready="1"]');
  await p.evaluate(([a, c]) => { document.getElementById('s6a').src = a; document.getElementById('s6b').src = c; }, shots);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  const n = await p.locator('section.slide').count();
  for (let i = 0; i < n; i++) await p.locator('section.slide').nth(i).screenshot({ path: path.join(out, `slide_${i + 1}.png`) });
  await b.close(); srv.close();
  console.log(n, 'slides ->', out);
});
