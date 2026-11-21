// Records a walkthrough of the results website (serve site/ on :8765 first: python -m http.server 8765 -d site).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'capture');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  const glide = async (to, ms) => {            // smooth scroll in small steps so the story transitions play
    const from = await p.evaluate(() => scrollY), n = Math.max(1, Math.round(ms / 16));
    for (let i = 1; i <= n; i++) { const t = i / n, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; await p.evaluate((y) => scrollTo(0, y), from + (to - from) * e); await p.waitForTimeout(16); }
  };
  const stepTop = async (i) => p.evaluate((i) => { const s = document.querySelectorAll('.step')[i]; return s.getBoundingClientRect().top + scrollY - innerHeight * 0.3; }, i);
  for (let i = 1; i <= 5; i++) { await glide(await stepTop(i), 900); await p.waitForTimeout(1500); }
  const secTop = async (id) => p.evaluate((id) => document.getElementById(id).getBoundingClientRect().top + scrollY - 70, id);
  await glide(await secTop('method'), 1200); await p.waitForTimeout(2300);
  await glide(await secTop('results'), 1400); await p.waitForTimeout(1800);
  for (const k of ['baseline', 'ssp245_2050', 'ssp585_2050']) { await p.click(`.switch button[data-p="${k}"]`); await p.waitForTimeout(1300); }
  await glide((await secTop('results')) + 760, 900); await p.waitForTimeout(1500);
  const v = p.video(); await ctx.close(); await b.close();
  fs.renameSync(await v.path(), path.join(OUT, 'site.webm'));
})();
