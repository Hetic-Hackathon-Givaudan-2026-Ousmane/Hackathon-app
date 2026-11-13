import raw from './signals.json';
import type { Signal } from './types.ts';

export const signals = raw as Signal[];

const byId = new Map(signals.map((s) => [s.id, s]));

export function getSignal(id: string | undefined): Signal | undefined {
  return id ? byId.get(id) : undefined;
}

if (import.meta.env.DEV) {
  // Garde-fous de cohérence, en développement uniquement.
  for (const s of signals) {
    const types = new Set(s.sources.map((x) => x.type)).size;
    if (s.verdict === 'Suivre' && types < 3)
      console.warn(`[données] ${s.id} : Suivre exige 3 types de sources`);
    if (s.signalIntensity < 0 || s.signalIntensity > 1)
      console.warn(`[données] ${s.id} : intensité hors bornes`);
    if (s.flow < -1 || s.flow > 1)
      console.warn(`[données] ${s.id} : flux hors bornes`);
  }
}
