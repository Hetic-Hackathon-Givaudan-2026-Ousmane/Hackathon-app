import { signals } from '../data/signals.ts';
import { KioskLabel } from './KioskLabel.tsx';
import { labelEls, labelLayer, leaderEls } from './labelRegistry.ts';
import styles from './KioskLabel.module.css';

/** Couche DOM des pancartes, posée au-dessus du canvas. */
export function KioskLabels() {
  return (
    <div
      className={styles.layer}
      aria-hidden="true"
      ref={(el) => {
        labelLayer.el = el;
      }}
    >
      {signals.map((s) => (
        <div
          key={s.id}
          className={styles.anchor}
          ref={(el) => {
            if (el) labelEls.set(s.id, el);
            else labelEls.delete(s.id);
          }}
        >
          <KioskLabel signal={s} />
          <span
            className={styles.leader}
            ref={(el) => {
              if (el) leaderEls.set(s.id, el);
              else leaderEls.delete(s.id);
            }}
          />
        </div>
      ))}
    </div>
  );
}
