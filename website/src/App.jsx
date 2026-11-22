import { useCallback, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { loadAll } from './lib/data.js';
import { useSmoothScroll } from './lib/motion.js';
import Hud from './components/Hud.jsx';
import DeepDive from './components/DeepDive.jsx';
import Toasts, { useToasts } from './components/Toasts.jsx';
import Briefing from './levels/Briefing.jsx';
import Portfolio from './levels/Portfolio.jsx';
import Hazards from './levels/Hazards.jsx';
import TimeMachine from './levels/TimeMachine.jsx';
import DoTheMath from './levels/DoTheMath.jsx';
import Scoreboard from './levels/Scoreboard.jsx';
import StressTest from './levels/StressTest.jsx';
import Rulebook from './levels/Rulebook.jsx';
import Debrief from './levels/Debrief.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [scenario, setScenario] = useState('ssp585');
  const [horizon, setHorizon] = useState(2);
  const [dive, setDive] = useState(null);
  const toasts = useToasts();

  useEffect(() => { loadAll().then(setData).catch(e => setErr(String(e))); }, []);
  useSmoothScroll(!!data);
  useEffect(() => {
    if (!data) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [data]);

  const onDive = useCallback(k => setDive(k), []);
  const close = useCallback(() => setDive(null), []);

  if (err) return <div className="boot boot--err">Could not load the data ({err}).</div>;
  if (!data) return <div className="boot"><span className="boot__ring" />Loading the mission…</div>;

  const shared = { data, scenario, setScenario, horizon, setHorizon, onDive, toast: toasts.push };
  return (
    <>
      <Hud scenario={scenario} horizon={horizon} onIndex={() => setDive('index')} />
      <main>
        <Briefing {...shared} />
        <Portfolio {...shared} />
        <Hazards {...shared} />
        <TimeMachine {...shared} />
        <DoTheMath {...shared} />
        <Scoreboard {...shared} />
        <StressTest {...shared} />
        <Rulebook {...shared} />
        <Debrief {...shared} earned={toasts.earned} />
      </main>
      <DeepDive data={data} open={dive} onClose={close} onOpen={setDive} />
      <Toasts items={toasts.items} />
    </>
  );
}
