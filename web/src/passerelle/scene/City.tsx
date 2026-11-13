import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  BackSide,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from 'three';

/**
 * Ville en maquette, générée par code : rues, îlots d'immeubles aux façades variées
 * (fenêtres percées, bandeaux, tours vitrées), toits équipés, voitures garées, arbres,
 * mobilier de la place, fontaine, et montagnes au loin. Aucune texture téléchargée.
 */

/** Générateur pseudo-aléatoire déterministe : la ville est identique à chaque chargement. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const PLAZA = { x0: -30, x1: 30, z0: -16, z1: 26 };
const ROAD = 6;
const XS = [-142, -114, -86, -58, -30, 30, 58, 86, 114, 142];
const ZS = [-156, -128, -100, -72, -44, -16, 26, 54];

/** Pierres claires et blancs chauds pour les façades ; gris bleuté pour les tours vitrées. */
const FACADES = [
  '#ffffff',
  '#f6f3ee',
  '#efebe4',
  '#e9e4dc',
  '#eef0f2',
  '#e4e7ea',
  '#f3eee6',
];
const GLASS = '#d5dde3';
const CAR_COLORS = [
  '#2f3e55',
  '#b9b3a8',
  '#8c3b3b',
  '#4f6b5a',
  '#dcd8d0',
  '#2b2f33',
  '#6a7b8c',
  '#c9a66b',
];

interface Box {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  /** 0 fenêtres percées, 1 bandeaux horizontaux, 2 mur-rideau vitré */
  style: number;
}

interface Placed {
  x: number;
  y?: number;
  z: number;
  sx?: number;
  sy?: number;
  sz?: number;
  ry?: number;
  color?: string;
}

