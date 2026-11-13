import { useSyncExternalStore } from 'react';
import type { Verdict } from '../data/types.ts';

/**
 * Journal de l'analyste : décisions et vérification des sources, par tendance.
 * Enregistré dans PostgreSQL via l'API ; le navigateur garde une copie locale,
 * utilisée seulement si l'API ne répond pas.
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

function isJournalState(value: unknown): value is JournalState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.decisions === 'object' &&
    v.decisions !== null &&
    typeof v.sources === 'object' &&
    v.sources !== null
  );
}

// L'état de la base remplace la copie locale dès que l'API répond
async function hydrate() {
  try {
    const res = await fetch('/api/journal');
    if (!res.ok) return;
    const data: unknown = await res.json();
    if (isJournalState(data)) commit(data);
  } catch {
    /* API indisponible : on garde la copie locale */
  }
}

function save(path: string, body: unknown) {
  fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {
    /* la copie locale reste à jour */
  });
}

void hydrate();

export const journal = {
  setDecision(id: string, verdict: Verdict) {
    commit({
      ...state,
      decisions: {
        ...state.decisions,
        [id]: { verdict, at: new Date().toISOString() },
      },
    });
    save(`/api/journal/decisions/${encodeURIComponent(id)}`, { verdict });
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
    save(`/api/journal/sources/${encodeURIComponent(id)}/${index}`, { status });
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
