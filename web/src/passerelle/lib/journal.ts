import { useSyncExternalStore } from 'react';
import type { Verdict } from '../data/types.ts';

/**
 * Journal de l'analyste : décisions et vérification des sources, par tendance.
 * Conservé dans le navigateur ; l'application fonctionne aussi si le stockage est bloqué.
 */
export type SourceStatus = 'verifiee' | 'a-confirmer' | null;

interface JournalState {
  decisions: Record<string, { verdict: Verdict; at: string }>;
  sources: Record<string, SourceStatus[]>;
}

const KEY = 'passerelle.journal.v1';
let state: JournalState = load();
const listeners = new Set<() => void>();

function load(): JournalState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as JournalState;
  } catch {
    /* stockage indisponible */
  }
  return { decisions: {}, sources: {} };
}

function commit(next: JournalState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* on garde l'état en mémoire */
  }
  listeners.forEach((l) => l());
}

export const journal = {
  setDecision(id: string, verdict: Verdict) {
    commit({
      ...state,
      decisions: {
        ...state.decisions,
        [id]: { verdict, at: new Date().toISOString() },
      },
    });
  },
  setSourceStatus(
    id: string,
    index: number,
    count: number,
    status: SourceStatus,
  ) {
    const current =
      state.sources[id] ?? Array.from({ length: count }, () => null);
    const list = Array.from({ length: count }, (_, i) =>
      i === index ? status : (current[i] ?? null),
    );
    commit({ ...state, sources: { ...state.sources, [id]: list } });
  },
};

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useJournal(): JournalState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function statusesFor(
  j: JournalState,
  id: string,
  count: number,
): SourceStatus[] {
  const s = j.sources[id] ?? [];
  return Array.from({ length: count }, (_, i) => s[i] ?? null);
}
