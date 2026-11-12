import { Link, NavLink } from 'react-router';
import styles from './AppHeader.module.css';

interface Props {
  /** Lien de retour vers une fiche (pages Sources et Brief) */
  back?: { to: string; label: string };
  /** Étiquette de droite : cas réel de démonstration ou données simulées */
  tag?: string;
  /** En-tête posé sur la scène 3D */
  overlay?: boolean;
}

export function AppHeader({ back, tag, overlay }: Props) {
  return (
    <header className={styles.bar} data-overlay={overlay || undefined}>
      <div className={styles.start}>
        <Link
          to="/"
          className={styles.brand}
          aria-label="Passerelle par Givaudan, retour à la place"
        >
          Passerelle <span>par Givaudan</span>
        </Link>
        {back ? (
          <Link to={back.to} className={styles.back}>
            {back.label}
          </Link>
        ) : null}
      </div>
      <nav className={styles.nav} aria-label="Navigation principale">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          La place
        </NavLink>
        <NavLink
          to="/tableau-de-bord"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          Tableau de bord
        </NavLink>
        {tag ? <span className={styles.tag}>{tag}</span> : null}
      </nav>
    </header>
  );
}
