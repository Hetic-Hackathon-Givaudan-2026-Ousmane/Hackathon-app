import { Link, Navigate, useParams } from 'react-router';
import { getSignal } from '../data/signals.ts';
import { labelText, SOURCE_TYPE_LABEL } from '../data/types.ts';
import { formatDate } from '../lib/format.ts';
import { journal, statusesFor, useJournal } from '../lib/journal.ts';
import { useFocusOnMount } from '../lib/useFocusOnMount.ts';
import { AppHeader } from '../ui/AppHeader.tsx';
import { Badge } from '../ui/Badge.tsx';
import ui from '../ui/ui.module.css';
import styles from './pages.module.css';

export default function SourcesPage() {
  const { id } = useParams();
  const signal = getSignal(id);
  const j = useJournal();
  const titleRef = useFocusOnMount<HTMLHeadingElement>(id);
  if (!signal) return <Navigate to="/" replace />;

  const n = signal.sources.length;
  const statuses = statusesFor(j, signal.id, n);
  const verified = statuses.filter((s) => s === 'verifiee').length;
  const unconfirmed = n - verified;

  const summary =
    verified === n
      ? 'Toutes les sources sont vérifiées'
      : verified === 0
        ? 'Aucune source vérifiée pour l’instant'
        : unconfirmed === 1
          ? '1 source non confirmée sera signalée dans le brief'
          : `${unconfirmed} sources non confirmées seront signalées dans le brief`;

  return (
    <div className={styles.shell}>
      <AppHeader
        back={{
          to: `/tendance/${signal.id}`,
          label: 'Retour à la fiche tendance',
        }}
        tag={signal.isSimulated ? 'Données simulées' : 'Cas de démonstration'}
      />

      <main className={styles.main}>
        <section
          className={styles.heading}
          aria-labelledby="sources-page-title"
        >
          <div>
            <h1 id="sources-page-title" ref={titleRef} tabIndex={-1}>
              Sources du verdict
            </h1>
            <p className={styles.subtitle}>
              {signal.name} : vérifiez chaque source avant d’envoyer le brief.
            </p>
          </div>
          <p className={styles.counter} aria-live="polite">
            {verified} source{verified > 1 ? 's' : ''} vérifiée
            {verified > 1 ? 's' : ''} sur {n}
          </p>
        </section>

        <ul className={styles.verificationList} aria-label="Sources à vérifier">
          {signal.sources.map((s, i) => {
            const status = statuses[i];
            return (
              <li
                key={i}
                className={`${ui.card} ${styles.verification}`}
                data-status={status ?? undefined}
              >
                <div className={styles.verificationContent}>
                  <div>
                    <p className={ui.label}>{SOURCE_TYPE_LABEL[s.type]}</p>
                    <p>{s.outlet}</p>
                    <p className={ui.label}>{formatDate(s.date)}</p>
                  </div>
                  <div>
                    <p>{s.excerpt}</p>
                    <Badge kind={s.label === 'Fait' ? 'fait' : 'recit'}>
                      {labelText(s)}
                    </Badge>
                  </div>
                  <div>
                    <p className={ui.label}>Résumé (à relire)</p>
                    <p>{s.summary}</p>
                    {s.label === 'Récit' ? (
                      <p className={styles.warning}>
                        Récit non confirmé : à vérifier avant de conclure
                        {s.type === 'perfume'
                          ? ' sur le délai goût vers parfum'
                          : ''}
                        .
                      </p>
                    ) : null}
                  </div>
                  {s.url ? (
                    <a
                      className={ui.link}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`Ouvrir la source : ${s.outlet} (nouvel onglet)`}
                    >
                      Ouvrir la source
                    </a>
                  ) : (
                    <span className={ui.label}>Lien non fourni</span>
                  )}
                </div>
                <div
                  className={styles.choice}
                  role="group"
                  aria-label={`Statut : ${SOURCE_TYPE_LABEL[s.type]}`}
                >
                  <button
                    type="button"
                    className={`${ui.button} ${styles.choiceVerified}`}
                    aria-pressed={status === 'verifiee'}
                    onClick={() =>
                      journal.setSourceStatus(
                        signal.id,
                        i,
                        n,
                        status === 'verifiee' ? null : 'verifiee',
                      )
                    }
                  >
                    Vérifiée
                  </button>
                  <button
                    type="button"
                    className={`${ui.button} ${styles.choiceConfirm}`}
                    aria-pressed={status === 'a-confirmer'}
                    onClick={() =>
                      journal.setSourceStatus(
                        signal.id,
                        i,
                        n,
                        status === 'a-confirmer' ? null : 'a-confirmer',
                      )
                    }
                  >
                    À confirmer
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <p className={styles.note}>
          {signal.isSimulated
            ? 'Données simulées pour la démonstration : aucune source réelle à ouvrir.'
            : 'Données de démonstration : Gulf News, 07/10/2025 ; Journal du Luxe. Les liens mènent à l’accueil de chaque publication.'}
        </p>
      </main>

      <aside className={styles.workflowBar} aria-label="Étape suivante">
        <div className={styles.barInner}>
          <p aria-live="polite">{summary}</p>
          <Link
            to={`/tendance/${signal.id}/brief`}
            className={`${ui.button} ${ui.primary}`}
          >
            Passer au brief
          </Link>
        </div>
      </aside>
    </div>
  );
}
