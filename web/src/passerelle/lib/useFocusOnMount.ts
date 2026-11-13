import { useEffect, useRef } from 'react';

/** Après une navigation, place le focus sur le titre de la page (annoncé par les lecteurs d'écran). */
export function useFocusOnMount<T extends HTMLElement>(key?: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [key]);
  return ref;
}
