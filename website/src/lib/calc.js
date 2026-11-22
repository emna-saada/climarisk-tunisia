// The credit formulas of src/climarisk/credit.py and vulnerability.py, re-implemented for the
// interactive calculator. Coefficients come from config/assumptions.yaml (exported as assumptions.json).
export const HKEYS = ['heat', 'drought', 'flood', 'fire'];

export function composite(scores, V) {
  let num = 0, den = 0;
  for (const h of HKEYS) { num += V[h] * scores[h]; den += V[h]; }
  return den ? num / den : 0;
}

export function credit(loan, p, asm, betaMult = 1) {
  const V = asm.vulnerability[loan.sector];
  const beta = (asm.beta[loan.sector] ?? asm.beta.default) * betaMult;
  const comp = composite(p, V);
  const pd = Math.min(1, loan.pd * (1 + beta * comp));
  const lgdSensitive = loan.collateral === 'land' || loan.collateral === 'real_estate';
  const lgd = Math.min(1, loan.lgd * (1 + (lgdSensitive ? asm.gamma * p.flood : 0)));
  const elBase = loan.pd * loan.lgd * loan.ead;
  const el = pd * lgd * loan.ead;
  const material = HKEYS.filter(h => V[h] >= asm.materiality);
  const high = material.some(h => p[h] >= asm.threshold);
  return { V, beta, comp, pd, lgd, lgdSensitive, elBase, el, add: el - elBase, material, high };
}
