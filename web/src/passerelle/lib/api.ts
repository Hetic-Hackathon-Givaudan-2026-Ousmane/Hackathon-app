import { fallbackBrief, fallbackVerdict } from '../data/fallbacks.ts';
import type { BriefResponse, Signal, VerdictResponse } from '../data/types.ts';

const TIMEOUT_MS = 25000;
const memo = new Map<string, Promise<unknown>>();

async function post<T>(path: string, id: string): Promise<T> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(t);
  }
}

/** Verdict IA, mis en cache par id. Si le serveur ne répond pas, repli local marqué. */
export function fetchVerdict(s: Signal): Promise<VerdictResponse> {
  const key = `verdict:${s.id}`;
  let p = memo.get(key) as Promise<VerdictResponse> | undefined;
  if (!p) {
    p = post<VerdictResponse>('/api/verdict', s.id).catch(() => {
      memo.delete(key); // on retentera à la prochaine ouverture
      return { ...fallbackVerdict(s), source: 'secours' as const };
    });
    memo.set(key, p);
  }
  return p;
}

export function fetchBrief(s: Signal): Promise<BriefResponse> {
  const key = `brief:${s.id}`;
  let p = memo.get(key) as Promise<BriefResponse> | undefined;
  if (!p) {
    p = post<BriefResponse>('/api/brief', s.id).catch(() => {
      memo.delete(key);
      return { brief: fallbackBrief(s), source: 'secours' as const };
    });
    memo.set(key, p);
  }
  return p;
}
