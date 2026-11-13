import {
  Environment,
  Lightformer,
  PerformanceMonitor,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { signals } from '../data/signals.ts';
import { CameraRig } from './CameraRig.tsx';
import { City } from './City.tsx';
import { Crowd } from './Crowd.tsx';
import { LabelProjector } from './LabelProjector.tsx';
import { kiosks } from './layout.ts';
import { Stall } from './Stall.tsx';

interface Props {
  onSelect: (id: string) => void;
  onIntroDone: () => void;
  onArrived: (id: string) => void;
}

const SKY = '#f2f2f2';
/** `?qualite=haute` désactive la dégradation automatique (captures, démo sur machine sûre). */
const FIXED_QUALITY =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('qualite') === 'haute';

export default function Observatory({
  onSelect,
  onIntroDone,
  onArrived,
}: Props) {
  const [hidden, setHidden] = useState(() => document.hidden);
  const [dpr, setDpr] = useState(2);
  const [shadows, setShadows] = useState(true);

  // Arrêt du rendu quand l'onglet est caché.
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  return (
    <Canvas
      frameloop={hidden ? 'never' : 'always'}
      dpr={[1, dpr]}
      shadows={shadows ? 'percentage' : false}
      camera={{ fov: 34, near: 0.5, far: 900, position: [0, 120, 60] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      {/* Qualité adaptative : si la fluidité baisse, on réduit la résolution, puis on coupe les ombres portées. */}
      {FIXED_QUALITY ? null : (
        <PerformanceMonitor
          onDecline={() => {
            if (dpr > 1) setDpr(1);
            else setShadows(false);
          }}
        />
      )}
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 95, 300]} />

      <hemisphereLight args={['#ffffff', '#d9d9d9', 1.25]} />
      <directionalLight
        position={[-34, 58, -26]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-46}
        shadow-camera-right={46}
        shadow-camera-top={46}
        shadow-camera-bottom={-46}
        shadow-camera-near={1}
        shadow-camera-far={160}
      />

      {/* Reflets du verre des flacons : environnement généré par code, aucun fichier HDR. */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2}
          color="#ffffff"
          position={[0, 6, 4]}
          scale={[10, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1}
          color="#ffffff"
          position={[-8, 3, -6]}
          rotation-y={Math.PI / 3}
          scale={[6, 2, 1]}
        />
      </Environment>

      <City />
      {kiosks.map((k, i) => (
        <Stall key={k.id} signal={signals[i]} layout={k} onSelect={onSelect} />
      ))}
      <Crowd />
      <CameraRig onIntroDone={onIntroDone} onArrived={onArrived} />
      <LabelProjector />
    </Canvas>
  );
}
