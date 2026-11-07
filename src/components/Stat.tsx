import type { ReactNode } from 'react'
import { Card } from './Card'
import styles from './Stat.module.css'

interface StatProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  emphasis?: boolean
  /** Pulsante accanto all'etichetta (es. "Modifica") */
  action?: ReactNode
}

/** Riquadro con un numero chiave (media, obiettivo, ...) ben visibile. */
export function Stat({ label, value, hint, emphasis = false, action }: StatProps) {
  return (
    <Card as="div" className={emphasis ? `${styles.stat} ${styles.emphasis}` : styles.stat}>
      <div className={styles.top}>
        <p className={styles.label}>{label}</p>
        {action}
      </div>
      <p className={`${styles.value} num`}>{value}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </Card>
  )
}
