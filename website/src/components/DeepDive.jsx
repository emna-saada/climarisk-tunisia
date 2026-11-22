import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getLenis } from '../lib/motion.js';
import { fmt } from '../lib/format.js';

const F = ({ children }) => <div className="formula">{children}</div>;
const Src = ({ items }) => (
  <ul className="srcs">{items.map(([t, u]) => <li key={t}>{u ? <a href={u} target="_blank" rel="noreferrer">{t}</a> : t}</li>)}</ul>
);
const Tag = ({ kind = 'assume', children }) => <span className={`tag tag--${kind}`}>{children}</span>;

// Every "angle" a reader can open: formulas, bounds, data sources and assumptions, written from the
// code (src/climarisk) and config/assumptions.yaml. Coefficients are read from assumptions.json.
export function topics(d) {
  const a = d.assumptions[0];
  const b = a.bounds;
  return {
    portfolio: {
      kicker: 'Level 01 · Data', title: 'How the synthetic loan book is built',
      body: <>
        <p>The 2,000 loans are <b>100 % synthetic</b>: no client, no bank, no personal data (Tunisian organic law no. 2004-63). Generation is seeded (<code>seed: 2026</code>) so every run gives the same book.</p>
        <ul>
          <li><b>Where:</b> locations are sampled from open grids, WorldPop 2020 population for firms and housing, ESA WorldCover cropland for farms, a 3 km coastal buffer for hotels, with sector weights by governorate.</li>
          <li><b>How much:</b> exposure at default (EAD) follows a log-normal per sector, rescaled to a TND 3.0 bn book.</li>
          <li><b>How risky:</b> base PD is drawn per sector (for example 4–8 % for cereals, 1–3 % for housing); base LGD by collateral (land 35–55 %, industrial 40–60 %, real estate 20–40 %).</li>
        </ul>
        <p><Tag>illustrative assumption</Tag> Sector shares and PD ranges are inspired by the structure of the Tunisian economy. They are not Central Bank of Tunisia statistics.</p>
        <Src items={[['config/portfolio.yaml'], ['src/climarisk/portfolio.py'], ['WorldPop (CC BY 4.0)', 'https://www.worldpop.org'], ['ESA WorldCover 2021 (CC BY 4.0)', 'https://esa-worldcover.org']]} />
      </>
    },
    heat: {
      kicker: 'Hazard · Heat', title: 'Extreme heat: days above 35 °C',
      body: <>
        <p>Indicator: number of days per year with daily <b>maximum</b> temperature above 35 °C, at each loan location, from NASA NEX-GDDP-CMIP6 (0.25°, bias-corrected and downscaled), five CMIP6 models.</p>
        <F>S<sub>heat</sub> = clip( days<sub>35</sub> / {b.heat_days_35.high}, 0, 1 )</F>
        <p>Bounds {b.heat_days_35.low}–{b.heat_days_35.high} days are fixed, so a score means the same thing in every scenario. <Tag>illustrative assumption</Tag></p>
        <p>Periods: today = 2010–2014 model years; 2030 = 2029–2031; 2050 = 2049–2051.</p>
        <Src items={[['NASA NEX-GDDP-CMIP6 (CC0 since Sept 2022)', 'https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6'], ['src/climarisk/hazards/climate.py · scoring.py']]} />
      </>
    },
    drought: {
      kicker: 'Hazard · Drought', title: 'Drought: dry spells and rainfall change',
      body: <>
        <p>Two indicators, equally weighted: the longest run of consecutive dry days (CDD, precipitation below 1 mm, ETCCDI definition) and the change of annual precipitation against the same model's 2010–2014 baseline.</p>
        <F>S<sub>drought</sub> = 0.5 · clip( (CDD − {b.drought_cdd.low}) / {b.drought_cdd.high - b.drought_cdd.low} ) + 0.5 · clip( ΔP / {b.drought_prchange.high} % )</F>
        <p><Tag>illustrative assumption</Tag> Weights and bounds. The comparison with OS-Climate's SPEI index (Stress test level) shows that the choice of drought indicator moves the map: SPEI stresses the wetter north, CDD the arid south.</p>
        <Src items={[['NASA NEX-GDDP-CMIP6', 'https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6'], ['ETCCDI climate indices', 'http://etccdi.pacificclimate.org/list_27_indices.shtml']]} />
      </>
    },
    flood: {
      kicker: 'Hazard · Flood', title: 'Flood: 100-year inundation depth',
      body: <>
        <p>Indicator: maximum of riverine and coastal inundation depth for a 100-year return period, from WRI Aqueduct Floods v2, read from the OS-Climate public archive. Future periods use the RCP 4.5 / 8.5 layers as proxies for SSP2-4.5 / SSP5-8.5 (Aqueduct is CMIP5-based).</p>
        <F>S<sub>flood</sub> = clip( depth / {b.flood_depth_m.high} m, 0, 1 )</F>
        <p>A 2 m depth is close to total damage on the JRC global depth-damage curves (Huizinga et al., 2017). <Tag>illustrative assumption</Tag></p>
        <p>Flood also raises <b>LGD</b> for land and real-estate collateral (see the credit deep dive).</p>
        <Src items={[['WRI Aqueduct Floods (CC BY 4.0)', 'https://www.wri.org/data/aqueduct-floods-hazard-maps'], ['OS-Climate physrisk data', 'https://github.com/os-climate/physrisk']]} />
      </>
    },
    fire: {
      kicker: 'Hazard · Wildfire', title: 'Wildfire: fuel × fire weather',
      body: <>
        <p>Fire needs fuel. Fuel is the share of burnable land cover within 2 km of the loan (ESA WorldCover 2021: tree 1.0, shrub 0.8, grass 0.5, wetland 0.2, cropland 0.15). Fire weather is the mean of the heat and drought scores.</p>
        <F>S<sub>fire</sub> = fuel · (0.6 + 0.4 · weather),  weather = (S<sub>heat</sub> + S<sub>drought</sub>) / 2</F>
        <p><Tag>illustrative assumption</Tag> A proxy, not a fire-spread model. Land cover is held at 2021 in every period.</p>
        <Src items={[['ESA WorldCover 10 m 2021 v200 (CC BY 4.0)', 'https://esa-worldcover.org'], ['src/climarisk/hazards/wildfire.py']]} />
      </>
    },
    scenarios: {
      kicker: 'Level 03 · Scenarios', title: 'Scenarios, models and the spread',
      body: <>
        <p>Two CMIP6 pathways and two horizons. SSP2-4.5 is intermediate warming (about 2.7 °C by 2100, IPCC AR6 best estimate) and proxies the NGFS <i>NDCs</i> narrative; SSP5-8.5 is a high-end physical stress bound, above NGFS <i>Current Policies</i>.</p>
        <p>Five models (ACCESS-CM2, CNRM-ESM2-1, IPSL-CM6A-LR, MPI-ESM1-2-HR, MRI-ESM2-0) run the whole chain separately. Every headline figure is the <b>median</b> of the five; the band is the 10th–90th percentile across them.</p>
        <p>The NGFS Phase V GDP-damage function relies on Kotz et al. (2024), retracted by Nature; NGFS said so on 3 December 2025. It is <b>not used</b> here.</p>
        <Src items={[['NGFS scenarios portal', 'https://www.ngfs.net/ngfs-scenarios-portal/'], ['config/scenarios.yaml']]} />
      </>
    },
    composite: {
      kicker: 'Level 04 · Vulnerability', title: 'From four hazards to one score',
      body: <>
        <p>Each sector weighs the hazards differently. A rain-fed cereal farm cares most about drought, a beach hotel about flood and heat. The composite score is the vulnerability-weighted mean:</p>
        <F>Score = Σ<sub>h</sub> V<sub>sector,h</sub> · S<sub>h</sub>  /  Σ<sub>h</sub> V<sub>sector,h</sub></F>
        <table className="mini"><thead><tr><th>Sector</th><th>Heat</th><th>Drought</th><th>Flood</th><th>Fire</th></tr></thead>
          <tbody>{Object.entries(a.vulnerability).map(([s, v]) => <tr key={s}><td>{s}</td>{['heat', 'drought', 'flood', 'fire'].map(h => <td key={h}>{fmt(v[h], 1)}</td>)}</tr>)}</tbody></table>
        <p><Tag>illustrative assumption</Tag> Qualitatively informed by sectoral exposure; tested ±25 % in the Stress test level.</p>
      </>
    },
    credit: {
      kicker: 'Level 04 · Credit', title: 'From score to probability of default and loss',
      body: <>
        <F>PD<sub>climate</sub> = min( 1, PD<sub>base</sub> · (1 + β<sub>sector</sub> · Score) )</F>
        <F>LGD<sub>climate</sub> = min( 1, LGD<sub>base</sub> · (1 + γ · S<sub>flood</sub>) )   land and real estate only, γ = {a.gamma}</F>
        <F>EL = PD · LGD · EAD,   extra EL = EL<sub>climate</sub> − EL<sub>base</sub></F>
        <p>β, the PD elasticity: {Object.entries(a.beta).map(([k, v]) => `${k === 'default' ? 'other sectors' : k} ${v}`).join(' · ')}.</p>
        <p><Tag>illustrative assumption</Tag> β and γ are not calibrated on default data. Base PD is treated as climate-neutral, so the uplift also exists today; increments versus today are reported separately.</p>
        <Src items={[['src/climarisk/credit.py'], ['config/assumptions.yaml']]} />
      </>
    },
    highhazard: {
      kicker: 'Indicator', title: 'What "high-hazard zone" means',
      body: <>
        <p>A loan is in a high-hazard zone when <b>at least one hazard that matters for its sector</b> (vulnerability ≥ {a.materiality}) scores ≥ {a.threshold}. The headline indicator is the share of EAD in such zones.</p>
        <p>The rule ignores hazards a sector is insensitive to: a flooded field matters less to an olive grove (V = 0.2) than to a hotel (V = 0.8).</p>
        <p><Tag>illustrative assumption</Tag> Threshold and materiality cut-off.</p>
      </>
    },
    sensitivity: {
      kicker: 'Level 06 · Robustness', title: 'Which assumption moves the answer?',
      body: <>
        <p>For SSP5-8.5 in 2050, the pipeline recomputes the total extra EL (median across models) with β multiplied by 0.5, 1.5 and 2, and with each hazard's vulnerability weights moved by ±25 %.</p>
        <p>β scales the result almost one-for-one; a ±25 % change in a hazard weight moves it by less than 8 %. A flood weight increase lowers the total, because the composite is a weighted <i>mean</i>: more weight on flood, which is low for most loans, dilutes heat and drought.</p>
        <p>Read: calibrate β on real default data first.</p>
        <Src items={[['credit.sensitivity() in src/climarisk/credit.py']]} />
      </>
    },
    physrisk: {
      kicker: 'Level 06 · Benchmark', title: 'Cross-check with OS-Climate physrisk',
      body: <>
        <p>The pipeline reads OS-Climate physrisk's published hazard indicators at the same 2,000 locations and compares rankings (Spearman).</p>
        <ul>
          <li><b>Heat:</b> physrisk counts days with daily <i>mean</i> temperature above 35 °C, far rarer than daily maximum, so levels differ by an order of magnitude, but the spatial ranking agrees (0.66 today, 0.88 in 2050).</li>
          <li><b>Drought:</b> physrisk uses SPEI-12, standardised against each cell's own climate, so it flags the relative drying of the wetter north. Our absolute CDD score peaks in the arid south. Ranking: −0.65.</li>
        </ul>
        <p>Neither is wrong. For rain-fed farms in the north the standardised view is arguably more relevant, which argues for a sector-specific drought indicator in a next version.</p>
        <Src items={[['OS-Climate physrisk (Apache-2.0)', 'https://github.com/os-climate/physrisk'], ['src/climarisk/physrisk_compare.py']]} />
      </>
    },
    regulation: {
      kicker: 'Level 07 · Method', title: 'How the rulebook was checked',
      body: <>
        <p>Each text was read at its official source before use and logged in <code>docs/research_log.md</code> with the date and what was kept. The status badge says exactly how far the check went; where the official page could not be opened, the text is marked as not verified and its figures are not quoted.</p>
        <p>The tool <b>prepares</b> for these expectations. It does not claim regulatory compliance, and no ratio or circular number is quoted that was not checked.</p>
        <Src items={[['config/regulatory_matrix.yaml'], ['docs/research_log.md']]} />
      </>
    },
    limits: {
      kicker: 'Level 08 · Honesty', title: 'Limits you should know',
      body: <>
        <ul>
          <li><b>Synthetic book.</b> Every figure illustrates the method; none describes a real Tunisian bank.</li>
          <li><b>Resolution.</b> 0.25° climate grid (about 25 km): a city and its hinterland share one value.</li>
          <li><b>Climate models.</b> Five models, bias-corrected but still biased; short windows (5 and 3 years) carry natural variability.</li>
          <li><b>Flood.</b> Aqueduct is CMIP5-based and coarse; pluvial (flash) flooding is not covered.</li>
          <li><b>Credit link.</b> β, γ and the vulnerability matrix are assumptions, not calibrated on defaults.</li>
          <li><b>NGFS damage function.</b> Not used: it relies on Kotz et al. (2024), retracted.</li>
          <li><b>Physical risk only.</b> Transition risk (carbon prices, demand shifts) is out of scope.</li>
        </ul>
      </>
    }
  };
}

export default function DeepDive({ data, open, onClose, onOpen }) {
  const all = topics(data);
  const t = open && open !== 'index' ? all[open] : null;
  useEffect(() => {
    const l = getLenis();
    if (open) l?.stop(); else l?.start();
    const k = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="dive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="dive__scrim" onClick={onClose} />
          <motion.aside className="dive__panel" role="dialog" aria-modal="true" aria-label={t ? t.title : 'Deep dives'}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            data-lenis-prevent>
            <button className="dive__close" onClick={onClose} aria-label="Close">×</button>
            {t ? (
              <>
                <p className="dive__kicker">{t.kicker}</p>
                <h3>{t.title}</h3>
                <div className="dive__body">{t.body}</div>
                <button className="dive-btn" onClick={() => onOpen('index')}>← All deep dives</button>
              </>
            ) : (
              <>
                <p className="dive__kicker">Deep dives</p>
                <h3>Every calculation, bound and source</h3>
                <div className="dive__index">
                  {Object.entries(all).map(([k, v]) => (
                    <button key={k} onClick={() => onOpen(k)}><small>{v.kicker}</small>{v.title}</button>
                  ))}
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
