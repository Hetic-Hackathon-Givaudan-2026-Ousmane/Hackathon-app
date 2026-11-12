import type { Verdict } from '../data/types.ts';

/** Pictogramme de l'anneau au sol : plein (Suivre), tirets (Observer), fin et gris (Ignorer). */
export function VerdictGlyph({
  verdict,
  size = 14,
}: {
  verdict: Verdict;
  size?: number;
}) {
  const s = {
    Suivre: { stroke: '#0b1215', w: 2.6, dash: undefined },
    Observer: { stroke: '#0b1215', w: 1.6, dash: '2.4 1.8' },
    Ignorer: { stroke: '#767676', w: 1.1, dash: undefined },
  }[verdict];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke={s.stroke}
        strokeWidth={s.w}
        strokeDasharray={s.dash}
      />
    </svg>
  );
}

export type FlowKind = 'grandit' | 'se-vide' | 'stable';

export function flowKind(flow: number): FlowKind {
  if (flow > 0.15) return 'grandit';
  if (flow < -0.15) return 'se-vide';
  return 'stable';
}

/** Version courte, sous le nom du stand. */
export const FLOW_SHORT: Record<FlowKind, string> = {
  grandit: 'Grandit',
  'se-vide': 'Se vide',
  stable: 'Stable',
};

export const FLOW_TEXT: Record<FlowKind, string> = {
  grandit: 'File qui grandit',
  'se-vide': 'File qui se vide',
  stable: 'File stable',
};

/** Pictogramme du flux : chevrons vers le haut (la file grandit), vers le bas (elle se vide), ou à plat. */
export function FlowGlyph({
  kind,
  size = 14,
}: {
  kind: FlowKind;
  size?: number;
}) {
  const path =
    kind === 'grandit'
      ? 'M3 10 L8 5 L13 10 M3 14 L8 9 L13 14'
      : kind === 'se-vide'
        ? 'M3 2 L8 7 L13 2 M3 6 L8 11 L13 6'
        : 'M2 6 H14 M2 10 H14';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <path
        d={path}
        fill="none"
        stroke="#0b1215"
        strokeWidth={1.6}
        strokeLinecap="square"
      />
    </svg>
  );
}
