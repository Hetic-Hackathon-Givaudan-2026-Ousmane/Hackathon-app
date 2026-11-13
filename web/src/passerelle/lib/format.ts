const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** "2023-12" donne "déc. 2023", "2025-10-07" donne "07/10/2025", null donne "Date à confirmer". */
export function formatDate(date: string | null): string {
  if (!date) return 'Date à confirmer';
  const [y, m, d] = date.split('-');
  if (d) return `${d}/${m}/${y}`;
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function flowPhrase(flow: number): string {
  if (flow > 0.15) return 'Plus d’arrivées que de départs';
  if (flow < -0.15) return 'Plus de départs que d’arrivées';
  return 'Arrivées et départs équilibrés';
}

export function intensityPhrase(i: number): string {
  if (i >= 0.75) return 'Signal fort';
  if (i >= 0.45) return 'Signal moyen';
  return 'Signal faible';
}
