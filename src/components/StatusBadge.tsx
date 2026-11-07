import type { ReactNode } from 'react'
import type { GoalTone } from '../domain/messages'
import styles from './StatusBadge.module.css'

/** Etichetta colorata con lo stato dell'obiettivo (verde, ambra, rosso, blu). */
export function StatusBadge({ tone, children }: { tone: GoalTone; children: ReactNode }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  )
}