function buildCity() {
  const r = rng(19);
  const buildings: Box[] = [];
  const roofUnits: Placed[] = [];
  const tanks: Placed[] = [];
  const trees: { x: number; z: number; s: number }[] = [];
  const lamps: { x: number; z: number }[] = [];
  const cars: Placed[] = [];

  for (let i = 0; i < XS.length - 1; i++) {
    for (let k = 0; k < ZS.length - 1; k++) {
      const bx0 = XS[i] + ROAD / 2 + 1.5;
      const bx1 = XS[i + 1] - ROAD / 2 - 1.5;
      const bz0 = ZS[k] + ROAD / 2 + 1.5;
      const bz1 = ZS[k + 1] - ROAD / 2 - 1.5;
      const cx = (bx0 + bx1) / 2;
      const cz = (bz0 + bz1) / 2;
      if (XS[i] === -30 && ZS[k] === -16) continue; // la place
      if (cz > 30 && Math.abs(cx) < 50) continue; // dégagement devant la caméra
      const dist = Math.hypot(cx, cz - 6);
      if (r() < 0.1 && dist < 100) {
        for (let t = 0; t < 8; t++)
          trees.push({
            x: bx0 + r() * (bx1 - bx0),
            z: bz0 + r() * (bz1 - bz0),
            s: 0.9 + r() * 0.6,
          });
        continue;
      }
      // Les îlots lointains, derrière la place, accueillent quelques tours.
      const tower = cz < -60 && r() < 0.3;
      if (tower) {
        const h = 26 + Math.round(r() * 12) * 1.8;
        buildings.push({
          x: cx,
          z: cz,
          w: (bx1 - bx0) * 0.55,
          d: (bz1 - bz0) * 0.55,
          h,
          color: GLASS,
          style: 2,
        });
        tanks.push({ x: cx, z: cz, y: h, sx: 1.2, sy: 1.4, sz: 1.2 });
        continue;
      }
      const cols = r() < 0.5 ? 2 : 3;
      const rows = 2;
      const lw = (bx1 - bx0) / cols;
      const ld = (bz1 - bz0) / rows;
      const blockStyle = r() < 0.35 ? 1 : 0;
      for (let a = 0; a < cols; a++) {
        for (let b = 0; b < rows; b++) {
          const floors = Math.round(
            3 + r() * 4 + Math.min(10, dist / 12) * r(),
          );
          const inset = 0.4 + r() * 0.8;
          const box: Box = {
            x: bx0 + lw * (a + 0.5),
            z: bz0 + ld * (b + 0.5),
            w: lw - inset,
            d: ld - inset,
            h: floors * 1.8 + 0.6,
            color: FACADES[Math.floor(r() * FACADES.length)],
            style: r() < 0.25 ? 1 - blockStyle : blockStyle,
          };
          buildings.push(box);
          if (r() < 0.35) {
            buildings.push({
              ...box,
              w: box.w * 0.6,
              d: box.d * 0.6,
              h: box.h + 1.8 + Math.round(r() * 2) * 1.8,
            });
          }
          // Équipements de toit : blocs techniques et réservoirs
          const top = buildings[buildings.length - 1];
          const units = Math.floor(r() * 3);
          for (let u = 0; u < units; u++) {
            roofUnits.push({
              x: top.x + (r() - 0.5) * top.w * 0.6,
              z: top.z + (r() - 0.5) * top.d * 0.6,
              y: top.h,
              sx: 0.8 + r() * 1.2,
              sy: 0.5 + r() * 0.5,
              sz: 0.6 + r() * 0.9,
            });
          }
          if (r() < 0.18)
            tanks.push({
              x: top.x + top.w * 0.2,
              z: top.z - top.d * 0.2,
              y: top.h,
              sx: 0.8,
              sy: 1,
              sz: 0.8,
            });
        }
      }
    }
  }

  // Arbres et lampadaires autour de la place
  for (let x = PLAZA.x0 + 3; x <= PLAZA.x1 - 3; x += 4.4)
    trees.push({ x, z: PLAZA.z0 + 3.2, s: 1 + r() * 0.3 });
  for (let z = PLAZA.z0 + 7; z <= PLAZA.z1 - 2; z += 5) {
    trees.push({ x: PLAZA.x0 + 2.6, z, s: 1 + r() * 0.3 });
    trees.push({ x: PLAZA.x1 - 2.6, z, s: 1 + r() * 0.3 });
  }
  for (const x of XS) {
    for (let z = -150; z < 50; z += 7) {
      if (z > PLAZA.z0 && z < PLAZA.z1 && Math.abs(x) === 30) continue;
      if (r() < 0.75)
        trees.push({
          x: x + (r() < 0.5 ? -1 : 1) * (ROAD / 2 + 0.9),
          z,
          s: 0.8 + r() * 0.4,
        });
    }
  }
  for (let x = PLAZA.x0 + 5; x <= PLAZA.x1 - 5; x += 10) {
    lamps.push({ x, z: PLAZA.z0 + 5.5 });
    lamps.push({ x, z: PLAZA.z1 - 1.5 });
  }

  // Voitures garées le long des rues proches
  const park = (x: number, z: number, ry: number) =>
    cars.push({
      x,
      z,
      ry,
      color: CAR_COLORS[Math.floor(r() * CAR_COLORS.length)],
    });
  for (const x of [-58, -30, 30, 58]) {
    for (let z = -70; z < 40; z += 3.1) {
      if (z > PLAZA.z0 - 4 && z < PLAZA.z1 + 4 && Math.abs(x) === 30) continue;
      if (r() < 0.55) park(x + (x < 0 ? 1 : -1) * (ROAD / 2 - 0.75), z, 0);
    }
  }
  for (const z of [-44, -16]) {
    for (let x = -80; x < 80; x += 3.1) {
      if (z === -16 && Math.abs(x) < 33) continue;
      if (r() < 0.5) park(x, z - (ROAD / 2 - 0.75), Math.PI / 2);
    }
  }
  return { buildings, roofUnits, tanks, trees, lamps, cars };
}

