import SplitText from '../bits/SplitText.jsx';

// Section shell with the game framing: level number, title, mission objective, deep-dive buttons.
export default function Level({ id, n, name, title, objective, dives = [], onDive, children, className = '' }) {
  return (
    <section id={id} className={`level ${className}`} data-level={n}>
      <header className="level__head">
        <div className="level__tag"><span className="level__n">LEVEL {String(n).padStart(2, '0')}</span><span>{name}</span></div>
        <SplitText tag="h2" text={title} className="level__title" splitType="words" delay={40} duration={0.9}
          textAlign="left" threshold={0.2} rootMargin="-60px" />
        <div className="level__obj">
          <p><b>Objective</b>{objective}</p>
          {dives.length > 0 && (
            <div className="level__dives">
              {dives.map(([key, lab]) => (
                <button key={key} className="dive-btn" onClick={() => onDive(key)}>
                  <span aria-hidden="true">+</span> {lab}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
