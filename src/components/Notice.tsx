import { AlertTriangle, Info, X, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './Notice.module.css'

type Tone = 'info' | 'warn' | 'danger'

const ICONS = { info: Info, warn: AlertTriangle, danger: XCircle }

interface NoticeProps {
  tone?: Tone
  children: ReactNode
  onDismiss?: () => void
}

/** Avviso in evidenza (es. problemi di salvataggio). */
export function Notice({ tone = 'info', children, onDismiss }: NoticeProps) {
  const Icon = ICONS[tone]
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === 'info' ? 'status' : 'alert'}>
      <Icon size={18} className={styles.icon} aria-hidden="true" />
      <div className={styles.body}>{children}</div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Chiudi avviso"
          icon={<X size={16} aria-hidden="true" />}
          onClick={onDismiss}
        />
      )}
    </div>
  )
}
