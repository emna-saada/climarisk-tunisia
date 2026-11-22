"""Build the LinkedIn carousel (1080x1350 slides) from pipeline outputs.

Every figure on the slides is read from outputs/kpis.json. Images are the project's own maps,
charts, dashboard capture and video frame. Output: docs/linkedin/slides.html (rendered to PNG/PDF
by scripts/render_linkedin.js with Playwright).
"""
from __future__ import annotations

import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/linkedin"


def img(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def fr(x: float, d: int = 1) -> str:
    return f"{x:,.{d}f}"


def main(extra: dict[str, Path]) -> Path:
    k = json.loads((ROOT / "outputs/kpis.json").read_text(encoding="utf-8"))
    P, H = k["periods"], k["hazard_means"]
    s0 = 100 * P["baseline"]["share_ead_high"]["med"]
    s5 = 100 * P["ssp585_2050"]["share_ead_high"]["med"]
    s5lo, s5hi = (100 * P["ssp585_2050"]["share_ead_high"][q] for q in ("p10", "p90"))
    vt = P["ssp585_2050"]["el_add_vs_today_tnd"]["med"] / 1e6
    el5 = P["ssp585_2050"]["el_add_tnd"]["med"] / 1e6
    bp5 = P["ssp585_2050"]["el_add_bp"]["med"]
    hot0, hot5, pr5 = H["baseline"]["hot35_days"], H["ssp585_2050"]["hot35_days"], H["ssp585_2050"]["prchange_pct"]
    sec = sorted(k["by_sector"]["ssp585_2050"].items(), key=lambda kv: -kv[1]["el_add_bp_med"])
    labels = {"cereals": "Cereals", "olives": "Olives", "construction": "Construction", "citrus": "Citrus",
              "chemicals": "Chemicals and phosphates", "textile": "Textile", "tourism": "Coastal tourism",
              "agrifood": "Agrifood", "energy": "Energy", "residential": "Housing"}
    maps = figs = ROOT / "outputs/paper/en"
    n = k["meta"]["n_loans"]
    ngov = k["meta"]["n_governorates"]
    sec_rows = "".join(
        f'<div class="srow"><span>{labels[s]}</span><i style="width:{min(100, v["el_add_bp_med"] / sec[0][1]["el_add_bp_med"] * 100):.0f}%"></i>'
        f'<b>{fr(v["el_add_bp_med"], 0)} bp</b></div>' for s, v in sec[:6])

    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
:root {{ --ink:#0F2A33; --petrol:#0E5E6F; --sand:#F6F4EF; --muted:#5B6B70; --line:#E3E0D8; --accent:#12808F;
        --s245:#008C9E; --s585:#C2343F; --mist:#D5E6EA; }}
* {{ box-sizing:border-box; margin:0; padding:0; }}
body {{ background:#888; font-family:Inter, "Inter Display", sans-serif; }}
.slide {{ width:1080px; height:1350px; position:relative; overflow:hidden; background:var(--sand); color:var(--ink);
         padding:84px 80px 96px; display:flex; flex-direction:column; gap:36px; margin-bottom:20px; }}
.dark {{ --accent:#2FD1C0; background:radial-gradient(120% 90% at 85% 5%, #0F4A50 0%, #0B1C21 55%, #071417 100%); color:#fff; }}
.kick {{ font-size:22px; letter-spacing:.14em; text-transform:uppercase; font-weight:600; color:var(--accent); }}
h1 {{ font-family:"Inter Display", Inter, sans-serif; font-weight:800; font-size:92px; line-height:1.0; letter-spacing:-2px; }}
h2 {{ font-family:"Inter Display", Inter, sans-serif; font-weight:800; font-size:64px; line-height:1.05; letter-spacing:-1.2px; }}
.lead {{ font-size:34px; line-height:1.38; color:var(--muted); max-width:900px; }}
.dark .lead {{ color:var(--mist); }}
.foot {{ position:absolute; left:80px; right:80px; bottom:44px; display:flex; justify-content:space-between;
        font-size:20px; color:var(--muted); border-top:1px solid var(--line); padding-top:18px; }}
.dark .foot {{ color:#9FB8BE; border-color:rgba(255,255,255,.18); }}
.pager {{ font-variant-numeric:tabular-nums; }}
.card {{ background:#fff; border:1px solid var(--line); border-radius:24px; padding:36px 40px; }}
.figure {{ background:#fff; border:1px solid var(--line); border-radius:24px; padding:24px; display:flex; justify-content:center; align-items:center; }}
.figure img {{ max-width:100%; max-height:100%; display:block; }}
.num {{ font-family:"Inter Display", Inter; font-weight:800; font-variant-numeric:tabular-nums; letter-spacing:-2px; }}
.chip {{ display:inline-block; padding:8px 18px; border-radius:999px; font-size:22px; font-weight:600; border:1.5px solid currentColor; }}
.flow {{ display:grid; grid-template-columns:1fr; gap:22px; }}
.step {{ display:grid; grid-template-columns:96px 1fr; gap:28px; align-items:center; background:#fff; border:1px solid var(--line); border-radius:22px; padding:28px 32px; }}
.step b {{ font-size:36px; display:block; margin-bottom:6px; }}
.step p {{ font-size:25px; line-height:1.4; color:var(--muted); }}
.dot {{ width:96px; height:96px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:800; color:#fff; }}
.srow {{ display:grid; grid-template-columns:330px 1fr 120px; gap:20px; align-items:center; font-size:28px; padding:14px 0; border-bottom:1px solid var(--line); }}
.srow i {{ display:block; height:16px; border-radius:8px; background:var(--s585); }}
.srow b {{ text-align:right; font-variant-numeric:tabular-nums; }}
.warn {{ background:#FFF4E2; border:1.5px solid #F2C27A; color:#6B4A12; border-radius:18px; padding:20px 26px; font-size:24px; line-height:1.4; }}
ul.lim {{ list-style:none; display:grid; gap:30px; margin-top:12px; }}
ul.lim li {{ font-size:33px; line-height:1.38; padding-left:34px; position:relative; }}
ul.lim li:before {{ content:""; position:absolute; left:0; top:15px; width:14px; height:14px; border-radius:3px; background:var(--accent); }}
</style></head><body>

<section class="slide dark" id="s1">
  <div class="kick">Geoinformatics × credit risk</div>
  <h1>When the climate shifts, credit risk shifts with it.</h1>
  <p class="lead">ClimaRisk Tunisia links every loan in a portfolio to its exposure to heat, drought, floods and wildfire, today, in 2030 and in 2050.</p>
  <div class="figure" style="flex:1;min-height:0;padding:18px"><img src="{img(maps / 'fig_portfolio.png')}"></div>
  <div class="foot"><span>ClimaRisk Tunisia · 100 % synthetic portfolio</span><span class="pager">1 / 7</span></div>
</section>

<section class="slide" id="s2">
  <div class="kick">The method</div>
  <h2>From satellite pixels to expected loss, in four steps</h2>
  <div class="flow">
    <div class="step"><div class="dot" style="background:var(--petrol)">1</div><div><b>Portfolio</b><p>{n:,} synthetic loans placed across {ngov} governorates using population (WorldPop) and cropland (ESA WorldCover).</p></div></div>
    <div class="step"><div class="dot" style="background:#D1495B">2</div><div><b>Hazard</b><p>Days above 35 °C and drought (5 CMIP6 models, NASA), 100-year flood depth (WRI Aqueduct), burnable vegetation.</p></div></div>
    <div class="step"><div class="dot" style="background:#C98500">3</div><div><b>Vulnerability</b><p>Each sector weights the hazards: rain-fed cereals fear drought, coastal hotels fear flooding.</p></div></div>
    <div class="step"><div class="dot" style="background:var(--s585)">4</div><div><b>Credit</b><p>PD′ = PD × (1 + β·score), LGD adjusted for flood depth, EL = PD′ × LGD′ × EAD, aggregated by sector and governorate.</p></div></div>
  </div>
  <div class="foot"><span>Open data · MIT licence</span><span class="pager">2 / 7</span></div>
</section>

<section class="slide dark" id="s3">
  <div class="kick">The key result · SSP5-8.5 · 2050</div>
  <h2>The share of the book in high-hazard zones grows {fr(s5 / s0, 0)}-fold</h2>
  <div style="display:flex;align-items:baseline;gap:28px;white-space:nowrap">
    <span class="num" style="font-size:104px;color:#9FB8BE">{fr(s0)}&nbsp;%</span>
    <span style="font-size:72px;color:var(--accent)">→</span>
    <span class="num" style="font-size:168px;color:var(--accent)">{fr(s5)}&nbsp;%</span>
  </div>
  <p class="lead">Today → 2050. Range across climate models: {fr(s5lo)} to {fr(s5hi)} %.</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
    <div class="card" style="background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.16);color:#fff"><div style="font-size:22px;color:#9FB8BE;letter-spacing:.06em;text-transform:uppercase;font-weight:600">Extra expected loss vs today</div><div class="num" style="font-size:58px;margin-top:10px;white-space:nowrap">+TND&nbsp;{fr(vt)}&nbsp;M</div></div>
    <div class="card" style="background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.16);color:#fff"><div style="font-size:22px;color:#9FB8BE;letter-spacing:.06em;text-transform:uppercase;font-weight:600">Total climate-adjusted EL</div><div class="num" style="font-size:58px;margin-top:10px;white-space:nowrap">TND&nbsp;{fr(el5)}&nbsp;M</div><div style="font-size:22px;color:#9FB8BE;margin-top:6px">{fr(bp5, 0)} bp of exposure</div></div>
  </div>
  <div class="warn" style="margin-top:auto;margin-bottom:24px;background:rgba(47,209,192,.10);border-color:rgba(47,209,192,.5);color:#BFF3EC">100 % synthetic portfolio: illustrative figures, to be calibrated on real bank data.</div>
  <div class="foot"><span>Median of 5 CMIP6 models</span><span class="pager">3 / 7</span></div>
</section>

<section class="slide" id="s4">
  <div class="kick">The physical driver</div>
  <h2>From {fr(hot0, 0)} to {fr(hot5, 0)} days a year above 35 °C</h2>
  <p class="lead">At the loan locations, SSP5-8.5, 2050. Annual rainfall falls by {fr(abs(pr5), 0)} % in the median.</p>
  <div class="figure" style="flex:1;min-height:0"><img src="{img(maps / 'fig_heat.png')}"></div>
  <div class="foot"><span>NASA NEX-GDDP-CMIP6 · 0,25°</span><span class="pager">4 / 7</span></div>
</section>

<section class="slide" id="s5">
  <div class="kick">Who is affected</div>
  <h2>Rain-fed agriculture takes the hit</h2>
  <p class="lead">Extra expected loss in basis points of each sector's exposure, SSP5-8.5, 2050.</p>
  <div class="card" style="padding:16px 36px">{sec_rows}</div>
  <div class="figure" style="flex:1;min-height:0;padding:14px"><img src="{img(figs / 'fig_heatmap.png')}"></div>
  <div class="foot"><span>Average hazard score weighted by exposure</span><span class="pager">5 / 7</span></div>
</section>

<section class="slide" id="s6">
  <div class="kick">The work</div>
  <h2>A website you can play through</h2>
  <p class="lead">Nine levels: travel to 2050 on the map, run the numbers on one loan, read the results, stress-test the assumptions and check the rulebook.</p>
  <div class="figure" style="flex:1.1;min-height:0;padding:0;overflow:hidden;background:#071417;border-color:#1F3A43"><img src="{img(extra['dash'])}"></div>
  <div class="figure" style="flex:1;min-height:0;padding:0;overflow:hidden;background:#071417;border-color:#1F3A43"><img src="{img(extra['video'])}"></div>
  <div class="foot"><span>React · GSAP · Lenis · d3</span><span class="pager">6 / 7</span></div>
</section>

<section class="slide dark" id="s7">
  <div class="kick">What I learned</div>
  <h2>An honest tool beats a precise-looking number</h2>
  <ul class="lim">
    <li>The PD elasticity (β) matters far more than climate-model uncertainty: it is the first thing to calibrate on observed defaults.</li>
    <li>Two drought indicators can point to opposite regions: the right one depends on what is being financed.</li>
    <li>The NGFS Phase V GDP-damage function relies on a retracted paper, so I left it out.</li>
    <li>Physical risk only, a 25 km climate grid, and a synthetic portfolio.</li>
  </ul>
  <p class="lead" style="margin-top:auto;color:#fff">Website and code: link in the comments.</p>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px"><span class="chip" style="color:var(--accent)">Python</span><span class="chip" style="color:#9FE3EA">CMIP6</span><span class="chip" style="color:#9FE3EA">NGFS</span><span class="chip" style="color:#9FE3EA">Geoinformatics</span><span class="chip" style="color:#9FE3EA">Credit risk</span></div>
  <div class="foot"><span>Emna Saada · Geoinformatics, MSE (Université de la Manouba)</span><span class="pager">7 / 7</span></div>
</section>
</body></html>"""
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / "slides.html"
    p.write_text(html, encoding="utf-8")
    return p


if __name__ == "__main__":
    import sys

    a = dict(arg.split("=", 1) for arg in sys.argv[1:])
    print(main({"dash": Path(a["dash"]), "video": Path(a["video"])}))
