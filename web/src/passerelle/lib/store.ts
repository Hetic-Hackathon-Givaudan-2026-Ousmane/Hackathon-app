import { useSyncExternalStore } from 'react';

export type IntroState = 'running' | 'done';

export interface SceneState {
  hoveredId: string | null;
  focusedId: string | null;
  selectedId: string | null;
  intro: IntroState;
  /** Animation de la foule et des anneaux en pause (WCAG 2.2.2) */
  paused: boolean;
  reducedMotion: boolean;
  /** Incrémenté à chaque "Passer" pour que la foule se place instantanément */
  skipToken: number;
}

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

let state: SceneState = {
  hoveredId: null,
  focusedId: null,
  selectedId: null,
  intro: 'running',
  paused: false,
  reducedMotion: !!prefersReduced,
  skipToken: 0,
};

const listeners = new Set<() => void>();

export const sceneStore = {
  get: () => state,
  set(patch: Partial<SceneState>) {
    let changed = false;
    for (const k in patch) {
      const key = k as keyof SceneState;
      if (state[key] !== patch[key]) changed = true;
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

if (typeof window !== 'undefined' && window.matchMedia) {
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', (e) => {
      sceneStore.set({ reducedMotion: e.matches });
    });
}

/** Abonnement à une valeur dérivée : ne re-rend que si la valeur change. */
export function useScene<T>(selector: (s: SceneState) => T): T {
  return useSyncExternalStore(
    sceneStore.subscribe,
    () => selector(sceneStore.get()),
    () => selector(sceneStore.get()),
  );
}

/** Kiosque actuellement mis en avant (survol souris, sinon focus clavier). */
export function activeId(s: SceneState): string | null {
  return s.selectedId ?? s.hoveredId ?? s.focusedId;
}
