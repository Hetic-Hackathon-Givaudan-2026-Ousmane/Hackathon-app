import ui from './ui.module.css';

/** Pastille de fiabilité : vert pour un fait, orange pour un récit ou un point à confirmer. */
export function Badge({
  kind,
  children,
}: {
  kind: 'fait' | 'recit' | 'a-confirmer' | 'neutre';
  children?: string;
}) {
  const cls =
    kind === 'fait' ? ui.fact : kind === 'neutre' ? ui.neutral : ui.press;
  const text =
    children ??
    (kind === 'fait'
      ? 'Fait'
      : kind === 'recit'
        ? 'Récit de presse'
        : kind === 'a-confirmer'
          ? 'À confirmer'
          : '');
  return <span className={`${ui.badge} ${cls}`}>{text}</span>;
}
