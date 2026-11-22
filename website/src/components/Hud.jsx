import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToEl } from '../lib/motion.js';
import { SCEN, HORIZONS } from '../lib/data.js';

export const LEVELS = [
  ['briefing', 'Briefing'], ['portfolio', 'Portfolio'], ['hazards', 'Hazards'], ['timemachine', 'Time machine'],
  ['math', 'Do the math'], ['scoreboard', 'Scoreboard'], ['stress', 'Stress test'], ['rulebook', 'Rulebook'], ['debrief', 'Debrief']
];

// Fixed heads-up display: level progress, current scenario, deep-dive index.
export default function Hud({ scenario, horizon, onIndex }) {
  const [active, setActive] = useState(0);
  const [cleared, setCleared] = useState(() => new Set());
  const bar = useRef(null);

  useEffect(() => {
    const triggers = LEVELS.map(([id], i) => ScrollTrigger.create({
      trigger: '#' + id, start: 'top 55%', end: 'bottom 55%', refreshPriority: -1,
      onToggle: s => { if (s.isActive) setActive(i); },
      onLeave: () => setCleared(c => new Set(c).add(i))
    }));
    const prog = gsap.to(bar.current, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    return () => { triggers.forEach(t => t.kill()); prog.scrollTrigger?.kill(); prog.kill(); };
  }, []);

  const sc = horizon === 0 ? null : SCEN[scenario];
  return (
    <nav className="hud" aria-label="Levels">
      <a className="hud__brand" href="#briefing" onClick={e => { e.preventDefault(); scrollToEl('#briefing', 0); }}>
        <span className="hud__logo" aria-hidden="true" /> ClimaRisk<span className="muted">·TN</span>
      </a>
      <ol className="hud__levels">
        {LEVELS.map(([id, name], i) => (
          <li key={id}>
            <button className={`hud__lv ${i === active ? 'is-active' : ''} ${cleared.has(i) ? 'is-cleared' : ''}`}
              onClick={() => scrollToEl('#' + id)} aria-current={i === active ? 'step' : undefined} title={name}>
              <span className="hud__dot">{cleared.has(i) && i !== active ? '✓' : i}</span>
              <span className="hud__name">{name}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="hud__right">
        <span className="chip" style={{ '--c': sc ? sc.hex : '#94A3B8' }}>
          <i />{sc ? `${sc.label} · ${HORIZONS[horizon]}` : 'Current climate'}
        </span>
        <button className="dive-btn dive-btn--solid" onClick={onIndex}>Deep dives</button>
      </div>
      <div className="hud__progress"><div ref={bar} /></div>
    </nav>
  );
}
