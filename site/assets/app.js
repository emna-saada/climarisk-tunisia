/* ClimaRisk Tunisie — results site.
   Loads data/*.json (scripts/build_site.py), drives the scroll story, the method diagram, the indicator cards and the
   interactive results. Motion: reveals and the map story use 450–900 ms ease-out; the scenario switch, a control used
   repeatedly, uses 250 ms. With prefers-reduced-motion every transition has zero duration and content renders in its
   final state. */
(function () {
  'use strict';
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!REDUCE && 'IntersectionObserver' in window) document.documentElement.classList.add('motion');
  const T = (ms) => (REDUCE ? 0 : ms);
  const C = { Today: '#9b9a96', 'SSP2-4.5': '#1f5f99', 'SSP5-8.5': '#b23a2e', ink: '#17181a', ink3: '#75767b', rule: '#dcd7cd', land: '#ebe6dc' };
  const HEAT = d3.scaleLinear().domain([0, 35, 70, 105, 140]).range(['#f3eee3', '#efd59c', '#e3a35b', '#c75b33', '#87231a']).clamp(true);
  const LOSS = d3.interpolateRgb('#f4ebe6', '#7e1f17');
  const PNAME = { baseline: 'Current climate', ssp245_2030: 'SSP2-4.5, 2030', ssp245_2050: 'SSP2-4.5, 2050', ssp585_2030: 'SSP5-8.5, 2030', ssp585_2050: 'SSP5-8.5, 2050' };
  const f0 = d3.format(',.0f'), f1 = d3.format(',.1f'), f2 = d3.format(',.2f');
  const sgn = (v, f) => (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v));
  const tip = document.getElementById('tip');
  let D, period = 'ssp585_2050';

  /* ---------- page chrome: progress bar, active nav, reveals ---------- */
  const bar = document.getElementById('progress');
  const navLinks = [...document.querySelectorAll('.bar nav a')];
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
      let cur = null;
      navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s && s.getBoundingClientRect().top < innerHeight * 0.35) cur = a; });
      navLinks.forEach((a) => a.classList.toggle('on', a === cur));
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealHooks = new Map(); // element -> callback run once on first reveal
  const revealer = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); const cb = revealHooks.get(e.target); if (cb) { revealHooks.delete(e.target); cb(); } revealer.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }) : null;
  function onReveal(el, cb) { if (!revealer) { cb(); return; } revealHooks.set(el, cb); revealer.observe(el); }
  document.querySelectorAll('[data-reveal]').forEach((el) => (revealer ? revealer.observe(el) : el.classList.add('in')));

  /* ---------- tooltip ---------- */
  function showTip(ev, rows) {
    tip.replaceChildren(...rows.map(([b, t]) => { const d = document.createElement('div'); if (b) { const s = document.createElement('b'); s.textContent = b; d.append(s, t ? ' ' + t : ''); } else d.textContent = t; return d; }));
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.pageX + 14, y = ev.pageY + 14;
    if (x + w > scrollX + document.documentElement.clientWidth - 8) x = ev.pageX - w - 14;
    if (y + h > scrollY + innerHeight - 8) y = ev.pageY - h - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  const hideTip = () => { tip.hidden = true; };

  /* ---------- data ---------- */
  const files = ['scenarios', 'portfolio', 'sectors', 'governorates', 'heatmap', 'sensitivity', 'top_exposures', 'physrisk', 'loans', 'gov_hazards', 'hazard_means', 'tunisia_adm1.geojson'];
  Promise.all(files.map((f) => fetch('data/' + f + '.json').then((r) => { if (!r.ok) throw new Error(f); return r.json(); })))
    .then((res) => { D = {}; files.forEach((f, i) => { D[f.replace('.geojson', '')] = res[i].rows || res[i]; }); init(); })
    .catch((e) => {
      const p = document.createElement('p'); p.className = 'caveat';
      p.textContent = 'The data could not be loaded (' + e.message + '). Open the site through GitHub Pages or a local web server.';
      document.querySelector('.step.intro').appendChild(p);
    });

  const S = (p) => D.scenarios.find((r) => r.period === p);

  function init() {
    fillNumbers();
    story();
    pipeline();
    hazards();
    results();
    robustness();
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { story(true); pipeline(true); hazardMaps(); drawResults(false); drawSens(); }, 180); });
  }

  /* ---------- numbers quoted in the text ---------- */
  function fillNumbers() {
    const b = S('baseline'), s = S('ssp585_2050');
    const top = D.governorates.filter((r) => r.period === 'ssp585_2050').sort((a, c) => c.el_add_bp - a.el_add_bp).slice(0, 3).map((r) => r.governorate);
    const sens = D.sensitivity.filter((r) => r.test.startsWith('β'));
    const v = {
      n_loans: f0(D.portfolio[0].n_loans), hot0: f0(b.hot35_days), hot5: f0(s.hot35_days), pr5: f0(Math.abs(s.prchange_pct)),
      sh0: f1(b.share_high_med), sh5: f1(s.share_high_med), el5: f1(s.el_add_m_med), vt5: f1(s.el_vs_today_m_med),
      topgov: top[0] + ', ' + top[1] + ' and ' + top[2],
      bmin: sgn(d3.min(sens, (r) => r.delta_pct), f0), bmax: sgn(d3.max(sens, (r) => r.delta_pct), f0),
      mlo: sgn(100 * (s.el_add_m_p10 / s.el_add_m_med - 1), f0), mhi: sgn(100 * (s.el_add_m_p90 / s.el_add_m_med - 1), f0),
    };
    document.querySelectorAll('[data-v]').forEach((el) => { if (v[el.dataset.v] != null) el.textContent = v[el.dataset.v]; });
  }

  /* ---------- 1. story map ---------- */
  let map = null, stepNow = -1;
  function story(rebuild) {
    const host = document.getElementById('story-map');
    const W = host.clientWidth, H = host.clientHeight || 600;
    host.replaceChildren();
    const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet');
    const proj = d3.geoMercator().fitExtent([[8, 8], [W - 8, H - 8]], D.tunisia_adm1);
    const path = d3.geoPath(proj);
    const heat0 = new Map(D.gov_hazards.filter((r) => r.period === 'baseline').map((r) => [r.governorate, r.hot35]));
    const heat5 = new Map(D.gov_hazards.filter((r) => r.period === 'ssp585_2050').map((r) => [r.governorate, r.hot35]));
    const loss = new Map(D.governorates.filter((r) => r.period === 'ssp585_2050').map((r) => [r.governorate, r.el_add_bp]));
    const lmax = d3.max([...loss.values()]);
    const govs = svg.append('g').selectAll('path').data(D.tunisia_adm1.features).join('path')
      .attr('d', path).attr('fill', C.land).attr('stroke', '#fff').attr('stroke-width', 0.9);
    const rmax = Math.max(3.2, W / 150);
    const r = d3.scaleSqrt().domain([0, d3.max(D.loans, (d) => d.ead_m)]).range([0.9, rmax]);
    const loans = D.loans.map((d) => { const [x, y] = proj([d.lon, d.lat]); return { ...d, x, y }; }).sort((a, c) => c.ead_m - a.ead_m);
    const latExt = d3.extent(loans, (d) => d.y);
    const dots = svg.append('g').selectAll('circle').data(loans).join('circle')
      .attr('cx', (d) => d.x).attr('cy', (d) => d.y).attr('r', 0).attr('fill', C.ink).attr('fill-opacity', 0.55)
      .attr('stroke', '#fff').attr('stroke-width', 0.3);
    govs.on('pointermove', (ev, f) => {
      const n = f.properties.governorate;
      showTip(ev, [[n, ''], ['Days > 35 °C', f0(heat0.get(n) || 0) + ' → ' + f0(heat5.get(n) || 0)], ['Extra EL 2050', f1(loss.get(n) || 0) + ' bp']]);
    }).on('pointerleave', hideTip);
    map = { svg, govs, dots, r, latExt, heat0, heat5, loss, lmax, W, H };
    if (rebuild && stepNow >= 0) { const s = stepNow; stepNow = -1; setStep(s, true); }
    if (!rebuild) {
      const steps = [...document.querySelectorAll('.step')];
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { steps.forEach((s) => s.classList.toggle('on', s === e.target)); setStep(+e.target.dataset.step); } });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach((s) => io.observe(s));
      setStep(0);
    }
  }

  function legendRamp(scaleFn, domain, ticks, unit) {
    const host = document.getElementById('map-legend'); host.replaceChildren();
    if (!scaleFn) return;
    const w = 180, svg0 = d3.select(host).append('svg').attr('width', w + 48).attr('height', 30), svg = svg0.append('g').attr('transform', 'translate(6,0)');
    const id = 'lg' + Math.random().toString(36).slice(2, 7), gr = svg0.append('defs').append('linearGradient').attr('id', id);
    d3.range(0, 1.001, 0.1).forEach((t) => gr.append('stop').attr('offset', t).attr('stop-color', scaleFn(domain[0] + t * (domain[1] - domain[0]))));
    svg.append('rect').attr('width', w).attr('height', 8).attr('fill', `url(#${id})`);
    const x = d3.scaleLinear().domain(domain).range([0, w]);
    svg.append('g').attr('class', 'axis').attr('transform', 'translate(0,8)').call(d3.axisBottom(x).tickValues(ticks).tickSize(3)).call((g) => g.select('.domain').remove());
    svg.append('text').attr('x', w + 6).attr('y', 8).attr('font-size', 11).attr('fill', C.ink3).text(unit);
  }
  function legendDots(items) {
    const host = document.getElementById('map-legend'); host.replaceChildren();
    const wrap = document.createElement('span'); wrap.style.display = 'inline-flex'; wrap.style.gap = '14px';
    items.forEach(([col, lab]) => { const s = document.createElement('span'); s.style.display = 'inline-flex'; s.style.alignItems = 'center'; s.style.gap = '6px'; const i = document.createElement('i'); i.style.cssText = `width:9px;height:9px;border-radius:50%;background:${col};display:inline-block`; s.append(i, lab); wrap.append(s); });
    host.append(wrap);
  }

  function setStep(n, instant) {
    if (!map || n === stepNow) return;
    const prev = stepNow; stepNow = n;
    const { govs, dots, r, latExt } = map;
    const dur = instant ? 0 : T(800);
    const state = document.getElementById('map-state');
    const ttx = (sel) => sel.transition().duration(dur).ease(d3.easeCubicOut);
    if (n <= 1) {
      state.textContent = n === 0 ? 'Tunisia · 24 governorates' : 'Synthetic loan book · size = exposure';
      ttx(govs).attr('fill', C.land);
      const grow = n === 1 && prev < 1;
      dots.transition().duration(dur).delay((d) => (grow && !instant ? T(900) * (d.y - latExt[0]) / (latExt[1] - latExt[0]) : 0)).ease(d3.easeCubicOut)
        .attr('r', n === 1 ? (d) => r(d.ead_m) : 0).attr('fill', C.ink).attr('fill-opacity', 0.55);
      if (n === 1) legendDots([[C.ink, 'Synthetic loan (2,000)']]); else legendRamp(null);
    } else if (n === 2 || n === 3) {
      const m = n === 2 ? map.heat0 : map.heat5;
      state.textContent = n === 2 ? 'Days above 35 °C · current climate' : 'Days above 35 °C · SSP5-8.5, 2050';
      ttx(govs).attr('fill', (f) => HEAT(m.get(f.properties.governorate) || 0));
      ttx(dots).attr('r', (d) => r(d.ead_m) * 0.6).attr('fill', C.ink).attr('fill-opacity', 0.28);
      legendRamp(HEAT, [0, 140], [0, 35, 70, 105, 140], 'days');
    } else if (n === 4) {
      state.textContent = 'Loans in a high-hazard zone · SSP5-8.5, 2050';
      ttx(govs).attr('fill', C.land);
      dots.transition().duration(dur).delay((d) => (d.hh5 && !instant ? T(300) * Math.random() : 0)).ease(d3.easeCubicOut)
        .attr('r', (d) => r(d.ead_m) * (d.hh5 ? 1.15 : 0.75)).attr('fill', (d) => (d.hh5 ? C['SSP5-8.5'] : C.ink3)).attr('fill-opacity', (d) => (d.hh5 ? 0.9 : 0.25));
      legendDots([[C['SSP5-8.5'], 'High-hazard zone'], [C.ink3, 'Other loans']]);
    } else {
      state.textContent = 'Extra expected loss · bp of exposure · SSP5-8.5, 2050';
      ttx(govs).attr('fill', (f) => LOSS((map.loss.get(f.properties.governorate) || 0) / map.lmax));
      ttx(dots).attr('r', 0);
      legendRamp((v) => LOSS(v / map.lmax), [0, map.lmax], [0, 20, 40, 60].filter((t) => t <= map.lmax), 'bp');
    }
  }

  /* ---------- 2. method diagram ---------- */
  let pipeDone = false;
  function pipeline(rebuild) {
    const host = document.getElementById('pipeline');
    const W = host.clientWidth, narrow = W < 720;
    host.replaceChildren();
    const nodes = [
      { id: 'h', t: 'Hazard', s: 'Heat, drought, flood, fire', c: 0 },
      { id: 'e', t: 'Exposure', s: '2,000 loans, location, EAD', c: 0 },
      { id: 'v', t: 'Vulnerability', s: 'Sector sensitivity weights', c: 0 },
      { id: 's', t: 'Composite score', s: '0–1 per loan and scenario', c: 1 },
      { id: 'p', t: 'PD′ and LGD′', s: 'Elasticity β, flood γ', c: 2 },
      { id: 'l', t: 'Expected loss', s: 'by sector and governorate', c: 3 },
    ];
    let pos, H, bw, bh = 64;
    if (!narrow) {
      H = 260; bw = Math.min(200, (W - 3 * 40) / 4);
      const cx = (c) => c * (bw + (W - 4 * bw) / 3);
      pos = { h: [cx(0), 20], e: [cx(0), 98], v: [cx(0), 176], s: [cx(1), 98], p: [cx(2), 98], l: [cx(3), 98] };
    } else {
      bw = W; bh = 58; H = 6 * (bh + 22);
      pos = Object.fromEntries(nodes.map((n, i) => [n.id, [0, i * (bh + 22)]]));
    }
    const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const edges = narrow ? [['h', 'e'], ['e', 'v'], ['v', 's'], ['s', 'p'], ['p', 'l']] : [['h', 's'], ['e', 's'], ['v', 's'], ['s', 'p'], ['p', 'l']];
    svg.append('defs').append('marker').attr('id', 'arw').attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('fill', C.ink);
    const ePaths = svg.append('g').selectAll('path').data(edges).join('path').attr('fill', 'none').attr('stroke', C.ink).attr('stroke-width', 1.2).attr('marker-end', 'url(#arw)')
      .attr('d', ([a, b]) => {
        const [ax, ay] = pos[a], [bx, by] = pos[b];
        if (narrow) return `M${W / 2},${ay + bh} L${W / 2},${by - 2}`;
        const x1 = ax + bw, y1 = ay + bh / 2, x2 = bx - 3, y2 = by + bh / 2, mx = (x1 + x2) / 2;
        return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      });
    const g = svg.append('g').selectAll('g').data(nodes).join('g').attr('transform', (n) => `translate(${pos[n.id][0]},${pos[n.id][1]})`);
    g.append('rect').attr('width', bw).attr('height', bh).attr('fill', (n) => (n.id === 'l' ? C.ink : '#fff')).attr('stroke', C.ink).attr('stroke-width', 1);
    g.append('text').attr('x', 14).attr('y', 26).attr('font-size', 15).attr('font-weight', 600).attr('fill', (n) => (n.id === 'l' ? '#faf8f4' : C.ink)).text((n) => n.t);
    g.append('text').attr('x', 14).attr('y', 46).attr('font-size', 12).attr('fill', (n) => (n.id === 'l' ? '#d9d4ca' : C.ink3)).text((n) => n.s);
    function play() {
      if (REDUCE || pipeDone) { pipeDone = true; return; }
      g.attr('opacity', 0).transition().delay((n) => [0, 80, 160, 520, 900, 1280][nodes.indexOf(n)]).duration(420).ease(d3.easeCubicOut).attr('opacity', 1);
      ePaths.each(function (d, i) {
        const L = this.getTotalLength(); d3.select(this).attr('stroke-dasharray', L).attr('stroke-dashoffset', L)
          .transition().delay(narrow ? 200 + i * 300 : [260, 300, 340, 720, 1100][i]).duration(narrow ? 260 : 420).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0)
          .on('end', function () { d3.select(this).attr('stroke-dasharray', null); });
      });
      pipeDone = true;
    }
    if (rebuild || pipeDone) return;
    if (!REDUCE) { g.attr('opacity', 0); ePaths.attr('stroke-opacity', 0); }
    onReveal(host.closest('.pipeline'), () => { ePaths.attr('stroke-opacity', 1); play(); });
  }

  /* ---------- 3. indicators ---------- */
  const HZ = {
    hot35: { scale: (v) => HEAT(v), dom: [0, 140] },
    cdd: { scale: d3.scaleLinear().domain([40, 90, 140, 200]).range(['#f3eee3', '#e9c88a', '#c98a3c', '#7a4a17']).clamp(true) },
    flood_share: { scale: d3.scaleLinear().domain([0, 20, 45]).range(['#eef2f6', '#7fa9cf', '#1f4f7f']).clamp(true) },
    fuel: { scale: d3.scaleLinear().domain([0, 20, 45]).range(['#f1efe2', '#a9b97a', '#3d6230']).clamp(true) },
  };
  function hazardMaps() {
    document.querySelectorAll('.hz-map').forEach((host) => {
      const k = host.dataset.hz; host.replaceChildren();
      const W = host.clientWidth, H = host.clientHeight;
      const vals = new Map(D.gov_hazards.filter((r) => r.period === 'ssp585_2050').map((r) => [r.governorate, r[k]]));
      const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
      const proj = d3.geoMercator().fitExtent([[2, 2], [W - 2, H - 2]], D.tunisia_adm1);
      svg.selectAll('path').data(D.tunisia_adm1.features).join('path').attr('d', d3.geoPath(proj))
        .attr('fill', (f) => HZ[k].scale(vals.get(f.properties.governorate) || 0)).attr('stroke', '#fff').attr('stroke-width', 0.6)
        .on('pointermove', (ev, f) => showTip(ev, [[f.properties.governorate, ''], ['2050', f1(vals.get(f.properties.governorate) || 0) + ({ hot35: ' days', cdd: ' days', flood_share: ' % of loans', fuel: ' % burnable' }[k])]]))
        .on('pointerleave', hideTip);
    });
  }
  function hazards() {
    hazardMaps();
    const b = D.hazard_means.find((r) => r.period === 'baseline'), s = D.hazard_means.find((r) => r.period === 'ssp585_2050');
    document.querySelectorAll('.hz-bars').forEach((host) => {
      const k = host.dataset.bars, unit = host.dataset.unit, score = host.dataset.score;
      const v0 = b[k], v5 = s[k], max = Math.max(v0, v5) * 1.15 || 1;
      const fmt = (v) => (score ? f2(v) : f0(v)) + unit;
      const rows = [['Today', v0, C.Today], ['2050', v5, C['SSP5-8.5']]].map(([lab, v, col]) => {
        const row = document.createElement('div'); row.className = 'row';
        const l = document.createElement('span'); l.textContent = lab === '2050' ? 'SSP5-8.5 2050' : 'Current';
        const tr = document.createElement('span'); tr.className = 'track';
        const fi = document.createElement('span'); fi.className = 'fill'; fi.style.background = col; fi.dataset.w = (100 * v / max).toFixed(1);
        tr.append(fi);
        const val = document.createElement('span'); val.className = 'val'; val.textContent = fmt(v);
        row.append(l, tr, val); return row;
      });
      host.replaceChildren(...rows);
      const grow = () => host.querySelectorAll('.fill').forEach((fi, i) => {
        if (REDUCE) { fi.style.width = fi.dataset.w + '%'; return; }
        fi.style.transition = `width 700ms cubic-bezier(.2,.7,.2,1) ${150 + i * 120}ms`;
        requestAnimationFrame(() => { fi.style.width = fi.dataset.w + '%'; });
      });
      onReveal(host.closest('.hz'), grow);
    });
  }

  /* ---------- 4. results ---------- */
  function results() {
    const btns = [...document.querySelectorAll('.switch button')];
    btns.forEach((b) => {
      b.addEventListener('click', () => { period = b.dataset.p; btns.forEach((o) => o.setAttribute('aria-checked', String(o === b))); drawResults(true); });
      b.addEventListener('keydown', (e) => {
        const i = btns.indexOf(b), j = e.key === 'ArrowRight' ? (i + 1) % btns.length : e.key === 'ArrowLeft' ? (i - 1 + btns.length) % btns.length : -1;
        if (j >= 0) { e.preventDefault(); btns[j].focus(); btns[j].click(); }
      });
    });
    drawResults(false);
    const kp = document.querySelector('.kpis');
    if (!REDUCE) { kp.dataset.wait = '1'; onReveal(kp, () => { delete kp.dataset.wait; counters(900); }); } else counters(0);
  }

  let kprev = null;
  function counters(ms) {
    const s = S(period), b = S('baseline');
    const target = { 'k-share': s.share_high_med, 'k-el': s.el_add_m_med, 'k-vt': s.el_vs_today_m_med, 'k-hot': s.hot35_days };
    const fmt = { 'k-share': f1, 'k-el': f1, 'k-vt': (v) => (period === 'baseline' ? '0.0' : sgn(v, f1)), 'k-hot': f0 };
    Object.entries(target).forEach(([id, v]) => {
      const el = document.getElementById(id); const from = kprev ? kprev[id] : 0;
      if (!ms) { el.textContent = fmt[id](v); return; }
      d3.select(el).transition().duration(ms).ease(d3.easeCubicOut).tween('text', () => { const i = d3.interpolateNumber(from, v); return (t) => { el.textContent = fmt[id](i(t)); }; });
    });
    kprev = target;
    document.getElementById('k-share-s').textContent = period === 'baseline' ? 'Reference point' : 'Model range ' + f1(s.share_high_p10) + '–' + f1(s.share_high_p90) + ' %';
    document.getElementById('k-el-s').textContent = f1(s.el_add_bp_med) + ' bp of exposure · range ' + f1(s.el_add_m_p10) + '–' + f1(s.el_add_m_p90);
    document.getElementById('k-vt-s').textContent = period === 'baseline' ? 'Reference point' : 'Model range ' + sgn(s.el_vs_today_m_p10, f1) + ' to ' + sgn(s.el_vs_today_m_p90, f1);
    document.getElementById('k-hot-s').textContent = period === 'baseline' ? 'Average at loan locations' : sgn(s.hot35_days - b.hot35_days, f0) + ' days vs current climate';
  }

  function drawResults(animate) {
    document.querySelectorAll('.pn').forEach((el) => { el.textContent = PNAME[period]; });
    if (!document.querySelector('.kpis').dataset.wait) counters(animate ? T(250) : 0);
    cEL(animate); cShare(animate); cHeat(animate); cSec(animate); cMap(animate); tGov();
  }
  const shortLab = (r) => (r.period === 'baseline' ? ['Current'] : [r.scenario, r.horizon]);

  function cEL(animate) {
    const el = document.getElementById('c-el'); const rows = D.scenarios;
    const W = el.clientWidth, H = 280, m = { t: 24, r: 4, b: 46, l: 34 };
    let svg = d3.select(el).select('svg');
    const x = d3.scaleBand().domain(rows.map((r) => r.period)).range([m.l, W - m.r]).padding(0.36);
    const y = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.el_add_m_p90) * 1.12]).nice().range([H - m.b, m.t]);
    if (svg.empty() || +svg.attr('width') !== W) {
      el.replaceChildren(); svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
      svg.append('g').attr('class', 'grid').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r)).tickFormat(''));
      svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5)).call((g) => g.select('.domain').remove());
      const xa = svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickSize(0).tickFormat(''));
      xa.selectAll('.tick').each(function (p) { const t = d3.select(this).append('text').attr('fill', C.ink3).attr('font-size', 11.5).attr('text-anchor', 'middle').attr('y', 14); shortLab(S(p)).forEach((s, i) => t.append('tspan').attr('x', 0).attr('dy', i ? '1.2em' : 0).text(s)); });
      const g = svg.selectAll('.b').data(rows, (r) => r.period).join('g').attr('class', 'b');
      g.append('rect').attr('x', (r) => x(r.period)).attr('width', x.bandwidth()).attr('y', y(0)).attr('height', 0).attr('fill', (r) => C[r.scenario]);
      g.append('line').attr('class', 'wk').attr('x1', (r) => x(r.period) + x.bandwidth() / 2).attr('x2', (r) => x(r.period) + x.bandwidth() / 2).attr('y1', (r) => y(r.el_add_m_p10)).attr('y2', (r) => y(r.el_add_m_p90)).attr('stroke', C.ink);
      g.append('text').attr('class', 'vlab').attr('x', (r) => x(r.period) + x.bandwidth() / 2).attr('y', (r) => y(r.el_add_m_p90) - 6).attr('text-anchor', 'middle').text((r) => f1(r.el_add_m_med));
      g.append('rect').attr('x', (r) => x(r.period) - 6).attr('width', x.bandwidth() + 12).attr('y', m.t).attr('height', H - m.t - m.b).attr('fill', 'transparent')
        .on('pointermove', (ev, r) => showTip(ev, [[PNAME[r.period], ''], ['Median', f2(r.el_add_m_med) + ' M TND'], ['Model range', f2(r.el_add_m_p10) + '–' + f2(r.el_add_m_p90)], ['Per exposure', f1(r.el_add_bp_med) + ' bp']]))
        .on('pointerleave', hideTip);
      const grow = () => svg.selectAll('.b rect:first-child').transition().duration(T(700)).delay((r, i) => T(i * 70)).ease(d3.easeCubicOut).attr('y', (r) => y(r.el_add_m_med)).attr('height', (r) => y(0) - y(r.el_add_m_med));
      if (REDUCE || el.closest('.card').classList.contains('in')) grow(); else onReveal(el.closest('.card'), grow);
    }
    svg.selectAll('.b').transition().duration(animate ? T(250) : 0).attr('opacity', (r) => (r.period === period ? 1 : 0.42));
    svg.selectAll('.b .vlab').attr('font-weight', (r) => (r.period === period ? 700 : 400));
  }

  function cShare(animate) {
    const el = document.getElementById('c-share'); const rows = D.scenarios;
    const W = el.clientWidth, H = 280, m = { t: 8, r: 54, b: 30, l: 110 };
    let svg = d3.select(el).select('svg');
    const y = d3.scaleBand().domain(rows.map((r) => r.period)).range([m.t, H - m.b]).padding(0.45);
    const x = d3.scaleLinear().domain([0, 50]).range([m.l, W - m.r]);
    if (svg.empty() || +svg.attr('width') !== W) {
      el.replaceChildren(); svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
      svg.append('g').attr('class', 'grid').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickSize(-(H - m.t - m.b)).tickFormat(''));
      svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat((d) => d + ' %')).call((g) => g.select('.domain').remove());
      svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickSize(0).tickPadding(10).tickFormat((p) => PNAME[p])).call((g) => g.select('.domain').remove());
      const g = svg.selectAll('.d').data(rows, (r) => r.period).join('g').attr('class', 'd');
      g.append('line').attr('x1', (r) => x(r.share_high_p10)).attr('x2', (r) => x(r.share_high_p10)).attr('y1', (r) => y(r.period) + y.bandwidth() / 2).attr('y2', (r) => y(r.period) + y.bandwidth() / 2).attr('stroke', (r) => C[r.scenario]).attr('stroke-width', 2.5);
      g.append('circle').attr('cx', (r) => x(0)).attr('cy', (r) => y(r.period) + y.bandwidth() / 2).attr('r', 5.5).attr('fill', (r) => C[r.scenario]).attr('stroke', '#fff').attr('stroke-width', 1.5);
      g.append('text').attr('class', 'vlab').attr('x', (r) => x(Math.max(r.share_high_p90, r.share_high_med)) + 8).attr('y', (r) => y(r.period) + y.bandwidth() / 2).attr('dy', '0.35em').text((r) => f1(r.share_high_med) + ' %');
      g.append('rect').attr('x', m.l).attr('width', W - m.l - m.r).attr('y', (r) => y(r.period) - 6).attr('height', y.bandwidth() + 12).attr('fill', 'transparent')
        .on('pointermove', (ev, r) => showTip(ev, [[PNAME[r.period], ''], ['Median', f1(r.share_high_med) + ' %'], ['Model range', f1(r.share_high_p10) + '–' + f1(r.share_high_p90) + ' %']])).on('pointerleave', hideTip);
      const grow = () => {
        svg.selectAll('.d line').transition().duration(T(700)).delay((r, i) => T(i * 70)).ease(d3.easeCubicOut).attr('x2', (r) => x(r.share_high_p90));
        svg.selectAll('.d circle').transition().duration(T(700)).delay((r, i) => T(i * 70)).ease(d3.easeCubicOut).attr('cx', (r) => x(r.share_high_med));
      };
      if (REDUCE || el.closest('.card').classList.contains('in')) grow(); else onReveal(el.closest('.card'), grow);
    }
    svg.selectAll('.d').transition().duration(animate ? T(250) : 0).attr('opacity', (r) => (r.period === period ? 1 : 0.42));
    svg.selectAll('.d .vlab').attr('font-weight', (r) => (r.period === period ? 700 : 400));
  }

  function cHeat(animate) {
    const el = document.getElementById('c-heat');
    const hz = ['heat', 'drought', 'flood', 'fire'], hl = { heat: 'Heat', drought: 'Drought', flood: 'Flood', fire: 'Wildfire' };
    const sub = D.heatmap.filter((r) => r.period === period);
    const base = D.heatmap.filter((r) => r.period === 'ssp585_2050');
    const sectors = Array.from(new Set(base.map((r) => r.sector))).sort((a, c) => d3.sum(base.filter((r) => r.sector === c), (r) => r.score) - d3.sum(base.filter((r) => r.sector === a), (r) => r.score));
    const W = el.clientWidth, lab = Math.min(170, W * 0.38), rh = 28, H = 24 + rh * sectors.length, cw = (W - lab) / hz.length;
    const ramp = d3.interpolateRgb('#f4ebe6', '#7e1f17');
    let svg = d3.select(el).select('svg');
    if (svg.empty() || +svg.attr('width') !== W) {
      el.replaceChildren(); svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
      hz.forEach((h, j) => svg.append('text').attr('class', 'rlab').attr('x', lab + j * cw + cw / 2).attr('y', 14).attr('text-anchor', 'middle').attr('font-weight', 600).text(hl[h]));
      sectors.forEach((s, i) => svg.append('text').attr('class', 'rlab').attr('x', lab - 10).attr('y', 22 + i * rh + rh / 2).attr('dy', '0.35em').attr('text-anchor', 'end').text(s));
      const cells = [];
      sectors.forEach((s, i) => hz.forEach((h, j) => cells.push({ s, h, i, j })));
      const g = svg.selectAll('.c').data(cells, (d) => d.s + d.h).join('g').attr('class', 'c').attr('transform', (d) => `translate(${lab + d.j * cw},${22 + d.i * rh})`);
      g.append('rect').attr('width', cw - 2).attr('height', rh - 2).attr('fill', '#f4ebe6');
      g.append('text').attr('x', (cw - 2) / 2).attr('y', (rh - 2) / 2).attr('dy', '0.35em').attr('text-anchor', 'middle').attr('font-size', 11.5).attr('pointer-events', 'none');
      g.on('pointermove', (ev, d) => { const r = sub.find((q) => q.sector === d.s && q.hazard === d.h); showTip(ev, [[d.s, ''], [hl[d.h], f2(r ? r.score : 0)]]); }).on('pointerleave', hideTip);
    }
    const val = (d) => { const r = D.heatmap.find((q) => q.period === period && q.sector === d.s && q.hazard === d.h); return r ? r.score : 0; };
    const lum = (c) => { const k = d3.rgb(c); return (0.2126 * k.r + 0.7152 * k.g + 0.0722 * k.b) / 255; };
    svg.selectAll('.c rect').transition().duration(animate ? T(250) : 0).attr('fill', (d) => ramp(Math.min(1, val(d) / 0.8)));
    svg.selectAll('.c text').text((d) => d3.format('.2f')(val(d))).attr('fill', (d) => (lum(ramp(Math.min(1, val(d) / 0.8))) > 0.55 ? C.ink : '#fff'));
  }

  function cSec(animate) {
    const el = document.getElementById('c-sec');
    const sub = D.sectors.filter((r) => r.period === period);
    const order = D.sectors.filter((r) => r.period === 'ssp585_2050').sort((a, c) => c.el_add_bp - a.el_add_bp).map((r) => r.sector);
    const W = el.clientWidth, rh = 27, m = { t: 2, r: 46, b: 26, l: Math.min(170, W * 0.38) }, H = m.t + rh * order.length + m.b;
    const x = d3.scaleLinear().domain([0, d3.max(D.sectors, (r) => r.el_add_bp)]).nice().range([m.l, W - m.r]);
    let svg = d3.select(el).select('svg');
    if (svg.empty() || +svg.attr('width') !== W) {
      el.replaceChildren(); svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
      svg.append('g').attr('class', 'grid').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(4).tickSize(-(H - m.t - m.b)).tickFormat(''));
      svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(4)).call((g) => g.select('.domain').remove());
      const g = svg.selectAll('.r').data(order, (s) => s).join('g').attr('class', 'r').attr('transform', (s, i) => `translate(0,${m.t + i * rh})`);
      g.append('text').attr('class', 'rlab').attr('x', m.l - 10).attr('y', rh / 2).attr('dy', '0.35em').attr('text-anchor', 'end').text((s) => s);
      g.append('rect').attr('x', m.l).attr('y', 6).attr('height', rh - 12).attr('width', 0);
      g.append('text').attr('class', 'vlab').attr('y', rh / 2).attr('dy', '0.35em');
      g.append('rect').attr('class', 'hit').attr('width', W).attr('height', rh).attr('fill', 'transparent')
        .on('pointermove', (ev, s) => { const r = sub.find((q) => q.sector === s) || D.sectors.find((q) => q.period === period && q.sector === s); showTip(ev, [[s, ''], ['Extra EL', f1(r.el_add_bp) + ' bp · ' + f2(r.el_add_m) + ' M TND'], ['High-hazard share', f1(r.share_high) + ' %']]); })
        .on('pointerleave', hideTip);
    }
    const get = (s) => D.sectors.find((q) => q.period === period && q.sector === s).el_add_bp;
    const col = C[S(period).scenario];
    const run = (d) => {
      svg.selectAll('.r rect:not(.hit)').transition().duration(d).ease(d3.easeCubicOut).attr('fill', col).attr('width', (s) => Math.max(1, x(get(s)) - m.l));
      svg.selectAll('.r .vlab').transition().duration(d).ease(d3.easeCubicOut).attr('x', (s) => x(get(s)) + 6).tween('text', function (s) { const me = this, i = d3.interpolateNumber(+me.dataset.v || 0, get(s)); me.dataset.v = get(s); return (t) => { me.textContent = f1(i(t)); }; });
    };
    if (!svg.attr('data-shown')) { svg.attr('data-shown', 1); const go = () => run(T(700)); if (REDUCE || el.closest('.card').classList.contains('in')) go(); else onReveal(el.closest('.card'), go); }
    else run(animate ? T(250) : 0);
  }

  function cMap(animate) {
    const el = document.getElementById('c-map');
    const rows = D.governorates.filter((r) => r.period === period), by = new Map(rows.map((r) => [r.governorate, r]));
    const max = d3.max(D.governorates, (r) => r.el_add_bp);
    const W = el.clientWidth, H = Math.min(520, Math.max(380, W * 1.1));
    let svg = d3.select(el).select('svg');
    if (svg.empty() || +svg.attr('width') !== W) {
      el.replaceChildren(); svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
      const proj = d3.geoMercator().fitExtent([[4, 4], [W - 4, H - 44]], D.tunisia_adm1);
      svg.append('g').attr('class', 'gv').selectAll('path').data(D.tunisia_adm1.features).join('path').attr('d', d3.geoPath(proj)).attr('fill', LOSS(0)).attr('stroke', '#fff').attr('stroke-width', 0.8)
        .on('pointermove', function (ev, f) { d3.select(this).attr('stroke', C.ink).raise(); const r = D.governorates.find((q) => q.period === period && q.governorate === f.properties.governorate); showTip(ev, [[f.properties.governorate, ''], ['Extra EL', r ? f1(r.el_add_bp) + ' bp' : 'n/a'], ['Model range', r ? f1(r.el_add_bp_p10) + '–' + f1(r.el_add_bp_p90) + ' bp' : ''], ['High-hazard share', r ? f1(r.share_high) + ' %' : '']]); })
        .on('pointerleave', function () { d3.select(this).attr('stroke', '#fff'); hideTip(); });
      const lw = Math.min(200, W - 40), lg = svg.append('g').attr('transform', `translate(6,${H - 32})`);
      const id = 'gm' + Math.random().toString(36).slice(2, 7), gr = svg.append('defs').append('linearGradient').attr('id', id);
      d3.range(0, 1.001, 0.25).forEach((t) => gr.append('stop').attr('offset', t).attr('stop-color', LOSS(t)));
      lg.append('rect').attr('width', lw).attr('height', 8).attr('fill', `url(#${id})`);
      lg.append('g').attr('class', 'axis').attr('transform', 'translate(0,8)').call(d3.axisBottom(d3.scaleLinear().domain([0, max]).range([0, lw])).ticks(4).tickSize(3)).call((g) => g.select('.domain').remove());
      lg.append('text').attr('x', lw + 6).attr('y', 8).attr('font-size', 11).attr('fill', C.ink3).text('bp');
    }
    svg.selectAll('.gv path').transition().duration(animate ? T(250) : T(600)).attr('fill', (f) => { const r = by.get(f.properties.governorate); return r ? LOSS(r.el_add_bp / max) : '#eee'; });
  }

  function tGov() {
    const rows = D.governorates.filter((r) => r.period === period).sort((a, c) => c.el_add_bp - a.el_add_bp).slice(0, 12);
    document.querySelector('#t-gov tbody').replaceChildren(...rows.map((r) => {
      const tr = document.createElement('tr');
      [[r.governorate, ''], [f1(r.el_add_bp), 'num'], [f1(r.el_add_bp_p10) + '–' + f1(r.el_add_bp_p90), 'num dim'], [f1(r.share_high) + ' %', 'num']].forEach(([c, k]) => { const td = document.createElement('td'); td.textContent = c; td.className = k; tr.appendChild(td); });
      return tr;
    }));
  }

  /* ---------- 5. robustness ---------- */
  function drawSens() {
    const el = document.getElementById('c-sens'); el.replaceChildren();
    const rows = D.sensitivity.filter((r) => r.test !== 'β × 1.0');
    const W = el.clientWidth, rh = 25, m = { t: 2, r: 52, b: 26, l: Math.min(150, W * 0.36) }, H = m.t + rh * rows.length + m.b;
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const x = d3.scaleLinear().domain([-115, 120]).range([m.l, W - m.r]);
    svg.append('g').attr('class', 'grid').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([-50, 0, 50, 100]).tickSize(-(H - m.t - m.b)).tickFormat(''));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([-50, 0, 50, 100]).tickFormat((d) => (d > 0 ? '+' : '') + d + ' %')).call((g) => g.select('.domain').remove());
    svg.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', m.t).attr('y2', H - m.b).attr('stroke', C.ink);
    const g = svg.selectAll('.s').data(rows).join('g').attr('transform', (r, i) => `translate(0,${m.t + i * rh})`);
    g.append('text').attr('class', 'rlab').attr('x', m.l - 10).attr('y', rh / 2).attr('dy', '0.35em').attr('text-anchor', 'end').text((r) => r.test);
    const bars = g.append('rect').attr('x', x(0)).attr('y', 6).attr('height', rh - 12).attr('width', 0).attr('fill', (r) => (r.delta_pct >= 0 ? C['SSP5-8.5'] : C['SSP2-4.5']));
    g.append('text').attr('class', 'vlab dim').attr('x', (r) => (r.delta_pct >= 0 ? x(r.delta_pct) + 5 : x(r.delta_pct) - 5)).attr('y', rh / 2).attr('dy', '0.35em').attr('text-anchor', (r) => (r.delta_pct >= 0 ? 'start' : 'end')).text((r) => sgn(r.delta_pct, f1) + ' %');
    const go = (d) => bars.transition().duration(d).delay((r, i) => (d ? i * 40 : 0)).ease(d3.easeCubicOut).attr('x', (r) => x(Math.min(0, r.delta_pct))).attr('width', (r) => Math.max(1.5, Math.abs(x(r.delta_pct) - x(0))));
    if (REDUCE || el.closest('.card').classList.contains('in')) go(0); else onReveal(el.closest('.card'), () => go(T(650)));
  }

  let sortKey = 'el_add_k', sortDir = -1;
  function tTop() {
    const rows = D.top_exposures.slice().sort((a, b) => (a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0) * sortDir);
    document.querySelector('#t-top tbody').replaceChildren(...rows.map((r) => {
      const tr = document.createElement('tr');
      [[r.loan, ''], [r.sector, ''], [r.governorate, ''], [f2(r.ead_m), 'num'], [f2(r.score), 'num'], [f1(r.el_add_k), 'num']].forEach(([c, k]) => { const td = document.createElement('td'); td.textContent = c; td.className = k; tr.appendChild(td); });
      return tr;
    }));
    document.querySelectorAll('#t-top th').forEach((th) => th.setAttribute('aria-sort', th.dataset.key === sortKey ? (sortDir > 0 ? 'ascending' : 'descending') : 'none'));
  }
  function robustness() {
    drawSens();
    document.querySelector('#t-pr tbody').replaceChildren(...D.physrisk.map((r) => {
      const tr = document.createElement('tr');
      [[r.indicator.replace(' — ', ', '), ''], [sgn(r.value, f2), 'num']].forEach(([c, k]) => { const td = document.createElement('td'); td.textContent = c; td.className = k; tr.appendChild(td); });
      return tr;
    }));
    document.querySelectorAll('#t-top th').forEach((th) => {
      th.tabIndex = 0;
      const go = () => { const k = th.dataset.key; if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = typeof D.top_exposures[0][k] === 'number' ? -1 : 1; } tTop(); };
      th.addEventListener('click', go);
      th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    tTop();
  }
})();
