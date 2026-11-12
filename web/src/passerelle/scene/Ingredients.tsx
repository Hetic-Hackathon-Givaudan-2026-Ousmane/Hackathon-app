import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  type BufferGeometry,
} from 'three';

/**
 * Étal de chaque stand : la matière première "goût" présentée en cagettes.
 * Formes simples générées par code, teintes tirées de la charte (olive, prune, encre, gris).
 */
type Shape =
  | 'pod'
  | 'ball'
  | 'drop'
  | 'bar'
  | 'bowl'
  | 'disk'
  | 'cone'
  | 'thread'
  | 'log'
  | 'stick'
  | 'cube';

interface Pile {
  shape: Shape;
  color: string;
  count: number;
  /** Échelle de base x, y, z */
  size: [number, number, number];
  /** Cagette : 0 gauche, 1 centre */
  crate: 0 | 1;
  /** Disposition : en tas, alignés à plat, ou posés debout */
  layout: 'heap' | 'row' | 'stand';
}

/** Couleur de chaque arôme : auvent du stand, liquide du flacon, pictogrammes. */
export const AROMA_COLOR: Record<string, string> = {
  pistache: '#8fb85a',
  figue: '#6e3f63',
  matcha: '#5f8a3a',
  yuzu: '#f0c330',
  safran: '#d9782b',
  oud: '#6b4a35',
  vanille: '#c98b3c',
  cerise: '#7a1f33',
};

export const PRODUCE: Record<string, Pile[]> = {
  pistache: [
    {
      shape: 'pod',
      color: '#a9c97a',
      count: 46,
      size: [0.055, 0.042, 0.042],
      crate: 0,
      layout: 'heap',
    },
    {
      shape: 'bar',
      color: '#4a2f22',
      count: 6,
      size: [0.3, 0.035, 0.12],
      crate: 1,
      layout: 'row',
    },
  ],
  figue: [
    {
      shape: 'drop',
      color: '#6e3f63',
      count: 22,
      size: [0.075, 0.095, 0.075],
      crate: 0,
      layout: 'heap',
    },
    {
      shape: 'drop',
      color: '#8a9a4a',
      count: 16,
      size: [0.07, 0.09, 0.07],
      crate: 1,
      layout: 'heap',
    },
  ],
  matcha: [
    {
      shape: 'bowl',
      color: '#f2efe8',
      count: 4,
      size: [0.1, 0.07, 0.1],
      crate: 0,
      layout: 'row',
    },
    {
      shape: 'disk',
      color: '#6f9a3c',
      count: 4,
      size: [0.085, 0.01, 0.085],
      crate: 0,
      layout: 'row',
    },
    {
      shape: 'cube',
      color: '#5f8a3a',
      count: 6,
      size: [0.12, 0.16, 0.08],
      crate: 1,
      layout: 'stand',
    },
  ],
  yuzu: [
    {
      shape: 'ball',
      color: '#f0c330',
      count: 28,
      size: [0.075, 0.07, 0.075],
      crate: 0,
      layout: 'heap',
    },
    {
      shape: 'ball',
      color: '#d9b52a',
      count: 18,
      size: [0.07, 0.065, 0.07],
      crate: 1,
      layout: 'heap',
    },
  ],
  safran: [
    {
      shape: 'cone',
      color: '#8a6fb0',
      count: 20,
      size: [0.05, 0.1, 0.05],
      crate: 0,
      layout: 'stand',
    },
    {
      shape: 'thread',
      color: '#d9461f',
      count: 40,
      size: [0.006, 0.07, 0.006],
      crate: 1,
      layout: 'heap',
    },
  ],
  oud: [
    {
      shape: 'log',
      color: '#6b4a35',
      count: 12,
      size: [0.05, 0.4, 0.05],
      crate: 0,
      layout: 'row',
    },
    {
      shape: 'cube',
      color: '#3e2b20',
      count: 10,
      size: [0.07, 0.05, 0.06],
      crate: 1,
      layout: 'heap',
    },
  ],
  vanille: [
    {
      shape: 'stick',
      color: '#2a1d14',
      count: 18,
      size: [0.012, 0.42, 0.012],
      crate: 0,
      layout: 'row',
    },
    {
      shape: 'cube',
      color: '#c98b3c',
      count: 22,
      size: [0.06, 0.05, 0.06],
      crate: 1,
      layout: 'heap',
    },
  ],
  cerise: [
    {
      shape: 'ball',
      color: '#5e1426',
      count: 34,
      size: [0.05, 0.05, 0.05],
      crate: 0,
      layout: 'heap',
    },
    {
      shape: 'ball',
      color: '#8f2238',
      count: 26,
      size: [0.05, 0.05, 0.05],
      crate: 1,
      layout: 'heap',
    },
  ],
};

