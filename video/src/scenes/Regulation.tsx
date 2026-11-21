import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import type { Props } from '../types';
import { Title, useAppear } from './common';

const STEPS = [
  { y: '2022', t: 'BCBS', d: 'Principles for climate-related financial risks (18 principles)', cov: 'Credit risk · scenarios' },
  { y: '2023', t: 'IFRS S2', d: 'Climate-related disclosures (TCFD logic)', cov: 'Exposure metrics' },
  { y: '2024', t: 'NGFS Phase V', d: 'Central bank climate scenarios', cov: 'SSP2-4.5 / SSP5-8.5 narrative' },
  { y: '2025', t: 'EBA · ESG', d: 'Guidelines on managing ESG risks', cov: 'Horizons 2030 / 2050' },
  { y: '2025', t: 'BCBS Pillar 3', d: 'Voluntary disclosure framework', cov: 'Exposure tables' },
  { y: '2026', t: 'BCT', d: '2026–2030 roadmap', cov: 'Prepare for expectations' },
];

export const Regulation: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [20, 600], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const note = useAppear(620);
  return (
    <AbsoluteFill style={{ padding: '150px 110px', fontFamily: FONT }}>
      <Title size={58} delay={5}>A framework built step by step</Title>
      <div style={{ position: 'relative', marginTop: 110, height: 520 }}>
        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: 60, left: 0, width: `${prog * 100}%`, height: 4,
          background: `linear-gradient(90deg, ${C.teal}, ${C.amber})`, borderRadius: 2 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {STEPS.map((s, i) => {
            const on = prog >= i / (STEPS.length - 1) - 0.02;
            const a = interpolate(frame, [20 + i * 100, 50 + i * 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ width: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.25 + 0.75 * a }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: on ? C.amber : C.mist }}>{s.y}</div>
                <div style={{ width: 26, height: 26, borderRadius: 13, marginTop: 14, background: on ? C.amber : C.ink,
                  border: `4px solid ${on ? C.amber : 'rgba(255,255,255,0.3)'}` }} />
                <div style={{ marginTop: 26, fontSize: 32, fontWeight: 800, color: C.white, textAlign: 'center' }}>{s.t}</div>
                <div style={{ marginTop: 10, fontSize: 21, color: C.mist, textAlign: 'center', lineHeight: 1.35, minHeight: 90 }}>{s.d}</div>
                <div style={{ marginTop: 14, fontSize: 19, fontWeight: 600, padding: '6px 14px', borderRadius: 99,
                  background: 'rgba(18,128,143,0.25)', color: '#9FE3EA', textAlign: 'center', transform: `scale(${a})` }}>✓ {s.cov}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 150, left: 110, fontSize: 26, color: C.mist, opacity: note }}>
        The tool helps banks <b style={{ color: C.white }}>prepare</b> for these expectations. It claims no regulatory compliance.
      </div>
    </AbsoluteFill>
  );
};
