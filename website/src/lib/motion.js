import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;
export function getLenis() { return lenis; }

// Lenis drives the scroll; GSAP's ticker drives Lenis so ScrollTrigger and smooth scroll share one clock.
export function useSmoothScroll(enabled) {
  useEffect(() => {
    if (!enabled || reduced()) return;
    lenis = new Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = time => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); lenis = null; };
  }, [enabled]);
}

export function scrollToEl(target, offset = -64) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
}
export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.0 });
  else window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
}

// Tweened number for HUD counters (fast, so scenario switches feel instant).
export function useTween(value, duration = 0.6) {
  const [v, setV] = useState(value);
  useEffect(() => {
    if (reduced()) { setV(value); return; }
    const o = { x: v };
    const tw = gsap.to(o, { x: value, duration, ease: 'power3.out', onUpdate: () => setV(o.x) });
    return () => tw.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return v;
}

// Variants for bars that grow from zero when their list scrolls into view (the parent carries
// initial="hidden" whileInView="show": a zero-width bar cannot be observed on its own).
export const grow = (v, delay = 0) => ({
  hidden: { scaleX: 0 },
  show: { scaleX: v, transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] } }
});
