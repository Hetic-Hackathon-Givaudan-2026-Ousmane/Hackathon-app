import { sceneStore, useScene } from '../lib/store.ts';
import { FLOW_TEXT, FlowGlyph, VerdictGlyph } from './Glyphs.tsx';
import styles from './Legend.module.css';

/** Légende : les mêmes pictogrammes que sous le nom de chaque stand. */
export function Legend({
  simulatedCount,
  total,
  showToggle,
}: {
  simulatedCount: number;
  total: number;
  showToggle: boolean;
}) {
  const paused = useScene((s) => s.paused);
  return (
    <aside className={styles.legend} aria-label="Légende">
      <h2 className={styles.heading}>Lire la place</h2>
      <dl className={styles.list}>
        <div className={styles.item}>
          <dt>Longueur de la file</dt>
          <dd>Intensité du signal</dd>
        </div>
        <div className={styles.item}>
          <dt>Proposition</dt>
          <dd className={styles.keys}>
            <span>
              <VerdictGlyph verdict="Suivre" /> Suivre
            </span>
            <span>
              <VerdictGlyph verdict="Observer" /> Observer
            </span>
            <span>
              <VerdictGlyph verdict="Ignorer" /> Ignorer
            </span>
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Sens de la file</dt>
          <dd className={styles.keys}>
            <span>
              <FlowGlyph kind="grandit" /> Grandit
            </span>
            <span>
              <FlowGlyph kind="se-vide" /> Se vide
            </span>
            <span>
              <FlowGlyph kind="stable" /> Stable
            </span>
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Couleur du stand</dt>
          <dd>L’arôme, du goût au flacon</dd>
        </div>
      </dl>
      <div className={styles.foot}>
        <span className={styles.tag}>
          Données simulées : {simulatedCount} tendances sur {total}
        </span>
        {showToggle ? (
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={paused}
            onClick={() => sceneStore.set({ paused: !sceneStore.get().paused })}
          >
            Animation : {paused ? 'en pause' : 'en cours'}
          </button>
        ) : null}
      </div>
      <span className="sr-only">{`${FLOW_TEXT.grandit}, ${FLOW_TEXT['se-vide']}, ${FLOW_TEXT.stable}.`}</span>
    </aside>
  );
}
