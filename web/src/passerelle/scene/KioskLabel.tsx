import type { Signal } from '../data/types.ts';
import { STAGE_LABEL } from '../data/types.ts';
import { intensityPhrase } from '../lib/format.ts';
import { activeId, useScene } from '../lib/store.ts';
import {
  FLOW_SHORT,
  FLOW_TEXT,
  FlowGlyph,
  flowKind,
  VerdictGlyph,
} from '../ui/Glyphs.tsx';
import { AROMA_COLOR } from './Ingredients.tsx';
import styles from './KioskLabel.module.css';

type Mode = 'hidden' | 'rest' | 'dim' | 'active';

/** Pancarte d'un stand : le nom, puis la proposition (anneau) et le sens de la file. */
export function KioskLabel({ signal }: { signal: Signal }) {
  const mode = useScene<Mode>((s) => {
    if (s.intro === 'running' || s.selectedId) return 'hidden';
    const a = activeId(s);
    if (!a) return 'rest';
    return a === signal.id ? 'active' : 'dim';
  });
  const flow = flowKind(signal.flow);

  return (
    <div className={styles.label} data-mode={mode}>
      <span className={styles.name}>
        <span
          className={styles.swatch}
          style={{ background: AROMA_COLOR[signal.ingredient] }}
          aria-hidden="true"
        />
        {signal.name}
      </span>
      <span className={styles.facts}>
        <span className={styles.fact}>
          <VerdictGlyph verdict={signal.verdict} />
          {signal.verdict}
        </span>
        <span className={styles.fact} aria-label={FLOW_TEXT[flow]}>
          <FlowGlyph kind={flow} />
          {FLOW_SHORT[flow]}
        </span>
      </span>
      {mode === 'active' ? (
        <span className={styles.more}>
          <span>
            {STAGE_LABEL[signal.stage]},{' '}
            {intensityPhrase(signal.signalIntensity).toLowerCase()}
          </span>
          {signal.isSimulated ? (
            <span className={styles.meta}>Données simulées</span>
          ) : null}
          <span className={styles.hint}>Ouvrir la fiche</span>
        </span>
      ) : null}
    </div>
  );
}
