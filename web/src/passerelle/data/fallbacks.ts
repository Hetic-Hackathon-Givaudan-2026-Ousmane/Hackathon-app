import type { Brief, Signal, VerdictAnswer } from './types.ts';
import {
  CORE_TYPES,
  labelText,
  SOURCE_TYPE_LABEL,
  sourceTypeCount,
} from './types.ts';

/**
 * Réponses de secours : construites uniquement à partir de la fiche,
 * sans aucun fait ajouté. Utilisées si l'IA est indisponible.
 */
export function fallbackVerdict(s: Signal): VerdictAnswer {
  return {
    verdict:
      sourceTypeCount(s) < 3 && s.verdict === 'Suivre' ? 'Observer' : s.verdict,
    justification: s.fallback.justification,
    limites: s.fallback.limites,
  };
}

export function fallbackBrief(s: Signal): Brief {
  if (s.fallback.brief) return s.fallback.brief;
  const missing = CORE_TYPES.filter(
    (t) => !s.sources.some((x) => x.type === t),
  ).map((t) => SOURCE_TYPE_LABEL[t].toLowerCase());
  const firstDated = s.events.find(
    (e): e is typeof e & { when: string } => e.when !== null,
  );
  return {
    pourquoi: s.fallback.justification,
    fenetre: firstDated
      ? `À confirmer. Premier repère de la frise : ${firstDated.when.toLowerCase()} (${firstDated.text.toLowerCase()}).`
      : 'À confirmer. Aucun repère daté dans la fiche.',
    reserve: [
      missing.length ? `Aucune source de type ${missing.join(', ')}.` : '',
      s.sources.some((x) => x.label === 'Récit')
        ? 'Une partie des sources sont des récits, pas des faits mesurés.'
        : '',
      'Délai goût vers parfum à confirmer.',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

export function briefToText(
  s: Signal,
  b: Brief,
  unverified: Set<number> = new Set(),
): string {
  return [
    `Brief Passerelle : ${s.name}`,
    '',
    'Tendance',
    s.name,
    '',
    'Pourquoi',
    b.pourquoi,
    '',
    "Fenêtre d'action",
    b.fenetre,
    '',
    'Réserve',
    b.reserve,
    '',
    'Sources',
    ...s.sources.map(
      (x, i) =>
        `- ${SOURCE_TYPE_LABEL[x.type]} : ${x.excerpt} (${x.outlet}, ${labelText(x)}${unverified.has(i) ? ', non vérifiée' : ''})`,
    ),
    ...(s.isSimulated
      ? ['', 'Données simulées : ce brief sert à la démonstration.']
      : []),
  ].join('\n');
}