const GEOS: Record<Shape, BufferGeometry> = {
  pod: new SphereGeometry(1, 10, 8),
  ball: new SphereGeometry(1, 12, 10),
  drop: new SphereGeometry(1, 10, 8).translate(0, 0.2, 0),
  bar: new BoxGeometry(1, 1, 1),
  bowl: new SphereGeometry(
    1,
    14,
    8,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2,
  ).rotateX(Math.PI),
  disk: new CylinderGeometry(1, 1, 1, 14),
  cone: new ConeGeometry(1, 1, 7).translate(0, 0.5, 0),
  thread: new CylinderGeometry(1, 1, 1, 4),
  log: new CylinderGeometry(1, 1, 1, 7).rotateZ(Math.PI / 2),
  stick: new CylinderGeometry(1, 1, 1, 5).rotateZ(Math.PI / 2),
  cube: new BoxGeometry(1, 1, 1),
};

/** Cagettes locales au stand (repère du stand : +z vers la file). */
const CRATES = [
  { x: -0.62, z: 0.48, w: 0.62, d: 0.4 },
  { x: 0.08, z: 0.48, w: 0.62, d: 0.4 },
];
const COUNTER_TOP = 0.62;

/* Matériaux partagés par toutes les cagettes (au lieu d'un matériau par maillage). */
const CRATE_BASE = new MeshStandardMaterial({
  color: '#f2f2f2',
  roughness: 0.9,
});
const CRATE_SIDE = new MeshStandardMaterial({
  color: '#e6e6e6',
  roughness: 0.9,
});
const CRATE_X = new BoxGeometry(1, 0.1, 0.02);
const CRATE_Z = new BoxGeometry(0.02, 0.1, 1);
const UNIT_BOX = new BoxGeometry(1, 1, 1);

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function PileMesh({ pile, seed }: { pile: Pile; seed: number }) {
  const ref = useRef<InstancedMesh>(null);
  const mat = useMemo(
    () => new MeshStandardMaterial({ color: pile.color, roughness: 0.6 }),
    [pile.color],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = seeded(seed);
    const o = new Object3D();
    const c = CRATES[pile.crate];
    const base = COUNTER_TOP + 0.04;
    for (let i = 0; i < pile.count; i++) {
      const [sx, sy, sz] = pile.size;
      o.rotation.set(0, 0, 0);
      if (pile.layout === 'row') {
        const per = Math.max(1, Math.floor(pile.count / 2));
        const col = i % per;
        const row = Math.floor(i / per);
        o.position.set(
          c.x - c.w / 2 + 0.08 + (col + 0.5) * ((c.w - 0.16) / per),
          base + sy / 2,
          c.z - 0.08 + row * 0.16,
        );
        if (pile.shape === 'log' || pile.shape === 'stick') {
          o.position.set(
            c.x,
            base + sy * 0 + 0.03 + row * 0.05,
            c.z - c.d / 2 + 0.06 + (col + 0.5) * ((c.d - 0.1) / per),
          );
          o.rotation.y = (r() - 0.5) * 0.15;
        }
      } else if (pile.layout === 'stand') {
        const per = Math.ceil(Math.sqrt(pile.count));
        o.position.set(
          c.x - c.w / 2 + 0.07 + ((i % per) + 0.5) * ((c.w - 0.14) / per),
          base,
          c.z -
            c.d / 2 +
            0.06 +
            (Math.floor(i / per) + 0.5) * ((c.d - 0.12) / per),
        );
        o.rotation.y = r() * Math.PI;
      } else {
        // En tas : plus haut au centre de la cagette
        const a = r() * Math.PI * 2;
        const rad = Math.sqrt(r());
        const px = Math.cos(a) * rad * (c.w / 2 - 0.06);
        const pz = Math.sin(a) * rad * (c.d / 2 - 0.05);
        const h = (1 - rad) * 0.12 + r() * 0.03;
        o.position.set(c.x + px, base + sy + h, c.z + pz);
        o.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
      }
      if (pile.shape === 'log' || pile.shape === 'stick')
        o.scale.set(sy, sx, sz);
      else o.scale.set(sx, sy, sz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [pile, seed]);
  return (
    <instancedMesh
      ref={ref}
      args={[GEOS[pile.shape], mat, pile.count]}
      castShadow
    />
  );
}

export function Produce({
  ingredient,
  seed,
}: {
  ingredient: string;
  seed: number;
}) {
  const piles = PRODUCE[ingredient] ?? [];
  return (
    <group>
      {CRATES.map((c, i) => (
        <group key={i} position={[c.x, COUNTER_TOP, c.z]}>
          {/* Cagette ouverte : fond et quatre bords */}
          <mesh
            position-y={0.02}
            scale={[c.w, 0.04, c.d]}
            geometry={UNIT_BOX}
            material={CRATE_BASE}
            castShadow
            receiveShadow
          />
          {[-1, 1].map((sgn) => (
            <mesh
              key={`x${sgn}`}
              position={[0, 0.07, (sgn * c.d) / 2]}
              scale={[c.w, 1, 1]}
              geometry={CRATE_X}
              material={CRATE_SIDE}
              castShadow
            />
          ))}
          {[-1, 1].map((sgn) => (
            <mesh
              key={`z${sgn}`}
              position={[(sgn * c.w) / 2, 0.07, 0]}
              scale={[1, 1, c.d]}
              geometry={CRATE_Z}
              material={CRATE_SIDE}
              castShadow
            />
          ))}
        </group>
      ))}
      {piles.map((p, i) => (
        <PileMesh key={i} pile={p} seed={seed * 31 + i * 7 + 1} />
      ))}
    </group>
  );
}
