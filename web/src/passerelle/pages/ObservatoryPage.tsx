import { lazy, Suspense, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { signals } from '../data/signals.ts';
import { sceneStore, useScene } from '../lib/store.ts';
import { hasWebGL } from '../lib/webgl.ts';
import Fallback2D from '../scene/Fallback2D.tsx';
import { KioskLabels } from '../scene/KioskLabels.tsx';
import { AppHeader } from '../ui/AppHeader.tsx';
import { IntroOverlay } from '../ui/IntroOverlay.tsx';
import { KeyboardNav } from '../ui/KeyboardNav.tsx';
import { Legend } from '../ui/Legend.tsx';
import styles from './ObservatoryPage.module.css';

const Observatory = lazy(() => import('../scene/Observatory.tsx'));

const SCENE_DESCRIPTION =
  'Vue en plongée d’une place entourée d’immeubles. Huit stands d’arômes sont disposés en arc ; chacun, aux couleurs de son arôme, présente l’ingrédient et un flacon de parfum. Devant chaque stand, une file de passants : sa longueur indique l’intensité du signal, l’anneau au sol la proposition. Sous chaque nom, la pancarte rappelle la proposition et indique le sens de la file. Utilisez Tab pour parcourir les stands et Entrée pour ouvrir une fiche.';

/** L'intro ne se joue qu'une fois par session. */
let introPlayed = false;

export default function ObservatoryPage() {
  const navigate = useNavigate();
  const intro = useScene((s) => s.intro);
  const webgl = useMemo(hasWebGL, []);

  useEffect(() => {
    // Retour sur la place : pas d'intro, pas de sélection.
    sceneStore.set({ selectedId: null, hoveredId: null, focusedId: null });
    if (introPlayed || !webgl) sceneStore.set({ intro: 'done' });
    else sceneStore.set({ intro: 'running' });
    document.title = 'Passerelle';
  }, []);

  const select = useCallback(
    (id: string) => {
      const s = sceneStore.get();
      if (s.intro === 'running' || s.selectedId) return;
      if (!webgl) {
        navigate(`/tendance/${id}`);
        return;
      }
      // La caméra file vers le stand, puis la fiche s'ouvre (onArrived).
      sceneStore.set({ selectedId: id, hoveredId: null });
    },
    [navigate, webgl],
  );

  const arrived = useCallback(
    (id: string) => navigate(`/tendance/${id}`),
    [navigate],
  );

  const skip = useCallback(() => {
    const s = sceneStore.get();
    if (s.intro === 'done') return;
    introPlayed = true;
    sceneStore.set({ intro: 'done', skipToken: s.skipToken + 1 });
  }, []);

  const onIntroDone = useCallback(() => {
    introPlayed = true;
    sceneStore.set({ intro: 'done' });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const s = sceneStore.get();
      if (s.selectedId) sceneStore.set({ selectedId: null });
      else skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  const simulatedCount = signals.filter((s) => s.isSimulated).length;

  return (
    <div className={styles.page} data-intro={intro}>
      <div className={styles.scene} role="img" aria-label={SCENE_DESCRIPTION}>
        {webgl ? (
          <Suspense fallback={null}>
            <Observatory
              onSelect={select}
              onIntroDone={onIntroDone}
              onArrived={arrived}
            />
          </Suspense>
        ) : (
          <Fallback2D onSelect={select} />
        )}
      </div>
      {webgl ? <KioskLabels /> : null}

      <AppHeader overlay tag="Cas de démonstration" />

      <section className={styles.intro} aria-labelledby="place-title">
        <h1 id="place-title">La place des tendances</h1>
        <p>Huit notes, huit files. Choisissez un stand pour ouvrir sa fiche.</p>
        <p className={styles.touchHint}>
          Touchez un stand pour voir son nom, puis touchez-le encore pour ouvrir
          la fiche.
        </p>
      </section>

      {webgl ? <KeyboardNav onSelect={select} /> : null}

      <Legend
        simulatedCount={simulatedCount}
        total={signals.length}
        showToggle={webgl}
      />

      {intro === 'running' ? <IntroOverlay onSkip={skip} /> : null}
    </div>
  );
}
