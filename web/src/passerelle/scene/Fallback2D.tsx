import { signals } from '../data/signals.ts';
import { AROMA_COLOR } from './Ingredients.tsx';
import { kiosks } from './layout.ts';
import styles from './Fallback2D.module.css';

const RING = {
  Suivre: { stroke: '#0b1215', width: 0.16, dash: undefined },
  Observer: { stroke: '#0b1215', width: 0.09, dash: '0.35 0.25' },
  Ignorer: { stroke: '#767676', width: 0.05, dash: undefined },
} as const;

/** Vue 2D de repli si WebGL est indisponible : même place, vue strictement de dessus. */
export default function Fallback2D({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const xs = kiosks.flatMap((k) => k.slots.map((s) => s.x));
  const zs = kiosks.flatMap((k) => [
    k.position.z - 3,
    ...k.slots.map((s) => s.z),
  ]);
  const minX = Math.min(...xs) - 3;
  const maxX = Math.max(...xs) + 3;
  const minZ = Math.min(...zs) - 1;
  const maxZ = Math.max(...zs) + 1;
  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`}
        role="img"
        aria-label="Vue de dessus simplifiée : huit stands et leurs files"
      >
        {kiosks.map((k, i) => {
          const s = signals[i];
          const ring = RING[s.verdict];
          return (
            <g key={k.id}>
              <circle
                cx={k.position.x}
                cy={k.position.z}
                r={2.1}
                fill="none"
                stroke={ring.stroke}
                strokeWidth={ring.width}
                strokeDasharray={ring.dash}
              />
              <rect
                x={k.position.x - 1.2}
                y={k.position.z - 0.7}
                width={2.4}
                height={1.4}
                fill={AROMA_COLOR[s.ingredient]}
              />

              {k.slots.slice(0, k.target).map((p, j) => (
                <circle key={j} cx={p.x} cy={p.z} r={0.15} fill="#0b1215" />
              ))}
            </g>
          );
        })}
      </svg>
      <ul className={styles.list}>
        {signals.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={styles.item}
              onClick={() => onSelect(s.id)}
            >
              {s.name}
              <span>Proposition : {s.verdict}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
