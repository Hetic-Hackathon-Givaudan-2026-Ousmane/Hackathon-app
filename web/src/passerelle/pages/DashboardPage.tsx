import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { signals } from '../data/signals.ts';
import {
  STAGE_LABEL,
  STAGE_ORDER,
  sourceTypeCount,
  type Signal,
} from '../data/types.ts';
import { useJournal } from '../lib/journal.ts';
import { useFocusOnMount } from '../lib/useFocusOnMount.ts';
import { AppHeader } from '../ui/AppHeader.tsx';
import ui from '../ui/ui.module.css';
import styles from './pages.module.css';

type Key = 'name' | 'stage' | 'verdict' | 'decision' | 'types';
type Dir = 'ascending' | 'descending';

const RANK = { Suivre: 0, Observer: 1, Ignorer: 2 } as const;

const COLUMNS: { key: Key; label: string }[] = [
  { key: 'name', label: 'Tendance' },
  { key: 'stage', label: 'Stade' },
  { key: 'verdict', label: 'Proposition' },
  { key: 'decision', label: 'Votre décision' },
  { key: 'types', label: 'Types de sources' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const j = useJournal();
  const [sort, setSort] = useState<{ key: Key; dir: Dir }>({
    key: 'verdict',
    dir: 'ascending',
  });
  const titleRef = useFocusOnMount<HTMLHeadingElement>();

  const rows = useMemo(() => {
    const decisionRank = (s: Signal) => {
      const d = j.decisions[s.id]?.verdict;
      return d ? RANK[d] : 3;
    };
    const cmp = (a: Signal, b: Signal): number => {
      switch (sort.key) {
        case 'name':
          return a.name.localeCompare(b.name, 'fr');
        case 'stage':
          return STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
        case 'verdict':
          return RANK[a.verdict] - RANK[b.verdict];
        case 'decision':
          return decisionRank(a) - decisionRank(b);
        case 'types':
          return sourceTypeCount(b) - sourceTypeCount(a);
      }
    };
    const sorted = signals.toSorted(
      (a, b) => cmp(a, b) || a.name.localeCompare(b.name, 'fr'),
    );
    return sort.dir === 'ascending' ? sorted : sorted.toReversed();
  }, [sort, j]);

  const decided = signals.filter((s) => j.decisions[s.id]).length;
  const kpis = [
    {
      value: signals.filter((s) => s.verdict === 'Suivre').length,
      label: 'Propositions Suivre',
    },
    {
      value: signals.filter((s) => s.stage === 'hausse').length,
      label: 'Tendances en hausse',
    },
    { value: decided, label: 'Décisions prises' },
  ];
  const simulated = signals.filter((s) => s.isSimulated).length;

  const toggle = (key: Key) =>
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === 'ascending' ? 'descending' : 'ascending',
    }));

  return (
    <div className={styles.shell}>
      <AppHeader
        tag={`Données simulées : ${simulated} sur ${signals.length}`}
      />
      <main className={styles.main}>
        <section className={styles.heading} aria-labelledby="dash-title">
          <div>
            <h1 id="dash-title" ref={titleRef} tabIndex={-1}>
              Tableau de bord
            </h1>
            <p className={styles.subtitle}>
              Les huit tendances de la place. Seul le chocolat de Dubaï et
              pistache repose sur des sources réelles.
            </p>
          </div>
        </section>

        <ul className={styles.kpis} aria-label="Indicateurs">
          {kpis.map((k) => (
            <li key={k.label} className={`${ui.card} ${styles.metric}`}>
              <p className={ui.label}>{k.label}</p>
              <p className={styles.kpiValue}>
                {k.value}
                <span className={styles.small}> sur {signals.length}</span>
              </p>
            </li>
          ))}
        </ul>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">
              Tendances, triées par{' '}
              {COLUMNS.find((c) => c.key === sort.key)?.label.toLowerCase()}
            </caption>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={sort.key === c.key ? sort.dir : 'none'}
                  >
                    <button
                      type="button"
                      className={styles.sortButton}
                      data-active={sort.key === c.key ? sort.dir : undefined}
                      onClick={() => toggle(c.key)}
                    >
                      {c.label}
                      <span className={styles.sortArrow} aria-hidden="true" />
                    </button>
                  </th>
                ))}
                <th scope="col">Délai goût vers parfum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const d = j.decisions[s.id]?.verdict;
                return (
                  <tr key={s.id} onClick={() => navigate(`/tendance/${s.id}`)}>
                    <th scope="row">
                      <Link
                        to={`/tendance/${s.id}`}
                        className={styles.rowLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {s.name}
                      </Link>
                      <span className={styles.small}>
                        {s.isSimulated ? ' (simulée)' : ' (cas réel)'}
                      </span>
                    </th>
                    <td>{STAGE_LABEL[s.stage]}</td>
                    <td>{s.verdict}</td>
                    <td className={d ? undefined : styles.mutedText}>
                      {d ?? 'Pas encore décidé'}
                    </td>
                    <td className="tabular">{sourceTypeCount(s)} sur 3</td>
                    <td
                      className={s.gustoToPerfumeDelay ? undefined : ui.pending}
                    >
                      {s.gustoToPerfumeDelay ?? 'À confirmer'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
