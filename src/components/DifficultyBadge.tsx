import { DIFFICULTY_LABELS, type Difficulty } from '../domain/types'
import styles from './DifficultyBadge.module.css'

const LEVEL: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 }

/** Difficoltà come pallini pieni (1–3) più etichetta. */
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const level = LEVEL[difficulty]
  return (
    <span className={styles.badge} data-level={level}>
      <span className={styles.dots} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= level ? styles.on : styles.off} />
        ))}
      </span>
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  )
}
