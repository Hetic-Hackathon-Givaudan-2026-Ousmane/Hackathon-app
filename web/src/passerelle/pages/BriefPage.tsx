import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { briefToText } from '../data/fallbacks.ts';
import { getSignal } from '../data/signals.ts';
import {
  labelText,
  SOURCE_TYPE_LABEL,
  type Brief,
  type BriefResponse,
} from '../data/types.ts';
import { fetchBrief } from '../lib/api.ts';
import { statusesFor, useJournal } from '../lib/journal.ts';
import { useFocusOnMount } from '../lib/useFocusOnMount.ts';
import { AppHeader } from '../ui/AppHeader.tsx';
import { Badge } from '../ui/Badge.tsx';
import ui from '../ui/ui.module.css';
import styles from './pages.module.css';

/** Copie sans l'API Clipboard (navigateurs intégrés, contextes non sécurisés). */
function legacyCopy(value: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok: boolean;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

const FIELDS: { key: keyof Brief; label: string }[] = [
  { key: 'pourquoi', label: 'Pourquoi' },
  { key: 'fenetre', label: 'Fenêtre d’action' },
  { key: 'reserve', label: 'Réserve' },
];

export default function BriefPage() {
  const { id } = useParams();
  const signal = getSignal(id);
  const j = useJournal();
  const [response, setResponse] = useState<BriefResponse | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [editing, setEditing] = useState(false);
  const [recipients, setRecipients] = useState({ taste: true, perfume: true });
  const [message, setMessage] = useState('');
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'error'>('idle');
  const titleRef = useFocusOnMount<HTMLHeadingElement>(id);
  const confirmRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!signal) return;
    let live = true;
    fetchBrief(signal).then((r) => {
      if (!live) return;
      setResponse(r);
      setBrief(r.brief);
    });
    return () => {
      live = false;
    };
  }, [signal]);

  if (!signal) return <Navigate to="/" replace />;

  const statuses = statusesFor(j, signal.id, signal.sources.length);
  const unverified = new Set(
    statuses.map((s, i) => (s === 'verifiee' ? -1 : i)).filter((i) => i >= 0),
  );
  const hasRecipient = recipients.taste || recipients.perfume;
  const teams =
    recipients.taste && recipients.perfume
      ? 'équipes goût et parfum'
      : recipients.taste
        ? 'équipe goût'
        : 'équipe parfum';

  const fullText = () => {
    if (!brief) return '';
    const body = briefToText(signal, brief, unverified);
    return message.trim() ? `${message.trim()}\n\n${body}` : body;
  };

  const prepareEmail = () => {
    const subject = `Brief Passerelle : ${signal.name}`;
    const body = `À l’attention de l’${teams}.\n\n${fullText()}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
    // Le formulaire disparaît : le focus va sur la confirmation.
    window.setTimeout(() => confirmRef.current?.focus(), 0);
  };

  const copy = async () => {
    const text = fullText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied('ok');
    } catch {
      setCopied(legacyCopy(text) ? 'ok' : 'error');
    }
  };

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
        <section className={styles.heading} aria-labelledby="brief-page-title">
          <div>
            <h1 id="brief-page-title" ref={titleRef} tabIndex={-1}>
              Brief pour les équipes goût et parfum
            </h1>
            <p className={styles.subtitle}>
              Rédigé à partir du verdict et des sources. Relisez avant
              d’envoyer.
            </p>
          </div>
        </section>

        <div className={styles.briefGrid}>
          <section
            className={styles.briefCard}
            aria-labelledby="one-page-brief"
          >
            <div className={styles.cardHeading}>
              <div className={styles.cardHeadingMeta}>
                <h2 id="one-page-brief">Brief d’une page</h2>
                <p className={ui.label}>
                  Brouillon.{' '}
                  {response
                    ? response.source === 'ia'
                      ? 'Rédigé par l’IA à partir de la fiche, à relire.'
                      : 'Réponse de secours (IA indisponible), rédigée à partir de la fiche.'
                    : 'Rédaction en cours.'}
                </p>
              </div>
              <button
                type="button"
                className={ui.button}
                disabled={!brief}
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? 'Terminer' : 'Modifier'}
              </button>
            </div>

            <div>
              <div className={styles.briefBlock}>
                <h3>Tendance</h3>
                <p>{signal.name}</p>
              </div>
              {FIELDS.map(({ key, label }) => (
                <div key={key} className={styles.briefBlock}>
                  <h3 id={`brief-${key}`}>{label}</h3>
                  {!brief ? (
                    <p className={styles.mutedText} role="status">
                      Rédaction en cours
                    </p>
                  ) : editing ? (
                    <textarea
                      className={styles.editor}
                      aria-labelledby={`brief-${key}`}
                      value={brief[key]}
                      rows={3}
                      onChange={(e) =>
                        setBrief({ ...brief, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <p>{brief[key]}</p>
                  )}
                </div>
              ))}
              <div className={styles.briefBlock}>
                <h3>Sources</h3>
                <ul className={styles.briefSources}>
                  {signal.sources.map((s, i) => (
                    <li key={i}>
                      <span>{SOURCE_TYPE_LABEL[s.type]}</span>
                      <Badge kind={s.label === 'Fait' ? 'fait' : 'recit'}>
                        {`${labelText(s)}${unverified.has(i) ? ', non vérifiée' : ''}`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {prepared ? (
            <section
              className={`${styles.sendCard} ${styles.confirmation}`}
              aria-live="polite"
            >
              <h2 ref={confirmRef} tabIndex={-1}>
                E-mail préparé pour l’{teams}
              </h2>
              <p className={styles.mutedText}>
                Votre messagerie s’est ouverte avec le brief. Ajoutez les
                adresses des destinataires, puis envoyez.
              </p>
              <button
                type="button"
                className={ui.link}
                onClick={() => setPrepared(false)}
              >
                Modifier l’envoi
              </button>
              <Link to={`/tendance/${signal.id}`} className={ui.link}>
                Retour à la fiche tendance
              </Link>
            </section>
          ) : (
            <section className={styles.sendCard} aria-labelledby="send-title">
              <h2 id="send-title">Envoi</h2>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Destinataires</legend>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={recipients.taste}
                    onChange={(e) =>
                      setRecipients((r) => ({ ...r, taste: e.target.checked }))
                    }
                  />
                  <span>Équipe goût</span>
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={recipients.perfume}
                    onChange={(e) =>
                      setRecipients((r) => ({
                        ...r,
                        perfume: e.target.checked,
                      }))
                    }
                  />
                  <span>Équipe parfum</span>
                </label>
              </fieldset>
              <label>
                <span className={styles.fieldLabel}>
                  Message d’accompagnement (facultatif)
                </span>
                <textarea
                  className={styles.textarea}
                  value={message}
                  rows={6}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              <div className={styles.sendActions}>
                <button
                  type="button"
                  className={`${ui.button} ${ui.primary}`}
                  disabled={!hasRecipient || !brief}
                  onClick={prepareEmail}
                >
                  Préparer l’e-mail
                </button>
                <button
                  type="button"
                  className={ui.button}
                  disabled={!brief}
                  onClick={copy}
                >
                  Copier le brief
                </button>
                <p className={ui.label} role="status" aria-live="polite">
                  {!hasRecipient
                    ? 'Choisissez au moins une équipe.'
                    : copied === 'ok'
                      ? 'Brief copié dans le presse-papiers.'
                      : copied === 'error'
                        ? 'Copie bloquée par le navigateur : utilisez Préparer l’e-mail.'
                        : ' '}
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