/** Mobilier de la place : bancs, jardinières, fontaine au premier plan. */
function buildFurniture() {
  const benches: Placed[] = [];
  const planters: Placed[] = [];
  const flowers: Placed[] = [];
  const r = rng(7);
  for (let x = PLAZA.x0 + 5.2; x <= PLAZA.x1 - 5; x += 8.8)
    benches.push({ x, z: PLAZA.z0 + 5.4, ry: 0 });
  for (let z = PLAZA.z0 + 9.5; z <= PLAZA.z1 - 4; z += 10) {
    benches.push({ x: PLAZA.x0 + 4.4, z, ry: Math.PI / 2 });
    benches.push({ x: PLAZA.x1 - 4.4, z, ry: -Math.PI / 2 });
  }
  for (const x of [-22, -12, 12, 22]) {
    planters.push({ x, z: 20.5 });
    for (let f = 0; f < 9; f++) {
      flowers.push({
        x: x + (r() - 0.5) * 1.1,
        z: 20.5 + (r() - 0.5) * 1.1,
        y: 0.62 + r() * 0.12,
        color: ['#d9782b', '#8a6fb0', '#f0c330', '#ffffff'][
          Math.floor(r() * 4)
        ],
      });
    }
  }
  return { benches, planters, flowers };
}

/** Montagnes au loin, en silhouettes à facettes avec neige au sommet. */
function buildMountains() {
  const r = rng(41);
  const list: { x: number; z: number; w: number; h: number }[] = [];
  for (let x = -330; x <= 330; x += 42 + r() * 30) {
    list.push({ x, z: -300 - r() * 70, w: 55 + r() * 60, h: 38 + r() * 55 });
  }
  return list;
}

const tmp = new Object3D();
const tmpColor = new Color();

