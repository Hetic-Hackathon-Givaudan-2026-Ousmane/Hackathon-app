import { CatmullRomCurve3, Vector3 } from 'three';
import { signals } from '../data/signals.ts';

/**
 * Les kiosques sont posés sur un arc (amphithéâtre) tourné vers le spectateur.
 * Les files serpentent depuis chaque kiosque vers la caméra ; les clients servis
 * repartent derrière la rangée de kiosques.
 */
export const ARC_RADIUS = 36;
export const ARC_SPREAD = (26 * Math.PI) / 180;
export const ARC_CENTER = new Vector3(0, 0, ARC_RADIUS);

export const SLOT_SPACING = 0.44;
export const MAX_SLOTS = 40;

export interface KioskLayout {
  id: string;
  index: number;
  angle: number;
  position: Vector3;
  /** Direction de la file (vers la caméra) */
  dir: Vector3;
  /** Vecteur latéral (droite de la file) */
  side: Vector3;
  slots: Vector3[];
  /** Nombre cible de personnes, dérivé de signalIntensity */
  target: number;
}

function toWorld(
  origin: Vector3,
  dir: Vector3,
  side: Vector3,
  lateral: number,
  along: number,
) {
  return origin
    .clone()
    .addScaledVector(side, lateral)
    .addScaledVector(dir, along);
}

export const kiosks: KioskLayout[] = signals.map((s, i) => {
  const n = signals.length;
  const angle = -ARC_SPREAD + (2 * ARC_SPREAD * i) / (n - 1);
  const position = new Vector3(
    ARC_CENTER.x + ARC_RADIUS * Math.sin(angle),
    0,
    ARC_CENTER.z - ARC_RADIUS * Math.cos(angle),
  );
  const dir = ARC_CENTER.clone().sub(position).setY(0).normalize();
  const side = new Vector3(dir.z, 0, -dir.x);

  // Serpentin : départ au comptoir puis zigzags qui s'éloignent du kiosque.
  const pts: Vector3[] = [toWorld(position, dir, side, 0, 1.75)];
  const legs = 8;
  for (let k = 0; k < legs; k++) {
    const lateral = k % 2 === 0 ? 0.95 : -0.95;
    pts.push(toWorld(position, dir, side, lateral, 2.6 + k * 1.55));
  }
  const curve = new CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const len = curve.getLength();
  const slots: Vector3[] = [];
  for (let k = 0; k < MAX_SLOTS; k++) {
    const t = Math.min(1, (k * SLOT_SPACING) / len);
    slots.push(curve.getPointAt(t));
  }
  const target = Math.round(5 + s.signalIntensity * 25);
  return { id: s.id, index: i, angle, position, dir, side, slots, target };
});

export const kioskById = new Map(kiosks.map((k) => [k.id, k]));

/** Point vers lequel la caméra regarde en vue d'ensemble. */
export const OVERVIEW_TARGET = new Vector3(0, 2.5, 1);
