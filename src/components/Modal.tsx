import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import styles from './Modal.module.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children: ReactNode
  size?: 'sm' | 'md'
}

/**
 * Finestra modale basata su <dialog> nativo: il browser gestisce focus, tasto Esc
 * e blocco del resto della pagina. Il contenuto viene creato solo quando è aperta,
 * così i moduli ripartono puliti a ogni apertura.
 */
export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Il browser metterebbe il focus sul primo elemento (la X): lo spostiamo dove serve
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${styles[size]}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Esc: chiudiamo tramite lo stato React, non direttamente
        event.preventDefault()
        onClose()
      }}
    >
      {open && (
        <div className={styles.panel}>
          <header className={styles.header}>
            <div>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description && <p className={styles.description}>{description}</p>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Chiudi"
              icon={<X size={18} aria-hidden="true" />}
              onClick={onClose}
            />
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}

/** Riga di pulsanti in fondo a una finestra modale. */
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
