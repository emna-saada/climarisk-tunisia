import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, FONT } from '../theme';
import type { Props } from '../types';
import { Card, Title, useAppear } from './common';

const EVENTS = [
  { k: 'Floods', y: 'Nabeul · September 2018', c: '#2A78D6', d: 'Flash floods on Cap Bon damaged homes, roads and crops.' },
  { k: 'Drought', y: 'Cereal harvests', c: '#C98500', d: 'Seasons of poor rainfall cut cereal production.' },
  { k: 'Heat', y: 'Temperature records', c: '#D1495B', d: 'Longer, hotter summers, spreading from the south to the north.' },
];

export const Origin: React.FC<Props> = () => {
  const s = useAppear(330);
  return (
    <AbsoluteFill style={{ padding: '150px 120px 160px 120px', fontFamily: FONT }}>
      <Title size={58} delay={5}>Financed assets, exposed to hazards</Title>
      <div style={{ display: 'flex', gap: 30, marginTop: 50 }}>
        {EVENTS.map((e, i) => (
          <Card key={e.k} delay={25 + i * 35} accent={e.c} style={{ flex: 1 }}>
            <div style={{ fontSize: 22, color: e.c, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{e.k}</div>
            <div style={{ fontSize: 34, fontWeight: 700, marginTop: 8 }}>{e.y}</div>
            <div style={{ fontSize: 24, color: C.mist, marginTop: 12, lineHeight: 1.4 }}>{e.d}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 30, marginTop: 36, alignItems: 'stretch' }}>
        <Card delay={240} accent={C.teal} style={{ flex: 1.4 }}>
          <div style={{ fontSize: 22, color: C.teal, fontWeight: 700, letterSpacing: 2 }}>CENTRAL BANK OF TUNISIA · NOV. 2026 · PRESS REPORTS</div>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 8 }}>Roadmap on green finance and climate risk, 2026–2030</div>
          <div style={{ fontSize: 22, color: C.mist, marginTop: 10 }}>Follows the BCT–KfW technical assistance project · 4 pillars</div>
        </Card>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, opacity: s }}>
          <div style={{ padding: '18px 26px', borderRadius: 16, border: `2px solid ${C.amber}`, color: C.white, fontSize: 30, fontWeight: 700 }}>Banking risk</div>
          <div style={{ fontSize: 44, color: C.amber, fontWeight: 800 }}>×</div>
          <div style={{ padding: '18px 26px', borderRadius: 16, border: `2px solid ${C.teal}`, color: C.white, fontSize: 30, fontWeight: 700 }}>Climate</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
