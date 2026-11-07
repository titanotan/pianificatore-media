import { formatAverage } from '../../domain/format'
import type { GoalTone } from '../../domain/messages'
import { scalePosition } from '../../domain/planning'
import { MAX_GRADE, MIN_GRADE } from '../../domain/types'
import styles from './GoalBar.module.css'

interface GoalBarProps {
  current: number | null
  projected: number | null
  goal: number
  tone: GoalTone
}

const percent = (value: number | null) => `${(scalePosition(value) ?? 0) * 100}%`

/**
 * Barra su scala 18–30: riempita fino alla media prevista, con il segno della media attuale
 * e la linea dell'obiettivo (colorata secondo lo stato).
 */
export function GoalBar({ current, projected, goal, tone }: GoalBarProps) {
  // Vicino ai bordi l'etichetta dell'obiettivo si allinea verso l'interno per non uscire
  const goalPosition = scalePosition(goal) ?? 0
  const labelAlign = goalPosition > 0.85 ? 'end' : goalPosition < 0.15 ? 'start' : 'center'
  const description = [
    `Scala da ${MIN_GRADE} a ${MAX_GRADE}.`,
    current !== null && `Media attuale ${formatAverage(current)}.`,
    projected !== null && `Media prevista ${formatAverage(projected)}.`,
    `Obiettivo ${formatAverage(goal)}.`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      <div className={styles.track} role="img" aria-label={description}>
        <div className={styles.fill} style={{ width: percent(projected) }} />
        {current !== null && (
          <div className={styles.current} style={{ left: percent(current) }} aria-hidden="true" />
        )}
        <div
          className={`${styles.goal} ${styles[tone]}`}
          style={{ left: percent(goal) }}
          data-align={labelAlign}
          aria-hidden="true"
        >
          <span className={styles.goalLabel}>Obiettivo {formatAverage(goal)}</span>
        </div>
      </div>
      <div className={styles.scale} aria-hidden="true">
        <span>{MIN_GRADE}</span>
        <span>{(MIN_GRADE + MAX_GRADE) / 2}</span>
        <span>{MAX_GRADE}</span>
      </div>
      <ul className={styles.legend}>
        <li>
          <span className={styles.swatchCurrent} aria-hidden="true" />
          Attuale <strong className="num">{formatAverage(current)}</strong>
        </li>
        <li>
          <span className={styles.swatchProjected} aria-hidden="true" />
          Prevista <strong className="num">{formatAverage(projected)}</strong>
        </li>
        <li>
          <span className={`${styles.swatchGoal} ${styles[tone]}`} aria-hidden="true" />
          Obiettivo <strong className="num">{formatAverage(goal)}</strong>
        </li>
      </ul>
    </div>
  )
}
