import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';
import { signals } from '../data/signals.ts';
import { sceneStore } from '../lib/store.ts';
import { kiosks, MAX_SLOTS } from './layout.ts';
import { kioskDim } from './shared.ts';

/**
 * Foule de figurines bâton, comme les silhouettes d'une maquette d'architecte.
 * Une seule simulation (files, arrivées, départs) ; le rendu passe par 7 InstancedMesh
 * (tête, buste, bras, jambes, et accessoires : cabas, chapeau, sac à dos, parapluie),
 * dont les matrices sont écrites à la main.
 */
const MOVERS = 14;
const PER_KIOSK = MAX_SLOTS + MOVERS;
const N = PER_KIOSK * kiosks.length;

const IDLE = 0;
const APPROACH = 1;
const QUEUED = 2;
const LEAVING = 3;

const SPEED_APPROACH = 2.2;
const SPEED_SHIFT = 1.4;
const SPEED_LEAVE = 1.8;

/* Proportions d'une figurine (1 unité = environ 1,7 m) */
const HIP = 0.46;
const TORSO = 0.36;
const SHOULDER = HIP + TORSO - 0.04;
const LEG = 0.46;
const ARM = 0.34;
const HEAD_Y = HIP + TORSO + 0.13;

/* Silhouette (tête, bras, jambes) en encre ou gris ; vêtements et accessoires en couleurs variées. */
const TONES = ['#0b1215', '#0b1215', '#2b3236', '#3f474b', '#5a6064'].map(
  (c) => new Color(c),
);
const CLOTHES = [
  '#2f3e55',
  '#c7b9a3',
  '#b5654a',
  '#6f7f5a',
  '#7d6a8f',
  '#e4e0d8',
  '#3b3b3b',
  '#a83f3f',
  '#4f7c8a',
  '#d9a441',
  '#8a9aa8',
].map((c) => new Color(c));
const ACCENTS = [
  '#0b1215',
  '#c94f3d',
  '#e6c34a',
  '#2f6f8f',
  '#e8e4dc',
  '#7a5c8f',
  '#4f7a4a',
  '#d98a3a',
].map((c) => new Color(c));

/* Accessoires : bits d'un champ par personne */
const A_BAG = 1;
const A_HAT = 2;
const A_PACK = 4;
const A_UMBRELLA = 8;

function rollAccessories(kid: boolean): number {
  let a = 0;
  if (!kid && Math.random() < 0.25) a |= A_BAG;
  if (Math.random() < 0.3) a |= A_HAT;
  if (Math.random() < (kid ? 0.5 : 0.18)) a |= A_PACK;
  if (!kid && !(a & A_BAG) && Math.random() < 0.06) a |= A_UMBRELLA;
  return a;
}
const FADE = new Color('#e6e6e6');

interface KioskSim {
  queue: number[];
  inRate: number;
  outRate: number;
  lower: number;
  upper: number;
  nextIn: number;
  nextOut: number;
}

function expDelay(rate: number) {
  return Math.min(
    6,
    Math.max(0.5, -Math.log(1 - Math.random()) / Math.max(rate, 0.05)),
  );
}

/**
 * Écrit dans `a` (décalage o) la matrice : racine (x, z, cap, échelle)
 * puis articulation p, rotation autour de X d'angle `swing`, et décalage du segment.
 */
function limb(
  a: Float32Array,
  o: number,
  x: number,
  y0: number,
  z: number,
  cy: number,
  sy: number,
  s: number,
  px: number,
  py: number,
  pz: number,
  swing: number,
  offset: number,
  sx = 1,
  syc = 1,
  sz = 1,
) {
  const ca = Math.cos(swing);
  const sa = Math.sin(swing);
  // q = p + Rx * (0, offset, 0)
  const qx = px;
  const qy = py + offset * ca;
  const qz = pz + offset * sa;
  a[o] = s * cy * sx;
  a[o + 1] = 0;
  a[o + 2] = -s * sy * sx;
  a[o + 3] = 0;
  a[o + 4] = s * sy * sa * syc;
  a[o + 5] = s * ca * syc;
  a[o + 6] = s * cy * sa * syc;
  a[o + 7] = 0;
  a[o + 8] = s * sy * ca * sz;
  a[o + 9] = -s * sa * sz;
  a[o + 10] = s * cy * ca * sz;
  a[o + 11] = 0;
  a[o + 12] = x + s * (cy * qx + sy * qz);
  a[o + 13] = y0 + s * qy;
  a[o + 14] = z + s * (-sy * qx + cy * qz);
  a[o + 15] = 1;
}

