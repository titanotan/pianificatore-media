import type { ReactNode } from 'react'
import { Card } from './Card'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  children: ReactNode
  action?: ReactNode
}

/** Messaggio quando una sezione non ha ancora dati, con l'azione per iniziare. */
export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <Card className={styles.empty}>
      <div className={styles.icon} aria-hidden="true">
        {icon}
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.text}>{children}</p>
      {action && <div className={styles.action}>{action}</div>}
    </Card>
  )
}
