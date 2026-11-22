import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Small "achievement" toasts: the game layer. Polite live region for screen readers.
export function useToasts() {
  const [items, setItems] = useState([]);
  const [earned, setEarned] = useState(() => new Set());
  const seen = useRef(new Set());
  const push = useCallback((key, title, text) => {
    if (seen.current.has(key)) return;
    seen.current.add(key);
    setEarned(new Set(seen.current));
    setItems(xs => [...xs, { key, title, text }]);
    setTimeout(() => setItems(xs => xs.filter(x => x.key !== key)), 4200);
  }, []);
  return { items, push, earned };
}

export default function Toasts({ items }) {
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {items.map(t => (
          <motion.div key={t.key} className="toast" layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
            <span className="toast__badge" aria-hidden="true">★</span>
            <div><b>{t.title}</b><span>{t.text}</span></div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
