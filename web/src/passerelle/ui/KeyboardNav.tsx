import { signals } from '../data/signals.ts';
import { sceneStore, useScene } from '../lib/store.ts';
import styles from './KeyboardNav.module.css';

/**
 * Accès clavier et lecteur d'écran aux kiosques. Chaque bouton reste invisible
 * tant qu'il n'a pas le focus ; le kiosque correspondant s'illumine dans la scène.
 */
export function KeyboardNav({ onSelect }: { onSelect: (id: string) => void }) {
  const intro = useScene((s) => s.intro);
  const selectedId = useScene((s) => s.selectedId);
  return (
    <nav className={styles.nav} aria-label="Stands de la place">
      <ol>
        {signals.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={styles.item}
              disabled={intro === 'running'}
              tabIndex={selectedId ? -1 : 0}
              onFocus={() => sceneStore.set({ focusedId: s.id })}
              onBlur={() => {
                if (sceneStore.get().focusedId === s.id)
                  sceneStore.set({ focusedId: null });
              }}
              onClick={() => onSelect(s.id)}
            >
              Stand {i + 1} sur {signals.length} : {s.name}, proposition{' '}
              {s.verdict}
              {s.isSimulated ? ', données simulées' : ''}. Entrée pour ouvrir la
              fiche.
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
