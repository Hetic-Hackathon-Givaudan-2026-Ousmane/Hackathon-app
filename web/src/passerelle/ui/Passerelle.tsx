import type { Signal, TimelineEvent } from '../data/types.ts';
import { Badge } from './Badge.tsx';
import styles from './Passerelle.module.css';

/**
 * Frise "La passerelle" : ligne Goût (olive), ligne Parfum (prune),
 * et la flèche Passerelle, seul dégradé autorisé, du goût vers le parfum.
 * Seule animation de l'interface : les points apparaissent un à un, puis la flèche se dessine.
 */
function EventItem({
  e,
  index,
  lane,
}: {
  e: TimelineEvent;
  index: number;
  lane: 'gout' | 'parfum';
}) {
  return (
    <li
      className={styles.event}
      style={{ animationDelay: `${150 + index * 250}ms` }}
    >
      <span className={styles.dot} data-lane={lane} aria-hidden="true" />
      <p>
        {e.when ?? 'Date à confirmer'} : {e.text}
      </p>
      {e.reliability === 'a-confirmer' ? <Badge kind="a-confirmer" /> : null}
      {e.reliability === 'recit' ? (
        <Badge kind="recit">
          {lane === 'parfum' ? 'Récit de presse' : 'Récit'}
        </Badge>
      ) : null}
    </li>
  );
}

export function Passerelle({ signal }: { signal: Signal }) {
  const taste = signal.events.filter((e) => e.lane === 'gout');
  const perfume = signal.events.filter((e) => e.lane === 'parfum');
  const arrowDelay = 150 + taste.length * 250;
  return (
    <div className={styles.timeline}>
      <div className={styles.row}>
        <p className={styles.laneLabel} data-lane="gout">
          Goût
        </p>
        <div className={styles.lane}>
          <span className={styles.line} data-lane="gout" aria-hidden="true" />
          <ol className={styles.events} data-count={taste.length}>
            {taste.map((e, i) => (
              <EventItem key={i} e={e} index={i} lane="gout" />
            ))}
          </ol>
        </div>
      </div>

      {perfume.length ? (
        <div
          className={styles.arrow}
          style={{ animationDelay: `${arrowDelay}ms` }}
          aria-hidden="true"
        >
          <span>Passerelle</span>
          <svg viewBox="0 0 170 58" preserveAspectRatio="none">
            <defs>
              <linearGradient
                id="passerelle-gradient"
                x1="0"
                x2="1"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#677000" />
                <stop offset="100%" stopColor="#78608D" />
              </linearGradient>
            </defs>
            <path
              d="M 4 4 C 45 6, 107 12, 151 46"
              style={{ animationDelay: `${arrowDelay}ms` }}
            />
            <path
              d="M 141 43 L 151 46 L 147 36"
              style={{ animationDelay: `${arrowDelay + 200}ms` }}
            />
          </svg>
        </div>
      ) : (
        <div className={styles.gap} aria-hidden="true" />
      )}

      <div className={styles.row}>
        <p className={styles.laneLabel} data-lane="parfum">
          Parfum
        </p>
        <div className={styles.lane}>
          <span className={styles.line} data-lane="parfum" aria-hidden="true" />
          {perfume.length ? (
            <ol className={`${styles.events} ${styles.perfumeEvents}`}>
              {perfume.map((e, i) => (
                <EventItem
                  key={i}
                  e={e}
                  index={taste.length + 1 + i}
                  lane="parfum"
                />
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>
              Aucun signal parfum dans les sources pour l’instant.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
