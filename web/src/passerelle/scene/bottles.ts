import { LatheGeometry, Vector2 } from 'three';

/**
 * Huit profils de flacons génériques, définis comme des demi-silhouettes
 * (rayon, hauteur) puis révolutionnés. Aucun flacon existant n'est reproduit.
 */
type Profile = {
  pts: [number, number][];
  segments: number;
  neck: number;
  capH: number;
  capR: number;
  capSegments: number;
};

const P: Profile[] = [
  // Galet rond
  {
    pts: [
      [0, 0],
      [0.42, 0.02],
      [0.6, 0.22],
      [0.64, 0.5],
      [0.56, 0.82],
      [0.3, 1.0],
      [0.16, 1.06],
    ],
    segments: 40,
    neck: 1.06,
    capH: 0.34,
    capR: 0.2,
    capSegments: 32,
  },
  // Colonne facettée
  {
    pts: [
      [0, 0],
      [0.4, 0],
      [0.42, 0.05],
      [0.42, 1.2],
      [0.3, 1.32],
      [0.14, 1.36],
    ],
    segments: 6,
    neck: 1.36,
    capH: 0.3,
    capR: 0.22,
    capSegments: 6,
  },
  // Goutte
  {
    pts: [
      [0, 0],
      [0.3, 0.02],
      [0.52, 0.2],
      [0.56, 0.42],
      [0.42, 0.78],
      [0.2, 1.06],
      [0.12, 1.14],
    ],
    segments: 40,
    neck: 1.14,
    capH: 0.42,
    capR: 0.13,
    capSegments: 24,
  },
  // Bloc octogonal trapu
  {
    pts: [
      [0, 0],
      [0.62, 0],
      [0.66, 0.06],
      [0.66, 0.66],
      [0.5, 0.78],
      [0.16, 0.82],
    ],
    segments: 8,
    neck: 0.82,
    capH: 0.36,
    capR: 0.26,
    capSegments: 8,
  },
  // Amphore
  {
    pts: [
      [0, 0],
      [0.24, 0],
      [0.36, 0.14],
      [0.54, 0.5],
      [0.5, 0.86],
      [0.24, 1.08],
      [0.18, 1.24],
      [0.16, 1.3],
    ],
    segments: 36,
    neck: 1.3,
    capH: 0.28,
    capR: 0.19,
    capSegments: 28,
  },
  // Cône inversé
  {
    pts: [
      [0, 0],
      [0.22, 0],
      [0.3, 0.06],
      [0.58, 1.0],
      [0.48, 1.1],
      [0.14, 1.14],
    ],
    segments: 28,
    neck: 1.14,
    capH: 0.3,
    capR: 0.18,
    capSegments: 28,
  },
  // Disque plat
  {
    pts: [
      [0, 0],
      [0.5, 0.02],
      [0.7, 0.16],
      [0.72, 0.34],
      [0.6, 0.5],
      [0.26, 0.6],
      [0.14, 0.64],
    ],
    segments: 44,
    neck: 0.64,
    capH: 0.48,
    capR: 0.15,
    capSegments: 6,
  },
  // Épaulé hexagonal
  {
    pts: [
      [0, 0],
      [0.48, 0],
      [0.5, 0.05],
      [0.5, 0.86],
      [0.3, 1.04],
      [0.15, 1.08],
    ],
    segments: 12,
    neck: 1.08,
    capH: 0.4,
    capR: 0.24,
    capSegments: 12,
  },
];

export interface BottleGeometry {
  glass: LatheGeometry;
  liquid: LatheGeometry;
  neck: number;
  capH: number;
  capR: number;
  capSegments: number;
}

const cache = new Map<number, BottleGeometry>();

export function bottleGeometry(index: number): BottleGeometry {
  const hit = cache.get(index);
  if (hit) return hit;
  const p = P[index % P.length];
  const glass = new LatheGeometry(
    p.pts.map(([r, y]) => new Vector2(r, y)),
    p.segments,
  );
  // Liquide : même profil, plus étroit, rempli aux deux tiers.
  const maxY = p.neck * 0.7;
  const liquidPts = p.pts
    .filter(([, y]) => y <= maxY)
    .map(([r, y]) => new Vector2(Math.max(0, r * 0.86), Math.max(0.04, y)));
  liquidPts.push(new Vector2(0, liquidPts[liquidPts.length - 1].y));
  const liquid = new LatheGeometry(liquidPts, p.segments);
  const g = {
    glass,
    liquid,
    neck: p.neck,
    capH: p.capH,
    capR: p.capR,
    capSegments: p.capSegments,
  };
  cache.set(index, g);
  return g;
}
