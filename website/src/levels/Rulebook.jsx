import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Level from '../components/Level.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';

const GROUP = id => (/^(BCT|LOI)/.test(id) ? 'Tunisia' : /^(EBA|ECB)/.test(id) ? 'Europe (benchmark)' : 'International');
const STATUS = s => (/^verified/.test(s) ? ['ok', 'Verified at source'] : /not verified|not reachable|to be re-checked|re-read/.test(s) ? ['warn', 'Partly verified'] : ['mid', 'Secondary sources']);

export default function Rulebook({ data, onDive, toast }) {
  const regs = data.regulation;
  const groups = ['All', 'International', 'Europe (benchmark)', 'Tunisia'];
  const [g, setG] = useState('All');
  const [open, setOpen] = useState(null);
  const shown = regs.filter(r => g === 'All' || GROUP(r.id) === g);
  const verified = regs.filter(r => STATUS(r.status)[0] === 'ok').length;
  return (
    <Level id="rulebook" n={7} name="Rulebook" title="The rules of the game: which texts the work follows"
      objective="See which supervisory text each part of the tool answers, and how far each reference was checked. Open a card for the detail."
      dives={[['regulation', 'How references were checked']]} onDive={onDive}>
      <div className="rb-bar panel">
        <div className="mini-seg">{groups.map(x => <button key={x} className={g === x ? 'is-on' : ''} onClick={() => setG(x)}>{x}</button>)}</div>
        <span className="muted"><b>{regs.length}</b> texts · <b>{verified}</b> verified at the official source · the tool prepares for these expectations and claims no compliance</span>
      </div>
      <motion.div className="rb-grid" layout>
        <AnimatePresence mode="popLayout">
          {shown.map(r => {
            const [k, lab] = STATUS(r.status);
            const isOpen = open === r.id;
            return (
              <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }} className={`rb-cell ${isOpen ? 'is-open' : ''}`}>
                <SpotlightCard theme="light" className="panel rb" spotlightColor="rgba(215,38,61,0.08)">
                  <button className="rb__btn" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : r.id); toast('lawyer', 'Rule reader', 'You opened a regulatory text.'); }}>
                    <span className="rb__top"><span className="rb__id">{r.id}</span><span className={`badge badge--${k}`}>{lab}</span></span>
                    <span className="rb__title">{r.title}</span>
                    <span className="rb__date">{r.date}</span>
                    <span className="rb__cov">Coverage: <b>{r.coverage}</b> <span aria-hidden="true">{isOpen ? '−' : '+'}</span></span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div className="rb__more" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                        <p><b>What it asks.</b> {r.requirement}</p>
                        <div><p><b>Where the project answers it</b></p>
                          <ul>{r.modules.map(m => <li key={m}>{m}</li>)}</ul></div>
                        <div><p className="fineprint">Check status: {r.status}.</p>
                          <a href={r.url} target="_blank" rel="noreferrer">Official source ↗</a></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Level>
  );
}
