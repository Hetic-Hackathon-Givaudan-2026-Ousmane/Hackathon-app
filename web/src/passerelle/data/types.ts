export type SourceType = 'social' | 'search' | 'press' | 'perfume';
export type SourceLabel = 'Fait' | 'Récit';
export type Stage = 'faible' | 'hausse' | 'pic' | 'retombee';
export type Verdict = 'Suivre' | 'Observer' | 'Ignorer';
export type Lane = 'gout' | 'parfum';
/** Fiabilité d'un point de la frise : un fait sourcé, un récit, ou un repère sans source. */
export type Reliability = 'fait' | 'recit' | 'a-confirmer';

export interface Source {
  type: SourceType;
  label: SourceLabel;
  /** AAAA-MM ou AAAA-MM-JJ ; null si la date reste à confirmer */
  date: string | null;
  /** Ce que dit la source, en une ligne */
  excerpt: string;
  /** Publication et date de publication, telles que fournies */
  outlet: string;
  /** Résumé à relire par l'analyste */
  summary: string;
  /** Vide si aucune URL n'a été fournie : aucun lien n'est alors affiché */
  url: string;
}

export interface TimelineEvent {
  lane: Lane;
  /** Libellé de date affiché (ex. "Déc. 2023"), ou null si à confirmer */
  when: string | null;
  text: string;
  reliability: Reliability;
}

export interface Signal {
  id: string;
  name: string;
  hook: string;
  family: string;
  /** Note goût présentée sur le stand */
  ingredient: string;
  stage: Stage;
  verdict: Verdict;
  sources: Source[];
  events: TimelineEvent[];
  /** 0 à 1 : longueur de la file */
  signalIntensity: number;
  /** -1 à 1 : arrivées contre départs */
  flow: number;
  /** Texte du délai goût vers parfum, ou null tant qu'il n'est pas prouvé */
  gustoToPerfumeDelay: string | null;
  isSimulated: boolean;
  /** Textes de secours relus, utilisés si l'IA est indisponible */
  fallback: {
    justification: string;
    limites: string;
    brief?: { pourquoi: string; fenetre: string; reserve: string };
  };
}

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  social: 'Réseaux sociaux',
  search: 'Recherches en ligne',
  press: 'Presse et ventes',
  perfume: 'Lien avec le parfum',
};

export const STAGE_LABEL: Record<Stage, string> = {
  faible: 'Signal faible',
  hausse: 'En hausse',
  pic: 'Pic',
  retombee: 'Retombée',
};

export const STAGE_ORDER: Stage[] = ['faible', 'hausse', 'pic', 'retombee'];

/** Les trois types qui fondent un verdict : réseaux sociaux, recherches, presse et ventes. */
export const CORE_TYPES: SourceType[] = ['social', 'search', 'press'];

/** Libellé de pastille : "Récit de presse" pour la presse, "Récit" ailleurs. */
export function labelText(s: Pick<Source, 'label' | 'type'>): string {
  if (s.label === 'Fait') return 'Fait';
  return s.type === 'press' || s.type === 'perfume'
    ? 'Récit de presse'
    : 'Récit';
}

export function sourceTypeCount(s: Pick<Signal, 'sources'>): number {
  return new Set(
    s.sources.map((x) => x.type).filter((t) => CORE_TYPES.includes(t)),
  ).size;
}

/* Contrats de l'API IA, partagés entre le navigateur et le serveur. */
export type AnswerSource = 'ia' | 'secours';

export interface VerdictAnswer {
  verdict: Verdict;
  justification: string;
  limites: string;
}

export interface VerdictResponse extends VerdictAnswer {
  source: AnswerSource;
  model?: string;
}

export interface Brief {
  pourquoi: string;
  fenetre: string;
  reserve: string;
}

export interface BriefResponse {
  brief: Brief;
  source: AnswerSource;
  model?: string;
}
