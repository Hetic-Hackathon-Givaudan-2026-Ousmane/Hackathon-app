/** Les pancartes DOM s'enregistrent ici ; la scène écrit leur position à chaque image. */
export const labelEls = new Map<string, HTMLElement>();
/** Traits de rappel reliant une pancarte déplacée à son stand. */
export const leaderEls = new Map<string, HTMLElement>();
/** Couche des pancartes (attribut data-dense quand les stands sont serrés à l'écran). */
export const labelLayer: { el: HTMLElement | null } = { el: null };