/** InstancedMesh statique : matrices et couleurs écrites une fois. */
function Static({
  geometry,
  material,
  items,
  cast = true,
  receive = false,
}: {
  geometry: BufferGeometry;
  material: Material;
  items: Placed[];
  cast?: boolean;
  receive?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach((it, i) => {
      tmp.position.set(it.x, it.y ?? 0, it.z);
      tmp.rotation.set(0, it.ry ?? 0, 0);
      tmp.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
      if (it.color) m.setColorAt(i, tmpColor.set(it.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={cast}
      receiveShadow={receive}
    />
  );
}

/** Façades : motif calculé dans le shader selon le style de chaque immeuble. */
function facadeMaterial() {
  const mat = new MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.9,
    metalness: 0,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float aStyle;\nvarying float vStyle;\nvarying vec3 vWPos;\nvarying vec3 vWNorm;',
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vec4 wp = vec4(transformed, 1.0);
        vec3 wn = objectNormal;
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp;
          wn = mat3(instanceMatrix) * wn;
        #endif
        vWPos = (modelMatrix * wp).xyz;
        vWNorm = normalize(mat3(modelMatrix) * wn);
        vStyle = aStyle;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vStyle;\nvarying vec3 vWPos;\nvarying vec3 vWNorm;',
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if (abs(vWNorm.y) < 0.5) {
          float along = abs(vWNorm.x) > 0.5 ? vWPos.z : vWPos.x;
          float fy = fract(vWPos.y / 1.8);
          vec3 glass = vec3(0.70, 0.74, 0.77);
          float win = 0.0;
          if (vStyle < 0.5) {
            float fx = fract(along / 1.7);
            win = step(0.32, fy) * step(fy, 0.78) * step(0.22, fx) * step(fx, 0.78);
            // Allège : un trait sous chaque fenêtre
            win = max(win, 0.35 * step(0.26, fy) * step(fy, 0.3) * step(0.18, fx) * step(fx, 0.82));
          } else if (vStyle < 1.5) {
            win = step(0.38, fy) * step(fy, 0.8);
            win *= step(0.04, fract(along / 6.0));
          } else {
            float fx = fract(along / 1.2);
            win = 0.85 * (1.0 - step(0.94, fy)) * (1.0 - step(0.95, fx));
            glass = vec3(0.66, 0.72, 0.76);
          }
          win *= step(1.9, vWPos.y);
          float shop = step(vWPos.y, 1.5) * step(0.2, vWPos.y) * step(0.08, fract(along / 4.2)) * step(fract(along / 4.2), 0.92);
          diffuseColor.rgb = mix(diffuseColor.rgb, glass, max(win, shop * 0.85));
        } else if (vWNorm.y > 0.5) {
          diffuseColor.rgb *= 0.93;
        }`,
      );
  };
  return mat;
}

/** Ciel : dégradé très doux du blanc cassé à l'horizon vers un gris bleuté au zénith. */
function skyMaterial() {
  return new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {},
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 2.2, 0.0, 1.0);
        vec3 col = mix(vec3(0.949), vec3(0.86, 0.9, 0.93), h);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

export function City() {
  const city = useMemo(buildCity, []);
  const furniture = useMemo(buildFurniture, []);
  const mountains = useMemo(buildMountains, []);
  const bRef = useRef<InstancedMesh>(null);

  const res = useMemo(() => {
    const box = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    box.setAttribute(
      'aStyle',
      new InstancedBufferAttribute(
        new Float32Array(city.buildings.map((b) => b.style)),
        1,
      ),
    );
    const unit = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    return {
      box,
      unit,
      facade: facadeMaterial(),
      plain: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
      roofMat: new MeshStandardMaterial({ color: '#d9d9d9', roughness: 0.9 }),
      tank: new CylinderGeometry(0.6, 0.6, 1.4, 10).translate(0, 0.7, 0),
      trunk: new CylinderGeometry(0.06, 0.09, 1, 6).translate(0, 0.5, 0),
      trunkMat: new MeshStandardMaterial({ color: '#7a6f66', roughness: 1 }),
      crown: new IcosahedronGeometry(1, 1),
      crownMat: new MeshStandardMaterial({
        color: '#ffffff',
        roughness: 1,
        flatShading: true,
      }),
      lamp: new CylinderGeometry(0.04, 0.05, 1, 6).translate(0, 0.5, 0),
      lampMat: new MeshStandardMaterial({ color: '#0b1215', roughness: 0.6 }),
      lampHead: new BoxGeometry(0.5, 0.06, 0.18),
      carBody: new BoxGeometry(1.05, 0.42, 2.5).translate(0, 0.33, 0),
      carCabin: new BoxGeometry(0.92, 0.34, 1.35).translate(0, 0.7, -0.1),
      carMat: new MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.45,
        metalness: 0.2,
      }),
      cabinMat: new MeshStandardMaterial({
        color: '#b9c3ca',
        roughness: 0.2,
        metalness: 0.3,
      }),
      benchSeat: new BoxGeometry(1.4, 0.08, 0.42).translate(0, 0.42, 0),
      benchBack: new BoxGeometry(1.4, 0.36, 0.06).translate(0, 0.66, -0.2),
      benchLeg: new BoxGeometry(0.06, 0.42, 0.42).translate(0, 0.21, 0),
      woodMat: new MeshStandardMaterial({ color: '#b89c7c', roughness: 0.9 }),
      planter: new BoxGeometry(1.6, 0.6, 1.6).translate(0, 0.3, 0),
      flower: new SphereGeometry(0.11, 8, 6),
      flowerMat: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 }),
      mountain: new ConeGeometry(1, 1, 6, 1).translate(0, 0.5, 0),
      mountainMat: new MeshStandardMaterial({
        color: '#cfd7de',
        roughness: 1,
        flatShading: true,
        fog: false,
      }),
      snow: new ConeGeometry(1, 1, 6, 1).translate(0, 0.5, 0),
      snowMat: new MeshStandardMaterial({
        color: '#f8fafb',
        roughness: 1,
        flatShading: true,
        fog: false,
      }),
      water: new MeshStandardMaterial({
        color: '#c9dbe3',
        roughness: 0.1,
        metalness: 0.1,
      }),
      ground: new MeshStandardMaterial({ color: '#ffffff', roughness: 1 }),
      road: new MeshStandardMaterial({ color: '#e3e3e3', roughness: 1 }),
      plaza: new MeshStandardMaterial({ color: '#f7f6f3', roughness: 1 }),
      joint: new MeshStandardMaterial({ color: '#e6e6e6', roughness: 1 }),
      sky: skyMaterial(),
    };
  }, [city.buildings]);

  useLayoutEffect(() => {
    const m = bRef.current;
    if (!m) return;
    city.buildings.forEach((b, i) => {
      tmp.position.set(b.x, 0, b.z);
      tmp.rotation.set(0, 0, 0);
      tmp.scale.set(b.w, b.h, b.d);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
      m.setColorAt(i, tmpColor.set(b.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [city.buildings]);

  const trees = useMemo(
    () => ({
      trunks: city.trees.map((t) => ({
        x: t.x,
        z: t.z,
        sx: t.s,
        sy: 1.3 * t.s,
        sz: t.s,
      })),
      crowns: city.trees.map((t, i) => ({
        x: t.x,
        y: 2.05 * t.s,
        z: t.z,
        sx: 0.95 * t.s,
        sy: 1.05 * t.s,
        sz: 0.95 * t.s,
        ry: i * 1.7,
        color: ['#a7b38a', '#9caa7e', '#b3bd96', '#94a27a'][i % 4],
      })),
    }),
    [city.trees],
  );
  const lamps = useMemo(
    () => ({
      posts: city.lamps.map((l) => ({ x: l.x, z: l.z, sy: 3.2 })),
      heads: city.lamps.map((l) => ({ x: l.x, z: l.z, y: 3.2 })),
    }),
    [city.lamps],
  );
  const cars = useMemo(
    () => ({
      bodies: city.cars,
      cabins: city.cars.map((c) => ({ x: c.x, z: c.z, ry: c.ry })),
    }),
    [city.cars],
  );
  const benches = useMemo(
    () => ({
      legs: furniture.benches.flatMap((b) => {
        const c = Math.cos(b.ry ?? 0);
        const s = Math.sin(b.ry ?? 0);
        return [-0.6, 0.6].map((o) => ({
          x: b.x + c * o,
          z: b.z - s * o,
          ry: b.ry,
        }));
      }),
    }),
    [furniture.benches],
  );
  const mountainItems = useMemo(
    () => ({
      peaks: mountains.map((m) => ({
        x: m.x,
        z: m.z,
        sx: m.w,
        sy: m.h,
        sz: m.w * 0.7,
      })),
      caps: mountains.map((m) => ({
        x: m.x,
        z: m.z,
        y: m.h * 0.72,
        sx: m.w * 0.28,
        sy: m.h * 0.28,
        sz: m.w * 0.2,
      })),
    }),
    [mountains],
  );

  const roads = useMemo(() => {
    const list: { x: number; z: number; w: number; d: number }[] = [];
    for (const x of XS) list.push({ x, z: -60, w: ROAD, d: 260 });
    for (const z of ZS) list.push({ x: 0, z, w: 320, d: ROAD });
    return list;
  }, []);

  const joints = useMemo(() => {
    const list: { x: number; z: number; w: number; d: number }[] = [];
    for (let z = PLAZA.z0 + ROAD / 2 + 4; z < PLAZA.z1 - ROAD / 2; z += 4) {
      list.push({ x: 0, z, w: PLAZA.x1 - PLAZA.x0 - ROAD, d: 0.05 });
    }
    for (let x = PLAZA.x0 + ROAD / 2 + 4; x < PLAZA.x1 - ROAD / 2; x += 4) {
      list.push({
        x,
        z: (PLAZA.z0 + PLAZA.z1) / 2,
        w: 0.05,
        d: PLAZA.z1 - PLAZA.z0 - ROAD,
      });
    }
    return list;
  }, []);

  return (
    <group>
      <mesh material={res.sky} renderOrder={-1}>
        <sphereGeometry args={[400, 24, 12]} />
      </mesh>
      <Static
        geometry={res.mountain}
        material={res.mountainMat}
        items={mountainItems.peaks}
        cast={false}
      />
      <Static
        geometry={res.snow}
        material={res.snowMat}
        items={mountainItems.caps}
        cast={false}
      />

      <mesh rotation-x={-Math.PI / 2} receiveShadow material={res.ground}>
        <planeGeometry args={[520, 520]} />
      </mesh>
      {roads.map((r, i) => (
        <mesh
          key={i}
          rotation-x={-Math.PI / 2}
          position={[r.x, 0.004, r.z]}
          receiveShadow
          material={res.road}
        >
          <planeGeometry args={[r.w, r.d]} />
        </mesh>
      ))}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[(PLAZA.x0 + PLAZA.x1) / 2, 0.006, (PLAZA.z0 + PLAZA.z1) / 2]}
        receiveShadow
        material={res.plaza}
      >
        <planeGeometry
          args={[PLAZA.x1 - PLAZA.x0 - ROAD, PLAZA.z1 - PLAZA.z0 - ROAD]}
        />
      </mesh>
      {joints.map((j, i) => (
        <mesh
          key={i}
          rotation-x={-Math.PI / 2}
          position={[j.x, 0.008, j.z]}
          material={res.joint}
        >
          <planeGeometry args={[j.w, j.d]} />
        </mesh>
      ))}

      <instancedMesh
        ref={bRef}
        args={[res.box, res.facade, city.buildings.length]}
        castShadow
        receiveShadow
      />
      <Static
        geometry={res.unit}
        material={res.roofMat}
        items={city.roofUnits}
      />
      <Static geometry={res.tank} material={res.roofMat} items={city.tanks} />
      <Static
        geometry={res.trunk}
        material={res.trunkMat}
        items={trees.trunks}
      />
      <Static
        geometry={res.crown}
        material={res.crownMat}
        items={trees.crowns}
        receive
      />
      <Static geometry={res.lamp} material={res.lampMat} items={lamps.posts} />
      <Static
        geometry={res.lampHead}
        material={res.lampMat}
        items={lamps.heads}
      />
      <Static
        geometry={res.carBody}
        material={res.carMat}
        items={cars.bodies}
      />
      <Static
        geometry={res.carCabin}
        material={res.cabinMat}
        items={cars.cabins}
      />

      <Static
        geometry={res.benchSeat}
        material={res.woodMat}
        items={furniture.benches}
      />
      <Static
        geometry={res.benchBack}
        material={res.woodMat}
        items={furniture.benches}
      />
      <Static
        geometry={res.benchLeg}
        material={res.lampMat}
        items={benches.legs}
      />
      <Static
        geometry={res.planter}
        material={res.plain}
        items={furniture.planters}
        receive
      />
      <Static
        geometry={res.flower}
        material={res.flowerMat}
        items={furniture.flowers}
      />

      {/* Fontaine au premier plan de la place */}
      <group position={[0, 0, 21]}>
        <mesh castShadow receiveShadow material={res.plain} position-y={0.25}>
          <cylinderGeometry args={[3, 3.1, 0.5, 40]} />
        </mesh>
        <mesh material={res.water} position-y={0.46} receiveShadow>
          <cylinderGeometry args={[2.75, 2.75, 0.04, 40]} />
        </mesh>
        <mesh castShadow material={res.plain} position-y={0.9}>
          <cylinderGeometry args={[0.28, 0.4, 1.3, 16]} />
        </mesh>
        <mesh castShadow material={res.plain} position-y={1.6}>
          <cylinderGeometry args={[1, 0.3, 0.3, 24]} />
        </mesh>
        <mesh material={res.water} position-y={1.74}>
          <cylinderGeometry args={[0.9, 0.9, 0.04, 24]} />
        </mesh>
      </group>
    </group>
  );
}
