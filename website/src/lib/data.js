// Loads the JSON tables exported by scripts/export_dashboard_data.py (single source: outputs/kpis.json
// and outputs/asset_results.parquet). Nothing here is computed by hand.
const FILES = ['scenarios', 'portfolio', 'sectors', 'governorates', 'heatmap', 'sensitivity', 'top_exposures',
  'physrisk', 'loans', 'gov_hazards', 'hazard_means', 'assumptions', 'regulation', 'loans_detail'];

export async function loadAll() {
  const base = import.meta.env.BASE_URL + 'data/';
  const entries = await Promise.all(FILES.map(async f => {
    const r = await fetch(base + f + '.json');
    if (!r.ok) throw new Error(`${f}.json: HTTP ${r.status}`);
    return [f, (await r.json()).rows];
  }));
  const geo = await (await fetch(base + 'tunisia_adm1.geojson.json')).json();
  return { ...Object.fromEntries(entries), geo };
}

export const PERIODS = ['baseline', 'ssp245_2030', 'ssp245_2050', 'ssp585_2030', 'ssp585_2050'];
export const HORIZONS = ['Today', '2030', '2050'];
export function periodKey(scenario, horizon) {
  return horizon === 0 ? 'baseline' : `${scenario}_${HORIZONS[horizon]}`;
}
export function periodIndex(key) { return PERIODS.indexOf(key); }
export const SCEN = {
  ssp245: { label: 'SSP2-4.5', color: 'var(--ssp245)', hex: '#2563EB', blurb: 'intermediate warming, about 2.7 °C by 2100' },
  ssp585: { label: 'SSP5-8.5', color: 'var(--ssp585)', hex: '#D7263D', blurb: 'high-end warming, used as a physical stress bound' }
};
export const HAZ = {
  heat: { label: 'Extreme heat', short: 'Heat', hex: '#D7263D', color: 'var(--heat)' },
  drought: { label: 'Drought', short: 'Drought', hex: '#B97800', color: 'var(--drought)' },
  flood: { label: 'Flood', short: 'Flood', hex: '#2563EB', color: 'var(--flood)' },
  fire: { label: 'Wildfire', short: 'Fire', hex: '#12875F', color: 'var(--fire)' }
};