function zero(a: Float32Array, o: number) {
  for (let k = 0; k < 16; k++) a[o + k] = 0;
}

export function Crowd() {
  const head = useRef<InstancedMesh>(null);
  const torso = useRef<InstancedMesh>(null);
  const armL = useRef<InstancedMesh>(null);
  const armR = useRef<InstancedMesh>(null);
  const legL = useRef<InstancedMesh>(null);
  const legR = useRef<InstancedMesh>(null);
  const bag = useRef<InstancedMesh>(null);
  const hatTop = useRef<InstancedMesh>(null);
  const hatBrim = useRef<InstancedMesh>(null);
  const pack = useRef<InstancedMesh>(null);
  const umbTop = useRef<InstancedMesh>(null);
  const umbStick = useRef<InstancedMesh>(null);

  const sim = useMemo(() => {
    const kiosk = new Int16Array(N);
    const state = new Uint8Array(N);
    const x = new Float32Array(N);
    const z = new Float32Array(N);
    const yaw = new Float32Array(N);
    const delay = new Float32Array(N);
    const phase = new Float32Array(N);
    const stride = new Float32Array(N);
    const age = new Float32Array(N);
    const side = new Float32Array(N);
    const wp = new Uint8Array(N);
    const tone = new Uint8Array(N);
    const scale = new Float32Array(N);
    const acc = new Uint8Array(N);
    const cloth = new Uint8Array(N);
    const accent = new Uint8Array(N);
    const accent2 = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      kiosk[i] = Math.floor(i / PER_KIOSK);
      phase[i] = Math.random() * 10;
      tone[i] = Math.floor(Math.random() * TONES.length);
      const kid = Math.random() < 0.12;
      scale[i] = kid ? 0.58 + Math.random() * 0.1 : 0.86 + Math.random() * 0.26;
      acc[i] = rollAccessories(kid);
      cloth[i] = Math.floor(Math.random() * CLOTHES.length);
      accent[i] = Math.floor(Math.random() * ACCENTS.length);
      accent2[i] = Math.floor(Math.random() * ACCENTS.length);
    }
    const ks: KioskSim[] = kiosks.map((k, i) => {
      const s = signals[i];
      const r = 0.34 + 0.22 * s.signalIntensity;
      const spread = 0.2 * Math.abs(s.flow);
      return {
        queue: [],
        inRate: r * (1 + 0.6 * s.flow),
        outRate: r * (1 - 0.6 * s.flow),
        lower: Math.max(2, Math.round(k.target * (1 - spread)) - 1),
        upper: Math.min(MAX_SLOTS, Math.round(k.target * (1 + spread)) + 1),
        nextIn: 0,
        nextOut: 0,
      };
    });
    const slotIndex = new Int16Array(N);
    const moving = new Float32Array(N);
    return {
      kiosk,
      state,
      x,
      z,
      yaw,
      delay,
      phase,
      stride,
      age,
      side,
      wp,
      tone,
      scale,
      acc,
      cloth,
      accent,
      accent2,
      ks,
      slotIndex,
      moving,
    };
  }, []);

  const res = useMemo(
    () => ({
      head: new SphereGeometry(0.1, 12, 10),
      torso: new CylinderGeometry(0.08, 0.065, TORSO, 8),
      arm: new CylinderGeometry(0.024, 0.022, ARM, 5),
      leg: new CylinderGeometry(0.03, 0.026, LEG, 5),
      bag: new BoxGeometry(0.13, 0.15, 0.05),
      mat: new MeshStandardMaterial({ roughness: 0.7 }),
      hatTop: new CylinderGeometry(0.075, 0.085, 0.08, 10),
      hatBrim: new CylinderGeometry(0.15, 0.15, 0.012, 14),
      pack: new BoxGeometry(0.17, 0.2, 0.09),
      umbTop: new ConeGeometry(0.42, 0.16, 10),
      umbStick: new CylinderGeometry(0.008, 0.008, 0.62, 4),
      accMat: new MeshStandardMaterial({ roughness: 0.8 }),
    }),
    [],
  );

  const populate = (instant: boolean) => {
    const { state, x, z, yaw, delay, age, ks } = sim;
    state.fill(IDLE);
    kiosks.forEach((k, ki) => {
      const s = signals[ki];
      const q = ks[ki];
      q.queue = [];
      const initial = Math.min(
        MAX_SLOTS,
        Math.max(3, Math.round(k.target * (1 - 0.15 * s.flow))),
      );
      const face = Math.atan2(-k.dir.x, -k.dir.z);
      for (let j = 0; j < initial; j++) {
        const i = ki * PER_KIOSK + j;
        const slot = k.slots[j];
        q.queue.push(i);
        age[i] = instant ? 1 : 0;
        yaw[i] = face;
        if (instant) {
          state[i] = QUEUED;
          x[i] = slot.x;
          z[i] = slot.z;
          delay[i] = 0;
        } else {
          state[i] = APPROACH;
          const back = 4 + Math.random() * 3;
          x[i] = slot.x + k.dir.x * back + k.side.x * (Math.random() - 0.5) * 3;
          z[i] = slot.z + k.dir.z * back + k.side.z * (Math.random() - 0.5) * 3;
          delay[i] = 0.5 + j * 0.065 + Math.random() * 0.35;
        }
      }
      q.nextIn = expDelay(q.inRate) + (instant ? 0 : 4);
      q.nextOut = expDelay(q.outRate) + (instant ? 0 : 4.5);
    });
  };

  const lastSkip = useRef(-1);
  const meshes = () => [
    head.current,
    torso.current,
    armL.current,
    armR.current,
    legL.current,
    legR.current,
    bag.current,
    hatTop.current,
    hatBrim.current,
    pack.current,
    umbTop.current,
    umbStick.current,
  ];

  useEffect(() => {
    const s = sceneStore.get();
    populate(s.reducedMotion || s.intro === 'done');
    lastSkip.current = s.skipToken;
    for (const m of meshes()) m?.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  const tmp = useMemo(() => new Color(), []);

  useFrame((_, rawDt) => {
    const store = sceneStore.get();
    const dt = store.paused ? 0 : Math.min(rawDt, 0.05);
    const parts = meshes();
    if (parts.some((m) => !m)) return;
    const [mh, mt, mal, mar, mll, mlr, mb, mht, mhb, mp, mut, mus] =
      parts as InstancedMesh[];
    if (store.skipToken !== lastSkip.current) {
      lastSkip.current = store.skipToken;
      kiosks.forEach((k, ki) => {
        sim.ks[ki].queue.forEach((i, j) => {
          sim.state[i] = QUEUED;
          sim.delay[i] = 0;
          sim.age[i] = 1;
          sim.x[i] = k.slots[j].x;
          sim.z[i] = k.slots[j].z;
        });
      });
    }
    const {
      kiosk,
      state,
      x,
      z,
      yaw,
      delay,
      phase,
      stride,
      age,
      side,
      wp,
      tone,
      scale,
      acc,
      cloth,
      accent,
      accent2,
      ks,
      slotIndex,
      moving,
    } = sim;

    // Arrivées et départs
    if ((store.intro === 'done' || store.reducedMotion) && dt > 0) {
      for (let ki = 0; ki < kiosks.length; ki++) {
        const q = ks[ki];
        const k = kiosks[ki];
        q.nextIn -= dt;
        q.nextOut -= dt;
        if (q.nextOut <= 0) {
          q.nextOut = expDelay(q.outRate);
          const h = q.queue[0];
          if (
            h !== undefined &&
            state[h] === QUEUED &&
            q.queue.length > q.lower
          ) {
            const s0 = k.slots[0];
            if (Math.hypot(x[h] - s0.x, z[h] - s0.z) < 0.3) {
              q.queue.shift();
              state[h] = LEAVING;
              wp[h] = 0;
              side[h] = Math.random() < 0.5 ? -1 : 1;
            }
          }
        }
        if (q.nextIn <= 0) {
          q.nextIn = expDelay(q.inRate);
          if (q.queue.length < q.upper) {
            const base = ki * PER_KIOSK;
            for (let j = 0; j < PER_KIOSK; j++) {
              const i = base + j;
              if (state[i] !== IDLE) continue;
              const tail = k.slots[q.queue.length];
              const back = 3.5 + Math.random() * 2;
              state[i] = APPROACH;
              delay[i] = 0;
              age[i] = 0;
              x[i] =
                tail.x + k.dir.x * back + k.side.x * (Math.random() - 0.5) * 3;
              z[i] =
                tail.z + k.dir.z * back + k.side.z * (Math.random() - 0.5) * 3;
              tone[i] = Math.floor(Math.random() * TONES.length);
              cloth[i] = Math.floor(Math.random() * CLOTHES.length);
              accent[i] = Math.floor(Math.random() * ACCENTS.length);
              accent2[i] = Math.floor(Math.random() * ACCENTS.length);
              acc[i] = rollAccessories(scale[i] < 0.7);
              q.queue.push(i);
              break;
            }
          }
        }
      }
    }

    slotIndex.fill(-1);
    for (let ki = 0; ki < ks.length; ki++) {
      const q = ks[ki].queue;
      for (let j = 0; j < q.length; j++) slotIndex[q[j]] = j;
    }

    const ah = mh.instanceMatrix.array as Float32Array;
    const at = mt.instanceMatrix.array as Float32Array;
    const aal = mal.instanceMatrix.array as Float32Array;
    const aar = mar.instanceMatrix.array as Float32Array;
    const all = mll.instanceMatrix.array as Float32Array;
    const alr = mlr.instanceMatrix.array as Float32Array;
    const ab = mb.instanceMatrix.array as Float32Array;
    const aht = mht.instanceMatrix.array as Float32Array;
    const ahb = mhb.instanceMatrix.array as Float32Array;
    const ap = mp.instanceMatrix.array as Float32Array;
    const aut = mut.instanceMatrix.array as Float32Array;
    const aus = mus.instanceMatrix.array as Float32Array;

    for (let i = 0; i < N; i++) {
      const o = i * 16;
      const st = state[i];
      let sc = 0;
      if (st !== IDLE) {
        const k = kiosks[kiosk[i]];
        if (delay[i] > 0) {
          delay[i] -= dt;
        } else {
          age[i] += dt;
          let tx: number;
          let tz: number;
          let speed: number;
          if (st === LEAVING) {
            const sd = side[i];
            const p = k.position;
            if (wp[i] === 0) {
              tx = p.x + k.side.x * sd * 2.05 + k.dir.x * 1.1;
              tz = p.z + k.side.z * sd * 2.05 + k.dir.z * 1.1;
            } else if (wp[i] === 1) {
              tx = p.x + k.side.x * sd * 2.1 - k.dir.x * 1.6;
              tz = p.z + k.side.z * sd * 2.1 - k.dir.z * 1.6;
            } else {
              tx = p.x + k.side.x * sd * 1.6 - k.dir.x * 5.5;
              tz = p.z + k.side.z * sd * 1.6 - k.dir.z * 5.5;
            }
            speed = SPEED_LEAVE;
          } else {
            const slot = k.slots[Math.max(0, slotIndex[i])];
            tx = slot.x;
            tz = slot.z;
            speed = st === APPROACH ? SPEED_APPROACH : SPEED_SHIFT;
          }
          const dx = tx - x[i];
          const dz = tz - z[i];
          const dist = Math.hypot(dx, dz);
          const step = speed * dt;
          let targetYaw = yaw[i];
          if (dist > step && dist > 0.001) {
            x[i] += (dx / dist) * step;
            z[i] += (dz / dist) * step;
            targetYaw = Math.atan2(dx, dz);
            moving[i] = Math.min(1, moving[i] + dt * 6);
            phase[i] += dt * speed * 5.2;
          } else {
            x[i] = tx;
            z[i] = tz;
            if (st === APPROACH) state[i] = QUEUED;
            else if (st === LEAVING) {
              if (wp[i] < 2) wp[i]++;
              else state[i] = IDLE;
            }
            if (st !== LEAVING) targetYaw = Math.atan2(-k.dir.x, -k.dir.z);
            moving[i] = Math.max(0, moving[i] - dt * 5);
          }
          // Rotation lissée vers le cap
          let dy = targetYaw - yaw[i];
          dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          yaw[i] += dy * Math.min(1, dt * 8);
          stride[i] = moving[i];
          sc = Math.min(1, age[i] / 0.35);
          if (st === LEAVING && wp[i] === 2)
            sc = Math.min(sc, Math.max(0, dist / 2.2 - 0.15));
        }
      }

      if (sc <= 0) {
        zero(ah, o);
        zero(at, o);
        zero(aal, o);
        zero(aar, o);
        zero(all, o);
        zero(alr, o);
        zero(ab, o);
        zero(aht, o);
        zero(ahb, o);
        zero(ap, o);
        zero(aut, o);
        zero(aus, o);
        continue;
      }
      const s = sc * scale[i];
      const cy = Math.cos(yaw[i]);
      const sy = Math.sin(yaw[i]);
      const w = Math.sin(phase[i]) * 0.55 * stride[i];
      const bob = Math.abs(Math.cos(phase[i])) * 0.025 * stride[i];
      const idle = (1 - stride[i]) * Math.sin(phase[i] * 0.3 + i) * 0.03;
      const X = x[i];
      const Z = z[i];
      const Y = bob;
      limb(ah, o, X, Y, Z, cy, sy, s, 0, HEAD_Y, 0, 0, 0);
      limb(at, o, X, Y, Z, cy, sy, s, 0, HIP, 0, idle, TORSO / 2);
      limb(
        aal,
        o,
        X,
        Y,
        Z,
        cy,
        sy,
        s,
        -0.07,
        SHOULDER,
        0,
        -w * 0.8 + 0.05,
        -ARM / 2,
      );
      limb(
        aar,
        o,
        X,
        Y,
        Z,
        cy,
        sy,
        s,
        0.07,
        SHOULDER,
        0,
        w * 0.8 + 0.05,
        -ARM / 2,
      );
      limb(all, o, X, Y, Z, cy, sy, s, -0.055, HIP, 0, w, -LEG / 2);
      limb(alr, o, X, Y, Z, cy, sy, s, 0.055, HIP, 0, -w, -LEG / 2);
      const a = acc[i];
      if (a & A_BAG)
        limb(
          ab,
          o,
          X,
          Y,
          Z,
          cy,
          sy,
          s,
          0.12,
          SHOULDER - ARM - 0.06,
          0.02 + Math.sin(w * 0.8) * 0.3,
          0,
          0,
        );
      else zero(ab, o);
      if (a & A_HAT) {
        limb(aht, o, X, Y, Z, cy, sy, s, 0, HEAD_Y + 0.1, 0, 0, 0);
        limb(ahb, o, X, Y, Z, cy, sy, s, 0, HEAD_Y + 0.065, 0.02, 0, 0);
      } else {
        zero(aht, o);
        zero(ahb, o);
      }
      if (a & A_PACK)
        limb(ap, o, X, Y, Z, cy, sy, s, 0, SHOULDER - 0.13, -0.12, 0, 0);
      else zero(ap, o);
      if (a & A_UMBRELLA) {
        limb(aut, o, X, Y, Z, cy, sy, s, 0.08, HEAD_Y + 0.42, 0.04, 0, 0);
        limb(aus, o, X, Y, Z, cy, sy, s, 0.08, HEAD_Y + 0.11, 0.04, 0, 0);
      } else {
        zero(aut, o);
        zero(aus, o);
      }

      const fade = (1 - kioskDim[kiosk[i]]) * 0.85;
      tmp.copy(TONES[tone[i]]).lerp(FADE, fade);
      mh.setColorAt(i, tmp);
      mal.setColorAt(i, tmp);
      mar.setColorAt(i, tmp);
      mll.setColorAt(i, tmp);
      mlr.setColorAt(i, tmp);
      mus.setColorAt(i, tmp);
      tmp.copy(CLOTHES[cloth[i]]).lerp(FADE, fade);
      mt.setColorAt(i, tmp);
      tmp.copy(ACCENTS[accent[i]]).lerp(FADE, fade);
      mb.setColorAt(i, tmp);
      mht.setColorAt(i, tmp);
      mhb.setColorAt(i, tmp);
      tmp.copy(ACCENTS[accent2[i]]).lerp(FADE, fade);
      mp.setColorAt(i, tmp);
      mut.setColorAt(i, tmp);
    }
    for (const m of parts as InstancedMesh[]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  });

  const common = { frustumCulled: false, castShadow: true } as const;
  return (
    <>
      <instancedMesh ref={head} args={[res.head, res.mat, N]} {...common} />
      <instancedMesh ref={torso} args={[res.torso, res.mat, N]} {...common} />
      <instancedMesh ref={armL} args={[res.arm, res.mat, N]} {...common} />
      <instancedMesh ref={armR} args={[res.arm, res.mat, N]} {...common} />
      <instancedMesh ref={legL} args={[res.leg, res.mat, N]} {...common} />
      <instancedMesh ref={legR} args={[res.leg, res.mat, N]} {...common} />
      <instancedMesh ref={bag} args={[res.bag, res.accMat, N]} {...common} />
      <instancedMesh
        ref={hatTop}
        args={[res.hatTop, res.accMat, N]}
        {...common}
      />
      <instancedMesh
        ref={hatBrim}
        args={[res.hatBrim, res.accMat, N]}
        {...common}
      />
      <instancedMesh ref={pack} args={[res.pack, res.accMat, N]} {...common} />
      <instancedMesh
        ref={umbTop}
        args={[res.umbTop, res.accMat, N]}
        {...common}
      />
      <instancedMesh
        ref={umbStick}
        args={[res.umbStick, res.mat, N]}
        {...common}
      />
    </>
  );
}
