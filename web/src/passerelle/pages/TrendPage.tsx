import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { getSignal } from '../data/signals.ts';
import {
  CORE_TYPES,
  labelText,
  SOURCE_TYPE_LABEL,
  STAGE_LABEL,
  STAGE_ORDER,
  sourceTypeCount,
  type Verdict,
  type VerdictResponse,
} from '../data/types.ts';
import { fetchVerdict } from '../lib/api.ts';
import { journal, useJournal } from '../lib/journal.ts';
import { useFocusOnMount } from '../lib/useFocusOnMount.ts';
import { AppHeader } from '../ui/AppHeader.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Passerelle } from '../ui/Passerelle.tsx';
import ui from '../ui/ui.module.css';
import styles from './pages.module.css';

const DECISION_CLASS: Record<Verdict, string> = {
  Suivre: ui.follow,
  Observer: ui.watch,
  Ignorer: ui.ignore,
};

export default function TrendPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const signal = getSignal(id);
  const j = useJournal();
  const [proposal, setProposal] = useState<VerdictResponse | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const titleRef = useFocusOnMount<HTMLHeadingElement>(id);

  useEffect(() => {
    if (!signal) return;
    let live = true;
    setProposal(null);
    fetchVerdict(signal).then((r) => live && setProposal(r));
    return () => {
      live = false;
    };
  }, [signal]);

  useEffect(() => {
    if (signal) document.title = `${signal.name} : Passerelle`;
    return () => {
      document.title = 'Passerelle';
    };
  }, [signal]);

  if (!signal) return <Navigate to="/" replace />;

  const decision = j.decisions[signal.id]?.verdict ?? null;
  const coreSources = signal.sources.filter((s) => CORE_TYPES.includes(s.type));
  const types = sourceTypeCount(signal);
  const stageIndex = STAGE_ORDER.indexOf(signal.stage);
  const outlets = [
    ...new Set(signal.sources.map((s) => s.outlet.split(',')[0])),
  ].join(' ; ');

  const decide = (v: Verdict) => {
    journal.setDecision(signal.id, v);
    setJustSaved(true);
    if (v === 'Suivre') navigate(`/tendance/${signal.id}/brief`);
  };

  return (
    <div className={styles.shell} data-bar="decision">
      <AppHeader
        tag={signal.isSimulated ? 'Données simulées' : 'Cas de démonstration'}
      />

      <main className={styles.main}>
        <section aria-labelledby="trend-title">
          <h1 id="trend-title" ref={titleRef} tabIndex={-1}>
            {signal.name}
          </h1>
          <p className={styles.subtitle}>{signal.hook}</p>
        </section>

        <section
          className={styles.metrics}
          aria-label="Indicateurs de tendance"
        >
          <article className={`${ui.card} ${styles.metric} ${styles.cycle}`}>
            <p className={ui.label}>Stade du cycle</p>
            <p className={ui.value}>{STAGE_LABEL[signal.stage]}</p>
            <div className={styles.cycleScale}>
              <div className={styles.cycleTrack} aria-hidden="true">
                {STAGE_ORDER.map((s, i) => (
                  <span
                    key={s}
                    className={styles.cycleDot}
                    data-active={i === stageIndex || undefined}
                  />
                ))}
              </div>
              <ol className={styles.cycleLabels} aria-label="Stades du cycle">
                {STAGE_ORDER.map((s, i) => (
                  <li
                    key={s}
                    data-active={i === stageIndex || undefined}
                    aria-current={i === stageIndex ? 'step' : undefined}
                  >
                    {STAGE_LABEL[s]}
                  </li>
                ))}
              </ol>
            </div>
          </article>
          <article className={`${ui.card} ${styles.metric}`}>
            <p className={ui.label}>Sources croisées</p>
            <p className={ui.value}>
              {types} type{types > 1 ? 's' : ''} de sources sur 3
            </p>
          </article>
          <article className={`${ui.card} ${styles.metric}`}>
            <p className={ui.label}>Délai goût vers parfum</p>
            <p
              className={`${ui.value} ${signal.gustoToPerfumeDelay ? '' : ui.pending}`}
            >
              {signal.gustoToPerfumeDelay ?? 'À confirmer'}
            </p>
          </article>
        </section>

        <div className={styles.contentGrid}>
          <section aria-labelledby="bridge-title" className={styles.minw}>
            <h2 id="bridge-title" className={styles.h2}>
              La passerelle
            </h2>
            <Passerelle signal={signal} />
          </section>

          <section aria-labelledby="sources-title" className={styles.minw}>
            <h2 id="sources-title" className={styles.h2}>
              Sources croisées
            </h2>
            <ul className={styles.sourceList}>
              {CORE_TYPES.map((t) => {
                const items = coreSources.filter((s) => s.type === t);
                if (!items.length) {
                  return (
                    <li key={t} className={`${ui.card} ${styles.sourceCard}`}>
                      <div>
                        <p className={ui.label}>{SOURCE_TYPE_LABEL[t]}</p>
                        <p className={styles.mutedText}>Aucune source</p>
                      </div>
                    </li>
                  );
                }
                return items.map((s, i) => (
                  <li
                    key={`${t}-${i}`}
                    className={`${ui.card} ${styles.sourceCard}`}
                  >
                    <div>
                      <p className={ui.label}>{SOURCE_TYPE_LABEL[t]}</p>
                      <p>{s.excerpt}</p>
                    </div>
                    <Badge kind={s.label === 'Fait' ? 'fait' : 'recit'}>
                      {labelText(s)}
                    </Badge>
                  </li>
                ));
              })}
            </ul>
            <p className={styles.note}>
              {signal.isSimulated
                ? 'Données simulées pour la démonstration.'
                : `Données de démonstration : ${outlets}.`}
            </p>
            <Link to={`/tendance/${signal.id}/sources`} className={ui.link}>
              Voir les sources
            </Link>
          </section>
        </div>
      </main>

      <aside className={styles.decisionBar} aria-label="Décision">
        <div className={styles.barInner}>
          <div className={styles.proposal}>
            {proposal ? (
              <>
                <p className={styles.proposalTitle}>
                  Proposition de Passerelle :{' '}
                  <strong>{proposal.verdict}</strong>
                </p>
                <p className={styles.justification}>
                  {proposal.justification} La décision reste la vôtre.
                </p>
                <p className={styles.proposalNote}>
                  {proposal.source === 'ia'
                    ? 'Analyse IA sur les sources de la fiche'
                    : 'Réponse de secours (IA indisponible)'}
                  <span className={styles.limits}>
                    {' : à confirmer, '}
                    {proposal.limites.charAt(0).toLowerCase() +
                      proposal.limites.slice(1)}
                  </span>
                </p>
              </>
            ) : (
              <p className={styles.proposalTitle} role="status">
                Analyse des sources en cours
              </p>
            )}
          </div>
          <div className={styles.decisionActions}>
            <div
              className={styles.buttons}
              role="group"
              aria-label="Votre décision"
            >
              {(['Suivre', 'Observer', 'Ignorer'] as Verdict[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`${ui.button} ${DECISION_CLASS[v]}`}
                  aria-pressed={decision === v}
                  onClick={() => decide(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className={styles.proposalNote} role="status" aria-live="polite">
              {decision
                ? justSaved
                  ? 'Décision enregistrée dans votre suivi.'
                  : `Votre décision : ${decision}.`
                : ' '}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
