import ui from './ui.module.css';
import styles from './IntroOverlay.module.css';

export function IntroOverlay({ onSkip }: { onSkip: () => void }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.titleBlock} aria-hidden="true">
        <p className={styles.title}>Passerelle</p>
        <p className={styles.line}>
          Ce qui se goûte aujourd’hui se sentira demain.
        </p>
      </div>
      <button
        type="button"
        className={`${ui.button} ${styles.skip}`}
        onClick={onSkip}
        autoFocus
      >
        Passer l’intro
      </button>
    </div>
  );
}
