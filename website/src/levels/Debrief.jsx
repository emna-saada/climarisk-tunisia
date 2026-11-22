import Level from '../components/Level.jsx';
import GradientText from '../bits/GradientText.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import AnimatedContent from '../bits/AnimatedContent.jsx';
import { scrollToEl } from '../lib/motion.js';

const LIMITS = [
  ['Synthetic book', 'Figures illustrate the method; none describes a real Tunisian bank.'],
  ['25 km climate grid', 'NEX-GDDP-CMIP6 at 0.25°: a town and its hinterland share one value.'],
  ['Model bias', 'Five bias-corrected CMIP6 models, short 5- and 3-year windows.'],
  ['Flood', 'Aqueduct v2 is CMIP5-based; flash (pluvial) floods are not covered.'],
  ['Credit link', 'β, γ and the vulnerability matrix are assumptions, not calibrated on defaults.'],
  ['NGFS damages', 'Not used: the Phase V GDP-damage function relies on the retracted Kotz et al. (2024).']
];
const DATA = [
  ['NASA NEX-GDDP-CMIP6', 'heat, drought', 'CC0'], ['WRI Aqueduct Floods v2', 'flood depth', 'CC BY 4.0'],
  ['ESA WorldCover 2021', 'wildfire fuel, farmland', 'CC BY 4.0'], ['WorldPop 2020', 'loan locations', 'CC BY 4.0'],
  ['geoBoundaries ADM1', 'governorates', 'ODbL 1.0'], ['OS-Climate physrisk', 'benchmark', 'Apache-2.0']
];
const STACK = ['Python', 'xarray', 'geopandas', 'rasterio', 'CMIP6', 'pytest', 'GitHub Actions', 'React', 'GSAP', 'Lenis', 'd3'];

const BADGES = [
  ['explorer', 'Explorer', 'Filter the book by sector', '#portfolio'],
  ['traveller', 'Time traveller', 'Reach 2050 in the Time machine', '#timemachine'],
  ['analyst', 'Credit analyst', 'Finish the five-step calculation', '#math'],
  ['tuner', 'Model tuner', 'Move the β slider', '#math'],
  ['lawyer', 'Rule reader', 'Open a regulatory text', '#rulebook']
];

export default function Debrief({ onDive, earned }) {
  return (
    <Level id="debrief" n={8} name="Debrief" title="Mission complete. Here is what to keep in mind."
      objective="Know the limits before you quote a number, then go and read the code."
      dives={[['limits', 'All limits'], ['portfolio', 'Synthetic data']]} onDive={onDive}>
      <div className="db-grid">
        <div className="panel db-limits">
          <p className="card-kicker">Limits</p>
          <ul>{LIMITS.map(([t, d], i) => (
            <AnimatedContent key={t} distance={20} delay={i * 0.05} duration={0.5}><li><b>{t}</b><span>{d}</span></li></AnimatedContent>
          ))}</ul>
        </div>
        <div className="panel db-data">
          <p className="card-kicker">Open data used</p>
          <table className="tbl"><thead><tr><th>Dataset</th><th>Used for</th><th>Licence</th></tr></thead>
            <tbody>{DATA.map(([a, b, c]) => <tr key={a}><td>{a}</td><td>{b}</td><td><span className="pill pill--line">{c}</span></td></tr>)}</tbody></table>
          <p className="card-kicker" style={{ marginTop: 16 }}>Built with</p>
          <div className="tags">{STACK.map(s => <span key={s} className="pill pill--line">{s}</span>)}</div>
          <p className="card-kicker" style={{ marginTop: 16 }}>Reproducibility</p>
          <ul className="repro">
            <li><b>seed 2026</b>fixed random seed</li>
            <li><b>uv.lock</b>locked dependencies</li>
            <li><b>pytest</b>tests per module</li>
            <li><b>CI</b>GitHub Actions on every push</li>
          </ul>
        </div>
        <SpotlightCard className="panel db-end" spotlightColor="rgba(245,181,68,0.25)">
          <p className="card-kicker">Reproduce it</p>
          <h3><GradientText colors={['#F5B544', '#e5484d', '#3987e5', '#F5B544']} animationSpeed={6}>Open source, end to end</GradientText></h3>
          <p>One command rebuilds the portfolio, hazards, credit results and this site's data: <code>make demo</code>. Every figure here is read from <code>outputs/kpis.json</code>.</p>
          <div className="briefing__cta">
            <a className="btn btn--primary" href="https://github.com/emna-saada/climarisk-tunisia" target="_blank" rel="noreferrer">Code on GitHub ↗</a>
            <button className="btn" onClick={() => scrollToEl('#briefing', 0)}>Play again ↑</button>
          </div>
          <p className="card-kicker" style={{ marginTop: 10 }}>Achievements · {earned.size}/{BADGES.length}</p>
          <ul className="badges">
            {BADGES.map(([k, t, how, href]) => (
              <li key={k} className={earned.has(k) ? 'is-earned' : ''}>
                <button onClick={() => !earned.has(k) && scrollToEl(href)} disabled={earned.has(k)}>
                  <span className="badges__ico" aria-hidden="true">{earned.has(k) ? '★' : '☆'}</span>
                  <span><b>{t}</b><small>{earned.has(k) ? 'Unlocked' : how}</small></span>
                </button>
              </li>
            ))}
          </ul>
          <p className="fineprint">Code: MIT. 100 % synthetic portfolio, no personal data (Tunisian organic law no. 2004-63). Figures are illustrative.</p>
        </SpotlightCard>
      </div>
      <footer className="foot">ClimaRisk Tunisia · geoinformatics × credit risk · {new Date().getFullYear()}</footer>
    </Level>
  );
}
