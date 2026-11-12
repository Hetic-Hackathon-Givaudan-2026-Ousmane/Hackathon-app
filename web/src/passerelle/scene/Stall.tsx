import { useCursor } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { memo, useMemo, useRef, useState } from 'react';
import {
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Group,
} from 'three';
import type { Signal } from '../data/types.ts';
import { activeId, sceneStore } from '../lib/store.ts';
import { bottleGeometry } from './bottles.ts';
import { AROMA_COLOR, Produce } from './Ingredients.tsx';
import type { KioskLayout } from './layout.ts';
import { VerdictRing } from './Ring.tsx';
import { kioskDim } from './shared.ts';

/**
 * Stand d'arômes aux couleurs de son ingrédient : auvent rayé, cagettes d'ingrédients
 * (le goût) et, sur un socle, le flacon de parfum teinté du même arôme. Le stand raconte la passerelle.
 */
const WHITE = new Color('#ffffff');
const FADE = new Color('#f2f2f2');
const INK = new Color('#0b1215');

const W = 2.8; // largeur du stand
const D = 1.6; // profondeur

interface Props {
  signal: Signal;
  layout: KioskLayout;
  onSelect: (id: string) => void;
}

function StallImpl({ signal, layout, onSelect }: Props) {
  const group = useRef<Group>(null);
  const dim = useRef(1);
  const active = useRef(0);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const geo = bottleGeometry(layout.index);
  const aroma = useMemo(
    () => new Color(AROMA_COLOR[signal.ingredient] ?? '#767676'),
    [signal.ingredient],
  );

  const mats = useMemo(() => {
    const body = new MeshStandardMaterial({
      color: WHITE.clone(),
      roughness: 0.85,
    });
    const frame = new MeshStandardMaterial({
      color: INK.clone(),
      roughness: 0.5,
      metalness: 0.2,
    });
    const stripeA = new MeshStandardMaterial({
      color: aroma.clone(),
      roughness: 0.9,
    });
    const stripeB = new MeshStandardMaterial({
      color: WHITE.clone(),
      roughness: 0.9,
    });
    const glass = new MeshPhysicalMaterial({
      color: new Color('#ffffff'),
      roughness: 0.05,
      transmission: 1,
      thickness: 0.6,
      ior: 1.45,
      attenuationColor: aroma.clone(),
      attenuationDistance: 0.45,
      clearcoat: 1,
      transparent: true,
    });
    const juice = new MeshStandardMaterial({
      color: aroma.clone(),
      roughness: 0.3,
    });
    const cap = new MeshStandardMaterial({
      color: INK.clone(),
      metalness: 0.6,
      roughness: 0.3,
    });
    return { body, frame, stripeA, stripeB, glass, juice, cap };
  }, [aroma]);

  const facing = Math.atan2(layout.dir.x, layout.dir.z);

  useFrame((_, dt) => {
    const s = sceneStore.get();
    const a = activeId(s);
    const isActive = a === signal.id;
    const k = 1 - Math.exp(-dt * 9);
    dim.current += ((a && !isActive ? 0.25 : 1) - dim.current) * k;
    active.current += ((isActive ? 1 : 0) - active.current) * k;
    kioskDim[layout.index] = dim.current;
    const fade = 1 - dim.current;
    mats.frame.color.copy(INK).lerp(FADE, fade * 0.85);
    mats.stripeA.color.copy(aroma).lerp(FADE, fade * 0.85);
    mats.juice.color.copy(aroma).lerp(FADE, fade * 0.8);
    mats.glass.attenuationColor.copy(aroma).lerp(FADE, fade * 0.8);
    if (group.current) group.current.position.y = active.current * 0.06;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (sceneStore.get().intro === 'running') return;
    setHovered(true);
    sceneStore.set({ hoveredId: signal.id });
  };
  const out = () => {
    setHovered(false);
    if (sceneStore.get().hoveredId === signal.id)
      sceneStore.set({ hoveredId: null });
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Écran tactile : premier toucher = aperçu (étiquette), second = ouverture de la fiche.
    const touch = (e.nativeEvent as PointerEvent).pointerType === 'touch';
    if (touch && sceneStore.get().hoveredId !== signal.id) {
      if (sceneStore.get().intro === 'running') return;
      sceneStore.set({ hoveredId: signal.id });
      return;
    }
    onSelect(signal.id);
  };

  const stripes = 7;
  return (
    <group position={layout.position}>
      <group rotation-y={facing}>
        <group ref={group}>
          {/* Plancher */}
          <mesh position-y={0.04} material={mats.body} castShadow receiveShadow>
            <boxGeometry args={[W, 0.08, D]} />
          </mesh>
          {/* Comptoir avant et étagère arrière */}
          <mesh
            position={[0, 0.34, 0.45]}
            material={mats.body}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[W - 0.3, 0.56, 0.62]} />
          </mesh>
          <mesh
            position={[0, 0.75, -0.6]}
            material={mats.body}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[W - 0.3, 1.4, 0.3]} />
          </mesh>
          {[0.55, 0.95].map((y) => (
            <mesh
              key={y}
              position={[0, y + 0.08, -0.38]}
              material={mats.frame}
              castShadow
            >
              <boxGeometry args={[W - 0.4, 0.03, 0.18]} />
            </mesh>
          ))}
          {/* Montants */}
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => (
              <mesh
                key={`${sx}${sz}`}
                position={[sx * (W / 2 - 0.08), 1.05, sz * (D / 2 - 0.08)]}
                material={mats.frame}
                castShadow
              >
                <cylinderGeometry args={[0.035, 0.035, 2.1, 6]} />
              </mesh>
            )),
          )}
          {/* Auvent rayé olive et blanc, incliné vers l'avant, au-dessus de l'arrière du stand */}
          <group position={[0, 2.12, -0.15]} rotation-x={0.32}>
            {Array.from({ length: stripes }, (_, i) => (
              <mesh
                key={i}
                position={[
                  -W / 2 - 0.1 + ((i + 0.5) * (W + 0.2)) / stripes,
                  0,
                  0,
                ]}
                material={i % 2 === 0 ? mats.stripeA : mats.stripeB}
                castShadow
              >
                <boxGeometry args={[(W + 0.2) / stripes, 0.04, 1.45]} />
              </mesh>
            ))}
          </group>
          {/* Étal d'ingrédients */}
          <Produce ingredient={signal.ingredient} seed={layout.index + 3} />
          {/* Socle et flacon de parfum, côté droit du comptoir */}
          <group position={[0.95, 0.62, 0.45]}>
            <mesh
              position-y={0.18}
              material={mats.body}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.42, 0.36, 0.42]} />
            </mesh>
            <group position-y={0.36} scale={0.42}>
              <mesh geometry={geo.liquid} material={mats.juice} />
              <mesh geometry={geo.glass} material={mats.glass} castShadow />
              <mesh
                position-y={geo.neck + geo.capH / 2}
                material={mats.cap}
                castShadow
              >
                <cylinderGeometry
                  args={[geo.capR, geo.capR * 1.04, geo.capH, geo.capSegments]}
                />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      <VerdictRing
        verdict={signal.verdict}
        flow={signal.flow}
        dimRef={dim}
        activeRef={active}
      />

      {/* Zone de clic : stand et tête de file */}
      <mesh
        position={[layout.dir.x * 1.4, 1.1, layout.dir.z * 1.4]}
        rotation-y={facing}
        onPointerOver={over}
        onPointerOut={out}
        onClick={click}
      >
        <boxGeometry args={[3.4, 2.4, 5.4]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
    </group>
  );
}

export const Stall = memo(StallImpl);
