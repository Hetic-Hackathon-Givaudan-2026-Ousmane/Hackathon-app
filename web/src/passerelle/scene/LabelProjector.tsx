import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Vector3 } from 'three';
import { kiosks } from './layout.ts';
import { labelEls, labelLayer, leaderEls } from './labelRegistry.ts';

/** Espace minimal entre deux pancartes, en pixels. */
const GAP = 8;

interface Slot {
  i: number;
  x: number;
  /** Bas de la pancarte souhaité (ancre au-dessus du stand) */
  y0: number;
  /** Bas retenu après placement */
  y: number;
  w: number;
  h: number;
}

/**
 * Projette l'ancre de chaque pancarte (au-dessus du stand) en coordonnées écran,
 * puis résout les chevauchements : une pancarte qui en toucherait une autre est
 * remontée juste au-dessus, et un trait fin la relie à son stand.
 */
export function LabelProjector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const anchors = useMemo(
    () =>
      kiosks.map((k) =>
        k.position.clone().addScaledVector(k.dir, -0.4).setY(2.6),
      ),
    [],
  );
  const v = useMemo(() => new Vector3(), []);
  const last = useMemo(() => new Map<string, string>(), []);
  const slots = useMemo<Slot[]>(
    () => kiosks.map((_, i) => ({ i, x: 0, y0: 0, y: 0, w: 0, h: 0 })),
    [],
  );
  const order = useMemo(() => slots.slice(), [slots]);

  useFrame(() => {
    // 1. Lectures (tailles), puis projection des ancres.
    for (const s of slots) {
      const el = labelEls.get(kiosks[s.i].id);
      s.w = el ? el.offsetWidth : 0;
      s.h = el ? el.offsetHeight : 0;
      v.copy(anchors[s.i]).project(camera);
      s.x = (v.x * 0.5 + 0.5) * size.width;
      s.y0 = (-v.y * 0.5 + 0.5) * size.height;
      s.y = s.y0;
    }

    // Stands serrés à l'écran : pancartes compactes (décision sur les ancres seules, donc stable).
    let minDx = Infinity;
    const xs = slots.map((s) => s.x).sort((a, b) => a - b);
    for (let k = 1; k < xs.length; k++)
      minDx = Math.min(minDx, xs[k] - xs[k - 1]);
    const dense = minDx < 150 ? 'true' : 'false';
    if (labelLayer.el && labelLayer.el.dataset.dense !== dense)
      labelLayer.el.dataset.dense = dense;

    // 2. Placement : du plus bas à l'écran au plus haut ; chaque pancarte
    //    remonte tant qu'elle touche une pancarte déjà placée.
    order.sort((a, b) => b.y0 - a.y0 || a.x - b.x);
    for (let k = 0; k < order.length; k++) {
      const s = order[k];
      if (!s.w) continue;
      let moved = true;
      let guard = 0;
      while (moved && guard++ < 16) {
        moved = false;
        for (let m = 0; m < k; m++) {
          const p = order[m];
          if (!p.w) continue;
          const overlapX = Math.abs(s.x - p.x) < (s.w + p.w) / 2 + GAP;
          const overlapY = s.y > p.y - p.h - GAP && s.y - s.h - GAP < p.y;
          if (overlapX && overlapY) {
            s.y = p.y - p.h - GAP;
            moved = true;
          }
        }
      }
    }

    // 3. Écritures : position de chaque pancarte et longueur de son trait de rappel.
    for (const s of slots) {
      const id = kiosks[s.i].id;
      const el = labelEls.get(id);
      if (!el) continue;
      const y = Math.max(s.y, s.h + 80); // reste sous l'en-tête
      const t = `translate3d(${s.x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      const lead = Math.max(0, s.y0 - y);
      const key = `${t}|${lead.toFixed(0)}`;
      if (last.get(id) === key) continue;
      last.set(id, key);
      el.style.transform = t;
      const leader = leaderEls.get(id);
      if (leader) leader.style.height = `${lead.toFixed(0)}px`;
    }
  });
  return null;
}
